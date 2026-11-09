"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { PageTitle } from "@/components/site/page-title"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"
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
      toast.error(
        errorMessage(
          error,
          {},
          "Der Code ist ungültig. Bitte erneut versuchen."
        )
      )
      setCode("")
      return
    }
    router.push(safeRedirectPath(searchParams.get("callbackUrl")))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <PageTitle>Zwei-Faktor-Authentisierung</PageTitle>
        <p className="text-muted-foreground">
          {mode === "totp"
            ? "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein."
            : "Geben Sie einen Ihrer Backup-Codes ein."}
        </p>
      </div>
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
              {mode === "totp" ? "Code" : "Backup-Code"}
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
              Diesem Gerät 30 Tage lang vertrauen
            </FieldLabel>
          </Field>
        </FieldGroup>
      </form>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button
          type="submit"
          form="two-factor-form"
          size="lg"
          disabled={pending || code.length === 0}
        >
          {pending && <Spinner aria-hidden="true" />}
          Bestätigen
        </Button>
        <Button
          variant="link"
          className="px-0"
          onClick={() => {
            setMode(mode === "totp" ? "backup" : "totp")
            setCode("")
          }}
        >
          {mode === "totp"
            ? "Backup-Code verwenden"
            : "Authenticator-App verwenden"}
        </Button>
      </div>
    </div>
  )
}
