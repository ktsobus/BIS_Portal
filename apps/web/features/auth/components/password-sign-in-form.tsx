"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { signIn } from "@/lib/auth-client"
import { accountFields, errorMessage } from "@/lib/messages"

const signInSchema = z.object({
  email: accountFields.email,
  password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
})

type SignInValues = z.infer<typeof signInSchema>

const STATUS_ID = "sign-in-status"

/**
 * Ziel nach der Anmeldung: Nur Admins dürfen in den Admin-Bereich; alle
 * anderen landen im Portal (dort ist keine Anmeldung nötig).
 */
function targetAfterSignIn(callbackUrl: string, role: string | null) {
  if (role !== "admin" && callbackUrl.startsWith("/admin")) return "/"
  return callbackUrl
}

interface FormError {
  message: string
  /** Beide Felder als ungültig markieren (falsche Zugangsdaten). */
  credentials: boolean
}

export function PasswordSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })
  // Bleibt stehen, bis die Person etwas ändert oder erneut absendet.
  const [formError, setFormError] = React.useState<FormError | null>(null)
  // Nach erfolgreicher Anmeldung lädt die Zielseite; der Knopf bleibt gesperrt.
  const [leaving, setLeaving] = React.useState(false)
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: SignInValues) {
    setFormError(null)
    const { data, error } = await signIn.email(values)
    if (error) {
      setFormError({
        message: errorMessage(error, {}, "Die Anmeldung hat nicht geklappt."),
        credentials: error.code === "INVALID_EMAIL_OR_PASSWORD",
      })
      form.setValue("password", "")
      form.setFocus("password")
      return
    }
    setLeaving(true)
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      window.location.assign(
        `/two-factor?callbackUrl=${encodeURIComponent(callbackUrl)}`
      )
      return
    }
    const role =
      data && "user" in data
        ? ((data.user as { role?: string | null }).role ?? null)
        : null
    // Ganze Seite laden: Das Ziel liest die neue Sitzung auf dem Server.
    window.location.assign(targetAfterSignIn(callbackUrl, role))
  }

  const serverInvalid = Boolean(formError?.credentials)
  const busy = isSubmitting || leaving

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="form form--narrow">
        <TextField
          id="email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          invalid={serverInvalid}
          describedById={formError ? STATUS_ID : undefined}
          {...form.register("email", { onChange: () => setFormError(null) })}
        />
        <TextField
          id="password"
          label="Passwort"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          invalid={serverInvalid}
          describedById={formError ? STATUS_ID : undefined}
          {...form.register("password", { onChange: () => setFormError(null) })}
        />
        <div className="btn-row">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Anmeldung läuft …" : "Anmelden"}
          </button>
        </div>
        <Status id={STATUS_ID} bad={Boolean(formError)}>
          {formError ? `Anmeldung nicht möglich: ${formError.message}` : null}
        </Status>
      </div>
    </form>
  )
}
