---
version: 1
slug: "app-public-page-tsx"
primary_target: "app/(public)/page.tsx"
related_targets: ["app/(public)","app/(app)","app/setup"]
---

# BITS-Portal: whole frontend (public catalog, sign-in, admin)

Scope: every route of `apps/web`. Visitor mode: Operate. Replacement visual world (ground-up rebuild, 10.11.2026); the earlier UI is neither reference nor authority.

Audience and job: canton employees (non-IT and IT coordinators alike) find a Leistung and take its next step; AIO service management checks sync health and data quality and manages admin access. Content comes from the LeanIX snapshot only.

Constraints: CD manual Kanton Solothurn is the only visual reference (colours, logo, typographic rules). No Frutiger licence; self-hosted replacement delegated. Light theme only: no negative logo is on hand, and the colour logo may only sit on white.

Chosen direction: the conventional service portal, played straight (owner took the standing exit over the assigned and challenger directions). Quality bar: Swiss public-sector web (so.ch, admin.ch design system), enterprise service portals (ServiceNow Employee Center, Jira Service Management), polished SaaS product UI (Linear, Stripe Dashboard, Vercel).

Memorable moment: search answers while typing and every Leistung shows its next step as a button right where it is listed.

Unresolved: service-desk contact data (configuration), dark mode (blocked on the negative logo), further languages.

## Direction contract

THESIS: A service portal that needs no explanation: search first, families as cards, every Leistung carrying its next step. It refuses decoration and concept; it also refuses the lazy version of the standard (icon tiles, hero metrics, shadows, a grey screen with one accent).

OWN-WORLD: White header and page head on a light grey ground (tint of the CD graphic grey), white cards with hairline borders and small radii, no shadows, no gradients. Solothurner Rot for the primary action, the current navigation mark and the square beside each page title. DodgerBlue4 for links and focus, its 8% tint for help and selection panels. State colours from the CD graphic palette. One humanist sans in the Frutiger lineage: Roman for text, a heavy cut for titles, Black Italic for the sender.

STORY: The visitor sees an official canton service, understands that everything IT offers is here, types or picks a family, and leaves through an order, request or contact button.

FIRST VIEWPORT: Header with logo left (clear space), portal name, two nav links right. White page head: title «Business IT-Servicekatalog» with red square, one-line lead, a wide search field with red «Suchen» button, left aligned at the content edge. Below on grey: heading «Service-Familien» and a three-column card grid, each card with name, counts, its services as links and «Alle anzeigen»; the last card is the tinted help panel with the service-desk action.

FORM: category standard (the standing exit; not on the ranked list of seven). seed:00425e4a3dded085. Signature interaction: the search combobox (suggestions while typing, arrow keys, Enter to full results, «/» to focus). Motion grammar: state changes only, 150 to 200 ms ease-out; no entrance choreography.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
