import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "@/lib/env"

import * as schema from "./schema"

// Reuse the connection across hot reloads in development.
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined
}
const client = globalForDb.client ?? postgres(env.DATABASE_URL)
if (env.NODE_ENV !== "production") globalForDb.client = client

export const db = drizzle(client, { schema, casing: "snake_case" })
export type Database = typeof db

export { schema }
