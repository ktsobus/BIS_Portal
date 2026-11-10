import type { CatalogLink } from "@workspace/api"
import { Mail, Phone } from "lucide-react"

import { ExternalLink } from "@/components/site/external-link"
import { buttonClass } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { safeHref } from "../links"
import { FALLBACK_ACTION_ID } from "../server/fallback"

/** Symbol für Kontaktwege; Web-Ziele tragen nur den Pfeil nach aussen. */
function ActionIcon({ href }: { href: string }) {
  if (/^tel:/i.test(href)) return <Phone aria-hidden="true" />
  if (/^mailto:/i.test(href)) return <Mail aria-hidden="true" />
  return null
}

/**
 * Die Hauptaktion ist der erste Bestellweg, sonst der erste Anfrageweg.
 * Sie ist die einzige rote Schaltfläche der Gruppe. Die Standard-Aktion
 * (Service Desk) wiederholt sich in Listen bei jeder Leistung und bleibt dort
 * zurückhaltend; rot wird sie nur, wo sie der einzige nächste Schritt der
 * Seite ist (`fallbackPrimary`).
 */
function primaryActionId(
  actions: CatalogLink[],
  fallbackPrimary: boolean
): string | null {
  const candidates = fallbackPrimary
    ? actions
    : actions.filter((action) => action.id !== FALLBACK_ACTION_ID)
  const primary =
    candidates.find((action) => action.kind === "order") ??
    candidates.find((action) => action.kind === "request")
  return primary?.id ?? null
}

/** Nächste Schritte einer Leistung oder eines Service als Schaltflächen. */
export function ActionLinks({
  actions,
  size = "md",
  stretch = false,
  fallbackPrimary = false,
  className,
}: {
  actions: CatalogLink[]
  size?: "sm" | "md" | "lg"
  /** Schaltflächen über die ganze Breite (Seitenspalte). */
  stretch?: boolean
  /** Die Standard-Aktion darf die rote Hauptaktion sein (Detailseite). */
  fallbackPrimary?: boolean
  className?: string
}) {
  const usable = actions.flatMap((action) => {
    const href = safeHref(action.url)
    return href ? [{ action, href }] : []
  })
  if (usable.length === 0) return null
  const primaryId = primaryActionId(
    usable.map((item) => item.action),
    fallbackPrimary
  )

  return (
    <ul
      className={cn(
        "flex gap-2",
        stretch ? "flex-col" : "flex-wrap",
        className
      )}
    >
      {usable.map(({ action, href }) => (
        <li key={action.id} className={stretch ? "w-full" : undefined}>
          <ExternalLink
            href={href}
            data-kind={action.kind}
            title={action.description ?? undefined}
            className={buttonClass({
              variant: action.id === primaryId ? "primary" : "secondary",
              size,
              className: cn(
                "h-auto max-w-full py-2 text-left whitespace-normal",
                size === "lg"
                  ? "min-h-12"
                  : size === "sm"
                    ? "min-h-8 py-1"
                    : "min-h-10",
                stretch && "w-full justify-between"
              ),
            })}
          >
            <span className="flex min-w-0 items-center gap-2">
              <ActionIcon href={href} />
              <span className="min-w-0 break-words">{action.label}</span>
            </span>
          </ExternalLink>
        </li>
      ))}
    </ul>
  )
}
