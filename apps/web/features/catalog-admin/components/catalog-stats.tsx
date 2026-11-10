import type { CatalogStats as Stats } from "@workspace/api"

import { formatNumber } from "./format"

interface Figure {
  /** Nur Pflicht-Kennzahlen (`actions` fehlt in älteren Ständen). */
  key: Exclude<keyof Stats, "actions">
  label: string
  hint: string
  /** Wert > 0 verweist auf den Qualitätsbericht. */
  attention?: boolean
}

const figures: Figure[] = [
  {
    key: "families",
    label: "Service-Familien",
    hint: "Leistungskategorien Ebene 2",
  },
  { key: "services", label: "Services", hint: "Leistungskategorien Ebene 3" },
  {
    key: "leistungen",
    label: "Leistungen im Portal",
    hint: "einem Service zugeordnet",
  },
  {
    key: "leistungenInChannel",
    label: "Im Kanal",
    hint: "Kanal «Business IT-Servicekatalog»",
  },
  {
    key: "leistungenSkipped",
    label: "Nicht angezeigt",
    hint: "im Kanal, aber ohne Service",
    attention: true,
  },
  {
    key: "issues",
    label: "Auffälligkeiten",
    hint: "siehe Datenqualität",
    attention: true,
  },
]

/** Kennzahlen des aktuellen Katalog-Stands. */
export function CatalogStats({ stats }: { stats: Stats }) {
  return (
    <dl className="stat-row">
      {figures.map((figure) => {
        const value = stats[figure.key]
        const linked = figure.attention && value > 0
        return (
          <div key={figure.key}>
            <dd>
              {linked ? (
                <a className="stat-row__link" href="#datenqualitaet">
                  {formatNumber(value)}
                  <span className="sr-only"> – zum Datenqualitätsbericht</span>
                </a>
              ) : (
                formatNumber(value)
              )}
            </dd>
            <dt>
              <span className="stat-row__label">{figure.label}</span>
              <span>{figure.hint}</span>
            </dt>
          </div>
        )
      })}
    </dl>
  )
}
