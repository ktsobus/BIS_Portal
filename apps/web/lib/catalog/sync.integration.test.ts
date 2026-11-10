import path from "node:path"

import type { CatalogSnapshot } from "@workspace/api"
import { loadEnvConfig } from "@next/env"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { startMockLeanix } from "../../../../scripts/mock-leanix.mjs"

/**
 * Integrationstest: Sync gegen den LeanIX-Mock und eine echte
 * Postgres-Datenbank. Verwendet eine eigene Testdatenbank
 * (`<DATABASE_URL-Datenbank>_it`, wird angelegt und migriert) oder
 * `CATALOG_IT_DATABASE_URL`. Ohne erreichbares Postgres wird er übersprungen.
 */

interface MockLeanix {
  url: string
  requests: { token: number; graphql: number }
  setOptions(patch: Record<string, unknown>): void
  close(): Promise<void>
}

const appDir = path.resolve(import.meta.dirname, "../..")
loadEnvConfig(appDir)

async function prepareDatabase(): Promise<string | null> {
  const explicit = process.env.CATALOG_IT_DATABASE_URL
  const base = explicit ?? process.env.DATABASE_URL
  if (!base) return null
  const options = { max: 1, connect_timeout: 3, onnotice: () => {} }

  let url = base
  if (!explicit) {
    const parsed = new URL(base)
    const name = `${parsed.pathname.replace(/^\//, "") || "postgres"}_it`
    if (!/^[a-z0-9_]+$/i.test(name)) return null
    const admin = postgres(base, options)
    try {
      const [exists] =
        await admin`select 1 as found from pg_database where datname = ${name}`
      if (!exists) await admin.unsafe(`create database "${name}"`)
    } catch {
      return null
    } finally {
      await admin.end({ timeout: 1 })
    }
    parsed.pathname = `/${name}`
    url = parsed.toString()
  }

  const client = postgres(url, options)
  try {
    await migrate(drizzle(client), {
      migrationsFolder: path.join(appDir, "db/migrations"),
    })
    await client`truncate catalog_sync_run, catalog_snapshot`
    return url
  } catch {
    return null
  } finally {
    await client.end({ timeout: 1 })
  }
}

const databaseUrl = await prepareDatabase()

/** Speicher leeren (wie nach einem Neustart der Instanz). */
function resetStore() {
  delete (globalThis as { __bitsCatalogStore?: unknown }).__bitsCatalogStore
}

describe.skipIf(!databaseUrl)(
  "Katalog-Sync mit Postgres und LeanIX-Mock",
  () => {
    let mock: MockLeanix
    let sync: typeof import("./sync")
    let store: typeof import("./store")
    let database: typeof import("@/db")

    beforeAll(async () => {
      mock = (await startMockLeanix({ port: 0 })) as MockLeanix
      Object.assign(process.env, {
        DATABASE_URL: databaseUrl,
        LEANIX_BASE_URL: mock.url,
        LEANIX_API_TOKEN: "dummy",
        LEANIX_WORKSPACE: "fallback",
        CATALOG_SOURCE: "leanix",
        CATALOG_SHOW_PERSONS: "false",
        CATALOG_SHOW_EMPTY_SERVICES: "false",
        CATALOG_MIN_RATIO: "0.5",
        CATALOG_SHRINK_TOLERANCE: "5",
      })
      process.env.BETTER_AUTH_SECRET ??= "integrationstest-geheimnis-0123456789"
      process.env.BETTER_AUTH_URL ??= "http://localhost:3000"
      // Erst jetzt laden: lib/env.ts liest die Umgebung beim Import.
      database = await import("@/db")
      store = await import("./store")
      sync = await import("./sync")
    })

    afterAll(async () => {
      await mock?.close()
      await database?.db.$client.end({ timeout: 1 })
    })

    async function snapshotRows() {
      return database.db
        .select({
          id: database.schema.catalogSnapshot.id,
          generatedAt: database.schema.catalogSnapshot.generatedAt,
        })
        .from(database.schema.catalogSnapshot)
    }

    /** Speichert einen Snapshot direkt (wie eine andere Instanz). */
    async function insertSnapshot(snapshot: CatalogSnapshot) {
      const [row] = await database.db
        .insert(database.schema.catalogSnapshot)
        .values({
          generatedAt: new Date(snapshot.generatedAt),
          source: snapshot.source.kind,
          stats: snapshot.stats,
          payload: snapshot,
        })
        .returning({ id: database.schema.catalogSnapshot.id })
      return row!.id
    }

    function leistungActions(catalog: CatalogSnapshot | null, name: string) {
      return catalog?.leistungen
        .find((l) => l.name === name)
        ?.actions.map((a) => [a.kind, a.label])
    }

    it("liefert ohne Snapshot keinen Katalog", async () => {
      expect(await store.getCatalog()).toBeNull()
      expect(await store.getCatalogStatus()).toEqual({
        available: false,
        source: null,
        generatedAt: null,
        stale: false,
      })
    })

    it("fragt die DB nach einem leeren Befund erneut ab (andere Instanz)", async () => {
      // Instanz A speichert, während der Speicher dieser Instanz leer ist.
      const { buildSnapshot } = await import("./mapper")
      const { loadFixtureRaw } = await import("./__fixtures__")
      const { leanixModel } = await import("@/lib/leanix/model")
      const snapshot = buildSnapshot(loadFixtureRaw(), {
        kind: "leanix",
        baseUrl: mock.url,
        workspace: "eamktsoLive",
        rootId: leanixModel.kategorie.rootId,
        showPersons: false,
        showEmptyServices: false,
        generatedAt: new Date(Date.now() - 60_000).toISOString(),
      })
      await insertSnapshot(snapshot)

      // Innerhalb der Wartezeit kein erneuter DB-Zugriff …
      expect(await store.getCatalog()).toBeNull()
      // … danach wird der Snapshot übernommen (vorher: nie).
      const now = Date.now()
      const clock = vi
        .spyOn(Date, "now")
        .mockReturnValue(now + store.DB_RETRY_AFTER_MS + 1)
      try {
        expect((await store.getCatalog())?.generatedAt).toBe(
          snapshot.generatedAt
        )
      } finally {
        clock.mockRestore()
      }

      // Der regelmässige Abgleich (Scheduler) übernimmt ihn sofort.
      await database.db.$client`truncate catalog_snapshot cascade`
      resetStore()
      expect(await store.getCatalog()).toBeNull()
      await insertSnapshot(snapshot)
      expect(await store.getCatalog()).toBeNull()
      expect(await store.refreshFromDb()).toBe(true)
      expect((await store.getCatalog())?.generatedAt).toBe(snapshot.generatedAt)

      // Aufräumen für die folgenden Tests.
      await database.db.$client`truncate catalog_sync_run, catalog_snapshot`
      resetStore()
    })

    it("speichert einen Snapshot und aktualisiert den Speicher", async () => {
      const run = await sync.runSync("startup")
      expect(run).toMatchObject({ trigger: "startup", status: "success" })
      // Standard: nur Services mit Leistung im Kanal.
      expect(run.stats).toMatchObject({
        families: 2,
        services: 3,
        leistungen: 7,
        actions: 0,
      })
      expect(run.durationMs).toBeGreaterThanOrEqual(0)

      const rows = await snapshotRows()
      expect(rows).toHaveLength(1)

      const catalog = await store.getCatalog()
      expect(catalog?.source).toEqual({
        kind: "leanix",
        baseUrl: mock.url,
        workspace: "eamktsoLive",
      })
      expect(catalog?.leistungen).toHaveLength(7)
      expect(await store.getCatalogStatus()).toMatchObject({
        available: true,
        source: "leanix",
        stale: false,
      })
      // Ohne CATALOG_SHOW_PERSONS keine Personen.
      expect(catalog?.leistungen.every((l) => l.persons.length === 0)).toBe(
        true
      )
    })

    it("führt bei unverändertem Inhalt nur den Stand nach", async () => {
      const before = (await snapshotRows())[0]!
      const run = await sync.runSync("schedule")
      expect(run.status).toBe("success")
      const rows = await snapshotRows()
      expect(rows).toHaveLength(1)
      expect(rows[0]!.id).toBe(before.id)
      expect(rows[0]!.generatedAt.getTime()).toBeGreaterThan(
        before.generatedAt.getTime()
      )
      const runs = await store.listSyncRuns()
      expect(runs[0]?.id).toBe(run.id)
    })

    it("legt bei Änderungen einen neuen Snapshot an", async () => {
      mock.setOptions({ exampleResources: true })
      const run = await sync.runSync("manual")
      expect(run.status).toBe("success")
      expect(run.stats?.actions).toBe(4)
      expect(await snapshotRows()).toHaveLength(2)

      const catalog = await store.getCatalog()
      const leistung = catalog?.leistungen.find(
        (l) => l.name === "eLearning Inhalte publizieren"
      )
      expect(leistung?.actions.map((a) => a.kind)).toEqual(["order"])
      expect(leistung?.links.map((a) => a.url)).toEqual([
        "https://example.org/lernplattform",
      ])
    })

    it("übernimmt keinen Stand mit Teilfehlern auf Ressourcen", async () => {
      const before = await store.getCatalog()
      mock.setOptions({ documentsError: true })
      const run = await sync.runSync("manual")
      mock.setOptions({ documentsError: false })

      expect(run.status).toBe("failed")
      expect(run.message).toContain("Leistungen: LeanIX meldet Teilfehler")
      expect(run.message).toContain("Access denied")
      expect(await snapshotRows()).toHaveLength(2)
      const after = await store.getCatalog()
      expect(after?.generatedAt).toBe(before?.generatedAt)
      // Bestellwege bleiben erhalten.
      expect(leistungActions(after, "eLearning Inhalte publizieren")).toEqual([
        ["order", "eLearning zur Publikation anmelden"],
      ])
    })

    it("übernimmt keinen Stand aus unvollständigem Paging", async () => {
      const before = await store.getCatalog()
      mock.setOptions({ truncateAt: 14 })
      const run = await sync.runSync("schedule")
      mock.setOptions({ truncateAt: null })

      expect(run.status).toBe("failed")
      expect(run.message).toContain("nur 14 von 18 Einträgen geladen")
      expect(await snapshotRows()).toHaveLength(2)
      expect((await store.getCatalog())?.generatedAt).toBe(before?.generatedAt)
    })

    it("protokolliert Fehler und behält den alten Snapshot", async () => {
      const before = await store.getCatalog()
      mock.setOptions({ fail: true })
      const run = await sync.runSync("schedule")
      mock.setOptions({ fail: false })

      expect(run.status).toBe("failed")
      expect(run.message).toContain("HTTP 503")
      expect(run.message).not.toContain("dummy")
      expect(run.stats).toBeNull()
      expect(await snapshotRows()).toHaveLength(2)
      expect((await store.getCatalog())?.generatedAt).toBe(before?.generatedAt)
    })

    it("lehnt einen stark geschrumpften Snapshot ab", async () => {
      const before = await store.getCatalog()
      mock.setOptions({ channelLimit: 1 })
      const run = await sync.runSync("manual")
      mock.setOptions({ channelLimit: null })

      expect(run.status).toBe("rejected")
      expect(run.message).toContain("nur 1 statt bisher 7 Leistungen")
      // Welche Leistungen fehlen würden, steht in der Meldung.
      expect(run.message).toContain(
        "Nicht mehr enthalten: «eLearning Bedarf anmelden»"
      )
      expect(run.stats?.leistungen).toBe(1)
      expect(await snapshotRows()).toHaveLength(2)
      expect((await store.getCatalog())?.generatedAt).toBe(before?.generatedAt)
    })

    it("verhindert gleichzeitige Läufe im Prozess", async () => {
      const first = sync.runSync("manual")
      expect(sync.isSyncRunning()).toBe(true)
      await expect(sync.runSync("manual")).rejects.toBeInstanceOf(
        sync.SyncBusyError
      )
      expect((await first).status).toBe("success")
      expect(sync.isSyncRunning()).toBe(false)
    })

    it("startet «Jetzt synchronisieren» im Hintergrund", async () => {
      mock.setOptions({ delayMs: 400 })
      try {
        const started = Date.now()
        const run = await sync.startSync("manual")
        expect(Date.now() - started).toBeLessThan(400)
        expect(run).toMatchObject({ trigger: "manual", status: "running" })
        expect(sync.isSyncRunning()).toBe(true)
        await expect(sync.startSync("manual")).rejects.toBeInstanceOf(
          sync.SyncBusyError
        )
        await vi.waitFor(() => expect(sync.isSyncRunning()).toBe(false), {
          timeout: 10_000,
        })
        const finished = (await store.listSyncRuns()).find(
          (r) => r.id === run.id
        )
        expect(finished?.status).toBe("success")
      } finally {
        mock.setOptions({ delayMs: 0 })
      }
    })

    it("respektiert das Advisory-Lock einer anderen Instanz", async () => {
      const other = postgres(databaseUrl!, { max: 1, onnotice: () => {} })
      try {
        await other`select pg_advisory_lock(hashtext('bits-portal.catalog-sync'))`
        await expect(sync.runSync("schedule")).rejects.toThrow(
          /anderen Instanz/
        )
        expect(sync.isSyncRunning()).toBe(false)
      } finally {
        await other.end({ timeout: 1 })
      }
      // Nach dem Freigeben läuft der Sync wieder.
      expect((await sync.runSync("schedule")).status).toBe("success")
    })

    it("schliesst verwaiste Läufe ab", async () => {
      const [orphan] = await database.db
        .insert(database.schema.catalogSyncRun)
        .values({ trigger: "schedule", status: "running" })
        .returning()
      await sync.runSync("manual")
      const runs = await store.listSyncRuns(50)
      const updated = runs.find((r) => r.id === orphan!.id)
      expect(updated?.status).toBe("failed")
      expect(updated?.message).toContain("nicht abgeschlossen")
      expect(runs.every((r) => r.status !== "running")).toBe(true)
    })

    it("schliesst verwaiste Läufe ohne Sync ab, wenn kein Lock gehalten wird", async () => {
      const [orphan] = await database.db
        .insert(database.schema.catalogSyncRun)
        .values({ trigger: "manual", status: "running" })
        .returning()

      // Hält eine andere Instanz das Lock, läuft dort ein Sync: nichts tun.
      const other = postgres(databaseUrl!, { max: 1, onnotice: () => {} })
      try {
        await other`select pg_advisory_lock(hashtext('bits-portal.catalog-sync'))`
        expect(await sync.failOrphanedRuns()).toBe(0)
      } finally {
        await other.end({ timeout: 1 })
      }
      expect(
        (await store.listSyncRuns(50)).find((r) => r.id === orphan!.id)?.status
      ).toBe("running")

      // Lock frei: Der Eintrag ist verwaist und wird abgeschlossen.
      expect(await sync.failOrphanedRuns()).toBe(1)
      const updated = (await store.listSyncRuns(50)).find(
        (r) => r.id === orphan!.id
      )
      expect(updated?.status).toBe("failed")
    })

    it("übernimmt einen Snapshot, den eine andere Instanz gespeichert hat", async () => {
      const current = (await store.getCatalog())!
      const newer: CatalogSnapshot = {
        ...current,
        generatedAt: new Date(Date.now() + 1_000).toISOString(),
        leistungen: current.leistungen.slice(0, 6),
        stats: { ...current.stats, leistungen: 6 },
      }
      await insertSnapshot(newer)
      // Ohne Abgleich zeigt diese Instanz noch den eigenen Stand.
      expect((await store.getCatalog())?.leistungen).toHaveLength(7)
      expect(await store.refreshFromDb()).toBe(true)
      expect((await store.getCatalog())?.generatedAt).toBe(newer.generatedAt)
      expect((await store.getCatalog())?.leistungen).toHaveLength(6)
      // Unverändert: kein erneutes Laden.
      expect(await store.refreshFromDb()).toBe(false)

      // Wieder auf den vollständigen Stand bringen.
      expect((await sync.runSync("manual")).status).toBe("success")
      expect((await store.getCatalog())?.leistungen).toHaveLength(7)
    })

    it("vergleicht nach einer Schemaänderung mit den gespeicherten Kennzahlen", async () => {
      const client = database.db.$client
      // Neueste Zeile passt nicht mehr zum Schema (z. B. nach einem Upgrade).
      await client`
        update catalog_snapshot
        set payload = jsonb_set(payload, '{schemaVersion}', '0'::jsonb)
        where id = (select id from catalog_snapshot order by created_at desc limit 1)`
      // Der Schrumpf-Schutz greift trotzdem (stats.leistungen = 7).
      mock.setOptions({ channelLimit: 1 })
      const run = await sync.runSync("manual")
      mock.setOptions({ channelLimit: null })
      expect(run.status).toBe("rejected")
      expect(run.message).toContain("nur 1 statt bisher 7 Leistungen")

      // Nach einem Neustart wird der nächstältere gültige Stand geladen.
      resetStore()
      const fallback = await store.getCatalog()
      expect(fallback?.leistungen.length).toBeGreaterThan(0)

      // Sind alle Zeilen unlesbar, ist der Katalog nicht verfügbar; der
      // Admin-Bereich erkennt das an der Anzahl gespeicherter Zeilen.
      await client`
        update catalog_snapshot
        set payload = jsonb_set(payload, '{schemaVersion}', '0'::jsonb)`
      resetStore()
      expect(await store.getCatalog()).toBeNull()
      expect(await store.countStoredSnapshots()).toBeGreaterThan(0)

      // Der nächste Sync ersetzt den Stand.
      expect((await sync.runSync("manual")).status).toBe("success")
      expect((await store.getCatalog())?.leistungen).toHaveLength(7)
    })

    it("entfernt Personen aus gespeicherten Snapshots, wenn sie ausgeschaltet sind", async () => {
      const current = (await store.getCatalog())!
      const withPersons: CatalogSnapshot = {
        ...current,
        generatedAt: new Date(Date.now() - 1_000).toISOString(),
        leistungen: current.leistungen.map((l, i) =>
          i === 0
            ? { ...l, persons: [{ name: "Geheime Person", role: "x" }] }
            : l
        ),
        services: current.services.map((s, i) =>
          i === 0
            ? { ...s, persons: [{ name: "Geheime Person", role: null }] }
            : s
        ),
      }
      await insertSnapshot(withPersons)

      expect((await sync.runSync("schedule")).status).toBe("success")
      const rows = await database.db.$client<{ found: boolean }[]>`
        select bool_or(payload::text like '%Geheime Person%') as found
        from catalog_snapshot`
      expect(rows[0]?.found).toBe(false)
      expect(await sync.purgeStoredPersonsIfDisabled()).toBe(0)
    })

    it("lädt den Snapshot nach einem Neustart aus der Datenbank", async () => {
      const expected = await store.getCatalog()
      // Neustart simulieren: Speicher leeren.
      resetStore()
      const reloaded = await store.getCatalog()
      expect(reloaded?.generatedAt).toBe(expected?.generatedAt)
      expect(reloaded?.leistungen).toHaveLength(7)
    })
  }
)
