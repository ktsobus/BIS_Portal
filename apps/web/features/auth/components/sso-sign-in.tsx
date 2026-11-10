"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
  fieldDescribedBy,
} from "@/components/ui/field"
import { FormAlert } from "@/components/ui/form-alert"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"

const FORM_ERROR_ID = "sso-error"

/** SAML-Anmeldung: Die E-Mail-Domäne bestimmt den Identity Provider. */
export function SsoSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  // Bleibt stehen, bis die Person die Adresse ändert oder erneut absendet.
  const [formError, setFormError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { descriptionId, describedBy } = fieldDescribedBy("sso-email", {
    description: true,
  })

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
    <form onSubmit={submit} className="flex w-full flex-col gap-6">
      {formError ? (
        <FormAlert id={FORM_ERROR_ID} title="Anmeldung über SSO nicht möglich">
          {formError}
        </FormAlert>
      ) : null}
      <Field data-invalid={Boolean(formError)}>
        <FieldLabel htmlFor="sso-email">
          Geschäftliche E-Mail-Adresse
        </FieldLabel>
        <Input
          ref={inputRef}
          id="sso-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setFormError(null)
          }}
          aria-invalid={Boolean(formError)}
          aria-describedby={
            [describedBy, formError ? FORM_ERROR_ID : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <FieldDescription id={descriptionId}>
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
