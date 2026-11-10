import type { Metadata } from "next"

import { PageHead } from "@/components/site/page-head"
import { VerifyForm } from "@/features/two-factor/components/verify-form"
import { safeRedirectPath } from "@/lib/safe-redirect"

export const metadata: Metadata = { title: "Anmeldung bestätigen" }

export default async function TwoFactorPage({
  searchParams,
}: PageProps<"/two-factor">) {
  const params = await searchParams
  const raw = params.callbackUrl
  const callbackUrl = safeRedirectPath(Array.isArray(raw) ? raw[0] : raw)
  return (
    <>
      <PageHead
        title="Anmeldung bestätigen"
        lead="Ihr Konto ist mit einem zweiten Faktor geschützt."
      />
      <div className="container-page py-8 md:py-10">
        <VerifyForm callbackUrl={callbackUrl} />
      </div>
    </>
  )
}
