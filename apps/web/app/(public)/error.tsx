"use client"

import { ErrorState } from "@/components/site/error-state"

export default function PublicError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return <ErrorState error={error} retry={retry} />
}
