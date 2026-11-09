# BITS-Portal

Kantonsinternes Serviceportal für die Business-IT-Services des AIO (Kanton Solothurn).
Datenquelle ist SAP LeanIX (`https://ktso.leanix.net`); angezeigt werden Leistungen im Kanal
«Business IT-Servicekatalog», gruppiert nach Leistungskategorie.

- **[Analyse und Umsetzungsplan](docs/konzept.md)** – Datenmodell, Architektur, Caching, Design, offene Fragen
- **[Discovery-Skript](scripts/leanix-discovery.mjs)** – liest das LeanIX-Datenmodell aus (nur lesend)

Techstack: [Laeri/dev-template](https://github.com/Laeri/dev-template) ·
Design: [Designsystem so.ch](docs/design.md) auf Grundlage des
[CD-Manuals Kanton Solothurn](https://github.com/ktsobus/CD-Manual-Kanton-Solothurn)

## LeanIX-Discovery ausführen

Voraussetzung: Node 22+ und der API-Token eines technischen Benutzers (Rolle Viewer genügt).

```bash
LEANIX_API_TOKEN=<token> node scripts/leanix-discovery.mjs
```

Ausgabe im Ordner `leanix-discovery/` (nicht eingecheckt), Zusammenfassung in
`leanix-discovery/summary.md`.
