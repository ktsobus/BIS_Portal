import "server-only"

import { and, eq } from "drizzle-orm"

import { db, schema } from "@/db"
import { getAppSettings } from "@/lib/settings"

interface TwoFactorSubject {
  id: string
  role?: string | null
  twoFactorEnabled?: boolean | null
}

async function hasPasswordAccount(userId: string) {
  const [row] = await db
    .select({ id: schema.account.id })
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential")
      )
    )
    .limit(1)
  return Boolean(row)
}

/**
 * TOTP is required only when the `requireAdminTwoFactor` setting is on (off by
 * default), and then only for admins that have a password (`credential`)
 * account. SAML users and regular password users are always exempt.
 */
export async function requiresTwoFactor(user: TwoFactorSubject) {
  if (user.role !== "admin") return false
  const { requireAdminTwoFactor } = await getAppSettings()
  return requireAdminTwoFactor && (await hasPasswordAccount(user.id))
}

/** True when the user must enrol in TOTP before using the app. */
export async function needsTwoFactorSetup(user: TwoFactorSubject) {
  if (user.twoFactorEnabled) return false
  return requiresTwoFactor(user)
}
