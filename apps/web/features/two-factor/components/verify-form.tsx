"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, fieldProps, Input } from "@/components/ui/field"
import { Notice } from "@/components/ui/notice"
import { authClient } from "@/lib/auth-client"
import { errorMessage } from "@/lib/messages"

import { CodeInput } from "./code-input"

/** Zweiter Schritt der Anmeldung: Code der App oder ein Backup-Code. */
export function VerifyForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<"totp" | "backup">("totp")
  const [code, setCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const value = code.trim()
    if (!value) {
      setError(
        mode === "totp"
          ? "Bitte geben Sie den sechsstelligen Code ein."
          : "Bitte geben Sie einen Backup-Code ein."
      )
      return
    }
    setPending(true)
    setError(null)
    try {
      const result =
        mode === "totp"
          ? await authClient.twoFactor.verifyTotp({ code: value, trustDevice })
          : await authClient.twoFactor.verifyBackupCode({ code: value })
      if (result.error) {
        setError(errorMessage(result.error))
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="max-w-[28rem] p-6">
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {mode === "totp" ? (
          <Field
            id="code"
            label="Code aus der Authenticator-App"
            hint="Sechs Ziffern, alle 30 Sekunden neu."
          >
            <CodeInput
              autoFocus
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, ""))
              }
              {...fieldProps("code", { hint: true })}
            />
          </Field>
        ) : (
          <Field
            id="code"
            label="Backup-Code"
            hint="Jeder Backup-Code gilt nur einmal."
          >
            <Input
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="font-mono"
              {...fieldProps("code", { hint: true })}
            />
          </Field>
        )}
        {mode === "totp" ? (
          <label className="flex items-start gap-2.5 text-sm text-text">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(event) => setTrustDevice(event.target.checked)}
              className="mt-0.5 size-4 accent-blue"
            />
            Auf diesem Gerät 30 Tage lang nicht mehr nach dem Code fragen
          </label>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full"
        >
          Bestätigen
        </Button>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-sm">
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === "totp" ? "backup" : "totp")
              setCode("")
              setError(null)
            }}
          >
            {mode === "totp"
              ? "Backup-Code verwenden"
              : "Code aus der App verwenden"}
          </button>
          <Link href="/sign-in" className="link">
            Zurück zur Anmeldung
          </Link>
        </div>
      </form>
    </Card>
  )
}
