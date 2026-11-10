import * as React from "react"

/** IDs für Hinweis und Fehlerzeile eines Felds. */
function describedBy(
  id: string,
  { hint, error, extra }: { hint: boolean; error: boolean; extra?: string }
) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null, extra ?? null]
      .filter(Boolean)
      .join(" ") || undefined
  )
}

interface FieldFrameProps {
  id: string
  label: React.ReactNode
  /** Was ins Feld gehört, unter dem Feld. */
  hint?: React.ReactNode
  /** Grund, warum die Eingabe nicht passt; erscheint unter dem Feld. */
  error?: string | null
  /** Als ungültig markieren, ohne eigene Fehlerzeile (Fehler steht in der Statuszeile). */
  invalid?: boolean
  /** Zusätzliche ID für `aria-describedby`, z. B. die Statuszeile des Formulars. */
  describedById?: string
  className?: string
}

function Frame({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldFrameProps & { children: React.ReactNode }) {
  return (
    <div className={className ? `field ${className}` : "field"}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

type TextFieldProps = FieldFrameProps &
  Omit<React.ComponentProps<"input">, "id" | "className">

/**
 * Einzeiliges Feld mit sichtbarem Label, Hinweis und Fehlerzeile (Klassen
 * `.field` und `.field__error` des Kits). `ref` und die übrigen Attribute
 * gehen ans `<input>`, damit `register()` von react-hook-form passt.
 */
export function TextField({
  id,
  label,
  hint,
  error,
  invalid,
  describedById,
  className,
  ...input
}: TextFieldProps) {
  return (
    <Frame
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        {...input}
        id={id}
        aria-invalid={error || invalid ? true : undefined}
        aria-describedby={describedBy(id, {
          hint: Boolean(hint),
          error: Boolean(error),
          extra: describedById,
        })}
      />
    </Frame>
  )
}

type TextAreaFieldProps = FieldFrameProps &
  Omit<React.ComponentProps<"textarea">, "id" | "className">

/** Mehrzeiliges Feld, sonst wie `TextField`. */
export function TextAreaField({
  id,
  label,
  hint,
  error,
  invalid,
  describedById,
  className,
  ...textarea
}: TextAreaFieldProps) {
  return (
    <Frame
      id={id}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        {...textarea}
        id={id}
        aria-invalid={error || invalid ? true : undefined}
        aria-describedby={describedBy(id, {
          hint: Boolean(hint),
          error: Boolean(error),
          extra: describedById,
        })}
      />
    </Frame>
  )
}

type CheckFieldProps = Omit<FieldFrameProps, "error" | "invalid"> &
  Omit<React.ComponentProps<"input">, "id" | "className" | "type">

/** Kontrollkästchen mit Label daneben und optionalem Hinweis darunter. */
export function CheckField({
  id,
  label,
  hint,
  describedById,
  className,
  ...input
}: CheckFieldProps) {
  return (
    <div
      className={
        className ? `field field--check ${className}` : "field field--check"
      }
    >
      <input
        {...input}
        type="checkbox"
        id={id}
        aria-describedby={describedBy(id, {
          hint: Boolean(hint),
          error: false,
          extra: describedById,
        })}
      />
      <span className="field__check-text">
        <label htmlFor={id}>{label}</label>
        {hint ? (
          <span className="field__hint" id={`${id}-hint`}>
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  )
}
