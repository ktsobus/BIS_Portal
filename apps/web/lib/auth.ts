import "server-only"

import { sso } from "@better-auth/sso"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
  isAPIError,
} from "better-auth/api"
import { admin, twoFactor } from "better-auth/plugins"
import { and, count, eq, isNull, ne, or } from "drizzle-orm"

import { db, schema } from "@/db"
import { env } from "@/lib/env"
import {
  clearSignInFailures,
  normalizeThrottleEmail,
  recordSignInFailure,
  signInLockedForSeconds,
} from "@/lib/sign-in-throttle"
import { requiresTwoFactor } from "@/lib/two-factor"

/** Anzeigename, u. a. als Aussteller in Authenticator-Apps (TOTP). */
export const APP_NAME = "BITS-Portal Kanton Solothurn"

/** Gleiche Regel wie `passwordSchema` in `@workspace/api`. */
const PASSWORD_MIN_LENGTH = 12
const PASSWORD_MAX_LENGTH = 128

/** Rollen, die das Portal kennt (keine Listen wie `["admin", "user"]`). */
const ROLES = new Set(["admin", "user"])

// SSO provider management endpoints. The plugin lets any signed-in user call
// these (scoped to providers they registered); we restrict them to admins so
// nobody else can register an IdP for a domain. Admins manage providers
// through the `sso.*` oRPC procedures.
const SSO_MANAGEMENT_PATHS = new Set([
  "/sso/register",
  "/sso/update-provider",
  "/sso/delete-provider",
  "/sso/providers",
  "/sso/get-provider",
  "/sso/request-domain-verification",
  "/sso/verify-domain",
])

// Das Portal verschickt keine E-Mails: Passwort-Reset und E-Mail-Bestätigung
// gibt es nicht. Die Endpunkte antworten mit 404 statt mit Fehlern im Log.
const DISABLED_PATHS = [
  "/request-password-reset",
  "/reset-password",
  "/send-verification-email",
  "/verify-email",
]
/** Pfadmuster (mit Parameter), die `disabledPaths` nicht abdeckt. */
const DISABLED_PATH_PATTERNS = new Set(["/reset-password/:token"])

/**
 * Rejects the change if `targetUserId` is an admin and no other active
 * admin would remain, so the portal can never lose its last admin (e.g. by
 * demoting, banning or removing it).
 */
async function assertAnotherAdminRemains(targetUserId: unknown) {
  if (typeof targetUserId !== "string") return
  const [target] = await db
    .select({ role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.id, targetUserId))
    .limit(1)
  if (target?.role !== "admin") return
  const [others] = await db
    .select({ value: count() })
    .from(schema.user)
    .where(
      and(
        eq(schema.user.role, "admin"),
        ne(schema.user.id, targetUserId),
        or(isNull(schema.user.banned), eq(schema.user.banned, false))
      )
    )
  if (!others || others.value === 0) {
    throw new APIError("BAD_REQUEST", {
      code: "LAST_ADMIN",
      message: "Das letzte Admin-Konto muss erhalten bleiben.",
    })
  }
}

/** Only the scalar roles "admin" or "user" may be assigned. */
function assertValidRole(role: unknown) {
  if (role === undefined) return
  if (typeof role !== "string" || !ROLES.has(role)) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_ROLE",
      message: "Erlaubt sind nur die Rollen «admin» und «user».",
    })
  }
}

export const auth = betterAuth({
  appName: APP_NAME,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // Native transactions are required by the SSO plugin's `resolveUser`.
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  disabledPaths: DISABLED_PATHS,
  advanced: {
    ipAddress: {
      // Mit vertrauenswürdigen Proxies wird `X-Forwarded-For` von rechts
      // gelesen; ohne gilt nur ein einzelner Wert (siehe Betriebshinweise).
      trustedProxies:
        env.AUTH_TRUSTED_PROXIES.length > 0
          ? env.AUTH_TRUSTED_PROXIES
          : undefined,
    },
  },
  emailAndPassword: {
    enabled: true,
    // No public sign-up: the first admin is created at /setup, further
    // password users are created by admins (admin plugin `createUser`).
    disableSignUp: true,
    // Applies to every better-auth endpoint that sets a password.
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (DISABLED_PATH_PATTERNS.has(ctx.path)) {
        throw new APIError("NOT_FOUND")
      }

      if (SSO_MANAGEMENT_PATHS.has(ctx.path)) {
        const session = await getSessionFromCtx(ctx)
        if (session?.user.role !== "admin") {
          throw new APIError("FORBIDDEN", {
            message: "Dafür sind Adminrechte nötig.",
          })
        }
      }

      // Per-account throttle, independent of the (spoofable) client IP.
      if (ctx.path === "/sign-in/email") {
        const email = normalizeThrottleEmail(
          (ctx.body as { email?: unknown } | undefined)?.email
        )
        const seconds = email ? await signInLockedForSeconds(email) : 0
        if (seconds > 0) {
          throw new APIError(
            "TOO_MANY_REQUESTS",
            {
              code: "SIGN_IN_TEMPORARILY_LOCKED",
              message:
                "Zu viele fehlgeschlagene Anmeldeversuche. Bitte später erneut versuchen.",
            },
            { "Retry-After": String(seconds) }
          )
        }
      }

      // Roles are only changed through /admin/set-role, which is guarded
      // below. The admin plugin's update-user would otherwise accept
      // `data.role` without these checks (e.g. demoting the last admin).
      if (ctx.path === "/admin/update-user") {
        const data = (
          ctx.body as { data?: Record<string, unknown> } | undefined
        )?.data
        if (data && Object.prototype.hasOwnProperty.call(data, "role")) {
          throw new APIError("BAD_REQUEST", {
            code: "ROLE_VIA_SET_ROLE_ONLY",
            message: "Rollen nur über «Rolle ändern» setzen.",
          })
        }
      }

      if (ctx.path === "/admin/create-user") {
        const body = ctx.body as
          | {
              role?: unknown
              password?: unknown
              data?: Record<string, unknown>
            }
          | undefined
        assertValidRole(body?.role)
        assertValidRole(body?.data?.role)
        // The admin plugin only checks the maximum length here.
        if (
          typeof body?.password === "string" &&
          body.password.length < PASSWORD_MIN_LENGTH
        ) {
          throw new APIError("BAD_REQUEST", {
            code: "PASSWORD_TOO_SHORT",
            message: `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`,
          })
        }
      }

      if (ctx.path === "/admin/set-role") {
        const body = ctx.body as
          { userId?: unknown; role?: unknown } | undefined
        assertValidRole(body?.role)
        // Admins can't change their own role (the admin plugin itself
        // doesn't prevent self-demotion).
        const session = await getSessionFromCtx(ctx)
        if (session && body?.userId === session.user.id) {
          throw new APIError("BAD_REQUEST", {
            code: "CANNOT_CHANGE_OWN_ROLE",
            message: "Sie können Ihre eigene Rolle nicht ändern.",
          })
        }
        if (body?.role !== "admin") {
          await assertAnotherAdminRemains(body?.userId)
        }
      }

      if (ctx.path === "/admin/remove-user" || ctx.path === "/admin/ban-user") {
        await assertAnotherAdminRemains(
          (ctx.body as { userId?: unknown } | undefined)?.userId
        )
      }

      // While TOTP is required for this user, they may not turn it off.
      if (ctx.path === "/two-factor/disable") {
        const session = await getSessionFromCtx(ctx)
        if (session && (await requiresTwoFactor(session.user))) {
          throw new APIError("FORBIDDEN", {
            message:
              "Für Admins ist die Zwei-Faktor-Authentisierung vorgeschrieben.",
          })
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return
      const email = normalizeThrottleEmail(
        (ctx.body as { email?: unknown } | undefined)?.email
      )
      if (!email) return
      const returned = ctx.context.returned
      if (isAPIError(returned)) {
        if (returned.statusCode === 401) await recordSignInFailure(email)
      } else {
        // Password was correct (TOTP, if any, has its own lockout).
        await clearSignInFailures(email)
      }
    }),
  },
  plugins: [
    // TOTP: better-auth locks the account after 10 failed codes (15 min).
    twoFactor({ issuer: APP_NAME }),
    admin(),
    sso({
      // SSO users are provisioned on first sign-in (role "user", from the
      // admin plugin's default). Never link an SSO identity into an existing
      // admin account: that would bypass the admin's password + TOTP.
      resolveUser: async ({ providerId, providerUser }, { database }) => {
        const existing = await database.findOne<{
          id: string
          role?: string | null
        }>({
          model: "user",
          where: [{ field: "email", value: providerUser.email.toLowerCase() }],
        })
        if (!existing || existing.role !== "admin") {
          return { action: "continue" }
        }
        const linked = await database.findOne({
          model: "account",
          where: [
            { field: "userId", value: existing.id },
            { field: "providerId", value: providerId },
          ],
        })
        if (linked) return { action: "continue" }
        return {
          action: "reject",
          code: "ADMIN_ACCOUNT_LINK_FORBIDDEN",
          message:
            "Diese E-Mail-Adresse gehört zu einem Admin-Konto. Bitte mit Passwort anmelden.",
        }
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]
