import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { SignInForm } from "@/features/auth/components/sign-in-form"
import { safeRedirectPath } from "@/lib/safe-redirect"
import { getSession } from "@/lib/session"

export const metadata: Metadata = { title: "Anmelden" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>
}) {
  // Bereits angemeldete Admins direkt weiterleiten.
  const session = await getSession()
  if (session?.user.role === "admin") {
    const { callbackUrl } = await searchParams
    const target = safeRedirectPath(
      typeof callbackUrl === "string" ? callbackUrl : null
    )
    redirect(target.startsWith("/sign-in") ? "/admin" : target)
  }

  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
