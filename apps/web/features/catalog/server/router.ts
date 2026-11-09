import "server-only"

import { os } from "@/server/orpc"

// PHASE-0-STUB: wird mit den Abfragen auf den Snapshot implementiert.
export const catalogRouter = {
  status: os.catalog.status.handler(() => {
    throw new Error("not implemented")
  }),
  overview: os.catalog.overview.handler(({ errors }) => {
    throw errors.CATALOG_UNAVAILABLE()
  }),
  family: os.catalog.family.handler(({ errors }) => {
    throw errors.CATALOG_UNAVAILABLE()
  }),
  service: os.catalog.service.handler(({ errors }) => {
    throw errors.CATALOG_UNAVAILABLE()
  }),
  leistung: os.catalog.leistung.handler(({ errors }) => {
    throw errors.CATALOG_UNAVAILABLE()
  }),
  searchIndex: os.catalog.searchIndex.handler(({ errors }) => {
    throw errors.CATALOG_UNAVAILABLE()
  }),
}
