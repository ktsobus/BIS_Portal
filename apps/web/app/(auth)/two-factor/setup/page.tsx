import type { Metadata } from "next"

import { PageHead } from "@/components/site/page-head"
import { TwoFactorSetup } from "@/features/two-factor/components/setup"
import { requireSessionAllowNo2FA } from "@/lib/session"
import { requiresTwoFactor } from "@/lib/two-factor"

export const metadata: Metadata = { title: "Zwei-Faktor-Authentisierung" }

export default async function TwoFactorSetupPage() {
  const session = await requireSessionAllowNo2FA()
  const required = await requiresTwoFactor(session.user)
  return (
    <>
      <PageHead
        title="Zwei-Faktor-Authentisierung"
        lead="Neben dem Passwort braucht die Anmeldung einen Code aus einer Authenticator-App auf Ihrem Telefon."
      />
      <div className="container-page py-8 md:py-10">
        <TwoFactorSetup
          enabled={Boolean(session.user.twoFactorEnabled)}
          required={required}
        />
      </div>
    </>
  )
}
