import { readFileSync } from "node:fs"
import path from "node:path"
import { parseEnv } from "node:util"

import { describe, expect, it } from "vitest"

import {
  parseServerEnv,
  resolveCatalogSource,
  withoutEmptyValues,
} from "./env-schema"

const appDir = path.resolve(import.meta.dirname, "..")

/** `.env.example` so, wie `@next/env` bzw. dotenv sie liest. */
function exampleEnv(): Record<string, string | undefined> {
  return parseEnv(readFileSync(path.join(appDir, ".env.example"), "utf8"))
}

const required = {
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/app",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
}

describe("Umgebungsvariablen", () => {
  it("akzeptiert die Vorlage .env.example unverändert", () => {
    const env = parseServerEnv(exampleEnv())
    expect(env.CATALOG_SOURCE).toBeUndefined()
    expect(env.CATALOG_FALLBACK_REQUEST_URL).toBeUndefined()
    expect(env.LEANIX_API_TOKEN).toBeUndefined()
    expect(env).toMatchObject({
      CATALOG_SYNC_INTERVAL_MINUTES: 15,
      CATALOG_MIN_RATIO: 0.5,
      CATALOG_SHRINK_TOLERANCE: 5,
      CATALOG_STALE_AFTER_HOURS: 24,
      CATALOG_SHOW_PERSONS: false,
      CATALOG_SHOW_EMPTY_SERVICES: false,
      CATALOG_HTTP_ALLOWED_HOSTS: [],
      CATALOG_FALLBACK_REQUEST_LABEL: "Anfrage an den Service Desk",
      SMTP_PORT: 1025,
    })
    expect(resolveCatalogSource(env)).toBe("demo")
  })

  it("behandelt leere Werte wie nicht gesetzt (z. B. ${VAR:-} in Compose)", () => {
    const keys = Object.keys(exampleEnv())
    const empty = Object.fromEntries(keys.map((key) => [key, ""]))
    const env = parseServerEnv({ ...empty, ...required, SMTP_PORT: "  " })
    expect(env.CATALOG_SOURCE).toBeUndefined()
    expect(env).toMatchObject({
      CATALOG_SYNC_INTERVAL_MINUTES: 15,
      CATALOG_MIN_RATIO: 0.5,
      CATALOG_STALE_AFTER_HOURS: 24,
      CATALOG_SHOW_PERSONS: false,
      CATALOG_SHOW_EMPTY_SERVICES: false,
      CATALOG_FALLBACK_REQUEST_LABEL: "Anfrage an den Service Desk",
      LEANIX_BASE_URL: "https://ktso.leanix.net",
      LEANIX_WORKSPACE: "eamktsoLive",
      SMTP_PORT: 1025,
    })
  })

  it("liest Schalter und Host-Listen", () => {
    const env = parseServerEnv({
      ...required,
      CATALOG_SOURCE: "leanix",
      CATALOG_SHOW_PERSONS: " TRUE ",
      CATALOG_SHOW_EMPTY_SERVICES: "true",
      CATALOG_HTTP_ALLOWED_HOSTS: " Intranet.so.ch, ,alt.so.ch ",
    })
    expect(env.CATALOG_SHOW_PERSONS).toBe(true)
    expect(env.CATALOG_SHOW_EMPTY_SERVICES).toBe(true)
    expect(env.CATALOG_HTTP_ALLOWED_HOSTS).toEqual([
      "intranet.so.ch",
      "alt.so.ch",
    ])
    expect(resolveCatalogSource(env)).toBe("leanix")
  })

  it("lehnt echte Fehlwerte weiterhin ab", () => {
    expect(() =>
      parseServerEnv({ ...required, CATALOG_SOURCE: "leanx" })
    ).toThrow()
    expect(() =>
      parseServerEnv({ ...required, CATALOG_SYNC_INTERVAL_MINUTES: "0" })
    ).toThrow()
    expect(() =>
      parseServerEnv({ ...required, CATALOG_SHOW_PERSONS: "ja" })
    ).toThrow()
  })

  it("entfernt nur leere Einträge", () => {
    expect(
      withoutEmptyValues({ A: "", B: " ", C: "0", D: undefined, E: "x" })
    ).toEqual({ C: "0", E: "x" })
  })
})
