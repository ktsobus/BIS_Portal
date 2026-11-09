import type { LinkKind } from "@workspace/api"

/**
 * Abbildung des LeanIX-Metamodells (Workspace eamktsoLive) auf das Portal.
 *
 * Die Schlüssel stammen aus der Discovery vom 9.11.2026
 * (`scripts/leanix-discovery.mjs`). Ändert sich das Modell in LeanIX, wird
 * nur diese Datei angepasst. Werte, die je Umgebung variieren können, lassen
 * sich zusätzlich per Umgebungsvariable übersteuern (siehe `lib/env.ts`).
 */
export const leanixModel = {
  leistung: {
    /** Fact-Sheet-Typ «Leistung» (interner Schlüssel). */
    type: "behoerdenLeistungen",
    /** Mehrfachauswahl «Zugangskanal → Kanal». */
    channelField: "kanal",
    /** Option «Business IT-Servicekatalog» im Feld Kanal. */
    channelOption: "Business_IT_Servicekatalog",
    /** Feld «Subtyp» und seine Optionen. */
    subtypeField: "category",
    subtypes: {
      verwaltungsLeistungen: {
        key: "verwaltungsleistung",
        label: "Verwaltungsleistung",
      },
      behoerdenLeistungen: {
        key: "behoerdenleistung",
        label: "Behördenleistung",
      },
    },
    relations: {
      kategorie: "relbehoerdenLeistungenToLeistungskategorie",
      organisation: "relbehoerdenLeistungenToOrganisationseinheit",
      bezueger: "relbehoerdenLeistungenToUserGroup",
      anwendung: "relbehoerdenLeistungenToApplication",
      parent: "relToParent",
      child: "relToChild",
    },
  },
  kategorie: {
    /** Fact-Sheet-Typ «Leistungskategorie» (Ebene 1–3). */
    type: "Leistungskategorie",
    /** LeanIX-ID der Ebene-1-Kategorie «Business IT-Servicekatalog». */
    rootId: "f846f11a-5b18-4585-bc74-ef98c056a3c8",
    familyLevel: 2,
    serviceLevel: 3,
    relations: {
      organisation: "relLeistungskategorieToOrganisationseinheit",
      parent: "relToParent",
      child: "relToChild",
    },
  },
  /**
   * Verantwortliche Personen (Abonnements; nur mit `CATALOG_SHOW_PERSONS`).
   * Übernommen werden nur Abos dieses Typs mit genau dieser Rolle. Ein Abo
   * ohne passende Rolle zählt nicht, auch wenn es vom Typ RESPONSIBLE ist.
   * `role: null` übernimmt jedes Abo des Typs – nur bewusst setzen.
   * Die Rolle für Services ist noch nicht bestätigt (offene Frage 4); heute
   * haben die Abos auf Leistungskategorien keine Rolle.
   */
  responsiblePersons: {
    leistung: {
      subscriptionType: "RESPONSIBLE",
      role: "Leistungsverantwortliche/r",
    },
    kategorie: {
      subscriptionType: "RESPONSIBLE",
      role: "Serviceverantwortliche/r",
    },
  },
  /**
   * Ressourcen, deren `origin` hierauf passt, sind hochgeladene Dateien (nur
   * mit LeanIX-Login abrufbar) und werden nicht angezeigt.
   */
  fileOriginPattern: /storage|file|upload/i,
} as const

/** Regel, welche Abonnements als verantwortliche Person gelten. */
export interface ResponsiblePersonRule {
  subscriptionType: string | null
  role: string | null
}

export interface ResourceTypeRule {
  kind: LinkKind
  /** Beschriftung, falls die Ressource keinen eigenen Namen hat. */
  fallbackLabel: string
  /** Reihenfolge innerhalb der Art (klein = zuerst). */
  order: number
}

/**
 * Ressourcentypen («Weitere Informationen» → `documentType`) und ihre Rolle
 * im Portal. Nicht aufgeführte Typen werden nicht angezeigt (z. B. policy,
 * decision, jira, RRB, Testkonzept). Stand: Ressourcentypen-Modell der
 * Instanz; die fachliche Zuordnung ist noch offen und hier bewusst einfach
 * änderbar.
 */
export const resourceTypeRules: Record<string, ResourceTypeRule> = {
  ordering_form: { kind: "order", fallbackLabel: "Bestellen", order: 1 },
  ky2help: { kind: "order", fallbackLabel: "In ky2help beantragen", order: 2 },
  support_ticket: {
    kind: "request",
    fallbackLabel: "Support-Ticket erfassen",
    order: 1,
  },
  phone_contact: {
    kind: "contact",
    fallbackLabel: "Telefonischer Kontakt",
    order: 1,
  },
  website: { kind: "info", fallbackLabel: "Webseite", order: 1 },
  Anwendungslink: { kind: "info", fallbackLabel: "Zur Anwendung", order: 2 },
  documentation: { kind: "info", fallbackLabel: "Dokumentation", order: 3 },
  information: { kind: "info", fallbackLabel: "Information", order: 4 },
  faq: { kind: "info", fallbackLabel: "FAQ", order: 5 },
  additional_help: {
    kind: "info",
    fallbackLabel: "Zusätzliche Hilfe",
    order: 6,
  },
  wiki: { kind: "info", fallbackLabel: "Wiki", order: 7 },
  "AIO-Wiki": { kind: "info", fallbackLabel: "AIO-Wiki", order: 8 },
  miscellaneous: {
    kind: "info",
    fallbackLabel: "Weitere Informationen",
    order: 9,
  },
}
