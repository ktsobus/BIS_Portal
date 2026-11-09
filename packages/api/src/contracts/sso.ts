import { oc } from "@orpc/contract"
import { z } from "zod"

import {
  authMethodsSchema,
  createSamlProviderInputSchema,
  samlProviderSchema,
} from "../schemas/sso"
import { adminContract } from "./base"

export const ssoContract = {
  list: adminContract.output(z.array(samlProviderSchema)),
  create: adminContract
    .errors({
      CONFLICT: { message: "A provider with this ID already exists" },
      BAD_REQUEST: { message: "The provider configuration is invalid" },
    })
    .input(createSamlProviderInputSchema)
    .output(samlProviderSchema),
  remove: adminContract
    .errors({ NOT_FOUND: { message: "Provider not found" } })
    .input(z.object({ providerId: z.string() }))
    .output(z.void()),
}

export const authMethodsContract = {
  /** Public: which sign-in options the sign-in page should offer. */
  methods: oc.output(authMethodsSchema),
}
