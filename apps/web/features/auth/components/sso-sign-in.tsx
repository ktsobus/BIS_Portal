"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"

/** SAML-Anmeldung: Die E-Mail-Domäne bestimmt den Identity Provider. */
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
      toast.error(
        errorMessage(
          error,
          {
            NOT_FOUND:
              "Für diese E-Mail-Domäne ist keine Anmeldung über SSO eingerichtet.",
          },
          "Die Anmeldung über SSO ist nicht möglich."
        )
      )
      return
    }
    if (data?.url) window.location.href = data.url
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="sso-email">
          Geschäftliche E-Mail-Adresse
        </FieldLabel>
        <Input
          id="sso-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldDescription>
          Sie werden zur Anmeldung des Kantons weitergeleitet.
        </FieldDescription>
      </Field>
      <Button
        type="submit"
        size="lg"
        variant="outline"
        className="w-full sm:w-auto sm:self-start"
        disabled={pending || !email}
      >
        {pending && <Spinner aria-hidden="true" />}
        Weiter mit SSO
      </Button>
    </form>
  )
}
