import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Logo } from "@/components/site/logo"
import { SkipLink } from "@/components/site/site-header"
import { AdminNav } from "./admin-nav"
import { SignOutButton } from "./sign-out-button"

/**
 * Rahmen der Verwaltung: weisse Seitenleiste mit Logo, Navigation und
 * angemeldeter Person; der Inhalt steht auf dem grauen Grund.
 */
export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string }
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <SkipLink />
      <aside className="flex flex-col gap-4 border-b border-line bg-white px-5 pt-2 pb-3 lg:sticky lg:top-0 lg:h-dvh lg:gap-6 lg:border-r lg:border-b-0 lg:px-4 lg:pt-3 lg:pb-5">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link
            href="/admin"
            aria-label="BITS-Portal, Verwaltung"
            className="block rounded-sm py-5 lg:px-3"
          >
            <Logo />
          </Link>
          <p className="text-sm font-bold whitespace-nowrap text-ink lg:mt-1 lg:px-3">
            <span className="max-lg:hidden">BITS-Portal · </span>Verwaltung
          </p>
        </div>
        <AdminNav />
        <div className="hidden lg:mt-auto lg:block">
          <Link
            href="/"
            className="flex h-10 items-center gap-2 rounded-md px-3 text-sm text-text transition-colors duration-150 ease-out hover:bg-ground"
          >
            Zum Katalog
            <ArrowUpRight aria-hidden="true" className="size-4 text-muted" />
          </Link>
          <div className="mt-3 border-t border-line px-3 pt-4">
            <p className="truncate text-sm font-bold text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <SignOutButton className="mt-3" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <main id="inhalt" className="flex-1">
          <div className="mx-auto w-full max-w-[72rem] px-5 py-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-5 py-3 lg:hidden">
          <p className="min-w-0 truncate text-sm text-muted">{user.email}</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="link text-sm">
              Zum Katalog
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>
    </div>
  )
}
