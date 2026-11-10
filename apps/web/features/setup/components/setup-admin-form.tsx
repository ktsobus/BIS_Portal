"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { PageTitle } from "@/components/site/page-title"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
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

const FORM_ERROR_ID = "setup-error"

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
    description: "Mindestens 12 Zeichen.",
  },
  {
    name: "confirmPassword",
    label: "Passwort wiederholen",
    type: "password",
    autoComplete: "new-password",
  },
] as const

export function SetupAdminForm() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })
  // Serverfehler bleiben über dem Formular stehen (kein flüchtiger Toast).
  const [formError, setFormError] = React.useState<{
    message: string
    setupDone: boolean
  } | null>(null)
  const alertRef = React.useRef<HTMLDivElement>(null)
  // Neuer Fehler: Hinweis fokussieren, damit er vorgelesen wird.
  React.useEffect(() => {
    if (formError) alertRef.current?.focus()
  }, [formError])

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
    const { error } = await signIn.email({ email, password })
    if (error) {
      toast.error(
        "Das Admin-Konto ist angelegt, die Anmeldung hat aber nicht geklappt. Bitte melden Sie sich an."
      )
      router.push("/sign-in")
      return
    }
    toast.success("Admin-Konto angelegt")
    // If admin TOTP is required (off by default), requireSession() sends
    // the admin on to /two-factor/setup.
    router.push("/admin")
    router.refresh()
  }

  const pending = form.formState.isSubmitting

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <PageTitle>Ersteinrichtung</PageTitle>
        <p className="text-muted-foreground">
          Legen Sie das erste Admin-Konto an. Diese Seite ist nur bis zum
          Abschluss der Ersteinrichtung erreichbar. Weitere Konten erfassen Sie
          danach im Admin-Bereich.
        </p>
      </div>
      <form
        noValidate
        onSubmit={form.handleSubmit((values) =>
          onSubmit(values).catch(() => {})
        )}
        className="flex flex-col gap-6"
      >
        {formError ? (
          <FormAlert
            ref={alertRef}
            id={FORM_ERROR_ID}
            title="Admin-Konto nicht angelegt"
          >
            <p>{formError.message}</p>
            {formError.setupDone ? (
              <p>
                <Link href="/sign-in" className="link-text">
                  Zur Anmeldung
                </Link>
              </p>
            ) : null}
          </FormAlert>
        ) : null}
        <FieldGroup>
          {fields.map((f) => (
            <Controller
              key={f.name}
              name={f.name}
              control={form.control}
              render={({ field, fieldState }) => {
                const description =
                  "description" in f ? f.description : undefined
                const { descriptionId, errorId, describedBy } =
                  fieldDescribedBy(field.name, {
                    description: Boolean(description),
                    invalid: Boolean(fieldState.error?.message),
                  })
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{f.label}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type={f.type}
                      autoComplete={f.autoComplete}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={describedBy}
                    />
                    {description ? (
                      <FieldDescription id={descriptionId}>
                        {description}
                      </FieldDescription>
                    ) : null}
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
          disabled={pending}
        >
          {pending && <Spinner aria-hidden="true" />}
          Admin-Konto anlegen
        </Button>
      </form>
    </div>
  )
}
