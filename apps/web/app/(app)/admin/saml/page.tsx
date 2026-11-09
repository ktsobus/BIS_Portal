import { CreateSamlProviderDialog } from "@/features/sso/components/create-saml-provider-dialog"
import { SamlProviders } from "@/features/sso/components/saml-providers"

export default function AdminSamlPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">SAML providers</h2>
          <p className="text-sm text-muted-foreground">
            Users whose email domain matches a provider can sign in with SSO.
            They are created on first sign-in with the role User.
          </p>
        </div>
        <CreateSamlProviderDialog />
      </div>
      <SamlProviders />
    </div>
  )
}
