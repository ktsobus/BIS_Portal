"use client"

import { ErrorNotice } from "@/features/admin/components/error-notice"

/** Fehler auf einer Admin-Seite: bleibt im Rahmen mit Bereichen und Abmelden. */
export default function AdminError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return <ErrorNotice error={error} retry={retry} />
}
