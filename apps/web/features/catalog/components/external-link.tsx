import { ArrowUpRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** http(s)-Links führen aus dem Portal hinaus und öffnen in neuem Tab. */
export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

/** Nur http(s), mailto und tel sind als Ziel erlaubt. */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  return /^(?:https?:\/\/|mailto:|tel:)/i.test(trimmed) ? trimmed : null
}

/** Kennzeichnung «extern, neuer Tab» (rotes ↗ + Text für Screenreader). */
export function ExternalLinkHint({ className }: { className?: string }) {
  return (
    <>
      <ArrowUpRightIcon
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn(
          "ml-0.5 inline size-[1.1em] shrink-0 align-[-0.15em] text-primary",
          className
        )}
      />
      <span className="sr-only"> (externer Link, öffnet in neuem Tab)</span>
    </>
  )
}

/** Textlink auf eine externe Ressource. */
export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const external = isExternalUrl(href)
  return (
    <a
      href={href}
      className={cn("link-text", className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external ? <ExternalLinkHint /> : null}
    </a>
  )
}
