"use client"

import type { SamlProvider } from "@workspace/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { Dialog } from "@/components/ui/dialog"
import { LoadError, Notice } from "@/components/ui/notice"
import { Status } from "@/components/ui/status"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

import { CopyField } from "./copy-field"

export function SamlProviders() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery(
    orpc.sso.list.queryOptions()
  )
  const [notice, setNotice] = React.useState<string | null>(null)

  if (isPending) {
    return (
      <div className="wrap">
        <p className="muted" role="status">
          SAML-Provider werden geladen …
        </p>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="wrap">
        <LoadError
          title="Die SAML-Provider konnten nicht geladen werden."
          message={errorMessage(error)}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    )
  }

  return (
    <div className="wrap">
      <Status>{notice}</Status>
      {data.length === 0 ? (
        <Notice title="Noch kein SAML-Provider eingerichtet">
          <p>
            Ohne Provider ist nur die Anmeldung mit Passwort möglich. Fügen Sie
            den Identity Provider des Kantons hinzu (z. B. Entra ID), damit sich
            Mitarbeitende mit SSO anmelden können.
          </p>
        </Notice>
      ) : (
        <ul className="providers">
          {data.map((provider) => (
            <li key={provider.providerId}>
              <ProviderCard provider={provider} onRemoved={setNotice} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProviderCard({
  provider,
  onRemoved,
}: {
  provider: SamlProvider
  onRemoved: (message: string) => void
}) {
  return (
    <article className="provider">
      <div className="provider__head">
        <div>
          <h2>{provider.providerId}</h2>
          <p className="tag-row">
            {provider.domain.split(",").map((d) => (
              <span key={d} className="tag">
                {d.trim()}
              </span>
            ))}
          </p>
          <p className="t-small muted provider__issuer">
            IdP: {provider.issuer}
          </p>
        </div>
        <RemoveProviderButton
          providerId={provider.providerId}
          onRemoved={onRemoved}
        />
      </div>
      <div className="provider__values">
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

function RemoveProviderButton({
  providerId,
  onRemoved,
}: {
  providerId: string
  onRemoved: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const remove = useMutation(
    orpc.sso.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.key() })
        setOpen(false)
        onRemoved(`Provider ${providerId} entfernt.`)
      },
    })
  )

  return (
    <>
      <button
        type="button"
        className="btn btn--danger btn--sm"
        aria-label={`Provider ${providerId} entfernen`}
        onClick={() => {
          remove.reset()
          setOpen(true)
        }}
      >
        Entfernen
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Provider ${providerId} entfernen?`}
        description="Personen dieses Providers können sich danach nicht mehr mit SSO anmelden. Ihre Konten und Daten bleiben erhalten."
      >
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setOpen(false)}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="btn btn--danger"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ providerId })}
          >
            Provider entfernen
          </button>
        </div>
        <Status bad={remove.isError}>
          {remove.isError
            ? errorMessage(remove.error, {
                NOT_FOUND: "Der Provider existiert nicht mehr.",
              })
            : null}
        </Status>
      </Dialog>
    </>
  )
}
