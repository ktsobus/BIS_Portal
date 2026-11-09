import "server-only"

import type { AppSettings } from "@workspace/api"
import { eq } from "drizzle-orm"

import { db, schema } from "@/db"

const SETTINGS_ID = "default"

const defaults: AppSettings = {
  requireAdminTwoFactor: false,
}

export async function getAppSettings(): Promise<AppSettings> {
  const [row] = await db
    .select({ requireAdminTwoFactor: schema.appSettings.requireAdminTwoFactor })
    .from(schema.appSettings)
    .where(eq(schema.appSettings.id, SETTINGS_ID))
    .limit(1)
  return row ?? defaults
}

export async function updateAppSettings(values: Partial<AppSettings>) {
  const [row] = await db
    .insert(schema.appSettings)
    .values({ id: SETTINGS_ID, ...defaults, ...values })
    .onConflictDoUpdate({ target: schema.appSettings.id, set: values })
    .returning({
      requireAdminTwoFactor: schema.appSettings.requireAdminTwoFactor,
    })
  return row!
}
