import "server-only"

import { sso } from "@better-auth/sso"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"
import { admin, twoFactor } from "better-auth/plugins"

import { db, schema } from "@/db"
import { sendResetPasswordEmail, sendVerifyEmail } from "@/lib/email"
import { env } from "@/lib/env"
import { requiresTwoFactor } from "@/lib/two-factor"

export const APP_NAME = "Next.js Template"

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

export const auth = betterAuth({
  appName: APP_NAME,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  // Native transactions are required by the SSO plugin's `resolveUser`.
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  emailAndPassword: {
    enabled: true,
    // No public sign-up: the first admin is created at /setup, further
    // password users are created by admins (admin plugin `createUser`).
    disableSignUp: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, { name: user.name, url })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerifyEmail(user.email, { name: user.name, url })
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (SSO_MANAGEMENT_PATHS.has(ctx.path)) {
        const session = await getSessionFromCtx(ctx)
        if (session?.user.role !== "admin") {
          throw new APIError("FORBIDDEN", { message: "Admin access required" })
        }
      }

      // While TOTP is required for this user, they may not turn it off.
      if (ctx.path === "/two-factor/disable") {
        const session = await getSessionFromCtx(ctx)
        if (session && (await requiresTwoFactor(session.user))) {
          throw new APIError("FORBIDDEN", {
            message: "Two-factor authentication is required for admins",
          })
        }
      }
    }),
  },
  plugins: [
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
            "This email belongs to an admin account. Sign in with a password.",
        }
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]
