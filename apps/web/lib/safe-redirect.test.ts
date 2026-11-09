import { describe, expect, it } from "vitest"

import { safeRedirectPath } from "./safe-redirect"

describe("safeRedirectPath", () => {
  it.each([
    ["/\\x"],
    ["/\\\\x"],
    ["/\\evil.example/login"],
    ["/\t/x"],
    ["/\n/x"],
    ["/\r/x"],
    ["/\u0000/x"],
    ["/\u007f/x"],
    ["//x"],
    ["//evil.example/phish"],
    ["https://x"],
    ["http://evil.example"],
    ["javascript:alert(1)"],
    ["admin"],
    [""],
    [null],
    [undefined],
  ])("verwirft %j", (value) => {
    expect(safeRedirectPath(value)).toBe("/admin")
  })

  it.each([
    ["/admin?x=1#a"],
    ["/services/abc"],
    ["/admin"],
    ["/admin/catalog"],
    ["/suche?q=E-Mail%20Konto"],
    ["/"],
  ])("lässt %j unverändert", (value) => {
    expect(safeRedirectPath(value)).toBe(value)
  })

  it("normalisiert Punktsegmente, bleibt aber auf derselben Origin", () => {
    expect(safeRedirectPath("/admin/../services/x")).toBe("/services/x")
    expect(safeRedirectPath("/../../evil.example")).toBe("/evil.example")
  })

  it("verwendet den angegebenen Fallback", () => {
    expect(safeRedirectPath("//x", "/")).toBe("/")
    expect(safeRedirectPath(null, "/sign-in")).toBe("/sign-in")
  })
})
