import "server-only"

import { onError, ORPCError } from "@orpc/server"
import { RPCHandler } from "@orpc/server/fetch"
import { SimpleCsrfProtectionHandlerPlugin } from "@orpc/server/plugins"

import type { BaseContext } from "./orpc"

/** Methoden ohne Seiteneffekt; GET-Prozeduren sind nur lesend. */
const SAFE_METHODS = new Set(["GET", "HEAD"])

/**
 * Schutz gegen Cross-Site Request Forgery (Teil 1): Aufrufe mit
 * Seiteneffekt (alles ausser GET/HEAD) müssen von der eigenen Origin
 * stammen. Das Session-Cookie (SameSite=Lax) schützt nur gegen fremde
 * *Sites*, nicht gegen andere Origins derselben Site (z. B. eine andere
 * Intranet-Anwendung unter derselben Domain).
 *
 * Abgelehnt wird, wenn der Browser eine fremde `Origin` oder ein
 * `Sec-Fetch-Site` ausser `same-origin` meldet. Aufrufe ohne diese Header
 * (Server, Skripte) prüft Teil 2, der CSRF-Header.
 */
export function isCrossOriginMutation(request: Request, appOrigin: string) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return false
  const origin = request.headers.get("origin")
  if (origin !== null && origin !== appOrigin) return true
  const site = request.headers.get("sec-fetch-site")
  return site !== null && site !== "same-origin"
}

/** Gleiche Meldung höchstens einmal pro Minute protokollieren. */
const LOG_INTERVAL_MS = 60_000
const lastLogged = new Map<string, number>()

function logExpectedError(error: ORPCError<string, unknown>) {
  const key = `${error.code}:${error.status}`
  const now = Date.now()
  if (now - (lastLogged.get(key) ?? 0) < LOG_INTERVAL_MS) return
  lastLogged.set(key, now)
  console.info(
    `[rpc] ${error.code} (${error.status}): ${error.message} (weitere gleiche Meldungen während 1 min unterdrückt)`
  )
}

/**
 * oRPC-Handler für `/rpc` mit CSRF-Schutz und Fehlerprotokoll.
 *
 * - Teil 1: {@link isCrossOriginMutation} (Origin / Sec-Fetch-Site).
 * - Teil 2: `SimpleCsrfProtectionHandlerPlugin`. Prozeduren ausser GET
 *   verlangen den Header `x-csrf-token: orpc`, den der eigene Client
 *   (`lib/orpc.ts`) setzt. Ein HTML-Formular kann keine eigenen Header
 *   senden, ein `fetch` von einer fremden Origin nur nach einem
 *   CORS-Preflight, den `/rpc` nie erlaubt. GET-Prozeduren (Health-Check,
 *   Katalog-Status) bleiben für einfache Monitoring-Proben ohne Header
 *   erreichbar; GET ist dank `StrictGetMethodPlugin` (Standard) nur für
 *   lesende, als GET deklarierte Prozeduren möglich.
 */
export function createRpcRequestHandler(
  router: ConstructorParameters<typeof RPCHandler<BaseContext>>[0],
  { appOrigin }: { appOrigin: string }
) {
  const handler = new RPCHandler(router, {
    plugins: [
      new SimpleCsrfProtectionHandlerPlugin({
        exclude: ({ procedure }) => procedure["~orpc"].route.method === "GET",
      }),
    ],
    interceptors: [
      onError((error) => {
        if (error instanceof ORPCError) {
          // Im Contract definierte Fehler sind erwartete Zustände (z. B.
          // CATALOG_UNAVAILABLE, 503): keine Stacktraces, höchstens eine
          // gedrosselte Zeile.
          if (error.defined) {
            if (error.status >= 500) logExpectedError(error)
            return
          }
          // 4xx wie UNAUTHORIZED oder Validierungsfehler nicht protokollieren.
          if (error.status < 500) return
        }
        console.error(error)
      }),
    ],
  })

  return async function handleRequest(request: Request): Promise<Response> {
    if (isCrossOriginMutation(request, appOrigin)) {
      return Response.json(
        {
          json: {
            defined: false,
            code: "FORBIDDEN_ORIGIN",
            status: 403,
            message: "Cross-origin request blocked",
          },
        },
        { status: 403 }
      )
    }
    const { response } = await handler.handle(request, {
      prefix: "/rpc",
      context: { headers: request.headers },
    })
    return response ?? new Response("Not found", { status: 404 })
  }
}
