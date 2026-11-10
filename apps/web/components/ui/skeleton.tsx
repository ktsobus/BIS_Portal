import { cn } from "@/lib/utils"

/** Platzhalter in der Form des Inhalts, solange Daten laden. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse-soft rounded-sm bg-ground-strong",
        className
      )}
    />
  )
}
