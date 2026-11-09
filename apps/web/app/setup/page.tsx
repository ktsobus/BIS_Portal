import { redirect } from "next/navigation"

import { SetupAdminForm } from "@/features/setup/components/setup-admin-form"
import { isSetupComplete } from "@/lib/setup"

export default async function SetupPage() {
  if (await isSetupComplete()) redirect("/sign-in")

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <SetupAdminForm />
      </div>
    </div>
  )
}
