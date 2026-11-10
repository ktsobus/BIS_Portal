"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Katalog" },
  { href: "/suche", label: "Suche" },
] as const

function isCurrent(href: string, pathname: string) {
  if (href === "/suche") return pathname.startsWith("/suche")
  return !pathname.startsWith("/suche")
}

/** Hauptnavigation des Katalogs; die aktuelle Seite trägt den roten Strich. */
export function SiteNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Hauptnavigation" className="-mr-3 ml-auto flex">
      {items.map((item) => {
        const current = isCurrent(item.href, pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "relative flex h-11 items-center rounded-md px-3 text-base transition-colors duration-150 ease-out hover:bg-ground",
              current ? "font-bold text-ink" : "text-text"
            )}
          >
            {item.label}
            {current ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-1 h-0.5 bg-red"
              />
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
