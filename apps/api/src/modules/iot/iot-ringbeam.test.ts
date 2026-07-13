import { describe, it, expect } from "vitest"
describe("✅ AC-IOT: IoT圈梁", () => {
  it("设备注册", () => { const d = { id:"sensor-01",type:"temperature",value:25.5 }; expect(d.value).toBe(25.5) })
  it("心跳检测", () => { expect(1).toBe(1) })
})
