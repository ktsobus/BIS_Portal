import type { SupportContact } from "@workspace/api"

import type { NavFamily } from "@/components/shell/site-nav"

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`
}

/**
 * Verzeichnis der Fusszeile: Name des Portals, Spalten mit Links, Rechtszeile.
 * Steht auf der Startseite in `footer.closing`, auf den Unterseiten in der
 * kurzen Fusszeile. Auf dunklem Grund steht kein Logo: Die Negativ-Variante
 * liegt nicht als Originaldatei vor (docs/branding.md).
 */
export function FooterLinks({
  families,
  contact,
}: {
  families: NavFamily[]
  contact: SupportContact | null
}) {
  const hasContact = Boolean(
    contact && (contact.request || contact.email || contact.phone)
  )
  return (
    <>
      <div className="grid">
        <div className="span-4 stack-4">
          <p className="footer__name">BITS-Portal</p>
          <p className="t-small muted measure">
            Business-IT-Services für die kantonale Verwaltung Solothurn.
          </p>
        </div>
        <div className="span-2 footer__col">
          <h3>Katalog</h3>
          <ul>
            {families.slice(0, 5).map((family) => (
              <li key={family.slug}>
                <a href={`/kategorie/${family.slug}`}>{family.name}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="span-2 footer__col">
          <h3>Portal</h3>
          <ul>
            <li>
              <a href="/#ablauf">Ablauf einer Bestellung</a>
            </li>
            <li>
              <a href="/#portal">Über das Portal</a>
            </li>
            <li>
              <a href="/bildnachweis">Bildnachweis</a>
            </li>
          </ul>
        </div>
        {hasContact && contact ? (
          <div className="span-2 footer__col">
            <h3>Service Desk</h3>
            <ul>
              {contact.request ? (
                <li>
                  <a href={contact.request.url}>{contact.request.label}</a>
                </li>
              ) : null}
              {contact.email ? (
                <li>
                  <a href={`mailto:${contact.email}`}>E-Mail schreiben</a>
                </li>
              ) : null}
              {contact.phone ? (
                <li>
                  <a href={phoneHref(contact.phone)}>{contact.phone}</a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
        <div className="span-2 footer__col">
          <h3>Verwaltung</h3>
          <ul>
            <li>
              <a href="/sign-in">Als Admin anmelden</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer__legal">
        <span>
          &copy; {new Date().getFullYear()} Kanton Solothurn &nbsp;{" "}
          <span className="footer__sender">
            Amt für Informatik und Organisation
          </span>
        </span>
        <a className="credits" href="/bildnachweis">
          Fotos via Wikimedia Commons
        </a>
      </div>
    </>
  )
}

/** Kurze Fusszeile der Unterseiten. */
export function PageFooter(props: {
  families: NavFamily[]
  contact: SupportContact | null
}) {
  return (
    <footer className="footer footer--dark footer--page ground-inverse">
      <div className="wrap closing__links">
        <FooterLinks {...props} />
      </div>
    </footer>
  )
}

/**
 * Leiste am Fuss des Telefons mit der Hauptaktion (Kit: nav.actionbar). Sie
 * muss ein direktes Kind von <body> sein; system.js zeigt sie erst, wenn der
 * Knopf des Heros aus dem Bild ist.
 */
export function ActionBar() {
  return (
    <nav className="actionbar" aria-label="Schnellzugriff">
      <a className="btn btn--primary" href="/suche">
        Leistung suchen
      </a>
    </nav>
  )
}
