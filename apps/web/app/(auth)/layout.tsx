import Link from "next/link"

import { SiteHeader, SkipLink } from "@/components/site/site-header"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader>
        <Link
          href="/"
          className="-mr-3 ml-auto flex h-11 items-center rounded-md px-3 text-base text-text transition-colors duration-150 ease-out hover:bg-ground"
        >
          Zum Katalog
        </Link>
      </SiteHeader>
      <main id="inhalt" className="flex-1">
        {children}
      </main>
    </div>
  )
}
