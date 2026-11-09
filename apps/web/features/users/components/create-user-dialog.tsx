"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { userRoleSchema, type CreateUserInput } from "@workspace/api"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { accountFields, errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { roleLabels } from "./labels"

/** Wie `createUserInputSchema`, aber mit deutschen Meldungen. */
const formSchema = z.object({
  name: accountFields.name,
  email: accountFields.email,
  password: accountFields.password,
  role: userRoleSchema,
}) satisfies z.ZodType<CreateUserInput>

const defaultValues: CreateUserInput = {
  name: "",
  email: "",
  password: "",
  role: "user",
}

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
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const createUser = useMutation(
    orpc.user.create.mutationOptions({
      onSuccess: async (user) => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        toast.success(`Benutzer ${user.email} erfasst`)
        form.reset(defaultValues)
        setOpen(false)
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, {
            CONFLICT:
              "Es gibt bereits einen Benutzer mit dieser E-Mail-Adresse.",
          })
        ),
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <UserPlusIcon aria-hidden="true" />
          Neuer Benutzer
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Neuer Benutzer</DialogTitle>
          <DialogDescription>
            Erfasst ein Konto, das sich mit E-Mail-Adresse und Passwort
            anmeldet.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-user-form"
          noValidate
          onSubmit={form.handleSubmit((values) => createUser.mutate(values))}
        >
          <FieldGroup>
            {textFields.map((f) => (
              <Controller
                key={f.name}
                name={f.name}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{f.label}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type={f.type}
                      autoComplete={f.autoComplete}
                      aria-invalid={fieldState.invalid}
                    />
                    {"description" in f && (
                      <FieldDescription>{f.description}</FieldDescription>
                    )}
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            ))}
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Rolle</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{roleLabels.user}</SelectItem>
                      <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Admins haben Zugriff auf den ganzen Admin-Bereich.
                  </FieldDescription>
                </Field>
              )}
            />
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
            Benutzer erfassen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
