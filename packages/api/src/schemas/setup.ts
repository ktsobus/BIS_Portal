import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128, "Use at most 128 characters")

export const setupAdminInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email"),
  password: passwordSchema,
})

export type SetupAdminInput = z.infer<typeof setupAdminInputSchema>
