import "server-only"

import { createRouterClient } from "@orpc/server"
import { headers } from "next/headers"

import { router } from "@/server/router"

/**
 * Serverseitiger oRPC-Client für Server Components. Ruft dieselben
 * Prozeduren wie der Browser auf (ohne HTTP-Umweg), damit Geschäftslogik
 * nur in den Routern liegt.
 */
export const serverClient = createRouterClient(router, {
  context: async () => ({ headers: await headers() }),
})
