"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { setupAdminInputSchema } from "@workspace/api"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"

const formSchema = setupAdminInputSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof formSchema>

const fields = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    description: "At least 12 characters.",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
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

  const createAdmin = useMutation(
    orpc.setup.createAdmin.mutationOptions({
      onError: (error) => toast.error(error.message),
    })
  )

  async function onSubmit({ name, email, password }: FormValues) {
    await createAdmin.mutateAsync({ name, email, password })
    const { error } = await signIn.email({ email, password })
    if (error) {
      toast.error(error.message ?? "Admin created, but sign-in failed")
      router.push("/sign-in")
      return
    }
    // If admin TOTP is required (off by default), requireSession() sends
    // the admin on to /two-factor/setup.
    router.push("/admin")
    router.refresh()
  }

  const pending = form.formState.isSubmitting

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Create the administrator account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="setup-form"
          onSubmit={form.handleSubmit((values) =>
            onSubmit(values).catch(() => {})
          )}
        >
          <FieldGroup>
            {fields.map((f) => (
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
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="setup-form"
          className="w-full"
          disabled={pending}
        >
          {pending && <Spinner />}
          Create admin account
        </Button>
      </CardFooter>
    </Card>
  )
}
