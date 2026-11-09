import "server-only"

import { adminOnly, os } from "@/server/orpc"

// PHASE-0-STUB: wird mit Sync-Status, Datenqualität und manuellem Sync implementiert.
export const catalogAdminRouter = {
  overview: os.catalogAdmin.overview.use(adminOnly).handler(() => {
    throw new Error("not implemented")
  }),
  syncNow: os.catalogAdmin.syncNow.use(adminOnly).handler(({ errors }) => {
    throw errors.PRECONDITION_FAILED()
  }),
}
