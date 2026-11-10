"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Notice } from "@/components/ui/notice"
import { errorMessage } from "@/lib/messages"

function codeOf(error: unknown): string | null {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : null
}

/** Fehler beim Laden einer Admin-Ansicht, mit dem passenden nächsten Schritt. */
export function QueryError({
  error,
  onRetry,
  retrying = false,
}: {
  error: unknown
  onRetry: () => void
  retrying?: boolean
}) {
  const code = codeOf(error)
  return (
    <Notice
      tone="error"
      title="Die Daten konnten nicht geladen werden"
      action={
        code === "UNAUTHORIZED" ? (
          <Button asChild size="sm">
            <Link href="/sign-in">Zur Anmeldung</Link>
          </Button>
        ) : code === "TWO_FACTOR_REQUIRED" ? (
          <Button asChild size="sm">
            <Link href="/two-factor/setup">Zwei-Faktor einrichten</Link>
          </Button>
        ) : (
          <Button size="sm" loading={retrying} onClick={onRetry}>
            Erneut versuchen
          </Button>
        )
      }
    >
      {errorMessage(error)}
    </Notice>
  )
}
