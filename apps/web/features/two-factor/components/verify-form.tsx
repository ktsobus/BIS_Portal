"use client"

import { useSearchParams } from "next/navigation"
import * as React from "react"

import { CheckField, TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"
import { safeRedirectPath } from "@/lib/safe-redirect"

import { TotpCodeInput } from "./totp-code-input"

const STATUS_ID = "two-factor-status"

export function TwoFactorVerifyForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = React.useState<"totp" | "backup">("totp")
  const [code, setCode] = React.useState("")
  const [trustDevice, setTrustDevice] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  async function verify(value: string) {
    setPending(true)
    setFormError(null)
    const { error } =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code: value, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({
            code: value.trim(),
            trustDevice,
          })
    if (error) {
      setPending(false)
      setFormError(
        errorMessage(
          error,
          {},
          "Der Code ist ungültig. Bitte erneut versuchen."
        )
      )
      setCode("")
      return
    }
    // Ganze Seite laden: Das Ziel liest die neue Sitzung auf dem Server.
    window.location.assign(safeRedirectPath(searchParams.get("callbackUrl")))
  }

  return (
    <div className="wrap">
      <div className="grid grid--top auth">
        <div className="span-5 auth__main">
          <div className="page-head">
            <h1>Zwei-Faktor-Authentisierung</h1>
            <p className="t-lead">
              {mode === "totp"
                ? "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein."
                : "Geben Sie einen Ihrer Backup-Codes ein."}
            </p>
          </div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (!pending && code.length > 0) void verify(code)
            }}
          >
            <div className="form form--narrow">
              {mode === "totp" ? (
                <TotpCodeInput
                  id="code"
                  label="Code"
                  value={code}
                  onChange={(value) => {
                    setCode(value)
                    if (value) setFormError(null)
                  }}
                  onComplete={(value) => void verify(value)}
                  disabled={pending}
                  invalid={Boolean(formError)}
                  describedById={formError ? STATUS_ID : undefined}
                />
              ) : (
                <TextField
                  id="code"
                  label="Backup-Code"
                  type="text"
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  disabled={pending}
                  invalid={Boolean(formError)}
                  describedById={formError ? STATUS_ID : undefined}
                  onChange={(e) => {
                    setCode(e.target.value)
                    if (e.target.value) setFormError(null)
                  }}
                />
              )}
              <CheckField
                id="trust-device"
                label="Diesem Gerät 30 Tage lang vertrauen"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
              />
              <div className="btn-row">
                <button
                  className="btn btn--primary"
                  type="submit"
                  disabled={pending || code.length === 0}
                >
                  {pending ? "Code wird geprüft …" : "Bestätigen"}
                </button>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => {
                    setMode(mode === "totp" ? "backup" : "totp")
                    setCode("")
                    setFormError(null)
                  }}
                >
                  {mode === "totp"
                    ? "Backup-Code verwenden"
                    : "Authenticator-App verwenden"}
                </button>
              </div>
              <Status id={STATUS_ID} bad={Boolean(formError)}>
                {formError}
              </Status>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
