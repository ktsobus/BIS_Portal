"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"
import { AlertDialog as AlertPrimitive, Dialog as Primitive } from "radix-ui"

import { cn } from "@/lib/utils"

import { Button } from "./button"

const overlay = "fixed inset-0 z-40 bg-ink/45 data-[state=open]:animate-fade-in"
const panel =
  "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-line-strong bg-white data-[state=open]:animate-fade-in"

/**
 * Dialog für Aufgaben, die geschützten Fokus brauchen (z. B. ein Konto
 * erfassen). Kopf und Fuss bleiben stehen, der Inhalt scrollt.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: "md" | "lg"
}) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Portal>
        <Primitive.Overlay className={overlay} />
        <Primitive.Content
          className={cn(panel, size === "lg" ? "max-w-2xl" : "max-w-lg")}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="flex items-start gap-4 border-b border-line px-6 py-4">
            <div className="min-w-0 flex-1">
              <Primitive.Title className="text-xl font-bold text-ink">
                {title}
              </Primitive.Title>
              {description ? (
                <Primitive.Description className="mt-1 text-sm text-muted">
                  {description}
                </Primitive.Description>
              ) : null}
            </div>
            <Primitive.Close
              className="-mr-2 grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-ground hover:text-ink"
              aria-label="Schliessen"
            >
              <X aria-hidden="true" className="size-5" />
            </Primitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>
          {footer ? (
            <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
              {footer}
            </div>
          ) : null}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  )
}

/** Rückfrage vor einer Aktion, die sich nicht rückgängig machen lässt. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  onConfirm,
  loading = false,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  loading?: boolean
  error?: ReactNode
}) {
  return (
    <AlertPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertPrimitive.Portal>
        <AlertPrimitive.Overlay className={overlay} />
        <AlertPrimitive.Content className={cn(panel, "max-w-md p-6")}>
          <AlertPrimitive.Title className="text-xl font-bold text-ink">
            {title}
          </AlertPrimitive.Title>
          <AlertPrimitive.Description asChild>
            <div className="mt-2 text-sm text-text">{children}</div>
          </AlertPrimitive.Description>
          {error ? <div className="mt-4">{error}</div> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AlertPrimitive.Cancel asChild>
              <Button disabled={loading}>Abbrechen</Button>
            </AlertPrimitive.Cancel>
            <Button variant="primary" loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertPrimitive.Content>
      </AlertPrimitive.Portal>
    </AlertPrimitive.Root>
  )
}
