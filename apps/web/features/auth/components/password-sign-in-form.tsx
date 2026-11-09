"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  fieldDescribedBy,
} from "@/components/ui/field"
import { FormAlert } from "@/components/ui/form-alert"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/lib/auth-client"
import { accountFields, errorMessage } from "@/lib/messages"

const signInSchema = z.object({
  email: accountFields.email,
  password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
})

type SignInValues = z.infer<typeof signInSchema>

const FORM_ERROR_ID = "sign-in-error"

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
  const router = useRouter()
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })
  // Bleibt stehen, bis die Person etwas ändert oder erneut absendet.
  const [formError, setFormError] = React.useState<FormError | null>(null)

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
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      router.push(`/two-factor?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }
    const role =
      data && "user" in data
        ? ((data.user as { role?: string | null }).role ?? null)
        : null
    router.push(targetAfterSignIn(callbackUrl, role))
    router.refresh()
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {formError ? (
        <FormAlert id={FORM_ERROR_ID} title="Anmeldung nicht möglich">
          {formError.message}
        </FormAlert>
      ) : null}
      <FieldGroup>
        {(
          [
            {
              name: "email",
              label: "E-Mail-Adresse",
              type: "email",
              autoComplete: "email",
            },
            {
              name: "password",
              label: "Passwort",
              type: "password",
              autoComplete: "current-password",
            },
          ] as const
        ).map((f) => (
          <Controller
            key={f.name}
            name={f.name}
            control={form.control}
            render={({ field, fieldState }) => {
              const { errorId, describedBy } = fieldDescribedBy(field.name, {
                invalid: Boolean(fieldState.error?.message),
              })
              const serverInvalid = Boolean(formError?.credentials)
              return (
                <Field data-invalid={fieldState.invalid || serverInvalid}>
                  <FieldLabel htmlFor={field.name}>{f.label}</FieldLabel>
                  <Input
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      setFormError(null)
                    }}
                    id={field.name}
                    type={f.type}
                    autoComplete={f.autoComplete}
                    aria-invalid={fieldState.invalid || serverInvalid}
                    aria-describedby={
                      [describedBy, formError ? FORM_ERROR_ID : null]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError id={errorId} errors={[fieldState.error]} />
                  )}
                </Field>
              )
            }}
          />
        ))}
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto sm:self-start"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Spinner aria-hidden="true" />}
        Anmelden
      </Button>
    </form>
  )
}
