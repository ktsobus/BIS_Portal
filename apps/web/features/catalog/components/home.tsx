import { Arrow, SearchGlyph } from "@/components/ui/arrow"
import { FooterLinks } from "@/components/shell/site-footer"
import { formatDateShort, formatDateTime } from "@/lib/format"

import type { loadShell, loadShowcase } from "../load"
import { countLabel, plainExcerpt } from "../text"

type Shell = Awaited<ReturnType<typeof loadShell>>
type Showcase = Awaited<ReturnType<typeof loadShowcase>>

/*
 * Startseite nach tasteskill 2.5.1 (Art: service, site-kind other).
 * Ausgeteilt: Hero split · Nav nav-mega · Abschluss close-photo · Fusszeile
 * footer-dark · Rhythmus dark-band · Knöpfe tonal · Moment word-highlight
 * (Abschnitt «portal») · Farben aus dem CD-Manual (start.mjs brand) · Schrift
 * schibsted. Jeder Abschnitt ist genau ein Bildschirm hoch.
 */

/** Hero (split): Text links, rechts das Rathaus Solothurn. */
export function HomeHero({ shell }: { shell: Shell }) {
  const stand = formatDateShort(shell.status?.generatedAt)
  return (
    <section
      className="hero hero--split"
      data-enter=""
      aria-labelledby="hero-h"
    >
      <div className="wrap">
        <div className="hero-text grid hero__grid">
          <div className="hero__text span-5">
            <h1 id="hero-h">IT-Services für die kantonale Verwaltung</h1>
            <p className="hero__lead">
              {shell.available
                ? `Das BITS-Portal führt die ${shell.leistungen} Leistungen des Amts für Informatik und Organisation: jede mit Beschreibung, zuständiger Stelle und dem Weg zur Bestellung.`
                : "Das BITS-Portal führt die Business-IT-Services des Amts für Informatik und Organisation: jede Leistung mit Beschreibung, zuständiger Stelle und dem Weg zur Bestellung."}
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href="/suche">
                Leistung suchen
                <Arrow />
              </a>
              <a className="btn btn--secondary" href="#kategorien">
                Kategorien ansehen
              </a>
            </div>
          </div>
          <div className="hero__media span-6 start-7">
            <picture>
              <source
                media="(max-width: 639px)"
                srcSet="/assets/img/photo-f175982218-780x975.jpg 780w"
                sizes="100vw"
              />
              <img
                src="/assets/img/photo-f175982218-1280.jpg"
                srcSet="/assets/img/photo-f175982218-500.jpg 500w, /assets/img/photo-f175982218-960.jpg 960w, /assets/img/photo-f175982218-1280.jpg 1280w"
                sizes="(max-width: 1023px) 100vw, 50vw"
                width={1280}
                height={1910}
                alt="Portal des Rathauses Solothurn: zwei steinerne Bannerträger mit rot-weissen Fahnen über dem Eingang"
                style={{ "--ly-pos": "50% 36%" } as React.CSSProperties}
                fetchPriority="high"
                decoding="async"
                data-source="stand-in"
                data-subject="Rathaus Solothurn"
              />
            </picture>
            {shell.available && stand ? (
              <div className="ly-float">
                <div className="ly-float__row">
                  <span className="ly-live">Katalog aktuell</span>
                  <span>{stand}</span>
                </div>
                <div className="ly-float__title">
                  {countLabel(shell.leistungen, "Leistung", "Leistungen")} in{" "}
                  {countLabel(shell.services, "Service", "Services")}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Kategorien (services-list): Liste links, Fotografie rechts. */
export function HomeCategories({ shell }: { shell: Shell }) {
  return (
    <section className="section" id="kategorien" aria-labelledby="kategorien-h">
      <div className="wrap">
        <div className="grid grid--top fill">
          <div className="span-5">
            <div className="section-head">
              <h2 id="kategorien-h">Leistungen nach Kategorie</h2>
              <p>
                Jede Kategorie fasst verwandte Services zusammen. Ein Service
                führt zu seinen Leistungen.
              </p>
            </div>
            {shell.available ? (
              <ul className="rows rows--nav">
                {shell.families.slice(0, 6).map((family) => (
                  <li key={family.slug}>
                    <a
                      className="rows__name"
                      href={`/kategorie/${family.slug}`}
                    >
                      {family.name}
                    </a>
                    <span className="rows__value">
                      {countLabel(
                        family.leistungCount,
                        "Leistung",
                        "Leistungen"
                      )}
                    </span>
                    <p>
                      {plainExcerpt(family.description, 90) ??
                        countLabel(family.serviceCount, "Service", "Services")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="note" role="status">
                <strong>Der Katalog ist im Moment nicht erreichbar.</strong>
                Die Kategorien erscheinen wieder, sobald die Daten aus LeanIX
                geladen sind.
              </p>
            )}
          </div>
          <div className="frame frame--photo frame--fill span-6 start-7">
            <img
              className="frame__img"
              src="/assets/img/photo-f175982159-960.jpg"
              srcSet="/assets/img/photo-f175982159-500.jpg 500w, /assets/img/photo-f175982159-960.jpg 960w"
              sizes="(max-width: 1023px) 100vw, 50vw"
              width={960}
              height={1455}
              alt="Rathaus Solothurn von der Rathausgasse: helle Kalksteinfassade und der Treppenturm mit grünem Kupferdach"
              loading="lazy"
              decoding="async"
              data-source="stand-in"
              data-subject="Rathaus Solothurn"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Ablauf (steps) auf dem dunklen Band: drei Ausschnitte der Oberfläche. */
export function HomeSteps({ showcase }: { showcase: Showcase }) {
  const leistung = showcase?.leistung ?? "Leistung"
  const service = showcase?.service ?? "Service"
  const action = showcase?.action ?? "Bestellen"
  const word = leistung.split(/\s+/)[0] ?? leistung
  return (
    <section
      className="section ground-inverse"
      id="ablauf"
      aria-labelledby="ablauf-h"
      style={{ "--hm": 2 } as React.CSSProperties}
    >
      <div className="wrap">
        <div className="section-head">
          <h2 id="ablauf-h">In 3 Schritten zur Bestellung</h2>
        </div>
        <div className="grid">
          <article className="card card--row card--open span-4">
            <span className="step-num">1</span>
            <h3>Leistung finden</h3>
            <p>
              Suchen Sie nach einem Stichwort oder gehen Sie über die Kategorie.
            </p>
            <div
              className="panel"
              role="img"
              aria-label={`Suche nach «${word}» mit dem Treffer ${leistung}`}
            >
              <div className="shot ui" aria-hidden="true">
                <div className="shot__field">
                  <SearchGlyph />
                  {word}
                </div>
                <div className="shot__row">
                  <span>{leistung}</span>
                </div>
                <div className="shot__row">
                  <span className="shot__meta">{service}</span>
                </div>
              </div>
            </div>
          </article>
          <article className="card card--row card--open span-4">
            <span className="step-num">2</span>
            <h3>Beschreibung lesen</h3>
            <p>
              Jede Leistung nennt ihren Umfang, die zuständige Stelle und das
              Vorgehen.
            </p>
            <div
              className="panel"
              role="img"
              aria-label={`Beschreibung der Leistung ${leistung}`}
            >
              <div className="shot ui" aria-hidden="true">
                <span className="shot__meta">{service}</span>
                <span className="shot__title">{leistung}</span>
                <div className="shot__lines">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </article>
          <article className="card card--row card--open span-4">
            <span className="step-num">3</span>
            <h3>Im Zielsystem bestellen</h3>
            <p>
              Der Knopf der Leistung öffnet das Bestellformular oder die
              Anfrage.
            </p>
            <div
              className="panel"
              role="img"
              aria-label={`Knopf «${action}» der Leistung ${leistung}`}
            >
              <div className="shot ui" aria-hidden="true">
                <span className="shot__title">{leistung}</span>
                <span className="shot__btn">{action}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

/** Aussage mit dem ausgeteilten Moment word-highlight. */
export function HomeStatement() {
  return (
    <section
      className="section statement"
      id="portal"
      data-moment="word-highlight"
      aria-label="Über das Portal"
    >
      <div className="wrap">
        <p className="t-label">Über das Portal</p>
        <p className="mo-wh__text">
          Das Portal liest die Business-IT-Services aus SAP LeanIX und zeigt
          sie, wie sie dort gepflegt sind. Bestellungen und Anfragen gehen ohne
          Umweg an <strong>das zuständige Zielsystem</strong>.
        </p>
      </div>
    </section>
  )
}

/** Abschluss (close-photo) und Fusszeile (footer-dark) in einem Bildschirm. */
export function HomeClosing({ shell }: { shell: Shell }) {
  const stand = formatDateTime(shell.status?.generatedAt)
  return (
    <footer
      className="footer closing footer--dark ground-inverse"
      id="kontakt"
      aria-labelledby="close-h"
    >
      <div className="wrap">
        <div className="closing__cta close--photo">
          <div className="section-head--split">
            <div>
              <h2 id="close-h">Die passende Leistung finden</h2>
              <p className="t-lead">
                {stand
                  ? `Stand des Katalogs: ${stand}.`
                  : "Der Katalog wird aus SAP LeanIX geladen."}
              </p>
            </div>
            <a className="btn btn--primary" href="/suche">
              Leistung suchen
              <Arrow />
            </a>
          </div>
          <div className="close__media">
            <img
              src="/assets/img/photo-f25000754-1920.jpg"
              srcSet="/assets/img/photo-f25000754-500.jpg 500w, /assets/img/photo-f25000754-960.jpg 960w, /assets/img/photo-f25000754.jpg 1280w, /assets/img/photo-f25000754-1920.jpg 1920w"
              sizes="(max-width: 1023px) 400vw, 100vw"
              width={1920}
              height={604}
              alt="Blick über die Dächer der Solothurner Altstadt zum Jura"
              loading="lazy"
              decoding="async"
              data-source="stand-in"
              data-subject="Altstadt Solothurn"
            />
          </div>
        </div>
        <div className="closing__links">
          <FooterLinks families={shell.families} contact={shell.contact} />
        </div>
      </div>
    </footer>
  )
}
