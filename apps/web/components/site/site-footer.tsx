import Link from "next/link"
import type { CatalogStatus } from "@workspace/api"

import { formatDateTime } from "@/lib/format"
import { serverClient } from "@/lib/orpc-server"
import { cn } from "@/lib/utils"

import { siteContainer } from "./container"
import { FooterSender } from "./footer-sender"

async function loadStatus(): Promise<CatalogStatus | null> {
  try {
    return await serverClient.catalog.status()
  } catch {
    // Die Fusszeile darf eine Seite nie scheitern lassen.
    return null
  }
}

/** Fusszeile mit Absender (CD: Black Italic) und Stand der Katalogdaten. */
export async function SiteFooter() {
  const status = await loadStatus()
  const generatedAt =
    status?.available && status.generatedAt
      ? formatDateTime(status.generatedAt)
      : null

  return (
    <footer className="mt-16 border-t border-border bg-so-surface">
      <div
        className={cn(
          siteContainer,
          "flex flex-col gap-6 py-8 text-sm md:flex-row md:items-start md:justify-between"
        )}
      >
        <FooterSender />

        <div className="flex max-w-[44ch] flex-col gap-1.5">
          {generatedAt ? (
            <p>
              Stand der Daten:{" "}
              <time dateTime={status?.generatedAt ?? undefined}>
                {generatedAt}
              </time>
            </p>
          ) : (
            <p>Der Katalog ist derzeit nicht verfügbar.</p>
          )}
          {status?.source === "demo" ? (
            <p>
              <strong>Demo-Daten:</strong> Die Inhalte stammen aus einem
              Testdatensatz, nicht direkt aus LeanIX.
            </p>
          ) : null}
          {status?.stale ? (
            <p>
              <strong>Hinweis:</strong> Die Daten konnten seit längerer Zeit
              nicht aus LeanIX aktualisiert werden.
            </p>
          ) : null}
          <p>
            <Link href="/sign-in" className="link-cd text-muted-foreground">
              Anmeldung Administration
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
