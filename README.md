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
Next.js 16, Tailwind v4, shadcn/ui, oRPC, TanStack Query, Zod 4, better-auth, Drizzle + Postgres) ·
Design: [CD-Manual Kanton Solothurn](https://github.com/ktsobus/CD-Manual-Kanton-Solothurn) ·
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
Admin gibt). Danach erfolgt die Anmeldung über `/sign-in` (Link «Anmelden» in der Fusszeile).

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
`apps/web/lib/env.ts`. Für den Betrieb: `.env.prod.example` und [Betriebshandbuch](docs/betrieb.md).

| Variable                         | Standard                         | Bedeutung                                                                                       |
| -------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | –                                | Postgres-Verbindung                                                                             |
| `BETTER_AUTH_SECRET`             | –                                | Geheimnis für Sitzungen (mind. 32 Zeichen)                                                      |
| `BETTER_AUTH_URL`                | –                                | Adresse des Portals (Server)                                                                    |
| `NEXT_PUBLIC_APP_URL`            | `http://localhost:3000`          | Adresse des Portals (wird beim Build ins Bundle eingesetzt)                                     |
| `LEANIX_BASE_URL`                | `https://ktso.leanix.net`        | LeanIX-Instanz                                                                                  |
| `LEANIX_WORKSPACE`               | `eamktsoLive`                    | Workspace (für Links in die Fact Sheets)                                                        |
| `LEANIX_API_TOKEN`               | leer                             | API-Token des technischen Benutzers (Rolle Viewer). Leer = Demo-Modus                           |
| `CATALOG_SOURCE`                 | `leanix` mit Token, sonst `demo` | `leanix` (Sync) oder `demo` (mitgelieferter Snapshot)                                           |
| `CATALOG_ROOT_ID`                | aus `lib/leanix/model.ts`        | LeanIX-ID der Ebene-1-Kategorie «Business IT-Servicekatalog»                                    |
| `CATALOG_SYNC_INTERVAL_MINUTES`  | `15`                             | Abstand der Syncs in Minuten                                                                    |
| `CATALOG_MIN_RATIO`              | `0.5`                            | Neuer Stand wird abgelehnt, wenn er weniger als diesen Anteil der bisherigen Leistungen enthält |
| `CATALOG_STALE_AFTER_HOURS`      | `24`                             | Ab so vielen Stunden ohne erfolgreichen Sync gilt der Katalog als veraltet                      |
| `CATALOG_SHOW_PERSONS`           | `false`                          | Personen (Leistungsverantwortliche/r) anzeigen                                                  |
| `CATALOG_FALLBACK_REQUEST_URL`   | leer                             | Standard-Aktion für Leistungen ohne Bestell-/Anfrage-Ressource                                  |
| `CATALOG_FALLBACK_REQUEST_LABEL` | `Anfrage an den Service Desk`    | Beschriftung der Standard-Aktion                                                                |
| `CATALOG_IT_DATABASE_URL`        | `<DATABASE_URL>_it`              | Nur Tests: Datenbank für den Integrationstest                                                   |

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
- Health-Check: `GET /rpc/health/check`, Katalogstatus: `GET /rpc/catalog/status`.
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
