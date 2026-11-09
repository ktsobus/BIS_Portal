"use client"

import type { SamlProvider } from "@workspace/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { orpc } from "@/lib/orpc"

import { CopyField } from "./copy-field"

export function SamlProviders() {
  const { data, isPending, isError, error } = useQuery(
    orpc.sso.list.queryOptions()
  )

  if (isPending) return <Skeleton className="h-40 w-full" />
  if (isError) {
    return <p className="text-sm text-destructive">{error.message}</p>
  }
  if (data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No SAML providers</EmptyTitle>
          <EmptyDescription>
            Add your identity provider to let users sign in with SSO.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((provider) => (
        <ProviderCard key={provider.providerId} provider={provider} />
      ))}
    </div>
  )
}

function ProviderCard({ provider }: { provider: SamlProvider }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {provider.providerId}
          {provider.domain.split(",").map((d) => (
            <Badge key={d} variant="secondary">
              {d}
            </Badge>
          ))}
        </CardTitle>
        <CardDescription className="break-all">
          IdP: {provider.issuer}
        </CardDescription>
        <CardAction>
          <RemoveProviderButton providerId={provider.providerId} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3">
        <CopyField
          label="ACS URL (Reply URL) — configure in your IdP"
          value={provider.acsUrl}
        />
        <CopyField label="SP metadata URL" value={provider.spMetadataUrl} />
        <CopyField label="IdP SSO URL" value={provider.entryPoint} />
      </CardContent>
    </Card>
  )
}

function RemoveProviderButton({ providerId }: { providerId: string }) {
  const queryClient = useQueryClient()
  const remove = useMutation(
    orpc.sso.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.sso.key() })
        toast.success(`Removed ${providerId}`)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Remove ${providerId}`}>
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {providerId}?</AlertDialogTitle>
          <AlertDialogDescription>
            Users of this provider can no longer sign in with SSO. Their
            accounts and data are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => remove.mutate({ providerId })}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
