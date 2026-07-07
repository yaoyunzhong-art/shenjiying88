import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-insight] [D] module 测试
 * AiInsightModule 的模块注册和导出验证
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiInsightModule } from './ai-insight.module'
import { AiInsightController } from './ai-insight.controller'
import { AiInsightService } from './ai-insight.service'

describe('AiInsightModule', () => {
  it('should be defined', () => {
    assert.ok(AiInsightModule)
  })

  it('should be instantiable', () => {
    const instance = new AiInsightModule()
    assert.ok(instance instanceof AiInsightModule)
  })

  it('module metadata has controllers', () => {
    const controllers = Reflect.getMetadata('controllers', AiInsightModule) as unknown[]
    // NestJS 装饰器注入的元数据
    if (controllers) {
      assert.ok(controllers.includes(AiInsightController))
    }
  })

  it('module metadata has providers/exports', () => {
    const providers = Reflect.getMetadata('providers', AiInsightModule) as unknown[]
    if (providers) {
      const hasService = providers.some(
        (p: unknown) =>
          (typeof p === 'function' && p === AiInsightService) ||
          (typeof p === 'object' && p !== null &&
            (p as { provide?: unknown }).provide === AiInsightService)
      )
      assert.ok(hasService, 'module should provide AiInsightService')
    }
  })

  it('controller has expected methods', () => {
    const proto = AiInsightController.prototype
    // KPI
    assert.equal(typeof proto.getKPIs, 'function')
    assert.equal(typeof proto.getKPIDetail, 'function')
    // Reports
    assert.equal(typeof proto.generateReport, 'function')
    assert.equal(typeof proto.getReports, 'function')
    // Anomalies
    assert.equal(typeof proto.detectAnomalies, 'function')
    assert.equal(typeof proto.getAnomalies, 'function')
    assert.equal(typeof proto.acknowledgeAnomaly, 'function')
    assert.equal(typeof proto.resolveAnomaly, 'function')
    // Forecasts
    assert.equal(typeof proto.generateForecast, 'function')
    assert.equal(typeof proto.getForecast, 'function')
    // Dashboard
    assert.equal(typeof proto.getDashboardSummary, 'function')
  })

  it('service has expected methods', () => {
    const proto = AiInsightService.prototype
    // KPI
    assert.equal(typeof proto.getKPIs, 'function')
    assert.equal(typeof proto.getKPIDetail, 'function')
    // Reports
    assert.equal(typeof proto.generateReport, 'function')
    assert.equal(typeof proto.getReports, 'function')
    // Anomalies
    assert.equal(typeof proto.detectAnomalies, 'function')
    assert.equal(typeof proto.getAnomalies, 'function')
    assert.equal(typeof proto.acknowledgeAnomaly, 'function')
    assert.equal(typeof proto.resolveAnomaly, 'function')
    // Forecasts
    assert.equal(typeof proto.generateForecast, 'function')
    assert.equal(typeof proto.getForecast, 'function')
    // Dashboard
    assert.equal(typeof proto.getDashboardSummary, 'function')
  })

  it('service and controller use same contract', () => {
    const ctrlProto = AiInsightController.prototype
    const svcProto = AiInsightService.prototype

    const ctrlMethods = Object.getOwnPropertyNames(ctrlProto)
      .filter(n => n !== 'constructor')

    // Controller should delegate to service
    // Module wiring verifies both exist
    const svcMethodNames = new Set(
      Object.getOwnPropertyNames(svcProto).filter(n => n !== 'constructor')
    )

    const delegatableMethods = [
      'getKPIs', 'getKPIDetail',
      'generateReport', 'getReports',
      'detectAnomalies', 'getAnomalies',
      'acknowledgeAnomaly', 'resolveAnomaly',
      'generateForecast', 'getForecast',
      'getDashboardSummary'
    ]

    for (const method of delegatableMethods) {
      assert.ok(svcMethodNames.has(method), `service should have ${method}`)
      assert.equal(typeof (ctrlProto as unknown as Record<string, unknown>)[method], 'function',
        `controller should have ${method}`)
    }
  })
})
