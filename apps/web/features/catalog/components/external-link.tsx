import { ArrowUpRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { isExternalUrl } from "../links"

export { isExternalUrl, safeHref } from "../links"

/** Kennzeichnung «extern, neuer Tab» (Symbol + Text für Screenreader). */
export function ExternalLinkHint({ className }: { className?: string }) {
  return (
    <>
      <ArrowUpRightIcon
        aria-hidden="true"
        className={cn(
          "ml-0.5 inline size-[0.95em] shrink-0 align-[-0.1em]",
          className
        )}
      />
      <span className="sr-only"> (externer Link, öffnet in neuem Tab)</span>
    </>
  )
}

/** Link auf eine externe Ressource, z. B. unter «Weitere Informationen». */
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
      className={cn("link-cd", className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external ? <ExternalLinkHint /> : null}
    </a>
  )
}
