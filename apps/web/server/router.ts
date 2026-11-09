import "server-only"

import { catalogRouter } from "@/features/catalog/server/router"
import { catalogAdminRouter } from "@/features/catalog-admin/server/router"
import { authMethodsRouter, ssoRouter } from "@/features/sso/server/router"
import { healthRouter } from "@/features/health/server/router"
import { settingsRouter } from "@/features/settings/server/router"
import { setupRouter } from "@/features/setup/server/router"
import { userRouter } from "@/features/users/server/router"

import { os } from "./orpc"

/** Combines the feature routers (`features/<feature>/server/router.ts`). */
export const router = os.router({
  auth: authMethodsRouter,
  catalog: catalogRouter,
  catalogAdmin: catalogAdminRouter,
  health: healthRouter,
  settings: settingsRouter,
  setup: setupRouter,
  sso: ssoRouter,
  user: userRouter,
})

export type Router = typeof router
