import { cn } from "@/lib/utils"

/**
 * Seitentitel nach so.ch: schlichte H1 in Schiefer (36 px Black, auf der
 * Startseite 48 px), mit Silbentrennung, optional mit einem Lead-Absatz
 * darunter. Wo die Seite im Katalog steht, sagen Brotkrumen und
 * Seitennavigation; eine Zeile über dem Titel gibt es deshalb nicht.
 */
export function PageTitle({
  children,
  lead,
  size = "default",
  className,
}: {
  children: React.ReactNode
  /** Einleitender Absatz (24 px). */
  lead?: React.ReactNode
  /** `large` für Einstiegsseiten (Startseite). */
  size?: "default" | "large"
  className?: string
}) {
  return (
    <div className={cn("flex max-w-reading flex-col gap-4", className)}>
      <h1
        className={cn(
          "text-balance",
          size === "large" ? "type-display" : "type-headline-lg"
        )}
      >
        {children}
      </h1>
      {lead ? <div className="type-lead text-pretty">{lead}</div> : null}
    </div>
  )
}
