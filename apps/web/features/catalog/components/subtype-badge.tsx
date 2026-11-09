import { Badge } from "@/components/ui/badge"

/** Subtyp einer Leistung, z. B. «Verwaltungsleistung» (weisse Pille). */
export function SubtypeBadge({
  label,
  className,
}: {
  label: string | null
  className?: string
}) {
  if (!label) return null
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}
