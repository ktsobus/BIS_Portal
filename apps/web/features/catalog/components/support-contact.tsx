import type { ReactNode } from "react"
import type { OrgUnit, SupportContact } from "@workspace/api"
import { Mail, Phone } from "lucide-react"

import { ExternalLink } from "@/components/site/external-link"
import { cn } from "@/lib/utils"

import { phoneHref, safeHref } from "../links"
import { ActionLinks } from "./action-links"

/** Ein zentraler Kontakt ist nur nutzbar, wenn er ein gültiges Ziel hat. */
export function hasSupportContact(
  contact: SupportContact | null | undefined
): contact is SupportContact {
  if (!contact) return false
  return Boolean(
    safeHref(contact.request?.url) || contact.email || contact.phone
  )
}

/** Zentraler Kontakt (Service Desk): Anfrageweg, E-Mail und Telefon. */
export function SupportContactLinks({
  contact,
  variant = "button",
  className,
}: {
  contact: SupportContact
  /** `link`: alles als Textlinks (Fusszeile). */
  variant?: "button" | "link"
  className?: string
}) {
  const direct = "inline-flex items-center gap-2 link"
  const requestHref = safeHref(contact.request?.url)
  return (
    <div className={cn("space-y-3", className)}>
      {contact.request && variant === "button" ? (
        <ActionLinks actions={[contact.request]} />
      ) : null}
      {contact.request && requestHref && variant === "link" ? (
        <p className="text-sm">
          <ExternalLink
            href={requestHref}
            data-kind={contact.request.kind}
            className="link font-bold"
          >
            {contact.request.label}
          </ExternalLink>
        </p>
      ) : null}
      {contact.email || contact.phone ? (
        <ul className="space-y-1.5 text-sm">
          {contact.email ? (
            <li>
              <a href={`mailto:${contact.email}`} className={direct}>
                <Mail aria-hidden="true" className="size-4 shrink-0" />
                <span className="break-all">{contact.email}</span>
              </a>
            </li>
          ) : null}
          {contact.phone ? (
            <li>
              <a href={phoneHref(contact.phone)} className={direct}>
                <Phone aria-hidden="true" className="size-4 shrink-0" />
                {contact.phone}
              </a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}

function unitNames(units: OrgUnit[]): ReactNode {
  return units.map((unit, index) => (
    <span key={unit.id}>
      {index > 0 ? (index === units.length - 1 ? " oder " : ", ") : null}
      <strong>{unit.name}</strong>
    </span>
  ))
}

/**
 * Hinweis, wenn eine Leistung oder ein Service keinen eigenen Bestell- oder
 * Anfrageweg hat: an wen sich die Person stattdessen wendet. Ohne
 * Konfiguration bleibt es beim Text; es wird kein Kontakt erfunden.
 */
export function NoRequestPathHint({
  message,
  responsible,
  contact,
  className,
}: {
  message?: string
  responsible: OrgUnit[]
  contact: SupportContact | null | undefined
  className?: string
}) {
  const withContact = hasSupportContact(contact)
  return (
    <div className={cn("space-y-3 text-sm text-text", className)}>
      {message ? <p>{message}</p> : null}
      {withContact ? (
        <>
          <p>
            {responsible.length > 0 ? (
              <>
                Bitte wenden Sie sich an die verantwortliche Stelle (
                {unitNames(responsible)}) oder an den Service Desk des AIO:
              </>
            ) : (
              "Bitte wenden Sie sich an den Service Desk des AIO:"
            )}
          </p>
          <SupportContactLinks contact={contact} />
        </>
      ) : responsible.length > 0 ? (
        <p>
          Bitte wenden Sie sich an die verantwortliche Stelle:{" "}
          {unitNames(responsible)}.
        </p>
      ) : (
        <p>Bitte wenden Sie sich an den Service Desk des AIO.</p>
      )}
    </div>
  )
}
