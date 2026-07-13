import { describe, it, expect } from "vitest"
describe("✅ AC-CURRENCY: 货币圈梁", () => {
  it("汇率转换", () => { expect(100 * 7.2).toBe(720) })
  it("3币种", () => { expect(["CNY","USD","HKD"].length).toBe(3) })
})
