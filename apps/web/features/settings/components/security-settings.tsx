"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Status } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notice } from "@/components/ui/notice"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { QueryError } from "@/components/admin/query-error"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

/** Verwaltung › Sicherheit: Zwei-Faktor-Pflicht und das eigene Konto. */
export function SecuritySettings({
  twoFactorEnabled,
}: {
  /** Die angemeldete Person hat TOTP eingerichtet. */
  twoFactorEnabled: boolean
}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const labelId = useId()
  const hintId = useId()
  const [needsOwnSetup, setNeedsOwnSetup] = useState(false)
  const settings = useQuery(orpc.settings.get.queryOptions())
  const update = useMutation(
    orpc.settings.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(orpc.settings.get.queryKey(), data)
        setNeedsOwnSetup(false)
        toast({
          title: data.requireAdminTwoFactor
            ? "Zwei-Faktor-Pflicht eingeschaltet"
            : "Zwei-Faktor-Pflicht ausgeschaltet",
        })
      },
      onError: (error) => {
        const own =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "PRECONDITION_FAILED"
        setNeedsOwnSetup(own)
        if (!own) {
          toast({
            tone: "error",
            title: "Einstellung nicht gespeichert",
            description: errorMessage(error),
          })
        }
      },
    })
  )

  return (
    <>
      <AdminPageHeader
        title="Sicherheit"
        description="Schutz der Admin-Konten. Der Katalog selbst ist ohne Anmeldung zugänglich."
      />

      {settings.isPending ? (
        <Card className="space-y-3 p-6" aria-busy="true">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </Card>
      ) : settings.isError ? (
        <QueryError
          error={settings.error}
          retrying={settings.isFetching}
          onRetry={() => void settings.refetch()}
        />
      ) : (
        <div className="max-w-[46rem] space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 id={labelId} className="text-lg font-bold">
                  Zwei-Faktor-Authentisierung für Admins vorschreiben
                </h2>
                <p id={hintId} className="mt-1.5 text-sm text-text">
                  Admins mit Passwort müssen bei der Anmeldung zusätzlich einen
                  Code aus einer Authenticator-App eingeben. Wer noch keinen
                  zweiten Faktor hat, richtet ihn bei der nächsten Anmeldung
                  ein. Personen mit Kantonskonto sind nicht betroffen.
                </p>
              </div>
              <Switch
                aria-labelledby={labelId}
                aria-describedby={hintId}
                checked={settings.data.requireAdminTwoFactor}
                disabled={update.isPending}
                onCheckedChange={(checked) =>
                  update.mutate({ requireAdminTwoFactor: checked })
                }
                className="mt-1"
              />
            </div>
            {needsOwnSetup ? (
              <Notice
                tone="warning"
                title="Richten Sie zuerst Ihren eigenen zweiten Faktor ein"
                className="mt-5"
                action={
                  <Button asChild size="sm">
                    <Link href="/two-factor/setup">Jetzt einrichten</Link>
                  </Button>
                }
              >
                Sonst würden Sie sich mit der Pflicht selbst aussperren.
              </Notice>
            ) : null}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold">Ihr Konto</h2>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <Status tone={twoFactorEnabled ? "ok" : "neutral"}>
                {twoFactorEnabled
                  ? "Zwei-Faktor-Authentisierung eingerichtet"
                  : "Zwei-Faktor-Authentisierung nicht eingerichtet"}
              </Status>
              <Button asChild size="sm">
                <Link href="/two-factor/setup">
                  {twoFactorEnabled ? "Verwalten" : "Einrichten"}
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
