import type { ApiClient } from "@workspace/api"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"

const link = new RPCLink({
  url: () =>
    typeof window === "undefined"
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/rpc`
      : `${window.location.origin}/rpc`,
})

/** Typed oRPC client generated from the contract in `@workspace/api`. */
export const client: ApiClient = createORPCClient(link)

/** TanStack Query helpers: `orpc.catalog.overview.queryOptions()`, etc. */
export const orpc = createTanstackQueryUtils(client)
