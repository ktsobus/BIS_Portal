# BITS-Portal – Analyse und Umsetzungsplan

Stand: 9. November 2026 · Status: Discovery ausgewertet, PoC in Arbeit; offene Fragen in [Kapitel 10](#10-offene-fragen--benötigte-informationen)

Kantonsinternes Serviceportal, das die Business-IT-Services des AIO aus SAP LeanIX
(`https://ktso.leanix.net`, Workspace `eamktsoLive`) übersichtlich darstellt und Anfragen
und Bestellungen ohne Medienbruch an das passende Zielsystem weiterleitet.

---

## 1. Ausgangslage

Der ursprüngliche Auftrag ging von Geschäftsfähigkeiten aus (Supporting Capability / IT-Management,
Gruppierung nach Level 3, Leistungen als Kind-Elemente von Level 4). Das Datenmodell in LeanIX hat
sich seither geändert:

| Bisher (Auftrag)                                             | Neu (LeanIX heute)                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Geschäftsfähigkeit «Supporting Capability / IT-Management»   | Fact-Sheet-Typ **Leistungskategorie**, Ebene 1–3                                   |
| Gruppierung nach Geschäftsfähigkeit Level 3                  | Gruppierung nach **Leistungskategorie Ebene 2** (Arbeitsplatz-, Backend-, … Services) |
| Service = Geschäftsfähigkeit Level 4                         | Service = **Leistungskategorie Ebene 3** (z. B. «Service eLearning»)               |
| Leistung als Kind-Element von Level 4                        | Fact-Sheet-Typ **Leistung** (Subtyp Verwaltungs- oder Behördenleistung), verknüpft mit Ebene 3 |
| Explizite Freigabe zur Veröffentlichung                      | Feld **Zugangskanal → Kanal** enthält «Business IT-Servicekatalog» (Mehrfachauswahl) |
| Zielsystem pro Service konfigurierbar                        | **Ressource** im Tab «Weitere Informationen» mit bestimmtem Ressourcentyp           |

Das Beispiel «eLearning Inhalte publizieren» bestätigt die Struktur:

```
Leistungskategorie  Ebene 1  Business IT-Servicekatalog
                    Ebene 2  └─ Unterstützungs-Services
                    Ebene 3     └─ Service eLearning
Leistung                           ├─ eLearning Inhalte publizieren   (Verwaltungsleistung)
                                   └─ eLearning Bedarf anmelden
```

---

## 2. Analyse LeanIX

### 2.1 Datenmodell (soweit aus dem Beispiel ersichtlich)

```mermaid
erDiagram
    LEISTUNGSKATEGORIE ||--o{ LEISTUNGSKATEGORIE : "Parent/Child (Ebene 1-3)"
    LEISTUNGSKATEGORIE ||--o{ LEISTUNG : "Leistungskategorien"
    LEISTUNG }o--o{ ORGANISATIONSEINHEIT : "Organisationseinheiten (verantwortlich)"
    LEISTUNG }o--o{ LEISTUNGSBEZUEGER : "Leistungsbezüger"
    LEISTUNG }o--o{ PROZESS : "Verbindung zu Prozesse"
    LEISTUNG }o--o{ ANWENDUNG : "Anwendungen"
    LEISTUNG }o--o{ IT_KOMPONENTE : "IT-Komponenten"
    LEISTUNG ||--o{ RESSOURCE : "Weitere Informationen"
    LEISTUNG {
        string name
        string beschreibung
        enum subtyp "Verwaltungsleistung | Behördenleistung"
        multiselect kanal "u. a. Business IT-Servicekatalog"
    }
    RESSOURCE {
        string name
        string url
        string description
        string documentType "Ressourcentyp"
    }
```

Was im Fact Sheet sonst noch steht (Operativer Aufwand, Digitalisierung, Digitale Reife,
Barriere), ist intern und wird im Portal **nicht** angezeigt (Annahme).

Die **internen Schlüssel** sind in der UI nicht sichtbar. Die Discovery vom 9.11.2026
(Kapitel 11) hat sie bestätigt; sie stehen zentral in `apps/web/lib/leanix/model.ts`:

| Begriff in der UI                  | Interner Schlüssel                                   |
| ---------------------------------- | ---------------------------------------------------- |
| Fact-Sheet-Typ «Leistung»          | `behoerdenLeistungen` (eigener Typ)                  |
| Subtyp                             | Feld `category`: `verwaltungsLeistungen`, `behoerdenLeistungen` |
| Zugangskanal → Kanal               | Feld `kanal` (Mehrfachauswahl)                       |
| Option «Business IT-Servicekatalog» | `Business_IT_Servicekatalog`                        |
| Fact-Sheet-Typ «Leistungskategorie» | `Leistungskategorie` (Ebene über `level`, Hierarchie über `relToParent`) |
| Wurzel «Business IT-Servicekatalog» | ID `f846f11a-5b18-4585-bc74-ef98c056a3c8`           |
| Leistung → Leistungskategorie      | `relbehoerdenLeistungenToLeistungskategorie`         |
| Organisationseinheiten             | Typ `Organisationseinheit`, Relation `relbehoerdenLeistungenToOrganisationseinheit` |
| Leistungsbezüger                   | Typ `UserGroup` (umbenannt), Relation `relbehoerdenLeistungenToUserGroup` |
| Anwendungen / Prozesse             | `relbehoerdenLeistungenToApplication` / `…ToProcess` |
| Leistungsverantwortliche/r         | Abonnement (`subscriptions`) Typ RESPONSIBLE mit Rolle «Leistungsverantwortliche/r»; nur Abos mit genau dieser Rolle zählen (Services: Rolle «Serviceverantwortliche/r», noch zu bestätigen) |

**Datenstand (Discovery):** 18 Leistungen, davon 13 im Kanal BITS; 7 davon sind einem Service
(Ebene 3) zugeordnet und erscheinen im Portal. Die übrigen 6 (u. a. «Mobile», «Schulung»,
Testeinträge) haben keine Kategorie und landen im Datenqualitätsbericht. Der Kategorienbaum
umfasst 5 Familien und 29 Services; die meisten Services haben eine Definition und eine
verantwortliche Organisationseinheit.

**Hierarchie bei Leistungen:** Die Folie «Metamodell» sieht Leistungen ohne Hierarchie vor.
In LeanIX gibt es trotzdem Eltern-Kind-Beziehungen (z. B. «Mobile» → «Geschäftliches Mobile
Abo»). Das Portal unterstützt beides: Kind-Leistungen ohne eigene Kategorie erben die Services
der Eltern-Leistung.

**Beschreibungen** sind Markdown (fett, Links, Listen). Sie folgen oft dem Muster
Kurzbeschreibung → «Beschreibung:» → «Gut zu wissen» → «Vorgehen». Das Portal zeigt den
ersten Absatz als Kurzbeschreibung und rendert den Rest sicher (kein HTML).

### 2.2 Publikationsregel

Eine Leistung erscheint im Portal, wenn **alle** Bedingungen erfüllt sind:

1. Fact-Sheet-Typ = Leistung, Status aktiv (nicht archiviert).
2. Feld **Kanal** enthält die Option «Business IT-Servicekatalog» – weitere Kanäle sind erlaubt
   (Mehrfachauswahl, «enthält» statt «ist gleich»).
3. Sie ist mit mindestens einem **Service** verknüpft: einer aktiven Leistungskategorie
   Ebene 3, deren aktive Familie (Ebene 2) direkt unter der Wurzel «Business IT-Servicekatalog»
   (Ebene 1) liegt. Eine Verknüpfung nur mit Ebene 1 oder 2 oder mit einer Kategorie ausserhalb
   des Baums genügt nicht (Hinweis `LEISTUNG_LINKED_OUTSIDE_CATALOG` im Datenqualitätsbericht).
   Hat die Leistung selbst keinen solchen Service, übernimmt sie die Services ihrer aktiven
   Eltern-Leistung (Kapitel 2.1, «Hierarchie bei Leistungen»). Die Wurzel wird über ihre
   LeanIX-ID konfiguriert (`apps/web/lib/leanix/model.ts`, übersteuerbar mit `CATALOG_ROOT_ID`),
   nicht über den Namen. Umgesetzt in `buildSnapshot` (`apps/web/lib/catalog/mapper.ts`).

Sonderfälle:

- Leistung im Kanal, aber **ohne Kategorie** im BITS-Baum → nicht im Katalog angezeigt, aber im
  Datenqualitätsbericht (Kapitel 7) gemeldet. Alternativ Rubrik «Weitere Leistungen» – Entscheid offen.
- Leistung mit **mehreren Kategorien** → erscheint bei jedem Service (eine Detailseite, mehrere Einstiege).
- Das Qualitätssiegel eignet sich **nicht** als Kriterium: die fachlich fertigen Leistungen
  (z. B. eLearning) stehen auf «Siegel gebrochen», weil sie nach der Freigabe bearbeitet wurden.
- Leistungskategorien haben kein Kanal-Feld. Freigegeben wird über den Kanal der Leistung:
  Ein Service (Ebene 3) erscheint nur, wenn mindestens eine seiner Leistungen veröffentlicht ist;
  eine Familie (Ebene 2) nur, wenn sie mindestens einen solchen Service hat. Ausgeblendete
  Services und Familien stehen im Datenqualitätsbericht (`SERVICE_WITHOUT_LEISTUNG`,
  `FAMILY_WITHOUT_LEISTUNG`). Mit `CATALOG_SHOW_EMPTY_SERVICES=true` erscheinen alle Services
  unter der Wurzel, auch ohne Leistung (mit Definition und Kontakt). **Vorläufiger Entscheid:**
  ausgeblendet (Standard `false`), offene Frage 10.

### 2.3 Abbildung der Anforderungen auf LeanIX

| Anforderung (Auftrag)        | Quelle in LeanIX                                                                 | Status          |
| ---------------------------- | -------------------------------------------------------------------------------- | --------------- |
| Nur freigegebene Services    | Leistung: Kanal enthält «Business IT-Servicekatalog». Service/Familie: nur mit mindestens einer freigegebenen Leistung (`CATALOG_SHOW_EMPTY_SERVICES`) | Leistung bestätigt; Service/Familie vorläufig, offene Frage 10 |
| Gruppierung                  | Leistungskategorie Ebene 2 → Ebene 3 → Leistung                                  | bestätigt       |
| Kurzbeschreibung             | Beschreibung der Leistung (erster Absatz als Teaser)                             | Annahme, offene Frage 3 |
| Definition                   | Beschreibung der Leistungskategorie Ebene 3 (Service-Definition)                 | Annahme, offene Frage 3 |
| Verantwortlichkeit           | Relation Organisationseinheiten (Anzeige mit Pfad, z. B. «AIO / Business IT-Services / Service-Management») | Annahme, offene Frage 4 |
| Mögliche nächste Schritte    | Ressourcen bestimmter Typen → Schaltflächen (z. B. «Bestellen» → ky2help, «Anfrage» → SmartForm KAM) | Typen offen, offene Frage 1 |
| Zielsystem pro Service       | URL der Ressource; pro Leistung frei wählbar, ohne Code-Änderung                  | bestätigt (Konzept) |
| Datenbezug aus LeanIX        | GraphQL-API, technischer Benutzer mit Leserechten                                | bestätigt       |

### 2.4 «Weitere Informationen» (Ressourcen)

Der Tab «Weitere Informationen» zeigt die **Ressourcen** eines Fact Sheets. In der API heissen
sie `documents`. Gemäss der API-Spezifikation der Instanz (`/services/pathfinder/v1/api-docs/swagger.json`)
hat eine Ressource diese Felder:

| Feld              | Bedeutung                                                         |
| ----------------- | ----------------------------------------------------------------- |
| `name`            | Anzeigename, z. B. «Bestellen in ky2help»                         |
| `url`             | Ziel-URL (Link) – bei hochgeladenen Dateien leer bzw. Datei-Info  |
| `description`     | Optionaler Text                                                   |
| `documentType`    | **Ressourcentyp** – Grundlage für die Auswahl im Portal           |
| `origin`          | Herkunft (Link, Datei, Integration …)                             |
| `createdAt`, `fileInformation`, `metadata`, `refId` | Zusatzangaben          |

Abfrage per GraphQL direkt mit dem Fact Sheet (`documents { edges { node { … } } }`), also ohne
Zusatz-Requests. Welche Ressourcentypen es gibt, liefert `GET /services/pathfinder/v1/models/factSheetResources`.

Im Portal wird pro Ressourcentyp konfiguriert, was damit passiert. Die Instanz kennt 27
Ressourcentypen; aktuell hat noch keine Leistung eine Ressource. Vorläufige Zuordnung
(`resourceTypeRules` in `apps/web/lib/leanix/model.ts`, fachlich noch zu bestätigen – erwartet
werden vor allem Links):

| Ressourcentyp (Schlüssel)                                   | Darstellung im Portal                          |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `ordering_form` (Bestellformular), `ky2help`                | Primäre Schaltfläche (Bestellen)               |
| `support_ticket`                                            | Schaltfläche «Anfrage stellen»                 |
| `phone_contact`                                             | Kontakt                                        |
| `website`, `Anwendungslink`, `documentation`, `information`, `faq`, `additional_help`, `wiki`, `AIO-Wiki`, `miscellaneous` | Link unter «Weitere Informationen» |
| `policy`, `decision`, `jira`, `roadmap`, `task`, `request` (RFC/RFI), `security`, `certificate`, `image`, `verzeichnis`, `RRB`, `AIO-ServicePortfolio`, `AIO-Lizenzablage`, `Testkonzept` | nicht anzeigen (intern) |

Hat eine Leistung keine Aktion, zeigt das Portal eine konfigurierbare Standard-Aktion
(`CATALOG_FALLBACK_REQUEST_URL`, z. B. Service Desk; `https:`, `mailto:` oder `tel:`) und die
verantwortliche Stelle. Derselbe zentrale Kontakt, optional ergänzt um
`CATALOG_SUPPORT_EMAIL` und `CATALOG_SUPPORT_PHONE`, erscheint bei Services ohne Leistungen,
in der Fusszeile und auf der Ausfallseite. Ohne Konfiguration bleibt es beim Hinweis auf die
verantwortliche Stelle (offene Frage 2); der Admin-Bereich weist darauf hin.

Hochgeladene **Dateien** sind nur mit LeanIX-Login abrufbar; sie werden im MVP nicht angezeigt
(nur Links). Erkannt werden sie an `origin` (z. B. `LX_STORAGE`) oder an der fehlenden URL; sie
erscheinen im Datenqualitätsbericht als Hinweis (`RESOURCE_FILE_NOT_SHOWN`, «info»).

Prüfung der Ressourcen-URLs (beim Sync, `apps/web/lib/catalog/mapper.ts`):

- erlaubt sind `https:`, `mailto:` und `tel:`; `http:` nur für Hosts in
  `CATALOG_HTTP_ALLOWED_HOSTS` (inkl. Subdomains, z. B. für Intranet-Formulare ohne TLS);
- abgelehnt werden URLs mit Zugangsdaten (`https://user:pass@host`) und Links auf LeanIX selbst;
- Beschriftungen werden von Steuer- und Bidi-Zeichen (z. B. U+202E) bereinigt;
- abgelehnte Links fehlen im Portal und stehen als Fehler im Datenqualitätsbericht
  (`RESOURCE_INVALID_URL`, LeanIX-Links als Warnung `RESOURCE_LINKS_TO_LEANIX`).

Links in **Beschreibungen** werden nicht umgeschrieben, ausser: Sitzungsparameter in
LeanIX-Links (Fragment, `state`, `session_state`, `code`, `iss`) und Zugangsdaten in URLs werden
entfernt. Unverschlüsselte Links (`http:`) ausserhalb der Freigabeliste meldet der
Datenqualitätsbericht (`DESCRIPTION_INSECURE_LINK`).

Daneben gibt es in LeanIX die neueren **Vorlagen-Dokumente** (Documents API v2, z. B.
Architekturentscheide). Der technische Benutzer erhält darauf HTTP 403; für das Portal sind nur
die Ressourcen relevant.

### 2.5 API-Zugang (am 9.11.2026 an der Instanz geprüft)

| Thema            | Ergebnis                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Erreichbarkeit   | `https://ktso.leanix.net` antwortet; Workspace `eamktsoLive` wird über den Token bestimmt   |
| Token            | `POST /services/mtm/v1/oauth2/token`, Basic-Auth `apitoken:<API-Token>`, `grant_type=client_credentials` → Bearer-Access-Token (zeitlich begrenzt, wird vor Ablauf erneuert) |
| Daten            | GraphQL `POST /services/pathfinder/v1/graphql` (`allFactSheets` mit Facettenfilter, Paging) |
| Modell           | `GET /services/pathfinder/v1/models/dataModel`, `…/models/factSheetResources`, `…/models/languages/de` |
| Änderungsereignisse | Webhooks-API mit **PULL-Subscriptions** (`/services/webhooks/v1/subscriptions/{id}/events`): das Portal holt Ereignisse ab, LeanIX muss das kantonale Netz nicht erreichen |
| Benutzer         | Technischer Benutzer, heute mit Workspace-Rolle **Member**. Empfehlung: auf **Viewer** (nur lesen) reduzieren. Token nur serverseitig, nie im Browser |

---

## 3. Bordmittel LeanIX oder eigenes Portal?

| Variante | Beschreibung | Beurteilung |
| -------- | ------------ | ----------- |
| A. LeanIX-Inventar, gespeicherte Ansichten, Dashboards | Gefilterte Inventarliste nach Kanal | Jede Person braucht einen LeanIX-Zugang und landet in einem EA-Werkzeug. Keine serviceorientierte Darstellung, keine Bestell-Schaltflächen. **Nicht geeignet.** |
| B. LeanIX Custom Report (Reporting-Framework) | Eigene HTML/JS-Ansicht innerhalb von LeanIX, Daten live per GraphQL | Darstellung frei gestaltbar, Daten direkt. Aber: weiterhin LeanIX-Login für alle Mitarbeitenden (Lizenz- und Rollout-Frage), im LeanIX-Rahmen eingebettet, kein Caching bei Ausfall, CD nur eingeschränkt umsetzbar. **Möglich als Vorschau für Datenpflegende, nicht als Portal für alle.** |
| C. Eigenes Webportal, LeanIX als führendes System | Next.js-Portal (dev-template), liest per API, speichert einen Snapshot | Für alle Mitarbeitenden ohne LeanIX-Konto, CD-konform, ausfallsicher, Zielsysteme als Links. Zusätzlicher Betrieb (Container, Datenbank). **Empfohlen.** |

**Empfehlung: Variante C.** LeanIX bleibt einziges Pflegesystem; das Portal liest nur und
speichert nichts zurück. Variante B kann später ergänzend als Pflegeansicht dienen.

---

## 4. Zielarchitektur

```mermaid
flowchart LR
    subgraph LeanIX["SAP LeanIX (ktso.leanix.net)"]
        GQL[GraphQL API]
        WH[Webhooks PULL<br/>Ausbau, nicht umgesetzt]
    end
    subgraph Portal["BITS-Portal (Container, kantonsintern)"]
        SYNC[Sync-Job<br/>Scheduler + manueller Sync]
        MAP[Mapper + Validierung<br/>Publikationsregel]
        DB[(Postgres<br/>catalog_snapshot<br/>catalog_sync_run)]
        MEM[In-Memory-Katalog]
        RPC[oRPC-Prozeduren<br/>catalog.* / catalogAdmin.*]
        UI[Next.js-Seiten<br/>Server Components]
    end
    USER[Mitarbeitende<br/>Browser]
    ZIEL[Zielsysteme<br/>ky2help · SmartForm]

    SYNC -- Token + Query --> GQL
    SYNC -. "Ereignisse (Ausbau, nicht umgesetzt)" .-> WH
    SYNC --> MAP --> DB --> MEM
    MEM --> RPC --> UI --> USER
    USER -- Klick «Bestellen» --> ZIEL
```

### 4.1 Caching und Ausfallsicherheit

Grundsatz: **Keine Benutzeranfrage geht an LeanIX.** Das Portal liefert immer aus dem letzten
gültigen Snapshot.

1. **Sync** – Der Sync-Job lädt Leistungen (im Kanal) und Leistungskategorien (BITS-Baum) mit
   wenigen paginierten GraphQL-Abfragen, wendet die Publikationsregel an und erzeugt einen
   normalisierten Katalog (JSON, versioniertes Schema, mit Zod validiert).
2. **Plausibilisierung** – Ein neuer Snapshot wird nur übernommen, wenn er gültig und vollständig
   ist und nicht unplausibel schrumpft:
   - Teilfehler von LeanIX (GraphQL `errors` neben `data`) auf Ressourcen (`documents`), Kanal,
     Status, Kategorie, Ebene, Relationen oder dem Fact Sheet selbst brechen den Lauf ab
     (Status «failed», bisheriger Stand bleibt). Toleriert und nur protokolliert werden
     Teilfehler auf Zusatzangaben (`subscriptions`, Berechtigungen).
   - Liefert das Paging weniger Einträge als `totalCount`, bricht der Lauf ebenfalls ab.
   - Schrumpft die Anzahl Leistungen oder die Anzahl Bestell-/Anfragewege (Aktionen) unter
     `CATALOG_MIN_RATIO` (Standard 50 %) **und** fallen mehr als `CATALOG_SHRINK_TOLERANCE`
     (Standard 5) weg, wird der Stand abgelehnt (Warnung im Admin-Bereich, mit den Namen der
     wegfallenden Leistungen). Die Toleranz verhindert, dass gewollte Änderungen in einem kleinen
     Katalog dauerhaft blockiert werden. Verglichen wird mit den Kennzahlen (Spalte `stats`) des
     neuesten gespeicherten Stands, auch wenn dieser nach einem Upgrade nicht mehr lesbar ist.
   Schützt vor Teilantworten und versehentlichem Massen-Entfernen.
3. **Persistenz** – Snapshot in Postgres (`catalog_snapshot`, die letzten 20 Versionen); dazu
   Protokoll jedes Laufs (`sync_run`: Auslöser, Dauer, Anzahl, Fehler). Ist
   `CATALOG_SHOW_PERSONS` aus, werden Personen beim Start und nach jedem erfolgreichen Sync auch
   aus älteren gespeicherten Snapshots entfernt (Datensparsamkeit).
4. **Auslieferung** – Beim Start wird der neueste gültige Snapshot in den Speicher geladen; Seiten
   lesen nur daraus. Gespeicherte Stände älterer Schemaversionen werden beim Laden migriert
   (`apps/web/lib/catalog/snapshot-migrations.ts`); eine einzelne unlesbare Zeile wird
   übersprungen. Fällt LeanIX aus, läuft das Portal unverändert weiter. Fusszeile: «Stand: …»;
   ab einem Schwellwert (z. B. 24 h ohne erfolgreichen Sync) Hinweis für Admins.
5. **Aktualisierung** –
   - MVP: Intervall (z. B. alle 15 Minuten) + Schaltfläche «Jetzt synchronisieren» im Admin-Bereich.
     Der manuelle Sync läuft im Hintergrund; die Anfrage kehrt sofort zurück (kein Timeout im
     Reverse Proxy), der Admin-Bereich zeigt den Fortschritt.
   - Ausbau: Webhook-PULL-Subscription auf Fact-Sheet-Änderungen; bei relevanten Ereignissen
     (entprellt) Voll-Sync → Änderungen in LeanIX sind nach 1–2 Minuten sichtbar.
   - Der Voll-Sync bleibt in jedem Fall (wenige Requests, robust, kein Delta-Abgleich nötig).
6. **Mehrere Instanzen** – Postgres-Advisory-Lock, damit nur eine Instanz synchronisiert. Jede
   Instanz gleicht ihren Speicher jede Minute mit der Datenbank ab (nur `id` und `generated_at`
   der neuesten Zeile) und übernimmt so Läufe der anderen Instanzen. Bleibt ein Lauf nach einem
   Prozessende auf «running» stehen, schliesst ihn der Admin-Bereich ab, sobald das Lock frei ist.
7. **Erststart ohne Snapshot und ohne LeanIX** – Seite «Katalog vorübergehend nicht verfügbar».
   Optional ein exportierter Snapshot als Datei im Volume als zweite Rückfallebene.

### 4.2 Konfiguration

Alles, was vom LeanIX-Modell abhängt, steht an einer Stelle und nicht im Code verstreut:
`apps/web/lib/leanix/model.ts`. Dort liegen `leanixModel` (Fact-Sheet-Typen, Kanal-Feld und
-Option, Subtypen, Relationen, LeanIX-ID der Wurzel, Rolle der verantwortlichen Person; Werte aus
der Discovery, Kapitel 2.1) und `resourceTypeRules` (Ressourcentyp → Aktion oder Link, Kapitel
2.4). Ändert sich das Modell in LeanIX, wird nur diese Datei angepasst.

Umgebungsvariablen (nur serverseitig, geprüft mit Zod in `apps/web/lib/env.ts`): vollständige
Liste mit Standardwerten in `apps/web/.env.example` und im README (Abschnitt «Konfiguration»),
für den Betrieb in `.env.prod.example`. Die wichtigsten:

- `LEANIX_API_TOKEN` – API-Token des technischen Benutzers. `CATALOG_SOURCE` ist ohne Token
  `demo`: Das Portal zeigt dann den mitgelieferten Snapshot `apps/web/data/demo-catalog.json`
  und synchronisiert nicht. In Produktion meldet der Server das beim Start als Warnung, und
  `docker-compose.prod.yml` verlangt den Token.
- `CATALOG_ROOT_ID` – übersteuert die LeanIX-ID der Ebene-1-Kategorie aus `model.ts`.
- `CATALOG_SYNC_INTERVAL_MINUTES`, `CATALOG_MIN_RATIO` – Sync-Intervall und Schrumpf-Schutz
  (Kapitel 4.1).
- `CATALOG_STALE_AFTER_HOURS` – ab so vielen Stunden ohne erfolgreichen Sync gilt der Katalog als
  veraltet (Hinweis im Admin-Bereich).
- `CATALOG_SHOW_PERSONS` – Personen (Leistungsverantwortliche/r) anzeigen, Standard aus.
- `CATALOG_FALLBACK_REQUEST_URL` / `CATALOG_FALLBACK_REQUEST_LABEL` – Standard-Aktion für
  Leistungen ohne Bestell- oder Anfrage-Ressource (Kapitel 2.4).
- `CATALOG_SHRINK_TOLERANCE` – Schrumpf-Schutz greift erst, wenn zusätzlich mehr als so viele
  Leistungen (bzw. Aktionen) wegfallen.
- `CATALOG_SHOW_EMPTY_SERVICES` – Services ohne Leistung im Kanal anzeigen (vorläufig `false`,
  Kapitel 2.2).
- `CATALOG_HTTP_ALLOWED_HOSTS` – Hosts, für die `http:`-Ressourcen erlaubt sind.
- `CATALOG_SUPPORT_EMAIL` / `CATALOG_SUPPORT_PHONE` – zusätzliche Kontaktangaben des Service Desk.
- `AUTH_TRUSTED_PROXIES` – Reverse Proxies, die `X-Forwarded-For` ergänzen (Rate-Limit der
  Anmeldung).

Leere Werte gelten als nicht gesetzt (Schema in `apps/web/lib/env-schema.ts`).

### 4.3 Sicherheit

- Technischer Benutzer nur mit Leserechten; Token als Secret, Ablaufdatum gesetzt, Erneuerung im
  [Betriebshandbuch](betrieb.md#6-leanix-token).
- Beschreibungen aus LeanIX werden als Markdown gerendert (react-markdown, kein Roh-HTML;
  `apps/web/features/catalog/components/markdown.tsx`).
- Links in Beschreibungen nur `https:`, `http:`, `mailto:` und `tel:`, alles andere erscheint
  als Text; Ressourcen-Links nur `https:` (`http:` nur für freigegebene Hosts), ohne Zugangsdaten
  (Kapitel 2.4). Externe Links mit `rel="noopener noreferrer"`.
- Katalog ohne Anmeldung im Intranet; Admin-Bereich mit Anmeldung (SAML-SSO, im PoC zusätzlich Passwort).
- HTTP-Sicherheits-Header aus `apps/web/next.config.ts`: Content-Security-Policy ohne fremde
  Quellen (`default-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`; Skripte und
  Styles mit `'unsafe-inline'`, da ohne Nonces), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (Kamera, Mikrofon, Standort aus); kein `X-Powered-By`. HSTS setzt der
  TLS-Proxy. Eine Nonce-basierte CSP ist ein späterer Schritt (erzwingt dynamisches Rendering).
  Auf Seiten mit Formularen meldet der Browser eine abgefangene CSP-Verletzung `script-src eval`:
  Zod prüft mit `Function("")`, ob es Validierungscode erzeugen darf, und fällt sonst auf die
  normale Validierung zurück (ohne Auswirkung). Nach Änderungen den SAML-Login einmal mit dem
  echten IdP testen.

---

## 5. Techstack und Projektstruktur

Vorgabe ist [Laeri/dev-template](https://github.com/Laeri/dev-template) (fix): pnpm + Turborepo,
Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, oRPC (contract-first), TanStack Query,
Zod 4, better-auth, Drizzle + Postgres, Docker.

### 5.1 Was übernommen, angepasst, entfernt wird

| Bereich                     | Vorgehen                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| Monorepo, oRPC, Zod, Drizzle, Docker | unverändert übernehmen                                           |
| better-auth (Admin-Login)   | übernehmen; SAML mit kantonalem IdP (offene Frage 7) plus Passwort-Login           |
| Feature `tasks`, Startseiteninhalt `overview` | entfernen (Beispielcode)                               |
| E-Mail/2FA                  | E-Mail: entfernt (kein Passwort-Reset, keine Bestätigungsmails), 2FA bleibt |
| Theme (`app/globals.css`)   | durch Tokens aus design.md / CD-Manual ersetzen (Kapitel 6.2)            |
| Neu: Sync-Scheduler         | `apps/web/instrumentation.ts` (Node-Runtime) + Advisory-Lock             |
| Neu: Tests                  | Vitest für Mapper und Publikationsregel mit Fixtures aus der Discovery   |

Die Regeln aus `AGENTS.md` des Templates gelten: nur `/rpc` und `/api/auth` als Route-Handler,
keine Server Actions, Geschäftslogik in oRPC-Prozeduren, Server Components lesen über einen
serverseitigen oRPC-Router-Client. Vor dem Codieren die Next.js-16-Doku in
`node_modules/next/dist/docs/` lesen.

### 5.2 Struktur

Gebauter Stand (PoC):

```
apps/web/
  app/
    (public)/page.tsx                Start: Suche + Service-Familien
    (public)/kategorie/[slug]/       Ebene 2: Services der Familie
    (public)/service/[slug]/         Ebene 3: Definition + Leistungen
    (public)/leistung/[slug]/        Leistung: Details + nächste Schritte
    (public)/suche/                  Volltextsuche (clientseitig)
    (app)/admin/catalog/             Sync-Status, manueller Sync, Datenqualität
    (app)/admin/{users,security,saml}/  Benutzer, 2FA-Pflicht, SAML-Provider
    setup/                           Ersten Admin anlegen
    rpc/[[...rest]]/route.ts         oRPC-Endpunkt (einziger Route-Handler neben /api/auth)
  features/
    catalog/
      components/                    Kacheln, Service-Liste, Leistungskarte, Aktionen, Markdown
      load.ts                        Datenzugriff der Seiten über serverClient (lib/orpc-server.ts)
      server/router.ts               catalog.* (liest den In-Memory-Katalog aus dem Store)
      server/views.ts                Antworten für Übersicht, Familie, Service, Leistung, Suche
    catalog-admin/
      components/                    Admin-Seite Katalog
      server/router.ts               catalogAdmin.* (Status, Sync auslösen, Datenqualität)
  lib/catalog/
    mapper.ts                        LeanIX-Rohdaten → Katalog-Snapshot (reine Funktionen, getestet)
    assess.ts                        Plausibilisierung (Schrumpf-Schutz)
    sync.ts                          Ablauf, Advisory-Lock, Persistenz
    store.ts                         Snapshot laden/halten, Demo-Modus
    scheduler.ts                     periodischer Sync
    __fixtures__/                    bereinigte Discovery-Daten für Tests und Demo-Snapshot
  lib/leanix/
    client.ts                        Token-Handling, GraphQL-Aufruf, Retry/Timeout
    queries.ts                       GraphQL-Abfragen, Paging
    model.ts                         Mapping (Kapitel 4.2)
    types.ts                         Rohtypen
  lib/orpc-server.ts                 serverseitiger oRPC-Client für Server Components
  db/schema/catalog.ts               catalog_snapshot, catalog_sync_run
  data/demo-catalog.json             Demo-Snapshot (pnpm --filter web catalog:demo)
  instrumentation.ts                 Prüfung der Datenquelle, Scheduler-Start
packages/api/src/
  contracts/catalog.ts               catalog.{status,overview,family,service,leistung,searchIndex},
                                     catalogAdmin.{overview,syncNow}
  schemas/catalog.ts                 Katalog-Schemas (auch Snapshot-Validierung)
scripts/
  leanix-discovery.mjs               Discovery (Kapitel 11)
  mock-leanix.mjs                    LeanIX-Mock für Entwicklung und Integrationstest
```

### 5.3 Katalog-Schema (Entwurf)

```ts
Catalog {
  generatedAt: Date; source: { host: string; workspace: string }
  families: Family[]        // Ebene 2: id, name, slug, description, order, serviceIds
  services: Service[]       // Ebene 3: id, name, slug, definition, familyId, responsible, links, leistungIds
  leistungen: Leistung[]    // id, name, slug, subtype, summary, description, channels,
                            // responsible: OrgUnit[], audiences: string[], applications: string[],
                            // serviceIds, actions: Action[], links: Link[], updatedAt
  issues: QualityIssue[]    // für den Admin-Bericht
}
```

Slugs aus Name + kurzer ID (stabil bei gleichen Namen); bei Umbenennung Weiterleitung über die ID.

---

## 6. Benutzerführung und Design

### 6.1 Seiten

| Seite        | Inhalt                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------- |
| Start        | Titel mit Lead, grosses Suchfeld mit sichtbarer Beschriftung (die Schnellsuche im Kopf entfällt hier); Service-Familien als Kacheln mit Anzahl Services und Vorschau |
| Familie (Ebene 2) | Seitennavigation (alle Familien); Services als Zeilenkarten über die Inhaltsbreite mit Stelle und Definition (gekürzt) |
| Service (Ebene 3) | Seitennavigation (Services der Familie, aktueller Service mit seinen Leistungen); Definition, Leistungen als Zeilenkarten (Subtyp, Kurzbeschreibung; eigene Bestell-/Anfragewege aus LeanIX als Pillen, die Standard-Aktion nur auf der Detailseite), ohne Leistungen eine Kontaktbox mit dem zentralen Kontakt, Zuständigkeit |
| Leistung     | Box «Service nutzen» mit den Aktionen (Hauptaufgabe; ohne Aktion Hinweis mit verantwortlicher Stelle und zentralem Kontakt), Beschreibung, Eckdaten (Art der Leistung, Leistungsbezüger, Anwendungen), Zuständigkeit, weitere Informationen, «Stand: …» |
| Suche        | Volltext über Name, Beschreibung, Service, Anwendungen; Filter Subtyp und Leistungsbezüger als Chips (nur bei mehr als einem Wert); Treffer als Servicekarten; clientseitig (kleine Datenmenge) |

Brotkrumen auf allen Seiten (Start › Familie › Service › Leistung), mobil als Rücklink.
Ein Inhaltsverzeichnis (Sprungmarken) erscheint erst ab drei Abschnitten; die Box
«Zuständigkeit» entfällt, wenn weder Stelle noch Ansprechperson erfasst ist. Kopf, Inhalt und
Fusszeile beginnen an derselben linken Kante (`container-page`); der Stand der Daten steht in
der Meta-Zeile unter der Fusszeile.
Leistungen ohne Aktions-Ressource zeigen einen Standard-Kontakt (z. B. Service Desk) –
offene Frage 2.

### 6.2 Corporate Design

Massgebend für die Bildschirmgestaltung ist das Designsystem von so.ch
([docs/design.md](design.md)), die Webumsetzung des
[CD-Manuals Kanton Solothurn](https://github.com/ktsobus/CD-Manual-Kanton-Solothurn).
Wo design.md nichts sagt, gilt das CD-Manual. Umgesetzt in `apps/web/app/globals.css`
(Tokens, Typografie-Rollen `type-*`), den shadcn-Komponenten in `components/ui` und dem
Seitenrahmen in `components/site`.

| Vorgabe                                  | Quelle | Umsetzung im Portal                                                          |
| ---------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Solothurner Rot `#CC0000` nur für Aktion und Zustand | beide | Schaltflächen, Pfeile, aktive Navigation, Fokus (2 px rot), Hover; nie Dekoration, nie auf Schiefer |
| Schiefer `#2F4858` statt Schwarz          | design.md | Alle Texte und dunklen Flächen (Fusszeile, Sekundär-Schaltfläche); Schwarz nur für Unterstriche von Eingabefeldern und das Copyright |
| Getönte Kacheln nach Inhaltstyp          | design.md | Mint für Services und Leistungen (besucht dunkler), kühles Grau für Hinweise, Wolkengrau für Kennzahlen und Chips |
| 10-px-Ecken, Pillen und Kreise           | design.md | Container 10 px, alle Schaltflächen als Pille bzw. Kreis, Auswahlfelder 8 px, Eingabefelder ohne Rahmen mit Unterstrich |
| Keine Verläufe, keine Schattierungen     | beide | Flach; einzige Schatten: Anheben verlinkter Karten beim Überfahren und Einsinken gedrückter Schaltflächen (design.md). Kein Verlauf (es gibt keine Titelbilder) |
| Frutiger LT Std 55/75 (Roman/Black)      | beide | Freie Ersatzschrift **Source Sans 3** (SIL OFL, selbst gehostet), nur 400 und 800; Kursiv nur für den Absender. Frutiger-Webfont später mit Lizenz (Schriftstapel nennt Frutiger bereits) |
| Typografie-Skala, Basis 16 → 18 px ab 768 px | design.md | Rollen `type-display` … `type-eyebrow`, Überschriften mit `hyphens: auto` (`lang="de-CH"`) |
| Linksbündig, max. ~70 Zeichen, nie zentriert | CD-Manual | Lesespalte 912 px, Fliesstext `max-w-[70ch]` |
| Aufzählungen mit Halbgeviertstrich       | CD-Manual | `list-dash` (24 px Einzug) statt Punkten; design.md nennt Standardmarker, das CD-Manual geht vor |
| « », –, …, Datum `09.11.2026`            | beide | UI-Texte entsprechend; Daten numerisch, Zeiten «14:16 Uhr» |
| Absender: Amtsbezeichnung Black Italic   | CD-Manual | Fusszeile «*Amt für Informatik und Organisation*» |
| Logo nur Originaldatei, Schutzraum, weisser Grund | CD-Manual | Original-SVG 16 px hoch auf weissem Kopf, mind. eine Logohöhe Freiraum; Logofarben nie in der Oberfläche |
| Rotes Quadrat (Kanton-Element)           | CD-Manual | Entfällt am Bildschirm: es ist ein Druckelement (Umschläge), und design.md reserviert Rot für Interaktion |
| Bewegung nur als Rückmeldung             | design.md | Verlinkte Karten heben sich 2 px, Pfeile rücken 3 px in Laufrichtung, Schaltflächen sinken ein (0,15–0,2 s, nur mit Maus/Trackpad); das mobile Menü klappt auf. Keine Einblend-Animationen beim Laden oder Scrollen; `prefers-reduced-motion` wird beachtet |
| Fotos des Kantons, Titel über Bild       | design.md | Entfällt vorerst: keine lizenzierten Bilder (CD-Manual «Bildsprache»); Start- und Inhaltsseiten mit schlichtem Titel |

Barrierefreiheit nach eCH-0059 (WCAG 2.1 AA): Tastaturbedienung, Fokusrahmen, semantische
Überschriften, Alternativtexte.

---

## 7. Datenqualitätsbericht (Admin)

Der Sync erzeugt bei jedem Lauf eine Liste von Auffälligkeiten, im Admin-Bereich mit Link direkt
auf das Fact Sheet in LeanIX:

- Leistung im Kanal, aber ohne Kategorie im BITS-Baum
- Leistung ohne Beschreibung oder ohne verantwortliche Organisationseinheit
- Leistung ohne Aktions-Ressource (kein «nächster Schritt»)
- Ressource mit ungültiger oder unverschlüsselter URL (Fehler), Link auf LeanIX (Warnung),
  hochgeladene Datei oder nicht konfigurierter Typ (Hinweis)
- Kategorie Ebene 3 ohne veröffentlichte Leistung (Warnung, nicht im Portal angezeigt) und
  Familie ohne solchen Service (Hinweis)
- Wortgleiche Beschreibungen zweier Leistungen bzw. Services (`DUPLICATE_DESCRIPTION`, meist
  kopiert), Links auf LeanIX und unverschlüsselte Links in Beschreibungen

So kann das Service-Management die Daten in LeanIX gezielt nachpflegen.

---

## 8. Umsetzungsplan

| Phase | Inhalt | Ergebnis |
| ----- | ------ | -------- |
| 0 Klärung & Discovery | Technischen Benutzer bestätigen, Discovery-Skript ausführen, offene Fragen klären | Festgelegtes Mapping (Kapitel 4.2), Fixtures für Tests |
| 1 Grundgerüst | Repo aus dev-template, Beispielcode entfernen, CD-Theme, Layout (Kopf, Fuss, Brotkrumen, Titelkomponente) | Lauffähiges, leeres Portal im CD |
| 2 LeanIX-Anbindung | Token-Client, Queries, Mapper + Tests, Snapshot-Tabellen, Sync mit Plausibilisierung, Scheduler | Katalog wird aus LeanIX gefüllt und gecacht |
| 3 Portal-UI | Start, Familie, Service, Leistung, Suche, Aktionen/Links | Nutzbares Portal |
| 4 Admin | Login, Sync-Status, manueller Sync, Datenqualitätsbericht | Betrieb und Datenpflege unterstützt |
| 5 Betrieb | Docker-Image, Deployment, Health-Check, Monitoring, [Betriebshandbuch](betrieb.md) (Token-Rotation) | Produktiv |
| 6 Ausbau (optional) | Webhook-PULL, Deep-Links mit Vorbelegung, Custom Report als Pflegevorschau | Schnellere Aktualisierung |

Beteiligte Teams (Auftragstyp «mehrere Teams»):

| Team / Rolle                          | Liefert                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| LeanIX-Administration (EA)            | Technischer Benutzer, Ressourcentypen, Modellauskunft            |
| Service-Management BITS               | Datenpflege (Kanal, Kategorien, Ressourcen), fachliche Abnahme   |
| ky2help- / SmartForm-Verantwortliche  | Ziel-URLs, ggf. Parameter für Vorbelegung                        |
| Betrieb / Plattform                   | Hosting, Postgres, Proxy-Freigabe zu `ktso.leanix.net`, DNS      |
| Kompetenzzentrum Publikationsmedien   | Logo-Dateien, Frutiger-Webfont-Lizenz                            |

---

## 9. Risiken

| Risiko | Massnahme |
| ------ | --------- |
| LeanIX-Modell ändert sich erneut | Mapping in Konfiguration; Sync bricht bei unbekannter Struktur ab, alter Snapshot bleibt |
| LeanIX nicht erreichbar | Snapshot-Cache, Plausibilisierung, Statusanzeige |
| Unvollständige Daten in LeanIX | Datenqualitätsbericht; Platzhaltertexte statt leerer Felder |
| Token läuft ab | Ablauf überwachen (Sync-Fehler → Admin-Hinweis), Rotation im [Betriebshandbuch](betrieb.md#6-leanix-token) |
| Zielsysteme ändern URLs | URLs nur in LeanIX gepflegt, keine Duplikate im Portal |
| API-Grenzen (Rate Limits) | Sync mit wenigen paginierten Abfragen, nie pro Seitenaufruf |

---

## 10. Offene Fragen / benötigte Informationen

### Geklärt (9.11.2026)

| Thema | Antwort / Entscheid |
| ----- | ------------------- |
| API-Zugang | Discovery erfolgreich; Token-Rolle heute *Member* → auf *Viewer* reduzieren empfohlen |
| Ressourcentypen | Noch offen, voraussichtlich vor allem Links → vorläufige Zuordnung (Kapitel 2.4), jederzeit änderbar |
| Hosting | Interner Server (Docker-Image + Postgres) |
| Zugriff | Katalog ohne Anmeldung; Admin mit SSO (SAML) wenn möglich, für den PoC zusätzlich einfache Anmeldung (Passwort) |
| Schrift | Gratis-Schrift statt Frutiger: **Source Sans 3** (SIL OFL), lokal eingebunden, ohne Google-Fonts-Abruf |
| Logo | Online beschaffen, wenn möglich über eine API (siehe `docs/branding.md`); muss im PoC nicht final sein |
| Gruppierung | Gemäss Folien: Leistungskategorie Ebene 2 = Familie, Ebene 3 = Service, darunter Leistungen |
| Freigabe | Kanal reicht; Qualitätssiegel ist kein Kriterium (Kapitel 2.2) |

### Noch offen

1. **Ressourcentypen** fachlich festlegen: Welche Typen werden Schaltflächen (Bestellen, Anfrage),
   welche Links? Mehrere Aktionen pro Leistung erlaubt?
2. **Standard-Aktion** ohne erfasste Ressource: Welche URL (Service Desk, ky2help-Startseite)?
3. **Kurzbeschreibung und Definition**: Annahme im PoC – erster Absatz der Leistungsbeschreibung
   = Kurzbeschreibung, Beschreibung der Kategorie Ebene 3 = Service-Definition. Bestätigen?
4. **Verantwortlichkeit**: Im PoC werden alle verknüpften Organisationseinheiten angezeigt.
   Personen (Leistungsverantwortliche/r) sind vorbereitet, aber ausgeschaltet
   (`CATALOG_SHOW_PERSONS`). Sollen sie sichtbar sein?
5. **Leistungen ohne Kategorie** (heute 6, u. a. «Mobile», «Schulung»): in LeanIX zuordnen oder
   im Portal unter «Weitere Leistungen» zeigen? Im PoC: ausgeblendet, im Datenqualitätsbericht.
6. **Hosting-Details**: Proxy für ausgehenden Verkehr zu `ktso.leanix.net`? Postgres vorhanden
   oder als Container? URL des Portals, Einbindung ins Intranet? Vorbereitet: Postgres als
   Container, TLS über internen Reverse-Proxy, Ausgangs-Proxy per `HTTPS_PROXY`
   ([Betriebshandbuch](betrieb.md)).
7. **SSO**: Welcher Identity Provider (z. B. Entra ID) und wer richtet die SAML-App ein?
8. **ky2help / SmartForm**: Lassen sich Formulare per URL-Parameter vorbelegen (Leistungsname/-ID)?
9. **Sprachen**: Nur Deutsch?
10. **Services und Familien ohne veröffentlichte Leistung** anzeigen (Definition und Kontakt) oder
    ausblenden? Im PoC vorläufig ausgeblendet (`CATALOG_SHOW_EMPTY_SERVICES=false`); heute
    betrifft das 26 von 29 Services und 3 von 5 Familien.

---

## 11. Discovery-Skript

`scripts/leanix-discovery.mjs` liest Datenmodell und Beispieldaten aus, nur lesend, ohne
Abhängigkeiten (Node 22+). Token und Access-Token werden weder gespeichert noch ausgegeben.

```bash
LEANIX_API_TOKEN=<token> node scripts/leanix-discovery.mjs
```

Ergebnis im Ordner `leanix-discovery/`:

| Datei                               | Inhalt                                                         |
| ----------------------------------- | -------------------------------------------------------------- |
| `summary.md`                        | Zusammenfassung: Typen, Kanal-Schlüssel, Relationen, Ressourcentypen, Anzahl Leistungen, Kategorienbaum |
| `data-model.json`, `meta-model.json`, `view-model.json`, `language-de.json` | Modell und deutsche Bezeichnungen |
| `fact-sheet-resources-model.json`   | Konfigurierte Ressourcentypen                                  |
| `graphql-schema-types.json`         | GraphQL-Schema (für typisierte Abfragen)                       |
| `sample-fact-sheet.json`            | Vollständige Beispiel-Leistung inkl. Relationen und Ressourcen |
| `all-leistungen.json`, `all-leistungskategorien.json` | Alle Leistungen (flach) und Kategorien       |
| `documents-v2-*.json`               | Vorlagen-Dokumente (zur Abgrenzung)                            |

Der Ordner enthält Inhalte aus LeanIX (Namen, Organisationseinheiten). Vor der Weitergabe kurz
prüfen; `leanix-discovery/` ist in `.gitignore` und wird nicht eingecheckt.

Gegen die echte Instanz ausgeführt am 9.11.2026 (Ergebnisse in Kapitel 2.1 und 2.5). Die
`summary.md` dieses Laufs nennt als Optionsschlüssel noch «label» und 0 Leistungen im Kanal:
Das Skript nahm damals das letzte Pfadsegment der Übersetzung
(`…fields.kanal.values.Business_IT_Servicekatalog.label`) statt des Optionsschlüssels. Das ist
behoben (Optionsschlüssel = vorletztes Segment, je Fact-Sheet-Typ und Feld, getestet in
`apps/web/scripts/leanix-discovery.test.ts`); mit den Daten dieses Laufs ergibt die
Auswertung jetzt `behoerdenLeistungen.kanal = Business_IT_Servicekatalog` und 13 von 18
Leistungen im Kanal.

---

## 12. Stand des PoC (10.11.2026)

**Umgesetzt** (Phasen 1–4 aus Kapitel 8, Teile von 5):

- Öffentliches Portal ohne Anmeldung im CD: Start mit Service-Familien und Suche, Familien-,
  Service- und Leistungsseiten, «Nächste Schritte» aus Ressourcen, Kontakt zum Service Desk,
  Volltextsuche mit Filtern (Subtyp, Leistungsbezüger), deutsche Fehlerseiten.
- LeanIX-Anbindung mit Token-Handling, paginierten GraphQL-Abfragen, Publikationsregel (Kanal
  «enthält»), Vererbung bei Eltern-/Kind-Leistungen, Ressourcen-Mapping und
  Datenqualitätsbericht.
- Snapshot-Cache in Postgres mit Plausibilisierung (Schrumpf-Schutz, Vollständigkeit, Teilfehler),
  Intervall-Sync, Advisory-Lock, Abgleich zwischen Instanzen; das Portal liest nie live aus LeanIX.
- Admin-Bereich: Passwort-Anmeldung (Ersteinrichtung über `/setup`), optional SAML-SSO,
  Katalog-Status, «Jetzt synchronisieren», letzte Läufe, Datenqualitätsbericht, Benutzer.
- Sicherheit: CSRF-/Origin-Prüfung, Sicherheits-Header (CSP), Drosselung von Fehlanmeldungen,
  Passwortregeln, kein E-Mail-Versand.
- Betrieb: Docker-Image (Standalone, inkl. Logo), Compose für den internen Server,
  Readiness-Check, Betriebshandbuch ([betrieb.md](betrieb.md)).
- Demo-Modus ohne Token (`apps/web/data/demo-catalog.json`) und LeanIX-Mock
  (`scripts/mock-leanix.mjs`) für Vorführungen und Tests; 199 automatisierte Tests.

**Geprüft:** Fünf unabhängige Prüfungen (Anforderungen, Ausfallsicherheit, CD und
Barrierefreiheit, Sicherheit, Betrieb). 59 Befunde wurden bestätigt und behoben bzw. als offener
Punkt dokumentiert. Gegen die echte LeanIX-Instanz lief bisher nur die Discovery; der erste Sync
mit dem echten Token steht noch aus.

**Datenbefunde für das Service-Management** (aus dem Datenqualitätsbericht):

- 6 Leistungen im Kanal ohne Service-Zuordnung (u. a. «Mobile», «Schulung», Testeinträge).
- Noch keine Ressourcen («Weitere Informationen») bei den Leistungen → keine Bestell-Schaltflächen.
- «SO!Desk Teamadministrator festlegen» trägt die Beschreibung eines Mitwirkungsverfahrens;
  zwei Services (IT-Arbeitsplatzinfrastruktur, SO!Workplace) haben identische Definitionen.
- «Zugang zur Mitwirkungsplattform beantragen» verlinkt auf ein LeanIX-Portal mit
  Sitzungsparametern; mehrere Beschreibungen verlinken mit `http:` statt `https:`.

**Nächste Schritte:** Token in `apps/web/.env` eintragen und ersten Sync im Admin-Bereich prüfen;
offene Fragen 1, 2 und 10 klären (Ressourcentypen, Service-Desk-Kontakt, leere Services
anzeigen); Hosting-Details (Frage 6) mit dem Betrieb abstimmen.
