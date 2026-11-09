import { describe, expect, it } from "vitest"

import { catalogSourceWarning } from "./startup-check"

describe("catalogSourceWarning", () => {
  it("warnt in Produktion ohne Token und ohne ausdrückliches CATALOG_SOURCE=demo", () => {
    const warning = catalogSourceWarning({
      nodeEnv: "production",
      catalogSource: "demo",
      configuredSource: undefined,
      tokenConfigured: false,
    })
    expect(warning).toContain("Demo-Modus")
    expect(warning).toContain("LEANIX_API_TOKEN")
    expect(warning?.startsWith("[catalog]")).toBe(true)
  })

  it("warnt auch bei leerem CATALOG_SOURCE", () => {
    expect(
      catalogSourceWarning({
        nodeEnv: "production",
        catalogSource: "demo",
        configuredSource: "",
        tokenConfigured: false,
      })
    ).not.toBeNull()
  })

  it("bleibt still bei bewusstem Demo-Betrieb", () => {
    expect(
      catalogSourceWarning({
        nodeEnv: "production",
        catalogSource: "demo",
        configuredSource: "demo",
        tokenConfigured: false,
      })
    ).toBeNull()
  })

  it("warnt bei CATALOG_SOURCE=leanix ohne Token", () => {
    expect(
      catalogSourceWarning({
        nodeEnv: "production",
        catalogSource: "leanix",
        configuredSource: "leanix",
        tokenConfigured: false,
      })
    ).toContain("Jeder Sync schlägt fehl")
  })

  it("bleibt still mit Token und in der Entwicklung", () => {
    expect(
      catalogSourceWarning({
        nodeEnv: "production",
        catalogSource: "leanix",
        configuredSource: undefined,
        tokenConfigured: true,
      })
    ).toBeNull()
    expect(
      catalogSourceWarning({
        nodeEnv: "development",
        catalogSource: "demo",
        configuredSource: undefined,
        tokenConfigured: false,
      })
    ).toBeNull()
  })
})
