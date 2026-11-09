import type { CatalogLink } from "@workspace/api"
import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { isExternalUrl, safeHref } from "./external-link"

/** Nur Links mit erlaubtem Ziel (http(s), mailto, tel). */
export function visibleLinks(links: CatalogLink[]): CatalogLink[] {
  return links.filter((link) => safeHref(link.url))
}

/**
 * «Weitere Informationen»: untereinander weisse Pillen mit rotem ↗ (extern)
 * bzw. → und ggf. einer Beschreibung darunter.
 */
export function InfoLinks({ links }: { links: CatalogLink[] }) {
  const visible = visibleLinks(links)
  if (visible.length === 0) return null

  return (
    <ul className="flex flex-col gap-4">
      {visible.map((link) => {
        const href = safeHref(link.url)!
        const external = isExternalUrl(href)
        const Icon = external ? ArrowUpRightIcon : ArrowRightIcon
        return (
          <li key={link.id} className="flex flex-col items-start gap-1.5">
            <a
              href={href}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto min-h-[3.125rem] py-3 text-left whitespace-normal"
              )}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span>
                {link.label}
                {external ? (
                  <span className="sr-only">
                    {" "}
                    (externer Link, öffnet in neuem Tab)
                  </span>
                ) : null}
              </span>
              <Icon aria-hidden="true" strokeWidth={1.5} />
            </a>
            {link.description ? (
              <p className="max-w-[60ch] type-body-sm">{link.description}</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
