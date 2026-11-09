"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  createSamlProviderInputSchema,
  type CreateSamlProviderInput,
} from "@workspace/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
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
import { orpc } from "@/lib/orpc"

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
    label: "Provider ID",
    placeholder: "acme-okta",
    description: "Used in the ACS URL. Lowercase letters, numbers, dashes.",
  },
  {
    name: "domain",
    label: "Email domains",
    placeholder: "acme.com, acme.de",
    description: "Users with these email domains are sent to this IdP.",
  },
  {
    name: "issuer",
    label: "IdP entity ID (issuer)",
    placeholder: "https://idp.acme.com/metadata",
  },
  {
    name: "entryPoint",
    label: "IdP SSO URL",
    placeholder: "https://idp.acme.com/sso/saml",
  },
  {
    name: "cert",
    label: "IdP signing certificate (PEM)",
    multiline: true,
    placeholder: "-----BEGIN CERTIFICATE-----",
  },
  {
    name: "idpMetadataXml",
    label: "IdP metadata XML (optional)",
    multiline: true,
    description: "Can replace the certificate if it contains the signing cert.",
  },
  {
    name: "emailAttribute",
    label: "Email attribute (optional)",
    placeholder: "email",
  },
  {
    name: "nameAttribute",
    label: "Name attribute (optional)",
    placeholder: "displayName",
  },
]

export function CreateSamlProviderDialog() {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const form = useForm<CreateSamlProviderInput>({
    resolver: zodResolver(createSamlProviderInputSchema),
    defaultValues,
  })

  const create = useMutation(
    orpc.sso.create.mutationOptions({
      onSuccess: async (provider) => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.key() })
        toast.success(`Added ${provider.providerId}`)
        form.reset(defaultValues)
        setOpen(false)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          Add provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add SAML provider</DialogTitle>
          <DialogDescription>
            Copy these values from your identity provider (Okta, Entra ID,
            Google Workspace, Keycloak, …).
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-saml-form"
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
          <Button
            type="submit"
            form="create-saml-form"
            disabled={create.isPending}
          >
            {create.isPending && <Spinner />}
            Add provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
