"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { signIn } from "@/lib/auth-client"
import { accountFields, errorMessage } from "@/lib/messages"

const signInSchema = z.object({
  email: accountFields.email,
  password: z.string().min(1, "Bitte geben Sie Ihr Passwort ein."),
})

type SignInValues = z.infer<typeof signInSchema>

/**
 * Ziel nach der Anmeldung: Nur Admins dürfen in den Admin-Bereich; alle
 * anderen landen im Portal (dort ist keine Anmeldung nötig).
 */
function targetAfterSignIn(callbackUrl: string, role: string | null) {
  if (role !== "admin" && callbackUrl.startsWith("/admin")) return "/"
  return callbackUrl
}

export function PasswordSignInForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: SignInValues) {
    const { data, error } = await signIn.email(values)
    if (error) {
      toast.error(errorMessage(error, {}, "Die Anmeldung hat nicht geklappt."))
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
      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>E-Mail-Adresse</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Passwort</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
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
