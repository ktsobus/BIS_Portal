import type { Metadata } from "next"

import { AdminShell } from "@/features/admin/components/admin-shell"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: {
    default: "Administration · Business-IT-Serviceportal",
    template: "%s · Administration · Business-IT-Serviceportal",
  },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireAdmin()

  return (
    <AdminShell
      withTabs
      meta={[
        {
          key: "user",
          node: (
            <span className="inline-flex min-h-11 items-center type-body-sm">
              Angemeldet als&nbsp;
              <strong title={user.email}>{user.name || user.email}</strong>
            </span>
          ),
        },
        { key: "sign-out", node: <SignOutButton /> },
      ]}
    >
      {children}
    </AdminShell>
  )
}
