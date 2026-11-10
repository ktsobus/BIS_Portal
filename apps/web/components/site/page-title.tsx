import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Seitentitel mit dem roten Quadrat des CD-Manuals. Ab Tablet-Breite hängt
 * das Quadrat im Rand; auf schmalen Bildschirmen steht es über dem Titel.
 * So ist der Titel überall mit Brotkrumen und Text bündig.
 */
export function PageTitle({
  children,
  size = "lg",
  className,
}: {
  children: ReactNode
  size?: "md" | "lg"
  className?: string
}) {
  return (
    <h1
      className={cn(
        "relative font-bold text-ink",
        size === "lg" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="mb-3 block size-3 bg-red md:absolute md:top-[0.42em] md:-left-[0.72em] md:mb-0 md:size-[0.4em]"
      />
      <span className="block break-words hyphens-auto">{children}</span>
    </h1>
  )
}
