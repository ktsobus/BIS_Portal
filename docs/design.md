---
version: alpha
name: Kanton Solothurn (so.ch)
description: >-
  Design system of the official web portal of the Canton of Solothurn,
  Switzerland (https://so.ch). A calm, service-first Swiss public-sector
  interface: slate-blue ink on white, pale tinted tiles that colour-code content
  types, pill-shaped controls, one decisive Solothurn red for every action, and
  the Frutiger typeface in exactly two weights (55 Roman and 75 Black).
  Values were captured from the live site's CSS custom properties and
  computed styles on 2026-11-09.
colors:
  # Brand and action
  primary: "#CC0000"
  on-primary: "#FFFFFF"
  # Ink and dark surfaces
  secondary: "#2F4858"
  on-secondary: "#FFFFFF"
  secondary-light: "#3A647F"
  # Neutral foundation
  neutral: "#F5F5F7"
  surface: "#FFFFFF"
  on-surface: "#2F4858"
  # Content-type tile tints
  surface-service: "#F2F7F3"
  surface-service-visited: "#E1F2E1"
  surface-news: "#E9F1F7"
  surface-contact: "#E9ECEF"
  # Lines and secondary text
  outline: "#DFDFDF"
  line: "#59839E"
  placeholder: "#757575"
  ink-black: "#000000"
  # Image overlay and logo-only colours
  overlay-ink: "#152732"
  logo-red: "#E01F26"
  logo-ink: "#1D1D1B"
typography:
  headline-display:
    fontFamily: Frutiger
    fontSize: 48px
    fontWeight: 800
    lineHeight: 1.2
  headline-lg:
    fontFamily: Frutiger
    fontSize: 36px
    fontWeight: 800
    lineHeight: 1.2
  headline-md:
    fontFamily: Frutiger
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1.2
  headline-sm:
    fontFamily: Frutiger
    fontSize: 20px
    fontWeight: 800
    lineHeight: 1.2
  title-sm:
    fontFamily: Frutiger
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.2
  lead:
    fontFamily: Frutiger
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.5
  body-lg:
    fontFamily: Frutiger
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: Frutiger
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Frutiger
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-nav-primary:
    fontFamily: Frutiger
    fontSize: 24px
    fontWeight: 800
    lineHeight: 28px
  label-nav-meta:
    fontFamily: Frutiger
    fontSize: 16px
    fontWeight: 800
    lineHeight: 24px
  label-lg:
    fontFamily: Frutiger
    fontSize: 18px
    fontWeight: 400
    lineHeight: 20px
  label-md:
    fontFamily: Frutiger
    fontSize: 16px
    fontWeight: 400
    lineHeight: 20px
  label-sm:
    fontFamily: Frutiger
    fontSize: 14px
    fontWeight: 400
    lineHeight: 18px
  label-eyebrow:
    fontFamily: Frutiger
    fontSize: 12px
    fontWeight: 800
    lineHeight: 1.2
  input-lg:
    fontFamily: Frutiger
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.15
rounded:
  none: 0px
  sm: 8px
  md: 10px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  sm-plus: 12px
  md: 16px
  md-plus: 20px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
  gutter: 48px
  card-padding: 24px
  container-padding-mobile: 16px
  container-padding-desktop: 24px
  container-small: 912px
  container-medium: 1380px
  container-full: 1920px
  sidebar-width: 250px
  header-height-mobile: 111px
  header-height-desktop: 147px
  hero-overlap: 190px
  grid-columns-desktop: 3
  grid-columns-mobile: 1
components:
  header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    height: 147px
  nav-primary-item:
    textColor: "{colors.secondary}"
    typography: "{typography.label-nav-primary}"
    padding: 11px
  nav-primary-item-active:
    textColor: "{colors.primary}"
  nav-meta-item:
    textColor: "{colors.secondary}"
    typography: "{typography.label-nav-meta}"
  search-field-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-black}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    height: 51px
  search-field-hero:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-black}"
    typography: "{typography.input-lg}"
    rounded: "{rounded.none}"
    height: 64px
  button-search-submit:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 44px
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 52px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 50px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 50px
  button-secondary-hover:
    backgroundColor: "{colors.secondary-light}"
    textColor: "{colors.on-secondary}"
  button-chip:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 20px
    height: 50px
  button-chip-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 10px
    height: 62px
  button-action-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 42px
  button-icon-circle:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 44px
  button-icon-circle-sm:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: 36px
  button-menu-toggle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 36px
  link-more:
    textColor: "{colors.secondary}"
    typography: "{typography.label-lg}"
  card-service:
    backgroundColor: "{colors.surface-service}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  card-service-visited:
    backgroundColor: "{colors.surface-service-visited}"
    textColor: "{colors.on-surface}"
  card-service-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-md}"
  card-teaser:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  card-teaser-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-sm}"
  card-teaser-title-hover:
    textColor: "{colors.primary}"
  card-news:
    backgroundColor: "{colors.surface-news}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  card-news-title:
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-sm}"
  box-contact:
    backgroundColor: "{colors.surface-contact}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  box-service-use:
    backgroundColor: "{colors.surface-service}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  breadcrumb:
    textColor: "{colors.secondary}"
    typography: "{typography.body-sm}"
    padding: 24px
  side-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    typography: "{typography.body-md}"
    width: 250px
  side-nav-item-active:
    textColor: "{colors.primary}"
  accordion-item:
    textColor: "{colors.secondary}"
    typography: "{typography.title-sm}"
    padding: 20px
  page-title-overlay:
    backgroundColor: "{colors.overlay-ink}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.headline-lg}"
    rounded: "{rounded.md}"
  footer:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.md}"
    padding: 96px
  footer-link:
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-lg}"
  footer-link-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    size: 32px
  footer-social-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    size: 30px
  footer-button-outline:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 20px
  divider:
    backgroundColor: "{colors.outline}"
    height: 1px
  divider-on-dark:
    backgroundColor: "{colors.line}"
    height: 1px
  input-placeholder:
    textColor: "{colors.placeholder}"
    typography: "{typography.body-md}"
  logo-flag:
    backgroundColor: "{colors.logo-red}"
  logo-wordmark:
    textColor: "{colors.logo-ink}"
    height: 16px
    width: 162px
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-eyebrow}"
    rounded: "{rounded.full}"
---

# Kanton Solothurn: DESIGN.md

This file describes the visual system of **so.ch**, the official portal of the Canton of Solothurn. It was reverse-engineered from the site's production stylesheet (TYPO3 theme; tokens declared as CSS custom properties on `:root`) and from computed styles of rendered pages: the home page, the services catalogue, a service detail page, a department page and a press release. Use it to build new pages, micro-sites or tools that should feel like part of so.ch.

> **Umsetzung im BITS-Portal:** Wie die Vorgaben dieser Datei mit dem
> [CD-Manual](https://github.com/ktsobus/CD-Manual-Kanton-Solothurn) zusammengeführt
> werden (freie Schrift, Aufzählungen, Absender, Logo, fehlende Fotos), steht in
> [konzept.md, Kapitel 6.2](konzept.md#62-corporate-design).

## Overview

**Swiss civic modernism: calm, factual, built around services.** The site is the front door for about 280,000 residents, businesses and 100+ municipalities. Most visitors come to *get something done* (renew a passport, register a vehicle, find an office), so the UI recedes and puts tasks first. The home page leads with a service search rather than news.

The personality is **trustworthy, approachable and unpretentious**. It is formal enough for a government but never cold:

- **Slate, not black.** All text and dark surfaces use a deep blue-grey slate (`#2F4858`) instead of pure black. This softens the whole page while keeping about 9.6:1 contrast.
- **One red, used for action.** Solothurn's heraldic red (`#CC0000`) is reserved for interaction: primary buttons, arrow glyphs, active navigation, search triggers and hover states. It is almost never used as decoration.
- **Tinted tiles instead of shadows.** Content sits on soft, rounded tiles whose pale tint tells you *what kind* of content it is: mint for services, ice blue for news, grey for teasers and contact details.
- **Pills and circles for controls, 10px corners for containers.** The shape language is friendly and consistent.
- **Generous whitespace and a one-task-per-section rhythm.** Sections are stacked vertically with clear H2 headings (*Im Fokus*, *Medienmitteilungen*, *Aus den Ämtern*).
- **Photography of the real canton**, such as Jura landscapes, the cantonal parliament and real staff, shown in 10px-rounded frames.

**Information architecture** shapes the chrome. There are two primary pillars, **Services** and **Verwaltung**, shown as large bold tabs. A meta navigation links the other branches of state (Regierung, Gerichte, Parlament), Karriere and the citizen login **my.so.ch**. A global search field is always visible on desktop.

**Language and content conventions** (de-CH):
- Swiss Standard German: never use "ß" (*Massnahmen*, not *Maßnahmen*).
- Quotes use guillemets: «Krokus».
- Dates are `DD.MM.YYYY` (05.11.2026). Times are `8.30 Uhr` or `08:00 – 11:30`. Phone numbers are `032 627 21 21` or `+41 32 627 63 70`.
- Address users with the formal *Sie*. Write service names as verb phrases (*Pass beantragen*, *Zahlungsabkommen beantragen*).
- Set `lang="de"` (or `de-CH`) on the document. Headings rely on CSS hyphenation (`hyphens: auto`), which produces breaks such as *Anmel-dung* and *biometri-sche*.

## Colors

The palette is small and disciplined: one action colour, one ink colour, white, and a family of very light tints that colour-code surfaces.

### Brand and action

- **Solothurn Red, Primary (`#CC0000`, `rgb(204 0 0)`):** the only accent. Use it for primary and action buttons, circular arrow and search buttons, arrow glyphs (→) in links, active primary-nav and side-nav items, breadcrumb chevrons, accordion chevrons, the mobile menu icon, focus and active input underlines, and link hover. White on red is 5.89:1, which passes AA for all text sizes.
- **On Primary (`#FFFFFF`):** text and icons on red.

### Ink and dark surfaces

- **Slate Ink, Secondary (`#2F4858`, `rgb(47 72 88)`):** the default colour for *all* text (`--color-typo`, `--font-color`). It is also the fill of the footer panel and of secondary buttons. 9.59:1 on white.
- **Slate Light (`#3A647F`):** hover fill for secondary (slate) buttons. White on it is 6.35:1.
- **Overlay Ink (`#152732`):** end colour of the gradient behind page titles placed over images (`linear-gradient(to bottom, rgba(47,72,88,0) 40%, #152732)`).

### Neutral foundation

- **White Surface (`#FFFFFF`):** the page background, header, side navigation and default (outline) buttons. The site has no off-white page background; tiles are tinted, the canvas is white.
- **Cloud Grey, Neutral (`#F5F5F7`):** teaser cards (*Im Fokus*) and grey filter chips (*Für Privatpersonen*).

### Content-type tile tints

These tints act as a quiet colour code. Keep each one tied to its content type.

| Token | Hex | Used for |
|---|---|---|
| `surface-service` | `#F2F7F3` (pale mint) | Service cards, the "Service nutzen" box, the responsible-office (Zuständigkeit) box |
| `surface-service-visited` | `#E1F2E1` (light mint) | `:visited` state of service cards in result lists |
| `surface-news` | `#E9F1F7` (ice blue) | Press release and news cards (*Medienmitteilungen*, *Aus den Ämtern*, *Aktuell*) |
| `neutral` | `#F5F5F7` (cloud grey) | Editorial teaser cards with images |
| `surface-contact` | `#E9ECEF` (cool grey) | Address and contact boxes (*Kantonale Verwaltung*, department contact) |

Slate text keeps at least 8:1 contrast on every tint.

### Lines and secondary text

- **Hairline (`#DFDFDF`):** borders of outline buttons, teaser cards and the mobile menu toggle. Also used for accordion, side-nav and header dividers (`--color-line-light`, `--border-color`).
- **Steel Line (`#59839E`):** dividers and outline-button borders *on the slate footer*, and the underline of large form inputs (`--color-line`).
- **Muted Grey (`#858585`, `--color-gray-dark`):** defined in the stylesheet but not used for content. It is deliberately left out of the tokens: at 3.69:1 on white it fails AA for text.
- **Placeholder (`#757575`):** input placeholder text (browser default, 4.61:1).
- **Ink Black (`#000000`):** the 1px underline of search inputs, typed input text and the copyright line. These are the only places where true black appears.

### Logo-only colours

The wordmark uses its own values: flag red **`#E01F26`** and wordmark ink **`#1D1D1B`**. Use them only inside the logo, never in UI. UI red is always `#CC0000`.

### Contrast reference

| Foreground on background | Ratio | Verdict |
|---|---|---|
| Slate `#2F4858` on white | 9.59:1 | AAA |
| White on red `#CC0000` | 5.89:1 | AA (all sizes) |
| Red `#CC0000` on white | 5.89:1 | AA (links, icons, active nav) |
| Slate on mint, ice, grey tints | 8.1 to 8.9:1 | AAA |
| White on slate | 9.59:1 | AAA |
| Red on mint `#F2F7F3` / ice `#E9F1F7` | 5.43 / 5.15:1 | AA (arrow glyphs on tiles) |
| **Red on slate** | **1.63:1** | **Fails. Never combine.** |
| Steel line `#59839E` on slate | 2.36:1 | Dividers only, never text |

## Typography

**One family, two weights.** The site uses **Frutiger** (Linotype *Frutiger LT W05*, self-hosted as WOFF2/WOFF), the humanist sans long associated with Swiss public signage. Only two cuts are loaded:

- **55 Roman (400):** body, labels, buttons, dates and meta text.
- **75 Black (requested as `font-weight: 800`):** every heading, card title and navigation label, and the "Suchen" search label.

No light, italic or medium cuts are used. When you need emphasis inside running text, use Black sparingly or rephrase. Fallback stack: `Frutiger, "Frutiger LT", "Segoe UI", Helvetica, Arial, sans-serif`. If Frutiger is unlicensed in your context, the closest free substitutes are *Hind* and *Source Sans 3* at heavy weights. Disclose this, because the Black weight carries much of the brand.

**Rhythm and settings**
- Body line height is **1.5**. Heading line height is **1.2**.
- No letter-spacing adjustments and no uppercase styling in UI. The spaced capitals in "K A N T O N" belong to the logo only.
- Headings and page titles use `hyphens: auto`, which needs a correct `lang` attribute.
- Press-release body paragraphs are **justified** (`p.text-justify { text-align: justify }`). Everywhere else text is left-aligned (ragged right).
- Links in running text are slate and **underlined**. They turn red on hover with a 0.2s ease colour transition.

### Responsive type scale

The base size steps up from 16px to 18px at the **768px** breakpoint. Headings scale with it.

| Token | Role | Mobile (<768px) | Desktop (≥768 / ≥992px) | Weight |
|---|---|---|---|---|
| `headline-display` | Landing titles (*Die Services des Kantons*), `.pagetitle.large` | 24px | 30px at 768px, **48px** / 1.2 at 992px | Black |
| `headline-lg` | Page title (H1), section headings on home (*Im Fokus*, *Medienmitteilungen*) | 20–24px | 30–36px at 768px, **36px** at 992px | Black |
| `headline-md` | Content H2/H3, service-card titles, box headings, "Suchen" label | 18–20px | **24px** | Black |
| `headline-sm` | Teaser and news card titles | 16–18px | **20px** | Black |
| `title-sm` | H4 (*Vorbedingungen*), accordion titles | 16px | **18px** | Black |
| `lead` | Lead/teaser paragraph under titles, short descriptions | 20px | **24px** / 1.5 | Roman |
| `body-lg` | Default body text on desktop, list items, footer links | — | **18px** / 1.5 | Roman |
| `body-md` | Default body text on mobile, side navigation, UI text | **16px** / 1.5 | 16px | Roman |
| `body-sm` | Breadcrumbs, card meta (office name), secondary info | 14px | **14px** / 1.5 | Roman |
| `label-nav-primary` | *Services* / *Verwaltung* tabs | 20px | **24px** / 28px | Black |
| `label-nav-meta` | *Regierung · Gerichte · Parlament · Karriere · my.so.ch* | — | **16px** / 24px | Black |
| `label-lg` | "Mehr →" text links, date lines in cards | 16px | **18px** | Roman |
| `label-md` | Button labels | **16px** / 20px | 16px | Roman |
| `label-sm` | Small buttons (`.small`) | **14px** / 18px | 14px | Roman |
| `label-eyebrow` | Tiny section labels (*Häufig gesucht*), badges | **12px** | 12px | Black |
| `input-lg` | Hero and service search input text | 20px | **24px** | Roman |

The full font-size ramp is defined as `--font-size-xs` to `--font-size-9xl`: 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96 and 128px. Stay on these steps.

## Layout & Spacing

### Grid and containers

The site uses a **centered, max-width container model** with fluid columns inside.

| Container | Max width | Used for |
|---|---|---|
| `container-small` | **912px** (57rem) | Reading column for content pages and service details |
| `container-medium` | **1380px** (86.25rem) | Home page sections, card grids, footer |
| `container-full` | **1920px** (120rem) | Header and full-bleed areas |

- Horizontal container padding is **16px** on mobile and **24px** from 992px.
- **Card grids** use **3 equal columns** with a **48px gutter** on desktop. Service and news lists collapse to 1 column on mobile, with 12px between items.
- **Content pages with a section tree** (department pages, press releases) use a two-column layout: a **250px side navigation** on the left and a content column of about 864–912px. The breadcrumb sits full-width above both. On mobile the side navigation moves into the off-canvas menu.
- **Service detail pages** put a pill **"← Zurück"** button in the left gutter and the 912px reading column to its right.
- The footer uses a 3-column grid on desktop (social and quick links | two link columns) with a 64px row gap and a 24px column gap.

### Breakpoints

| Name | Min width | What changes |
|---|---|---|
| mobile | 0 | Single column, 16px type base, hamburger menu, breadcrumb collapses to a single back link |
| tablet | **768px** | 18px type base, larger heading scale, multi-column card grids begin |
| desktop | **992px** | Full header with meta nav and inline search, 24px container padding, side navigation visible |
| large | **1200px** | Home hero overlap: the intro panel pulls up **190px** over the hero image |
| wide | **1480px** | Home intro container locks to 1380px with 48px inner padding |

### Spacing scale

Spacing follows a **4px base unit** (`--spacer-1` = 0.25rem). The scale grows in 4px steps up to 48px, then jumps: 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 112, 128, 160px. The most common values are:

- **24px:** card padding, breadcrumb padding, gaps inside boxes, default element padding. This is the workhorse value.
- **48px:** gutters between cards, bottom padding of contact boxes, gaps between sections.
- **16px:** padding inside the "Service nutzen" link box, space below headings, side-nav item padding.
- **20px:** horizontal button padding and accordion row padding.
- **96px:** top and bottom padding inside the footer panel.

### Page anatomy

1. **Header** (147px desktop, 111px mobile, white, separated by a 1px `#DFDFDF` hairline). Logo top-left. Meta nav top-right. Primary tabs (*Services*, *Verwaltung*) bottom-left. Underlined search field bottom-right.
2. **Breadcrumb** (content pages only): 14px with red chevrons, 24px padding.
3. **Hero or page title**: on the home page, a full-width landscape photo with a white panel that overlaps it; on content pages, a plain H1 or a title over an image.
4. **Stacked content sections**, each with an H2 and a grid or list, closed by a pill "Alle Beiträge →" button.
5. **Contact box** (`surface-contact`) near the end of the page.
6. **Footer**: a slate panel inset from the viewport edges, followed by a white meta row.

## Elevation & Depth

The system is **flat**. Hierarchy comes from **tonal tiles, hairlines and type weight**, not shadows.

- **Level 0, canvas:** white.
- **Level 1, tiles:** tinted fills (`surface-service`, `surface-news`, `neutral`, `surface-contact`) with no shadow. Teaser cards add a 1px `#DFDFDF` border.
- **Level 2, dark panel:** the slate footer works as the visual base of the page.
- **Hover lift (linked cards only):** `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.10)`, and the card title turns red. This is the *only* drop shadow in the system.
- **Pressed and hover buttons** sink with an *inset* shadow rather than lifting:
  - light buttons (white, grey): `inset 0 4px 10px rgba(0, 0, 0, 0.225)`
  - dark buttons (red, slate): `inset 0 4px 10px rgba(0, 0, 0, 0.45)`
- **Image title overlays:** `linear-gradient(to bottom, rgba(47,72,88,0) 40%, #152732)` keeps white page titles legible on photos.
- **Hero overlap:** on the home page (≥1200px) the white search panel overlaps the bottom of the hero photo by 190px. Its top corners are rounded at 10px. The panel reads as a sheet of paper laid on the photo, without any shadow.

Motion is minimal: colour transitions at **0.2s ease**, button state changes at **0.15s ease-in-out**, and accordion panels expand by animating `grid-template-rows` over 0.2s.

## Shapes

The shape language pairs **10px rounded rectangles for containers** with **pills and circles for controls**.

- **`rounded.md` (10px, `--border-radius: .625rem`):** every container. This covers cards, the hero image, teaser images (the top corners follow the card), info boxes, the contact box, the footer panel, the side-navigation panel and page-title images.
- **`rounded.full` (pill or circle):** every button and chip. Text buttons use `border-radius: calc(font-size × 1.6)`, which renders as a full pill at their 50–52px height. Action buttons use 50px. Icon buttons, avatar-like social icons and the menu toggle are perfect circles (`50%`).
- **`rounded.sm` (8px):** dropdown triggers inside forms only.
- **`rounded.none`:** text inputs. Search and form fields have no box at all, only a 1px bottom border (black at rest, red on focus; large inputs use steel `#59839E`).

The logo's small red flag uses a slanted, swallow-cut shape. Do not reuse it as a UI motif.

## Components

### Header and navigation

- **Logo**: red flag mark plus a small spaced "KANTON" over a bold italic "solothurn" wordmark, about 162 × 16px, top-left, linking to `/`.
- **Primary tabs** (*Services*, *Verwaltung*): `label-nav-primary` (24px Black), slate, 11px vertical padding. The **active tab is red and has a 1px red underline** that sits on the header's bottom hairline. Hover is red.
- **Meta nav**: `label-nav-meta` (16px Black, slate), spaced about 40px apart. *my.so.ch* ends with a circular user icon.
- **Header search**: a borderless 51px-high field with a 1px black bottom border, a "Suche" placeholder and a red outline magnifier icon at the right end. It takes the right column (about 570px).
- **Mobile**: the meta nav and search move into an off-canvas panel. A **36px circular toggle** (white, `#DFDFDF` border, red hamburger icon) sits top-right. The primary tabs stay visible under the logo.

### Breadcrumb

14px slate links separated by **red chevrons (›)**, with 8px gaps and 24px padding. The current page is plain text. On mobile the breadcrumb collapses to a single back link: a red "‹" followed by the parent page name.

### Side navigation (content pages)

A 250px white panel. The section root (e.g. *Staatskanzlei*) is set in red Black type. Items are 16px slate with 16px vertical padding, separated by 1px `#DFDFDF` rules. The **active page and its ancestors turn red**. Child levels are indented 16px, then 8px per further level, with a slate rule above the expanded group.

### Buttons

All buttons are **inline-flex pills** with a 16px Roman label and an optional trailing 22px icon (usually →), with an icon gap of 0.35em. The default size is about 50–52px high with `14px 20px` padding. The `.small` size uses 14px text and `12px 20px` padding.

| Variant | Fill | Text / icon | Border | Hover / active | Typical use |
|---|---|---|---|---|---|
| **Default (outline)** | White | Slate, red → | 1px `#DFDFDF` | Inset light shadow | "Alle Beiträge", "Zurück", contact pills (phone, location, contact form), table-of-contents chips |
| **Primary** | Red `#CC0000` | White | none | Inset dark shadow | Main call to action |
| **Secondary** | Slate `#2F4858` | White | none | Fill becomes `#3A647F` | "Alle Services →" |
| **Chip / grey** | `#F5F5F7` | Slate | 1px `#DFDFDF` | Fill turns **red**, text white | Audience filters (*Für Privatpersonen / Unternehmen / Gemeinden*) |
| **Action** | Red | White | none | Inset dark shadow | "Service online nutzen", "Service telefonisch nutzen". 62px tall, `10px 30px 10px 10px` padding, leading **42px white circle** holding a red icon (→ or phone) |
| **Download** | White | Slate | 1px `#DFDFDF` | Inset light shadow | File links. Leading 42px **red circle** with a white file icon, 10px radius, label shows the format and size ("Organigramm DDI (pdf, 39 KB)") |
| **Icon circle** | Red | White → | none | Inset dark shadow | 44px (36px small). Bottom-right of service cards and the search submit |
| **Search submit** | Transparent | "Suchen" in 24px Black slate | none | Inset shadow on the circle | Hero search: label plus a 44px red circle with a white magnifier |
| **Text link "Mehr →"** | none | 18px slate plus red → | none | Text turns red | End of teaser cards |
| **On dark (footer)** | Transparent on slate | White | 1px `#59839E` | Inset shadow | "Offene Stellen →", "Amtsblatt →" |

**States:**
- Hover and focus: the inset shadow listed above, plus the hover fill or colour.
- Disabled: `opacity: .5; pointer-events: none`.
- Keyboard focus on linked cards: `outline: 2px solid #CC0000; outline-offset: -2px`. Apply the same visible red outline, with a 2px offset, to buttons and links. The production CSS points button focus at an undefined variable, so do **not** copy that gap.

### Cards

All cards are 10px-radius tiles with 24px padding, laid out in a 3-column grid with 48px gutters on desktop. The whole card is clickable. A red arrow indicates the direction of travel.

- **Service card** (`card-service`): pale mint `#F2F7F3`. Title in `headline-md` (24px Black, hyphenated). Responsible office below in `body-sm` (14px). A **36px red circle with a white →** sits pinned bottom-right. Fixed height of about 285px, so cards in a row align. The `:visited` state darkens to `#E1F2E1`, so users can see which services they have already opened.
- **Teaser card** (`card-teaser`): cloud grey `#F5F5F7` with a 1px `#DFDFDF` border. A full-bleed photo (about 16:9, top corners rounded) sits on top. Then the title in `headline-sm` (20px Black), a 3–5 line description and a "Mehr →" link. On hover the card lifts (shadow) and the title turns red. **On mobile it becomes a horizontal media object**: a square image of about 140px on the left, with the title, a truncated text ending in "…" and a red → on the right.
- **News card** (`card-news`): ice blue `#E9F1F7`, no image. Title in `headline-sm` with a **red → aligned top-right**, then the date (18px). On department pages the date is followed by " | Office name". News cards on the home page sit in a 3-column grid. On content pages they stack full-width with 12px gaps.

### Boxes

- **Contact or address box** (`box-contact`): `#E9ECEF`, padding 24px (48px bottom), heading in `headline-md`. It holds a multi-column layout: address lines | opening hours | a vertical stack of outline pill buttons (phone →, location ↗, contact ↗).
- **"Service nutzen" box** (`box-service-use`): mint, 16px padding, an H2 "Service nutzen", then stacked **action buttons**.
- **Responsible office box** (Zuständigkeit): mint, 24px padding, the office name in `headline-md`, and a default "Zur Seite →" pill.

### Search

The search field is **underline-only**: no box, no radius, a 1px black bottom border and a placeholder in `#757575`. On focus the border turns **red** and the browser outline is removed.
- **Header search**: 16px text, red magnifier icon.
- **Hero and service search**: 24px text (`input-lg`), the placeholder "Suche nach Services", and the "Suchen" label plus a red circle submit at the right end. It sits inside the white overlap panel under an H2 such as *Services des Kantons*.
- **Results**: a "398 Resultate" count in body text, then a grid of service cards. Filters are grey chips above the results.

### Table of contents

The label "Inhaltsverzeichnis" (`body-sm`) sits above a wrapping row of **default outline pills**, each with a **red ↓**. Each pill jumps to a section further down the page (*Formulare*, *Vorgehen*, *Fristen und Kosten*).

### Accordion

The accordion is a flush list (max width about 910px) with **1px `#DFDFDF` rules** above each item and below the last. The trigger row has 20px vertical padding. The title is `title-sm` (18px Black, slate) and a **24px red chevron** sits on the right. On hover or focus the title turns red. When expanded (`aria-expanded="true"`) the chevron rotates 180°. The panel animates open over 0.2s.

### Page titles

- **Plain**: an H1 in `headline-lg` (36px desktop), slate, hyphenated.
- **Over image** (`.pagetitle.width-image`): a 10px-radius image of about 3:1 with the overlay gradient. A white H1 is positioned 24px from the bottom-left (16px on mobile).
- **Press release**: an eyebrow page title ("Medienmitteilung"), then the article H1, the date (18px), a **lead** paragraph (`lead`, 24px/36px) and a justified body (18px/27px).

### Content text

H2 sits in `headline-md` with about 20px above and 16px below. H4 sits in `title-sm`. Paragraphs and lists use `body-lg` with 18px bottom margin. Bulleted and numbered lists use standard markers with about 24px indent. Inline links are underlined.

### Footer

- **Panel**: slate `#2F4858`, 10px radius, inset 24px from the viewport sides, with 96px vertical padding.
- **Column 1, "Bleiben Sie informiert"** (16px Black, white): social links (Facebook, X, Instagram, LinkedIn) at 18px white, each with a **30px white circle holding a red brand glyph**. Below them sits a stack of on-dark outline pills (*Offene Stellen*, *Amtsblatt*, *Bereinigte Gesetzessammlung (BGS)*).
- **Columns 2–3, "Direktlinks"**: two link lists. Each row is an 18px white label with a **32px white circle holding a slate →** at the right, separated by 1px **steel `#59839E`** rules with 24px vertical spacing.
- **Meta row** (on white, below the panel): "© 2026, Kanton Solothurn" in black, then slate links (*Rechtliches, Impressum, Offene Stellen, Newsletter*) spaced 24px apart.

### Iconography

The icons are a single **thin-stroke outline set** (about 1.5px stroke, rounded caps), drawn as inline SVG and filled with `--icon-color`. The default size is 22px (18px in small buttons, 24px in accordions).

| Glyph | Meaning |
|---|---|
| → | Go to, read more |
| ↓ | Jump to a section on the same page |
| ↗ | External link or new window |
| ‹ › | Back, breadcrumb |
| ⌄ | Accordion |

Other icons: magnifier (search), user circle (my.so.ch), phone, file (download) and a hamburger with three lines (menu).

Icons are **red on light** surfaces and **white inside red circles**. On the slate footer they are **slate inside white circles** or **red inside white circles** (social).

## Do's and Don'ts

**Do**
- Use **Solothurn Red `#CC0000` only for interaction and state**: buttons, arrows, active navigation, focus, hover. If something is red, it should be clickable or currently selected.
- Set **all text in Slate `#2F4858`**. Reserve black for input underlines, typed input text and the copyright line.
- **Colour-code tiles by content type**: mint for services, ice blue for news, grey for editorial teasers, cool grey for contact. Keep these mappings stable across pages.
- Use **10px corners for every container** and **pills or circles for every control**.
- Use **only Frutiger 55 Roman and 75 Black**. Headings are always Black, body is always Roman.
- End navigational cards and links with a **red → arrow**. Use ↓ for in-page jumps and ↗ for external links.
- Keep layouts **flat**: tinted fills and 1px `#DFDFDF` hairlines. Lift linked cards on hover with the single defined shadow.
- Respect the **4px spacing scale**, the 24px card padding, the 48px grid gutters and the 912px reading width.
- Keep **one primary task visible per section** (search on the home page, "Service online nutzen" on service pages).
- Write in **Swiss Standard German**: no ß, «guillemets», DD.MM.YYYY dates. Set `lang` so hyphenation works.
- Provide a **visible 2px red focus outline** on every interactive element, and keep tap targets at least 44px (36px only for compact icon circles that sit inside a larger clickable card).

**Don't**
- Don't put **red text or icons on the slate footer** (1.63:1). On dark surfaces, use white, or red inside a white circle.
- Don't use the logo colours (`#E01F26`, `#1D1D1B`) in UI, and don't recolour or redraw the logo.
- Don't introduce new accent hues, gradients (except the photo-title overlay) or decorative colour blocks. The palette is intentionally austere.
- Don't use drop shadows on static tiles, buttons or panels. Buttons *sink* (inset shadow) on interaction; they never lift.
- Don't draw boxed or rounded text inputs. Inputs are underline-only.
- Don't use square-cornered buttons or mix radii. Containers are 10px, controls are pills or circles.
- Don't use `#858585` or lighter greys for readable text. They fail WCAG AA.
- Don't use uppercase, letter-spacing or italic for UI labels. Emphasis comes from Frutiger Black and size.
- Don't use justified text outside press-release body copy, and never on narrow mobile columns without hyphenation.
- Don't place more than one red primary or action button group per section. Pair it with outline (default) pills for secondary options.
