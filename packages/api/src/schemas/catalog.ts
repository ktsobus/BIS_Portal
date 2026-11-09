import { z } from "zod"

/**
 * Katalog-Snapshot: normalisierte Sicht auf die Business-IT-Services aus
 * LeanIX. Wird beim Sync erzeugt, in Postgres gespeichert und vom Portal
 * ausschliesslich gelesen. Datumswerte sind ISO-Strings, damit der Snapshot
 * verlustfrei als JSON gespeichert werden kann.
 */

export const CATALOG_SCHEMA_VERSION = 1

/** Organisationseinheit aus LeanIX (verantwortliche Stelle). */
export const orgUnitSchema = z.object({
  id: z.string(),
  /** Kurzname, z. B. «Service-Management». */
  name: z.string(),
  /** Voller Pfad, z. B. «Finanzdepartement (FD) / … / Service-Management». */
  path: z.string(),
})

/** Person mit Rolle (Abonnement in LeanIX). Nur befüllt, wenn freigeschaltet. */
export const personSchema = z.object({
  name: z.string(),
  role: z.string().nullable(),
})

/**
 * Wie eine Ressource («Weitere Informationen») im Portal erscheint:
 * - `order`: primäre Aktion «Bestellen» (z. B. ky2help, Bestellformular)
 * - `request`: Aktion «Anfrage stellen» (z. B. SmartForm, Support-Ticket)
 * - `contact`: Kontaktmöglichkeit (z. B. Telefon)
 * - `info`: Link unter «Weitere Informationen»
 */
export const linkKindSchema = z.enum(["order", "request", "contact", "info"])

export const catalogLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  /** LeanIX-Ressourcentyp (`documentType`), z. B. `ordering_form`. */
  resourceType: z.string(),
  kind: linkKindSchema,
})

export const namedRefSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const subtypeSchema = z.enum([
  "verwaltungsleistung",
  "behoerdenleistung",
])

/** Leistung (LeanIX-Typ `behoerdenLeistungen`) im Kanal BITS. */
export const leistungSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  subtype: subtypeSchema.nullable(),
  /** Anzeigename des Subtyps, z. B. «Verwaltungsleistung». */
  subtypeLabel: z.string().nullable(),
  /** Kurzbeschreibung (erster Absatz der Beschreibung, gekürzt). */
  summary: z.string().nullable(),
  /** Volle Beschreibung als Text (Zeilenumbrüche erhalten). */
  description: z.string().nullable(),
  /** Services (Leistungskategorie Ebene 3), denen die Leistung zugeordnet ist. */
  serviceIds: z.array(z.string()),
  responsible: z.array(orgUnitSchema),
  persons: z.array(personSchema),
  /** Leistungsbezüger (LeanIX `UserGroup`), z. B. «Kantonale Verwaltung». */
  audiences: z.array(namedRefSchema),
  applications: z.array(namedRefSchema),
  /** Aktionen (order/request/contact), in Anzeige-Reihenfolge. */
  actions: z.array(catalogLinkSchema),
  /** Weitere Informationen (info-Links). */
  links: z.array(catalogLinkSchema),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  updatedAt: z.string().nullable(),
  leanixUrl: z.string(),
})

/** Service = Leistungskategorie Ebene 3, z. B. «Service eLearning». */
export const serviceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  /** Service-Definition (Beschreibung der Kategorie). */
  definition: z.string().nullable(),
  familyId: z.string(),
  responsible: z.array(orgUnitSchema),
  persons: z.array(personSchema),
  actions: z.array(catalogLinkSchema),
  links: z.array(catalogLinkSchema),
  leistungIds: z.array(z.string()),
  updatedAt: z.string().nullable(),
  leanixUrl: z.string(),
})

/** Service-Familie = Leistungskategorie Ebene 2, z. B. «Arbeitsplatz-Services». */
export const familySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  serviceIds: z.array(z.string()),
  leanixUrl: z.string(),
})

export const qualitySeveritySchema = z.enum(["error", "warning", "info"])

/** Auffälligkeit in den LeanIX-Daten (für den Admin-Bericht). */
export const qualityIssueSchema = z.object({
  severity: qualitySeveritySchema,
  /** Stabiler Code, z. B. `LEISTUNG_WITHOUT_SERVICE`. */
  code: z.string(),
  message: z.string(),
  factSheetId: z.string(),
  factSheetName: z.string(),
  factSheetType: z.string(),
  leanixUrl: z.string(),
})

export const catalogStatsSchema = z.object({
  families: z.number().int(),
  services: z.number().int(),
  leistungen: z.number().int(),
  /** Leistungen mit Kanal BITS (vor dem Kategorie-Filter). */
  leistungenInChannel: z.number().int(),
  /** Leistungen im Kanal, die nicht angezeigt werden (z. B. ohne Kategorie). */
  leistungenSkipped: z.number().int(),
  /**
   * Aktionen (Bestell-/Anfragewege) von Leistungen und Services, ohne
   * Standard-Aktion. Optional, weil ältere Snapshots sie nicht enthalten.
   */
  actions: z.number().int().optional(),
  issues: z.number().int(),
})

export const catalogSnapshotSchema = z.object({
  schemaVersion: z.literal(CATALOG_SCHEMA_VERSION),
  generatedAt: z.string(),
  source: z.object({
    kind: z.enum(["leanix", "demo"]),
    baseUrl: z.string(),
    workspace: z.string().nullable(),
  }),
  families: z.array(familySchema),
  services: z.array(serviceSchema),
  leistungen: z.array(leistungSchema),
  issues: z.array(qualityIssueSchema),
  stats: catalogStatsSchema,
})

// ---------------------------------------------------------------------------
// Antworten der öffentlichen Prozeduren

export const catalogStatusSchema = z.object({
  /** Ein Snapshot ist geladen und das Portal kann Inhalte zeigen. */
  available: z.boolean(),
  source: z.enum(["leanix", "demo"]).nullable(),
  /** Zeitpunkt, zu dem die angezeigten Daten aus LeanIX gelesen wurden. */
  generatedAt: z.string().nullable(),
  /** Letzter erfolgreicher Sync liegt länger zurück als der Schwellwert. */
  stale: z.boolean(),
})

/**
 * Zentraler Kontakt (Service Desk) aus der Konfiguration, unabhängig vom
 * Snapshot. Erscheint, wo eine Leistung oder ein Service keinen eigenen
 * Bestell- oder Anfrageweg hat, in der Fusszeile und bei einem Ausfall.
 */
export const supportContactSchema = z.object({
  /** Standard-Anfrageweg (`CATALOG_FALLBACK_REQUEST_URL`): https, mailto oder tel. */
  request: catalogLinkSchema.nullable(),
  /** E-Mail-Adresse (`CATALOG_SUPPORT_EMAIL`). */
  email: z.string().nullable(),
  /** Telefonnummer zur Anzeige (`CATALOG_SUPPORT_PHONE`). */
  phone: z.string().nullable(),
})

/** Status für die öffentlichen Seiten: zusätzlich der zentrale Kontakt. */
export const catalogPublicStatusSchema = catalogStatusSchema.extend({
  /** `null`, wenn kein Kontakt konfiguriert ist. */
  contact: supportContactSchema.nullable(),
})

/*
 * Öffentliche Sicht ohne Links ins LeanIX-Fact-Sheet: Sie verraten Workspace
 * und interne IDs und funktionieren ohne LeanIX-Konto ohnehin nicht. Der
 * Admin-Bericht behält die Links (`qualityIssueSchema`).
 */
export const publicFamilySchema = familySchema.omit({ leanixUrl: true })
export const publicServiceSchema = serviceSchema.omit({ leanixUrl: true })
export const publicLeistungSchema = leistungSchema.omit({ leanixUrl: true })

export const familySummarySchema = publicFamilySchema.extend({
  serviceCount: z.number().int(),
  /** Anzahl verschiedener Leistungen (eine Leistung kann mehreren Services angehören). */
  leistungCount: z.number().int(),
})

export const serviceSummarySchema = serviceSchema
  .pick({
    id: true,
    slug: true,
    name: true,
    definition: true,
    familyId: true,
    responsible: true,
  })
  .extend({
    leistungCount: z.number().int(),
  })

export const leistungSummarySchema = leistungSchema.pick({
  id: true,
  slug: true,
  name: true,
  subtype: true,
  subtypeLabel: true,
  summary: true,
  actions: true,
})

export const catalogOverviewSchema = z.object({
  status: catalogPublicStatusSchema,
  families: z.array(familySummarySchema),
})

export const catalogFamilyPageSchema = z.object({
  status: catalogPublicStatusSchema,
  family: familySummarySchema,
  services: z.array(serviceSummarySchema),
})

export const catalogServicePageSchema = z.object({
  status: catalogPublicStatusSchema,
  family: publicFamilySchema,
  service: publicServiceSchema,
  leistungen: z.array(publicLeistungSchema),
})

export const catalogLeistungPageSchema = z.object({
  status: catalogPublicStatusSchema,
  leistung: publicLeistungSchema,
  /** Alle Einordnungen (eine Leistung kann mehreren Services angehören). */
  placements: z.array(
    z.object({ family: publicFamilySchema, service: publicServiceSchema })
  ),
  parent: leistungSummarySchema.nullable(),
  children: z.array(leistungSummarySchema),
})

/** Kompakter Index für die clientseitige Suche. */
export const searchEntrySchema = z.object({
  kind: z.enum(["leistung", "service"]),
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  summary: z.string().nullable(),
  subtypeLabel: z.string().nullable(),
  /** Pfad zur Anzeige, z. B. «Unterstützungs-Services › Service eLearning». */
  context: z.string(),
  /** Zusätzlicher Suchtext (Anwendungen, Leistungsbezüger, Stellen). */
  keywords: z.string(),
  audiences: z.array(z.string()),
})

export const catalogSearchIndexSchema = z.object({
  status: catalogPublicStatusSchema,
  entries: z.array(searchEntrySchema),
  /** Filterwerte für die Suche. */
  facets: z.object({
    subtypes: z.array(z.string()),
    audiences: z.array(z.string()),
  }),
})

export const slugInputSchema = z.object({ slug: z.string().min(1) })

// ---------------------------------------------------------------------------
// Admin

export const syncTriggerSchema = z.enum([
  "startup",
  "schedule",
  "manual",
  "webhook",
])
export const syncRunStatusSchema = z.enum([
  "running",
  "success",
  "failed",
  "rejected",
])

export const syncRunSchema = z.object({
  id: z.string(),
  trigger: syncTriggerSchema,
  status: syncRunStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  /** Fehlermeldung oder Grund für die Ablehnung (Plausibilisierung). */
  message: z.string().nullable(),
  stats: catalogStatsSchema.nullable(),
})

export const catalogAdminOverviewSchema = z.object({
  status: catalogStatusSchema,
  snapshot: z
    .object({
      id: z.string(),
      generatedAt: z.string(),
      source: z.enum(["leanix", "demo"]),
      stats: catalogStatsSchema,
    })
    .nullable(),
  /**
   * Gespeicherte Snapshots, obwohl keiner geladen werden kann (z. B. nach
   * einem Upgrade mit neuer Schemaversion). Fehlt oder 0 im Normalfall.
   */
  unreadableSnapshots: z.number().int().optional(),
  issues: z.array(qualityIssueSchema),
  runs: z.array(syncRunSchema),
  config: z.object({
    source: z.enum(["leanix", "demo"]),
    leanixBaseUrl: z.string(),
    workspace: z.string().nullable(),
    tokenConfigured: z.boolean(),
    syncIntervalMinutes: z.number().int(),
    minRatio: z.number(),
    staleAfterHours: z.number(),
    rootCategoryId: z.string(),
    /** Standard-Aktion für Leistungen ohne Aktion (`CATALOG_FALLBACK_REQUEST_URL`) gesetzt. */
    fallbackActionConfigured: z.boolean(),
  }),
})

export type CatalogSnapshot = z.infer<typeof catalogSnapshotSchema>
export type CatalogStatus = z.infer<typeof catalogStatusSchema>
export type CatalogPublicStatus = z.infer<typeof catalogPublicStatusSchema>
export type SupportContact = z.infer<typeof supportContactSchema>
export type CatalogStats = z.infer<typeof catalogStatsSchema>
export type Family = z.infer<typeof familySchema>
export type Service = z.infer<typeof serviceSchema>
export type Leistung = z.infer<typeof leistungSchema>
export type PublicFamily = z.infer<typeof publicFamilySchema>
export type PublicService = z.infer<typeof publicServiceSchema>
export type PublicLeistung = z.infer<typeof publicLeistungSchema>
export type CatalogLink = z.infer<typeof catalogLinkSchema>
export type LinkKind = z.infer<typeof linkKindSchema>
export type OrgUnit = z.infer<typeof orgUnitSchema>
export type Person = z.infer<typeof personSchema>
export type NamedRef = z.infer<typeof namedRefSchema>
export type QualityIssue = z.infer<typeof qualityIssueSchema>
export type FamilySummary = z.infer<typeof familySummarySchema>
export type ServiceSummary = z.infer<typeof serviceSummarySchema>
export type LeistungSummary = z.infer<typeof leistungSummarySchema>
export type CatalogOverview = z.infer<typeof catalogOverviewSchema>
export type CatalogFamilyPage = z.infer<typeof catalogFamilyPageSchema>
export type CatalogServicePage = z.infer<typeof catalogServicePageSchema>
export type CatalogLeistungPage = z.infer<typeof catalogLeistungPageSchema>
export type SearchEntry = z.infer<typeof searchEntrySchema>
export type CatalogSearchIndex = z.infer<typeof catalogSearchIndexSchema>
export type SyncTrigger = z.infer<typeof syncTriggerSchema>
export type SyncRunStatus = z.infer<typeof syncRunStatusSchema>
export type SyncRun = z.infer<typeof syncRunSchema>
export type CatalogAdminOverview = z.infer<typeof catalogAdminOverviewSchema>
