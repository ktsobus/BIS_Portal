import { SiteNav } from "@/components/shell/site-nav"

/**
 * Rahmen für Anmeldung, Ersteinrichtung und Verwaltung: die Kopfzeile mit
 * Logo und Rückweg zum Katalog, darunter der Inhalt auf den Linien der Seite.
 * Diese Seiten wachsen mit ihrem Inhalt (`main.app`).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav plain />
      <main id="top" className="app">
        {children}
      </main>
    </>
  )
}
