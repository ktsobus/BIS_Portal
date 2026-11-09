import "server-only"

import { sql } from "drizzle-orm"

import { db } from "@/db"
import { auth } from "@/lib/auth"
import { isSetupComplete } from "@/lib/setup"

import { os } from "@/server/orpc"

// Arbitrary constant identifying the "create first admin" advisory lock.
const SETUP_LOCK_ID = 7_294_001

export const setupRouter = {
  createAdmin: os.setup.createAdmin.handler(async ({ input, errors }) => {
    await db.transaction(async (tx) => {
      // Serialize concurrent setup attempts; the lock is released on commit.
      await tx.execute(sql`select pg_advisory_xact_lock(${SETUP_LOCK_ID})`)
      if (await isSetupComplete()) throw errors.CONFLICT()

      // Called without headers, so better-auth treats it as a trusted
      // server-side call and skips the admin-session check.
      await auth.api.createUser({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
          role: "admin",
          data: { emailVerified: true },
        },
      })
    })
  }),
}
