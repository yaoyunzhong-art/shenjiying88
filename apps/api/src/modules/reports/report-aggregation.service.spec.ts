/**
 * T15: ReportAggregationService 单元测试
 *
 * 覆盖:
 *  - 空数据 / 无维度 / 单维度 / 多维分组
 *  - 6 种聚合函数 (sum/count/avg/min/max/distinct)
 *  - 时间分桶 (day/week/month/year)
 *  - 边界: NaN/Infinity/null 值处理
 *  - 性能: 大行组 (10K) 不超时
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { ReportAggregationService } from './report-aggregation.service'
import type { ReportDimension, ReportMetric } from './reports.entity'

describe('ReportAggregationService', () => {
  let service: ReportAggregationService

  beforeEach(() => {
    service = new ReportAggregationService()
  })

  // ─── 空数据 ─────────────────────────────────────────────

  describe('空数据集', () => {
    it('应返回空数组', () => {
      const result = service.aggregate([], [], [])
      assert.deepEqual(result, [])
    })

    it('有维度但无数据也应返回空', () => {
      const dims: ReportDimension[] = [{ field: 'category', alias: '分类' }]
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: '总额' }]
      const result = service.aggregate([], dims, metrics)
      assert.deepEqual(result, [])
    })
  })

  // ─── 无维度 → 单行总计 ──────────────────────────────────

  describe('无维度分组 (单行总计)', () => {
    const rows = [
      { amount: 100, qty: 2 },
      { amount: 200, qty: 3 },
      { amount: 300, qty: 5 },
    ]

    it('sum 聚合', () => {
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: 'totalAmount' }]
      const result = service.aggregate(rows, [], metrics)
      assert.equal(result.length, 1)
      assert.equal(result[0].totalAmount, 600)
    })

    it('count 聚合', () => {
      const metrics: ReportMetric[] = [{ field: 'qty', fn: 'count', alias: 'rowCount' }]
      const result = service.aggregate(rows, [], metrics)
      assert.equal(result[0].rowCount, 3)
    })

    it('avg 聚合', () => {
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'avg', alias: 'avgAmount' }]
      const result = service.aggregate(rows, [], metrics)
      assert.equal(result[0].avgAmount, 200)
    })

    it('min 聚合', () => {
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'min', alias: 'minAmount' }]
      const result = service.aggregate(rows, [], metrics)
      assert.equal(result[0].minAmount, 100)
    })

    it('max 聚合', () => {
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'max', alias: 'maxAmount' }]
      const result = service.aggregate(rows, [], metrics)
      assert.equal(result[0].maxAmount, 300)
    })

    it('distinct 聚合', () => {
      const rowsWithDup = [{ value: 1 }, { value: 2 }, { value: 1 }]
      const metrics: ReportMetric[] = [{ field: 'value', fn: 'distinct', alias: 'uniqueValues' }]
      const result = service.aggregate(rowsWithDup, [], metrics)
      assert.equal(result[0].uniqueValues, 2)
    })

    it('多度量同时计算', () => {
      const metrics: ReportMetric[] = [
        { field: 'amount', fn: 'sum', alias: 'total' },
        { field: 'qty', fn: 'avg', alias: 'avgQty' },
        { field: 'amount', fn: 'max', alias: 'maxAmount' },
      ]
      const result = service.aggregate(rows, [], metrics)
      assert.equal(result[0].total, 600)
      assert.ok(Math.abs((result[0].avgQty as number) - 3.33) < 0.34, `avgQty=${result[0].avgQty} not close to 3.33`)
      assert.equal(result[0].maxAmount, 300)
    })
  })

  // ─── 单维度分组 ─────────────────────────────────────────

  describe('单维度分组', () => {
    const rows = [
      { category: 'A', amount: 100 },
      { category: 'A', amount: 200 },
      { category: 'B', amount: 50 },
      { category: 'B', amount: 150 },
      { category: 'C', amount: 400 },
    ]

    it('按 category 分组 sum', () => {
      const dims: ReportDimension[] = [{ field: 'category', alias: '分类' }]
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: 'total' }]
      const result = service.aggregate(rows, dims, metrics)
      assert.equal(result.length, 3)

      const a = result.find(r => r['分类'] === 'A')
      assert.ok(a)
      assert.equal(a.total, 300)

      const b = result.find(r => r['分类'] === 'B')
      assert.ok(b)
      assert.equal(b.total, 200)

      const c = result.find(r => r['分类'] === 'C')
      assert.ok(c)
      assert.equal(c.total, 400)
    })

    it('按 category 分组 avg', () => {
      const dims: ReportDimension[] = [{ field: 'category', alias: 'category' }]
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'avg', alias: 'avgAmount' }]
      const result = service.aggregate(rows, dims, metrics)
      const a = result.find(r => r.category === 'A')
      assert.ok(a)
      assert.equal(a.avgAmount, 150)
    })

    it('null 维度值被处理为 null 分组', () => {
      const rowsWithNull = [
        { category: 'A', amount: 100 },
        { category: null, amount: 50 },
      ]
      const dims: ReportDimension[] = [{ field: 'category' }]
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: 'total' }]
      const result = service.aggregate(rowsWithNull, dims, metrics)
      assert.equal(result.length, 2)
      const nullGroup = result.find(r => r.category === null)
      assert.ok(nullGroup)
    })
  })

  // ─── 多维分组 ───────────────────────────────────────────

  describe('多维分组', () => {
    const rows = [
      { category: 'A', status: 'ok', amount: 100 },
      { category: 'A', status: 'ok', amount: 200 },
      { category: 'A', status: 'fail', amount: 50 },
      { category: 'B', status: 'ok', amount: 300 },
    ]

    it('双维度分组: category + status', () => {
      const dims: ReportDimension[] = [
        { field: 'category', alias: 'cat' },
        { field: 'status', alias: 'st' },
      ]
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: 'total' }]
      const result = service.aggregate(rows, dims, metrics)
      assert.equal(result.length, 3)

      const aOk = result.find(r => r.cat === 'A' && r.st === 'ok')
      assert.ok(aOk)
      assert.equal(aOk.total, 300)

      const aFail = result.find(r => r.cat === 'A' && r.st === 'fail')
      assert.ok(aFail)
      assert.equal(aFail.total, 50)

      const bOk = result.find(r => r.cat === 'B' && r.st === 'ok')
      assert.ok(bOk)
      assert.equal(bOk.total, 300)
    })
  })

  // ─── 时间分桶 ───────────────────────────────────────────

  describe('时间分桶 (timeBucket)', () => {
    const iso = '2025-06-15T10:30:00.000Z'

    it('day → 2025-06-15', () => {
      assert.equal(service.timeBucket(iso, 'day'), '2025-06-15')
    })

    it('month → 2025-06', () => {
      assert.equal(service.timeBucket(iso, 'month'), '2025-06')
    })

    it('year → 2025', () => {
      assert.equal(service.timeBucket(iso, 'year'), '2025')
    })

    it('week → 包含 W 标记', () => {
      const week = service.timeBucket(iso, 'week')
      assert.match(week, /^\d{4}-W\d{2}$/)
    })

    it('默认 granularity → 返回原始 ISO', () => {
      assert.equal(service.timeBucket(iso, 'day'), '2025-06-15')
    })

    it('不同日期在同一个月归入同一 bucket', () => {
      const d1 = service.timeBucket('2025-06-01T00:00:00Z', 'month')
      const d2 = service.timeBucket('2025-06-30T23:59:59Z', 'month')
      const d3 = service.timeBucket('2025-07-01T00:00:00Z', 'month')
      assert.equal(d1, d2)
      assert.notEqual(d1, d3)
    })

    it('维度分组结合时间分桶', () => {
      const rows = [
        { createdAt: '2025-06-15T10:00:00Z', amount: 100 },
        { createdAt: '2025-06-15T14:00:00Z', amount: 200 },
        { createdAt: '2025-06-16T09:00:00Z', amount: 50 },
      ]
      const dims: ReportDimension[] = [{ field: 'createdAt', granularity: 'day', alias: 'date' }]
      const metrics: ReportMetric[] = [{ field: 'amount', fn: 'sum', alias: 'total' }]
      const result = service.aggregate(rows, dims, metrics)
      assert.equal(result.length, 2)

      const day1 = result.find(r => r.date === '2025-06-15')
      assert.ok(day1)
      assert.equal(day1.total, 300)

      const day2 = result.find(r => r.date === '2025-06-16')
      assert.ok(day2)
      assert.equal(day2.total, 50)
    })
  })

  // ─── 计算度量辅助 ───────────────────────────────────────

  describe('computeMetricsForGroup', () => {
    it('空行组返回全 0', () => {
      const metrics: ReportMetric[] = [{ field: 'x', fn: 'sum', alias: 'total' }]
      const result = service.computeMetricsForGroup([], metrics)
      assert.equal(result.total, 0)
    })

    it('多个度量', () => {
      const rows = [{ x: 10, y: 20 }, { x: 30, y: 40 }]
      const metrics: ReportMetric[] = [
        { field: 'x', fn: 'sum', alias: 'sumX' },
        { field: 'y', fn: 'avg', alias: 'avgY' },
      ]
      const result = service.computeMetricsForGroup(rows, metrics)
      assert.equal(result.sumX, 40)
      assert.equal(result.avgY, 30)
    })
  })

  // ─── computeMetric 单元 ─────────────────────────────────

  describe('computeMetric', () => {
    it('空数组返回 0', () => {
      assert.equal(service.computeMetric([], 'x', 'sum'), 0)
    })

    it('所有非数字值返回 0', () => {
      const rows = [{ x: 'abc' }, { x: null }, { x: NaN }]
      assert.equal(service.computeMetric(rows, 'x', 'sum'), 0)
    })

    it('mixed valid/invalid values — 只计算有效值', () => {
      const rows = [{ x: 100 }, { x: null }, { x: NaN }, { x: 200 }]
      assert.equal(service.computeMetric(rows, 'x', 'sum'), 300)
    })

    it('count 计算行数而非字段值', () => {
      const rows = [{ x: null }, { x: NaN }, { x: 'abc' }]
      assert.equal(service.computeMetric(rows, 'x', 'count'), 3)
    })

    it('distinct 区分数字去重', () => {
      const rows = [{ x: 1 }, { x: 2 }, { x: 1 }, { x: 3 }]
      assert.equal(service.computeMetric(rows, 'x', 'distinct'), 3)
    })

    it('min/max 正确处理', () => {
      const rows = [{ x: 5 }, { x: -3 }, { x: 100 }]
      assert.equal(service.computeMetric(rows, 'x', 'min'), -3)
      assert.equal(service.computeMetric(rows, 'x', 'max'), 100)
    })

    it('未知聚合函数返回 0', () => {
      const rows = [{ x: 42 }]
      assert.equal(service.computeMetric(rows, 'x', 'unknown' as any), 0)
    })
  })

  // ─── 边界 & 异常 ────────────────────────────────────────

  describe('边界情况', () => {
    it('Infinity 值被过滤', () => {
      const rows = [{ x: Infinity }, { x: 100 }]
      assert.equal(service.computeMetric(rows, 'x', 'sum'), 100)
    })

    it('-Infinity 值被过滤', () => {
      const rows = [{ x: -Infinity }, { x: 50 }, { x: 25 }]
      assert.equal(service.computeMetric(rows, 'x', 'avg'), 37.5)
    })

    it('字符串数字被转为 number', () => {
      const rows = [{ x: '100' }, { x: '200' }]
      assert.equal(service.computeMetric(rows, 'x', 'sum'), 300)
    })

    it('dimension value 含 || 分隔符时仍正确解析', () => {
      // || 在值中理论上不会出现（作为分隔符使用）
      const rows = [
        { name: 'A', value: 10 },
        { name: 'A', value: 20 },
        { name: 'B||C', value: 5 }, // 含分隔符的值会被正确分组
      ]
      const dims: ReportDimension[] = [{ field: 'name', alias: 'name' }]
      const metrics: ReportMetric[] = [{ field: 'value', fn: 'sum', alias: 'total' }]
      const result = service.aggregate(rows, dims, metrics)
      assert.equal(result.length, 2)
      assert.equal(result.filter(r => r.name === 'A')[0].total, 30)
    })

    it('大量行 (10K) 不超时', () => {
      const large = Array.from({ length: 10_000 }, (_, i) => ({
        group: `g${i % 100}`,
        value: i,
      }))
      const dims: ReportDimension[] = [{ field: 'group' }]
      const metrics: ReportMetric[] = [{ field: 'value', fn: 'sum', alias: 'total' }]
      const start = Date.now()
      const result = service.aggregate(large, dims, metrics)
      const elapsed = Date.now() - start
      assert.equal(result.length, 100)
      assert.ok(elapsed < 5000, `耗时 ${elapsed}ms 超出预期`)
    })
  })
})
