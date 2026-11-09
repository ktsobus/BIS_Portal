"use client"

import type { SamlProvider } from "@workspace/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { CopyField } from "./copy-field"

export function SamlProviders() {
  const { data, isPending, isError, error, refetch } = useQuery(
    orpc.sso.list.queryOptions()
  )

  if (isPending) {
    return (
      <>
        <Skeleton className="h-40 w-full" />
        <span className="sr-only" role="status">
          SAML-Provider werden geladen …
        </span>
      </>
    )
  }
  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-3xl p-4">
        <AlertTitle className="text-base font-bold">
          Die SAML-Provider konnten nicht geladen werden.
        </AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3 text-foreground!">
          <p>{errorMessage(error)}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Erneut versuchen
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (data.length === 0) {
    return (
      <div className="flex max-w-3xl flex-col gap-2 rounded-tile bg-tile-teaser p-6">
        <p className="font-bold">Noch kein SAML-Provider eingerichtet</p>
        <p className="max-w-[70ch] text-muted-foreground">
          Ohne Provider ist nur die Anmeldung mit Passwort möglich. Fügen Sie
          den Identity Provider des Kantons hinzu (z. B. Entra ID), damit sich
          Mitarbeitende mit SSO anmelden können.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-6">
      {data.map((provider) => (
        <li key={provider.providerId}>
          <ProviderCard provider={provider} />
        </li>
      ))}
    </ul>
  )
}

function ProviderCard({ provider }: { provider: SamlProvider }) {
  return (
    <article className="flex flex-col gap-4 rounded-tile bg-tile-teaser p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-2 type-headline-sm">
            {provider.providerId}
            {provider.domain.split(",").map((d) => (
              <Badge key={d} variant="secondary">
                {d.trim()}
              </Badge>
            ))}
          </h2>
          <p className="text-sm break-all text-muted-foreground">
            IdP: {provider.issuer}
          </p>
        </div>
        <RemoveProviderButton providerId={provider.providerId} />
      </div>
      <div className="grid gap-3">
        <CopyField
          label="ACS-URL (Antwort-URL) – im IdP eintragen"
          value={provider.acsUrl}
        />
        <CopyField
          label="URL der SP-Metadaten"
          value={provider.spMetadataUrl}
        />
        <CopyField label="SSO-URL des IdP" value={provider.entryPoint} />
      </div>
    </article>
  )
}

function RemoveProviderButton({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient()
  const remove = useMutation(
    orpc.sso.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.key() })
        toast.success(`Provider ${providerId} entfernt`)
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, {
            NOT_FOUND: "Der Provider existiert nicht mehr.",
          })
        ),
    })
  )

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={remove.isPending}
          aria-label={`Provider ${providerId} entfernen`}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Provider {providerId} entfernen?</AlertDialogTitle>
          <AlertDialogDescription>
            Personen dieses Providers können sich danach nicht mehr mit SSO
            anmelden. Ihre Konten und Daten bleiben erhalten.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => remove.mutate({ providerId })}
          >
            Entfernen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
