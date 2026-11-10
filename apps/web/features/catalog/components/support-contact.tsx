import type { OrgUnit, SupportContact } from "@workspace/api"
import { ArrowUpRightIcon, MailIcon, PhoneIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { isExternalUrl, phoneHref, safeHref } from "../links"
import { ActionButton } from "./action-links"
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

/** Textlink auf Schiefer; auf Touch-Geräten 44 px hoch antippbar. */
const onDarkLink =
  "underline decoration-1 underline-offset-[0.2em] hover:decoration-2 pointer-coarse:py-2.5"
/** Zeile der Kontaktliste; auf Touch-Geräten 44 px hoch. */
const onDarkRow =
  "pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:flex-wrap pointer-coarse:items-center pointer-coarse:gap-x-1"

/**
 * Zentraler Kontakt (Service Desk) aus der Konfiguration:
 * - `buttons`: Anfrageweg als rote Aktionsschaltfläche, darunter E-Mail und
 *   Telefon als weisse Pillen (Hinweise ohne eigenen Bestell- oder
 *   Anfrageweg, Ausfallseite)
 * - `links`: alles als weisse Textlinks auf der Schieferfläche (Fusszeile;
 *   dort nie Rot, siehe docs/design.md)
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

  if (variant === "links") {
    const requestHref = request ? safeHref(request.url)! : null
    const external = requestHref ? isExternalUrl(requestHref) : false
    return (
      <ul className={cn("flex flex-col gap-1 pointer-coarse:gap-0", className)}>
        {request && requestHref ? (
          <li className={onDarkRow}>
            <a
              href={requestHref}
              className={cn(onDarkLink, "inline-flex items-center gap-1")}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {request.label}
              {external ? (
                <>
                  <ArrowUpRightIcon
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="size-5"
                  />
                  <span className="sr-only">
                    {" "}
                    (externer Link, öffnet in neuem Tab)
                  </span>
                </>
              ) : null}
            </a>
          </li>
        ) : null}
        {contact.email ? (
          <li className={onDarkRow}>
            E-Mail:{" "}
            <a href={`mailto:${contact.email}`} className={onDarkLink}>
              {contact.email}
            </a>
          </li>
        ) : null}
        {contact.phone ? (
          <li className={onDarkRow}>
            Telefon:{" "}
            <a href={phoneHref(contact.phone)} className={onDarkLink}>
              {contact.phone}
            </a>
          </li>
        ) : null}
      </ul>
    )
  }

  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      {request ? <ActionButton action={request} /> : null}
      {contact.email || contact.phone ? (
        <ul className="flex flex-wrap gap-2">
          {contact.email ? (
            <li>
              <a
                href={`mailto:${contact.email}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto min-h-[3.125rem] max-w-full py-3 [overflow-wrap:anywhere] whitespace-normal"
                )}
              >
                <span className="sr-only">E-Mail: </span>
                {contact.email}
                <MailIcon aria-hidden="true" strokeWidth={1.5} />
              </a>
            </li>
          ) : null}
          {contact.phone ? (
            <li>
              <a
                href={phoneHref(contact.phone)}
                className={buttonVariants({ variant: "outline" })}
              >
                <span className="sr-only">Telefon: </span>
                {contact.phone}
                <PhoneIcon aria-hidden="true" strokeWidth={1.5} />
              </a>
            </li>
          ) : null}
        </ul>
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
 * konfiguriert – der zentrale Kontakt als Schaltflächen.
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
    <div className="flex max-w-[70ch] flex-col gap-4">
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
    </div>
  )
}
