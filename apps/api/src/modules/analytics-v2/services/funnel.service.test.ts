/**
 * funnel.service.spec.ts — V23 漏斗分析 Service 纯函数式单元测试
 *
 * 覆盖：FunnelService 全部公开方法
 *   - createFunnel: 正例（4步电商）/ 边界（0步/单步/超5步/7d自定义时间窗）/
 *                   反例（空数组）
 *   - listFunnels: 正例（多漏斗）/ 边界（空租户）
 *   - getFunnel: 正例（存在）/ 边界（不存在返回 null）
 *   - compareFunnels: 正例（跨漏斗对比含 dropOff）/ 边界（空数组/含 null 过滤）
 *   - identifyBiggestDropOff: 正例（多步骤]/ 边界（不存在漏斗）
 *   - getDefaultFunnelTemplate: 正例（返回完整模板）
 *
 * 策略：直接 new FunnelService + mock FunnelCalculator + mock FunnelAdapter
 *       纯函数内联，不含 NestJS DI。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FunnelService } from './funnel.service'
import type { TenantId, FunnelStep, FunnelResult } from '../analytics-v2.entity'

type StepResult = { stepName: string; enteredCount: number; conversionRate: number; dropOffRate: number }

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeMockFunnelCalculator() {
  return {
    compute: vi.fn((input: { tenantId: TenantId; name: string; steps: FunnelStep[]; windowDays?: number }) => {
      const stepResults: StepResult[] = input.steps.map((s, i) => ({
        stepName: s.name,
        enteredCount: 1000 - i * 200,
        conversionRate: 1 - i * 0.15,
        dropOffRate: i === 0 ? 0 : 0.15,
      }))
      return {
        id: `funnel-${Date.now()}`,
        tenantId: input.tenantId,
        name: input.name,
        steps: input.steps,
        stepResults,
        totalConversionRate: 1 - (input.steps.length - 1) * 0.15,
        computedAt: new Date().toISOString(),
        windowDays: input.windowDays ?? 7,
      } satisfies FunnelResult
    }),
    isOverComplex: vi.fn((steps: FunnelStep[]) => steps.length > 5),
  }
}

function makeMockFunnelAdapter() {
  const store = new Map<string, FunnelResult[]>()
  return {
    queryByTenant: vi.fn((tenantId: TenantId): FunnelResult[] => store.get(tenantId) ?? []),
    query: vi.fn((tenantId: TenantId, funnelId: string): FunnelResult | null => {
      const list = store.get(tenantId) ?? []
      return list.find(f => f.id === funnelId) ?? null
    }),
    // test utility to seed data
    _seed: (tenantId: TenantId, funnels: FunnelResult[]) => { store.set(tenantId, funnels) },
    _clear: () => store.clear(),
  }
}

function mockStep(name: string, eventType: string): FunnelStep {
  return { name, eventType } as FunnelStep
}

function makeStepResult(stepName: string, enteredCount: number, conversionRate: number, dropOffRate: number): StepResult {
  return { stepName, enteredCount, conversionRate, dropOffRate }
}

// ═══════════════════════════════════════════════════════════════
// 辅助: 创建 FunnelService 实例
// ═══════════════════════════════════════════════════════════════

function createService() {
  const mockCalculator = makeMockFunnelCalculator()
  const mockAdapter = makeMockFunnelAdapter()
  const service = new FunnelService(mockCalculator as any, mockAdapter as any)
  return { service, mockCalculator, mockAdapter }
}

// ═══════════════════════════════════════════════════════════════
// 正例
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 创建漏斗', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B1] createFunnel 4步电商漏斗返回完整数据', () => {
    const { service, mockCalculator } = ctx
    const steps = [
      mockStep('浏览商品', 'PAGEVIEW'),
      mockStep('加入购物车', 'CLICK'),
      mockStep('提交订单', 'CONVERSION'),
      mockStep('完成支付', 'PURCHASE'),
    ]
    const result = service.createFunnel({
      tenantId: 't1',
      name: '电商转化漏斗',
      steps,
    })
    expect(result.funnel).toBeDefined()
    expect(result.funnel.name).toBe('电商转化漏斗')
    expect(result.funnel.steps).toHaveLength(4)
    expect(result.funnel.stepResults).toHaveLength(4)
    expect(result.funnel.totalConversionRate).toBeGreaterThan(0)
    expect(result.funnel.totalConversionRate).toBeLessThan(1)
    expect(result.isOverComplex).toBe(false)
    expect(result.warnings).toEqual([])
    expect(mockCalculator.compute).toHaveBeenCalledTimes(1)
  })

  it('[B2] createFunnel 1步漏斗正确返回', () => {
    const { service } = ctx
    const result = service.createFunnel({
      tenantId: 't1',
      name: '单步漏斗',
      steps: [mockStep('注册', 'CONVERSION')],
    })
    expect(result.funnel.steps).toHaveLength(1)
    expect(result.funnel.stepResults).toHaveLength(1)
    expect(result.isOverComplex).toBe(false)
  })

  it('[B3] createFunnel 7天自定义时间窗', () => {
    const { service } = ctx
    const result = service.createFunnel({
      tenantId: 't1',
      name: '7天漏斗',
      steps: [
        mockStep('点击', 'CLICK'),
        mockStep('转化', 'CONVERSION'),
      ],
      windowDays: 7,
    })
    expect(result.funnel.windowDays).toBe(7)
  })

  it('[B4] createFunnel 6步触发过载警告', () => {
    const { service } = ctx
    const steps = Array.from({ length: 6 }, (_, i) => mockStep(`step-${i + 1}`, 'CLICK'))
    const result = service.createFunnel({
      tenantId: 't1',
      name: '过载漏斗',
      steps,
    })
    expect(result.isOverComplex).toBe(true)
    expect(result.warnings).toEqual(['funnel_steps_over_complex: 漏斗步骤过多 (>5), 建议拆分'])
  })

  it('[B5] createFunnel 0步抛出错误', () => {
    const { service } = ctx
    expect(() => {
      service.createFunnel({
        tenantId: 't1',
        name: '空漏斗',
        steps: [],
      })
    }).toThrow('funnel_steps_empty')
  })
})

// ═══════════════════════════════════════════════════════════════
// listFunnels & getFunnel
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 查询漏斗', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B6] listFunnels 无数据返回空数组', () => {
    const { service } = ctx
    const list = service.listFunnels('t-empty')
    expect(list).toEqual([])
  })

  it('[B7] listFunnels 返回指定租户漏斗列表', () => {
    const { service, mockAdapter } = ctx
    const funnels: FunnelResult[] = [
      { id: 'f1', tenantId: 't1', name: '漏斗A', steps: [], stepResults: [], totalConversionRate: 0.5, computedAt: new Date().toISOString(), windowDays: 7 },
      { id: 'f2', tenantId: 't1', name: '漏斗B', steps: [], stepResults: [], totalConversionRate: 0.3, computedAt: new Date().toISOString(), windowDays: 7 },
    ]
    mockAdapter._seed('t1', funnels)
    const list = service.listFunnels('t1')
    expect(list).toHaveLength(2)
    expect(list[0].name).toBe('漏斗A')
    expect(list[1].name).toBe('漏斗B')
  })

  it('[B8] getFunnel 存在时返回漏斗', () => {
    const { service, mockAdapter } = ctx
    const funnel: FunnelResult = { id: 'f1', tenantId: 't1', name: '我的漏斗', steps: [], stepResults: [], totalConversionRate: 0.7, computedAt: new Date().toISOString(), windowDays: 7 }
    mockAdapter._seed('t1', [funnel])
    const found = service.getFunnel('t1', 'f1')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('我的漏斗')
  })

  it('[B9] getFunnel 不存在时返回 null', () => {
    const { service } = ctx
    const found = service.getFunnel('t1', 'nonexistent')
    expect(found).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════
// compareFunnels
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 漏斗对比', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B10] compareFunnels 返回跨漏斗对比数据', () => {
    const { service, mockAdapter } = ctx
    mockAdapter._seed('t1', [
      { id: 'f1', tenantId: 't1', name: '漏斗A', steps: [mockStep('s1', 'CLICK'), mockStep('s2', 'CONVERSION')], stepResults: [makeStepResult('s1', 1000, 1, 0), makeStepResult('s2', 500, 0.5, 0.5)], totalConversionRate: 0.5, computedAt: new Date().toISOString(), windowDays: 7 },
      { id: 'f2', tenantId: 't1', name: '漏斗B', steps: [mockStep('s1', 'CLICK'), mockStep('s2', 'CONVERSION'), mockStep('s3', 'PURCHASE')], stepResults: [makeStepResult('s1', 1000, 1, 0), makeStepResult('s2', 400, 0.4, 0.6), makeStepResult('s3', 200, 0.2, 0.5)], totalConversionRate: 0.2, computedAt: new Date().toISOString(), windowDays: 7 },
    ])
    const result = service.compareFunnels('t1', ['f1', 'f2'])
    expect(result).toHaveLength(2)
    expect(result[0].funnelId).toBe('f1')
    expect(result[0].stepsCount).toBe(2)
    expect(result[0].totalConversionRate).toBe(0.5)
    expect(result[0].dropOff).toHaveLength(2)
    expect(result[1].funnelId).toBe('f2')
    expect(result[1].stepsCount).toBe(3)
    expect(result[1].totalConversionRate).toBe(0.2)
  })

  it('[B11] compareFunnels 空数组返回空', () => {
    const { service } = ctx
    const result = service.compareFunnels('t1', [])
    expect(result).toEqual([])
  })

  it('[B12] compareFunnels 过滤不存在的漏斗', () => {
    const { service, mockAdapter } = ctx
    mockAdapter._seed('t1', [
      { id: 'f1', tenantId: 't1', name: '漏斗A', steps: [], stepResults: [], totalConversionRate: 0.5, computedAt: new Date().toISOString(), windowDays: 7 },
    ])
    const result = service.compareFunnels('t1', ['f1', 'nonexistent'])
    expect(result).toHaveLength(1)
    expect(result[0].funnelId).toBe('f1')
  })
})

// ═══════════════════════════════════════════════════════════════
// identifyBiggestDropOff
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 最大流失识别', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B13] identifyBiggestDropOff 找到最大流失步骤', () => {
    const { service, mockAdapter } = ctx
    mockAdapter._seed('*', [
      { id: 'f1', tenantId: '*', name: '测试漏斗', steps: [mockStep('浏览', 'PAGEVIEW'), mockStep('购物车', 'CLICK'), mockStep('支付', 'PURCHASE')], stepResults: [makeStepResult('浏览', 1000, 1, 0), makeStepResult('购物车', 500, 0.5, 0.5), makeStepResult('支付', 100, 0.1, 0.8)], totalConversionRate: 0.1, computedAt: new Date().toISOString(), windowDays: 7 },
    ])
    const result = service.identifyBiggestDropOff('f1')
    expect(result.funnel).not.toBeNull()
    expect(result.biggestDropStep).toBe('支付')
    expect(result.biggestDropRate).toBe(0.8)
  })

  it('[B14] identifyBiggestDropOff 不存在漏斗返回 null', () => {
    const { service } = ctx
    const result = service.identifyBiggestDropOff('nonexistent')
    expect(result.funnel).toBeNull()
    expect(result.biggestDropStep).toBeNull()
    expect(result.biggestDropRate).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// getDefaultFunnelTemplate
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 默认模板', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B15] getDefaultFunnelTemplate 返回4步电商模板', () => {
    const { service } = ctx
    const template = service.getDefaultFunnelTemplate()
    expect(template.name).toBe('电商转化漏斗')
    expect(template.steps).toHaveLength(4)
    expect(template.steps[0].name).toBe('浏览商品')
    expect(template.steps[0].eventType).toBe('PAGEVIEW')
    expect(template.steps[1].name).toBe('加入购物车')
    expect(template.steps[2].name).toBe('提交订单')
    expect(template.steps[3].name).toBe('完成支付')
    expect(template.steps[3].eventType).toBe('PURCHASE')
  })
})

// ═══════════════════════════════════════════════════════════════
// 反例 / 异常
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 反例与边界', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B16] createFunnel 空 steps 抛出异常信息正确', () => {
    const { service } = ctx
    expect(() =>
      service.createFunnel({ tenantId: 't1', name: 'x', steps: [] })
    ).toThrowError('funnel_steps_empty')
  })

  it('[B17] createFunnel 12步过载仍可计算', () => {
    const { service } = ctx
    const steps = Array.from({ length: 12 }, (_, i) => mockStep(`s${i}`, 'CLICK'))
    const result = service.createFunnel({ tenantId: 't1', name: '超长漏斗', steps })
    expect(result.funnel.steps).toHaveLength(12)
    expect(result.isOverComplex).toBe(true)
  })

  it('[B18] listFunnels 不同租户隔离', () => {
    const { service, mockAdapter } = ctx
    mockAdapter._seed('t1', [
      { id: 'f1', tenantId: 't1', name: '租户1的漏斗', steps: [], stepResults: [], totalConversionRate: 0.5, computedAt: new Date().toISOString(), windowDays: 7 },
    ])
    const listT1 = service.listFunnels('t1')
    const listT2 = service.listFunnels('t2')
    expect(listT1).toHaveLength(1)
    expect(listT2).toHaveLength(0)
  })

  it('[B19] compareFunnels 删除 id 不存在时被过滤', () => {
    const { service, mockAdapter } = ctx
    mockAdapter._seed('t1', [])
    const result = service.compareFunnels('t1', ['f-nope'])
    expect(result).toHaveLength(0)
  })

  it('[B20] 多次创建漏斗 tenantId/name 正确', () => {
    const { service } = ctx
    const r1 = service.createFunnel({ tenantId: 't1', name: 'A', steps: [mockStep('x', 'CLICK')] })
    const r2 = service.createFunnel({ tenantId: 't1', name: 'B', steps: [mockStep('x', 'CLICK')] })
    expect(r1.funnel.name).toBe('A')
    expect(r2.funnel.name).toBe('B')
    expect(r1.funnel.tenantId).toBe('t1')
    expect(r2.funnel.tenantId).toBe('t1')
  })
})

// ═══════════════════════════════════════════════════════════════
// 边界条件
// ═══════════════════════════════════════════════════════════════

describe('FunnelService — 边界覆盖', () => {
  let ctx: ReturnType<typeof createService>

  beforeEach(() => { ctx = createService() })

  it('[B21] getFunnel 传入空字符串租户', () => {
    const { service, mockAdapter } = ctx
    mockAdapter._seed('', [
      { id: 'f1', tenantId: '', name: '空租户', steps: [], stepResults: [], totalConversionRate: 0.5, computedAt: new Date().toISOString(), windowDays: 7 },
    ])
    const found = service.getFunnel('', 'f1')
    expect(found).not.toBeNull()
  })

  it('[B22] createFunnel 超长漏斗名', () => {
    const { service } = ctx
    const longName = 'A'.repeat(500)
    const result = service.createFunnel({
      tenantId: 't1',
      name: longName,
      steps: [mockStep('x', 'CLICK')],
    })
    expect(result.funnel.name).toBe(longName)
  })

  it('[B23] multiple createFunnel 调用不影响彼此结果', () => {
    const { service } = ctx
    const r1 = service.createFunnel({ tenantId: 't1', name: '漏斗1', steps: [mockStep('a', 'CLICK'), mockStep('b', 'CONVERSION')] })
    const r2 = service.createFunnel({ tenantId: 't2', name: '漏斗2', steps: [mockStep('a', 'CLICK'), mockStep('b', 'CONVERSION'), mockStep('c', 'PURCHASE')] })
    expect(r1.funnel.tenantId).toBe('t1')
    expect(r2.funnel.tenantId).toBe('t2')
    expect(r1.funnel.steps).toHaveLength(2)
    expect(r2.funnel.steps).toHaveLength(3)
  })

  it('[B24] createFunnel windowDays 默认值为 7', () => {
    const { service } = ctx
    const result = service.createFunnel({
      tenantId: 't1',
      name: '默认时间窗',
      steps: [mockStep('x', 'CLICK')],
    })
    expect(result.funnel.windowDays).toBe(7)
  })

  it('[B25] createFunnel windowDays 自定义30天', () => {
    const { service } = ctx
    const result = service.createFunnel({
      tenantId: 't1',
      name: '30天窗口',
      steps: [mockStep('x', 'CLICK')],
      windowDays: 30,
    })
    expect(result.funnel.windowDays).toBe(30)
  })

  it('[B26] createFunnel 所有步骤不同 eventType', () => {
    const { service } = ctx
    const result = service.createFunnel({
      tenantId: 't1',
      name: '多事件',
      steps: [
        mockStep('展现', 'PAGEVIEW'),
        mockStep('点击', 'CLICK'),
        mockStep('注册', 'CONVERSION'),
        mockStep('付费', 'PURCHASE'),
      ],
    })
    expect(result.funnel.steps[0].eventType).toBe('PAGEVIEW')
    expect(result.funnel.steps[3].eventType).toBe('PURCHASE')
  })
})
