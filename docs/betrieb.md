# BITS-Portal – Betriebshandbuch

Stand: 9.11.2026 (PoC). Gilt für den Betrieb auf einem internen Server mit Docker Compose.
Konzept und Architektur: [konzept.md](konzept.md), Entwicklung: [README](../README.md).

## 1. Überblick

| Teil                | Aufgabe                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Dienst `app`        | Next.js-Server (Image aus dem `Dockerfile`), Port 3000 im Container                      |
| Dienst `postgres`   | Postgres 17, Volume `bits-portal_postgres-data`, nur im internen Compose-Netz            |
| Dienst `migrate`    | Einmaliger Job: wendet die Drizzle-Migrationen an, bevor `app` startet                   |
| Reverse-Proxy (TLS) | Bestehender Reverse-Proxy oder Webserver mit internem Zertifikat (nicht Teil des Stacks) |

Netzverbindungen:

| Richtung  | Von → Nach                                   | Wozu                                               |
| --------- | -------------------------------------------- | -------------------------------------------------- |
| Eingehend | Browser → Reverse-Proxy (443) → `app` (3000) | Portal und Admin-Bereich                           |
| Ausgehend | `app` → `ktso.leanix.net:443`                | Katalog-Sync (Token-Abruf und GraphQL), ggf. Proxy |
| Ausgehend | `app` → SAML-IdP                             | nur, falls SAML eingerichtet ist (Metadaten)       |
| Build     | Build-Server → Docker-Registry, npm-Registry | Basis-Image `node:24-alpine`, pnpm und Pakete      |

Zur Laufzeit lädt das Portal nichts von fremden Hosts: Schrift und Logo liegen im Image, Seiten
werden aus dem gespeicherten Katalog-Snapshot ausgeliefert. Keine Benutzeranfrage geht an LeanIX.

## 2. Erstinstallation

```bash
git clone <repo> bits-portal && cd bits-portal
cp .env.prod.example .env.prod
chmod 600 .env.prod        # enthält Secrets
# .env.prod ausfüllen: APP_URL, POSTGRES_PASSWORD, BETTER_AUTH_SECRET, LEANIX_API_TOKEN, …
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f app
```

Pflichtwerte in `.env.prod` (fehlt einer, bricht Compose mit einer Meldung ab):

| Variable             | Inhalt                                                                       |
| -------------------- | ---------------------------------------------------------------------------- |
| `APP_URL`            | Adresse im Browser, z. B. `https://bits.intra.so.ch` (wird ins Image gebaut) |
| `POSTGRES_PASSWORD`  | `openssl rand -hex 24`                                                       |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (signiert Sitzungen; Änderung meldet alle ab)      |
| `LEANIX_API_TOKEN`   | API-Token des technischen LeanIX-Benutzers (Kapitel 6)                       |

Alle übrigen Werte haben Standardwerte; die Bedeutung steht in `.env.prod.example` und in der
Konfigurationstabelle im [README](../README.md#konfiguration). `--env-file` dient nur Compose;
in den Container gelangen ausschliesslich die Variablen, die `docker-compose.prod.yml` unter
`app.environment` aufführt.

Nach dem Start im Log prüfen:

```
[catalog] Sync mit https://ktso.leanix.net in 5 s, danach alle 15 min
[catalog] Sync (startup) success in 1234 ms, 7 Leistungen
```

Erscheint stattdessen `[catalog] WARNUNG: Kein LEANIX_API_TOKEN gesetzt …` oder
`[catalog] Demo-Modus: kein Sync mit LeanIX`, erreicht der Token den Container nicht.

**Erster Admin:** `https://<APP_URL>/setup` öffnen und das Admin-Konto anlegen. Die Seite ist
nur erreichbar, solange es noch keinen Admin gibt. Danach erfolgt die Anmeldung über `/sign-in`
(Link «Anmelden» in der Fusszeile).

**Demo-Installation** (Vorführung ohne LeanIX): `CATALOG_SOURCE=demo` und als
`LEANIX_API_TOKEN` einen beliebigen Wert setzen. Das Portal zeigt dann den mitgelieferten
Testdatensatz (`apps/web/data/demo-catalog.json`) und synchronisiert nicht.

## 3. TLS und Reverse-Proxy

Der App-Container spricht nur HTTP. Er lauscht auf dem Host an `APP_BIND:APP_PORT` (Standard
`127.0.0.1:3000`); TLS terminiert ein vorgelagerter Reverse-Proxy. `APP_URL` muss die Adresse
sein, die im Browser steht (mit `https://`, damit Sitzungs-Cookies als `Secure` gesetzt werden).

**Variante A – bestehender Reverse-Proxy oder Webserver auf dem Host (Standard).** Zertifikat
der internen PKI. Beispiel nginx:

```nginx
server {
  listen 443 ssl;
  server_name bits.intra.so.ch;
  ssl_certificate     /etc/ssl/certs/bits.intra.so.ch.crt;
  ssl_certificate_key /etc/ssl/private/bits.intra.so.ch.key;
  add_header Strict-Transport-Security "max-age=31536000" always;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    # Client-IP überschreiben, nicht anhängen
    proxy_set_header X-Forwarded-For $remote_addr;
  }
}
```

Steht der Reverse-Proxy auf einem anderen Server, `APP_BIND` auf die interne Adresse dieses
Servers setzen und den Port per Firewall nur für den Reverse-Proxy öffnen.

**Variante B – bestehender `nginxproxy/nginx-proxy` auf demselben Docker-Host.** Zusätzlich
`docker-compose.nginx-proxy.yml` verwenden und `APP_DOMAIN` (Hostname aus `APP_URL`) sowie
`PROXY_NETWORK` setzen:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.nginx-proxy.yml \
  --env-file .env.prod up -d --build
```

Das interne Zertifikat im Zertifikatsordner des nginx-proxy ablegen:
`/etc/nginx/certs/<APP_DOMAIN>.crt` und `/etc/nginx/certs/<APP_DOMAIN>.key`. nginx-proxy setzt
dann auch HSTS. `LETSENCRYPT_HOST` bleibt leer: Let's Encrypt (acme-companion, HTTP-01) braucht
einen öffentlich im DNS eingetragenen und aus dem Internet erreichbaren Host und funktioniert
für einen internen Server nicht.

**Sicherheits-Header:** Die App setzt selbst Content-Security-Policy (nur eigene Quellen,
`frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy` und `Permissions-Policy` (`apps/web/next.config.ts`). HSTS setzt der
TLS-Proxy (Variante A: Zeile `add_header` oben).

## 4. Build ohne Internet

Der Image-Build braucht das Basis-Image (`node:24-alpine`, Docker Hub) und eine npm-Registry
(pnpm über corepack und alle Pakete). Auf einem internen Build-Server in `.env.prod`:

```bash
NODE_IMAGE=registry.intra.so.ch/library/node:24-alpine
NPM_REGISTRY=https://npm.intra.so.ch/repository/npm   # ohne abschliessenden Schrägstrich
POSTGRES_IMAGE=registry.intra.so.ch/library/postgres:17-alpine
```

Ein Proxy für den Build kommt aus der Docker-Client-Konfiguration (`~/.docker/config.json`,
Abschnitt `proxies`) oder als Build-Arg:
`docker compose … build --build-arg HTTPS_PROXY=http://proxy:8080`.

**Alternative: Image in der CI bauen** und in eine interne Registry schieben; der Server zieht
nur noch Images:

```bash
docker build --build-arg NEXT_PUBLIC_APP_URL=https://bits.intra.so.ch -t registry.intra.so.ch/bits-portal:1.0.0 .
docker build --target migrate -t registry.intra.so.ch/bits-portal-migrate:1.0.0 .
```

Auf dem Server eine `docker-compose.override.yml` mit `image:` je Dienst
(`app: image: registry.intra.so.ch/bits-portal:1.0.0`, `migrate: image: …-migrate:1.0.0`)
ablegen, mit `-f docker-compose.override.yml` ergänzen und
`pull` sowie `up -d --no-build` statt `up -d --build` verwenden. `NEXT_PUBLIC_APP_URL` wird beim
Build ins Bundle eingesetzt: pro Portal-Adresse ein eigenes Image bauen.

Nach jedem Image-Build kurz prüfen, ob das Logo ausgeliefert wird (`public/` im Image):

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/brand/kanton-solothurn-logo.svg   # 200
```

## 5. Aktualisieren, Migrationen, Health-Check

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Compose baut neu, führt `migrate` aus und ersetzt dann `app` (laufende Anfragen werden bis zu
30 s abgeschlossen). Migrationen von Hand: `docker compose … run --rm migrate`.

Nur Werte in `.env.prod` geändert (z. B. Token, Sync-Intervall)? Dann genügt
`docker compose … up -d app`; Compose erstellt den Container mit der neuen Konfiguration neu.
Ausnahme `APP_URL`: Sie steckt im Bundle, also mit `--build`.

| Prüfung                                 | Zweck                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /rpc/health/check`                 | Liveness: Server antwortet (HTTP 200). Nutzt auch der Docker-`HEALTHCHECK`.                            |
| `GET /rpc/catalog/status`               | Katalog: `available` (Snapshot geladen), `source` (`leanix`/`demo`), `generatedAt`, `stale` (veraltet) |
| `/admin/catalog` (angemeldet als Admin) | Sync-Status, letzte Läufe, «Jetzt synchronisieren», Datenqualitätsbericht mit Links in die Fact Sheets |

Für ein Monitoring eignet sich `/rpc/catalog/status`: Alarm bei `available: false`, bei
`source: "demo"` in Produktion oder bei `stale: true` (länger als `CATALOG_STALE_AFTER_HOURS`
kein erfolgreicher Sync, z. B. weil der Token abgelaufen ist).

**Logs:** `docker compose … logs app`. Alle Meldungen des Katalogs beginnen mit `[catalog]`:

| Meldung                                      | Bedeutung                                                           |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `Sync mit … in 5 s, danach alle 15 min`      | Scheduler gestartet (LeanIX-Modus)                                  |
| `Sync (startup\|schedule\|manual) success …` | Lauf erfolgreich, neuer Stand übernommen                            |
| `Sync (…) rejected …` / `failed …`           | Stand abgelehnt (Plausibilisierung) bzw. Fehler; alter Stand bleibt |
| `WARNUNG: Kein LEANIX_API_TOKEN gesetzt …`   | Produktion ohne Token: Demo-Modus, kein Sync                        |
| `Demo-Modus: kein Sync mit LeanIX`           | Demo-Modus aktiv                                                    |

## 6. LeanIX-Token

Der Sync nutzt den API-Token eines **technischen Benutzers** in LeanIX
(Administration → Technical Users):

- Workspace-Rolle **Viewer** (nur lesen). Heute ist der Benutzer _Member_ (Konzept, Kapitel 2.5).
- **Ablaufdatum** setzen (z. B. 12 Monate) und den Termin im Betriebskalender eintragen.
- Token nur in `.env.prod` (Rechte 600) bzw. im Secret-Speicher des Betriebs, nie im Repo und
  nie im Browser. Die App gibt ihn in keinem Log und keiner Antwort aus.

**Rotation:**

1. In LeanIX für den technischen Benutzer einen neuen Token erzeugen (Ablaufdatum setzen).
2. `LEANIX_API_TOKEN` in `.env.prod` ersetzen.
3. `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d app`
4. In `/admin/catalog` «Jetzt synchronisieren» auslösen und prüfen, dass der Lauf erfolgreich ist.
5. Den alten Token in LeanIX widerrufen.

Läuft ein Token ab, schlagen die Syncs fehl; das Portal zeigt weiter den letzten gültigen Stand.
Nach `CATALOG_STALE_AFTER_HOURS` meldet der Admin-Bereich den Katalog als veraltet.

## 7. Ausgehender Proxy zu ktso.leanix.net

Der Container muss `https://ktso.leanix.net` erreichen (Freigabe in Firewall bzw. Proxy,
Konzept Kapitel 10, offene Frage 6). Braucht es einen Proxy, in `.env.prod`:

```bash
HTTPS_PROXY=http://proxy.intra.so.ch:8080
NO_PROXY=localhost,127.0.0.1,postgres,.intra.so.ch
```

Das Image setzt `NODE_USE_ENV_PROXY=1`; erst damit beachtet Node 24 diese Variablen. In
`NO_PROXY` `localhost`, `127.0.0.1` und `postgres` behalten und interne Ziele (z. B. den
SAML-IdP) ergänzen. Test aus dem Container:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec app \
  node -e "fetch('https://ktso.leanix.net').then(r => console.log(r.status))"
```

## 8. Datensicherung

Postgres enthält Benutzerkonten, Sitzungen, 2FA-Geheimnisse, SAML-Konfiguration,
App-Einstellungen sowie Katalog-Snapshots und Sync-Protokoll. Der Katalog lässt sich aus LeanIX
neu laden, Konten und SAML-Konfiguration nicht. Tägliche Sicherung, z. B.:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  pg_dump -U bits -d bits -Fc > backup/bits-$(date +%F).dump
```

Wiederherstellen (App vorher stoppen):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod stop app
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  pg_restore -U bits -d bits --clean --if-exists < backup/bits-2026-11-09.dump
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d app
```

`BETTER_AUTH_SECRET` und `.env.prod` gehören ebenfalls in die Sicherung (Secret-Speicher), sonst
lassen sich 2FA-Geheimnisse nach einer Wiederherstellung nicht mehr lesen.

## 9. Admin-Bereich

| Seite             | Inhalt                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| `/setup`          | Ersten Admin anlegen (nur solange es keinen gibt)                                    |
| `/sign-in`        | Anmeldung mit Passwort oder SAML                                                     |
| `/admin/catalog`  | Sync-Status, letzte Läufe, «Jetzt synchronisieren», Datenqualitätsbericht            |
| `/admin/users`    | Passwort-Benutzer anlegen, Adminrechte vergeben und entziehen                        |
| `/admin/security` | Zwei-Faktor-Authentisierung (TOTP) für Admins mit Passwort verlangen (Standard: aus) |
| `/admin/saml`     | SAML-Identity-Provider (z. B. Entra ID) hinzufügen                                   |

**SAML einrichten:** In `/admin/saml` einen Provider anlegen (Entity-ID des IdP, SSO-URL,
Signaturzertifikat oder IdP-Metadaten). Die Seite zeigt danach die **ACS-URL** und die URL der
**SP-Metadaten**; beide in der Enterprise-App des IdP eintragen. SAML-Benutzer erhalten beim
ersten Login die Rolle «Benutzer»; Adminrechte vergibt ein Admin in `/admin/users`. Nach
Änderungen an den Sicherheits-Headern oder am Reverse-Proxy den SAML-Login einmal mit dem
echten IdP testen.

## 10. Logo

Das Portal verwendet `apps/web/public/brand/kanton-solothurn-logo.svg` (Herkunft und Prüfung:
[branding.md](branding.md), Abruf mit `node scripts/fetch-logo.mjs`). Für den Produktivbetrieb
die Originaldatei beim Kompetenzzentrum für Publikationsmedien beziehen, unter demselben
Dateinamen ablegen und das Image neu bauen. Der Build kopiert `public/` ins Image (Kapitel 4,
Prüfung mit `curl`).
