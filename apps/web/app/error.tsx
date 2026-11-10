"use client"

import { usePathname } from "next/navigation"

import { AdminShell } from "@/features/admin/components/admin-shell"
import { ErrorNotice } from "@/features/admin/components/error-notice"

/** Bereiche mit Admin-Kopf (Anmeldung, Ersteinrichtung, Administration). */
const ADMIN_PREFIXES = ["/admin", "/sign-in", "/two-factor", "/setup"]

/**
 * Fehlerseite unterhalb des Root-Layouts (mit Schrift, CD und Providern).
 * Fängt u. a. Fehler aus `app/(app)/layout.tsx` (Setup-Prüfung),
 * `app/setup/page.tsx` und den Layouts darunter ab, z. B. wenn die
 * Datenbank nicht erreichbar ist.
 */
export default function RootError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  const pathname = usePathname()
  const isAdminArea = ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  return (
    <AdminShell variant={isAdminArea ? "admin" : "public"}>
      <title>Fehler – Business-IT-Serviceportal</title>
      <ErrorNotice error={error} retry={retry} />
    </AdminShell>
  )
}
