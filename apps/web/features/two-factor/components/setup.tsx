"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy } from "lucide-react"
import QRCode from "react-qr-code"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, fieldProps } from "@/components/ui/field"
import { Notice } from "@/components/ui/notice"
import { PasswordInput } from "@/components/ui/password-input"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"
import { cn } from "@/lib/utils"

import { CodeInput } from "./code-input"

interface Enrolment {
  totpURI: string
  backupCodes: string[]
}

function secretOf(uri: string): string | null {
  try {
    return new URL(uri).searchParams.get("secret")
  } catch {
    return null
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? "Kopiert" : label}</span>
    </Button>
  )
}

function Step({
  number,
  title,
  children,
}: {
  number: number
  title: string
  /** Ohne Inhalt ist der Schritt noch nicht an der Reihe. */
  children?: React.ReactNode
}) {
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 last:[&>div]:pb-0">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 place-items-center rounded-full border text-sm font-bold",
          children ? "border-ink text-ink" : "border-line text-muted"
        )}
      >
        {number}
      </span>
      <div className="min-w-0 pb-7">
        <h3
          className={cn(
            "pt-1 text-lg",
            children ? "font-bold" : "font-normal text-muted"
          )}
        >
          {title}
        </h3>
        {children ? <div className="mt-3 space-y-4">{children}</div> : null}
      </div>
    </li>
  )
}

/**
 * Zwei-Faktor-Authentisierung einrichten: Passwort bestätigen, QR-Code
 * scannen, Backup-Codes sichern, mit einem Code abschliessen.
 */
export function TwoFactorSetup({
  enabled,
  required,
}: {
  /** Für dieses Konto bereits eingerichtet. */
  enabled: boolean
  /** Für Admins mit Passwort vorgeschrieben (Einstellung «Sicherheit»). */
  required: boolean
}) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null)
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function run(action: () => Promise<void>) {
    setPending(true)
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <Card className="max-w-[36rem] p-6">
        <Notice
          tone="ok"
          title="Die Zwei-Faktor-Authentisierung ist eingerichtet"
        >
          Ab der nächsten Anmeldung fragt das Portal nach dem Code aus Ihrer
          App.
        </Notice>
        <Button
          variant="primary"
          size="lg"
          className="mt-5"
          onClick={() => {
            router.push("/admin")
            router.refresh()
          }}
        >
          Weiter zur Verwaltung
        </Button>
      </Card>
    )
  }

  if (enabled) {
    return (
      <Card className="max-w-[36rem] space-y-5 p-6">
        <Notice tone="ok" title="Für Ihr Konto eingerichtet">
          Bei der Anmeldung fragt das Portal nach dem Code aus Ihrer
          Authenticator-App.
        </Notice>
        {required ? (
          <p className="text-sm text-text">
            Für Admins mit Passwort ist sie vorgeschrieben und lässt sich darum
            nicht ausschalten.
          </p>
        ) : (
          <form
            noValidate
            className="space-y-4 border-t border-line pt-5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!password) {
                setError("Bitte geben Sie Ihr Passwort ein.")
                return
              }
              void run(async () => {
                const result = await authClient.twoFactor.disable({ password })
                if (result.error) {
                  setError(errorMessage(result.error))
                  return
                }
                router.refresh()
              })
            }}
          >
            <h2 className="text-lg font-bold">Ausschalten</h2>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Field id="disable-password" label="Passwort zur Bestätigung">
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                {...fieldProps("disable-password")}
              />
            </Field>
            <Button type="submit" variant="danger" loading={pending}>
              Zwei-Faktor-Authentisierung ausschalten
            </Button>
          </form>
        )}
        <Button onClick={() => router.push("/admin")}>
          Zurück zur Verwaltung
        </Button>
      </Card>
    )
  }

  const secret = enrolment ? secretOf(enrolment.totpURI) : null

  return (
    <Card className="max-w-[36rem] p-6">
      {required ? (
        <Notice tone="info" className="mb-6">
          Für Admins mit Passwort ist die Zwei-Faktor-Authentisierung
          vorgeschrieben. Die Verwaltung ist erst danach zugänglich.
        </Notice>
      ) : null}
      {error ? (
        <Notice tone="error" className="mb-6">
          {error}
        </Notice>
      ) : null}
      <ol>
        <Step number={1} title="Passwort bestätigen">
          {enrolment ? (
            <p className="text-sm text-muted">Bestätigt.</p>
          ) : (
            <form
              noValidate
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!password) {
                  setError("Bitte geben Sie Ihr Passwort ein.")
                  return
                }
                void run(async () => {
                  const result = await authClient.twoFactor.enable({ password })
                  if (result.error) {
                    setError(errorMessage(result.error))
                    return
                  }
                  if (!("totpURI" in result.data)) {
                    setError(
                      "Für dieses Konto ist keine Authenticator-App vorgesehen."
                    )
                    return
                  }
                  setEnrolment({
                    totpURI: result.data.totpURI,
                    backupCodes: result.data.backupCodes,
                  })
                })
              }}
            >
              <Field id="password" label="Ihr Passwort">
                <PasswordInput
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  {...fieldProps("password")}
                />
              </Field>
              <Button type="submit" variant="primary" loading={pending}>
                Weiter
              </Button>
            </form>
          )}
        </Step>

        <Step number={2} title="Authenticator-App verbinden">
          {enrolment ? (
            <>
              <p className="text-sm text-text">
                Scannen Sie den Code mit Ihrer Authenticator-App (z. B.
                Microsoft Authenticator).
              </p>
              <div className="inline-block rounded-md border border-line bg-white p-4">
                <QRCode
                  value={enrolment.totpURI}
                  size={176}
                  aria-label="QR-Code für die Authenticator-App"
                />
              </div>
              {secret ? (
                <div className="space-y-2">
                  <p className="text-sm text-text">
                    Oder geben Sie den Schlüssel von Hand ein:
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="rounded-sm border border-line bg-ground px-2 py-1 font-mono text-sm break-all text-ink">
                      {secret}
                    </code>
                    <CopyButton text={secret} label="Kopieren" />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </Step>

        <Step number={3} title="Backup-Codes sichern">
          {enrolment ? (
            <>
              <p className="text-sm text-text">
                Mit einem Backup-Code melden Sie sich an, wenn Ihr Telefon
                fehlt. Jeder Code gilt einmal. Bewahren Sie die Codes sicher
                auf; sie werden nur jetzt angezeigt.
              </p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-line bg-ground px-4 py-3 font-mono text-sm text-ink sm:grid-cols-3">
                {enrolment.backupCodes.map((backupCode) => (
                  <li key={backupCode}>{backupCode}</li>
                ))}
              </ul>
              <CopyButton
                text={enrolment.backupCodes.join("\n")}
                label="Alle Codes kopieren"
              />
            </>
          ) : null}
        </Step>

        <Step number={4} title="Mit einem Code abschliessen">
          {enrolment ? (
            <form
              noValidate
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (code.length !== 6) {
                  setError("Bitte geben Sie den sechsstelligen Code ein.")
                  return
                }
                void run(async () => {
                  const result = await authClient.twoFactor.verifyTotp({ code })
                  if (result.error) {
                    setError(errorMessage(result.error))
                    return
                  }
                  setDone(true)
                })
              }}
            >
              <Field id="code" label="Code aus der App">
                <CodeInput
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, ""))
                  }
                  {...fieldProps("code")}
                />
              </Field>
              <Button type="submit" variant="primary" loading={pending}>
                Einrichtung abschliessen
              </Button>
            </form>
          ) : null}
        </Step>
      </ol>
    </Card>
  )
}
