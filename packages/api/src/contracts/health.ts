import { oc } from "@orpc/contract"
import { z } from "zod"

import { catalogStatusSchema, syncRunStatusSchema } from "../schemas/catalog"

/** Bereitschaft für Monitoring: Datenbank, Katalog, letzter Sync-Lauf. */
export const readinessSchema = z.object({
  /**
   * `ok`: alles in Ordnung; `degraded`: Katalog verfügbar, aber veraltet
   * oder der letzte Sync ist fehlgeschlagen; `unavailable`: Datenbank nicht
   * erreichbar oder kein Katalog (HTTP 503).
   */
  status: z.enum(["ok", "degraded", "unavailable"]),
  time: z.date(),
  db: z.enum(["ok", "error"]),
  catalog: catalogStatusSchema,
  /** Nur im LeanIX-Modus; ohne Fehlermeldung (die Prozedur ist öffentlich). */
  lastSync: z
    .object({
      status: syncRunStatusSchema,
      startedAt: z.string(),
      finishedAt: z.string().nullable(),
    })
    .nullable(),
})

export const healthContract = {
  /** Liveness: der Prozess antwortet (keine Abhängigkeiten geprüft). */
  // GET so plain HTTP probes (e.g. the Docker healthcheck) can call it.
  check: oc
    .route({ method: "GET" })
    .output(z.object({ status: z.literal("ok"), time: z.date() })),
  /**
   * Readiness/Monitoring: HTTP 200 bei `ok`/`degraded`, HTTP 503
   * (`NOT_READY`, Details in `data`) bei `unavailable`.
   */
  ready: oc
    .route({ method: "GET" })
    .errors({
      NOT_READY: {
        status: 503,
        message: "Service not ready",
        data: readinessSchema,
      },
    })
    .output(readinessSchema),
}

export type Readiness = z.infer<typeof readinessSchema>
