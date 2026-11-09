import "server-only"

import { os } from "@/server/orpc"

export const healthRouter = {
  check: os.health.check.handler(() => ({ status: "ok", time: new Date() })),
}
