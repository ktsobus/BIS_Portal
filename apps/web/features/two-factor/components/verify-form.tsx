"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { safeRedirectPath } from "@/lib/safe-redirect"

import { TotpCodeInput } from "./totp-code-input"

export function TwoFactorVerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = React.useState<"totp" | "backup">("totp")
  const [code, setCode] = React.useState("")
  const [trustDevice, setTrustDevice] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function verify(value: string) {
    setPending(true)
    const { error } =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code: value, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({
            code: value.trim(),
            trustDevice,
          })
    setPending(false)
    if (error) {
      toast.error(error.message ?? "Invalid code")
      setCode("")
      return
    }
    router.push(safeRedirectPath(searchParams.get("callbackUrl")))
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your backup codes."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="two-factor-form"
          onSubmit={(e) => {
            e.preventDefault()
            void verify(code)
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">
                {mode === "totp" ? "Code" : "Backup code"}
              </FieldLabel>
              {mode === "totp" ? (
                <TotpCodeInput
                  id="code"
                  value={code}
                  onChange={setCode}
                  onComplete={(value) => void verify(value)}
                  disabled={pending}
                />
              ) : (
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                  autoFocus
                />
              )}
            </Field>
            <Field orientation="horizontal">
              <Checkbox
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(checked === true)}
              />
              <FieldLabel htmlFor="trust-device" className="font-normal">
                Trust this device for 30 days
              </FieldLabel>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          form="two-factor-form"
          className="w-full"
          disabled={pending || code.length === 0}
        >
          {pending && <Spinner />}
          Verify
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            setMode(mode === "totp" ? "backup" : "totp")
            setCode("")
          }}
        >
          {mode === "totp" ? "Use a backup code" : "Use authenticator app"}
        </Button>
      </CardFooter>
    </Card>
  )
}
