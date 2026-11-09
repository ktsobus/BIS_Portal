import { oc } from "@orpc/contract"
import { z } from "zod"

import { setupAdminInputSchema } from "../schemas/setup"

export const setupContract = {
  /** Creates the first admin. Only works while no admin exists. */
  createAdmin: oc
    .errors({
      CONFLICT: { message: "Setup has already been completed" },
    })
    .input(setupAdminInputSchema)
    .output(z.void()),
}
