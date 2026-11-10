import type { Metadata } from "next"

import { AdminNav } from "@/features/admin/components/admin-nav"
import { AdminShell } from "@/features/admin/components/admin-shell"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: {
    default: "Administration · BITS-Portal",
    template: "%s · Administration · BITS-Portal",
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
    <AdminShell>
      <div className="wrap admin-top">
        <AdminNav />
        {/* Benannte Region, damit Konto und «Abmelden» per
            Landmarken-Navigation erreichbar sind. */}
        <section aria-label="Angemeldetes Konto" className="admin-account">
          <p className="t-small muted">
            Angemeldet als{" "}
            <span className="admin-account__name" title={user.email}>
              {user.name || user.email}
            </span>
          </p>
          <SignOutButton />
        </section>
      </div>
      {children}
    </AdminShell>
  )
}
