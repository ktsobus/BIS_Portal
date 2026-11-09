import "server-only"

/**
 * Minimaler LeanIX-Client: Access-Token über den API-Token holen und
 * zwischenspeichern, GraphQL-Abfragen mit Timeout und Wiederholung.
 *
 * Sicherheit: Weder der API-Token noch der Access-Token werden geloggt oder
 * in Fehlermeldungen aufgenommen. Fehlermeldungen enthalten nur Status,
 * Endpunkt und (bei GraphQL) die Fehlermeldungen von LeanIX.
 */

export type LeanixErrorKind =
  "config" | "auth" | "http" | "network" | "timeout" | "graphql" | "response"

export class LeanixError extends Error {
  readonly kind: LeanixErrorKind
  readonly status: number | null
  readonly retryable: boolean

  constructor(
    message: string,
    options: {
      kind: LeanixErrorKind
      status?: number | null
      retryable?: boolean
      cause?: unknown
    }
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = "LeanixError"
    this.kind = options.kind
    this.status = options.status ?? null
    this.retryable = options.retryable ?? false
  }
}

export interface GraphqlErrorInfo {
  message: string
  path?: Array<string | number>
}

export interface GraphqlResult<TData> {
  data: TData
  /** Teilfehler (GraphQL `errors` neben `data`). */
  errors: GraphqlErrorInfo[]
}

export interface LeanixClientOptions {
  /** Basis-URL der Instanz, z. B. `https://ktso.leanix.net`. */
  baseUrl: string
  /** API-Token des technischen Benutzers. */
  apiToken: string
  /** Workspace, falls er nicht aus dem Access-Token gelesen werden kann. */
  workspace?: string | null
  /** Zeitlimit pro HTTP-Anfrage. Standard: 30 s. */
  timeoutMs?: number
  /** Wiederholungen bei Netzwerkfehlern und HTTP 5xx/429. Standard: 2. */
  retries?: number
  /** Basis für den exponentiellen Backoff. Standard: 500 ms. */
  retryDelayMs?: number
  /** Access-Token so lange vor Ablauf erneuern. Standard: 60 s. */
  refreshMarginMs?: number
  /** Für Tests austauschbar. */
  fetch?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

interface CachedToken {
  value: string
  expiresAt: number
  workspace: string | null
}

const TOKEN_PATH = "/services/mtm/v1/oauth2/token"
const GRAPHQL_PATH = "/services/pathfinder/v1/graphql"

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Liest `principal.permission.workspaceName` aus einem JWT (ohne Prüfung). */
export function workspaceFromAccessToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1]
    if (!payload) return null
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { principal?: { permission?: { workspaceName?: unknown } } }
    const name = claims.principal?.permission?.workspaceName
    return typeof name === "string" && name.trim() !== "" ? name.trim() : null
  } catch {
    return null
  }
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500
}

function shorten(text: string, max = 300) {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max)} …` : clean
}

export class LeanixClient {
  private readonly baseUrl: string
  private readonly apiToken: string
  private readonly fallbackWorkspace: string | null
  private readonly timeoutMs: number
  private readonly retries: number
  private readonly retryDelayMs: number
  private readonly refreshMarginMs: number
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>
  private readonly now: () => number
  private token: CachedToken | null = null
  private tokenRequest: Promise<CachedToken> | null = null

  constructor(options: LeanixClientOptions) {
    if (!options.apiToken) {
      throw new LeanixError("Kein LeanIX-API-Token konfiguriert", {
        kind: "config",
      })
    }
    this.baseUrl = options.baseUrl.replace(/\/+$/, "")
    this.apiToken = options.apiToken
    this.fallbackWorkspace = options.workspace ?? null
    this.timeoutMs = options.timeoutMs ?? 30_000
    this.retries = options.retries ?? 2
    this.retryDelayMs = options.retryDelayMs ?? 500
    this.refreshMarginMs = options.refreshMarginMs ?? 60_000
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.sleep = options.sleep ?? defaultSleep
    this.now = options.now ?? Date.now
  }

  /** Workspace-Name aus dem Access-Token, sonst der konfigurierte. */
  async getWorkspace(): Promise<string | null> {
    const token = await this.getToken()
    return token.workspace ?? this.fallbackWorkspace
  }

  /** Verwirft den zwischengespeicherten Access-Token. */
  invalidateToken() {
    this.token = null
  }

  /**
   * Führt eine GraphQL-Abfrage aus. Teilfehler (`errors` neben `data`)
   * werden zurückgegeben, nicht geworfen; ohne `data` wird geworfen.
   */
  async graphql<TData>(
    query: string,
    variables: Record<string, unknown> = {}
  ): Promise<GraphqlResult<TData>> {
    const body = JSON.stringify({ query, variables })
    let response = await this.authorizedPost(body)
    if (response.status === 401) {
      // Token abgelaufen oder widerrufen: einmal neu holen.
      await response.body?.cancel()
      this.invalidateToken()
      response = await this.authorizedPost(body)
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new LeanixError(
        `LeanIX-GraphQL antwortet mit HTTP ${response.status}${
          text ? `: ${shorten(this.redact(text))}` : ""
        }`,
        {
          kind: response.status === 401 ? "auth" : "http",
          status: response.status,
        }
      )
    }

    let json: { data?: TData | null; errors?: unknown }
    try {
      json = (await response.json()) as typeof json
    } catch (error) {
      throw new LeanixError("LeanIX-GraphQL liefert kein gültiges JSON", {
        kind: "response",
        status: response.status,
        cause: error,
      })
    }

    const errors = Array.isArray(json.errors)
      ? json.errors.map((e: unknown) => {
          const item = (e ?? {}) as { message?: unknown; path?: unknown }
          return {
            message: this.redact(
              typeof item.message === "string" ? item.message : String(e)
            ),
            path: Array.isArray(item.path)
              ? (item.path as Array<string | number>)
              : undefined,
          }
        })
      : []

    if (json.data == null) {
      const detail = errors
        .slice(0, 3)
        .map((e) => e.message)
        .join(" | ")
      throw new LeanixError(
        `LeanIX-GraphQL-Fehler${detail ? `: ${shorten(detail, 500)}` : " (keine Daten)"}`,
        { kind: "graphql" }
      )
    }
    return { data: json.data, errors }
  }

  // -------------------------------------------------------------------------

  private async authorizedPost(body: string): Promise<Response> {
    const token = await this.getToken()
    return this.request(
      GRAPHQL_PATH,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.value}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      },
      "LeanIX-GraphQL"
    )
  }

  private async getToken(): Promise<CachedToken> {
    if (this.token && this.now() < this.token.expiresAt) return this.token
    // Gleichzeitige Aufrufe teilen sich eine Token-Anfrage.
    this.tokenRequest ??= this.fetchToken().finally(() => {
      this.tokenRequest = null
    })
    this.token = await this.tokenRequest
    return this.token
  }

  private async fetchToken(): Promise<CachedToken> {
    const basic = Buffer.from(`apitoken:${this.apiToken}`).toString("base64")
    const response = await this.request(
      TOKEN_PATH,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: "grant_type=client_credentials",
      },
      "LeanIX-Token-Abruf"
    )
    if (!response.ok) {
      await response.body?.cancel()
      // Antworttext bewusst nicht übernehmen (kann Anmeldedaten spiegeln).
      const denied = response.status === 400 || response.status === 401
      throw new LeanixError(
        denied
          ? `LeanIX-Token-Abruf abgelehnt (HTTP ${response.status}): API-Token prüfen`
          : `LeanIX-Token-Abruf fehlgeschlagen (HTTP ${response.status})`,
        { kind: "auth", status: response.status }
      )
    }
    let json: { access_token?: unknown; expires_in?: unknown }
    try {
      json = (await response.json()) as typeof json
    } catch (error) {
      throw new LeanixError("LeanIX-Token-Antwort ist kein gültiges JSON", {
        kind: "response",
        cause: error,
      })
    }
    if (typeof json.access_token !== "string" || json.access_token === "") {
      throw new LeanixError(
        "LeanIX-Token-Antwort enthält keinen Access-Token",
        {
          kind: "response",
        }
      )
    }
    const lifetimeMs =
      (typeof json.expires_in === "number" && json.expires_in > 0
        ? json.expires_in
        : 3600) * 1000
    // Bei sehr kurzer Lebensdauer höchstens die Hälfte als Reserve nutzen.
    const margin = Math.min(this.refreshMarginMs, lifetimeMs / 2)
    return {
      value: json.access_token,
      expiresAt: this.now() + lifetimeMs - margin,
      workspace: workspaceFromAccessToken(json.access_token),
    }
  }

  /** HTTP-Anfrage mit Timeout und Wiederholung bei Netzwerk-/5xx-Fehlern. */
  private async request(
    path: string,
    init: RequestInit,
    label: string
  ): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.fetchImpl(url, {
          ...init,
          signal: AbortSignal.timeout(this.timeoutMs),
        })
        // Nach der letzten Wiederholung entscheidet der Aufrufer über den Status.
        if (!isRetryableStatus(response.status) || attempt >= this.retries) {
          return response
        }
        await response.body?.cancel()
      } catch (error) {
        if (attempt >= this.retries) {
          const name = (error as { name?: string } | null)?.name
          const timedOut = name === "TimeoutError" || name === "AbortError"
          throw new LeanixError(
            timedOut
              ? `${label}: keine Antwort innert ${Math.round(this.timeoutMs / 1000)} s`
              : `${label}: ${url} nicht erreichbar (${this.describeNetworkError(error)})`,
            {
              kind: timedOut ? "timeout" : "network",
              retryable: true,
              cause: error,
            }
          )
        }
      }
      await this.sleep(this.retryDelayMs * 2 ** attempt)
    }
  }

  private describeNetworkError(error: unknown): string {
    const cause = (error as { cause?: { code?: unknown; message?: unknown } })
      ?.cause
    if (cause && typeof cause.code === "string") return cause.code
    if (error instanceof Error) return this.redact(error.message)
    return "unbekannter Fehler"
  }

  /** Entfernt Token aus Texten, falls ein Server sie spiegeln sollte. */
  private redact(text: string): string {
    let result = text
    for (const secret of [this.apiToken, this.token?.value]) {
      if (secret && secret.length >= 6)
        result = result.split(secret).join("***")
    }
    return result
  }
}

export function createLeanixClient(options: LeanixClientOptions) {
  return new LeanixClient(options)
}
