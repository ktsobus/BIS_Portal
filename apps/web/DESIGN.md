---
name: BITS-Portal
description: Business IT service catalogue of the Kanton Solothurn (AIO), built from the canton's corporate design manual transferred to the screen.
colors:
  red: "#cc0000"
  red-strong: "#a70000"
  red-tint: "#fbeded"
  red-line: "#f0b3b3"
  blue: "#104e8b"
  blue-strong: "#0c3b68"
  blue-tint: "#ecf1f6"
  blue-tint-strong: "#d9e3ec"
  blue-line: "#b7cadc"
  green: "#228b22"
  green-strong: "#1b6f1b"
  green-tint: "#e9f3e9"
  green-line: "#b2d6b2"
  orange: "#ff8c00"
  orange-strong: "#945100"
  orange-tint: "#fff1e0"
  orange-line: "#ffcb8c"
  ink: "#000000"
  text: "#333333"
  muted: "#646b76"
  line-strong: "#868c94"
  line: "#d7d9db"
  ground-strong: "#e9eaec"
  ground: "#f4f5f5"
  white: "#ffffff"
typography:
  display:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.12
  display-sm:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "1.5625rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "1.3125rem"
    fontWeight: 700
    lineHeight: 1.35
  subtitle:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.5
  lead:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.5
  label-sm:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.45
  caption:
    fontFamily: '"Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  mono:
    fontFamily: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  gutter: "1.25rem"
  gutter-md: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.red-strong}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-secondary-hover:
    backgroundColor: "{colors.ground}"
  button-secondary-active:
    backgroundColor: "{colors.ground-strong}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.blue}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-quiet-hover:
    backgroundColor: "{colors.blue-tint}"
  button-quiet-active:
    backgroundColor: "{colors.blue-tint-strong}"
  button-danger:
    backgroundColor: "{colors.white}"
    textColor: "{colors.red}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-danger-hover:
    backgroundColor: "{colors.red-tint}"
  button-sm:
    height: "32px"
    padding: "0 12px"
  button-lg:
    height: "48px"
    padding: "0 20px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  help-panel:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  input-disabled:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.muted}"
  search-input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "52px"
    padding: "0 16px 0 48px"
  badge:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  status-marker:
    backgroundColor: "{colors.muted}"
    size: "10px"
  status-marker-ok:
    backgroundColor: "{colors.green}"
  status-marker-warning:
    backgroundColor: "{colors.orange}"
  status-marker-error:
    backgroundColor: "{colors.red}"
  status-marker-info:
    backgroundColor: "{colors.blue}"
  title-square:
    backgroundColor: "{colors.red}"
    size: "0.4em"
  notice-info:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  notice-ok:
    backgroundColor: "{colors.green-tint}"
  notice-warning:
    backgroundColor: "{colors.orange-tint}"
  notice-error:
    backgroundColor: "{colors.red-tint}"
  table-header:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.muted}"
    typography: "{typography.label-sm}"
    padding: "10px 16px"
  table-cell:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    padding: "12px 16px"
  nav-link:
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px"
  nav-link-hover:
    backgroundColor: "{colors.ground}"
  nav-link-current:
    textColor: "{colors.ink}"
  admin-nav-link:
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 12px"
  admin-nav-link-hover:
    backgroundColor: "{colors.ground}"
  admin-nav-link-current:
    backgroundColor: "{colors.blue-tint}"
    textColor: "{colors.ink}"
  dialog:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    width: "32rem"
  toast:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  switch:
    backgroundColor: "{colors.ground-strong}"
    rounded: "{rounded.full}"
    width: "44px"
    height: "24px"
  switch-checked:
    backgroundColor: "{colors.blue}"
---

# Design System: BITS-Portal

## Overview

**Creative North Star: "The Canton's Letterhead, on Screen"**

BITS-Portal is the conventional service portal, played straight: a search-led start page, service families as cards, a next-step button on every Leistung, and a standard admin shell with a sidebar. There is no concept, metaphor or ornament on top of that. What makes it the canton's portal is the corporate design manual of the Kanton Solothurn, which is the only visual reference. The manual was written for print; its rules are carried to the screen by analogy, and nothing is used that the manual does not provide for.

The result is flat and quiet. A white header and a white page head sit on a light grey ground. Content lives in white cards with a hairline border and small radii. Solothurner Rot is spent on a few things only: the primary action, the mark on the current navigation item, the square beside each page title, and errors. Blue carries links, focus and help. Text is left-aligned, with hierarchy from size and two weights.

The theme is light only. Dark mode is deliberately absent: the colour logo may only sit on white, and no negative logo is on hand. `html` declares `color-scheme: light` and there are no dark variants anywhere. Do not add one until the original negative logo file exists (see `docs/branding.md`).

Motion is limited to state changes: colour transitions of 150ms, a 160ms fade for dialogs, a 180ms rise of 6px for toasts, all on one ease-out curve. Nothing animates on page load. `prefers-reduced-motion` collapses every animation and transition.

All tokens live in the `@theme` block of `app/globals.css`. That block is the single source for colour, the type scale, radii and motion; components use the generated utilities and never write raw values.

**Key Characteristics:**
- Conventional service portal: search first, family cards, a next step on every Leistung, sidebar admin.
- Every colour comes from the CD manual or is a tint or shade of one of its colours.
- Flat: no shadows, no gradients; white surfaces on a grey ground, separated by hairlines.
- One typeface, two weights (400 and 700), a fixed rem scale.
- A red square beside every page title; small squares, not dots, as status markers.
- Left-aligned text, prose measure of 70 characters, «Guillemets» and en dash lists.
- Light theme only.

### Adaptations of the CD manual

Three places depart from the letter of the manual. Each is deliberate; keep them, and do not add others without recording them here.

- **Open Sans instead of Frutiger LT Std.** No web licence is available for the house typeface. Open Sans (SIL OFL, self-hosted) stands in; the manual's own fallback, Arial, follows it in the font stack.
- **Admin page titles sit on the grey ground.** Public pages put the title in a white page head. In the admin area the white surface is the sidebar, and the title with its red square stands directly on the ground above the content.
- **The logo file comes from so.ch.** It is the unmodified inline SVG from the canton's website, pending the original files from the Kompetenzzentrum für Publikationsmedien. Provenance and open points are in `docs/branding.md`.

## Colors

The palette is the CD manual's: Solothurner Rot, black and white, the two graphic neutrals, and three of the manual's chart colours for links and state. Tailwind's default palette is removed (`--color-*: initial`), so a colour that is not a token does not exist.

### Primary
- **Solothurner Rot** (`red`, #cc0000): the primary button, the mark on the current navigation item, the square beside the page title, error text and the error marker. Also the «Alle anzeigen» link that closes a family card.
- **Solothurner Rot, shade** (`red-strong`, #a70000): hover and pressed state of the primary button and of red links.
- **Solothurner Rot, tints** (`red-tint` #fbeded, `red-line` #f0b3b3): fill and border of an error notice; hover fill and resting border of the danger button.

### Secondary
- **DodgerBlue4** (`blue`, #104e8b): text links, the focus ring, the text caret, the quiet button, the info marker, the icon of the current admin navigation item and the switch when on.
- **DodgerBlue4, shade** (`blue-strong`, #0c3b68): hover state of links.
- **DodgerBlue4 8 %** (`blue-tint`, #ecf1f6): the tint from the canton's PowerPoint template. Fill of the help panel and of info notices, the highlighted search suggestion, the current admin navigation item, hover on service links in a family card.
- **DodgerBlue4, further tints** (`blue-tint-strong` #d9e3ec, `blue-line` #b7cadc): text selection and the pressed quiet button; border of an info notice.

### Tertiary
- **ForestGreen** (`green`, #228b22): the square that marks «in order». Its shade `green-strong` (#1b6f1b) is used for icons; `green-tint` and `green-line` are fill and border of a success notice.
- **DarkOrange1** (`orange`, #ff8c00): the square that marks a warning. Its shade `orange-strong` (#945100) is used for icons; `orange-tint` and `orange-line` are fill and border of a warning notice.

### Neutral
- **Black** (`ink`, #000000): titles (h1 to h4), labels, bold names, the text of secondary buttons, input text. At 45 % opacity it is the scrim behind dialogs.
- **Grafik-Schwarz** (`text`, #333333): body text.
- **Grafik-Grau** (`muted`, #646b76): secondary text, counts, placeholders, resting icons, table header text, the neutral status marker.
- **Grafik-Grau, tints** (`line-strong` #868c94, `line` #d7d9db, `ground-strong` #e9eaec, `ground` #f4f5f5): `line-strong` borders inputs, secondary buttons and floating layers; `line` is the hairline around cards and between rows; `ground` is the page ground, table headers, badges and code wells; `ground-strong` is the skeleton and the pressed secondary button.
- **White** (`white`, #ffffff): header, page head, cards, footer, sidebar, inputs, dialogs. The logo stands on white only.

### Named Rules
**The Manual-Only Rule.** Every colour is a CD-manual colour or a tint or shade of one. A new colour is a new token in `@theme`, derived from a manual colour and commented with its source. No hex values, no arbitrary colour utilities and no gradients in components.

**The One Red Button Rule.** A group of actions (a form, a button row, a page header, a dialog footer, the actions of one Leistung) has at most one red button. Everything else in the group is secondary or quiet.

**The Never-Colour-Alone Rule.** State is never carried by colour alone. A status is a coloured square plus a word; a notice is an icon plus a title or sentence; an invalid field has a red border plus a bold red message below it.

**The Strong-Shade Rule.** ForestGreen and DarkOrange1 at full strength fill the 10px status square and nothing else. Icons on a light fill use `green-strong` and `orange-strong`. Status wording is always set in `ink`, never in the state colour.

## Typography

**Display Font:** Open Sans (with Arial, Helvetica Neue, Helvetica, sans-serif)
**Body Font:** Open Sans (same stack)
**Label/Mono Font:** system monospace stack (ui-monospace, Cascadia Mono, Segoe UI Mono, Consolas, Liberation Mono) for identifiers, codes and URLs only

**Character:** One humanist sans in the Frutiger lineage, standing in for the house typeface Frutiger LT Std, for which no web licence is available. It is self-hosted in `public/fonts/open-sans/` (SIL OFL, licence text beside the files), in latin and latin-ext subsets; the portal makes no font request to a third-party host. The files are variable, but only 400 and 700 are used, each with its italic. `.impeccable/config.json` records the detector exception for `overused-font` on Open Sans, with this reason.

### Hierarchy
- **Display** (700, 2.5rem, line-height 1.12): the page title on public pages from `md`. Below `md` it is 1.875rem.
- **Display small** (700, 1.875rem, line-height 1.2): the page title in the admin area from `md` (1.5625rem below), and the public page title on phones.
- **Headline** (700, 1.5625rem, line-height 1.25): section headings on a page («Service-Familien», «Leistungen», «Datenqualität») and the figures in the admin status card.
- **Title** (700, 1.3125rem, line-height 1.35): card titles, the help panel title, dialog titles, the result count.
- **Subtitle** (700, 1.125rem, line-height 1.5): the name of a Leistung or search result in a list, headings inside admin cards, headings inside prose.
- **Lead** (400, 1.125rem, line-height 1.5): the one- or two-line introduction under a page title, capped at 40rem.
- **Body** (400, 1rem, line-height 1.55): running text, input text, public navigation. Prose is capped at 70ch.
- **Body small** (400, 0.875rem, line-height 1.5): supporting text in cards, table cells, hints, the footer.
- **Label** (700, 0.875rem): field labels, button text, status wording, small headings in side columns and the footer.
- **Label small** (700, 0.8125rem): badges and table headers.
- **Caption** (400, 0.8125rem, line-height 1.45): the organisational path under a unit name, definition-list labels, keyboard hints.
- **Mono** (400, 0.8125rem to 0.875rem): LeanIX ids, issue codes, SAML URLs, recovery codes.

The scale is fixed in rem (ratio about 1.2); there is no fluid type. Headings use `text-wrap: balance`, paragraphs and list items `text-wrap: pretty`, tables tabular figures.

### Named Rules
**The Two Weights Rule.** Regular (400) and bold (700), nothing between and nothing heavier. Hierarchy comes from size. Italic appears in one place: the sender in the footer, with the office name in bold italic and the two lines below it in regular italic.

**The Left Edge Rule.** Text is left-aligned and ragged right. Nothing is centred, nothing is justified. Running text stops at about 70 characters.

**The Manual Punctuation Rule.** UI text uses «Guillemets», the en dash as list marker in prose, and the real ellipsis (…). German in Swiss orthography: ss, never ß. No uppercase labels and no letter-spaced text; the only tracked text is the six-digit code field.

## Layout

**Page grid.** One container (`.container-page`) sets the same left and right edge for header, page head, content and footer: maximum width 75rem, side gutter 1.25rem, 2.5rem from 48rem. Breakpoints are Tailwind's defaults: `sm` 40rem, `md` 48rem, `lg` 64rem.

**Public pages.** Top to bottom: a white header (logo, portal name, two navigation links at the right; minimum height 68px), a white page head closed by a hairline (breadcrumbs, title with red square, optional badges, lead, and whatever the page needs first, such as the search field), the content on the grey ground, and a white footer. The page head has three paddings: spacious on the start page, compact with breadcrumbs, and standard without.

- Start page: family cards in one column, two from `md`, three from `lg`, with 20px gaps. The help panel takes the last cell of the grid.
- Service and Leistung pages: one column, from `lg` a main column plus a 22rem side column that sticks 24px below the top. On a Leistung page below `lg` the «Nächster Schritt» card moves above the description, and the remaining details follow it.
- Sign-in, setup and two-factor pages: a single left-aligned card, 28rem to 36rem wide, at the content edge. Forms are not centred on the page.

**Admin area.** From `lg` a fixed 17rem white sidebar (logo, area name, navigation, link back to the catalogue, signed-in person and sign-out) beside the content, which stands on the grey ground with a maximum width of 72rem and gutters of 20px (40px from `md`). Below `lg` the sidebar becomes a white block at the top with the four destinations in a two-column grid, and the account line moves into a white bar at the bottom.

**Rhythm.** Card padding is 24px (20px in list rows and in side-column cards). Content blocks on the ground have 32px vertical padding, 40px from `md`. Sections inside a page are 40px apart, a heading and its card 16px. Buttons in a row are 12px apart, stacked action buttons 8px. Form fields are 16px apart, with 6px between label, control and message.

**Responsive rules.** Tables become labelled blocks below `md` (see Components). Breadcrumbs become a single back link to the parent below `md`. The red title square moves from the margin to above the title below `md`. The portal name beside the logo hides below 30rem. No page scrolls sideways.

## Elevation & Depth

The system is flat. The CD manual rules out shading, so every shadow token is removed (`--shadow-*`, `--drop-shadow-*`, `--inset-shadow-*: initial`) and shadow utilities produce nothing. Depth is conveyed by three means: white surfaces on the grey ground, a 1px hairline (`line`) around and between things, and a stronger 1px border (`line-strong`) on anything that floats above the page (dialog, search suggestions) or takes input. Toasts are outlined in `ink`, error toasts in `red`. A dialog sits on a scrim of black at 45 % opacity.

Stacking order: search suggestions 30, dialog scrim 40, dialog 50, toasts 60.

### Named Rules
**The Hairline Rule.** Separation is a 1px line or a change from white to grey. Never a shadow, never a gradient, never a blur.

**The Flat Hover Rule.** Hover and pressed states change fill or border colour. Nothing lifts, scales or gains a shadow. The one movement on hover is the arrow of a «Details» or «Alle anzeigen» link, which shifts 2px to the right.

## Shapes

Corners are small and consistent: 4px for badges, code wells and the focus shape of text links; 6px for buttons, inputs, notices, toasts, navigation items and the suggestion list; 8px for cards, tables, the help panel and dialogs. Borders are always 1px.

The square is the system's own mark and is never rounded: the red square beside the page title, the 10px status marker, the 8px red square on the current admin navigation item. The 2px red bar under the current public navigation item belongs to the same family.

The full radius exists for the switch (a 44 by 24px track with a 16px thumb). It is not a general shape: no pills for badges, buttons or chips.

Focus is one shape everywhere: a 2px DodgerBlue4 outline, offset by 2px, on every focusable element. Components do not define their own focus style.

Icons are Lucide line icons, 16 to 20px (1.125em inside buttons), always beside a text label or carrying an `aria-label` when they stand alone (close, clear, show password). Links that leave the portal carry a small arrow pointing up and right and the hidden text «(öffnet in neuem Tab)».

## Components

Primitives are in `components/ui`, the public shell in `components/site`, the admin shell in `components/admin`, feature UI in `features/*/components`. Use the primitive; do not rebuild its classes in a feature.

### Buttons
- **Shape:** gently rounded (6px), 1px border, bold label. Three heights: 32px (`sm`, in table rows and notices), 40px (`md`, default), 48px (`lg`, page-level actions and form submits). A link that looks like a button uses the same classes through `asChild` or `buttonClass`.
- **Primary:** Solothurner Rot fill, white text; hover and pressed darken to `red-strong`. One per group.
- **Secondary (default variant):** white fill, `line-strong` border, black text; hover turns the border black and the fill to `ground`.
- **Quiet:** no border or fill, blue text; hover fills with the 8 % blue tint. For low-weight actions such as «Suche zurücksetzen».
- **Danger:** white fill, `red-line` border, red text; hover fills with `red-tint`. It opens a destructive step (delete an account, remove a provider, switch off two-factor). The confirming button inside the confirmation dialog is the primary button.
- **States:** colour transitions of 150ms. Disabled is 50 % opacity without pointer events. `loading` shows the spinner before the label and disables the button.

### Action links (next step)
Signature component. The actions of a Leistung or service (order, request, contact) render as a row of buttons, or stacked at full width in a side column. They are links to the target system; `http(s)` targets open in a new tab with the outward arrow, `mailto` and `tel` carry a mail or phone icon. Long labels wrap; the button grows instead of truncating.

- The primary action is the first order path, otherwise the first request path. It is the only red button of the group.
- The service-desk fallback action (shown when a Leistung has no order or request path of its own) is secondary wherever it repeats: in lists and in the help panel. In the footer it is a bold text link. It is red in one place only: the «Nächster Schritt» card of a Leistung page, where it is the single next step.

### Badge and Status
- **Badge:** a label without state, such as the subtype of a Leistung. `ground` fill, hairline border, 4px radius, bold 0.8125rem text.
- **Status:** a 10px square in the state colour (neutral grey, green, orange, red, blue) followed by bold black wording. Used in the footer («Aktuell»), in tables and in the admin status card. The square is decorative (`aria-hidden`); the word carries the meaning.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** white, on the grey ground.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px hairline (`line`).
- **Internal Padding:** 24px; a card that holds a list has no padding of its own and its rows carry 20px vertical and 20px (24px from `md`) horizontal padding, separated by hairlines.
- Cards are never nested. Structure inside a card comes from hairlines, definition lists and headings. A framed block inside a card is either a notice or a `ground` well for codes.
- **Help panel:** the one tinted container. 8 % blue fill, 8px radius, no border, 24px padding, with the title «Nichts Passendes gefunden?» and the service-desk contact. One per page at most.
- **Side-column sections:** not cards. A hairline on top, a small bold heading, then small text.

### Inputs / Fields
- **Style:** white fill, 1px `line-strong` border, 6px radius, 40px high, 1rem black text, grey placeholder. Hover turns the border black.
- **Focus:** the global blue outline; the border does not change.
- **Error / Disabled:** invalid fields get a red border and a bold red message below, which replaces the hint. Disabled fields are `ground` with grey text.
- **Field layout:** bold label above, control, then hint or error. Optional fields say «(optional)» in regular grey after the label. Forms use `Field` with react-hook-form.
- **Select:** the native control with a chevron at the right.
- **Password:** an eye button inside the field toggles visibility.
- **Code input:** one field for the six-digit code, 48px high, bold 1.3125rem, tabular figures, widely spaced.
- **Switch:** for a setting that applies at once. Off: `ground-strong` track with a grey thumb. On: blue track with a white thumb. Its label and explanation stand to the left as text.

### Search
Signature component. On the start page: a 52px search field with a magnifier icon, the placeholder «Was benötigen Sie?» and a red «Suchen» button of the same height, left-aligned and capped at 45rem. It is a WAI-ARIA combobox: suggestions appear while typing (two characters or more, six at most), arrow keys move through them, Enter opens the chosen entry or the full result list, Escape closes, and «/» focuses the field from anywhere (shown as a small key hint from `md`). The suggestion list is a white layer with a `line-strong` border; the active row has the 8 % blue tint. Each suggestion shows the name in bold, its context in grey and its kind at the right.

The result page filters in the browser on every keystroke and keeps the address shareable. Results are one card of rows; the whole row is the link target and turns `ground` on hover.

### Navigation
- **Header:** white, closed by a hairline. Logo at the left, a hairline divider, the portal name in bold, navigation at the right.
- **Public navigation:** two text links, 44px high. Hover fills with `ground`. The current one is bold black with a 2px red bar beneath it.
- **Admin navigation:** four items with a 16px icon, 40px high. The current one has the 8 % blue fill, bold black text, a blue icon and an 8px red square at the right edge.
- **Breadcrumbs:** small grey text with chevrons, the current page in body colour. Below `md` only a back link to the parent.
- **Skip link:** «Zum Inhalt springen», visible on focus.

### Page title and page head
Signature component. Every page title has the red square of the CD manual. From `md` the square (0.4em of the title size) hangs in the left margin, so the title text stays flush with breadcrumbs and body text. Below `md` it is a 12px square above the title. Public pages wrap the title in the white page head; admin pages place it directly on the ground, with a one-line description below and the page's primary action at the right.

### Logo
«KANTON solothurn» is an image from the original file (`public/brand/kanton-solothurn-logo.svg`), 16px high, 20px from `sm`, with the alt text «Kanton Solothurn». It stands on white only, and the link around it keeps one logo height of clear space on every side. It is never redrawn, recoloured, cropped, inlined or given an effect. The logo's own red differs from the UI red; neither is adjusted to the other.

### Footer and sender
White, with a hairline on top. Three columns from `md`: the sender, the service desk, the state of the catalogue. The sender follows the CD manual: «Amt für Informatik und Organisation» in bold italic, then «Business IT-Services» and «Kanton Solothurn» in regular italic. The catalogue state is a Status square with wording, the date of the snapshot and its source. A second, quieter line holds the portal name and the sign-in link for the admin area.

### Notices and toasts
- **Notice:** a message in the page flow. Tinted fill and matching border in the state colour (info blue, success green, warning orange, error red), 6px radius, a Lucide icon at the left, an optional bold title, text, and an optional small button. Errors are announced at once (`role="alert"`).
- **Toast:** the result of an action, bottom right, for six seconds. White, outlined in black (or red for an error), with an icon, a bold title and a close button. It rises 6px while fading in.

### Tables
A table sits in a white frame with a hairline border and 8px radius. Header cells are small bold grey text on `ground`; body cells are small text with 12px vertical padding, separated by hairlines. Below `md` the header is hidden and every row becomes a block: each cell is a line with its column title above it in small grey text (pass `label` to `Td`). Row actions are small buttons, right-aligned from `md`.

### Dialogs
Dialogs are for tasks that need protected focus, and only for those: creating an admin account, adding a SAML provider, and confirming a step that cannot be undone or that changes access (delete an account, change a role, remove a provider). Everything else happens in the page.

- **Dialog:** white, 8px radius, `line-strong` border, centred on a 45 % black scrim, 32rem wide (42rem for the SAML form). Header with title, optional description and a close button; the body scrolls; the footer holds secondary «Abbrechen» and one primary button, right-aligned.
- **Confirm dialog:** 28rem wide, title as a question, one or two sentences that name the object and the consequence, «Abbrechen» and a red button whose label repeats the action.

### Loading and empty states
- **Skeleton:** `ground-strong` blocks in the shape of the content, pulsing softly, inside the card that will hold the content.
- **Spinner:** a 0.9s ring in the current text colour, inside buttons and status lines.
- **Empty and error states:** a plain card or the page head with a sentence that says what is missing and why, and the next step as a button. Gaps in the LeanIX data are stated, not filled.

### Prose
Descriptions from LeanIX (Markdown) render in `.prose`: 70ch measure, paragraphs 1em apart, headings at 1.125rem bold, blue underlined links, unordered lists with an en dash in grey as marker, ordered lists with numbers, `ground` wells with a hairline for code. Headings from LeanIX start at h3 so the page outline stays valid.

## Do's and Don'ts

### Do:
- **Do** take every colour from the tokens in `app/globals.css`. If a role is missing, add a token derived from a CD-manual colour and note its source in the comment.
- **Do** give each group of actions one red button at most, and make it the step the visitor most likely came for.
- **Do** keep the service-desk fallback action secondary in lists and the help panel and a text link in the footer; make it red only in the «Nächster Schritt» card of a Leistung page.
- **Do** put the red square beside every page title through `PageTitle` (or `PageHead` / `AdminPageHeader`, which use it).
- **Do** show state as a square plus a word (`Status`) or an icon plus text (`Notice`).
- **Do** build containers with `Card`: white, 1px hairline, 8px radius, 24px padding.
- **Do** give every table cell a `label` so the table stacks into labelled blocks below `md`.
- **Do** left-align everything and cap running text at 70ch (lead text at 40rem).
- **Do** write UI text with «Guillemets», the en dash for prose lists, the real ellipsis and Swiss orthography (ss).
- **Do** keep the logo on white, at 16 to 20px height, with one logo height of clear space.
- **Do** limit motion to state changes of 150 to 180ms on the `--ease-out` curve.
- **Do** rely on the global focus outline (2px blue, 2px offset).

### Don't:
- **Don't** use a colour outside the CD manual, a gradient or a shadow. The default palette and all shadow tokens are removed on purpose.
- **Don't** add a dark theme while no negative logo is on hand.
- **Don't** use red for decoration, for ordinary text links or for more than one button in a group.
- **Don't** nest a card in a card, and don't lift cards on hover.
- **Don't** signal state by colour alone, and don't set text in ForestGreen or DarkOrange1.
- **Don't** use dots or pills as status markers; the marker is a square.
- **Don't** centre text, justify text or set labels in uppercase.
- **Don't** add a third weight or a second typeface. Mono is for identifiers and codes only.
- **Don't** let a table scroll sideways on a phone.
- **Don't** open a dialog for something that can happen in the page. Dialogs are for creating an account, adding a SAML provider and confirming a step that cannot be undone or that changes access.
- **Don't** redraw, recolour, crop or inline the logo, and don't place it on the grey ground or a tint.
- **Don't** animate on page load or add entrance choreography.
- **Don't** invent content to fill a gap in the LeanIX data: no placeholder contacts, no stock imagery, no illustrative numbers.
