import { z } from "zod"

import { adminUserSchema, createUserInputSchema } from "../schemas/user"
import { adminContract } from "./base"

export const userContract = {
  list: adminContract.output(z.array(adminUserSchema)),
  create: adminContract
    .errors({
      CONFLICT: { message: "A user with this email already exists" },
    })
    .input(createUserInputSchema)
    .output(adminUserSchema),
  remove: adminContract
    .errors({
      BAD_REQUEST: { message: "This user can't be removed" },
      NOT_FOUND: { message: "User not found" },
    })
    .input(z.object({ id: z.string() }))
    .output(z.void()),
}
