import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageHead } from "@/components/site/page-head"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { errorMessage } from "@/lib/messages"
import { serverClient } from "@/lib/orpc-server"
import { safeRedirectPath } from "@/lib/safe-redirect"
import { getSession } from "@/lib/session"
import { requireSetupComplete } from "@/lib/setup"

export const metadata: Metadata = { title: "Anmelden" }

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  await requireSetupComplete()
  const params = await searchParams
  const callbackUrl = safeRedirectPath(first(params.callbackUrl))
  if (await getSession()) redirect(callbackUrl)

  const methods = await serverClient.auth.methods()
  const errorCode = first(params.error)
  const error = errorCode
    ? errorMessage(
        { code: errorCode },
        {},
        "Die Anmeldung mit Kantonskonto ist fehlgeschlagen. Bitte versuchen Sie es erneut."
      )
    : null

  return (
    <>
      <PageHead
        title="Anmelden"
        lead="Verwaltung des BITS-Portals: Katalog-Abgleich, Datenqualität und Zugänge. Der Katalog selbst ist ohne Anmeldung zugänglich."
      />
      <div className="container-page py-8 md:py-10">
        <SignInForm sso={methods.sso} callbackUrl={callbackUrl} error={error} />
      </div>
    </>
  )
}
