import "server-only"

import type { SamlProvider } from "@workspace/api"
import { APIError } from "better-auth/api"
import { asc, eq, isNotNull } from "drizzle-orm"

import { db, schema } from "@/db"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"

import { adminOnly, os } from "@/server/orpc"

const authBaseUrl = `${env.BETTER_AUTH_URL}/api/auth`
const appUrl = env.BETTER_AUTH_URL

function toSamlProvider(
  row: typeof schema.ssoProvider.$inferSelect
): SamlProvider {
  let entryPoint = ""
  try {
    entryPoint = JSON.parse(row.samlConfig ?? "{}").entryPoint ?? ""
  } catch {
    // Leave empty if the stored config is not valid JSON.
  }
  return {
    providerId: row.providerId,
    domain: row.domain,
    issuer: row.issuer,
    entryPoint,
    acsUrl: `${authBaseUrl}/sso/saml2/sp/acs/${row.providerId}`,
    spMetadataUrl: `${authBaseUrl}/sso/saml2/sp/metadata?providerId=${encodeURIComponent(row.providerId)}`,
  }
}

async function findProvider(providerId: string) {
  const [row] = await db
    .select()
    .from(schema.ssoProvider)
    .where(eq(schema.ssoProvider.providerId, providerId))
    .limit(1)
  return row
}

export const ssoRouter = {
  // Listed and removed directly: the plugin's own endpoints only show
  // providers registered by the calling admin.
  list: os.sso.list.use(adminOnly).handler(async () => {
    const rows = await db
      .select()
      .from(schema.ssoProvider)
      .where(isNotNull(schema.ssoProvider.samlConfig))
      .orderBy(asc(schema.ssoProvider.providerId))
    return rows.map(toSamlProvider)
  }),

  create: os.sso.create
    .use(adminOnly)
    .handler(async ({ input, context, errors }) => {
      if (await findProvider(input.providerId)) throw errors.CONFLICT()

      try {
        await auth.api.registerSSOProvider({
          headers: context.headers,
          body: {
            providerId: input.providerId,
            issuer: input.issuer,
            domain: input.domain.replace(/\s+/g, "").toLowerCase(),
            samlConfig: {
              entryPoint: input.entryPoint,
              cert: input.cert || undefined,
              idpMetadata: input.idpMetadataXml
                ? { metadata: input.idpMetadataXml }
                : { entityID: input.issuer },
              // Where users land after a successful SAML sign-in.
              callbackUrl: `${appUrl}/dashboard`,
              idpInitiatedCallbackUrl: `${appUrl}/dashboard`,
              spMetadata: {},
              mapping: {
                email: input.emailAttribute || undefined,
                name: input.nameAttribute || undefined,
              },
            },
          },
        })
      } catch (error) {
        if (error instanceof APIError) {
          throw errors.BAD_REQUEST({ message: error.message })
        }
        throw error
      }

      const created = await findProvider(input.providerId)
      return toSamlProvider(created!)
    }),

  remove: os.sso.remove.use(adminOnly).handler(async ({ input, errors }) => {
    const deleted = await db
      .delete(schema.ssoProvider)
      .where(eq(schema.ssoProvider.providerId, input.providerId))
      .returning({ id: schema.ssoProvider.id })
    if (deleted.length === 0) throw errors.NOT_FOUND()
  }),
}

export const authMethodsRouter = {
  methods: os.auth.methods.handler(async () => {
    const [provider] = await db
      .select({ id: schema.ssoProvider.id })
      .from(schema.ssoProvider)
      .limit(1)
    return { sso: Boolean(provider) }
  }),
}
