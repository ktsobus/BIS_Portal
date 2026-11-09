# BITS-Portal

Kantonsinternes Serviceportal für die Business-IT-Services des AIO (Kanton Solothurn).
Datenquelle ist SAP LeanIX (`https://ktso.leanix.net`); angezeigt werden Leistungen im Kanal
«Business IT-Servicekatalog», gruppiert nach Leistungskategorie.

- **[Analyse und Umsetzungsplan](docs/konzept.md)** – Datenmodell, Architektur, Caching, Design, offene Fragen
- **[Discovery-Skript](scripts/leanix-discovery.mjs)** – liest das LeanIX-Datenmodell aus (nur lesend)

Techstack: [Laeri/dev-template](https://github.com/Laeri/dev-template) ·
Design: [CD-Manual Kanton Solothurn](https://github.com/ktsobus/CD-Manual-Kanton-Solothurn)

## LeanIX-Discovery ausführen

Voraussetzung: Node 22+ und der API-Token eines technischen Benutzers (Rolle Viewer genügt).

```bash
LEANIX_API_TOKEN=<token> node scripts/leanix-discovery.mjs
```

Ausgabe im Ordner `leanix-discovery/` (nicht eingecheckt), Zusammenfassung in
`leanix-discovery/summary.md`.

## Betrieb: Monitoring und Anmeldung

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
