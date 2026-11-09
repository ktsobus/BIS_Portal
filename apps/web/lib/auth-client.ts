import { ssoClient } from "@better-auth/sso/client"
import { adminClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [
    // The sign-in form handles `twoFactorRedirect` itself.
    twoFactorClient(),
    adminClient(),
    ssoClient(),
  ],
})

export const { signIn, signOut, useSession } = authClient
