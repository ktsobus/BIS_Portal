import { redirect } from "next/navigation"

import { TwoFactorSetup } from "@/features/two-factor/components/setup"
import { requireSessionAllowNo2FA } from "@/lib/session"

export default async function TwoFactorSetupPage() {
  const { user } = await requireSessionAllowNo2FA()
  if (user.twoFactorEnabled) redirect("/admin")

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <TwoFactorSetup />
      </div>
    </div>
  )
}
