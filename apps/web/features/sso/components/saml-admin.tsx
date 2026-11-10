"use client"

import { useState } from "react"
import type { SamlProvider } from "@workspace/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Copy, Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ConfirmDialog, Dialog } from "@/components/ui/dialog"
import { Field, fieldProps, Input, Textarea } from "@/components/ui/field"
import { Notice } from "@/components/ui/notice"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { QueryError } from "@/components/admin/query-error"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

/*
 * Gleiche Regeln wie `createSamlProviderInputSchema` in `@workspace/api`,
 * mit deutschen Meldungen. Der Server prüft zusätzlich.
 */
const schema = z
  .object({
    providerId: z
      .string()
      .trim()
      .min(2, "Mindestens 2 Zeichen.")
      .max(50, "Höchstens 50 Zeichen.")
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        "Nur Kleinbuchstaben, Ziffern und Bindestriche."
      ),
    domain: z
      .string()
      .trim()
      .regex(
        /^[a-z0-9.-]+\.[a-z]{2,}(,\s*[a-z0-9.-]+\.[a-z]{2,})*$/i,
        "E-Mail-Domains, durch Komma getrennt, z. B. so.ch"
      ),
    issuer: z.url("Die Entity-ID des IdP muss eine URL sein."),
    entryPoint: z.url("Die Anmelde-URL des IdP muss eine URL sein."),
    cert: z.string().trim(),
    idpMetadataXml: z.string().trim(),
    emailAttribute: z.string().trim(),
    nameAttribute: z.string().trim(),
  })
  .refine((value) => Boolean(value.cert || value.idpMetadataXml), {
    message: "Geben Sie das Signaturzertifikat oder die Metadaten des IdP an.",
    path: ["cert"],
  })
type Values = z.infer<typeof schema>

const emptyValues: Values = {
  providerId: "",
  domain: "",
  issuer: "",
  entryPoint: "",
  cert: "",
  idpMetadataXml: "",
  emailAttribute: "",
  nameAttribute: "",
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-sm border border-line bg-ground px-2 py-1.5 font-mono text-xs text-ink">
          {value}
        </code>
        <Button
          size="sm"
          aria-label={`${label} kopieren`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Kopiert" : "Kopieren"}</span>
        </Button>
      </dd>
    </div>
  )
}

function CreateProviderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })
  const { errors } = form.formState
  const create = useMutation(
    orpc.sso.create.mutationOptions({
      onSuccess: async (provider) => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.list.key() })
        toast({
          title: "Provider hinzugefügt",
          description: `Tragen Sie jetzt die Werte von «${provider.providerId}» im IdP ein.`,
        })
        form.reset(emptyValues)
        onOpenChange(false)
      },
      onError: (cause) =>
        setError(
          errorMessage(cause, {
            CONFLICT: "Diese Provider-ID ist bereits vergeben.",
            BAD_REQUEST:
              "Der IdP hat die Angaben nicht akzeptiert. Prüfen Sie Zertifikat bzw. Metadaten.",
          })
        ),
    })
  )
  const text = (value: string) => value || undefined

  return (
    <Dialog
      size="lg"
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset(emptyValues)
          setError(null)
        }
        onOpenChange(next)
      }}
      title="SAML-Provider hinzufügen"
      description="Die Angaben stammen aus dem Identity Provider (z. B. Entra ID). Nach dem Speichern zeigt das Portal die Werte, die Sie dort eintragen."
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button
            type="submit"
            form="create-provider"
            variant="primary"
            loading={create.isPending}
          >
            Provider hinzufügen
          </Button>
        </>
      }
    >
      <form
        id="create-provider"
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => {
          setError(null)
          create.mutate({
            providerId: values.providerId,
            domain: values.domain,
            issuer: values.issuer,
            entryPoint: values.entryPoint,
            cert: text(values.cert),
            idpMetadataXml: text(values.idpMetadataXml),
            emailAttribute: text(values.emailAttribute),
            nameAttribute: text(values.nameAttribute),
          })
        })}
      >
        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="saml-id"
            label="Provider-ID"
            hint="Kurzname in Adressen, z. B. entra"
            error={errors.providerId?.message}
          >
            <Input
              autoComplete="off"
              spellCheck={false}
              {...fieldProps("saml-id", {
                hint: true,
                error: Boolean(errors.providerId),
              })}
              {...form.register("providerId")}
            />
          </Field>
          <Field
            id="saml-domain"
            label="E-Mail-Domains"
            hint="Wer sich mit so einer Adresse anmeldet, geht zu diesem IdP."
            error={errors.domain?.message}
          >
            <Input
              autoComplete="off"
              spellCheck={false}
              placeholder="so.ch"
              {...fieldProps("saml-domain", {
                hint: true,
                error: Boolean(errors.domain),
              })}
              {...form.register("domain")}
            />
          </Field>
        </div>
        <Field
          id="saml-issuer"
          label="Entity-ID des IdP"
          error={errors.issuer?.message}
        >
          <Input
            type="url"
            autoComplete="off"
            spellCheck={false}
            {...fieldProps("saml-issuer", { error: Boolean(errors.issuer) })}
            {...form.register("issuer")}
          />
        </Field>
        <Field
          id="saml-entry"
          label="Anmelde-URL des IdP (Single Sign-On)"
          error={errors.entryPoint?.message}
        >
          <Input
            type="url"
            autoComplete="off"
            spellCheck={false}
            {...fieldProps("saml-entry", {
              error: Boolean(errors.entryPoint),
            })}
            {...form.register("entryPoint")}
          />
        </Field>
        <Field
          id="saml-cert"
          label="Signaturzertifikat des IdP (PEM)"
          hint="Zertifikat oder Metadaten: eines von beiden genügt."
          error={errors.cert?.message}
        >
          <Textarea
            rows={4}
            spellCheck={false}
            placeholder="-----BEGIN CERTIFICATE-----"
            className="font-mono text-sm"
            {...fieldProps("saml-cert", {
              hint: true,
              error: Boolean(errors.cert),
            })}
            {...form.register("cert")}
          />
        </Field>
        <Field id="saml-metadata" label="Metadaten des IdP (XML)" optional>
          <Textarea
            rows={4}
            spellCheck={false}
            className="font-mono text-sm"
            {...fieldProps("saml-metadata")}
            {...form.register("idpMetadataXml")}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="saml-email-attr"
            label="Attribut für die E-Mail-Adresse"
            hint="Leer = Standard des IdP"
            optional
          >
            <Input
              autoComplete="off"
              spellCheck={false}
              {...fieldProps("saml-email-attr", { hint: true })}
              {...form.register("emailAttribute")}
            />
          </Field>
          <Field
            id="saml-name-attr"
            label="Attribut für den Namen"
            hint="Leer = Standard des IdP"
            optional
          >
            <Input
              autoComplete="off"
              spellCheck={false}
              {...fieldProps("saml-name-attr", { hint: true })}
              {...form.register("nameAttribute")}
            />
          </Field>
        </div>
      </form>
    </Dialog>
  )
}

function ProviderCard({
  provider,
  onRemove,
}: {
  provider: SamlProvider
  onRemove: () => void
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold break-all">{provider.providerId}</h2>
          <p className="mt-0.5 text-sm text-muted">
            Für Adressen mit{" "}
            {provider.domain
              .split(",")
              .map((d) => `@${d.trim()}`)
              .join(", ")}
          </p>
        </div>
        <Button size="sm" variant="danger" onClick={onRemove}>
          Entfernen
          <span className="sr-only">: {provider.providerId}</span>
        </Button>
      </div>
      <div className="grid gap-x-10 gap-y-6 px-6 py-5 lg:grid-cols-2">
        <dl className="space-y-4">
          <div className="min-w-0">
            <dt className="text-xs text-muted">Entity-ID des IdP</dt>
            <dd className="mt-0.5 text-sm break-all text-ink">
              {provider.issuer}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted">Anmelde-URL des IdP</dt>
            <dd className="mt-0.5 text-sm break-all text-ink">
              {provider.entryPoint || "–"}
            </dd>
          </div>
        </dl>
        <div>
          <p className="mb-3 text-sm font-bold text-ink">Im IdP eintragen</p>
          <dl className="space-y-4">
            <CopyValue
              label="Antwort-URL (Assertion Consumer Service)"
              value={provider.acsUrl}
            />
            <CopyValue
              label="Metadaten des Portals"
              value={provider.spMetadataUrl}
            />
          </dl>
        </div>
      </div>
    </Card>
  )
}

/** Verwaltung › Kantonskonto (SAML): Identity Provider für die Anmeldung. */
export function SamlAdmin() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const providers = useQuery(orpc.sso.list.queryOptions())
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<SamlProvider | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const remove = useMutation(
    orpc.sso.remove.mutationOptions({
      onSuccess: async (_data, input) => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.list.key() })
        toast({ title: "Provider entfernt", description: input.providerId })
        setRemoving(null)
      },
      onError: (error) => setRemoveError(errorMessage(error)),
    })
  )
  const addButton = (
    <Button variant="primary" onClick={() => setCreating(true)}>
      <Plus aria-hidden="true" />
      Provider hinzufügen
    </Button>
  )

  return (
    <>
      <AdminPageHeader
        title="Kantonskonto (SAML)"
        description="Anmeldung über einen Identity Provider. Wer sich so zum ersten Mal anmeldet, erhält ein Konto mit der Rolle «Benutzer»; Adminrechte vergeben Sie unter «Benutzer»."
        actions={providers.data?.length ? addButton : null}
      />

      {providers.isPending ? (
        <Card className="space-y-3 p-6" aria-busy="true">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </Card>
      ) : providers.isError ? (
        <QueryError
          error={providers.error}
          retrying={providers.isFetching}
          onRetry={() => void providers.refetch()}
        />
      ) : providers.data.length === 0 ? (
        <Card className="max-w-[46rem] p-6">
          <h2 className="text-lg font-bold">Noch kein Provider eingerichtet</h2>
          <p className="mt-2 text-sm text-text">
            Solange keiner eingerichtet ist, zeigt die Anmeldeseite nur die
            Anmeldung mit Passwort. So richten Sie die Anmeldung mit
            Kantonskonto ein:
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text">
            <li>
              Im Identity Provider eine SAML-Anwendung für das Portal anlegen.
            </li>
            <li>Entity-ID, Anmelde-URL und Zertifikat hier erfassen.</li>
            <li>Die Antwort-URL des Portals im Identity Provider eintragen.</li>
          </ol>
          <div className="mt-5">{addButton}</div>
        </Card>
      ) : (
        <div className="space-y-5">
          {providers.data.map((provider) => (
            <ProviderCard
              key={provider.providerId}
              provider={provider}
              onRemove={() => {
                setRemoveError(null)
                setRemoving(provider)
              }}
            />
          ))}
        </div>
      )}

      <CreateProviderDialog open={creating} onOpenChange={setCreating} />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null)
        }}
        title="Provider entfernen?"
        confirmLabel="Provider entfernen"
        loading={remove.isPending}
        onConfirm={() => {
          if (removing) remove.mutate({ providerId: removing.providerId })
        }}
        error={removeError ? <Notice tone="error">{removeError}</Notice> : null}
      >
        <p>
          Personen mit Adressen von <strong>{removing?.domain}</strong> können
          sich danach nicht mehr mit ihrem Kantonskonto anmelden. Bestehende
          Konten bleiben erhalten.
        </p>
      </ConfirmDialog>
    </>
  )
}
