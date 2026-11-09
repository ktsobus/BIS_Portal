import { describe, expect, it, vi } from "vitest"

import {
  createLeanixClient,
  LeanixError,
  workspaceFromAccessToken,
  type LeanixClientOptions,
} from "./client"

const BASE = "https://leanix.test"
const API_TOKEN = "geheimer-api-token-123"

function jwt(claims: object) {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url")
  return `${part({ alg: "none" })}.${part(claims)}.signatur`
}

const ACCESS_TOKEN = jwt({
  principal: { permission: { workspaceName: "eamktsoLive" } },
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const tokenResponse = (accessToken = ACCESS_TOKEN, expiresIn = 3600) =>
  json({
    access_token: accessToken,
    token_type: "bearer",
    expires_in: expiresIn,
  })

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>

/** fetch-Mock, der Token- und GraphQL-Aufrufe getrennt beantwortet. */
function mockFetch(handlers: { token?: Handler[]; graphql?: Handler[] }) {
  const calls = { token: 0, graphql: 0, urls: [] as string[] }
  const next = (list: Handler[] | undefined, index: number): Handler => {
    const handler = list?.[Math.min(index, (list?.length ?? 1) - 1)]
    if (!handler) throw new Error("kein Handler")
    return handler
  }
  const fetch = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      calls.urls.push(url)
      if (url.endsWith("/services/mtm/v1/oauth2/token")) {
        return next(handlers.token ?? [() => tokenResponse()], calls.token++)(
          url,
          init ?? {}
        )
      }
      return next(handlers.graphql, calls.graphql++)(url, init ?? {})
    }
  )
  return {
    fetch: fetch as unknown as typeof globalThis.fetch,
    calls,
    mock: fetch,
  }
}

function client(
  fetch: typeof globalThis.fetch,
  overrides: Partial<LeanixClientOptions> = {}
) {
  return createLeanixClient({
    baseUrl: `${BASE}/`,
    apiToken: API_TOKEN,
    workspace: "fallback",
    fetch,
    sleep: async () => {},
    ...overrides,
  })
}

const ok = () => json({ data: { allFactSheets: { totalCount: 0 } } })

describe("LeanixClient", () => {
  it("holt den Token mit Basic-Auth und fragt GraphQL mit Bearer ab", async () => {
    const { fetch, mock } = mockFetch({ graphql: [ok] })
    const result = await client(fetch).graphql("query { x }", { after: null })
    expect(result.data).toEqual({ allFactSheets: { totalCount: 0 } })
    expect(result.errors).toEqual([])

    const [tokenUrl, tokenInit] = mock.mock.calls[0]!
    expect(tokenUrl).toBe(`${BASE}/services/mtm/v1/oauth2/token`)
    expect(tokenInit?.method).toBe("POST")
    expect((tokenInit?.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from(`apitoken:${API_TOKEN}`).toString("base64")}`
    )
    expect(tokenInit?.body).toBe("grant_type=client_credentials")

    const [gqlUrl, gqlInit] = mock.mock.calls[1]!
    expect(gqlUrl).toBe(`${BASE}/services/pathfinder/v1/graphql`)
    expect((gqlInit?.headers as Record<string, string>).Authorization).toBe(
      `Bearer ${ACCESS_TOKEN}`
    )
    expect(JSON.parse(String(gqlInit?.body))).toEqual({
      query: "query { x }",
      variables: { after: null },
    })
    expect(gqlInit?.signal).toBeInstanceOf(AbortSignal)
  })

  it("speichert den Access-Token bis kurz vor Ablauf", async () => {
    let now = 1_000_000
    const { fetch, calls } = mockFetch({
      token: [() => tokenResponse(ACCESS_TOKEN, 3600)],
      graphql: [ok],
    })
    const c = client(fetch, { now: () => now })
    await c.graphql("q")
    await c.graphql("q")
    expect(calls.token).toBe(1)

    // 60 s Reserve: nach 3540 s wird erneuert.
    now += 3_539_000
    await c.graphql("q")
    expect(calls.token).toBe(1)
    now += 2_000
    await c.graphql("q")
    expect(calls.token).toBe(2)
    expect(calls.graphql).toBe(4)
  })

  it("holt bei HTTP 401 einmal einen neuen Token", async () => {
    const { fetch, calls } = mockFetch({
      graphql: [() => json({ message: "expired" }, 401), ok],
    })
    const result = await client(fetch).graphql("q")
    expect(result.data).toBeTruthy()
    expect(calls.token).toBe(2)
    expect(calls.graphql).toBe(2)
  })

  it("gibt nach zweimal 401 auf", async () => {
    const { fetch, calls } = mockFetch({
      graphql: [() => json({ message: "nope" }, 401)],
    })
    const error = await client(fetch)
      .graphql("q")
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(LeanixError)
    expect((error as LeanixError).kind).toBe("auth")
    expect((error as LeanixError).status).toBe(401)
    expect(calls.token).toBe(2)
  })

  it("wiederholt bei 5xx und Netzwerkfehlern mit Backoff", async () => {
    const sleep = vi.fn(async (_ms: number) => {})
    const { fetch, calls } = mockFetch({
      graphql: [
        () => new Response("down", { status: 503 }),
        () => {
          throw new TypeError("fetch failed")
        },
        ok,
      ],
    })
    const result = await client(fetch, { sleep, retryDelayMs: 100 }).graphql(
      "q"
    )
    expect(result.data).toBeTruthy()
    expect(calls.graphql).toBe(3)
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200])
  })

  it("wirft nach erschöpften Wiederholungen", async () => {
    const { fetch, calls } = mockFetch({
      graphql: [() => new Response("Service Unavailable", { status: 503 })],
    })
    const error = await client(fetch)
      .graphql("q")
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(LeanixError)
    expect((error as LeanixError).kind).toBe("http")
    expect((error as LeanixError).status).toBe(503)
    expect(calls.graphql).toBe(3)
  })

  it("meldet Zeitüberschreitungen", async () => {
    const { fetch } = mockFetch({
      graphql: [
        () => {
          throw new DOMException("timeout", "TimeoutError")
        },
      ],
    })
    const error = await client(fetch, { timeoutMs: 30_000 })
      .graphql("q")
      .catch((e: unknown) => e)
    expect((error as LeanixError).kind).toBe("timeout")
    expect((error as LeanixError).message).toContain("30 s")
  })

  it("wiederholt Client-Fehler nicht", async () => {
    const { fetch, calls } = mockFetch({
      graphql: [() => new Response("bad", { status: 400 })],
    })
    await expect(client(fetch).graphql("q")).rejects.toThrow(/HTTP 400/)
    expect(calls.graphql).toBe(1)
  })

  it("toleriert GraphQL-Teilfehler und meldet sie", async () => {
    const { fetch } = mockFetch({
      graphql: [
        () =>
          json({
            data: { allFactSheets: { totalCount: 1 } },
            errors: [{ message: "No permission: ace:read_acl", path: ["x"] }],
          }),
      ],
    })
    const result = await client(fetch).graphql("q")
    expect(result.data).toEqual({ allFactSheets: { totalCount: 1 } })
    expect(result.errors).toEqual([
      { message: "No permission: ace:read_acl", path: ["x"] },
    ])
  })

  it("wirft bei GraphQL-Fehlern ohne Daten", async () => {
    const { fetch } = mockFetch({
      graphql: [() => json({ data: null, errors: [{ message: "Syntax" }] })],
    })
    await expect(client(fetch).graphql("q")).rejects.toMatchObject({
      kind: "graphql",
      message: expect.stringContaining("Syntax"),
    })
  })

  it("nimmt Token nie in Fehlermeldungen auf", async () => {
    const { fetch: tokenFails } = mockFetch({
      token: [() => new Response(`invalid ${API_TOKEN}`, { status: 401 })],
    })
    const tokenError = (await client(tokenFails)
      .graphql("q")
      .catch((e: unknown) => e)) as LeanixError
    expect(tokenError.kind).toBe("auth")
    expect(tokenError.message).not.toContain(API_TOKEN)

    const { fetch: echo } = mockFetch({
      graphql: [
        () => new Response(`Bearer ${ACCESS_TOKEN} abgelehnt`, { status: 400 }),
      ],
    })
    const echoError = (await client(echo)
      .graphql("q")
      .catch((e: unknown) => e)) as LeanixError
    expect(echoError.message).not.toContain(ACCESS_TOKEN)
    expect(echoError.message).toContain("***")
  })

  it("liest den Workspace aus dem Access-Token", async () => {
    const { fetch } = mockFetch({ graphql: [ok] })
    expect(await client(fetch).getWorkspace()).toBe("eamktsoLive")

    const { fetch: plain } = mockFetch({
      token: [() => tokenResponse("kein-jwt")],
      graphql: [ok],
    })
    expect(await client(plain).getWorkspace()).toBe("fallback")
  })

  it("verlangt einen API-Token", () => {
    expect(() => createLeanixClient({ baseUrl: BASE, apiToken: "" })).toThrow(
      LeanixError
    )
  })
})

describe("workspaceFromAccessToken", () => {
  it("ignoriert ungültige Tokens", () => {
    expect(workspaceFromAccessToken("a.b.c")).toBeNull()
    expect(workspaceFromAccessToken("")).toBeNull()
    expect(workspaceFromAccessToken(jwt({ principal: {} }))).toBeNull()
  })
})
