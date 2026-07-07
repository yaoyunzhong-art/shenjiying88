import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// report.module.test.ts - Phase-39 T169
// 用途: Report Module 集成测试
import assert from 'node:assert/strict'
import { ReportModule } from './report.module'
import { ReportController } from './report.controller'
import { ReportService } from './report.service'
import { ReportAggregationService } from './report-aggregation.service'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'

it('ReportModule exposes controller, providers, and exports', () => {
  // imports is undefined because @Module has no imports array (self-contained module)
  const controllers = Reflect.getMetadata('controllers', ReportModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', ReportModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', ReportModule) as unknown[] | undefined

  assert.ok(Array.isArray(controllers), 'controllers should be an array')
  assert.ok(Array.isArray(providers), 'providers should be an array')
  assert.ok(Array.isArray(exportsList), 'exports should be an array')

  // Controller wiring
  assert.ok(controllers?.includes(ReportController), 'ReportController should be registered')

  // Core providers
  assert.ok(providers?.includes(ReportService), 'ReportService should be a provider')
  assert.ok(providers?.includes(ReportAggregationService), 'ReportAggregationService should be a provider')
  assert.ok(providers?.includes(ReportCacheService), 'ReportCacheService should be a provider')
  assert.ok(providers?.includes(ReportExportService), 'ReportExportService should be a provider')
  assert.ok(providers?.includes(ReportQueryService), 'ReportQueryService should be a provider')

  // Exported services
  assert.ok(exportsList?.includes(ReportService), 'ReportService should be exported')
  assert.ok(exportsList?.includes(ReportAggregationService), 'ReportAggregationService should be exported')
  assert.ok(exportsList?.includes(ReportCacheService), 'ReportCacheService should be exported')
  assert.ok(exportsList?.includes(ReportExportService), 'ReportExportService should be exported')
  assert.ok(exportsList?.includes(ReportQueryService), 'ReportQueryService should be exported')
})

it('ReportModule has at least 18 providers registered', () => {
  const providers = Reflect.getMetadata('providers', ReportModule) as unknown[]
  assert.ok(providers.length >= 18, `Expected >=18 providers, got ${providers.length}`)
})

it('ReportModule provider count and names match module definition', () => {
  const providers = Reflect.getMetadata('providers', ReportModule) as unknown[]
  const providerNames = providers.map(p => typeof p === 'function' ? p.name : String(p))

  // 20 providers total: 1 service + 4 core + 5 adapters + 10 report services
  assert.equal(providerNames.length, 20, `Expected 20 providers, got ${providerNames.length}`)

  const expectedReportServices = [
    'RevenueReportService',
    'InventoryTurnoverService',
    'MemberGrowthService',
    'RefundRateService',
    'OrderConversionService',
    'ProductRankingService',
    'PaymentMixService',
    'HourlyHeatmapService',
    'ChannelFunnelService',
    'InventoryAlertService',
  ]
  for (const svc of expectedReportServices) {
    assert.ok(providerNames.includes(svc), `${svc} should be a provider`)
  }

  // Adapter providers
  const expectedAdapters = [
    'OrderAdapter',
    'PaymentAdapter',
    'RefundAdapter',
    'MemberAdapter',
    'InventoryAdapter',
  ]
  for (const adapter of expectedAdapters) {
    assert.ok(providerNames.includes(adapter), `${adapter} should be a provider`)
  }
})

it('ReportModule has no imports (self-contained design)', () => {
  // NestJS omits metadata for empty arrays, so undefined is acceptable
  const imports = Reflect.getMetadata('imports', ReportModule) as unknown[] | undefined
  assert.ok(imports === undefined || imports.length === 0,
    'ReportModule should have no imports (self-contained)')
})
