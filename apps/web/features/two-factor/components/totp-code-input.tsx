"use client"

import { TextField } from "@/components/ui/field"

/**
 * Feld für den 6-stelligen Code der Authenticator-App: ein gewöhnliches
 * Textfeld mit Zifferntastatur. Nimmt nur Ziffern an (auch aus der
 * Zwischenablage, z. B. «123 456») und meldet den vollständigen Code.
 */
export function TotpCodeInput({
  id,
  label,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  describedById,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  describedById?: string
}) {
  return (
    <TextField
      id={id}
      label={label}
      className="field--code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      autoFocus
      value={value}
      disabled={disabled}
      invalid={invalid}
      describedById={describedById}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 6)
        onChange(digits)
        if (digits.length === 6 && digits !== value) onComplete?.(digits)
      }}
      onPaste={(event) => {
        // «123 456» passt wegen maxLength sonst nicht ganz ins Feld.
        const digits = event.clipboardData
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6)
        if (!digits) return
        event.preventDefault()
        onChange(digits)
        if (digits.length === 6 && digits !== value) onComplete?.(digits)
      }}
    />
  )
}
