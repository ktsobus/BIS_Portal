"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, fieldProps, Input } from "@/components/ui/field"
import { Notice } from "@/components/ui/notice"
import { PasswordInput } from "@/components/ui/password-input"
import { authClient } from "@/lib/auth-client"
import { accountFields, errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

const schema = z.object(accountFields)
type Values = z.infer<typeof schema>

/** Erstes Admin-Konto anlegen; danach ist /setup für immer geschlossen. */
export function SetupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const createAdmin = useMutation(orpc.setup.createAdmin.mutationOptions())
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: Values) {
    setError(null)
    try {
      await createAdmin.mutateAsync(values)
    } catch (cause) {
      const conflict =
        typeof cause === "object" &&
        cause !== null &&
        "code" in cause &&
        cause.code === "CONFLICT"
      setClosed(conflict)
      setError(
        errorMessage(cause, {
          CONFLICT: "Die Einrichtung ist bereits abgeschlossen.",
        })
      )
      return
    }
    // Konto ist angelegt: gleich anmelden. Scheitert das, bleibt die Anmeldeseite.
    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
      })
      router.push(result.error ? "/sign-in" : "/admin")
    } catch {
      router.push("/sign-in")
    }
    router.refresh()
  }

  return (
    <Card className="max-w-[28rem] p-6">
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {error ? (
          <Notice
            tone="error"
            action={
              closed ? (
                <Link href="/sign-in" className="link font-bold">
                  Zur Anmeldung
                </Link>
              ) : undefined
            }
          >
            {error}
          </Notice>
        ) : null}
        <Field id="name" label="Name" error={errors.name?.message}>
          <Input
            autoComplete="name"
            {...fieldProps("name", { error: Boolean(errors.name) })}
            {...form.register("name")}
          />
        </Field>
        <Field id="email" label="E-Mail-Adresse" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="username"
            {...fieldProps("email", { error: Boolean(errors.email) })}
            {...form.register("email")}
          />
        </Field>
        <Field
          id="password"
          label="Passwort"
          hint="Mindestens 12 Zeichen. Ein vergessenes Passwort lässt sich nur durch eine andere Person mit Adminrechten ersetzen."
          error={errors.password?.message}
        >
          <PasswordInput
            autoComplete="new-password"
            {...fieldProps("password", {
              hint: true,
              error: Boolean(errors.password),
            })}
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
          Admin-Konto anlegen
        </Button>
      </form>
    </Card>
  )
}
