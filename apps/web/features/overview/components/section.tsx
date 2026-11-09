import { cn } from "cn"
import type { LucideIcon } from "lucide-react"

/** A top-level section of the overview, linked from the sidebar. */
export function Section({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  className,
  children,
}: {
  id: string
  /** Small label above the title, e.g. the nav group. */
  eyebrow?: string
  title: string
  description?: React.ReactNode
  icon?: LucideIcon
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn("flex scroll-mt-20 flex-col gap-5", className)}
    >
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {Icon && (
            <Icon className="size-5 text-muted-foreground" aria-hidden />
          )}
          {title}
        </h2>
        {description && (
          <p className="max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

/** A heading inside a section. */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-medium text-muted-foreground">{children}</h3>
  )
}
