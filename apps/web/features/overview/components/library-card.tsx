import { ExternalLinkIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

import type { Library } from "../content"
import { LogoTile } from "./logo"

/** A library with its logo, role and a link to its documentation. */
export function LibraryCard({ library }: { library: Library }) {
  const logos = library.logos ?? []
  return (
    <a
      href={library.docs}
      target="_blank"
      rel="noreferrer"
      className="group rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card
        size="sm"
        className="h-full transition-colors group-hover:bg-muted/50"
      >
        <CardHeader className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {logos.length > 0 ? (
              logos.map((name) => (
                <LogoTile key={name} name={name} className="ring-2 ring-card" />
              ))
            ) : (
              <LogoTile icon={library.icon} />
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="flex items-center gap-1.5 font-medium">
              {library.name}
              <ExternalLinkIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="text-xs text-muted-foreground">
              {library.role}
            </span>
          </div>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {library.note}
        </CardContent>
      </Card>
    </a>
  )
}
