"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { createUserInputSchema, type CreateUserInput } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { UserPlusIcon } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
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
import { orpc } from "@/lib/orpc"

const defaultValues: CreateUserInput = {
  name: "",
  email: "",
  password: "",
  role: "user",
}

const textFields = [
  { name: "name", label: "Name", type: "text", autoComplete: "off" },
  { name: "email", label: "Email", type: "email", autoComplete: "off" },
  {
    name: "password",
    label: "Initial password",
    type: "password",
    autoComplete: "new-password",
    description: "At least 12 characters. Share it with the user securely.",
  },
] as const

export function CreateUserDialog() {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserInputSchema),
    defaultValues,
  })

  const createUser = useMutation(
    orpc.user.create.mutationOptions({
      onSuccess: async (user) => {
        await queryClient.invalidateQueries({ queryKey: orpc.user.key() })
        toast.success(`Created ${user.email}`)
        form.reset(defaultValues)
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon />
          New user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>
            Create an account that signs in with email and password.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-user-form"
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
                  <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-user-form"
            disabled={createUser.isPending}
          >
            {createUser.isPending && <Spinner />}
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
