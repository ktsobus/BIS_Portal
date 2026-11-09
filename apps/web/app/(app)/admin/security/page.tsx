import type { Metadata } from "next"

import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { SecuritySettings } from "@/features/settings/components/security-settings"

export const metadata: Metadata = { title: "Sicherheit" }

export default function AdminSecurityPage() {
  return (
    <>
      <AdminPageHeader
        title="Sicherheit"
        description="Zwei-Faktor-Authentisierung für Admins, die sich mit Passwort anmelden."
      />
      <SecuritySettings />
    </>
  )
}
