"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleCheckIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useSession } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

function Panel({
  title,
  description,
  children,
}: {
  title: string
  description: React.ReactNode
  children?: React.ReactNode
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 border-t border-border pt-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="type-headline-md">
          {title}
        </h2>
        <p className="max-w-[70ch] text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function SecuritySettings() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const settings = useQuery(orpc.settings.get.queryOptions())
  const update = useMutation(
    orpc.settings.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(orpc.settings.get.queryKey(), data)
        toast.success(
          data.requireAdminTwoFactor
            ? "Zwei-Faktor-Authentisierung ist für Admins jetzt Pflicht."
            : "Zwei-Faktor-Authentisierung ist für Admins nicht mehr Pflicht."
        )
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, {
            PRECONDITION_FAILED:
              "Richten Sie zuerst für Ihr eigenes Konto die Zwei-Faktor-Authentisierung ein.",
          })
        ),
    })
  )

  const ownTwoFactor = session?.user.twoFactorEnabled ?? false

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <Panel
        title="Zwei-Faktor-Authentisierung"
        description="Gilt für Admins, die sich mit E-Mail-Adresse und Passwort anmelden. SAML-Benutzer und normale Benutzer werden nie nach einem Code gefragt."
      >
        {settings.isError ? (
          <Alert variant="destructive" className="p-4">
            <AlertTitle className="text-base font-bold">
              Die Einstellungen konnten nicht geladen werden.
            </AlertTitle>
            <AlertDescription className="text-foreground!">
              {errorMessage(settings.error)}
            </AlertDescription>
          </Alert>
        ) : settings.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <Field
            orientation="horizontal"
            className="rounded-tile bg-tile-teaser p-4 sm:p-6"
          >
            <FieldContent>
              <FieldLabel htmlFor="require-admin-2fa" className="font-bold">
                Zwei-Faktor-Authentisierung (TOTP) für Passwort-Admins verlangen
              </FieldLabel>
              <FieldDescription id="require-admin-2fa-hint">
                Admins ohne Zwei-Faktor-Authentisierung müssen sie einrichten,
                bevor sie weiterarbeiten können.{" "}
                {!ownTwoFactor && !settings.data.requireAdminTwoFactor ? (
                  <strong className="text-foreground">
                    Zum Einschalten richten Sie sie zuerst für Ihr eigenes Konto
                    ein (unten).
                  </strong>
                ) : null}
              </FieldDescription>
            </FieldContent>
            <Switch
              id="require-admin-2fa"
              aria-describedby="require-admin-2fa-hint"
              checked={settings.data.requireAdminTwoFactor}
              disabled={
                update.isPending ||
                (!ownTwoFactor && !settings.data.requireAdminTwoFactor)
              }
              onCheckedChange={(checked) =>
                update.mutate({ requireAdminTwoFactor: checked })
              }
            />
          </Field>
        )}
      </Panel>

      <Panel
        title="Ihr Konto"
        description={
          <>
            Die Zwei-Faktor-Authentisierung ist für Ihr Konto{" "}
            <strong className="text-foreground">
              {ownTwoFactor ? "eingerichtet" : "nicht eingerichtet"}
            </strong>
            .
          </>
        }
      >
        {ownTwoFactor ? (
          <p className="flex items-center gap-2">
            <CircleCheckIcon aria-hidden="true" className="size-5" />
            Bei der Anmeldung wird ein Code aus Ihrer Authenticator-App
            verlangt.
          </p>
        ) : (
          <div>
            <Button asChild size="lg">
              <Link href="/two-factor/setup">
                Zwei-Faktor-Authentisierung einrichten
              </Link>
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}
