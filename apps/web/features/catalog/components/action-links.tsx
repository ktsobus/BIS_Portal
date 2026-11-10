import type { CatalogLink } from "@workspace/api"
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  MailIcon,
  PhoneIcon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { isExternalUrl, safeHref } from "./external-link"

/** Symbol je Ziel: Telefon, E-Mail, extern (↗) oder weiter (→). */
function ActionIcon({ href, className }: { href: string; className?: string }) {
  const props = {
    "aria-hidden": true as const,
    strokeWidth: 1.5,
    className,
  }
  if (href.startsWith("tel:")) return <PhoneIcon {...props} />
  if (href.startsWith("mailto:")) return <MailIcon {...props} />
  if (isExternalUrl(href)) return <ArrowUpRightIcon {...props} />
  return <ArrowRightIcon {...props} />
}

function targetProps(href: string) {
  return isExternalUrl(href)
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {}
}

function ExternalHint({ href }: { href: string }) {
  return isExternalUrl(href) ? (
    <span className="sr-only"> (externer Link, öffnet in neuem Tab)</span>
  ) : null
}

/**
 * Aktionsschaltfläche («Service nutzen»): rote Pille, 62 px hoch, vorne ein
 * weisser 42-px-Kreis mit rotem Symbol. Für die Hauptaufgabe einer Seite.
 */
export function ActionButton({ action }: { action: CatalogLink }) {
  const href = safeHref(action.url)
  if (!href) return null

  return (
    <a
      href={href}
      data-kind={action.kind}
      className="group/action inline-flex min-h-[3.875rem] w-full max-w-full min-w-0 items-center gap-4 rounded-full bg-primary py-2.5 pr-[1.875rem] pl-2.5 text-left type-label-md text-primary-foreground transition-shadow duration-150 hover:shadow-press-dark active:shadow-press-dark sm:w-auto"
      {...targetProps(href)}
    >
      <span className="inline-flex size-[2.625rem] shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <ActionIcon href={href} className="size-[1.375rem]" />
      </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {action.label}
        <ExternalHint href={href} />
      </span>
    </a>
  )
}

/**
 * Aktion als weisse Standard-Pille (klein), z. B. in Leistungskarten, wo
 * mehrere Karten nebeneinander stehen und Rot der Hauptaufgabe vorbehalten
 * bleibt.
 */
export function ActionPill({ action }: { action: CatalogLink }) {
  const href = safeHref(action.url)
  if (!href) return null

  return (
    <a
      href={href}
      data-kind={action.kind}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        // `max-w-full min-w-0 shrink` hebt `shrink-0` der Button-Basis auf:
        // Lange Beschriftungen brechen um, statt bei 320 px aus der Karte zu
        // laufen.
        "h-auto min-h-[2.625rem] max-w-full min-w-0 shrink py-2.5 text-left whitespace-normal"
      )}
      {...targetProps(href)}
    >
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {action.label}
        <ExternalHint href={href} />
      </span>
      <ActionIcon href={href} />
    </a>
  )
}

/** Aktionen nebeneinander (Pillen in Karten) bzw. untereinander (rot). */
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
          <ActionPill key={action.id} action={action} />
        ))}
      </div>
    )
  }

  return (
    <ul className={cn("flex flex-col gap-4", className)}>
      {visible.map((action) => (
        <li key={action.id} className="flex flex-col items-start gap-2">
          <ActionButton action={action} />
          {action.description ? (
            <p className="max-w-[60ch] type-body-sm">{action.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
