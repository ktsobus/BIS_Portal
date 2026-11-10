import type { ComponentProps, ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const control =
  "w-full rounded-md border border-line-strong bg-white px-3 text-base text-ink transition-colors duration-150 ease-out hover:border-ink disabled:cursor-not-allowed disabled:bg-ground disabled:text-muted disabled:hover:border-line-strong aria-invalid:border-red"

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-10", className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(control, "min-h-24 py-2 leading-normal", className)}
      {...props}
    />
  )
}

/** Natives Auswahlfeld: vertraute Bedienung, auch auf Mobilgeräten. */
export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <span className={cn("relative block", className)}>
      <select
        className={cn(control, "h-10 appearance-none pr-9 text-ellipsis")}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
      />
    </span>
  )
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-sm font-bold text-ink", className)}
      {...props}
    />
  )
}

/**
 * Formularfeld: Beschriftung über dem Feld, Hilfetext darunter, Fehler unter
 * dem Feld. Das Feld selbst erhält `id`, `aria-describedby` und
 * `aria-invalid` von `fieldProps`.
 */
export function Field({
  id,
  label,
  hint,
  error,
  optional = false,
  children,
  className,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="font-normal text-muted"> (optional)</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-bold text-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Attribute für das Eingabeelement in einem `Field`. */
export function fieldProps(
  id: string,
  { hint, error }: { hint?: boolean; error?: boolean } = {}
) {
  return {
    id,
    "aria-invalid": error || undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  }
}
