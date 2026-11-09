import type { Metadata } from "next"

import { AdminNav } from "@/features/admin/components/admin-nav"
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
      toolbar={
        <>
          <AdminNav />
          {/* Benannte Region, damit Benutzername und «Abmelden» per
              Landmarken-Navigation erreichbar sind. */}
          <section
            aria-label="Angemeldetes Konto"
            className="flex min-h-11 flex-wrap items-center gap-x-3 pb-1 text-sm"
          >
            <span className="text-muted-foreground">
              Angemeldet als{" "}
              <span className="text-foreground" title={user.email}>
                {user.name || user.email}
              </span>
            </span>
            <SignOutButton />
          </section>
        </>
      }
    >
      {children}
    </AdminShell>
  )
}
