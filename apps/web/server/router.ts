import "server-only"

import { authMethodsRouter, ssoRouter } from "@/features/sso/server/router"
import { healthRouter } from "@/features/health/server/router"
import { settingsRouter } from "@/features/settings/server/router"
import { setupRouter } from "@/features/setup/server/router"
import { taskRouter } from "@/features/tasks/server/router"
import { userRouter } from "@/features/users/server/router"

import { os } from "./orpc"

/** Combines the feature routers (`features/<feature>/server/router.ts`). */
export const router = os.router({
  auth: authMethodsRouter,
  health: healthRouter,
  settings: settingsRouter,
  setup: setupRouter,
  sso: ssoRouter,
  task: taskRouter,
  user: userRouter,
})

export type Router = typeof router
