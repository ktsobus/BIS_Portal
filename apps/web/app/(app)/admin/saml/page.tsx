import type { Metadata } from "next"

import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { CreateSamlProviderDialog } from "@/features/sso/components/create-saml-provider-dialog"
import { SamlProviders } from "@/features/sso/components/saml-providers"

export const metadata: Metadata = { title: "SAML" }

export default function AdminSamlPage() {
  return (
    <>
      <AdminPageHeader
        title="SAML-Anmeldung"
        description="Personen, deren E-Mail-Domäne zu einem Identity Provider passt, können sich mit SSO anmelden. Sie werden bei der ersten Anmeldung mit der Rolle «Benutzer» angelegt; Adminrechte vergeben Sie unter «Benutzer»."
        action={<CreateSamlProviderDialog />}
      />
      <SamlProviders />
    </>
  )
}
