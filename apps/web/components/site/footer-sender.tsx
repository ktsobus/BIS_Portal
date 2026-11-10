/**
 * Absender in der Fusszeile (CD-Manual «Absender»: Amtsbezeichnung in
 * Black Italic), weiss auf der Schieferfläche.
 */
export function FooterSender() {
  return (
    <address className="flex flex-col gap-1 not-italic">
      <span className="type-headline-sm font-bold italic">
        Amt für Informatik und Organisation
      </span>
      <span>Kanton Solothurn</span>
      <span>Business-IT-Serviceportal</span>
    </address>
  )
}
