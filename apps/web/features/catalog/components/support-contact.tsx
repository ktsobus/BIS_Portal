import type { OrgUnit, SupportContact } from "@workspace/api"

import { phoneHref, safeHref } from "../links"
import { ActionButton } from "./actions"

/** Namen der Stellen, z. B. «Service-Management, Betrieb». */
export function orgUnitNames(units: OrgUnit[]): string {
  return units.map((unit) => unit.name).join(", ")
}

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

/** Zentraler Kontakt (Service Desk): Anfrageweg als Knopf, E-Mail und Telefon als Links. */
export function SupportContactLinks({
  contact,
  primary = false,
}: {
  contact: SupportContact
  primary?: boolean
}) {
  const request =
    contact.request && safeHref(contact.request.url) ? contact.request : null
  if (!request && !contact.email && !contact.phone) return null
  return (
    <>
      {request ? (
        <div className="btn-row">
          <ActionButton action={request} primary={primary} />
        </div>
      ) : null}
      {contact.email || contact.phone ? (
        <ul className="linklist">
          {contact.email ? (
            <li>
              E-Mail: <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </li>
          ) : null}
          {contact.phone ? (
            <li>
              Telefon: <a href={phoneHref(contact.phone)}>{contact.phone}</a>
            </li>
          ) : null}
        </ul>
      ) : null}
    </>
  )
}

/** An wen wenden? Endet mit Doppelpunkt, wenn darunter Kontaktangaben folgen. */
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
 * Service ohne Leistungen): Text, verantwortliche Stelle und, falls
 * konfiguriert, der zentrale Kontakt.
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
  /** Einleitung hervorgehoben und als eigener Absatz. */
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
          <p>
            <strong>{message}</strong>
          </p>
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

/** Seite bei einem Ausfall: der Katalog kann nicht gezeigt werden. */
export function CatalogUnavailable({
  contact,
}: {
  contact: SupportContact | null | undefined
}) {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Der Katalog ist im Moment nicht erreichbar</h1>
        <p className="t-lead">
          Die Daten aus LeanIX konnten nicht geladen werden. Versuchen Sie es in
          einigen Minuten erneut.
        </p>
        <div className="btn-row">
          <a className="btn btn--primary" href="">
            Seite neu laden
          </a>
        </div>
      </div>
      {hasSupportContact(contact) ? (
        <div className="note" style={{ marginTop: "var(--s-7)" }}>
          <p>
            <strong>Dringend?</strong> Der Service Desk des AIO hilft weiter:
          </p>
          <SupportContactLinks contact={contact} />
        </div>
      ) : null}
    </div>
  )
}
