"use client"

import { CopyIcon, DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import QRCode from "react-qr-code"
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

import { TotpCodeInput } from "./totp-code-input"

type Enrollment = { totpURI: string; backupCodes: string[] }

export function TwoFactorSetup() {
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null)

  return enrollment ? (
    <ConfirmStep enrollment={enrollment} />
  ) : (
    <PasswordStep onEnabled={setEnrollment} />
  )
}

/** Step 1: re-enter the password to generate a TOTP secret. */
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
      toast.error(error?.message ?? "Could not start two-factor setup")
      return
    }
    onEnabled({ totpURI: data.totpURI, backupCodes: data.backupCodes })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up two-factor authentication</CardTitle>
        <CardDescription>
          Protect your account with an authenticator app. Confirm your password
          to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="tfa-password-form" onSubmit={submit}>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Field>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="tfa-password-form"
          className="w-full"
          disabled={pending || !password}
        >
          {pending && <Spinner />}
          Continue
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Steps 2 + 3: scan the QR code, save backup codes, confirm with a code. */
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
      toast.error(error.message ?? "Invalid code")
      setCode("")
      return
    }
    toast.success("Two-factor authentication enabled")
    router.push("/dashboard")
    router.refresh()
  }

  function downloadBackupCodes() {
    const blob = new Blob([backupCodesText + "\n"], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan with your authenticator app</CardTitle>
        <CardDescription>
          Scan the QR code, store your backup codes somewhere safe, then enter a
          code to finish.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="flex justify-center rounded-lg bg-white p-4">
            <QRCode value={enrollment.totpURI} size={176} />
          </div>
          <Field>
            <FieldLabel htmlFor="secret">Or enter this key manually</FieldLabel>
            <Input
              id="secret"
              readOnly
              value={secret}
              className="font-mono text-xs"
            />
          </Field>
          <Field>
            <FieldLabel>Backup codes</FieldLabel>
            <pre className="grid grid-cols-2 gap-1 rounded-md border bg-muted p-3 font-mono text-xs">
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
                    .then(() => toast.success("Backup codes copied"))
                }
              >
                <CopyIcon />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadBackupCodes}
              >
                <DownloadIcon />
                Download
              </Button>
            </div>
            <FieldDescription>
              Each code works once if you lose access to your authenticator.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="code">Verification code</FieldLabel>
            <TotpCodeInput
              id="code"
              value={code}
              onChange={setCode}
              onComplete={(value) => void verify(value)}
              disabled={pending}
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={pending || code.length !== 6}
          onClick={() => void verify(code)}
        >
          {pending && <Spinner />}
          Enable two-factor authentication
        </Button>
      </CardFooter>
    </Card>
  )
}
