"use client"

import { CopyIcon, DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import QRCode from "react-qr-code"
import { toast } from "sonner"

import { PageTitle } from "@/components/site/page-title"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"

import { TotpCodeInput } from "./totp-code-input"

type Enrollment = { totpURI: string; backupCodes: string[] }

export function TwoFactorSetup() {
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <PageTitle>Zwei-Faktor-Authentisierung einrichten</PageTitle>
        <p className="text-muted-foreground">
          {enrollment
            ? "Scannen Sie den QR-Code mit Ihrer Authenticator-App, bewahren Sie die Backup-Codes sicher auf und bestätigen Sie mit einem Code."
            : "Schützen Sie Ihr Konto mit einer Authenticator-App (z. B. Microsoft Authenticator). Bestätigen Sie dazu zuerst Ihr Passwort."}
        </p>
      </div>
      {enrollment ? (
        <ConfirmStep enrollment={enrollment} />
      ) : (
        <PasswordStep onEnabled={setEnrollment} />
      )}
    </div>
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const { data, error } = await authClient.twoFactor.enable({
      password,
      method: "totp",
    })
    setPending(false)
    if (error || !data || data.method !== "totp") {
      toast.error(
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
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="password">Passwort</FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto sm:self-start"
        disabled={pending || !password}
      >
        {pending && <Spinner aria-hidden="true" />}
        Weiter
      </Button>
    </form>
  )
}

/** Schritte 2 und 3: QR-Code scannen, Backup-Codes sichern, Code bestätigen. */
function ConfirmStep({ enrollment }: { enrollment: Enrollment }) {
  const router = useRouter()
  const [code, setCode] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const secret = new URL(enrollment.totpURI).searchParams.get("secret") ?? ""
  const backupCodesText = enrollment.backupCodes.join("\n")

  async function verify(value: string) {
    setPending(true)
    const { error } = await authClient.twoFactor.verifyTotp({ code: value })
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
    toast.success("Zwei-Faktor-Authentisierung eingerichtet")
    router.push("/admin")
    router.refresh()
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
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <div className="self-start rounded-tile border border-hairline bg-white p-4">
          <QRCode
            value={enrollment.totpURI}
            size={176}
            title="QR-Code für die Authenticator-App"
          />
        </div>
        <Field>
          <FieldLabel htmlFor="secret">
            Oder diesen Schlüssel von Hand eingeben
          </FieldLabel>
          <Input
            id="secret"
            readOnly
            value={secret}
            className="font-mono text-xs"
          />
        </Field>
        <Field>
          <FieldLabel>Backup-Codes</FieldLabel>
          <pre className="grid grid-cols-2 gap-1 rounded-tile bg-tile-teaser p-4 font-mono text-sm">
            {enrollment.backupCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </pre>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                navigator.clipboard
                  .writeText(backupCodesText)
                  .then(() => toast.success("Backup-Codes kopiert"))
                  .catch(() => toast.error("Kopieren nicht möglich"))
              }
            >
              <CopyIcon aria-hidden="true" />
              Kopieren
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadBackupCodes}
            >
              <DownloadIcon aria-hidden="true" />
              Herunterladen
            </Button>
          </div>
          <FieldDescription>
            Jeder Code funktioniert einmal, falls Sie keinen Zugriff mehr auf
            Ihre Authenticator-App haben.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="code">Bestätigungscode</FieldLabel>
          <TotpCodeInput
            id="code"
            value={code}
            onChange={setCode}
            onComplete={(value) => void verify(value)}
            disabled={pending}
          />
        </Field>
      </FieldGroup>
      <Button
        size="lg"
        className="w-full sm:w-auto sm:self-start"
        disabled={pending || code.length !== 6}
        onClick={() => void verify(code)}
      >
        {pending && <Spinner aria-hidden="true" />}
        Zwei-Faktor-Authentisierung aktivieren
      </Button>
    </div>
  )
}
