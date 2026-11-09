/**
 * Erzeugt den Demo-Snapshot `data/demo-catalog.json` aus den
 * Discovery-Fixtures mit dem echten Mapper. Deterministisch (Stand =
 * jüngstes `updatedAt` der Fixtures), damit sich die Datei nur ändert, wenn
 * sich Fixtures oder Mapper ändern.
 *
 *   pnpm --filter web catalog:demo
 *
 * Wie der Sync blendet der Demo-Snapshot Services ohne Leistung im Kanal
 * aus (Standard von `CATALOG_SHOW_EMPTY_SERVICES`). Für die Variante mit
 * allen Services: `pnpm --filter web catalog:demo --all-services`.
 */
import { writeFile } from "node:fs/promises"
import path from "node:path"

import { fixtureLatestUpdate, loadFixtureRaw } from "@/lib/catalog/__fixtures__"
import { buildSnapshot } from "@/lib/catalog/mapper"
import { leanixModel } from "@/lib/leanix/model"

const FALLBACK_GENERATED_AT = "2026-11-09T13:16:44.782Z"
const target = path.resolve(import.meta.dirname, "../data/demo-catalog.json")

const raw = loadFixtureRaw()
const snapshot = buildSnapshot(raw, {
  kind: "demo",
  baseUrl: "https://ktso.leanix.net",
  workspace: "eamktsoLive",
  rootId: leanixModel.kategorie.rootId,
  showPersons: false,
  showEmptyServices: process.argv.includes("--all-services"),
  generatedAt: fixtureLatestUpdate(raw) ?? FALLBACK_GENERATED_AT,
})

await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8")

const { stats } = snapshot
console.log(
  `Demo-Snapshot geschrieben: ${path.relative(process.cwd(), target)} ` +
    `(${stats.families} Familien, ${stats.services} Services, ` +
    `${stats.leistungen} von ${stats.leistungenInChannel} Leistungen, ` +
    `${stats.issues} Hinweise, Stand ${snapshot.generatedAt})`
)
