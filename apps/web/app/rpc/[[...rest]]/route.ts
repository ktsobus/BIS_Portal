import { env } from "@/lib/env"
import { createRpcRequestHandler } from "@/server/rpc-handler"
import { router } from "@/server/router"

// BETTER_AUTH_URL ist die öffentliche URL des Portals (auch hinter einem
// Reverse Proxy); nur von dieser Origin sind ändernde Aufrufe erlaubt.
const handleRequest = createRpcRequestHandler(router, {
  appOrigin: new URL(env.BETTER_AUTH_URL).origin,
})

export const HEAD = handleRequest
export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
