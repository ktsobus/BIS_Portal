import { ActionBar, PageFooter } from "@/components/shell/site-footer"
import { SiteNav } from "@/components/shell/site-nav"
import { formatDateTime } from "@/lib/format"

import { loadShell } from "../load"

/**
 * Rahmen der Katalog-Unterseiten: Kopfzeile, `main.app` und die kurze
 * Fusszeile. Meldet darüber, wenn der angezeigte Stand veraltet ist.
 */
export async function CatalogFrame({
  children,
  search = false,
}: {
  children: React.ReactNode
  /** Die Suchseite selbst: kein Knopf zur Suche am Fuss des Telefons. */
  search?: boolean
}) {
  const shell = await loadShell()
  const stale = shell.available && shell.status.stale
  return (
    <>
      <SiteNav
        families={shell.families}
        leistungen={shell.leistungen}
        current="katalog"
        bare={search}
      />
      <main id="top" className="app">
        {stale ? (
          <div className="wrap">
            <p className="note" role="status">
              <strong>Der Katalog ist nicht auf dem neusten Stand.</strong>
              Angezeigt wird der Stand vom{" "}
              {formatDateTime(shell.status.generatedAt) ?? "letzten Abgleich"}.
            </p>
          </div>
        ) : null}
        {children}
      </main>
      <PageFooter families={shell.families} contact={shell.contact} />
      {search ? null : <ActionBar />}
    </>
  )
}

export type Crumb = { label: string; href?: string }

/** Pfad zur Seite; der letzte Eintrag ist die Seite selbst. */
export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Pfad">
      <ol className="crumbs">
        {items.map((item, index) => (
          <li key={index}>
            {item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
