import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { TwoFactorSetup } from "@/features/two-factor/components/setup"
import { requireSessionAllowNo2FA } from "@/lib/session"

export const metadata: Metadata = {
  title: "Zwei-Faktor-Authentisierung einrichten",
}

export default async function TwoFactorSetupPage() {
  const { user } = await requireSessionAllowNo2FA()
  if (user.twoFactorEnabled) redirect("/admin")

  return <TwoFactorSetup />
}
