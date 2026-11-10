import { Arrow } from "@/components/ui/arrow"

export type NavFamily = {
  slug: string
  name: string
  serviceCount: number
  leistungCount: number
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

/**
 * Kopfzeile (nav-mega): eine feste, deckende Leiste auf den Linien der Seite.
 * «Katalog» öffnet die Kategorien aus LeanIX als Spalten. `plain` zeigt nur
 * Logo und Rückweg (Anmeldung, Einrichtung).
 */
export function SiteNav({
  families = [],
  current,
  plain = false,
  bare = false,
  leistungen,
}: {
  families?: NavFamily[]
  current?: "katalog" | "verwaltung"
  plain?: boolean
  /** Auf der Suchseite: der Knopf zur Suche steht auf dem Telefon nicht in der Leiste. */
  bare?: boolean
  leistungen?: number
}) {
  // Zwei Spalten mit je höchstens vier Kategorien, daneben das Bild der Suche.
  const columns = chunk(families.slice(0, 8), 4)
  return (
    <header
      className={`nav${plain ? " nav--plain" : ""}${bare ? " nav--bare" : ""}`}
    >
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Zum Inhalt
        </a>
        <a className="nav__logo" href="/" aria-label="BITS-Portal, Startseite">
          {/* Originaldatei des Logos, unverändert (docs/branding.md). */}
          <img
            src="/brand/kanton-solothurn-logo.svg"
            alt="Kanton Solothurn"
            width={185}
            height={17}
          />
          <span className="nav__name">BITS-Portal</span>
        </a>
        {plain ? (
          <div className="nav__actions">
            <a className="btn btn--secondary" href="/">
              Katalog öffnen
            </a>
          </div>
        ) : (
          <>
            <nav className="nav__links" aria-label="Hauptnavigation">
              <div className="nav__item">
                <a
                  className="nav__link"
                  href="/#kategorien"
                  aria-current={current === "katalog" ? "page" : undefined}
                >
                  Katalog
                  {columns.length > 0 ? (
                    <svg
                      className="chev"
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 4.5l3 3 3-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </a>
                {columns.length > 0 ? (
                  <div className="nav__menu">
                    <div className="wrap grid">
                      {columns.map((column, index) => (
                        <div className="menu-col span-3" key={index}>
                          <p className="t-label">
                            {index === 0 ? "Kategorien" : "Weitere Kategorien"}
                          </p>
                          {column.map((family) => (
                            <a
                              key={family.slug}
                              href={`/kategorie/${family.slug}`}
                            >
                              {family.name}
                              <span>
                                {plural(
                                  family.serviceCount,
                                  "Service",
                                  "Services"
                                )}
                                ,{" "}
                                {plural(
                                  family.leistungCount,
                                  "Leistung",
                                  "Leistungen"
                                )}
                              </span>
                            </a>
                          ))}
                        </div>
                      ))}
                      <a className="menu-card span-3 start-10" href="/suche">
                        <div className="panel">
                          <img
                            className="frame__img"
                            src="/assets/img/photo-f175982159-500.jpg"
                            alt="Rathaus Solothurn mit dem grünen Kupferdach des Treppenturms"
                            width={500}
                            height={758}
                          />
                        </div>
                        <span className="t-card">Im ganzen Katalog suchen</span>
                        {leistungen ? (
                          <span className="t-small muted">
                            {plural(leistungen, "Leistung", "Leistungen")} nach
                            Stichwort
                          </span>
                        ) : null}
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="nav__item">
                <a className="nav__link" href="/#ablauf">
                  Ablauf
                </a>
              </div>
              <div className="nav__item">
                <a className="nav__link" href="/#portal">
                  Portal
                </a>
              </div>
            </nav>
            <div className="nav__actions">
              <a className="btn btn--primary" href="/suche">
                Leistung suchen
                <Arrow />
              </a>
            </div>
            <button
              className="nav__toggle"
              type="button"
              aria-expanded="false"
              aria-label="Menü"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
                <path
                  d="M2 5h14M2 13h14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
