import { z } from "zod"

import { passwordSchema } from "./setup"

export const userRoleSchema = z.enum(["admin", "user"])

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: userRoleSchema,
  twoFactorEnabled: z.boolean(),
  /** Account providers, e.g. "credential" (password) or a SAML provider id. */
  signInMethods: z.array(z.string()),
  createdAt: z.date(),
})

export const createUserInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email("Enter a valid email"),
  password: passwordSchema,
  role: userRoleSchema,
})

export type UserRole = z.infer<typeof userRoleSchema>
export type AdminUser = z.infer<typeof adminUserSchema>
export type CreateUserInput = z.infer<typeof createUserInputSchema>
