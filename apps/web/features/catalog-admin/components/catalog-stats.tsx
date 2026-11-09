import type { CatalogStats as Stats } from "@workspace/api"

import { cn } from "@/lib/utils"

import { formatNumber } from "./format"

interface Tile {
  key: keyof Stats
  label: string
  hint: string
  /** Wert > 0 hervorheben und auf den Qualitätsbericht verweisen. */
  attention?: boolean
}

const tiles: Tile[] = [
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

/** Kennzahlen des aktuellen Katalog-Stands als Kacheln. */
export function CatalogStats({ stats }: { stats: Stats }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => {
        const value = stats[tile.key]
        const highlight = tile.attention && value > 0
        return (
          <div
            key={tile.key}
            className="flex flex-col-reverse justify-end gap-1 bg-background p-4"
          >
            <dt className="flex flex-col text-sm leading-snug">
              <span className="font-bold">{tile.label}</span>
              <span className="text-muted-foreground">{tile.hint}</span>
            </dt>
            <dd
              className={cn(
                "text-4xl leading-none tabular-nums",
                highlight && "text-primary"
              )}
            >
              {highlight ? (
                <a
                  href="#datenqualitaet"
                  className="underline decoration-1 underline-offset-4 hover:decoration-2"
                >
                  {formatNumber(value)}
                  <span className="sr-only"> – zum Datenqualitätsbericht</span>
                </a>
              ) : (
                formatNumber(value)
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
