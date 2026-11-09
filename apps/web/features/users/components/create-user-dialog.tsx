"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateUserInput } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserPlusIcon } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

const FORM_ERROR_ID = "create-user-error"

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
    description:
      "Mindestens 12 Zeichen. Teilen Sie es der Person auf sicherem Weg mit.",
  },
] as const

export function CreateUserDialog() {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  // Serverfehler ohne Feldbezug bleiben im Dialog stehen (kein Toast).
  const [formError, setFormError] = React.useState<string | null>(null)
  const alertRef = React.useRef<HTMLDivElement>(null)
  // Neuer Fehler: Hinweis fokussieren, damit er vorgelesen wird.
  React.useEffect(() => {
    if (formError) alertRef.current?.focus()
  }, [formError])

  const createUser = useMutation(
    orpc.user.create.mutationOptions({
      onSuccess: async (user) => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        toast.success(`Admin-Konto ${user.email} erfasst`)
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setFormError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg">
          <UserPlusIcon aria-hidden="true" />
          Admin-Konto erfassen
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Neues Admin-Konto</DialogTitle>
          <DialogDescription>
            Erfasst ein Konto mit E-Mail-Adresse und Passwort. Es hat Zugriff
            auf den ganzen Admin-Bereich. Für den Katalog ist keine Anmeldung
            nötig.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-user-form"
          noValidate
          onSubmit={form.handleSubmit(submit)}
          className="flex flex-col gap-5"
        >
          {formError ? (
            <FormAlert
              ref={alertRef}
              id={FORM_ERROR_ID}
              title="Konto nicht erfasst"
            >
              {formError}
            </FormAlert>
          ) : null}
          <FieldGroup>
            {textFields.map((f) => (
              <Controller
                key={f.name}
                name={f.name}
                control={form.control}
                render={({ field, fieldState }) => {
                  const description =
                    "description" in f ? f.description : undefined
                  const { descriptionId, errorId, describedBy } =
                    fieldDescribedBy(`create-user-${field.name}`, {
                      description: Boolean(description),
                      invalid: Boolean(fieldState.error?.message),
                    })
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`create-user-${field.name}`}>
                        {f.label}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`create-user-${field.name}`}
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
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-user-form"
            disabled={createUser.isPending}
          >
            {createUser.isPending && <Spinner aria-hidden="true" />}
            Admin-Konto erfassen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
