import Link from "next/link"

import { cn } from "@/lib/utils"

export interface SideNavItem {
  key: string
  label: string
  href: string
  /** Aktuelle Seite. */
  current?: boolean
  /** Unterpunkte (werden nur beim aktiven Zweig angezeigt). */
  children?: SideNavItem[]
}

function inActiveBranch(item: SideNavItem): boolean {
  return Boolean(item.current || item.children?.some(inActiveBranch))
}

/**
 * Seitennavigation (250 px) für Inhaltsseiten mit Abschnittsbaum: Wurzel in
 * rotem Black, Einträge 16 px Schiefer mit Haarlinien; die aktuelle Seite
 * und ihre Vorfahren sind rot. Unterebenen sind eingerückt, über einer
 * geöffneten Gruppe steht eine Schieferlinie. Erst ab Desktop sichtbar.
 */
export function SideNav({
  label,
  root,
  items,
  className,
}: {
  /** Name der Navigation für Screenreader. */
  label: string
  root: { label: string; href: string; current?: boolean }
  items: SideNavItem[]
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={cn("hidden w-sidenav shrink-0 lg:block", className)}
    >
      <Link
        href={root.href}
        aria-current={root.current ? "page" : undefined}
        className="block pb-4 type-title-sm text-primary hover:underline"
      >
        {root.label}
      </Link>
      <SideNavList items={items} depth={0} />
    </nav>
  )
}

function SideNavList({
  items,
  depth,
}: {
  items: SideNavItem[]
  depth: number
}) {
  if (items.length === 0) return null
  return (
    <ul
      className={cn(
        "type-body-md",
        depth === 0 ? "border-t border-hairline" : "border-t border-secondary"
      )}
    >
      {items.map((item) => {
        const active = inActiveBranch(item)
        const open = active && item.children && item.children.length > 0
        return (
          <li
            key={item.key}
            className={cn(
              "border-b border-hairline",
              depth > 0 && "last:border-b-0"
            )}
          >
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              style={{ paddingLeft: indent(depth) }}
              className={cn(
                "block py-4 pr-2 transition-colors duration-200 hover:text-primary focus-visible:-outline-offset-2",
                active && "text-primary",
                item.current && "font-bold"
              )}
            >
              {item.label}
            </Link>
            {open ? (
              <SideNavList items={item.children ?? []} depth={depth + 1} />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** Einzug: 16 px auf der ersten Unterebene, danach je 8 px mehr. */
function indent(depth: number): string | undefined {
  if (depth === 0) return undefined
  return `${16 + (depth - 1) * 8}px`
}
