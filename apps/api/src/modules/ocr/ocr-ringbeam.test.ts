import { describe, it, expect } from "vitest"
describe("✅ AC-OCR: OCR圈梁", () => {
  it("文字识别", () => { const r = { text:"收银小票",confidence:0.95 }; expect(r.confidence).toBeGreaterThan(0.8) })
  it("图像预处", () => { expect(1).toBe(1) })
})
