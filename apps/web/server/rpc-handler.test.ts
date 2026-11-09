import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins"
import type { RouterClient } from "@orpc/server"
import { os } from "@orpc/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { z } from "zod"

import { createRpcRequestHandler, isCrossOriginMutation } from "./rpc-handler"

const APP_ORIGIN = "http://localhost:3330"

const base = os.$context<{ headers: Headers }>()
const created: string[] = []

/** Kleiner Router mit einer GET- und einer ändernden Prozedur. */
const router = {
  health: {
    check: base.route({ method: "GET" }).handler(() => ({ status: "ok" })),
  },
  user: {
    create: base.input(z.object({ email: z.string() })).handler(({ input }) => {
      created.push(input.email)
      return { email: input.email }
    }),
  },
  catalog: {
    overview: base
      .errors({ CATALOG_UNAVAILABLE: { status: 503, message: "weg" } })
      .handler(({ errors }) => {
        throw errors.CATALOG_UNAVAILABLE()
      }),
  },
  boom: base.handler(() => {
    throw new Error("unerwartet")
  }),
}

const handle = createRpcRequestHandler(router, { appOrigin: APP_ORIGIN })

/** Der normale Client (wie `lib/orpc.ts`), aber ohne Netzwerk. */
const client: RouterClient<typeof router> = createORPCClient(
  new RPCLink({
    url: `${APP_ORIGIN}/rpc`,
    fetch: (request) => handle(request as Request),
    plugins: [new SimpleCsrfProtectionLinkPlugin()],
  })
)

/** Wie ein automatisch abgeschicktes HTML-Formular (multipart, ohne Header). */
function formPost(path: string, headers: Record<string, string> = {}) {
  const body = new FormData()
  body.set("data", JSON.stringify({ json: { email: "csrf@example.org" } }))
  return new Request(`${APP_ORIGIN}/rpc/${path}`, {
    method: "POST",
    headers,
    body,
  })
}

afterEach(() => {
  created.length = 0
  vi.restoreAllMocks()
})

describe("isCrossOriginMutation", () => {
  const request = (method: string, headers: Record<string, string>) =>
    new Request(`${APP_ORIGIN}/rpc/x`, { method, headers })

  it("lehnt fremde Origins und Sec-Fetch-Site ausser same-origin ab", () => {
    expect(
      isCrossOriginMutation(
        request("POST", { origin: "http://evil.example" }),
        APP_ORIGIN
      )
    ).toBe(true)
    expect(
      isCrossOriginMutation(
        request("POST", { origin: "http://localhost:4604" }),
        APP_ORIGIN
      )
    ).toBe(true)
    expect(
      isCrossOriginMutation(request("POST", { origin: "null" }), APP_ORIGIN)
    ).toBe(true)
    expect(
      isCrossOriginMutation(
        request("POST", { "sec-fetch-site": "same-site" }),
        APP_ORIGIN
      )
    ).toBe(true)
    expect(
      isCrossOriginMutation(
        request("DELETE", { "sec-fetch-site": "cross-site" }),
        APP_ORIGIN
      )
    ).toBe(true)
  })

  it("lässt die eigene Origin, GET und Aufrufe ohne Browser-Header zu", () => {
    expect(
      isCrossOriginMutation(
        request("POST", {
          origin: APP_ORIGIN,
          "sec-fetch-site": "same-origin",
        }),
        APP_ORIGIN
      )
    ).toBe(false)
    expect(
      isCrossOriginMutation(
        request("GET", { origin: "http://evil.example" }),
        APP_ORIGIN
      )
    ).toBe(false)
    expect(isCrossOriginMutation(request("POST", {}), APP_ORIGIN)).toBe(false)
  })
})

describe("createRpcRequestHandler", () => {
  it("lehnt ein Formular von einer anderen Origin derselben Site ab (403)", async () => {
    const response = await handle(
      formPost("user/create", {
        origin: "http://localhost:4604",
        "sec-fetch-site": "same-site",
      })
    )
    expect(response.status).toBe(403)
    expect(created).toEqual([])
  })

  it("lehnt einen Aufruf ohne x-csrf-token ab (403), auch ohne Origin", async () => {
    const response = await handle(formPost("user/create"))
    expect(response.status).toBe(403)
    const body = (await response.json()) as { json: { code: string } }
    expect(body.json.code).toBe("CSRF_TOKEN_MISMATCH")
    expect(created).toEqual([])
  })

  it("lässt den normalen Client weiter zu", async () => {
    await expect(
      client.user.create({ email: "a@example.org" })
    ).resolves.toEqual({ email: "a@example.org" })
    expect(created).toEqual(["a@example.org"])
  })

  it("lässt GET-Prozeduren ohne Header zu (Docker-HEALTHCHECK, Monitoring)", async () => {
    const response = await handle(
      new Request(`${APP_ORIGIN}/rpc/health/check`, { method: "GET" })
    )
    expect(response.status).toBe(200)
  })

  it("erlaubt ändernde Prozeduren nicht per GET", async () => {
    const response = await handle(
      new Request(
        `${APP_ORIGIN}/rpc/user/create?data=${encodeURIComponent(JSON.stringify({ json: { email: "get@example.org" } }))}`,
        { method: "GET", headers: { "x-csrf-token": "orpc" } }
      )
    )
    expect(response.status).toBe(405)
    expect(created).toEqual([])
  })

  it("protokolliert definierte 503-Fehler ohne Stacktrace und gedrosselt", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const info = vi.spyOn(console, "info").mockImplementation(() => {})

    for (let i = 0; i < 3; i++) {
      await expect(client.catalog.overview()).rejects.toMatchObject({
        code: "CATALOG_UNAVAILABLE",
        status: 503,
      })
    }
    expect(error).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledTimes(1)
    expect(String(info.mock.calls[0]?.[0])).toContain("CATALOG_UNAVAILABLE")
  })

  it("protokolliert unerwartete Fehler weiterhin", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(client.boom()).rejects.toMatchObject({ status: 500 })
    expect(error).toHaveBeenCalledTimes(1)
  })
})
