import "server-only"

import type { CatalogPublicStatus, CatalogStatus } from "@workspace/api"

import { getCatalog, getCatalogStatus } from "@/lib/catalog/store"
import { env } from "@/lib/env"
import { os } from "@/server/orpc"

import { createFallbackAction, createSupportContact } from "./fallback"
import {
  buildFamilyPage,
  buildLeistungPage,
  buildOverview,
  buildSearchIndex,
  buildServicePage,
  type ViewOptions,
} from "./views"

function viewOptions(): ViewOptions {
  return {
    fallbackAction: createFallbackAction(
      env.CATALOG_FALLBACK_REQUEST_URL,
      env.CATALOG_FALLBACK_REQUEST_LABEL
    ),
    showPersons: env.CATALOG_SHOW_PERSONS,
  }
}

/** Zentraler Kontakt aus der Konfiguration (unabhängig vom Snapshot). */
function supportContact() {
  return createSupportContact({
    requestUrl: env.CATALOG_FALLBACK_REQUEST_URL,
    requestLabel: env.CATALOG_FALLBACK_REQUEST_LABEL,
    email: env.CATALOG_SUPPORT_EMAIL,
    phone: env.CATALOG_SUPPORT_PHONE,
  })
}

function publicStatus(status: CatalogStatus): CatalogPublicStatus {
  return { ...status, contact: supportContact() }
}

async function load() {
  const [snapshot, status] = await Promise.all([
    getCatalog(),
    getCatalogStatus(),
  ])
  return { snapshot, status: publicStatus(status) }
}

/** Öffentliche Katalog-Prozeduren (ohne Anmeldung), lesen nur den Snapshot. */
export const catalogRouter = {
  status: os.catalog.status.handler(async () =>
    publicStatus(await getCatalogStatus())
  ),

  overview: os.catalog.overview.handler(async ({ errors }) => {
    const { snapshot, status } = await load()
    if (!snapshot) throw errors.CATALOG_UNAVAILABLE()
    return { status, ...buildOverview(snapshot, viewOptions()) }
  }),

  family: os.catalog.family.handler(async ({ input, errors }) => {
    const { snapshot, status } = await load()
    if (!snapshot) throw errors.CATALOG_UNAVAILABLE()
    const page = buildFamilyPage(snapshot, viewOptions(), input.slug)
    if (!page) throw errors.NOT_FOUND()
    return { status, ...page }
  }),

  service: os.catalog.service.handler(async ({ input, errors }) => {
    const { snapshot, status } = await load()
    if (!snapshot) throw errors.CATALOG_UNAVAILABLE()
    const page = buildServicePage(snapshot, viewOptions(), input.slug)
    if (!page) throw errors.NOT_FOUND()
    return { status, ...page }
  }),

  leistung: os.catalog.leistung.handler(async ({ input, errors }) => {
    const { snapshot, status } = await load()
    if (!snapshot) throw errors.CATALOG_UNAVAILABLE()
    const page = buildLeistungPage(snapshot, viewOptions(), input.slug)
    if (!page) throw errors.NOT_FOUND()
    return { status, ...page }
  }),

  searchIndex: os.catalog.searchIndex.handler(async ({ errors }) => {
    const { snapshot, status } = await load()
    if (!snapshot) throw errors.CATALOG_UNAVAILABLE()
    return { status, ...buildSearchIndex(snapshot, viewOptions()) }
  }),
}
