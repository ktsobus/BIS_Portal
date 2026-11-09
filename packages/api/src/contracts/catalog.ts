import { oc } from "@orpc/contract"

import {
  catalogAdminOverviewSchema,
  catalogFamilyPageSchema,
  catalogLeistungPageSchema,
  catalogOverviewSchema,
  catalogSearchIndexSchema,
  catalogPublicStatusSchema,
  catalogServicePageSchema,
  slugInputSchema,
  syncRunSchema,
} from "../schemas/catalog"
import { adminContract } from "./base"

const notFound = { NOT_FOUND: { message: "Nicht gefunden" } } as const
const unavailable = {
  CATALOG_UNAVAILABLE: {
    status: 503,
    message: "Der Katalog ist vorübergehend nicht verfügbar",
  },
} as const

/** Öffentlich (ohne Anmeldung): liest nur aus dem Katalog-Snapshot. */
export const catalogContract = {
  status: oc.route({ method: "GET" }).output(catalogPublicStatusSchema),
  overview: oc.errors(unavailable).output(catalogOverviewSchema),
  family: oc
    .errors({ ...unavailable, ...notFound })
    .input(slugInputSchema)
    .output(catalogFamilyPageSchema),
  service: oc
    .errors({ ...unavailable, ...notFound })
    .input(slugInputSchema)
    .output(catalogServicePageSchema),
  leistung: oc
    .errors({ ...unavailable, ...notFound })
    .input(slugInputSchema)
    .output(catalogLeistungPageSchema),
  searchIndex: oc.errors(unavailable).output(catalogSearchIndexSchema),
}

/** Admin: Sync-Status, Datenqualität, Sync auslösen. */
export const catalogAdminContract = {
  overview: adminContract.output(catalogAdminOverviewSchema),
  syncNow: adminContract
    .errors({
      CONFLICT: { message: "Ein Sync läuft bereits" },
      PRECONDITION_FAILED: {
        message: "Kein LeanIX-API-Token konfiguriert (Demo-Modus)",
      },
    })
    .output(syncRunSchema),
}
