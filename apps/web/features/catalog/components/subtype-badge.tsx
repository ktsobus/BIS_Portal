import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Subtyp einer Leistung, z. B. «Verwaltungsleistung». */
export function SubtypeBadge({
  label,
  className,
}: {
  label: string | null
  className?: string
}) {
  if (!label) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto border-so-line-strong px-2 py-0.5 text-xs font-normal text-so-graphite",
        className
      )}
    >
      {label}
    </Badge>
  )
}
