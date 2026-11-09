import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Roter Kreis mit weissem Pfeil (Richtung «weiter»), z. B. unten rechts in
 * Servicekarten. Rein dekorativ; das Ziel nennt der umgebende Link.
 */
export function ArrowCircle({
  size = "sm",
  className,
}: {
  /** `sm` 36 px (in Karten), `md` 44 px. */
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-shadow duration-150",
        size === "sm" ? "size-9" : "size-11",
        className
      )}
    >
      <ArrowRightIcon
        strokeWidth={1.5}
        className={size === "sm" ? "size-5" : "size-6"}
      />
    </span>
  )
}
