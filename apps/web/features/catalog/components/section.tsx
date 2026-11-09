import { cn } from "@/lib/utils"

/** Abschnitt mit h2-Überschrift (CD: Normalschnitt, linksbündig). */
export function Section({
  id,
  title,
  children,
  className,
}: {
  id: string
  title: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const headingId = `${id}-titel`
  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <h2 id={headingId} className="text-2xl leading-tight font-normal">
        {title}
      </h2>
      {children}
    </section>
  )
}
