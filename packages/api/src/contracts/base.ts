import { oc } from "@orpc/contract"

/** Errors any signed-in procedure can return. */
export const authedErrors = {
  UNAUTHORIZED: { message: "You must be signed in" },
  TWO_FACTOR_REQUIRED: {
    status: 403,
    message: "Set up two-factor authentication to continue",
  },
} as const

/** Base for procedures that require a signed-in user. */
export const authedContract = oc.errors(authedErrors)

/** Base for procedures that require an admin. */
export const adminContract = oc.errors({
  ...authedErrors,
  FORBIDDEN: { message: "Admin access required" },
})
