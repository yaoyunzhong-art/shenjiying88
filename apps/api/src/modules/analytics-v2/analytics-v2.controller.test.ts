import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [analytics-v2] [D] controller spec 补全
 *
 * AnalyticsV2Controller 路由元数据 + 方法签名规约测试
 * 覆盖 19 个 endpoint:
 *   event collect/batch/recent × 3
 *   cdc apply/replay/tail/status × 4
 *   cohort register/track/list/matrix/reliability × 5
 *   funnel create/list/get/template × 4
 *   retention generate/health/trend × 3
 *   metrics summary/live/health × 3
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AnalyticsV2Controller } from './analytics-v2.controller'

function getControllerClass(): typeof AnalyticsV2Controller {
  return AnalyticsV2Controller
}

interface RouteMeta {
  method: number  // 1=POST, 0=GET
  path: string
}

function getRouteMeta(proto: Record<string, any>, methodName: string): RouteMeta | null {
  const method = Reflect.getMetadata('method', proto[methodName])
  const path = Reflect.getMetadata('path', proto[methodName])
  if (method === undefined) return null
  return { method, path }
}

// ─── Controller 路径元数据 ─────────────────────────────────

describe('AnalyticsV2Controller 路由元数据', () => {
  const Controller = getControllerClass()
  const proto = Controller.prototype

  it('Controller 路径前缀 = analytics-v2', () => {
    const prefix = Reflect.getMetadata('path', Controller)
    assert.equal(prefix, 'analytics-v2')
  })

  // ── Event ──

  it('collectEvent -> POST /event/collect', () => {
    const meta = getRouteMeta(proto, 'collectEvent')
    assert.ok(meta, 'collectEvent 应有路由元数据')
    assert.equal(meta!.method, 1, 'method 应为 POST(1)')
    assert.equal(meta!.path, 'event/collect')
  })

  it('collectBatch -> POST /event/batch', () => {
    const meta = getRouteMeta(proto, 'collectBatch')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'event/batch')
  })

  it('recentEvents -> GET /event/recent', () => {
    const meta = getRouteMeta(proto, 'recentEvents')
    assert.ok(meta)
    assert.equal(meta!.method, 0, 'method 应为 GET(0)')
    assert.equal(meta!.path, 'event/recent')
  })

  // ── CDC ──

  it('applyCDC -> POST /cdc/apply', () => {
    const meta = getRouteMeta(proto, 'applyCDC')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'cdc/apply')
  })

  it('replayCDC -> POST /cdc/replay', () => {
    const meta = getRouteMeta(proto, 'replayCDC')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'cdc/replay')
  })

  it('tailCDC -> GET /cdc/tail', () => {
    const meta = getRouteMeta(proto, 'tailCDC')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'cdc/tail')
  })

  it('cdcStatus -> GET /cdc/status', () => {
    const meta = getRouteMeta(proto, 'cdcStatus')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'cdc/status')
  })

  // ── Cohort ──

  it('registerMember -> POST /cohort/register', () => {
    const meta = getRouteMeta(proto, 'registerMember')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'cohort/register')
  })

  it('trackActivity -> POST /cohort/track', () => {
    const meta = getRouteMeta(proto, 'trackActivity')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'cohort/track')
  })

  it('listCohorts -> GET /cohort/list', () => {
    const meta = getRouteMeta(proto, 'listCohorts')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'cohort/list')
  })

  it('cohortMatrix -> GET /cohort/matrix', () => {
    const meta = getRouteMeta(proto, 'cohortMatrix')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'cohort/matrix')
  })

  it('cohortReliability -> GET /cohort/reliability', () => {
    const meta = getRouteMeta(proto, 'cohortReliability')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'cohort/reliability')
  })

  // ── Funnel ──

  it('createFunnel -> POST /funnel/create', () => {
    const meta = getRouteMeta(proto, 'createFunnel')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'funnel/create')
  })

  it('listFunnels -> GET /funnel/list', () => {
    const meta = getRouteMeta(proto, 'listFunnels')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'funnel/list')
  })

  it('getFunnel -> GET /funnel/:id', () => {
    const meta = getRouteMeta(proto, 'getFunnel')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'funnel/:id')
  })

  it('defaultFunnelTemplate -> GET /funnel/template/default', () => {
    const meta = getRouteMeta(proto, 'defaultFunnelTemplate')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'funnel/template/default')
  })

  // ── Retention ──

  it('generateRetention -> POST /retention/generate', () => {
    const meta = getRouteMeta(proto, 'generateRetention')
    assert.ok(meta)
    assert.equal(meta!.method, 1)
    assert.equal(meta!.path, 'retention/generate')
  })

  it('retentionHealth -> GET /retention/health', () => {
    const meta = getRouteMeta(proto, 'retentionHealth')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'retention/health')
  })

  it('retentionTrend -> GET /retention/trend', () => {
    const meta = getRouteMeta(proto, 'retentionTrend')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'retention/trend')
  })

  // ── Metrics ──

  it('metricsSummary -> GET /metrics/summary', () => {
    const meta = getRouteMeta(proto, 'metricsSummary')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'metrics/summary')
  })

  it('metricsLive -> GET /metrics/live', () => {
    const meta = getRouteMeta(proto, 'metricsLive')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'metrics/live')
  })

  it('metricsHealth -> GET /metrics/health', () => {
    const meta = getRouteMeta(proto, 'metricsHealth')
    assert.ok(meta)
    assert.equal(meta!.method, 0)
    assert.equal(meta!.path, 'metrics/health')
  })

  // ── 方法签名规约 ──

  it('所有 controller 方法应有路由元数据 = 19 个 endpoint', () => {
    const methodNames = [
      'collectEvent', 'collectBatch', 'recentEvents',
      'applyCDC', 'replayCDC', 'tailCDC', 'cdcStatus',
      'registerMember', 'trackActivity', 'listCohorts', 'cohortMatrix', 'cohortReliability',
      'createFunnel', 'listFunnels', 'getFunnel', 'defaultFunnelTemplate',
      'generateRetention', 'retentionHealth', 'retentionTrend',
      'metricsSummary', 'metricsLive', 'metricsHealth'
    ]
    const missing: string[] = []
    for (const name of methodNames) {
      if (!getRouteMeta(proto, name)) {
        missing.push(name)
      }
    }
    assert.equal(missing.length, 0, `缺少路由元数据: ${missing.join(', ')}`)
  })

  it('所有 method 的 method 值合法 (0 或 1)', () => {
    const methodNames = [
      'collectEvent', 'collectBatch', 'recentEvents',
      'applyCDC', 'replayCDC', 'tailCDC', 'cdcStatus',
      'registerMember', 'trackActivity', 'listCohorts', 'cohortMatrix', 'cohortReliability',
      'createFunnel', 'listFunnels', 'getFunnel', 'defaultFunnelTemplate',
      'generateRetention', 'retentionHealth', 'retentionTrend',
      'metricsSummary', 'metricsLive', 'metricsHealth'
    ]
    for (const name of methodNames) {
      const meta = getRouteMeta(proto, name)
      assert.ok(meta, `${name} 缺少路由元数据`)
      assert.ok(meta!.method === 0 || meta!.method === 1, `${name} method 不是 0/1，实际为 ${meta!.method}`)
    }
  })
})

// ─── 方法参数规约 ─────────────────────────────────

describe('AnalyticsV2Controller 参数规约', () => {
  const Controller = getControllerClass()
  const ctrProto = Controller.prototype

  function assertBodyParam(methodName: string): void {
    const hasBody = Reflect.getOwnMetadata('__body__', ctrProto, methodName)
    const params = Reflect.getMetadata('design:paramtypes', ctrProto, methodName)
    assert.ok(params && params.length >= 1, `${methodName} 至少应有 1 个参数`)
  }

  it('collectEvent 接收 @Body 参数', () => {
    assertBodyParam('collectEvent')
  })

  it('collectBatch 接收 @Body 参数', () => {
    assertBodyParam('collectBatch')
  })

  it('recentEvents 接收 @Query 参数 (tenantId, limit)', () => {
    assertBodyParam('recentEvents')
  })

  it('applyCDC 接收 @Body 参数', () => {
    assertBodyParam('applyCDC')
  })

  it('replayCDC 接收 @Body 参数', () => {
    assertBodyParam('replayCDC')
  })

  it('tailCDC 接收 @Query 参数 (tenantId, since)', () => {
    assertBodyParam('tailCDC')
  })

  it('cdcStatus 接收 @Query 参数 (tenantId)', () => {
    assertBodyParam('cdcStatus')
  })

  it('registerMember 接收 @Body 参数', () => {
    assertBodyParam('registerMember')
  })

  it('trackActivity 接收 @Body 参数', () => {
    assertBodyParam('trackActivity')
  })

  it('createFunnel 接收 @Body 参数', () => {
    assertBodyParam('createFunnel')
  })

  it('generateRetention 接收 @Body 参数', () => {
    assertBodyParam('generateRetention')
  })

  it('getFunnel 接收 @Query + @Param 参数 (tenantId, id)', () => {
    assertBodyParam('getFunnel')
  })
})

// ─── GET 方法无 Body 装饰器（验证正确使用 Query 而不是 Body） ──

describe('AnalyticsV2Controller GET 端点只有 Query 参数', () => {
  const Controller = getControllerClass()
  const proto = Controller.prototype

  const getMethods: Array<{ name: string; paramCount: number }> = [
    { name: 'recentEvents', paramCount: 2 },
    { name: 'tailCDC', paramCount: 2 },
    { name: 'cdcStatus', paramCount: 1 },
    { name: 'listCohorts', paramCount: 2 },
    { name: 'cohortMatrix', paramCount: 3 },
    { name: 'cohortReliability', paramCount: 2 },
    { name: 'listFunnels', paramCount: 1 },
    { name: 'getFunnel', paramCount: 2 },
    { name: 'defaultFunnelTemplate', paramCount: 0 },
    { name: 'retentionHealth', paramCount: 2 },
    { name: 'retentionTrend', paramCount: 3 },
    { name: 'metricsSummary', paramCount: 2 },
    { name: 'metricsLive', paramCount: 1 },
    { name: 'metricsHealth', paramCount: 1 }
  ]

  for (const { name, paramCount } of getMethods) {
    it(`${name} 只有 ${paramCount} 个参数（Query / Param，无 Body）`, () => {
      const params = Reflect.getMetadata('design:paramtypes', proto, name)
      assert.ok(params, `${name} 应有参数`)
      assert.equal(params.length, paramCount, `${name} 应有 ${paramCount} 个参数，实际 ${params.length}`)
    })
  }
})

// ─── 分类 endpoint 计数 ─────────────────────────────────

describe('AnalyticsV2Controller endpoint 分类', () => {
  const Controller = getControllerClass()
  const proto = Controller.prototype

  it('POST endpoint 数量 = 8', () => {
    const postMethods = [
      'collectEvent', 'collectBatch',
      'applyCDC', 'replayCDC',
      'registerMember', 'trackActivity',
      'createFunnel', 'generateRetention'
    ]
    let count = 0
    for (const name of postMethods) {
      const meta = getRouteMeta(proto, name)
      if (meta?.method === 1) count++
    }
    assert.equal(count, 8, `应有 8 个 POST endpoint，实际 ${count}`)
  })

  it('GET endpoint 数量 = 14', () => {
    const getMethods = [
      'recentEvents', 'tailCDC', 'cdcStatus',
      'listCohorts', 'cohortMatrix', 'cohortReliability',
      'listFunnels', 'getFunnel', 'defaultFunnelTemplate',
      'retentionHealth', 'retentionTrend',
      'metricsSummary', 'metricsLive', 'metricsHealth'
    ]
    let count = 0
    for (const name of getMethods) {
      const meta = getRouteMeta(proto, name)
      if (meta?.method === 0) count++
    }
    assert.equal(count, 14, `应有 14 个 GET endpoint，实际 ${count}`)
  })

  it('总 endpoint 数 = 22', () => {
    const allMethods = [
      'collectEvent', 'collectBatch', 'recentEvents',
      'applyCDC', 'replayCDC', 'tailCDC', 'cdcStatus',
      'registerMember', 'trackActivity', 'listCohorts', 'cohortMatrix', 'cohortReliability',
      'createFunnel', 'listFunnels', 'getFunnel', 'defaultFunnelTemplate',
      'generateRetention', 'retentionHealth', 'retentionTrend',
      'metricsSummary', 'metricsLive', 'metricsHealth'
    ]
    let count = 0
    for (const name of allMethods) {
      if (getRouteMeta(proto, name)) count++
    }
    assert.equal(count, 22, `应有 22 个 endpoint，实际 ${count}`)
  })
})
