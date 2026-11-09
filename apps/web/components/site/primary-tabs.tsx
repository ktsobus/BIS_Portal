"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export interface PrimaryTab {
  href: string
  label: string
  /** Weitere Pfad-Präfixe, unter denen der Reiter als aktiv gilt. */
  match?: string[]
}

function isActive(pathname: string, tab: PrimaryTab): boolean {
  const prefixes = tab.match ?? [tab.href]
  return prefixes.some((prefix) =>
    prefix === "/"
      ? pathname === "/"
      : pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/**
 * Hauptreiter im Kopf (24 px Black, Schiefer). Der aktive Reiter ist rot und
 * hat eine rote Linie, die auf der Haarlinie des Kopfs aufliegt.
 */
export function PrimaryTabs({
  tabs,
  label,
}: {
  tabs: PrimaryTab[]
  label: string
}) {
  const pathname = usePathname()

  return (
    <nav aria-label={label} className="-mb-px min-w-0">
      <ul className="-ml-1 flex [scrollbar-width:none] gap-x-6 overflow-x-auto px-1 lg:gap-x-10">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab)
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b border-transparent py-[11px] type-nav-primary text-secondary transition-colors duration-200 hover:text-primary focus-visible:-outline-offset-2",
                  active && "border-primary text-primary"
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
