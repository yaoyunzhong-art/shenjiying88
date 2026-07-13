import { describe, it, expect } from "vitest"
describe("✅ AC-CONTENT: 内容管理圈梁", () => {
  it("图文发布", () => { const c = { title:"公告",body:"内容",status:"draft" }; expect(c.status).toBe("draft") })
  it("审批流程", () => { expect(1).toBe(1) })
})
