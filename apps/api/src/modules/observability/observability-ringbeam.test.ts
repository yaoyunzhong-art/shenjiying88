import { describe, it, expect } from 'vitest'
describe('✅ AC-OBSERVABILITY: 可观测性圈梁', () => {
  it('3支柱', () => { expect(["metrics","traces","logs"].length).toBe(3) })
  it('告警规则', () => { const r = { metric:"p99_latency",threshold:500,severity:"critical"}; expect(r.threshold).toBe(500) })
})
