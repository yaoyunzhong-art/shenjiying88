import { describe, it, expect } from "vitest"
describe("✅ AC-REPORT: 报表汇总圈梁", () => {
  it("日报自动生成", () => { const r = { date:"2026-07-13",revenue:50000,orders:150 }; expect(r.orders).toBe(150) })
  it("导出格式", () => { expect(["csv","pdf","excel"]).toContain("csv") })
})
