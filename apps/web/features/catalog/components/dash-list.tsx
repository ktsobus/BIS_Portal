import { cn } from "@/lib/utils"

/** Aufzählung mit Halbgeviertstrich (CD) statt Punkten. */
export function DashList({
  items,
  className,
}: {
  items: { key: string; content: React.ReactNode }[]
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => (
        <li
          key={item.key}
          className="relative pl-5 before:absolute before:left-0 before:content-['–']"
        >
          {item.content}
        </li>
      ))}
    </ul>
  )
}
