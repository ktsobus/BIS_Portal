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

/**
 * Daten für Kopf- und Fusszeile: Kategorien, zentraler Kontakt und Stand.
 * Scheitert nie; ohne Katalog bleiben die Listen leer.
 */
export const loadShell = cache(async () => {
  const overview = await loadOverview()
  if (overview.ok) {
    const { families, status } = overview.data
    return {
      available: true as const,
      families,
      status,
      contact: status.contact,
      leistungen: families.reduce((sum, f) => sum + f.leistungCount, 0),
      services: families.reduce((sum, f) => sum + f.serviceCount, 0),
    }
  }
  const status = await loadStatus()
  return {
    available: false as const,
    families: [],
    status,
    contact: status?.contact ?? null,
    leistungen: 0,
    services: 0,
  }
})

/**
 * Eine echte Leistung für die Ausschnitte im Abschnitt «Ablauf»: die erste
 * mit Kurzbeschreibung aus dem ersten Service. `null` ohne Katalog.
 */
export const loadShowcase = cache(async () => {
  try {
    const overview = await loadOverview()
    if (!overview.ok) return null
    for (const family of overview.data.families) {
      const page = await serverClient.catalog.family({ slug: family.slug })
      for (const summary of page.services) {
        if (summary.leistungCount === 0) continue
        const service = await serverClient.catalog.service({
          slug: summary.slug,
        })
        const leistung =
          service.leistungen.find((entry) => entry.summary) ??
          service.leistungen[0]
        if (leistung) {
          return {
            leistung: leistung.name,
            service: service.service.name,
            family: family.name,
            action:
              leistung.actions.find((action) => action.kind === "order")
                ?.label ??
              leistung.actions[0]?.label ??
              null,
          }
        }
      }
    }
    return null
  } catch {
    return null
  }
})
