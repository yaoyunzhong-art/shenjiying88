import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [analytics-v2] [D] module.test 补全
 *
 * AnalyticsV2Module 元数据验证:
 *  - 控制器注册
 *  - providers 注册 (5 adapters + 4 engines + 4 services + controller)
 *  - exports 导出
 *  - 路由路径
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AnalyticsV2Controller } from './analytics-v2.controller'
import { AnalyticsV2Module } from './analytics-v2.module'
import { EventCollector } from './event-collector'
import { CDCStream } from './cdc-stream'
import { CohortAnalyzer } from './cohort-analyzer'
import { FunnelCalculator } from './funnel-calculator'
import { CohortService } from './services/cohort.service'
import { FunnelService } from './services/funnel.service'
import { RetentionService } from './services/retention.service'
import { MetricsService } from './services/metrics.service'
import { EventAdapter } from './datasources/event.adapter'
import { CDCAdapter } from './datasources/cdc.adapter'
import { CohortAdapter } from './datasources/cohort.adapter'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { RetentionAdapter } from './datasources/retention.adapter'

describe('AnalyticsV2Module', () => {
  it('正确注册控制器 AnalyticsV2Controller', () => {
    const controllers = Reflect.getMetadata('controllers', AnalyticsV2Module) as unknown[] | undefined
    assert.ok(controllers, '@Module controllers 元数据应存在')
    assert.ok(controllers!.includes(AnalyticsV2Controller), 'AnalyticsV2Controller 应在 controllers 中')
    assert.equal(controllers!.length, 1, '应只有 1 个控制器')
  })

  it('正确注册所有 providers', () => {
    const providers = Reflect.getMetadata('providers', AnalyticsV2Module) as unknown[] | undefined
    assert.ok(providers, '@Module providers 元数据应存在')
    const providedClasses = providers!.map((p) => (typeof p === 'function' ? p : null)).filter(Boolean)

    // 5 adapters
    assert.ok(providedClasses.includes(EventAdapter), 'EventAdapter 应注册')
    assert.ok(providedClasses.includes(CDCAdapter), 'CDCAdapter 应注册')
    assert.ok(providedClasses.includes(CohortAdapter), 'CohortAdapter 应注册')
    assert.ok(providedClasses.includes(FunnelAdapter), 'FunnelAdapter 应注册')
    assert.ok(providedClasses.includes(RetentionAdapter), 'RetentionAdapter 应注册')

    // 4 engines
    assert.ok(providedClasses.includes(EventCollector), 'EventCollector 应注册')
    assert.ok(providedClasses.includes(CDCStream), 'CDCStream 应注册')
    assert.ok(providedClasses.includes(CohortAnalyzer), 'CohortAnalyzer 应注册')
    assert.ok(providedClasses.includes(FunnelCalculator), 'FunnelCalculator 应注册')

    // 4 services
    assert.ok(providedClasses.includes(CohortService), 'CohortService 应注册')
    assert.ok(providedClasses.includes(FunnelService), 'FunnelService 应注册')
    assert.ok(providedClasses.includes(RetentionService), 'RetentionService 应注册')
    assert.ok(providedClasses.includes(MetricsService), 'MetricsService 应注册')

    // controller 也作为 provider
    assert.ok(providedClasses.includes(AnalyticsV2Controller), 'AnalyticsV2Controller 也应注册在 providers 中')

    // 总数: 5 adapters + 4 engines + 4 services + 1 controller = 14
    assert.equal(providedClasses.length, 14, 'providers 总数为 14')
  })

  it('正确注册 exports', () => {
    const exportsList = Reflect.getMetadata('exports', AnalyticsV2Module) as unknown[] | undefined
    assert.ok(exportsList, '@Module exports 元数据应存在')
    const exportedClasses = exportsList!.map((p) => (typeof p === 'function' ? p : null)).filter(Boolean)

    assert.ok(exportedClasses.includes(EventCollector), 'EventCollector 应导出')
    assert.ok(exportedClasses.includes(CDCStream), 'CDCStream 应导出')
    assert.ok(exportedClasses.includes(CohortService), 'CohortService 应导出')
    assert.ok(exportedClasses.includes(FunnelService), 'FunnelService 应导出')
    assert.ok(exportedClasses.includes(RetentionService), 'RetentionService 应导出')
    assert.ok(exportedClasses.includes(MetricsService), 'MetricsService 应导出')

    // 6 个导出
    assert.equal(exportedClasses.length, 6, 'exports 总数为 6')
  })

  it('非 adapters 不应在 exports 中', () => {
    const exportsList = Reflect.getMetadata('exports', AnalyticsV2Module) as unknown[] | undefined
    const exportedClasses = exportsList!.map((p) => (typeof p === 'function' ? p : null)).filter(Boolean)

    // adapters 是内部依赖，不应导出
    assert.ok(!exportedClasses.includes(EventAdapter), 'EventAdapter 不应导出')
    assert.ok(!exportedClasses.includes(CDCAdapter), 'CDCAdapter 不应导出')
    assert.ok(!exportedClasses.includes(CohortAdapter), 'CohortAdapter 不应导出')
    assert.ok(!exportedClasses.includes(FunnelAdapter), 'FunnelAdapter 不应导出')
    assert.ok(!exportedClasses.includes(RetentionAdapter), 'RetentionAdapter 不应导出')

    // engines 不应导出 (CDCStream 除外)
    assert.ok(!exportedClasses.includes(CohortAnalyzer), 'CohortAnalyzer 不应导出')
    assert.ok(!exportedClasses.includes(FunnelCalculator), 'FunnelCalculator 不应导出')
  })

  it('AnalyticsV2Controller 挂在 /analytics-v2', () => {
    const path = Reflect.getMetadata('path', AnalyticsV2Controller)
    assert.equal(path, 'analytics-v2', '控制器路径应为 analytics-v2')
  })

  it('AnalyticsV2Controller 暴露所有关键路由', () => {
    const proto = AnalyticsV2Controller.prototype as unknown as Record<string, unknown>
    const routes: Array<{ method: string; path: string }> = []
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue
      const member = proto[key] as object
      const method = Reflect.getMetadata('method', member)
      const path = Reflect.getMetadata('path', member)
      if (method !== undefined && path !== undefined) {
        routes.push({ method: String(method), path: String(path) })
      }
    }

    // POST 路由
    const postRoutes = routes.filter((r) => r.method === '1').map((r) => r.path)
    assert.ok(postRoutes.includes('event/collect'), '应有 POST event/collect')
    assert.ok(postRoutes.includes('event/batch'), '应有 POST event/batch')
    assert.ok(postRoutes.includes('cdc/apply'), '应有 POST cdc/apply')
    assert.ok(postRoutes.includes('cdc/replay'), '应有 POST cdc/replay')
    assert.ok(postRoutes.includes('cohort/register'), '应有 POST cohort/register')
    assert.ok(postRoutes.includes('cohort/track'), '应有 POST cohort/track')
    assert.ok(postRoutes.includes('funnel/create'), '应有 POST funnel/create')
    assert.ok(postRoutes.includes('retention/generate'), '应有 POST retention/generate')

    // GET 路由
    const getRoutes = routes.filter((r) => r.method === '0').map((r) => r.path)
    assert.ok(getRoutes.includes('event/recent'), '应有 GET event/recent')
    assert.ok(getRoutes.includes('cdc/tail'), '应有 GET cdc/tail')
    assert.ok(getRoutes.includes('cdc/status'), '应有 GET cdc/status')
    assert.ok(getRoutes.includes('cohort/list'), '应有 GET cohort/list')
    assert.ok(getRoutes.includes('cohort/matrix'), '应有 GET cohort/matrix')
    assert.ok(getRoutes.includes('cohort/reliability'), '应有 GET cohort/reliability')
    assert.ok(getRoutes.includes('funnel/list'), '应有 GET funnel/list')
    assert.ok(getRoutes.includes('funnel/template/default'), '应有 GET funnel/template/default')
    assert.ok(getRoutes.includes('retention/health'), '应有 GET retention/health')
    assert.ok(getRoutes.includes('retention/trend'), '应有 GET retention/trend')
    assert.ok(getRoutes.includes('metrics/summary'), '应有 GET metrics/summary')
    assert.ok(getRoutes.includes('metrics/live'), '应有 GET metrics/live')
    assert.ok(getRoutes.includes('metrics/health'), '应有 GET metrics/health')

    assert.equal(routes.length, 22, '应暴露 22 个路由 (11 POST + 11 GET)')
  })
})
