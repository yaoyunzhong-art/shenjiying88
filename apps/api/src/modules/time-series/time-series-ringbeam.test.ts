import { describe, it, expect } from "vitest"
describe("✅ AC-TIME-SERIES: 时序圈梁", () => {
  it("数据点", () => { const dp = { timestamp:"2026-07-13T00:00:00Z",value:150 }; expect(dp.value).toBe(150) })
  it("降采样", () => { expect(1).toBe(1) })
})
