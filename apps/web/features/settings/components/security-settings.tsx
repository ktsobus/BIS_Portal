"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useSession } from "@/lib/auth-client"
import { orpc } from "@/lib/orpc"

export function SecuritySettings() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const settings = useQuery(orpc.settings.get.queryOptions())
  const update = useMutation(
    orpc.settings.update.mutationOptions({
      onSuccess: (data) => {
        queryClient.setQueryData(orpc.settings.get.queryKey(), data)
        toast.success("Settings saved")
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const ownTwoFactor = session?.user.twoFactorEnabled ?? false

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Applies to admins who sign in with email and password. SAML users
            and regular users are never asked for a code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="require-admin-2fa">
                  Require TOTP for password admins
                </FieldLabel>
                <FieldDescription>
                  Admins without TOTP are asked to set it up before they can
                  continue. You need TOTP on your own account to turn this on.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="require-admin-2fa"
                checked={settings.data?.requireAdminTwoFactor ?? false}
                disabled={update.isPending}
                onCheckedChange={(checked) =>
                  update.mutate({ requireAdminTwoFactor: checked })
                }
              />
            </Field>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
          <CardDescription>
            Two-factor authentication is{" "}
            <strong>{ownTwoFactor ? "on" : "off"}</strong> for your account.
          </CardDescription>
        </CardHeader>
        {!ownTwoFactor && (
          <CardContent>
            <Button asChild>
              <Link href="/two-factor/setup">Set up two-factor</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
