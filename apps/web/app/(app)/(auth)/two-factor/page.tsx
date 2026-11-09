import type { Metadata } from "next"
import { Suspense } from "react"

import { TwoFactorVerifyForm } from "@/features/two-factor/components/verify-form"

export const metadata: Metadata = { title: "Zwei-Faktor-Authentisierung" }

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorVerifyForm />
    </Suspense>
  )
}
