"use client"

import * as React from "react"
import QRCode from "react-qr-code"

import { TextField } from "@/components/ui/field"
import { Status } from "@/components/ui/status"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"

import { TotpCodeInput } from "./totp-code-input"

type Enrollment = { totpURI: string; backupCodes: string[] }

export function TwoFactorSetup() {
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null)

  return (
    <>
      <div className="wrap">
        <div className="page-head">
          <h1>Zwei-Faktor-Authentisierung einrichten</h1>
          <p className="t-lead">
            {enrollment
              ? "Scannen Sie den QR-Code mit Ihrer Authenticator-App, bewahren Sie die Backup-Codes sicher auf und bestätigen Sie mit einem Code."
              : "Schützen Sie Ihr Konto mit einer Authenticator-App (z. B. Microsoft Authenticator). Bestätigen Sie dazu zuerst Ihr Passwort."}
          </p>
        </div>
      </div>
      <div className="wrap">
        {enrollment ? (
          <ConfirmStep enrollment={enrollment} />
        ) : (
          <PasswordStep onEnabled={setEnrollment} />
        )}
      </div>
    </>
  )
}

/** Schritt 1: Passwort bestätigen, damit ein TOTP-Schlüssel erzeugt wird. */
function PasswordStep({
  onEnabled,
}: {
  onEnabled: (enrollment: Enrollment) => void
}) {
  const [password, setPassword] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setFormError(null)
    const { data, error } = await authClient.twoFactor.enable({
      password,
      method: "totp",
    })
    setPending(false)
    if (error || !data || data.method !== "totp") {
      setFormError(
        errorMessage(
          error,
          {},
          "Die Einrichtung konnte nicht gestartet werden. Bitte erneut versuchen."
        )
      )
      return
    }
    onEnabled({ totpURI: data.totpURI, backupCodes: data.backupCodes })
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form form--narrow">
        <TextField
          id="password"
          label="Passwort"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          invalid={Boolean(formError)}
          describedById={formError ? "two-factor-password-status" : undefined}
          onChange={(e) => {
            setPassword(e.target.value)
            setFormError(null)
          }}
        />
        <div className="btn-row">
          <button
            className="btn btn--primary"
            type="submit"
            disabled={pending || !password}
          >
            {pending ? "Passwort wird geprüft …" : "Weiter"}
          </button>
        </div>
        <Status id="two-factor-password-status" bad={Boolean(formError)}>
          {formError}
        </Status>
      </div>
    </form>
  )
}

/** Schritte 2 und 3: QR-Code scannen, Backup-Codes sichern, Code bestätigen. */
function ConfirmStep({ enrollment }: { enrollment: Enrollment }) {
  const [code, setCode] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [copyNote, setCopyNote] = React.useState<string | null>(null)
  const secret = new URL(enrollment.totpURI).searchParams.get("secret") ?? ""
  const backupCodesText = enrollment.backupCodes.join("\n")

  async function verify(value: string) {
    setPending(true)
    setFormError(null)
    const { error } = await authClient.twoFactor.verifyTotp({ code: value })
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
    // Ganze Seite laden: Die Sitzung trägt jetzt den zweiten Faktor.
    window.location.assign("/admin")
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodesText + "\n"], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bits-portal-backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid grid--top totp">
      <section className="span-5 totp__step" aria-labelledby="totp-scan-h">
        <div className="block-head">
          <h2 id="totp-scan-h">Authenticator-App verbinden</h2>
        </div>
        <div className="totp__qr">
          <QRCode
            value={enrollment.totpURI}
            size={176}
            title="QR-Code für die Authenticator-App"
          />
        </div>
        <div className="totp__secret">
          <p className="t-label muted" id="secret-label">
            Oder diesen Schlüssel von Hand eingeben
          </p>
          <p className="code" id="secret" aria-labelledby="secret-label">
            {secret}
          </p>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!pending && code.length === 6) void verify(code)
          }}
        >
          <div className="form form--narrow">
            <TotpCodeInput
              id="code"
              label="Bestätigungscode"
              value={code}
              onChange={(value) => {
                setCode(value)
                if (value) setFormError(null)
              }}
              onComplete={(value) => void verify(value)}
              disabled={pending}
              invalid={Boolean(formError)}
              describedById={formError ? "totp-status" : undefined}
            />
            <div className="btn-row">
              <button
                className="btn btn--primary"
                type="submit"
                disabled={pending || code.length !== 6}
              >
                {pending
                  ? "Code wird geprüft …"
                  : "Zwei-Faktor-Authentisierung aktivieren"}
              </button>
            </div>
            <Status id="totp-status" bad={Boolean(formError)}>
              {formError}
            </Status>
          </div>
        </form>
      </section>

      <section
        className="span-5 start-8 aside-card"
        aria-labelledby="totp-backup-h"
      >
        <h2 id="totp-backup-h">Backup-Codes</h2>
        <p>
          Jeder Code funktioniert einmal, falls Sie keinen Zugriff mehr auf Ihre
          Authenticator-App haben.
        </p>
        <ul className="totp__codes code" aria-label="Backup-Codes">
          {enrollment.backupCodes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="btn-row totp__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              navigator.clipboard
                .writeText(backupCodesText)
                .then(() => setCopyNote("Backup-Codes kopiert."))
                .catch(() => setCopyNote("Kopieren nicht möglich."))
            }
          >
            Codes kopieren
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={downloadBackupCodes}
          >
            Codes herunterladen
          </button>
        </div>
        <p role="status" className="t-small">
          {copyNote}
        </p>
      </section>
    </div>
  )
}
