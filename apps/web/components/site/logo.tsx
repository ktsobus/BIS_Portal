import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Logo «KANTON solothurn», unverändert aus der Originaldatei (farbige
 * Variante, nur auf Weiss). Seitenverhältnis 10.87 : 1; rundherum bleibt
 * mindestens eine Logohöhe frei (Schutzraum, siehe docs/branding.md).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/kanton-solothurn-logo.svg"
      alt="Kanton Solothurn"
      width={217}
      height={20}
      priority
      className={cn("h-4 w-auto shrink-0 sm:h-5", className)}
    />
  )
}
