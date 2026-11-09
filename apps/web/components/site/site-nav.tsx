"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface SiteNavItem {
  href: string
  label: string
  /** Auch bei Unterseiten als aktiv markieren (z. B. `/admin/...`). */
  matchPrefix?: boolean
}

/** Hauptnavigation; die aktuelle Seite erhält `aria-current="page"`. */
export function SiteNav({ items }: { items: SiteNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Hauptnavigation">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = item.matchPrefix
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b-2 border-transparent px-2 text-base hover:border-foreground",
                  active && "border-primary hover:border-primary"
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
