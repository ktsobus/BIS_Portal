import { cn } from "@/lib/utils"

/**
 * Abschnitt mit H2: `lg` (36 px) für Abschnitte der Startseite, `md`
 * (24 px) für Inhaltsseiten. Optional eine Zahl/Ergänzung rechts neben der
 * Überschrift und eine Schaltfläche am Ende («Alle … →»).
 */
export function Section({
  id,
  title,
  children,
  size = "md",
  footer,
  className,
}: {
  id: string
  title: React.ReactNode
  children: React.ReactNode
  size?: "md" | "lg"
  /** Abschluss des Abschnitts, z. B. eine Pille «Alle Leistungen →». */
  footer?: React.ReactNode
  className?: string
}) {
  const headingId = `${id}-titel`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "flex scroll-mt-6 flex-col",
        size === "lg" ? "gap-6 lg:gap-8" : "gap-4",
        className
      )}
    >
      <h2
        id={headingId}
        className={size === "lg" ? "type-headline-lg" : "type-headline-md"}
      >
        {title}
      </h2>
      {children}
      {footer ? <div className="pt-2 lg:pt-4">{footer}</div> : null}
    </section>
  )
}
