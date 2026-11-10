"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, fieldProps, Input } from "@/components/ui/field"
import { Notice } from "@/components/ui/notice"
import { PasswordInput } from "@/components/ui/password-input"
import { authClient } from "@/lib/auth-client"
import { accountFields, errorMessage } from "@/lib/messages"

const passwordSchema = z.object({
  email: accountFields.email,
  password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
})
type PasswordValues = z.infer<typeof passwordSchema>

const ssoSchema = z.object({ email: accountFields.email })
type SsoValues = z.infer<typeof ssoSchema>

function PasswordSignIn({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: PasswordValues) {
    setError(null)
    try {
      const result = await authClient.signIn.email(values)
      if (result.error) {
        setError(errorMessage(result.error))
        return
      }
      const needsCode =
        "twoFactorRedirect" in result.data && result.data.twoFactorRedirect
      router.push(
        needsCode
          ? `/two-factor?callbackUrl=${encodeURIComponent(callbackUrl)}`
          : callbackUrl
      )
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field id="email" label="E-Mail-Adresse" error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="username"
          {...fieldProps("email", { error: Boolean(errors.email) })}
          {...form.register("email")}
        />
      </Field>
      <Field id="password" label="Passwort" error={errors.password?.message}>
        <PasswordInput
          autoComplete="current-password"
          {...fieldProps("password", { error: Boolean(errors.password) })}
          {...form.register("password")}
        />
      </Field>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        className="w-full"
      >
        Anmelden
      </Button>
      <p className="text-sm text-muted">
        Passwort vergessen? Eine andere Person mit Adminrechten kann Ihr Konto
        neu erfassen. Das Portal verschickt keine E-Mails.
      </p>
    </form>
  )
}

function SsoSignIn({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm<SsoValues>({
    resolver: zodResolver(ssoSchema),
    defaultValues: { email: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit({ email }: SsoValues) {
    setError(null)
    try {
      const result = await authClient.signIn.sso({
        email,
        callbackURL: callbackUrl,
        errorCallbackURL: "/sign-in?error=sso",
      })
      if (result.error) {
        setError(
          errorMessage(
            result.error,
            {},
            "Für diese E-Mail-Adresse ist keine Anmeldung mit Kantonskonto eingerichtet."
          )
        )
        return
      }
      if (result.data?.url) window.location.assign(result.data.url)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Field
        id="sso-email"
        label="E-Mail-Adresse"
        hint="Sie werden zur Anmeldung Ihrer Organisation weitergeleitet."
        error={errors.email?.message}
      >
        <Input
          type="email"
          autoComplete="username"
          {...fieldProps("sso-email", {
            hint: true,
            error: Boolean(errors.email),
          })}
          {...form.register("email")}
        />
      </Field>
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        className="w-full"
      >
        Weiter mit Kantonskonto
      </Button>
    </form>
  )
}

/**
 * Anmeldung zur Verwaltung: mit Kantonskonto (SAML), sofern ein Provider
 * eingerichtet ist, und mit Passwort.
 */
export function SignInForm({
  sso,
  callbackUrl,
  error,
}: {
  sso: boolean
  callbackUrl: string
  /** Meldung aus einer fehlgeschlagenen SSO-Anmeldung. */
  error?: string | null
}) {
  return (
    <div className="max-w-[28rem] space-y-5">
      {error ? <Notice tone="error">{error}</Notice> : null}
      {sso ? (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold">Mit Kantonskonto</h2>
          <SsoSignIn callbackUrl={callbackUrl} />
        </Card>
      ) : null}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">
          {sso ? "Mit Passwort" : "Mit E-Mail-Adresse und Passwort"}
        </h2>
        <PasswordSignIn callbackUrl={callbackUrl} />
      </Card>
    </div>
  )
}
