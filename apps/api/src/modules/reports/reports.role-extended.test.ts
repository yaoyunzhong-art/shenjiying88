import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 8角色视角·Reports报表模块扩展角色测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReportCacheService } from './report-cache.service'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
import { ReportAggregationService } from './report-aggregation.service'
import type { ReportRow, ReportResult, ReportDimension, ReportMetric, ReportType } from './reports.entity'

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.TenantAdmin} 报表中心角色测试`, () => {
  it('店长可使用缓存服务', () => {
    const cache = new ReportCacheService()
    const testResult: ReportResult = { type: 'revenue', tenantId: 't-admin', period: { from: '2026-06-01', to: '2026-06-30' }, columns: [{ field: 'amount', alias: '金额', type: 'metric' }], rows: [{ amount: 100 }], generatedAt: new Date().toISOString(), cached: false }
    cache.set('admin:daily', testResult)
    const got = cache.get('admin:daily')
    assert.ok(got)
    assert.equal(got.tenantId, 't-admin')
  })

  it('店长可创建批量导出任务', async () => {
    const querySvc = new ReportQueryService()
    const exportSvc = new ReportExportService(querySvc)
    const task = await exportSvc.createBatchExportTask({
      type: 'revenue', tenantId: 't-admin',
      period: { from: '2026-01-01', to: '2026-06-30' }, format: 'json',
    })
    assert.ok(task.taskId)
    assert.equal(task.tenantId, 't-admin')
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.Reception} 报表中心角色测试`, () => {
  it('前台可导出CSV报表', () => {
    const querySvc = new ReportQueryService()
    const exportSvc = new ReportExportService(querySvc)
    const csv = exportSvc.toCSV({
      type: 'revenue', tenantId: 't-reception',
      columns: [{ field: 'amount', alias: '金额', type: 'metric' }],
      rows: [{ amount: 1000 }, { amount: 2000 }],
      period: { from: '2026-06-01', to: '2026-06-30' },
      generatedAt: new Date().toISOString(), cached: false,
    })
    assert.ok(csv.includes('金额'))
    assert.ok(csv.includes('1000'))
  })

  it('前台可查导出任务状态', async () => {
    const querySvc = new ReportQueryService()
    const exportSvc = new ReportExportService(querySvc)
    const task = await exportSvc.createBatchExportTask({
      type: 'member', tenantId: 't-reception',
      period: { from: '2026-06-01', to: '2026-06-30' }, format: 'csv',
    })
    const got = exportSvc.getExportTask(task.taskId, 't-reception')
    assert.ok(got)
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} 报表中心角色测试`, () => {
  it('HR可使用缓存系统', () => {
    const cache = new ReportCacheService()
    const testResult: ReportResult = { type: 'revenue', tenantId: 't-hr', period: { from: '2026-06-01', to: '2026-06-30' }, columns: [{ field: 'count', alias: '数量', type: 'metric' }], rows: [{ count: 42 }], generatedAt: new Date().toISOString(), cached: false }
    cache.set('hr:report', testResult)
    const got = cache.get('hr:report')
    assert.ok(got)
    assert.equal(got.rows[0].count, 42)
  })

  it('HR可创建批量导出任务', async () => {
    const querySvc = new ReportQueryService()
    const exportSvc = new ReportExportService(querySvc)
    const task = await exportSvc.createBatchExportTask({
      type: 'revenue', tenantId: 't-hr',
      period: { from: '2026-01-01', to: '2026-06-30' }, format: 'csv',
    })
    assert.ok(task.taskId)
    assert.equal(task.tenantId, 't-hr')
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} 报表中心角色测试`, () => {
  it('安监可缓存报表', () => {
    const cache = new ReportCacheService()
    const testResult: ReportResult = { type: 'revenue', tenantId: 't-safety', period: { from: '2026-06-01', to: '2026-06-30' }, columns: [{ field: 'status', alias: '状态', type: 'dimension' }], rows: [{ status: 'cached' }], generatedAt: new Date().toISOString(), cached: false }
    cache.set('safety:revenue', testResult)
    const cached = cache.get('safety:revenue')
    assert.ok(cached)
    assert.equal(cached.type, 'revenue')
  })

  it('安监可使缓存失效', () => {
    const cache = new ReportCacheService()
    const testResult: ReportResult = { type: 'revenue', tenantId: 't-safety', period: { from: '2026-06-01', to: '2026-06-30' }, columns: [{ field: 'count', alias: '数量', type: 'metric' }], rows: [{ count: 1 }], generatedAt: new Date().toISOString(), cached: false }
    cache.set('safety:key', testResult)
    cache.clear()
    assert.equal(cache.get('safety:key'), null)
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} 报表中心角色测试`, () => {
  it('导玩员可查询报表DSL', () => {
    const querySvc = new ReportQueryService()
    const dsl = querySvc.parse('order', {})
    assert.ok(dsl !== undefined)
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} 报表中心角色测试`, () => {
  it('运行专员可聚合报表数据', () => {
    const svc = new ReportAggregationService()
    const rows = [
      { tenant: 't-ops', amount: 100, createdAt: '2026-06-01' },
      { tenant: 't-ops', amount: 200, createdAt: '2026-06-02' },
    ]
    const dims: ReportDimension[] = [{ field: 'createdAt', granularity: 'day', alias: '日期' }]
    const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: '合计' }]
    const result = svc.aggregate(rows, dims, metrics)
    assert.ok(Array.isArray(result))
    assert.ok(result.length > 0)
  })

  it('运行专员可清空缓存', () => {
    const cache = new ReportCacheService()
    const testResult: ReportResult = { type: 'revenue', tenantId: 't-ops', period: { from: '2026-06-01', to: '2026-06-30' }, columns: [{ field: 'count', alias: '数量', type: 'metric' }], rows: [{ count: 42 }], generatedAt: new Date().toISOString(), cached: false }
    cache.set('ops:test', testResult)
    cache.clear()
    const after = cache.get('ops:test')
    assert.equal(after, null)
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} 报表中心角色测试`, () => {
  it('团建可使用缓存系统', () => {
    const cache = new ReportCacheService()
    const testResult: ReportResult = { type: 'revenue', tenantId: 't-team', period: { from: '2026-06-01', to: '2026-06-30' }, columns: [{ field: 'activity', alias: '活动', type: 'dimension' }], rows: [{ activity: '团建' }], generatedAt: new Date().toISOString(), cached: false }
    cache.set('team:report', testResult)
    const got = cache.get('team:report')
    assert.ok(got)
    assert.equal(String(got.rows[0].activity), '团建')
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} 报表中心角色测试`, () => {
  it('营销可生成JSON导出', () => {
    const querySvc = new ReportQueryService()
    const exportSvc = new ReportExportService(querySvc)
    const json = exportSvc.toJSON({
      type: 'revenue', tenantId: 't-mkt',
      columns: [{ field: 'roi', alias: 'ROI', type: 'metric' }],
      rows: [{ roi: 3.5 }],
      period: { from: '2026-06-01', to: '2026-06-30' },
      generatedAt: new Date().toISOString(), cached: false,
    })
    const parsed = JSON.parse(json)
    assert.equal(parsed.tenantId, 't-mkt')
  })

  it('营销可查询导出任务列表', () => {
    const querySvc = new ReportQueryService()
    const exportSvc = new ReportExportService(querySvc)
    const tasks = exportSvc.listExportTasks()
    assert.ok(Array.isArray(tasks))
  })
})
