import {
  appSettingsSchema,
  updateAppSettingsInputSchema,
} from "../schemas/settings"
import { adminContract } from "./base"

export const settingsContract = {
  get: adminContract.output(appSettingsSchema),
  update: adminContract
    .errors({
      PRECONDITION_FAILED: {
        message:
          "Enable two-factor authentication on your own account before requiring it for admins",
      },
    })
    .input(updateAppSettingsInputSchema)
    .output(appSettingsSchema),
}
