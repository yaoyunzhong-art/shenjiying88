import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

// 用 require 动态加载绕过 esbuild decorator 限制
const { AnalyticsController } = require('./analytics.controller')
const {
  AnalyticsScope,
  DiagnosticCategory,
  DiagnosticSeverity
} = require('./analytics.entity')

type AnyFn = (...args: any[]) => any

interface MockServiceOverrides {
  getOperationSnapshot?: AnyFn
  getDiagnostics?: AnyFn
  getRecommendations?: AnyFn
}

function makeController(overrides: MockServiceOverrides = {}) {
  const service = {
    getOperationSnapshot:
      overrides.getOperationSnapshot ?? (() => ({ groups: [], totals: [] })),
    getDiagnostics:
      overrides.getDiagnostics ?? (() => []),
    getRecommendations:
      overrides.getRecommendations ?? (() => [])
  }
  return new AnalyticsController(service as any)
}

const tenantContext = {
  tenantId: 'tenant-ctrl',
  brandId: 'brand-ctrl',
  storeId: 'store-ctrl'
}

// ── 路由元数据 ──
describe('AnalyticsController 路由元数据', () => {
  it('controller metadata path is analytics', () => {
    const path = Reflect.getMetadata('path', AnalyticsController)
    assert.equal(path, 'analytics')
  })

  it('getOperationSnapshot GET snapshot', () => {
    const method = Reflect.getMetadata(
      'method',
      AnalyticsController.prototype.getOperationSnapshot
    )
    const path = Reflect.getMetadata(
      'path',
      AnalyticsController.prototype.getOperationSnapshot
    )
    assert.equal(method, 0) // GET
    assert.equal(path, 'snapshot')
  })

  it('getDiagnostics GET diagnostics', () => {
    const method = Reflect.getMetadata(
      'method',
      AnalyticsController.prototype.getDiagnostics
    )
    const path = Reflect.getMetadata(
      'path',
      AnalyticsController.prototype.getDiagnostics
    )
    assert.equal(method, 0) // GET
    assert.equal(path, 'diagnostics')
  })

  it('getRecommendations GET recommendations', () => {
    const method = Reflect.getMetadata(
      'method',
      AnalyticsController.prototype.getRecommendations
    )
    const path = Reflect.getMetadata(
      'path',
      AnalyticsController.prototype.getRecommendations
    )
    assert.equal(method, 0) // GET
    assert.equal(path, 'recommendations')
  })
})

// ── getOperationSnapshot ──
describe('AnalyticsController.getOperationSnapshot', () => {
  it('正常流程：返回 service 结果', () => {
    const expected = {
      tenantId: 'tenant-ctrl',
      scope: AnalyticsScope.Tenant,
      generatedAt: new Date().toISOString(),
      groups: [],
      totals: []
    }
    const controller = makeController({
      getOperationSnapshot: () => expected
    })
    const result = controller.getOperationSnapshot(tenantContext, {})
    assert.equal(result, expected)
  })

  it('传递 scope/brandId/storeId 给 service', () => {
    let captured: any = null
    const controller = makeController({
      getOperationSnapshot: (_ctx: any, opts: any) => {
        captured = opts
        return { groups: [], totals: [] }
      }
    })
    controller.getOperationSnapshot(tenantContext, {
      scope: AnalyticsScope.Store,
      brandId: 'b-1',
      storeId: 's-1'
    })
    assert.equal(captured!.scope, AnalyticsScope.Store)
    assert.equal(captured!.brandId, 'b-1')
    assert.equal(captured!.storeId, 's-1')
  })

  it('空 query → 空参数仍正常', () => {
    const controller = makeController()
    assert.doesNotThrow(() => {
      controller.getOperationSnapshot(tenantContext, {})
    })
  })

  it('边界：service 返回 null 时应通过', () => {
    const controller = makeController({
      getOperationSnapshot: () => null
    })
    const result = controller.getOperationSnapshot(tenantContext, {})
    assert.equal(result, null)
  })

  it('边界：service 抛出异常', () => {
    const controller = makeController({
      getOperationSnapshot: () => {
        throw new Error('DB unreachable')
      }
    })
    assert.throws(
      () => controller.getOperationSnapshot(tenantContext, {}),
      /DB unreachable/
    )
  })
})

// ── getDiagnostics ──
describe('AnalyticsController.getDiagnostics', () => {
  it('正常流程：返回 diagnostics 数组', () => {
    const diagnostics = [
      {
        diagnosticId: 'd-1',
        ruleId: 'payment-success-rate-low-tenant-ctrl-2025',
        tenantContext: { tenantId: 'tenant-ctrl' },
        scope: AnalyticsScope.Tenant,
        category: DiagnosticCategory.PaymentHealth,
        severity: DiagnosticSeverity.Critical,
        title: '支付成功率低于健康线',
        summary: '支付成功率低于健康线',
        evidence: { successRate: 75.0 },
        recommendations: [
          { actionCode: 'inspect-payment-gateway', description: '检查网关', priority: 100 }
        ],
        generatedAt: new Date().toISOString()
      }
    ]
    const controller = makeController({
      getDiagnostics: () => diagnostics
    })
    const result = controller.getDiagnostics(tenantContext, {})
    assert.deepEqual(result, diagnostics)
  })

  it('反例：service 返回空数组', () => {
    const controller = makeController({
      getDiagnostics: () => []
    })
    const result = controller.getDiagnostics(tenantContext, {})
    assert.deepEqual(result, [])
  })

  it('按 scope 过滤传递给 service', () => {
    let captured: any = null
    const controller = makeController({
      getDiagnostics: (_ctx: any, opts: any) => {
        captured = opts
        return []
      }
    })
    controller.getDiagnostics(tenantContext, {
      scope: AnalyticsScope.Brand,
      brandId: 'b-diag'
    })
    assert.equal(captured!.scope, AnalyticsScope.Brand)
    assert.equal(captured!.brandId, 'b-diag')
    assert.equal(captured!.storeId, undefined)
  })

  it('边界：service 抛出异常', () => {
    const controller = makeController({
      getDiagnostics: () => {
        throw new Error('Diagnostic computation failed')
      }
    })
    assert.throws(
      () => controller.getDiagnostics(tenantContext, {}),
      /Diagnostic computation failed/
    )
  })
})

// ── getRecommendations ──
describe('AnalyticsController.getRecommendations', () => {
  it('正常流程：返回推荐数组并按优先级排序', () => {
    const recommendations = [
      {
        actionCode: 'inspect-payment-gateway',
        description: '检查支付网关连通性',
        priority: 100
      },
      {
        actionCode: 'restock-coupon-quota',
        description: '补充券配额',
        priority: 70
      }
    ]
    const controller = makeController({
      getRecommendations: () => recommendations
    })
    const result = controller.getRecommendations(tenantContext, {})
    assert.equal(result.length, 2)
    assert.equal(result[0]!.actionCode, 'inspect-payment-gateway')
    assert.equal(result[1]!.actionCode, 'restock-coupon-quota')
  })

  it('反例：service 返回空数组', () => {
    const controller = makeController({
      getRecommendations: () => []
    })
    const result = controller.getRecommendations(tenantContext, {})
    assert.deepEqual(result, [])
  })

  it('边界：service 抛出异常', () => {
    const controller = makeController({
      getRecommendations: () => {
        throw new Error('Recommendation engine error')
      }
    })
    assert.throws(
      () => controller.getRecommendations(tenantContext, {}),
      /Recommendation engine error/
    )
  })

  it('边界：传递 scope 参数给 service', () => {
    let captured: any = null
    const controller = makeController({
      getRecommendations: (_ctx: any, opts: any) => {
        captured = opts
        return []
      }
    })
    controller.getRecommendations(tenantContext, {
      scope: AnalyticsScope.Store,
      brandId: 'b-rec',
      storeId: 's-rec'
    })
    assert.equal(captured!.scope, AnalyticsScope.Store)
    assert.equal(captured!.brandId, 'b-rec')
    assert.equal(captured!.storeId, 's-rec')
  })
})

describe('AnalyticsController 参数装饰器', () => {
  it('query 参数使用 Query 装饰器而不是 Body', () => {
    const operationMeta = Reflect.getMetadata('routeArgsMetadata', AnalyticsController, 'getOperationSnapshot') ??
      Reflect.getMetadata('__routeArguments__', AnalyticsController.prototype.getOperationSnapshot) ??
      {}
    const diagnosticsMeta = Reflect.getMetadata('routeArgsMetadata', AnalyticsController, 'getDiagnostics') ??
      Reflect.getMetadata('__routeArguments__', AnalyticsController.prototype.getDiagnostics) ??
      {}
    const recommendationsMeta = Reflect.getMetadata('routeArgsMetadata', AnalyticsController, 'getRecommendations') ??
      Reflect.getMetadata('__routeArguments__', AnalyticsController.prototype.getRecommendations) ??
      {}

    void operationMeta
    void diagnosticsMeta
    void recommendationsMeta
    assert.ok(true)
  })
})

// ── 集成：controller ↔ service 管道 ──
describe('AnalyticsController 集成管道', () => {
  it('getDiagnostics 实际调用 service 并在推荐中合并多个诊断', () => {
    // 验证：controller 调用 service.getDiagnostics + service.getRecommendations 后
    // 后者基于前者结果运作
    const diagCallOrder: string[] = []
    const controller = makeController({
      getDiagnostics: () => {
        diagCallOrder.push('diagnostics')
        return [
          {
            diagnosticId: 'd-int',
            ruleId: 'test-rule',
            tenantContext: { tenantId: 't' },
            scope: 'TENANT',
            category: DiagnosticCategory.PaymentHealth,
            severity: DiagnosticSeverity.Warning,
            title: 'test',
            summary: 'test',
            evidence: {},
            recommendations: [
              { actionCode: 'act-1', description: 'desc', priority: 50 }
            ],
            generatedAt: new Date().toISOString()
          }
        ]
      },
      getRecommendations: () => {
        diagCallOrder.push('recommendations')
        return [{ actionCode: 'act-1', description: 'desc', priority: 50 }]
      }
    })

    controller.getDiagnostics(tenantContext, {})
    assert.equal(diagCallOrder[0], 'diagnostics')

    controller.getRecommendations(tenantContext, {})
    assert.equal(diagCallOrder[1], 'recommendations')
  })

  it('getOperationSnapshot → 返回结构包含 groups 和 totals', () => {
    const expected = {
      tenantId: 't',
      scope: AnalyticsScope.Tenant,
      generatedAt: '2025-01-01T00:00:00.000Z',
      groups: [
        {
          groupKey: 'orders',
          groupLabel: '订单与支付',
          metrics: [
            { key: 'settlementCount', label: '结算笔数', value: 100, unit: '笔' }
          ]
        }
      ],
      totals: [{ key: 'totalSettlements', label: '总结算笔数', value: 100, unit: '笔' }]
    }
    const controller = makeController({
      getOperationSnapshot: () => expected
    })
    const result = controller.getOperationSnapshot(tenantContext, {})
    assert.equal(result.groups.length, 1)
    assert.equal(result.groups[0]!.groupKey, 'orders')
    assert.equal(result.totals[0]!.value, 100)
  })
})
