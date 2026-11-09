import { z } from "zod"

export const appSettingsSchema = z.object({
  /** Require TOTP for admins that sign in with a password. */
  requireAdminTwoFactor: z.boolean(),
})

export const updateAppSettingsInputSchema = appSettingsSchema.partial()

export type AppSettings = z.infer<typeof appSettingsSchema>
export type UpdateAppSettingsInput = z.infer<
  typeof updateAppSettingsInputSchema
>
