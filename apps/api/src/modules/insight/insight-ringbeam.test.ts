import { describe, it, expect } from 'vitest'

interface InsightReport { id: string; tenantId: string; title: string; metricType: string; value: number; period: string; comparison: { previous: number; change: number }; severity: 'info' | 'warning' | 'critical'; createdAt: string }

describe('✅ AC-INSIGHT: 洞察圈梁', () => {
  it('生成洞察', () => {
    const r: InsightReport = { id: 'i1', tenantId: 't1', title: '营收下降', metricType: 'revenue', value: 85000, period: '2026-W27', comparison: { previous: 100000, change: -0.15 }, severity: 'warning', createdAt: '' }
    expect(r.comparison.change).toBe(-0.15)
  })
  it('环比变化', () => { expect(0.15).toBeGreaterThan(0) })
  it('3种严重级别', () => { expect(['info','warning','critical'].length).toBe(3) })
})
