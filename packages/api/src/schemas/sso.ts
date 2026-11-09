import { z } from "zod"

export const samlProviderSchema = z.object({
  providerId: z.string(),
  /** Comma-separated email domains routed to this IdP. */
  domain: z.string(),
  /** IdP entity ID. */
  issuer: z.string(),
  /** IdP single sign-on URL. */
  entryPoint: z.string(),
  /** SP values to configure in the IdP. */
  acsUrl: z.string(),
  spMetadataUrl: z.string(),
})

const pemOrEmpty = z.string().trim().optional()

export const createSamlProviderInputSchema = z
  .object({
    providerId: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        "Use lowercase letters, numbers and dashes"
      ),
    domain: z
      .string()
      .trim()
      .min(3, "Enter at least one email domain")
      .regex(
        /^[a-z0-9.-]+\.[a-z]{2,}(,\s*[a-z0-9.-]+\.[a-z]{2,})*$/i,
        "Comma-separated domains, e.g. example.com"
      ),
    issuer: z.url("IdP entity ID must be a URL"),
    entryPoint: z.url("IdP SSO URL must be a URL"),
    cert: pemOrEmpty,
    idpMetadataXml: pemOrEmpty,
    emailAttribute: z.string().trim().optional(),
    nameAttribute: z.string().trim().optional(),
  })
  .refine((v) => Boolean(v.cert || v.idpMetadataXml), {
    message: "Provide the IdP signing certificate or its metadata XML",
    path: ["cert"],
  })

export const authMethodsSchema = z.object({
  /** At least one SAML provider is configured. */
  sso: z.boolean(),
})

export type SamlProvider = z.infer<typeof samlProviderSchema>
export type CreateSamlProviderInput = z.infer<
  typeof createSamlProviderInputSchema
>
export type AuthMethods = z.infer<typeof authMethodsSchema>
