import type { OrgUnit, SupportContact } from "@workspace/api"

import { cn } from "@/lib/utils"

import { phoneHref, safeHref } from "../links"
import { ActionLink } from "./action-links"
import { ExternalLink } from "./external-link"
import { orgUnitNames } from "./org-units"

/** Hat der Kontakt mindestens einen nutzbaren Weg? */
export function hasSupportContact(
  contact: SupportContact | null | undefined
): contact is SupportContact {
  return Boolean(
    contact &&
    ((contact.request && safeHref(contact.request.url)) ||
      contact.email ||
      contact.phone)
  )
}

/**
 * Zentraler Kontakt (Service Desk) aus der Konfiguration:
 * - `buttons`: Anfrageweg als Schaltfläche, darunter E-Mail und Telefon
 *   (Hinweise ohne eigenen Bestell- oder Anfrageweg, Ausfallseite)
 * - `links`: alles als Textlinks (Fusszeile)
 */
export function SupportContactLinks({
  contact,
  variant = "buttons",
  className,
}: {
  contact: SupportContact
  variant?: "buttons" | "links"
  className?: string
}) {
  const request =
    contact.request && safeHref(contact.request.url) ? contact.request : null
  if (!request && !contact.email && !contact.phone) return null

  const details = (
    <>
      {contact.email ? (
        <li>
          E-Mail:{" "}
          <a href={`mailto:${contact.email}`} className="link-cd">
            {contact.email}
          </a>
        </li>
      ) : null}
      {contact.phone ? (
        <li>
          Telefon:{" "}
          <a href={phoneHref(contact.phone)} className="link-cd">
            {contact.phone}
          </a>
        </li>
      ) : null}
    </>
  )

  if (variant === "links") {
    return (
      <ul className={cn("flex flex-col gap-1", className)}>
        {request ? (
          <li>
            <ExternalLink href={request.url}>{request.label}</ExternalLink>
          </li>
        ) : null}
        {details}
      </ul>
    )
  }

  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      {request ? <ActionLink action={request} /> : null}
      {contact.email || contact.phone ? (
        <ul className="flex flex-col gap-1">{details}</ul>
      ) : null}
    </div>
  )
}

/**
 * An wen wenden? Verantwortliche Stelle und/oder Service Desk; endet mit
 * Doppelpunkt, wenn darunter Kontaktangaben folgen.
 */
export function ContactSentence({
  responsible,
  withContact,
}: {
  responsible: OrgUnit[]
  withContact: boolean
}) {
  const names = orgUnitNames(responsible)
  if (names) {
    return withContact ? (
      <>
        Bitte wenden Sie sich an die verantwortliche Stelle (
        <strong>{names}</strong>) oder an den Service Desk des AIO:
      </>
    ) : (
      <>
        Bitte wenden Sie sich an die verantwortliche Stelle:{" "}
        <strong>{names}</strong>.
      </>
    )
  }
  return withContact
    ? "Bitte wenden Sie sich an den Service Desk des AIO:"
    : "Bitte wenden Sie sich an den Service Desk des AIO."
}

/**
 * Hinweis ohne eigenen Bestell- oder Anfrageweg (Leistung ohne Aktion,
 * Service ohne Leistungen): Text, verantwortliche Stelle und – falls
 * konfiguriert – der zentrale Kontakt als Schaltfläche bzw. Links.
 */
export function NoRequestPathHint({
  message,
  responsible,
  contact,
  emphasize = false,
}: {
  message: string
  responsible: OrgUnit[]
  contact: SupportContact | null | undefined
  /** Einleitung fett und als eigener Absatz (Service ohne Leistungen). */
  emphasize?: boolean
}) {
  const withContact = hasSupportContact(contact)
  const sentence = (
    <ContactSentence responsible={responsible} withContact={withContact} />
  )
  return (
    <>
      {emphasize ? (
        <>
          <p className="font-bold">{message}</p>
          <p>{sentence}</p>
        </>
      ) : (
        <p>
          {message} {sentence}
        </p>
      )}
      {withContact ? <SupportContactLinks contact={contact} /> : null}
    </>
  )
}
