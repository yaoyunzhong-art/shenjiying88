/**
 * member-level-decay.test.ts
 * BS-0276: 成长值衰减曲线 — 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemberLevelDecayService } from './member-level-decay.service'

describe('MemberLevelDecayService — BS-0276 成长值衰减曲线', () => {
  let service: MemberLevelDecayService

  beforeEach(() => {
    service = new MemberLevelDecayService()
  })

  const makeConfig = (overrides: Partial<{
    lastConsumptionDate: string
    currentGrowth: number
    idleDays: number
  }> = {}) => ({
    lastConsumptionDate: overrides.lastConsumptionDate ?? '2026-01-01',
    currentGrowth: overrides.currentGrowth ?? 10000,
    idleDays: overrides.idleDays ?? 0,
  })

  // ─── 正常周期 ───

  it('BS-0276: 不满90天无消费不衰减', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 30 }))
    expect(result.decayAmount).toBe(0)
    expect(result.decayedGrowth).toBe(10000)
    expect(result.decayRate).toBe(0)
  })

  it('BS-0276: 不满90天，即使即将满90天也不衰减', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 89 }))
    expect(result.decayAmount).toBe(0)
    expect(result.decayedGrowth).toBe(10000)
  })

  // ─── 月度衰减 ───

  it('BS-0276: 90天未消费，月度降20%', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 90 }))
    expect(result.period).toBe('monthly')
    expect(result.decayRate).toBeCloseTo(0.2, 1)
    expect(result.decayedGrowth).toBe(8000)
    expect(result.decayAmount).toBe(2000)
  })

  it('BS-0276: 120天未消费，两个月各降20%', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 120 }))
    expect(result.period).toBe('monthly')
    expect(result.decayedGrowth).toBe(6000)
    expect(result.decayAmount).toBe(4000)
  })

  it('BS-0276: 150天未消费，三个月各降20%（降60%)', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 150 }))
    expect(result.period).toBe('monthly')
    expect(result.decayedGrowth).toBe(4000)
    expect(result.decayAmount).toBe(6000)
  })

  it('BS-0276: 179天未消费，月度衰减最高降80%', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 179 }))
    expect(result.period).toBe('monthly')
    expect(result.decayedGrowth).toBe(2000)
    expect(result.decayAmount).toBe(8000)
  })

  // ─── 季度衰减 ───

  it('BS-0276: 180天未消费，进入季度衰减降50%', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 180 }))
    expect(result.period).toBe('quarterly')
    expect(result.decayedGrowth).toBe(5000)
    expect(result.decayAmount).toBe(5000)
  })

  it('BS-0276: 269天未消费，季度衰减最高降100%', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 269 }))
    expect(result.period).toBe('quarterly')
    expect(result.decayedGrowth).toBe(0)
    expect(result.decayAmount).toBe(10000)
  })

  // ─── 半年归零 ───

  it('BS-0276: 270天以上未消费，成长值归零', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 300 }))
    expect(result.period).toBe('halfYear')
    expect(result.decayedGrowth).toBe(0)
    expect(result.decayRate).toBe(1)
    expect(result.nextDecayDate).toBe('已归零')
  })

  // ─── applyDecay 快捷方法 ───

  it('BS-0276: applyDecay 返回衰减后成长值', () => {
    const result = service.applyDecay(makeConfig({ idleDays: 90 }))
    expect(result).toBe(8000)
  })

  // ─── 小成长值衰减不会变负 ───

  it('BS-0276: 小成长值衰减不低于0', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 300, currentGrowth: 100 }))
    expect(result.decayedGrowth).toBe(0)
    expect(result.decayedGrowth).toBeGreaterThanOrEqual(0)
  })

  // ─── nextDecayDate 格式 ───

  it('BS-0276: nextDecayDate 为 YYYY-MM-DD 格式', () => {
    const result = service.calculateDecay(makeConfig({ idleDays: 90, currentGrowth: 5000 }))
    expect(result.nextDecayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
