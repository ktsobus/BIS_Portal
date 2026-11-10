import { ArrowUpRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { isExternalUrl } from "../links"

export { isExternalUrl, safeHref } from "../links"

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
