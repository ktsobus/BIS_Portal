"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateUserInput } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Dialog } from "@/components/ui/dialog"
import { TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { accountFields, errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

/**
 * Wie `createUserInputSchema`, aber mit deutschen Meldungen. Passwortkonten
 * werden immer als Admin angelegt: Der Katalog ist ohne Anmeldung
 * zugänglich, ein Passwortkonto ohne Adminrechte hätte keine Funktion. Die
 * Rolle «Benutzer» entsteht nur bei der ersten SAML-Anmeldung.
 */
const formSchema = z.object({
  name: accountFields.name,
  email: accountFields.email,
  password: accountFields.password,
})

type FormValues = z.infer<typeof formSchema>

const defaultValues: FormValues = { name: "", email: "", password: "" }

const STATUS_ID = "create-user-status"

const textFields = [
  { name: "name", label: "Name", type: "text", autoComplete: "off" },
  {
    name: "email",
    label: "E-Mail-Adresse",
    type: "email",
    autoComplete: "off",
  },
  {
    name: "password",
    label: "Erstes Passwort",
    type: "password",
    autoComplete: "new-password",
    hint: "Mindestens 12 Zeichen. Teilen Sie es der Person auf sicherem Weg mit.",
  },
] as const

export function CreateUserDialog() {
  const [open, setOpen] = React.useState(false)
  // Bestätigung nach dem Schliessen des Dialogs, neben dem Knopf.
  const [created, setCreated] = React.useState<string | null>(null)
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  // Serverfehler ohne Feldbezug bleiben im Dialog stehen.
  const [formError, setFormError] = React.useState<string | null>(null)

  const createUser = useMutation(
    orpc.user.create.mutationOptions({
      onSuccess: async (user) => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        setCreated(`Admin-Konto ${user.email} erfasst.`)
        form.reset(defaultValues)
        setOpen(false)
      },
      onError: (error) => {
        if ("code" in error && error.code === "CONFLICT") {
          form.setError(
            "email",
            {
              type: "server",
              message: "Es gibt bereits ein Konto mit dieser E-Mail-Adresse.",
            },
            { shouldFocus: true }
          )
          return
        }
        setFormError(errorMessage(error))
      },
    })
  )

  function submit(values: FormValues) {
    setFormError(null)
    const input: CreateUserInput = { ...values, role: "admin" }
    createUser.mutate(input)
  }

  function close() {
    setOpen(false)
    setFormError(null)
    form.reset(defaultValues)
  }

  const { errors } = form.formState

  return (
    <>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          setCreated(null)
          setOpen(true)
        }}
      >
        Admin-Konto erfassen
      </button>
      <p role="status" className="admin-head__status t-small">
        {created}
      </p>
      <Dialog
        open={open}
        onClose={close}
        title="Neues Admin-Konto"
        description="Erfasst ein Konto mit E-Mail-Adresse und Passwort. Es hat Zugriff auf den ganzen Admin-Bereich. Für den Katalog ist keine Anmeldung nötig."
      >
        <form noValidate onSubmit={form.handleSubmit(submit)}>
          <div className="form">
            {textFields.map((f) => (
              <TextField
                key={f.name}
                id={`create-user-${f.name}`}
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
                type="button"
                className="btn btn--secondary"
                onClick={close}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={createUser.isPending}
              >
                {createUser.isPending
                  ? "Konto wird erfasst …"
                  : "Admin-Konto erfassen"}
              </button>
            </div>
            <Status id={STATUS_ID} bad={Boolean(formError)}>
              {formError ? `Konto nicht erfasst: ${formError}` : null}
            </Status>
          </div>
        </form>
      </Dialog>
    </>
  )
}
