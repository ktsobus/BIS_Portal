import type { CatalogLink } from "@workspace/api"
import { PhoneIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { ExternalLinkHint, isExternalUrl, safeHref } from "./external-link"

// `max-w-full min-w-0 shrink` hebt `shrink-0` der Button-Basis auf: Lange
// Beschriftungen brechen um, statt bei 320 px aus der Karte zu laufen.
const actionClass =
  "h-auto min-h-10 max-w-full min-w-0 shrink justify-start gap-2 px-4 py-2 text-left text-base font-bold whitespace-normal"

/**
 * Aktion als Schaltfläche: `order` rot (primär), `request` und `contact`
 * sekundär (weiss mit schwarzem Rahmen). Externe Ziele öffnen in neuem Tab.
 */
export function ActionLink({ action }: { action: CatalogLink }) {
  const href = safeHref(action.url)
  if (!href) return null
  const external = isExternalUrl(href)
  const primary = action.kind === "order"

  return (
    <a
      href={href}
      data-kind={action.kind}
      className={cn(
        buttonVariants({ variant: primary ? "default" : "outline" }),
        actionClass,
        !primary && "border-foreground bg-background hover:bg-so-surface"
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {action.kind === "contact" && href.startsWith("tel:") ? (
        <PhoneIcon aria-hidden="true" />
      ) : null}
      <span className="min-w-0">
        {action.label}
        {external ? <ExternalLinkHint /> : null}
      </span>
    </a>
  )
}

/** Aktionen nebeneinander (Karten) bzw. untereinander mit Beschreibung. */
export function ActionLinks({
  actions,
  layout = "inline",
  className,
}: {
  actions: CatalogLink[]
  layout?: "inline" | "stacked"
  className?: string
}) {
  const visible = actions.filter((action) => safeHref(action.url))
  if (visible.length === 0) return null

  if (layout === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {visible.map((action) => (
          <ActionLink key={action.id} action={action} />
        ))}
      </div>
    )
  }

  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {visible.map((action) => (
        <li key={action.id} className="flex flex-col items-start gap-1.5">
          <ActionLink action={action} />
          {action.description ? (
            <p className="text-sm text-so-graphite">{action.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
