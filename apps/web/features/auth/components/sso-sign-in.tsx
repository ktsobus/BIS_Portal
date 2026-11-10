"use client"

import * as React from "react"

import { TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"

const STATUS_ID = "sso-status"

/** SAML-Anmeldung: Die E-Mail-Domäne bestimmt den Identity Provider. */
export function SsoSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  // Bleibt stehen, bis die Person die Adresse ändert oder erneut absendet.
  const [formError, setFormError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setPending(true)
    const { data, error } = await authClient.signIn.sso({
      email,
      callbackURL: callbackUrl,
      errorCallbackURL: "/sign-in?error=sso",
    })
    if (error) {
      setPending(false)
      setFormError(
        errorMessage(
          error,
          {
            NOT_FOUND:
              "Für diese E-Mail-Domäne ist keine Anmeldung über SSO eingerichtet.",
          },
          "Die Anmeldung über SSO ist nicht möglich."
        )
      )
      inputRef.current?.focus()
      return
    }
    if (data?.url) window.location.href = data.url
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form form--narrow">
        <TextField
          ref={inputRef}
          id="sso-email"
          label="Geschäftliche E-Mail-Adresse"
          type="email"
          autoComplete="email"
          inputMode="email"
          hint="Sie werden zur Anmeldung des Kantons weitergeleitet."
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setFormError(null)
          }}
          invalid={Boolean(formError)}
          describedById={formError ? STATUS_ID : undefined}
        />
        <div className="btn-row">
          <button
            className="btn btn--secondary"
            type="submit"
            disabled={pending || !email}
          >
            {pending ? "Weiterleitung …" : "Weiter mit SSO"}
          </button>
        </div>
        <Status id={STATUS_ID} bad={Boolean(formError)}>
          {formError ? `Anmeldung über SSO nicht möglich: ${formError}` : null}
        </Status>
      </div>
    </form>
  )
}
