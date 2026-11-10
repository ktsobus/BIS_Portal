"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateSamlProviderInput } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Dialog } from "@/components/ui/dialog"
import { TextAreaField, TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { errorMessage } from "@/lib/messages"
import { orpc } from "@/lib/orpc"

const optionalText = z.string().trim().optional()

/**
 * Wie `createSamlProviderInputSchema` in `@workspace/api`, aber mit deutschen
 * Meldungen (der Server prüft zusätzlich mit dem Original).
 */
const formSchema = z
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
      .min(3, "Bitte mindestens eine E-Mail-Domäne angeben.")
      .regex(
        /^[a-z0-9.-]+\.[a-z]{2,}(,\s*[a-z0-9.-]+\.[a-z]{2,})*$/i,
        "Domänen durch Komma trennen, z. B. so.ch."
      ),
    issuer: z.url("Die Entity-ID des IdP muss eine URL sein."),
    entryPoint: z.url("Die SSO-URL des IdP muss eine URL sein."),
    cert: optionalText,
    idpMetadataXml: optionalText,
    emailAttribute: optionalText,
    nameAttribute: optionalText,
  })
  .refine((v) => Boolean(v.cert || v.idpMetadataXml), {
    message:
      "Bitte das Signaturzertifikat des IdP oder seine Metadaten (XML) angeben.",
    path: ["cert"],
  }) satisfies z.ZodType<CreateSamlProviderInput>

const defaultValues: CreateSamlProviderInput = {
  providerId: "",
  domain: "",
  issuer: "",
  entryPoint: "",
  cert: "",
  idpMetadataXml: "",
  emailAttribute: "",
  nameAttribute: "",
}

type FieldName = keyof CreateSamlProviderInput

const fields: Array<{
  name: FieldName
  label: string
  hint?: string
  placeholder?: string
  multiline?: boolean
}> = [
  {
    name: "providerId",
    label: "Provider-ID",
    placeholder: "ktso-entra",
    hint: "Teil der ACS-URL. Kleinbuchstaben, Ziffern und Bindestriche.",
  },
  {
    name: "domain",
    label: "E-Mail-Domänen",
    placeholder: "so.ch",
    hint: "Personen mit diesen E-Mail-Domänen werden an diesen IdP weitergeleitet. Mehrere durch Komma trennen.",
  },
  {
    name: "issuer",
    label: "Entity-ID des IdP (Issuer)",
    placeholder: "https://sts.windows.net/…/",
  },
  {
    name: "entryPoint",
    label: "SSO-URL des IdP",
    placeholder: "https://login.microsoftonline.com/…/saml2",
  },
  {
    name: "cert",
    label: "Signaturzertifikat des IdP (PEM)",
    multiline: true,
    placeholder: "-----BEGIN CERTIFICATE-----",
  },
  {
    name: "idpMetadataXml",
    label: "Metadaten des IdP als XML (optional)",
    multiline: true,
    hint: "Kann das Zertifikat ersetzen, wenn die Metadaten das Signaturzertifikat enthalten.",
  },
  {
    name: "emailAttribute",
    label: "Attribut für die E-Mail-Adresse (optional)",
    placeholder: "email",
  },
  {
    name: "nameAttribute",
    label: "Attribut für den Namen (optional)",
    placeholder: "displayName",
  },
]

const STATUS_ID = "create-saml-status"

export function CreateSamlProviderDialog() {
  const [open, setOpen] = React.useState(false)
  const [created, setCreated] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)
  const queryClient = useQueryClient()
  const form = useForm<CreateSamlProviderInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const create = useMutation(
    orpc.sso.create.mutationOptions({
      onSuccess: async (provider) => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.key() })
        setCreated(`Provider ${provider.providerId} hinzugefügt.`)
        form.reset(defaultValues)
        setOpen(false)
      },
      onError: (error) =>
        setFormError(
          errorMessage(error, {
            CONFLICT: "Es gibt bereits einen Provider mit dieser ID.",
            BAD_REQUEST:
              "Die Konfiguration des Providers ist ungültig. Bitte Zertifikat, URLs und Domänen prüfen.",
          })
        ),
    })
  )

  function close() {
    setOpen(false)
    setFormError(null)
    form.reset(defaultValues)
  }

  const { errors } = form.formState

  return (
    <>
      <button
        type="button"
        className="btn btn--primary"
        onClick={() => {
          setCreated(null)
          setOpen(true)
        }}
      >
        Provider hinzufügen
      </button>
      <p role="status" className="admin-head__status t-small">
        {created}
      </p>
      <Dialog
        open={open}
        onClose={close}
        title="SAML-Provider hinzufügen"
        description="Die Werte stammen aus der SAML-App im Identity Provider (z. B. Entra ID, Keycloak, Okta)."
      >
        <form
          noValidate
          onSubmit={form.handleSubmit((values) => {
            setFormError(null)
            create.mutate(values)
          })}
        >
          <div className="form">
            {fields.map((f) =>
              f.multiline ? (
                <TextAreaField
                  key={f.name}
                  id={`saml-${f.name}`}
                  label={f.label}
                  hint={f.hint}
                  placeholder={f.placeholder}
                  error={errors[f.name]?.message}
                  spellCheck={false}
                  {...form.register(f.name)}
                />
              ) : (
                <TextField
                  key={f.name}
                  id={`saml-${f.name}`}
                  label={f.label}
                  hint={f.hint}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  error={errors[f.name]?.message}
                  {...form.register(f.name)}
                />
              )
            )}
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={close}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={create.isPending}
              >
                {create.isPending
                  ? "Provider wird hinzugefügt …"
                  : "Provider hinzufügen"}
              </button>
            </div>
            <Status id={STATUS_ID} bad={Boolean(formError)}>
              {formError}
            </Status>
          </div>
        </form>
      </Dialog>
    </>
  )
}
