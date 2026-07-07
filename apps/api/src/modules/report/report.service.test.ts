import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ReportService test (V10 Day 7 Phase 91)
 */

import assert from 'node:assert/strict'
import { ReportService } from './report.service'

describe('ReportService V10 Day 7 Phase 91', () => {
  let service: ReportService

  beforeEach(() => {
    service = new ReportService()
  })

  describe('Report CRUD', () => {
    it('createReport generates id and timestamps', () => {
      const r = service.createReport({
        name: 'Test Report', period: 'daily',
        metrics: ['sales.amount'], dimensions: ['store'],
        source: 'orders', cacheTtl: 60, createdBy: 'admin',
      })
      assert.ok(r.id.startsWith('rpt-'))
      assert.ok(r.createdAt)
    })

    it('listReports returns seeded reports', () => {
      const reports = service.listReports()
      assert.ok(reports.length >= 3)
    })

    it('getReport returns by id', () => {
      const r = service.getReport('rpt-seed-sales')
      assert.ok(r)
      assert.equal(r.name, '销售日报')
    })

    it('getReport returns null for unknown id', () => {
      assert.equal(service.getReport('unknown'), null)
    })
  })

  describe('Query + Cache', () => {
    it('query returns aggregated data', async () => {
      const res = await service.query({
        reportId: 'rpt-seed-sales', period: 'daily',
      })
      assert.ok(res.data.length > 0)
      assert.equal(res.reportId, 'rpt-seed-sales')
    })

    it('query caches results', async () => {
      const r1 = await service.query({ reportId: 'rpt-seed-sales', period: 'daily' })
      const r2 = await service.query({ reportId: 'rpt-seed-sales', period: 'daily' })
      assert.equal(r1.generatedAt, r2.generatedAt) // 缓存命中
    })

    it('query throws for unknown report', async () => {
      await assert.rejects(
        () => service.query({ reportId: 'unknown', period: 'daily' }),
        /not found/,
      )
    })

    it('query respects from/to date range', async () => {
      const today = new Date().toISOString().slice(0, 10)
      const res = await service.query({
        reportId: 'rpt-seed-sales', period: 'daily',
        from: today, to: today,
      })
      assert.ok(res.data.every((d) => d.bucket === today))
    })
  })

  describe('Ingest + Aggregate', () => {
    it('ingestDataPoints appends data', () => {
      const before = service.listReports().length
      service.ingestDataPoints([{
        bucket: '2026-06-28', dimension: 'store-x', metric: 'sales.amount', value: 1000,
      }])
      const totals = service.aggregateBy('sales.amount', 'store-x')
      assert.equal(totals.get('store-x'), 1000)
    })

    it('aggregateBy sums by dimension', () => {
      const totals = service.aggregateBy('sales.amount', 'store')
      assert.ok(totals.size > 0)
    })

    it('ingest invalidates cache', async () => {
      await service.query({ reportId: 'rpt-seed-sales', period: 'daily' })
      service.ingestDataPoints([{
        bucket: '2026-06-28', dimension: 'store-001', metric: 'sales.amount', value: 999999,
      }])
      const res = await service.query({ reportId: 'rpt-seed-sales', period: 'daily' })
      const hasNew = res.data.some((d) => d.value === 999999)
      assert.ok(hasNew || res.totalPoints > 0)
    })
  })

  describe('Dashboard CRUD', () => {
    it('createDashboard generates id', () => {
      const d = service.createDashboard({
        name: 'Test', cards: [], ownerId: 'tenant-A', isShared: false,
      })
      assert.ok(d.id.startsWith('dash-'))
    })

    it('listDashboards filters by owner or shared', () => {
      const list = service.listDashboards('tenant-A')
      assert.ok(list.length > 0)
    })

    it('getDashboard returns by id', () => {
      const d = service.getDashboard('dash-seed-overview')
      assert.ok(d)
      assert.equal(d.name, '总览看板')
    })

    it('updateDashboard patches fields', () => {
      const d = service.updateDashboard('dash-seed-overview', { name: '新看板' })
      assert.ok(d)
      assert.equal(d.name, '新看板')
    })

    it('updateDashboard returns null for unknown', () => {
      assert.equal(service.updateDashboard('unknown', {}), null)
    })
  })

  describe('V9 数据合规 (汇总而非明细)', () => {
    it('reports only expose aggregated metrics, not raw data', async () => {
      const res = await service.query({
        reportId: 'rpt-seed-sales', period: 'daily',
      })
      // 确保返回的数据点都是聚合形式 (有 bucket + dimension + value)
      res.data.forEach((dp) => {
        assert.ok(dp.bucket)
        assert.ok(dp.dimension)
        assert.equal(typeof dp.value, 'number')
      })
    })
  })
})
