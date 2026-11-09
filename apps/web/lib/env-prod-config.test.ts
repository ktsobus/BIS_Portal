import { readFileSync } from "node:fs"
import path from "node:path"

import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * Prüft den dokumentierten Produktionsweg (docker-compose.prod.yml mit
 * .env.prod.example): Kommen alle Katalog-Variablen im App-Container an, und
 * besteht das Ergebnis die Prüfung in `lib/env.ts`? Fehlt etwas, läuft die
 * Produktion still im Demo-Modus oder startet nicht (leere Strings bei Zahlen
 * und Enums).
 */

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const read = (file: string) => readFileSync(path.join(repoRoot, file), "utf8")

/** Einfacher dotenv-Parser für die Beispieldateien (KEY=VALUE, "…"). */
function parseEnvFile(text: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const [, key, value] = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim()) ?? []
    if (key === undefined || value === undefined) continue
    values[key] = value.replace(/^"(.*)"$/, "$1")
  }
  return values
}

/** Compose-Interpolation: ${VAR}, ${VAR:-default}, ${VAR:?fehler}. */
function interpolate(value: string, vars: Record<string, string>): string {
  return value.replace(
    /\$\{([A-Z0-9_]+)(?:(:-|:\?)([^}]*))?\}/g,
    (_, name: string, op: string | undefined, arg: string | undefined) => {
      const current = vars[name]
      if (op === ":?" && !current)
        throw new Error(`Pflichtvariable ${name} fehlt: ${arg}`)
      if (op === ":-" && !current) return arg ?? ""
      return current ?? ""
    }
  )
}

/** `environment` des Dienstes `app` aus docker-compose.prod.yml. */
function appEnvironment(compose: string): Record<string, string> {
  const anchors = new Map<string, string>()
  for (const [, name, value] of compose.matchAll(/&([a-z-]+) (\S+)/g))
    if (name && value) anchors.set(name, value)

  const lines = compose.split("\n")
  const start = lines.indexOf("  app:")
  expect(start).toBeGreaterThan(-1)
  const envStart = lines.indexOf("    environment:", start)
  expect(envStart).toBeGreaterThan(start)

  const entries: Record<string, string> = {}
  for (const line of lines.slice(envStart + 1)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue
    const [, key, value] = /^ {6}([A-Z0-9_]+): (.*)$/.exec(line) ?? []
    if (key === undefined || value === undefined) break
    let raw = value.trim()
    if (raw.startsWith("*")) raw = anchors.get(raw.slice(1)) ?? raw
    entries[key] = raw.replace(/^"(.*)"$/, "$1")
  }
  return entries
}

const compose = read("docker-compose.prod.yml")
const prodExample = parseEnvFile(read(".env.prod.example"))
const devExample = parseEnvFile(read("apps/web/.env.example"))

/** Werte aus .env.prod.example plus die Secrets, die dort leer stehen. */
const filledProdValues = {
  ...prodExample,
  POSTGRES_PASSWORD: "pg-secret",
  BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
  LEANIX_API_TOKEN: "token-from-env-prod",
}

function containerEnv(values: Record<string, string>) {
  const env: Record<string, string> = {}
  for (const [key, raw] of Object.entries(appEnvironment(compose)))
    env[key] = interpolate(raw, values)
  return env
}

async function loadEnvModule(values: Record<string, string>) {
  const known = new Set([
    ...Object.keys(devExample),
    ...Object.keys(values),
    "NODE_ENV",
  ])
  for (const key of known) vi.stubEnv(key, values[key])
  vi.resetModules()
  return import("@/lib/env")
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("docker-compose.prod.yml", () => {
  it("gibt alle LEANIX_*- und CATALOG_*-Variablen an den App-Container weiter", () => {
    const passed = Object.keys(appEnvironment(compose))
    const catalogVars = Object.keys(devExample).filter((key) =>
      /^(LEANIX|CATALOG)_/.test(key)
    )
    expect(catalogVars.length).toBeGreaterThan(5)
    for (const key of catalogVars) expect(passed).toContain(key)
    for (const key of catalogVars) expect(prodExample).toHaveProperty(key)
  })

  it("verlangt den LeanIX-Token, statt still in den Demo-Modus zu fallen", () => {
    expect(() =>
      containerEnv({ ...filledProdValues, LEANIX_API_TOKEN: "" })
    ).toThrow(/LEANIX_API_TOKEN/)
  })

  it("ergibt mit .env.prod.example eine gültige Konfiguration im LeanIX-Modus", async () => {
    const env = containerEnv(filledProdValues)
    expect(env.LEANIX_API_TOKEN).toBe("token-from-env-prod")
    expect(env.BETTER_AUTH_URL).toBe(prodExample.APP_URL)

    const mod = await loadEnvModule({ ...env, NODE_ENV: "production" })
    expect(mod.catalogSource).toBe("leanix")
    expect(mod.env.LEANIX_BASE_URL).toBe("https://ktso.leanix.net")
    expect(mod.env.LEANIX_WORKSPACE).toBe("eamktsoLive")
    expect(mod.env.CATALOG_SYNC_INTERVAL_MINUTES).toBe(15)
    expect(mod.env.CATALOG_STALE_AFTER_HOURS).toBe(24)
    expect(mod.env.CATALOG_SHOW_PERSONS).toBe(false)
    expect(mod.env.CATALOG_ROOT_ID).toBeUndefined()
    expect(mod.env.CATALOG_FALLBACK_REQUEST_LABEL).toBe(
      "Anfrage an den Service Desk"
    )
  })

  it("setzt Standardwerte, wenn optionale Katalog-Werte leer sind", async () => {
    const blanked = Object.fromEntries(
      Object.entries(filledProdValues).map(([key, value]) => [
        key,
        /^CATALOG_|^LEANIX_(BASE_URL|WORKSPACE)$/.test(key) ? "" : value,
      ])
    )
    const env = containerEnv(blanked)
    const mod = await loadEnvModule({ ...env, NODE_ENV: "production" })
    expect(mod.catalogSource).toBe("leanix")
    expect(mod.env.CATALOG_MIN_RATIO).toBe(0.5)
    expect(mod.env.CATALOG_SYNC_INTERVAL_MINUTES).toBe(15)
    expect(mod.env.LEANIX_BASE_URL).toBe("https://ktso.leanix.net")
  })
})
