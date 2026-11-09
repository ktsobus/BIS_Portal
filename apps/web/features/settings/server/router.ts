import "server-only"

import { getAppSettings, updateAppSettings } from "@/lib/settings"

import { adminOnly, os } from "@/server/orpc"

export const settingsRouter = {
  get: os.settings.get.use(adminOnly).handler(() => getAppSettings()),

  update: os.settings.update
    .use(adminOnly)
    .handler(async ({ input, context, errors }) => {
      // Don't let an admin require TOTP without having it themselves,
      // otherwise they'd be locked into enrolment mid-request.
      if (input.requireAdminTwoFactor && !context.user.twoFactorEnabled) {
        throw errors.PRECONDITION_FAILED()
      }
      return updateAppSettings(input)
    }),
}
