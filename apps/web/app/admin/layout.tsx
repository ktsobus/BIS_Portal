import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdmin } from "@/lib/session"
import { requireSetupComplete } from "@/lib/setup"

export const metadata: Metadata = {
  title: { default: "Verwaltung", template: "%s · Verwaltung · BITS-Portal" },
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireSetupComplete()
  const session = await requireAdmin()
  return (
    <AdminShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AdminShell>
  )
}
