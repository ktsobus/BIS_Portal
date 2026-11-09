import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { needsTwoFactorSetup } from "@/lib/two-factor"

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/** Signed-in user, without the TOTP requirement. Only for /two-factor/setup. */
export async function requireSessionAllowNo2FA() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  return session
}

/**
 * Signed-in user; password admins without TOTP are sent to enrol first.
 * Keep in sync with the `authed` middleware in `server/orpc.ts`.
 */
export async function requireSession() {
  const session = await requireSessionAllowNo2FA()
  if (await needsTwoFactorSetup(session.user)) redirect("/two-factor/setup")
  return session
}

export async function requireAdmin() {
  const session = await requireSession()
  if (session.user.role !== "admin") redirect("/dashboard")
  return session
}
