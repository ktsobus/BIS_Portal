#!/usr/bin/env node
// Mock der LeanIX-API für Entwicklung und Tests des BITS-Portals.
//
// Bietet den Token-Endpunkt und GraphQL `allFactSheets` (Facettenfilter
// FactSheetTypes, Paging) mit den bereinigten Discovery-Fixtures aus
// apps/web/lib/catalog/__fixtures__. Keine Abhängigkeiten (Node 22+).
//
//   node scripts/mock-leanix.mjs
//   LEANIX_BASE_URL=http://localhost:4600 LEANIX_API_TOKEN=dummy pnpm dev
//
// Umgebungsvariablen:
//   PORT                     Standard 4600 (0 = freier Port)
//   MOCK_EXAMPLE_RESOURCES=1 Beispiel-Ressourcen (Bestellen, ky2help, Webseite …)
//   MOCK_FAIL=1              alle Anfragen mit HTTP 503 beantworten
//   MOCK_CHANNEL_LIMIT=n     nur die ersten n Leistungen (nach Name) im Kanal
//   MOCK_WORKSPACE           Workspace im Access-Token (Standard eamktsoLive)
//   MOCK_PAGE_SIZE           höchstens so viele Einträge pro Seite
//
// Als Modul: `startMockLeanix(options)` startet einen Server und erlaubt,
// die Optionen zur Laufzeit zu ändern (für Integrationstests).

import { readFileSync } from "node:fs"
import { createServer } from "node:http"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../apps/web/lib/catalog/__fixtures__"
)
const CHANNEL_FIELD = "kanal"
const CHANNEL_OPTION = "Business_IT_Servicekatalog"

function loadFixture(name) {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), "utf8")).nodes
}

/** Beispiel-Ressourcen («Weitere Informationen») für einige Leistungen. */
const EXAMPLE_RESOURCES = {
  "eLearning Inhalte publizieren": [
    {
      name: "eLearning zur Publikation anmelden",
      url: "https://example.org/bestellen/elearning-publizieren",
      documentType: "ordering_form",
      description: "Bestellformular für die Publikation auf der Lernplattform",
    },
    {
      name: "Lernplattform",
      url: "https://example.org/lernplattform",
      documentType: "website",
    },
  ],
  "eLearning Bedarf anmelden": [
    {
      name: "",
      url: "https://example.org/ky2help/elearning-bedarf",
      documentType: "ky2help",
    },
    {
      name: "Support-Ticket erfassen",
      url: "https://example.org/support/neu",
      documentType: "support_ticket",
    },
  ],
  "Zugang zur Mitwirkungsplattform beantragen": [
    {
      name: "Zugang beantragen",
      url: "https://example.org/bestellen/mitwirken-zugang",
      documentType: "ordering_form",
    },
    {
      name: "mitwirken.so.ch",
      url: "https://example.org/mitwirken",
      documentType: "website",
    },
  ],
}

function withExampleResources(node) {
  const resources = EXAMPLE_RESOURCES[node.name]
  if (!resources) return node
  return {
    ...node,
    documents: {
      edges: resources.map((resource, i) => ({
        node: {
          id: `mock-doc-${node.id.slice(0, 8)}-${i + 1}`,
          origin: "CUSTOM_LINK",
          description: null,
          ...resource,
        },
      })),
    },
  }
}

function limitChannel(nodes, limit) {
  const inChannel = nodes
    .filter((n) => (n[CHANNEL_FIELD] ?? []).includes(CHANNEL_OPTION))
    .sort((a, b) => a.name.localeCompare(b.name, "de-CH"))
    .slice(limit)
    .map((n) => n.id)
  const drop = new Set(inChannel)
  return nodes.map((n) =>
    drop.has(n.id)
      ? {
          ...n,
          [CHANNEL_FIELD]: (n[CHANNEL_FIELD] ?? []).filter(
            (c) => c !== CHANNEL_OPTION
          ),
        }
      : n
  )
}

function fakeAccessToken(workspace) {
  const part = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return [
    part({ alg: "none", typ: "JWT" }),
    part({
      principal: { permission: { workspaceName: workspace, role: "VIEWER" } },
    }),
    "mock",
  ].join(".")
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString("utf8")
}

/**
 * Startet den Mock. Optionen: { port, exampleResources, fail, channelLimit,
 * workspace, pageSize, log }. Gibt { url, port, options, setOptions, close,
 * requests } zurück.
 */
export async function startMockLeanix(initial = {}) {
  const options = {
    port: 4600,
    exampleResources: false,
    fail: false,
    channelLimit: null,
    workspace: "eamktsoLive",
    pageSize: null,
    log: false,
    ...initial,
  }
  const tokens = new Set()
  const requests = { token: 0, graphql: 0 }
  const fixtures = {
    behoerdenLeistungen: loadFixture("leanix-leistungen.json"),
    Leistungskategorie: loadFixture("leanix-kategorien.json"),
  }

  function nodesFor(type, query) {
    let nodes = fixtures[type] ?? []
    if (type === "behoerdenLeistungen") {
      if (options.exampleResources) nodes = nodes.map(withExampleResources)
      if (options.channelLimit != null)
        nodes = limitChannel(nodes, options.channelLimit)
    }
    // Abonnements nur liefern, wenn sie abgefragt werden (wie LeanIX).
    if (!query.includes("subscriptions")) {
      nodes = nodes.map(({ subscriptions: _subscriptions, ...rest }) => rest)
    }
    return nodes
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost")
      if (options.log)
        console.log(`[mock-leanix] ${req.method} ${url.pathname}`)
      if (options.fail) {
        await readBody(req)
        return sendJson(res, 503, { error: "Service Unavailable (MOCK_FAIL)" })
      }

      if (
        req.method === "POST" &&
        url.pathname === "/services/mtm/v1/oauth2/token"
      ) {
        requests.token++
        const body = await readBody(req)
        const auth = req.headers.authorization ?? ""
        const credentials = auth.startsWith("Basic ")
          ? Buffer.from(auth.slice(6), "base64").toString("utf8")
          : ""
        if (!credentials.startsWith("apitoken:") || credentials.length <= 9) {
          return sendJson(res, 401, { error: "invalid_client" })
        }
        if (!new URLSearchParams(body).get("grant_type")) {
          return sendJson(res, 400, { error: "invalid_request" })
        }
        const accessToken = fakeAccessToken(options.workspace)
        tokens.add(accessToken)
        return sendJson(res, 200, {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3599,
        })
      }

      if (
        req.method === "POST" &&
        url.pathname === "/services/pathfinder/v1/graphql"
      ) {
        requests.graphql++
        const auth = req.headers.authorization ?? ""
        if (!auth.startsWith("Bearer ") || !tokens.has(auth.slice(7))) {
          return sendJson(res, 401, { error: "unauthorized" })
        }
        const { query = "", variables = {} } = JSON.parse(
          (await readBody(req)) || "{}"
        )
        const type = /keys:\s*\[\s*"([^"]+)"/.exec(query)?.[1]
        if (!query.includes("allFactSheets") || !type) {
          return sendJson(res, 200, {
            data: null,
            errors: [
              {
                message:
                  "Mock unterstützt nur allFactSheets mit FactSheetTypes-Filter",
              },
            ],
          })
        }
        const first = Number(/first:\s*(\d+)/.exec(query)?.[1] ?? 100)
        const size = Math.max(1, Math.min(first, options.pageSize ?? first))
        const nodes = nodesFor(type, query)
        const offset = variables.after
          ? Number(
              Buffer.from(String(variables.after), "base64").toString("utf8")
            )
          : 0
        const page = nodes.slice(offset, offset + size)
        const end = offset + page.length
        return sendJson(res, 200, {
          data: {
            allFactSheets: {
              totalCount: nodes.length,
              pageInfo: {
                hasNextPage: end < nodes.length,
                endCursor: Buffer.from(String(end)).toString("base64"),
              },
              edges: page.map((node) => ({ node })),
            },
          },
        })
      }

      sendJson(res, 404, { error: "not found" })
    } catch (error) {
      sendJson(res, 500, { error: String(error?.message ?? error) })
    }
  })

  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(options.port, "127.0.0.1", resolve)
  })
  const port = server.address().port
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    options,
    requests,
    setOptions(patch) {
      Object.assign(options, patch)
    },
    close() {
      return new Promise((resolve) => {
        server.closeAllConnections?.()
        server.close(() => resolve())
      })
    },
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const flag = (name) =>
    ["1", "true", "yes"].includes(String(process.env[name] ?? "").toLowerCase())
  const mock = await startMockLeanix({
    port: Number(process.env.PORT ?? 4600),
    exampleResources: flag("MOCK_EXAMPLE_RESOURCES"),
    fail: flag("MOCK_FAIL"),
    channelLimit: process.env.MOCK_CHANNEL_LIMIT
      ? Number(process.env.MOCK_CHANNEL_LIMIT)
      : null,
    workspace: process.env.MOCK_WORKSPACE || "eamktsoLive",
    pageSize: process.env.MOCK_PAGE_SIZE
      ? Number(process.env.MOCK_PAGE_SIZE)
      : null,
    log: true,
  })
  console.log(
    `Mock-LeanIX läuft auf ${mock.url.replace("127.0.0.1", "localhost")}`
  )
  const options = Object.entries(mock.options)
    .filter(([key]) => key !== "log" && key !== "port")
    .map(([key, value]) => `${key}=${value}`)
    .join(", ")
  console.log(`Optionen: ${options}`)
  const stop = () => mock.close().then(() => process.exit(0))
  process.on("SIGINT", stop)
  process.on("SIGTERM", stop)
}
