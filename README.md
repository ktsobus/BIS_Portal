# BITS-Portal

Kantonsinternes Serviceportal für die Business-IT-Services des AIO (Kanton Solothurn).
Datenquelle ist SAP LeanIX (`https://ktso.leanix.net`); angezeigt werden Leistungen im Kanal
«Business IT-Servicekatalog», gruppiert nach Leistungskategorie. Der Katalog ist ohne Anmeldung
erreichbar; der Admin-Bereich (`/admin`) zeigt Sync-Status und Datenqualität.

- **[Analyse und Umsetzungsplan](docs/konzept.md)** – Datenmodell, Architektur, Caching, Design, offene Fragen
- **[Betriebshandbuch](docs/betrieb.md)** – Deployment, TLS, Token-Rotation, Proxy, Backup, Admin
- **[Branding](docs/branding.md)** – Herkunft und Prüfung des Logos
- **[Discovery-Skript](scripts/leanix-discovery.mjs)** – liest das LeanIX-Datenmodell aus (nur lesend)

Techstack: [Laeri/dev-template](https://github.com/Laeri/dev-template) (pnpm, Turborepo,
Next.js 16, oRPC, TanStack Query, Zod 4, better-auth, Drizzle + Postgres) ·
Oberfläche: [tasteskill 2.5.1](https://github.com/Leonxlnx/taste-skill) (Kit in `apps/web/public/assets`),
Farben und Logo aus dem [CD-Manual Kanton Solothurn](https://github.com/ktsobus/CD-Manual-Kanton-Solothurn) ·
Regeln für Code und Agenten: [AGENTS.md](AGENTS.md)

## Entwicklung

Voraussetzungen: Node 22 oder neuer (das Image nutzt Node 24), pnpm 11 über corepack, Docker
für die lokale Datenbank.

```bash
corepack enable                          # pnpm-Version aus package.json
pnpm install
docker compose up -d                     # Postgres für die Entwicklung
cp apps/web/.env.example apps/web/.env   # BETTER_AUTH_SECRET setzen: openssl rand -base64 32
pnpm db:migrate
pnpm dev                                 # http://localhost:3000
```

Den ersten Admin unter <http://localhost:3000/setup> anlegen (nur möglich, solange es keinen
Admin gibt). Danach erfolgt die Anmeldung über `/sign-in` (Link «Als Admin anmelden» in der Fusszeile).

## Demo-Modus und LeanIX-Mock

Ohne `LEANIX_API_TOKEN` (oder mit `CATALOG_SOURCE=demo`) zeigt das Portal den mitgelieferten
Snapshot `apps/web/data/demo-catalog.json` und synchronisiert nicht. Er wird mit dem echten
Mapper aus den Fixtures (`apps/web/lib/catalog/__fixtures__/`) erzeugt:

```bash
pnpm --filter web catalog:demo
```

Für den Sync ohne Zugang zu LeanIX gibt es einen Mock der LeanIX-API (Token-Endpunkt und
GraphQL `allFactSheets`) mit denselben Fixtures:

```bash
node scripts/mock-leanix.mjs                      # lauscht auf 127.0.0.1:4600
# in apps/web/.env:
#   LEANIX_BASE_URL=http://localhost:4600
#   LEANIX_API_TOKEN=dummy
pnpm dev
```

| Variable                   | Wirkung im Mock                                                    |
| -------------------------- | ------------------------------------------------------------------ |
| `PORT`                     | Port (Standard 4600, `0` = freier Port)                            |
| `MOCK_EXAMPLE_RESOURCES=1` | Beispiel-Ressourcen (Bestellen, ky2help, Webseite …) an Leistungen |
| `MOCK_FAIL=1`              | alle Anfragen mit HTTP 503 beantworten (LeanIX ausgefallen)        |
| `MOCK_CHANNEL_LIMIT=n`     | nur die ersten n Leistungen (nach Name) im Kanal (Schrumpf-Schutz) |
| `MOCK_WORKSPACE`           | Workspace im Access-Token (Standard `eamktsoLive`)                 |
| `MOCK_PAGE_SIZE`           | höchstens so viele Einträge pro Seite (Paging)                     |

## Oberfläche

Die Oberfläche ist mit [tasteskill 2.5.1](https://github.com/Leonxlnx/taste-skill) von Grund auf
gebaut (Art «service»). Ohne Tailwind und ohne Komponentenbibliothek:

- `apps/web/public/assets/` – das Kit des Skills, **unverändert** (System, Motion, Layout, der
  Moment `word-highlight`) und die Fotografien (`img/`). Nicht von Hand ändern: Das Prüfskript des
  Skills vergleicht die Dateien mit dem Original.
- `apps/web/public/styles/portal.css` und `admin.css` – eigene Regeln auf den Tokens des Kits.
  Farben aus dem CD-Manual (Weiss, Grafik-Schwarz `#333333`, Grafik-Grau `#646B76`, Solothurner
  Rot `#CC0000`), Schrift Schibsted Grotesk (SIL OFL, lokal in `public/fonts/`).
- Startseite: fünf Abschnitte, jeder genau ein Bildschirm hoch (Hero, Kategorien, Ablauf, Aussage,
  Abschluss mit Fusszeile). Katalog-, Anmelde- und Verwaltungsseiten wachsen mit ihrem Inhalt.
- Fotografien: Rathaus und Altstadt Solothurn von Wikimedia Commons (CC BY-SA), Urheber und
  Lizenzen unter `/bildnachweis`. Für den Betrieb durch eigene Aufnahmen des Kantons ersetzen.

Prüfen wie im Skill beschrieben (Node 22+, Chromium), bei laufendem Server aus `apps/web`:

```bash
node <skill>/scripts/gate.mjs http://localhost:3000/        # Checker bei 1440 und 390, Texte, Layout
node <skill>/scripts/perf.mjs http://localhost:3000/        # gegen den Produktions-Build messen
```

`<skill>` ist der Ordner `skills/taste-skill` aus dem Repository des Skills (Tag `v2.5.1`).

## Tests und Qualität

```bash
pnpm --filter web test    # Vitest
pnpm typecheck
pnpm lint
pnpm format               # Prettier für apps/web
```

Der Integrationstest `lib/catalog/sync.integration.test.ts` synchronisiert gegen den Mock und
eine echte Postgres-Datenbank: `CATALOG_IT_DATABASE_URL` oder, wenn nicht gesetzt, die Datenbank
`<Name aus DATABASE_URL>_it` (wird angelegt und migriert). Ohne erreichbares Postgres wird er
übersprungen.

## Konfiguration

Umgebungsvariablen stehen in `apps/web/.env` (Vorlage `apps/web/.env.example`), geprüft in
`apps/web/lib/env-schema.ts` (leere Werte gelten als nicht gesetzt). Für den Betrieb: `.env.prod.example` und [Betriebshandbuch](docs/betrieb.md).

| Variable                         | Standard                         | Bedeutung                                                                                                       |
| -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | –                                | Postgres-Verbindung                                                                                             |
| `BETTER_AUTH_SECRET`             | –                                | Geheimnis für Sitzungen (mind. 32 Zeichen)                                                                      |
| `BETTER_AUTH_URL`                | –                                | Adresse des Portals (Server)                                                                                    |
| `NEXT_PUBLIC_APP_URL`            | `http://localhost:3000`          | Adresse des Portals (wird beim Build ins Bundle eingesetzt)                                                     |
| `LEANIX_BASE_URL`                | `https://ktso.leanix.net`        | LeanIX-Instanz                                                                                                  |
| `LEANIX_WORKSPACE`               | `eamktsoLive`                    | Workspace (für Links in die Fact Sheets)                                                                        |
| `LEANIX_API_TOKEN`               | leer                             | API-Token des technischen Benutzers (Rolle Viewer). Leer = Demo-Modus                                           |
| `CATALOG_SOURCE`                 | `leanix` mit Token, sonst `demo` | `leanix` (Sync) oder `demo` (mitgelieferter Snapshot)                                                           |
| `CATALOG_ROOT_ID`                | aus `lib/leanix/model.ts`        | LeanIX-ID der Ebene-1-Kategorie «Business IT-Servicekatalog»                                                    |
| `CATALOG_SYNC_INTERVAL_MINUTES`  | `15`                             | Abstand der Syncs in Minuten                                                                                    |
| `CATALOG_MIN_RATIO`              | `0.5`                            | Neuer Stand wird abgelehnt, wenn er weniger als diesen Anteil der bisherigen Leistungen enthält                 |
| `CATALOG_SHRINK_TOLERANCE`       | `5`                              | … und zusätzlich mehr als so viele Leistungen (bzw. Aktionen) wegfallen                                         |
| `CATALOG_STALE_AFTER_HOURS`      | `24`                             | Ab so vielen Stunden ohne erfolgreichen Sync gilt der Katalog als veraltet                                      |
| `CATALOG_SHOW_PERSONS`           | `false`                          | Personen (Leistungsverantwortliche/r) anzeigen                                                                  |
| `CATALOG_SHOW_EMPTY_SERVICES`    | `false`                          | Services ohne Leistung im Kanal anzeigen (vorläufig aus, siehe Konzept 2.2)                                     |
| `CATALOG_HTTP_ALLOWED_HOSTS`     | leer                             | Hosts, für die Ressourcen-Links mit `http:` erlaubt sind (sonst nur `https:`)                                   |
| `CATALOG_FALLBACK_REQUEST_URL`   | leer                             | Zentraler Kontakt: Standard-Aktion für Leistungen ohne Bestell-/Anfrage-Ressource (`https:`, `mailto:`, `tel:`) |
| `CATALOG_FALLBACK_REQUEST_LABEL` | `Anfrage an den Service Desk`    | Beschriftung der Standard-Aktion                                                                                |
| `CATALOG_SUPPORT_EMAIL`          | leer                             | Optional: E-Mail-Adresse des Service Desk (Fusszeile, Kontaktkasten)                                            |
| `CATALOG_SUPPORT_PHONE`          | leer                             | Optional: Telefonnummer des Service Desk                                                                        |
| `AUTH_TRUSTED_PROXIES`           | leer                             | Reverse Proxies (IP/CIDR), die `X-Forwarded-For` ergänzen (Rate-Limit der Anmeldung)                            |
| `CATALOG_IT_DATABASE_URL`        | `<DATABASE_URL>_it`              | Nur Tests: Datenbank für den Integrationstest                                                                   |

Das LeanIX-Mapping (Fact-Sheet-Typen, Kanal-Feld, Relationen, Ressourcentypen) steht in
`apps/web/lib/leanix/model.ts`.

## Betrieb

Kurzfassung (Details im [Betriebshandbuch](docs/betrieb.md)):

```bash
cp .env.prod.example .env.prod && chmod 600 .env.prod   # ausfüllen, u. a. LEANIX_API_TOKEN
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

- Die App lauscht auf `127.0.0.1:3000`; TLS übernimmt ein vorgelagerter Reverse-Proxy mit
  internem Zertifikat. Für einen bestehenden nginx-proxy gibt es `docker-compose.nginx-proxy.yml`.
- Migrationen laufen automatisch als Dienst `migrate` vor dem Start der App.
- Liveness: `GET /rpc/health/check`; Readiness (auch Docker-`HEALTHCHECK`): `GET /rpc/health/ready`;
  Katalogstatus: `GET /rpc/catalog/status`.
- Der Container braucht ausgehend `ktso.leanix.net:443` (bei Bedarf `HTTPS_PROXY`/`NO_PROXY`).
- Ohne Internet beim Build: `NODE_IMAGE` und `NPM_REGISTRY` auf interne Quellen setzen.

## LeanIX-Discovery ausführen

Voraussetzung: Node 22+ und der API-Token eines technischen Benutzers (Rolle Viewer genügt).

```bash
LEANIX_API_TOKEN=<token> node scripts/leanix-discovery.mjs
```

Ausgabe im Ordner `leanix-discovery/` (nicht eingecheckt und nicht im Docker-Build), Zusammenfassung in
`leanix-discovery/summary.md`. Der Ordner enthält echte Inhalte aus LeanIX; vor der Weitergabe prüfen.

## Logo

Das Logo «KANTON solothurn» (`apps/web/public/brand/kanton-solothurn-logo.svg`) stammt
unverändert von so.ch und lässt sich mit `node scripts/fetch-logo.mjs` neu laden bzw. mit
`--check` prüfen. Für den Produktivbetrieb die Originaldatei beim Kompetenzzentrum für
Publikationsmedien beziehen und unter demselben Namen ablegen; Details in
[docs/branding.md](docs/branding.md).

## Monitoring und Anmeldeschutz

**Monitoring-Endpunkte** (GET, ohne Anmeldung):

| Endpunkt              | Zweck                                                                                                                                                                                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/rpc/health/check`   | Liveness: Der Prozess antwortet. Prüft keine Abhängigkeiten.                                                                                                                                                                                                                                 |
| `/rpc/health/ready`   | Readiness (auch Docker-`HEALTHCHECK`): HTTP 200 mit `status` `ok` oder `degraded` (Katalog veraltet bzw. letzter Sync fehlgeschlagen), HTTP 503 (`NOT_READY`), wenn die Datenbank nicht erreichbar ist oder kein Katalog vorliegt. Enthält `db`, `catalog` und `lastSync` (ohne Fehlertext). |
| `/rpc/catalog/status` | Stand des Katalogs (`available`, `generatedAt`, `stale`), wie in der Fusszeile.                                                                                                                                                                                                              |

**Reverse Proxy und Anmeldeschutz**: Die App nur über den Reverse Proxy erreichbar machen
(Port nicht freigeben bzw. nur an ein internes Netz binden). Der Proxy muss `X-Forwarded-For`
setzen, am besten überschreiben (nginx: `proxy_set_header X-Forwarded-For $remote_addr;`).
Ergänzt er die Kette (`$proxy_add_x_forwarded_for`, z. B. nginx-proxy), die Proxy-Adressen in
`AUTH_TRUSTED_PROXIES` eintragen (kommagetrennte IPs/CIDR, z. B. `172.18.0.0/16`). Darauf beruht
das IP-basierte Rate-Limit von better-auth (im Speicher, pro Instanz). Unabhängig von der IP
sperrt das Portal eine E-Mail-Adresse nach 10 Fehlversuchen für bis zu 15 Minuten; TOTP-Codes
sperrt better-auth nach 10 Fehlversuchen. Für Produktion unter «Sicherheit» die
Zwei-Faktor-Pflicht für Admins einschalten.

**Kein E-Mail-Versand**: Das Portal verschickt keine E-Mails (kein Passwort-Reset, keine
Bestätigungsmails); SMTP ist nicht nötig. Ein vergessenes Passwort ersetzt ein anderer Admin,
indem er das Konto löscht und neu erfasst.
Fehlt jedes Admin-Konto, ist `/setup` trotzdem geschlossen (`app_settings.setup_completed_at`);
die Wiederherstellung erfolgt dann über die Datenbank.
