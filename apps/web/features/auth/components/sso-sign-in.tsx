"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

/** SAML sign-in: the email domain selects the identity provider. */
export function SsoSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const { data, error } = await authClient.signIn.sso({
      email,
      callbackURL: callbackUrl,
      errorCallbackURL: "/sign-in?error=sso",
    })
    if (error) {
      setPending(false)
      toast.error(error.message ?? "No SSO provider for this email")
      return
    }
    if (data?.url) window.location.href = data.url
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="sso-email">Work email</FieldLabel>
        <Input
          id="sso-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Button type="submit" variant="outline" disabled={pending || !email}>
        {pending && <Spinner />}
        Continue with SSO
      </Button>
    </form>
  )
}
