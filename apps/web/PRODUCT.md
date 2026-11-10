# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences carry the same weight in the public catalog (confirmed by the owner, 10.11.2026):

- **Canton employees in any department** (non-IT). They need something from IT (a device, an
  account, a publication, an answer) a few times a year, do not know the IT vocabulary and want
  to find the right Leistung and order or request it without a detour.
- **IT coordinators and power users in the departments.** They know the vocabulary, come back
  regularly, browse the portfolio by family and service and compare Leistungen.

Both sit at a canton workstation on the internal network during office hours. No sign-in.

A third, small audience uses the admin area: **service management and operators at the AIO**
(Amt für Informatik und Organisation). They check whether the LeanIX sync is healthy, work
through the data-quality report to fix records in LeanIX, and manage admin accounts, SAML
providers and the two-factor rule.

## Product Purpose

BITS-Portal is the canton-internal service portal for the Business IT services of the AIO
(Kanton Solothurn). It presents the Leistungen published in SAP LeanIX in the channel
«Business IT-Servicekatalog» and forwards orders and requests to the right target system
(for example ky2help, SmartForm) without a media break.

Success: an employee reaches the right Leistung and its next step (order, request, contact) in
under a minute; service management sees at a glance whether the catalog is current and which
LeanIX records need care.

## Positioning

The portal holds no content of its own. LeanIX is the only source of truth; the portal reads,
validates and publishes. What appears, how it is grouped and where an order goes is decided by
service management in LeanIX, without a code change.

## Operating Context

- Structure: **Familie** (Leistungskategorie Ebene 2) → **Service** (Ebene 3) → **Leistung**
  (subtype Verwaltungsleistung or Behördenleistung). A Leistung can belong to several services.
- A Leistung carries a description (Markdown), responsible organisational units (with path, for
  example «AIO / Business IT-Services / Service-Management»), Leistungsbezüger, applications,
  actions (order, request, contact) and further links.
- A Leistung without its own action shows the central contact (service desk), if configured.
- The catalog is a snapshot refreshed every 15 minutes. If LeanIX is down the last good
  snapshot stays; it is marked stale after 24 hours. Without any snapshot the public pages show
  a «catalog unavailable» state with the central contact.
- Demo mode serves a bundled snapshot (2 families, 3 services, 6 Leistungen today). The real
  workspace has 5 families and 29 services, most of them still without a published Leistung.
- Admin area: sync status and history, manual sync, data-quality report with links into LeanIX,
  admin accounts (password, always role admin), SAML providers, two-factor rule for admins.
- First run: `/setup` creates the first admin once.

## Capabilities and Constraints

- UI language is German in Swiss orthography (ss, no ß). Open: further languages (Konzept,
  question 9).
- All data access from client components goes through oRPC + TanStack Query; no server actions.
  Server components read through `serverClient`. The wire contract in `packages/api` and every
  `server/router.ts` are fixed for this work.
- The portal sends no email. No password reset, no email verification.
- Public sign-up is disabled; SAML users are provisioned on first sign-in.
- Search is full text over name, description, service and applications, filtered by subtype and
  Leistungsbezüger; the data set is small.
- Persons (Leistungsverantwortliche) are hidden unless `CATALOG_SHOW_PERSONS` is on.
- Fonts are self-hosted; no requests to third-party hosts at runtime (internal network).
- Open product decisions that the UI must not pre-empt: resource types per button, the central
  contact URL, services without a published Leistung (hidden by default).

## Brand Commitments

- Sender is the **Kanton Solothurn**, office **Amt für Informatik und Organisation (AIO)**.
- The corporate design manual is binding in spirit
  (<https://github.com/ktsobus/CD-Manual-Kanton-Solothurn>, written for print, transferred to
  screens by analogy). It is the only visual reference for this frontend.
- Logo «KANTON solothurn» only from the original file
  (`public/brand/kanton-solothurn-logo.svg`), never redrawn, recoloured or cropped; colour
  version on white only; clear space of one logo height. No negative version is on hand.
- Solothurner Rot `#CC0000`, black, white; graphic grey `#646B76`, graphic black `#333333`;
  additional chart colours from the manual. No arbitrary colours, no gradients, no shading.
- House typeface is Frutiger LT Std. **No web licence is available**; the owner delegated the
  choice of a freely licensed, self-hosted replacement (10.11.2026).
- Typography rules from the manual: no centred setting, ragged right, measure of about 70
  characters, «Guillemets», en dash for lists, real ellipsis.
- **Standing preference: the conventional service portal, played straight** (owner's choice in
  the direction round, 10.11.2026). Search-led start page, family cards, a request button on
  every Leistung, a standard admin shell. No concept, metaphor or ornament on top. The craft
  bar is set by three groups the portal should sit alongside: Swiss public-sector web (so.ch,
  the Confederation's admin.ch design system), enterprise service portals (ServiceNow Employee
  Center, Jira Service Management help center) and polished SaaS product UI (Linear, Stripe
  Dashboard, Vercel). They set the level of finish, not the look; the look comes from the CD
  manual only.

## Evidence on Hand

- Real catalog content: `data/demo-catalog.json` (generated by the real mapper from LeanIX
  fixtures in `lib/catalog/__fixtures__/`).
- Logo file and its provenance: `public/brand/`, `docs/branding.md`.
- CD manual transcript and page images in the repository linked above.
- Not on hand, do not fabricate: photography, illustrations, a negative logo, usage numbers,
  testimonials, service-desk contact data (comes from configuration).

## Product Principles

1. **The next step is the point.** Every Leistung page ends in an action the visitor can take
   now: order, request or contact.
2. **LeanIX speaks, the portal does not embellish.** Show what is recorded, say plainly what is
   missing, never invent content to fill a gap.
3. **One vocabulary for two audiences.** Plain names first, the catalog structure second; an
   occasional visitor is never asked to know what a «Leistungskategorie» is.
4. **Honest about freshness.** The visitor and the operator can always see how current the
   catalog is and what happens when the source is unreachable.
5. **An official sender.** The portal reads as a service of the Kanton Solothurn, not as a
   product of its own.

## Accessibility & Inclusion

WCAG 2.1 AA (eCH-0059). Keyboard operation throughout, visible focus, reduced-motion support,
logo alt text «Kanton Solothurn».
