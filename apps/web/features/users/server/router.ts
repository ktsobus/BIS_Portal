import "server-only"

import type { AdminUser } from "@workspace/api"
import { eq } from "drizzle-orm"

import { db, schema } from "@/db"
import { auth } from "@/lib/auth"

import { adminOnly, os } from "@/server/orpc"

function toAdminUser(
  user: typeof schema.user.$inferSelect,
  providerIds: string[]
): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "user",
    twoFactorEnabled: user.twoFactorEnabled ?? false,
    signInMethods: [...new Set(providerIds)],
    createdAt: user.createdAt,
  }
}

export const userRouter = {
  list: os.user.list.use(adminOnly).handler(async () => {
    const users = await db.query.user.findMany({
      with: { accounts: { columns: { providerId: true } } },
      orderBy: (user, { asc }) => [asc(user.createdAt)],
    })
    return users.map((u) =>
      toAdminUser(
        u,
        u.accounts.map((a) => a.providerId)
      )
    )
  }),

  create: os.user.create
    .use(adminOnly)
    .handler(async ({ input, context, errors }) => {
      const [existing] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.email, input.email.toLowerCase()))
        .limit(1)
      if (existing) throw errors.CONFLICT()

      // Passing the admin's headers lets better-auth re-check permissions.
      const { user } = await auth.api.createUser({
        headers: context.headers,
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
          data: { emailVerified: true },
        },
      })
      const [created] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, user.id))
      return toAdminUser(created!, ["credential"])
    }),

  remove: os.user.remove
    .use(adminOnly)
    .handler(async ({ input, context, errors }) => {
      // Admins can't remove themselves, so at least one admin always remains.
      if (input.id === context.user.id) {
        throw errors.BAD_REQUEST({
          message: "You can't remove your own account",
        })
      }
      const [target] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.id, input.id))
      if (!target) throw errors.NOT_FOUND()

      await auth.api.removeUser({
        headers: context.headers,
        body: { userId: input.id },
      })
    }),
}
