/** Absender in der Fusszeile (CD: Amtsname in Black Italic). */
export function FooterSender() {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-lg leading-tight font-bold italic">
        Amt für Informatik und Organisation
      </p>
      <p className="text-muted-foreground">
        Kanton Solothurn · Business-IT-Serviceportal
      </p>
    </div>
  )
}
