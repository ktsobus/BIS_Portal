#!/usr/bin/env node
// LeanIX-Discovery für das BITS-Portal
//
// Liest das Datenmodell und Beispieldaten aus LeanIX aus, damit Typ-, Feld-,
// Relations- und Ressourcentyp-Schlüssel für das Portal festgelegt werden
// können. Das Skript liest nur (GET bzw. GraphQL-Queries) und ändert nichts.
//
// Aufruf (Node 22+, keine Abhängigkeiten):
//
//   LEANIX_API_TOKEN=... node scripts/leanix-discovery.mjs
//
// Optionale Variablen:
//   LEANIX_BASE_URL   Standard: https://ktso.leanix.net
//   SAMPLE_NAME       Standard: "eLearning Inhalte publizieren"
//   CHANNEL_LABEL     Standard: "Business IT-Servicekatalog"
//   OUT_DIR           Standard: ./leanix-discovery
//
// Hinter einem HTTP-Proxy: Node 24 mit NODE_USE_ENV_PROXY=1 und HTTPS_PROXY.
//
// Das Ergebnis landet in OUT_DIR (JSON-Dateien + summary.md). Der API-Token
// und der Access-Token werden nirgends gespeichert oder ausgegeben.
//
// Die reinen Auswertungsfunktionen (Kanal-Optionsschlüssel, Kanal-Treffer)
// sind exportiert und getestet (apps/web/scripts/leanix-discovery.test.ts).

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

const BASE = (process.env.LEANIX_BASE_URL ?? "https://ktso.leanix.net").replace(
  /\/+$/,
  ""
)
const API_TOKEN = process.env.LEANIX_API_TOKEN
const SAMPLE_NAME = process.env.SAMPLE_NAME ?? "eLearning Inhalte publizieren"
const CHANNEL_LABEL = process.env.CHANNEL_LABEL ?? "Business IT-Servicekatalog"
const OUT_DIR = path.resolve(process.env.OUT_DIR ?? "leanix-discovery")
const PAGE_SIZE = 100

const summary = []
const log = (line = "") => {
  console.log(line)
  summary.push(line)
}

async function save(name, data) {
  await writeFile(
    path.join(OUT_DIR, name),
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  )
}

// ---------------------------------------------------------------------------
// Auth

let accessToken

async function authenticate() {
  const res = await fetch(`${BASE}/services/mtm/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`apitoken:${API_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  if (!res.ok)
    throw new Error(
      `Token-Abruf fehlgeschlagen: HTTP ${res.status} ${await res.text()}`
    )
  const body = await res.json()
  accessToken = body.access_token
  // Nur unkritische Claims anzeigen (kein Token).
  try {
    const claims = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")
    )
    const p = claims.principal ?? {}
    log(
      `- Workspace: ${p.permission?.workspaceName ?? "?"} (${p.permission?.workspaceId ?? "?"})`
    )
    log(
      `- Rolle technischer Benutzer: ${p.role ?? "?"} / Workspace-Rolle: ${p.permission?.role ?? "?"}`
    )
    log(`- Access-Token gültig für ${body.expires_in ?? "?"} s`)
  } catch {
    log("- Token-Claims nicht lesbar (kein Problem).")
  }
}

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, json }
}

async function tryGet(file, urlPath) {
  const r = await api("GET", urlPath)
  await save(file, r.ok ? r.json : { error: `HTTP ${r.status}`, body: r.json })
  log(
    `- GET ${urlPath} → HTTP ${r.status}${r.ok ? "" : " (siehe " + file + ")"}`
  )
  return r.ok ? r.json : undefined
}

async function gql(query, variables = {}) {
  const r = await api("POST", "/services/pathfinder/v1/graphql", {
    query,
    variables,
  })
  if (!r.ok)
    throw new Error(
      `GraphQL HTTP ${r.status}: ${JSON.stringify(r.json).slice(0, 500)}`
    )
  return r.json // { data, errors }
}

// ---------------------------------------------------------------------------
// GraphQL-Schema: Abfragen dynamisch aus der Introspection bauen, damit das
// Skript ohne Kenntnis der Typ- und Feldschlüssel funktioniert.

const INTROSPECTION = `
query Introspection {
  __schema {
    types {
      kind name
      interfaces { name }
      fields {
        name
        args { name type { kind name ofType { kind name } } }
        type { kind name ofType { kind name ofType { kind name ofType { kind name } } } }
      }
    }
  }
}`

let typesByName = new Map()
const factSheetTypeNames = new Set()

function unwrap(t) {
  while (t && (t.kind === "NON_NULL" || t.kind === "LIST")) t = t.ofType
  return t
}

function isLeaf(t) {
  const u = unwrap(t)
  return u && (u.kind === "SCALAR" || u.kind === "ENUM")
}

function hasRequiredArgs(field) {
  return (field.args ?? []).some((a) => a.type?.kind === "NON_NULL")
}

const FACT_SHEET_REF = "id name displayName type"
const SKIP_FIELDS = new Set(["permissions", "naFields", "lxExcludeFromQuota"])

// Baut eine Selektion für einen Objekttyp bis zur gegebenen Tiefe. Verweise
// auf andere Fact Sheets werden nur mit id/name/displayName/type selektiert.
function selection(typeName, depth, maxDepth) {
  const type = typesByName.get(typeName)
  if (!type?.fields) return ""
  const parts = []
  for (const f of type.fields) {
    if (SKIP_FIELDS.has(f.name) || hasRequiredArgs(f)) continue
    if (isLeaf(f.type)) {
      parts.push(f.name)
      continue
    }
    const target = unwrap(f.type)
    if (!target || target.kind === "UNION") continue
    if (
      factSheetTypeNames.has(target.name) ||
      target.name === "BaseFactSheet"
    ) {
      parts.push(`${f.name} { ${FACT_SHEET_REF} }`)
      continue
    }
    if (depth >= maxDepth) continue
    const sub = selection(target.name, depth + 1, maxDepth)
    if (sub) parts.push(`${f.name} { ${sub} }`)
  }
  return parts.join(" ")
}

// Typ der Knoten einer Connection (z. B. documents → Document).
function connectionNodeType(typeName, fieldName) {
  const conn = unwrap(
    typesByName.get(typeName)?.fields?.find((f) => f.name === fieldName)?.type
  )
  const edge = unwrap(
    typesByName.get(conn?.name)?.fields?.find((f) => f.name === "edges")?.type
  )
  return unwrap(
    typesByName.get(edge?.name)?.fields?.find((f) => f.name === "node")?.type
  )?.name
}

// Nur skalare Felder + Ressourcen ("Weitere Informationen") eines Fact-Sheet-Typs.
function flatSelection(typeName) {
  const type = typesByName.get(typeName)
  const leafs = type.fields.filter(
    (f) => isLeaf(f.type) && !hasRequiredArgs(f) && !SKIP_FIELDS.has(f.name)
  )
  const docType = connectionNodeType(typeName, "documents")
  const docs = docType ? selection(docType, 0, 1) : ""
  return `${leafs.map((f) => f.name).join(" ")}${docs ? ` documents { edges { node { ${docs} } } }` : ""}`
}

// Optionsschlüssel aus den Fundstellen in den deutschen Übersetzungen.
// GraphQL liefert bei Select-Feldern den Schlüssel, nicht das Label. Ein Pfad
// hat die Form
//   data.dataModel.factSheets.<Typ>.fields.<Feld>.values.<Option>.label
// Der Optionsschlüssel ist das vorletzte Segment (nach «values»), nicht das
// letzte («label»). Pfade anderer Form werden ignoriert.
export function channelOptionCandidates(paths) {
  const seen = new Set()
  const candidates = []
  for (const entry of paths) {
    const segments = entry.split(" = ")[0].split(".")
    if (segments.at(-1) !== "label") continue
    const i = segments.length - 3
    if (i < 0 || segments[i] !== "values") continue
    const option = segments[i + 1]
    const field = segments[i - 2] === "fields" ? segments[i - 1] : null
    const type =
      segments[i - 2] === "fields" && segments[i - 4] === "factSheets"
        ? segments[i - 3]
        : null
    const key = `${type}.${field}.${option}`
    if (!option || seen.has(key)) continue
    seen.add(key)
    candidates.push({ type, field, option })
  }
  return candidates
}

export const formatCandidate = (c) =>
  `${c.type ?? "?"}.${c.field ?? "?"} = ${c.option}`

// Felder eines Fact Sheets (Typ `type`), deren Wert eine der Kanal-Optionen
// enthält (Single- oder Multi-Select). Berücksichtigt werden nur Kandidaten
// für diesen Typ; als Rückfall zählt auch das Label selbst.
export function fieldsWithOption(
  node,
  candidates,
  type = node?.type,
  label = CHANNEL_LABEL
) {
  const hits = []
  const relevant = candidates.filter((c) => !c.type || !type || c.type === type)
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith("rel") || k === "documents") continue
    const values = (Array.isArray(v) ? v : [v]).filter(
      (value) => typeof value === "string"
    )
    for (const value of values) {
      const isOption = relevant.some(
        (c) => (!c.field || c.field === k) && c.option === value
      )
      if (isOption || value.toLowerCase() === label.toLowerCase())
        hits.push(`${k} = ${value}`)
    }
  }
  return hits
}

async function fetchAll(typeName, nodeSelection) {
  const nodes = []
  let after = null
  let totalCount
  for (;;) {
    const q = `query ($after: String) {
      allFactSheets(first: ${PAGE_SIZE}, after: $after,
        filter: { facetFilters: [{ facetKey: "FactSheetTypes", operator: OR, keys: ["${typeName}"] }] }) {
        totalCount
        pageInfo { hasNextPage endCursor }
        edges { node { ... on ${typeName} { ${nodeSelection} } } }
      }
    }`
    const r = await gql(q, { after })
    if (r.errors?.length) {
      if (!r.data?.allFactSheets)
        throw new Error(JSON.stringify(r.errors).slice(0, 800))
      log(
        `  Hinweis: GraphQL meldet Teilfehler für ${typeName}: ${JSON.stringify(r.errors).slice(0, 300)}`
      )
    }
    const page = r.data.allFactSheets
    totalCount = page.totalCount
    nodes.push(...page.edges.map((e) => e.node))
    if (!page.pageInfo.hasNextPage) break
    after = page.pageInfo.endCursor
  }
  return { totalCount, nodes }
}

// Sucht rekursiv alle Pfade, deren Wert (String) den Suchtext enthält.
function findPaths(obj, needle, prefix = "", out = []) {
  if (obj == null) return out
  if (typeof obj === "string") {
    if (obj.toLowerCase().includes(needle.toLowerCase()))
      out.push(`${prefix} = ${JSON.stringify(obj)}`)
    return out
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj))
      findPaths(v, needle, prefix ? `${prefix}.${k}` : k, out)
  }
  return out
}

// ---------------------------------------------------------------------------

async function main() {
  if (!API_TOKEN) {
    console.error(
      "LEANIX_API_TOKEN fehlt (API-Token eines technischen Benutzers, Rolle Viewer genügt)."
    )
    process.exit(1)
  }
  await mkdir(OUT_DIR, { recursive: true })
  log(`# LeanIX-Discovery ${new Date().toISOString()}`)
  log()
  log(`Instanz: ${BASE}`)
  log()
  log("## Zugang")
  await authenticate()
  log()

  log("## Modelle (REST)")
  const dataModel = await tryGet(
    "data-model.json",
    "/services/pathfinder/v1/models/dataModel"
  )
  await tryGet(
    "fact-sheet-resources-model.json",
    "/services/pathfinder/v1/models/factSheetResources"
  )
  await tryGet("view-model.json", "/services/pathfinder/v1/models/viewModel")
  const langDe = await tryGet(
    "language-de.json",
    "/services/pathfinder/v1/models/languages/de"
  )
  await tryGet("meta-model.json", "/services/pathfinder/v1/models/metaModel")
  await tryGet(
    "documents-v2-templates.json",
    "/services/documents/v2/templates?limit=200"
  )
  log()

  // Optionsschlüssel des Kanals über die deutschen Übersetzungen finden
  // (GraphQL liefert bei Select-Feldern den Schlüssel, nicht das Label).
  let channelCandidates = []
  if (langDe) {
    log(`## Fundstellen für «${CHANNEL_LABEL}» in den deutschen Übersetzungen`)
    const paths = findPaths(langDe, CHANNEL_LABEL).slice(0, 30)
    for (const p of paths) log(`- ${p}`)
    channelCandidates = channelOptionCandidates(paths)
    log(
      `- Kandidaten für Optionsschlüssel (Typ.Feld = Option): ${channelCandidates.map(formatCandidate).join(", ") || "keine"}`
    )
    log()
  }
  const channelKeysText =
    channelCandidates.map((c) => c.option).join(", ") || CHANNEL_LABEL

  log("## GraphQL-Schema")
  const schema = await gql(INTROSPECTION)
  if (schema.errors?.length)
    throw new Error(JSON.stringify(schema.errors).slice(0, 800))
  const types = schema.data.__schema.types
  typesByName = new Map(types.map((t) => [t.name, t]))
  for (const t of types) {
    if (
      t.kind === "OBJECT" &&
      (t.interfaces ?? []).some((i) => i.name === "BaseFactSheet")
    )
      factSheetTypeNames.add(t.name)
  }
  await save(
    "graphql-schema-types.json",
    types.filter((t) => !t.name.startsWith("__"))
  )
  log(`- Fact-Sheet-Typen: ${[...factSheetTypeNames].sort().join(", ")}`)
  if (dataModel?.data?.factSheets) {
    log(
      `- Fact-Sheet-Typen laut Data Model: ${Object.keys(dataModel.data.factSheets).sort().join(", ")}`
    )
  }
  log()

  // Beispiel-Leistung suchen
  log(`## Beispiel-Fact-Sheet «${SAMPLE_NAME}»`)
  const search = await gql(
    `query ($q: String) { allFactSheets(first: 10, filter: { fullTextSearch: $q }) { edges { node { id name displayName type } } } }`,
    { q: SAMPLE_NAME }
  )
  const hits = search.data?.allFactSheets?.edges?.map((e) => e.node) ?? []
  await save("sample-search.json", hits)
  const sample = hits.find((h) => h.name === SAMPLE_NAME) ?? hits[0]
  if (!sample) {
    log("- Nicht gefunden. SAMPLE_NAME prüfen.")
  } else {
    log(
      `- Gefunden: ${sample.displayName} (Typ ${sample.type}, id ${sample.id})`
    )
    const leistungType = sample.type

    // Vollständiges Beispiel inkl. Relationen und Ressourcen
    const sampleQuery = (depth) =>
      gql(
        `query ($id: ID!) { factSheet(id: $id) { ... on ${leistungType} { ${selection(leistungType, 0, depth)} } } }`,
        {
          id: sample.id,
        }
      )
    let full = await sampleQuery(4)
    if (!full.data?.factSheet) {
      log(
        `  Hinweis: Abfrage mit Tiefe 4 abgelehnt (${JSON.stringify(full.errors).slice(0, 200)}), versuche Tiefe 3.`
      )
      full = await sampleQuery(3)
    }
    await save("sample-fact-sheet.json", full)
    if (full.errors?.length)
      log(`  Hinweis: Teilfehler: ${JSON.stringify(full.errors).slice(0, 300)}`)
    const fs = full.data?.factSheet ?? {}

    log(`- Felder mit Kanal-Option (${channelKeysText}):`)
    for (const p of fieldsWithOption(fs, channelCandidates, leistungType))
      log(`  - ${p}`)
    log(
      `- Skalare Felder: ${Object.keys(fs)
        .filter((k) => typeof fs[k] !== "object" || Array.isArray(fs[k]))
        .join(", ")}`
    )

    const relations = Object.entries(fs).filter(
      ([k, v]) => k.startsWith("rel") && v?.edges
    )
    log("- Relationen mit Einträgen:")
    for (const [k, v] of relations) {
      if (!v.edges.length) continue
      const targets = v.edges.map(
        (e) => `${e.node?.factSheet?.type}: ${e.node?.factSheet?.displayName}`
      )
      log(`  - ${k} → ${targets.join(" | ")}`)
    }
    const docs = fs.documents?.edges?.map((e) => e.node) ?? []
    log(`- Ressourcen («Weitere Informationen»): ${docs.length}`)
    for (const d of docs)
      log(
        `  - [${d.documentType ?? "?"}] ${d.name} → ${d.url ?? "(Datei)"} (origin ${d.origin ?? "?"})`
      )

    // Documents v2 (Vorlagen-Dokumente) zum Beispiel
    await tryGet(
      "sample-documents-v2.json",
      `/services/documents/v2/documents?factSheetIds=${sample.id}&limit=50`
    )

    // Leistungskategorie-Typ über die Relation ermitteln
    const katRelation = relations.find(([, v]) =>
      v.edges.some((e) =>
        (e.node?.factSheet?.displayName ?? "").includes(CHANNEL_LABEL)
      )
    )
    const kategorieType = katRelation?.[1].edges[0].node.factSheet.type
    log()

    // Alle Leistungen (flach) für die Auswertung
    log(`## Alle Fact Sheets vom Typ ${leistungType}`)
    const leistungen = await fetchAll(
      leistungType,
      `${flatSelection(leistungType)} ${katRelation ? `${katRelation[0]} { edges { node { factSheet { ${FACT_SHEET_REF} } } } }` : ""}`
    )
    await save("all-leistungen.json", leistungen)
    log(`- Anzahl: ${leistungen.totalCount}`)
    const withChannel = leistungen.nodes.filter(
      (n) => fieldsWithOption(n, channelCandidates, leistungType).length > 0
    )
    log(`- Davon im Kanal «${CHANNEL_LABEL}»: ${withChannel.length}`)
    const subtypes = new Map()
    for (const n of withChannel)
      subtypes.set(
        n.category ?? "?",
        (subtypes.get(n.category ?? "?") ?? 0) + 1
      )
    log(
      `- Subtypen im Kanal: ${[...subtypes].map(([k, v]) => `${k} (${v})`).join(", ")}`
    )
    const docTypes = new Map()
    for (const n of leistungen.nodes)
      for (const e of n.documents?.edges ?? [])
        docTypes.set(
          e.node.documentType,
          (docTypes.get(e.node.documentType) ?? 0) + 1
        )
    log(
      `- Verwendete Ressourcentypen: ${[...docTypes].map(([k, v]) => `${k} (${v})`).join(", ") || "keine"}`
    )
    log()

    if (kategorieType) {
      log(`## Leistungskategorien (Typ ${kategorieType})`)
      let kat
      try {
        kat = await fetchAll(kategorieType, selection(kategorieType, 0, 3))
      } catch (err) {
        log(
          `  Hinweis: volle Abfrage abgelehnt (${err.message.slice(0, 200)}), lade nur skalare Felder.`
        )
        kat = await fetchAll(kategorieType, flatSelection(kategorieType))
      }
      await save("all-leistungskategorien.json", kat)
      log(`- Anzahl: ${kat.totalCount}`)
      const tree = kat.nodes
        .filter((n) => (n.displayName ?? "").startsWith(CHANNEL_LABEL))
        .map((n) => `${n.level ?? "?"} | ${n.displayName}`)
        .sort((a, b) => a.split(" | ")[1].localeCompare(b.split(" | ")[1]))
      log(`- Baum unter «${CHANNEL_LABEL}»:`)
      for (const t of tree) log(`  - ${t}`)
    } else {
      log(
        "- Leistungskategorie-Typ nicht über die Beispiel-Relation ermittelbar."
      )
    }
  }

  log()
  log("Fertig. Bitte den Ordner prüfen und weitergeben (enthält keine Tokens).")
  await writeFile(
    path.join(OUT_DIR, "summary.md"),
    summary.join("\n") + "\n",
    "utf8"
  )
  console.log(`\nAusgabe: ${OUT_DIR}`)
}

// Nur als Skript ausführen, nicht beim Import (Tests).
const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  main().catch(async (err) => {
    log()
    log(`FEHLER: ${err.message}`)
    try {
      await writeFile(
        path.join(OUT_DIR, "summary.md"),
        summary.join("\n") + "\n",
        "utf8"
      )
    } catch {}
    process.exit(1)
  })
}
