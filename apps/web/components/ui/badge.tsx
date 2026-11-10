import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type Tone = "neutral" | "ok" | "warning" | "error" | "info"

const marker: Record<Tone, string> = {
  neutral: "bg-muted",
  ok: "bg-green",
  warning: "bg-orange",
  error: "bg-red",
  info: "bg-blue",
}

/** Kennzeichnung ohne Zustand, z. B. der Subtyp einer Leistung. */
export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-line bg-ground px-2 py-0.5 text-xs font-bold whitespace-nowrap text-text",
        className
      )}
    >
      {children}
    </span>
  )
}

/**
 * Zustand mit Quadrat (das Kanton-Element aus dem CD) und Text. Die Farbe
 * trägt nie allein die Bedeutung.
 */
export function Status({
  tone,
  children,
  className,
}: {
  tone: Tone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm font-bold whitespace-nowrap text-ink",
        className
      )}
    >
      <span aria-hidden="true" className={cn("size-2.5", marker[tone])} />
      {children}
    </span>
  )
}
