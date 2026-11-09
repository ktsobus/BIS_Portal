import { cn } from "@/lib/utils"

/**
 * Seitentitel nach so.ch: schlichte H1 in Schiefer (36 px Black, auf der
 * Startseite 48 px), mit Silbentrennung. Optional eine Zeile darüber (z. B.
 * die Service-Familie) und ein Lead-Absatz darunter.
 */
export function PageTitle({
  children,
  eyebrow,
  lead,
  size = "default",
  className,
}: {
  children: React.ReactNode
  /** Kleine Zeile über dem Titel, z. B. «Service-Familie». */
  eyebrow?: React.ReactNode
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
          "text-pretty",
          size === "large" ? "type-display" : "type-headline-lg"
        )}
      >
        {children}
      </h1>
      {eyebrow ? (
        // Visuell über dem Titel, im Lesefluss danach.
        <p className="order-first type-label-lg">{eyebrow}</p>
      ) : null}
      {lead ? <div className="type-lead">{lead}</div> : null}
    </div>
  )
}
