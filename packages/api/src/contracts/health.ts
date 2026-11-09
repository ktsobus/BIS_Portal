import { oc } from "@orpc/contract"
import { z } from "zod"

export const healthContract = {
  // GET so plain HTTP probes (e.g. the Docker healthcheck) can call it.
  check: oc
    .route({ method: "GET" })
    .output(z.object({ status: z.literal("ok"), time: z.date() })),
}
