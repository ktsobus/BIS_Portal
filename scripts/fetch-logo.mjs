#!/usr/bin/env node
// Logo «KANTON solothurn» für das BITS-Portal beschaffen
//
// Der Kanton Solothurn bietet für sein Logo weder eine API noch eine
// Download-Datei an. Die offizielle Website so.ch bettet das Logo (Wappen +
// Schriftzug, farbige Variante) als Inline-SVG im Seitenkopf ein
// (<svg id="logo" …>). Dieses Skript lädt die Startseite per HTTP-GET,
// schneidet das SVG unverändert aus, prüft es und schreibt es nach
// apps/web/public/brand/kanton-solothurn-logo.svg.
//
// Das Logo wird nicht verändert, nicht nachgezeichnet und nicht umgefärbt.
// Eine Negativ-Variante («negativ weiss heraldisch») ist online nicht
// verfügbar und wird bewusst nicht aus der farbigen Datei abgeleitet. Für den
// Produktivbetrieb sind die Originaldateien beim Kompetenzzentrum für
// Publikationsmedien zu beziehen (siehe docs/branding.md).
//
// Aufruf (Node 22+, keine Abhängigkeiten):
//
//   node scripts/fetch-logo.mjs           Logo laden, prüfen und schreiben
//   node scripts/fetch-logo.mjs --check   Nur prüfen, ob die abgelegte Datei
//                                         noch der Quelle entspricht (Exit 1,
//                                         wenn nicht)
//
// Optionale Variablen:
//   LOGO_SOURCE_URL   Standard: https://so.ch/
//
// Hinter einem HTTP-Proxy: Node 24 mit NODE_USE_ENV_PROXY=1 und HTTPS_PROXY.

import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const SOURCE_URL = process.env.LOGO_SOURCE_URL ?? "https://so.ch/"
const CHECK_ONLY = process.argv.includes("--check")

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const TARGET = path.join(
  ROOT,
  "apps/web/public/brand/kanton-solothurn-logo.svg"
)

// Stand der abgelegten Datei (Abruf 9.11.2026). Weicht die Quelle davon ab,
// hat der Kanton das Logo bzw. dessen Markup geändert: Ergebnis visuell prüfen
// und docs/branding.md nachführen.
const KNOWN_SHA256 =
  "f504a91d5818cdcc1a3e01c63baf44e5fc1544eba90494aaae87c4734d81033f"

// Erwartete Eigenschaften des Logos. Ändert sich eine davon, bricht das Skript
// ab, statt stillschweigend eine andere Grafik abzulegen.
const EXPECTED_VIEWBOX = "0 0 171.086 15.742"
const EXPECTED_FILLS = ["#1d1d1b", "#e01f26", "#fff"] // Schrift, Wappen-Rot, Wappen-Weiss
const ALLOWED_ELEMENTS = new Set(["svg", "g", "path"])
const ALLOWED_ATTRIBUTES = new Set(["xmlns", "id", "viewBox", "d", "fill"])
const MAX_HTML_BYTES = 5 * 1024 * 1024
const MIN_SVG_BYTES = 1024
const MAX_SVG_BYTES = 50 * 1024

const fail = (message) => {
  console.error(`Fehler: ${message}`)
  process.exit(1)
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex")

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "BITS-Portal fetch-logo (Kanton Solothurn, AIO)",
      accept: "text/html",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) fail(`${url} antwortet mit HTTP ${res.status}.`)
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().startsWith("text/html")) {
    fail(`${url} liefert «${contentType}» statt text/html.`)
  }
  const declared = Number(res.headers.get("content-length") ?? 0)
  if (declared > MAX_HTML_BYTES) fail(`Antwort zu gross (${declared} Bytes).`)
  const html = await res.text()
  if (Buffer.byteLength(html) > MAX_HTML_BYTES) {
    fail(`Antwort zu gross (${Buffer.byteLength(html)} Bytes).`)
  }
  return { html, finalUrl: res.url }
}

function extractLogo(html) {
  const matches = [
    ...html.matchAll(/<svg\b[^>]*\bid="logo"[^>]*>[\s\S]*?<\/svg>/g),
  ]
  if (matches.length !== 1) {
    fail(
      `Erwartet genau ein <svg id="logo"> im Seitenkopf, gefunden: ${matches.length}.`
    )
  }
  return matches[0][0]
}

function validateLogo(svg) {
  const bytes = Buffer.byteLength(svg)
  if (bytes < MIN_SVG_BYTES || bytes > MAX_SVG_BYTES) {
    fail(
      `SVG-Grösse ${bytes} Bytes ausserhalb ${MIN_SVG_BYTES}–${MAX_SVG_BYTES}.`
    )
  }
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    fail("SVG ohne SVG-Namensraum.")
  }
  const viewBox = svg.match(/\bviewBox="([^"]+)"/)?.[1]
  if (viewBox !== EXPECTED_VIEWBOX) {
    fail(
      `viewBox «${viewBox}» statt «${EXPECTED_VIEWBOX}»: Logo hat sich geändert, bitte prüfen.`
    )
  }
  // Nur einfache Formen zulassen (kein Script, keine Verweise, keine Entities),
  // da die Datei vom Portal unter der eigenen Origin ausgeliefert wird.
  for (const [, name] of svg.matchAll(/<\/?([A-Za-z][\w:.-]*)/g)) {
    if (!ALLOWED_ELEMENTS.has(name)) fail(`Unerwartetes Element <${name}>.`)
  }
  for (const [, name] of svg.matchAll(/\s([A-Za-z_:][\w:.-]*)\s*=/g)) {
    if (!ALLOWED_ATTRIBUTES.has(name)) fail(`Unerwartetes Attribut «${name}».`)
  }
  if (/<!|<\?|javascript:|url\(/i.test(svg)) {
    fail("SVG enthält Deklarationen, Verarbeitungsanweisungen oder Verweise.")
  }
  const fills = [
    ...new Set([...svg.matchAll(/\bfill="([^"]+)"/g)].map((m) => m[1])),
  ]
  const unexpected = fills.filter((f) => !EXPECTED_FILLS.includes(f))
  const missing = EXPECTED_FILLS.filter((f) => !fills.includes(f))
  if (unexpected.length || missing.length) {
    fail(
      `Farben weichen ab (unerwartet: ${unexpected.join(", ") || "–"}; fehlend: ${missing.join(", ") || "–"}).`
    )
  }
  return { bytes, paths: svg.match(/<path\b/g)?.length ?? 0 }
}

const { html, finalUrl } = await fetchHtml(SOURCE_URL)
const svg = `${extractLogo(html)}\n`
const { bytes, paths } = validateLogo(svg)
const hash = sha256(svg)

console.log(`Quelle:  ${finalUrl}`)
console.log(
  `Logo:    ${bytes} Bytes, ${paths} Pfade, viewBox ${EXPECTED_VIEWBOX}`
)
console.log(`SHA-256: ${hash}`)
if (hash !== KNOWN_SHA256) {
  console.warn(
    "Hinweis: Das Logo auf der Quelle weicht vom bekannten Stand ab. Ergebnis visuell prüfen und KNOWN_SHA256 sowie docs/branding.md nachführen."
  )
}

if (CHECK_ONLY) {
  const current = await readFile(TARGET, "utf8").catch(() => null)
  if (current === svg) {
    console.log(`OK: ${path.relative(ROOT, TARGET)} entspricht der Quelle.`)
  } else {
    console.error(
      `Abweichung: ${path.relative(ROOT, TARGET)} ${current === null ? "fehlt" : "entspricht nicht der Quelle"}.`
    )
    process.exit(1)
  }
} else {
  await mkdir(path.dirname(TARGET), { recursive: true })
  await writeFile(TARGET, svg)
  console.log(`Geschrieben: ${path.relative(ROOT, TARGET)}`)
}

console.log(
  "Negativ-Variante: online nicht verfügbar – beim Kompetenzzentrum für Publikationsmedien beziehen."
)
