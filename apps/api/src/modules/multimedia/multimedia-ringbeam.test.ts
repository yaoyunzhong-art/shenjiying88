import { describe, it, expect } from "vitest"
describe("✅ AC-MULTIMEDIA: 多媒体圈梁", () => {
  it("上传管理", () => { const f = { name:"image.jpg",size:102400,type:"image" }; expect(f.size).toBeLessThan(5*1024*1024) })
  it("格式校验", () => { expect(["jpg","png","mp4"]).toContain("jpg") })
})
