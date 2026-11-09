import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminShell } from "@/features/admin/components/admin-shell"
import { SetupAdminForm } from "@/features/setup/components/setup-admin-form"
import { isSetupComplete } from "@/lib/setup"

export const metadata: Metadata = {
  title: "Ersteinrichtung",
  robots: { index: false, follow: false },
}

export default async function SetupPage() {
  if (await isSetupComplete()) redirect("/sign-in")

  return (
    <AdminShell>
      <div className="max-w-xl">
        <SetupAdminForm />
      </div>
    </AdminShell>
  )
}
