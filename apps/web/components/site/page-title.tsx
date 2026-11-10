import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Seitentitel mit dem roten Quadrat des CD-Manuals. Ab Tablet-Breite hängt
 * das Quadrat im Rand, damit der Titel mit dem Text bündig steht.
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
        "relative flex gap-[0.4em] font-extrabold text-ink md:block",
        size === "lg" ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="mt-[0.42em] size-[0.4em] shrink-0 bg-red md:absolute md:top-0 md:-left-[0.72em]"
      />
      <span className="min-w-0 break-words hyphens-auto">{children}</span>
    </h1>
  )
}
