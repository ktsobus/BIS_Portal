import { Suspense } from "react"

import { TwoFactorVerifyForm } from "@/features/two-factor/components/verify-form"

export default function TwoFactorPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Suspense>
          <TwoFactorVerifyForm />
        </Suspense>
      </div>
    </div>
  )
}
