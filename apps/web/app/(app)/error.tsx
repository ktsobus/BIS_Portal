"use client"

import { AdminShell } from "@/features/admin/components/admin-shell"
import { ErrorNotice } from "@/features/admin/components/error-notice"

/**
 * Fehler in Anmeldung, Zwei-Faktor und in den Layouts darunter (z. B.
 * `requireAdmin` im Admin-Layout). Fehler im Layout dieses Segments selbst
 * fängt `app/error.tsx` ab.
 */
export default function AppError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <AdminShell>
      <title>Fehler – Administration – Business-IT-Serviceportal</title>
      <ErrorNotice error={error} retry={retry} />
    </AdminShell>
  )
}
