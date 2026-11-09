import "server-only"

import { cache } from "react"
import { ORPCError } from "@orpc/server"
import { notFound } from "next/navigation"

import { serverClient } from "@/lib/orpc-server"

/**
 * Datenzugriff der öffentlichen Seiten über den serverseitigen oRPC-Client.
 * `NOT_FOUND` führt zur 404-Seite, `CATALOG_UNAVAILABLE` zu einem Ergebnis,
 * das die Seite als «vorübergehend nicht verfügbar» darstellt. `cache()`
 * teilt das Ergebnis zwischen `generateMetadata` und der Seite.
 */
export type Loaded<T> = { ok: true; data: T } | { ok: false }

async function settle<T>(call: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await call() }
  } catch (error) {
    if (error instanceof ORPCError) {
      if (error.code === "NOT_FOUND") notFound()
      if (error.code === "CATALOG_UNAVAILABLE") return { ok: false }
    }
    throw error
  }
}

export const loadOverview = cache(() =>
  settle(() => serverClient.catalog.overview())
)

export const loadFamily = cache((slug: string) =>
  settle(() => serverClient.catalog.family({ slug }))
)

export const loadService = cache((slug: string) =>
  settle(() => serverClient.catalog.service({ slug }))
)

export const loadLeistung = cache((slug: string) =>
  settle(() => serverClient.catalog.leistung({ slug }))
)

/**
 * Status mit zentralem Kontakt, auch ohne Snapshot. Scheitert nie: Fusszeile
 * und Ausfallseite dürfen eine Seite nicht scheitern lassen.
 */
export const loadStatus = cache(async () => {
  try {
    return await serverClient.catalog.status()
  } catch {
    return null
  }
})
