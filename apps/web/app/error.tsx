"use client"

import { ErrorState } from "@/components/site/error-state"
import { SiteHeader } from "@/components/site/site-header"

export default function RootError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main>
        <ErrorState error={error} retry={retry} />
      </main>
    </div>
  )
}
