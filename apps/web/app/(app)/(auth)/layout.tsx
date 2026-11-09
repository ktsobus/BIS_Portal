import type { Metadata } from "next"

import { AdminShell } from "@/features/admin/components/admin-shell"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/** Anmeldung und Zwei-Faktor: schmale, linksbündige Spalte. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminShell>
      <div className="max-w-xl">{children}</div>
    </AdminShell>
  )
}
