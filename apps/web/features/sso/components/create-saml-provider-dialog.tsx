"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { CreateSamlProviderInput } from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
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
  description?: string
  placeholder?: string
  multiline?: boolean
}> = [
  {
    name: "providerId",
    label: "Provider-ID",
    placeholder: "ktso-entra",
    description: "Teil der ACS-URL. Kleinbuchstaben, Ziffern und Bindestriche.",
  },
  {
    name: "domain",
    label: "E-Mail-Domänen",
    placeholder: "so.ch",
    description:
      "Personen mit diesen E-Mail-Domänen werden an diesen IdP weitergeleitet. Mehrere durch Komma trennen.",
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
    description:
      "Kann das Zertifikat ersetzen, wenn die Metadaten das Signaturzertifikat enthalten.",
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

export function CreateSamlProviderDialog() {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const form = useForm<CreateSamlProviderInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const create = useMutation(
    orpc.sso.create.mutationOptions({
      onSuccess: async (provider) => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.key() })
        toast.success(`Provider ${provider.providerId} hinzugefügt`)
        form.reset(defaultValues)
        setOpen(false)
      },
      onError: (error) =>
        toast.error(
          errorMessage(error, {
            CONFLICT: "Es gibt bereits einen Provider mit dieser ID.",
            BAD_REQUEST:
              "Die Konfiguration des Providers ist ungültig. Bitte Zertifikat, URLs und Domänen prüfen.",
          })
        ),
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlusIcon aria-hidden="true" />
          Provider hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>SAML-Provider hinzufügen</DialogTitle>
          <DialogDescription>
            Die Werte stammen aus der SAML-App im Identity Provider (z. B. Entra
            ID, Keycloak, Okta).
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-saml-form"
          noValidate
          onSubmit={form.handleSubmit((values) => create.mutate(values))}
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
                    {f.multiline ? (
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        id={field.name}
                        placeholder={f.placeholder}
                        className="min-h-24 font-mono text-xs"
                        aria-invalid={fieldState.invalid}
                      />
                    ) : (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        id={field.name}
                        placeholder={f.placeholder}
                        autoComplete="off"
                        aria-invalid={fieldState.invalid}
                      />
                    )}
                    {f.description && (
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
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <Button
            type="submit"
            form="create-saml-form"
            disabled={create.isPending}
          >
            {create.isPending && <Spinner aria-hidden="true" />}
            Provider hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
