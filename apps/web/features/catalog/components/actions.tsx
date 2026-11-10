import type { CatalogLink } from "@workspace/api"

import { isExternalUrl, safeHref } from "../links"

/**
 * Aktion einer Leistung als Knopf. Externe Ziele (ky2help, SmartForm …)
 * öffnen in einem neuen Tab. `primary` gilt für genau einen Knopf pro Ansicht.
 */
export function ActionButton({
  action,
  primary = false,
}: {
  action: CatalogLink
  primary?: boolean
}) {
  const href = safeHref(action.url)
  if (!href) return null
  const external = isExternalUrl(href)
  return (
    <a
      href={href}
      data-kind={action.kind}
      className={`btn ${primary ? "btn--primary" : "btn--secondary"}${external ? " ext" : ""}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {action.label}
      {external ? (
        <span className="sr-only"> (öffnet in neuem Tab)</span>
      ) : null}
    </a>
  )
}

/** Aktionen in Anzeige-Reihenfolge; die erste Bestellung (sonst die erste Aktion) ist gefüllt. */
export function ActionButtons({ actions }: { actions: CatalogLink[] }) {
  const visible = actions.filter((action) => safeHref(action.url))
  if (visible.length === 0) return null
  const main = visible.find((action) => action.kind === "order") ?? visible[0]
  return (
    <>
      {visible.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          primary={action === main}
        />
      ))}
    </>
  )
}

/** Textlink; http(s) öffnet in neuem Tab. */
export function TextLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const external = isExternalUrl(href)
  return (
    <a
      href={href}
      className={external ? "ext" : undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external ? (
        <span className="sr-only"> (öffnet in neuem Tab)</span>
      ) : null}
    </a>
  )
}
