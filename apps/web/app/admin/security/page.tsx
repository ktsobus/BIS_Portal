import type { Metadata } from "next"

import { SecuritySettings } from "@/features/settings/components/security-settings"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = { title: "Sicherheit" }

export default async function AdminSecurityPage() {
  const session = await requireAdmin()
  return (
    <SecuritySettings
      twoFactorEnabled={Boolean(session.user.twoFactorEnabled)}
    />
  )
}
