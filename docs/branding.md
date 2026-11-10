# Branding: Logo Kanton Solothurn

Stand: 9.11.2026 (PoC). Gilt für das BITS-Portal (Amt für Informatik und Organisation, AIO).

## Kurzfassung

- Das Portal verwendet **`/brand/kanton-solothurn-logo.svg`**
  (Datei `apps/web/public/brand/kanton-solothurn-logo.svg`): Logo «KANTON solothurn»,
  Wappen + Schriftzug, **farbige Variante**, unverändert aus dem Seitenkopf von
  [so.ch](https://so.ch/) übernommen.
- Eine **Negativ-Variante** («negativ weiss heraldisch») ist online nicht verfügbar und wurde
  bewusst nicht abgelegt. Sie wird nicht aus der farbigen Datei abgeleitet (Umfärben wäre eine
  Veränderung des Logos, siehe CD-Manual «Logo Don'ts»).
- Es gibt **keine offizielle Logo-API**. Das Skript `scripts/fetch-logo.mjs` lädt das Logo
  reproduzierbar per HTTP-GET von so.ch und prüft es.
- Für den **Produktivbetrieb** sind die Originaldateien beim **Kompetenzzentrum für
  Publikationsmedien** zu beziehen (siehe [Produktivbetrieb](#produktivbetrieb)).

## Verwendete Quelle

| Merkmal      | Wert                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quelle       | Offizielle Website des Kantons Solothurn, <https://so.ch/>                                                                                                                              |
| Fundstelle   | Inline-SVG im Seitenkopf: `<a class="logo" …><svg id="logo" …>` (Link «Zur Hauptseite»)                                                                                                 |
| Abrufdatum   | 9.11.2026                                                                                                                                                                               |
| Format       | SVG 1.1, nur `<svg>`, `<g>`, `<path>` (18 Pfade), kein Script, keine Verweise                                                                                                           |
| viewBox      | `0 0 171.086 15.742` (Seitenverhältnis ≈ 10,87 : 1), ohne `width`/`height`                                                                                                              |
| Farben       | Wappen-Rot `#E01F26`, Wappen-Weiss `#FFFFFF`, Schrift und Bogen `#1D1D1B`                                                                                                               |
| Grösse       | 4470 Bytes                                                                                                                                                                              |
| SHA-256      | `f504a91d5818cdcc1a3e01c63baf44e5fc1544eba90494aaae87c4734d81033f`                                                                                                                      |
| Gegenprüfung | Identisches SVG (gleiche Pfade) im Seitenkopf von <https://digital.so.ch/> und der Geoportal-Seite auf so.ch                                                                            |
| Sichtprüfung | In Chromium gerendert und mit dem CD-Manual (Seite «Logo-Varianten», farbig) verglichen: Wappen als roter Balken mit Bogen, «KANTON» gesperrt, «solothurn» fett kursiv – stimmt überein |

Die Datei ist byte-genau der Ausschnitt `<svg id="logo" …>…</svg>` aus dem HTML (plus
abschliessender Zeilenumbruch). Es wurde nichts nachgezeichnet, umgefärbt oder optimiert.

## Abruf mit Skript

```sh
node scripts/fetch-logo.mjs           # laden, prüfen, nach apps/web/public/brand/ schreiben
node scripts/fetch-logo.mjs --check   # nur prüfen, ob die abgelegte Datei noch der Quelle entspricht
```

- Node 22+, keine Abhängigkeiten. Quelle mit `LOGO_SOURCE_URL` überschreibbar
  (Standard `https://so.ch/`). Hinter einem HTTP-Proxy: Node 24 mit `NODE_USE_ENV_PROXY=1`
  und `HTTPS_PROXY`.
- Prüfungen: HTTP-Status, Content-Type `text/html`, Grösse der Antwort (max. 5 MB), genau ein
  `<svg id="logo">`, SVG-Grösse 1–50 KB, SVG-Namensraum, erwartete `viewBox`, nur erlaubte
  Elemente und Attribute (kein Script, keine Entities, keine externen Verweise), erwartete
  Farben. Weicht etwas davon ab, bricht das Skript ab, statt eine andere Grafik abzulegen.
- Weicht der SHA-256 vom bekannten Stand ab, gibt das Skript einen Hinweis aus: dann das
  Ergebnis visuell prüfen und `KNOWN_SHA256` im Skript sowie diese Seite nachführen.
- Das Skript läuft **nicht** im Build und nicht zur Laufzeit; die Datei liegt im Repo
  (der Build-Server braucht kein Internet).

## Weitere geprüfte Quellen

| Quelle                                                                                                      | Ergebnis                                                                                                 | Verwendet                            |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| so.ch, Favicons und Web-Manifest (`/_assets/…/Favicon/`)                                                    | Nur App-Icons (PNG/ICO), kein Logo mit Schriftzug                                                        | Nein                                 |
| so.ch, Icon-Sprite (`/_assets/…/dist/Sprite.svg`)                                                           | Nur UI-Icons, kein Logo                                                                                  | Nein                                 |
| so.ch, Seite «Corporate Design» des Kompetenzzentrums für Publikationsmedien                                | Keine Logo-Downloads; «Das CD ist ab sofort nur noch online erhältlich», Bezug über das Kompetenzzentrum | Nein                                 |
| so.ch, Seite «Downloads» des Kompetenzzentrums                                                              | Nur Schulkartenmaterial, keine Logodateien                                                               | Nein                                 |
| rrb.so.ch, `/_assets/00835a7ba7820699b5ef0d807a3bb069/Images/Logo.png`                                      | Offizielles Logo als PNG, nur 341 × 33 px (zu klein für hochauflösende Bildschirme)                      | Nein (SVG bevorzugt)                 |
| karriere.so.ch, Inline-SVG im Seitenkopf                                                                    | Arbeitgeber-Variante mit Claim «MIT ENGAGEMENT BEWEGEN.» (viewBox `0 0 171.086 42.199`)                  | Nein (nicht für das Portal bestimmt) |
| my.so.ch, `/Htdocs/Images/logo.svg` und `logo_bottom.svg`                                                   | Produktmarke «my.so.ch», nicht das Kantonslogo                                                           | Nein                                 |
| Wikimedia Commons API (`action=query&list=search&srnamespace=6`, danach `prop=imageinfo` mit `extmetadata`) | Siehe nächste Tabelle                                                                                    | Nein                                 |
| Wikidata API (Kanton Solothurn, Q11929: Logo P154, Wappen P94)                                              | Abruf mit HTTP 429 (Rate Limit) abgewiesen, nicht ausgewertet                                            | Nein                                 |

Wikimedia Commons (Abfrage 9.11.2026):

| Datei                                                                                                       | Angaben laut Commons                                                                                   | Beurteilung                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [File:Logo solothurn.png](https://commons.wikimedia.org/wiki/File:Logo_solothurn.png)                       | PNG 341 × 33, Quelle «so.ch», Urheber «Kanton Solothurn», Lizenzangabe «Public domain»                 | Byte-identisch (SHA-1 `120ef39e…`) mit `Logo.png` von rrb.so.ch; nur Raster, daher nicht verwendet                                                         |
| [File:Solothurn.svg](https://commons.wikimedia.org/wiki/File:Solothurn.svg)                                 | SVG 176 × 112, Quelle «Brandsoftheworld.com», Urheber unbekannt, 2009, Hinweis «trademarked»           | Drittquelle bzw. Nachzeichnung, kein Original – nicht verwendet                                                                                            |
| [File:Wappen Solothurn matt.svg](https://commons.wikimedia.org/wiki/File:Wappen_Solothurn_matt.svg)         | Kantonswappen nach Fahnenreglement der Schweizer Armee (51.340 d), «Public domain», Hinweis «insignia» | Nur Wappen ohne Schriftzug; nicht abgelegt, weil das Logo mit Schriftzug verfügbar ist und das CD-Manual das Wappen nicht als Ersatz für das Logo vorsieht |
| [File:Coat of arms of Solothurn.svg](https://commons.wikimedia.org/wiki/File:Coat_of_arms_of_Solothurn.svg) | Wappen der Stadt Solothurn, eigene Zeichnung nach PNG-Vorlage                                          | Kein Original – nicht verwendet                                                                                                                            |

Die Lizenzangaben auf Commons sind Einschätzungen der Commons-Gemeinschaft, keine
Nutzungsbewilligung des Kantons.

## Nutzungsbedingungen

- **so.ch, Rechtliche Hinweise** (<https://so.ch/rechtliches/>, abgerufen 9.11.2026),
  Abschnitt «Urheberrecht»: Die auf den Webseiten publizierten Informationen (Text, Bild, Ton,
  Video) sind urheberrechtlich geschützt; die Verwendung ist nur mit vorheriger schriftlicher
  Zustimmung der Staatskanzlei gestattet. Ausgenommen sind ausdrücklich zur Weiterverwendung
  publizierte Materialien. Das Logo ist nicht als solches publiziert.
- **CD-Manual Kanton Solothurn**: Das Logo darf nur unter Rückgriff auf die Originaldateien
  verwendet werden; Bezug beim Kompetenzzentrum für Publikationsmedien. Logo nicht verändern,
  nicht nachbauen, keine Proportionen ändern.
- **Wappenschutz**: Das Kantonswappen ist als öffentliches Zeichen durch das
  Wappenschutzgesetz (WSchG, SR 232.21) geschützt; der Gebrauch ist grundsätzlich dem
  Gemeinwesen vorbehalten.
- **Beurteilung für das Portal**: Das BITS-Portal ist ein internes Angebot des Kantons (AIO).
  Für den PoC ist die Verwendung des Web-Logos unkritisch. Für den Produktivbetrieb die
  Originaldateien beziehen und die Verwendung durch das Kompetenzzentrum bestätigen lassen.

## Abweichungen und offene Punkte

1. **Farbwerte**: Das Web-SVG verwendet Rot `#E01F26` und Schwarz `#1D1D1B`; das CD-Manual
   nennt für Solothurner Rot `#CC0000`. Das Logo wird nicht umgefärbt. Die UI-Akzente des
   Portals bleiben bei `#CC0000`. Klären, welche Werte die Original-Logodatei für Bildschirme
   verwendet.
2. **Hintergrund**: Die untere Wappenhälfte ist im SVG weiss gefüllt und wird auf getönten
   Flächen sichtbar. Das farbige Logo daher nur auf **weissem Grund** einsetzen (CD-Manual,
   Don'ts: «Wappen in Rot auf mehr als 5 % Hintergrund»).
3. **Negativ-Variante / Dark Mode**: Nicht verfügbar. Bis die Originaldatei vorliegt, im
   Dark Mode entweder eine weisse Logofläche inklusive Schutzraum verwenden oder den Logoplatz
   leer lassen. Kein Ersatzschriftzug, kein umgefärbtes Logo, kein Wappen allein. Sobald
   vorhanden, als `apps/web/public/brand/kanton-solothurn-logo-negativ.svg` ablegen.
4. **Sprachvarianten** (CANTON soleure usw.) sind für das Portal nicht nötig.

## Einbindung im Portal (Hinweise für das Layout)

- Als Bild einbinden, nicht inline: `<img src="/brand/kanton-solothurn-logo.svg" …>` oder
  `next/image` (bei `.svg` automatisch `unoptimized`, siehe Next.js-Doku zu `Image`). Inline
  wäre wegen `id="logo"` im SVG anfällig für doppelte IDs.
- Die Datei hat keine `width`/`height`-Attribute: Grösse am Bild setzen und **nur eine
  Dimension** frei wählen, die andere aus dem Seitenverhältnis ableiten, z. B. Höhe 16 px →
  Breite ≈ 174 px (`width={174} height={16}` bzw. `h-4 w-auto`). so.ch verwendet
  `10.125rem × 1rem`. Nicht kleiner als 16 px Höhe, damit «KANTON» lesbar bleibt.
- **Schutzraum**: Das CD-Manual legt X = 5,5 mm bei 60 mm Logobreite fest; das entspricht
  etwa der Logohöhe. Rund um das Logo also mindestens **eine Logohöhe** Freiraum, ohne andere
  Elemente.
- **Alternativtext** (eCH-0059 / WCAG 2.1 AA): `alt="Kanton Solothurn"`. Ist das Logo ein
  Link zur Startseite, den Linkzweck benennen, z. B. `aria-label="BITS-Portal, Startseite"`
  am Link oder sichtbarer Portalname neben dem Logo.
- Logo nicht drehen, stauchen, umfärben, beschneiden oder mit Effekten (Schatten) versehen.

## Browser-Symbol (Favicon)

`apps/web/app/icon.svg` ist ein neutrales Symbol des Portals: roter Kreis (`#CC0000`) mit
weissem Pfeil, das Bedienelement «Pfeilkreis» aus dem Designsystem. Es ist bewusst **nicht**
das Logo oder Wappen (das Logo wird nicht nachgezeichnet oder beschnitten, siehe oben) und
ersetzt das Standard-Symbol des Frameworks. Stellt das Kompetenzzentrum offizielle App-Icons
bereit, diese Datei ersetzen (`icon.svg` bzw. `favicon.ico`, `apple-icon.png` in `app/`).

## Produktivbetrieb

Die Originaldateien (SVG; Varianten farbig, schwarz heraldisch und negativ weiss heraldisch)
beim **Kompetenzzentrum für Publikationsmedien** der Staatskanzlei beziehen:

- Seite «Corporate Design»:
  <https://so.ch/verwaltung/staatskanzlei/kompetenzzentrum-fuer-publikationsmedien/corporate-design/>
- E-Mail: publikationsmedien@sk.so.ch, Telefon 032 627 22 22

Danach die Dateien unter denselben Namen in `apps/web/public/brand/` ersetzen bzw. ergänzen
(`kanton-solothurn-logo.svg`, `kanton-solothurn-logo-negativ.svg`), diese Seite nachführen
und `scripts/fetch-logo.mjs` entfernen oder auf die neue Quelle umstellen (sonst meldet
`--check` eine Abweichung).
