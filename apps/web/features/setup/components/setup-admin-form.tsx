"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { signIn } from "@/lib/auth-client"
import { accountFields, errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

/** Wie `setupAdminInputSchema`, aber mit deutschen Meldungen. */
const formSchema = z
  .object({
    name: accountFields.name,
    email: accountFields.email,
    password: accountFields.password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof formSchema>

const STATUS_ID = "setup-status"

const fields = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
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
    autoComplete: "new-password",
    hint: "Mindestens 12 Zeichen.",
  },
  {
    name: "confirmPassword",
    label: "Passwort wiederholen",
    type: "password",
    autoComplete: "new-password",
  },
] as const

export function SetupAdminForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })
  // Serverfehler bleiben in der Statuszeile stehen.
  const [formError, setFormError] = React.useState<{
    message: string
    setupDone: boolean
  } | null>(null)
  const [leaving, setLeaving] = React.useState(false)

  const createAdmin = useMutation(
    orpc.setup.createAdmin.mutationOptions({
      onError: (error) => {
        const setupDone = "code" in error && error.code === "CONFLICT"
        setFormError({
          message: setupDone
            ? "Die Ersteinrichtung ist bereits abgeschlossen. Melden Sie sich mit einem bestehenden Admin-Konto an."
            : errorMessage(error),
          setupDone,
        })
      },
    })
  )

  async function onSubmit({ name, email, password }: FormValues) {
    setFormError(null)
    await createAdmin.mutateAsync({ name, email, password })
    setLeaving(true)
    const { error } = await signIn.email({ email, password })
    // Konto angelegt, Anmeldung gescheitert: zur Anmeldeseite.
    // If admin TOTP is required (off by default), requireSession() sends
    // the admin on to /two-factor/setup.
    window.location.assign(error ? "/sign-in" : "/admin")
  }

  const { errors, isSubmitting } = form.formState
  const pending = isSubmitting || leaving

  return (
    <div className="wrap">
      <div className="grid grid--top auth">
        <div className="span-5 auth__main">
          <div className="page-head">
            <h1>Ersteinrichtung</h1>
            <p className="t-lead">
              Legen Sie das erste Admin-Konto an. Diese Seite ist nur bis zum
              Abschluss der Ersteinrichtung erreichbar.
            </p>
          </div>
          <form
            noValidate
            onSubmit={form.handleSubmit((values) =>
              onSubmit(values).catch(() => {})
            )}
          >
            <div className="form form--narrow">
              {fields.map((f) => (
                <TextField
                  key={f.name}
                  id={f.name}
                  label={f.label}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  hint={"hint" in f ? f.hint : undefined}
                  error={errors[f.name]?.message}
                  describedById={formError ? STATUS_ID : undefined}
                  {...form.register(f.name)}
                />
              ))}
              <div className="btn-row">
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={pending}
                >
                  {pending ? "Konto wird angelegt …" : "Admin-Konto anlegen"}
                </button>
              </div>
              <Status id={STATUS_ID} bad={Boolean(formError)}>
                {formError ? (
                  <>
                    Admin-Konto nicht angelegt: {formError.message}{" "}
                    {formError.setupDone ? (
                      <a className="link" href="/sign-in">
                        Zur Anmeldung
                      </a>
                    ) : null}
                  </>
                ) : null}
              </Status>
            </div>
          </form>
        </div>
        <aside className="span-4 start-9 aside-card">
          <h2>Weitere Konten</h2>
          <p>Weitere Konten erfassen Sie danach im Admin-Bereich.</p>
        </aside>
      </div>
    </div>
  )
}
