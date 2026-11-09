import { cn } from "@/lib/utils"

/** Aufzählung mit Halbgeviertstrich (CD-Manual) statt Punkten. */
export function DashList({
  items,
  className,
}: {
  items: { key: string; content: React.ReactNode }[]
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <ul className={cn("list-dash flex flex-col gap-1", className)}>
      {items.map((item) => (
        <li key={item.key}>{item.content}</li>
      ))}
    </ul>
  )
}
