"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { CheckField } from "@/components/ui/field"
import { LoadError } from "@/components/ui/notice"
import { Status } from "@/components/ui/status"
import { useSession } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

export function SecuritySettings() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const settings = useQuery(orpc.settings.get.queryOptions())
  const [result, setResult] = React.useState<{
    message: string
    bad: boolean
  } | null>(null)
  const update = useMutation(
    orpc.settings.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(orpc.settings.get.queryKey(), data)
        setResult({
          message: data.requireAdminTwoFactor
            ? "Zwei-Faktor-Authentisierung ist für Admins jetzt Pflicht."
            : "Zwei-Faktor-Authentisierung ist für Admins nicht mehr Pflicht.",
          bad: false,
        })
      },
      onError: (error) =>
        setResult({
          message: errorMessage(error, {
            PRECONDITION_FAILED:
              "Richten Sie zuerst für Ihr eigenes Konto die Zwei-Faktor-Authentisierung ein.",
          }),
          bad: true,
        }),
    })
  )

  const ownTwoFactor = session?.user.twoFactorEnabled ?? false

  return (
    <>
      {/* Kein <section> direkt in <main>: Dort gilt die Bildschirmhöhe des Kits. */}
      <div className="wrap">
        <section aria-labelledby="security-2fa-h">
          <div className="block-head">
            <h2 id="security-2fa-h">Zwei-Faktor-Authentisierung</h2>
          </div>
          <p className="measure admin-intro">
            Gilt für Admins, die sich mit E-Mail-Adresse und Passwort anmelden.
            SAML-Benutzer und normale Benutzer werden nie nach einem Code
            gefragt.
          </p>
          {settings.isError ? (
            <LoadError
              title="Die Einstellungen konnten nicht geladen werden."
              message={errorMessage(settings.error)}
              onRetry={() => void settings.refetch()}
              retrying={settings.isFetching}
            />
          ) : settings.isPending ? (
            <p className="muted" role="status">
              Einstellungen werden geladen …
            </p>
          ) : (
            <div className="setting">
              <CheckField
                id="require-admin-2fa"
                label="Zwei-Faktor-Authentisierung (TOTP) für Passwort-Admins verlangen"
                hint={
                  <>
                    Admins ohne Zwei-Faktor-Authentisierung müssen sie
                    einrichten, bevor sie weiterarbeiten können.{" "}
                    {!ownTwoFactor && !settings.data.requireAdminTwoFactor ? (
                      <strong>
                        Zum Einschalten richten Sie sie zuerst für Ihr eigenes
                        Konto ein (unten).
                      </strong>
                    ) : null}
                  </>
                }
                // Während des Speicherns den gewählten Wert zeigen, danach den des Servers.
                checked={
                  update.isPending
                    ? (update.variables?.requireAdminTwoFactor ?? false)
                    : settings.data.requireAdminTwoFactor
                }
                disabled={
                  update.isPending ||
                  (!ownTwoFactor && !settings.data.requireAdminTwoFactor)
                }
                onChange={(e) =>
                  update.mutate({ requireAdminTwoFactor: e.target.checked })
                }
              />
              <Status bad={result?.bad}>{result?.message}</Status>
            </div>
          )}
        </section>
      </div>

      <div className="wrap">
        <section aria-labelledby="security-own-h">
          <div className="block-head">
            <h2 id="security-own-h">Ihr Konto</h2>
          </div>
          <p className="measure admin-intro">
            Die Zwei-Faktor-Authentisierung ist für Ihr Konto{" "}
            <strong>
              {ownTwoFactor ? "eingerichtet" : "nicht eingerichtet"}
            </strong>
            .{" "}
            {ownTwoFactor
              ? "Bei der Anmeldung wird ein Code aus Ihrer Authenticator-App verlangt."
              : null}
          </p>
          {ownTwoFactor ? null : (
            <div className="btn-row">
              <a className="btn btn--primary" href="/two-factor/setup">
                Zwei-Faktor-Authentisierung einrichten
              </a>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
