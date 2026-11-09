import "server-only"

import { contract } from "@workspace/api"
import { implement, ORPCError } from "@orpc/server"

import { auth } from "@/lib/auth"
import { needsTwoFactorSetup } from "@/lib/two-factor"

export interface BaseContext {
  headers: Headers
}

export const os = implement(contract).$context<BaseContext>()

async function resolveSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) throw new ORPCError("UNAUTHORIZED")
  if (await needsTwoFactorSetup(session.user)) {
    throw new ORPCError("TWO_FACTOR_REQUIRED", {
      status: 403,
      message: "Set up two-factor authentication to continue",
    })
  }
  return session
}

/**
 * Requires a signed-in user. Password admins must also have TOTP enabled.
 * Keep in sync with `requireSession()` in `lib/session.ts`.
 */
export const authed = os.middleware(async ({ context, next }) => {
  const { session, user } = await resolveSession(context.headers)
  return next({ context: { session, user } })
})

/** Like `authed`, but additionally requires the admin role. */
export const adminOnly = os.middleware(async ({ context, next }) => {
  const { session, user } = await resolveSession(context.headers)
  if (user.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Admin access required" })
  }
  return next({ context: { session, user } })
})
