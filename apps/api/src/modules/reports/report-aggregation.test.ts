import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ReportAggregationService } from './report-aggregation.service'

describe('ReportAggregationService - 多维聚合引擎', () => {
  const agg = new ReportAggregationService()

  describe('AGGR-1: aggregate 基础', () => {
    it('空数据返回空数组', () => {
      const r = agg.aggregate([], [{ field: 'method' }], [{ field: 'amount', fn: 'sum', alias: 'total' }])
      assert.deepEqual(r, [])
    })

    it('无维度 → 单行总计', () => {
      const rows = [
        { method: 'wechat', amount: 100 },
        { method: 'alipay', amount: 200 }
      ]
      const r = agg.aggregate(rows, [], [{ field: 'amount', fn: 'sum', alias: 'total' }])
      assert.equal(r.length, 1)
      assert.equal(r[0].total, 300)
    })

    it('单维度分组', () => {
      const rows = [
        { method: 'wechat', amount: 100 },
        { method: 'wechat', amount: 50 },
        { method: 'alipay', amount: 200 }
      ]
      const r = agg.aggregate(rows, [{ field: 'method' }], [{ field: 'amount', fn: 'sum', alias: 'total' }])
      assert.equal(r.length, 2)
      const w = r.find(x => x.method === 'wechat')
      const a = r.find(x => x.method === 'alipay')
      assert.equal(w?.total, 150)
      assert.equal(a?.total, 200)
    })

    it('多维度分组', () => {
      const rows = [
        { method: 'wechat', status: 'PAID', amount: 100 },
        { method: 'wechat', status: 'PAID', amount: 50 },
        { method: 'wechat', status: 'REFUNDED', amount: 30 }
      ]
      const r = agg.aggregate(
        rows,
        [{ field: 'method' }, { field: 'status' }],
        [{ field: 'amount', fn: 'sum', alias: 'total' }]
      )
      assert.equal(r.length, 2)
      assert.equal(r.find(x => x.status === 'PAID')?.total, 150)
      assert.equal(r.find(x => x.status === 'REFUNDED')?.total, 30)
    })
  })

  describe('AGGR-2: 6 个 AggregationFn', () => {
    const rows = [
      { v: 10 }, { v: 20 }, { v: 30 }, { v: 20 }, { v: 'x' as any }
    ]

    it('sum 求和', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'sum'), 80)
    })

    it('count 计数 (含非数值)', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'count'), 5)
    })

    it('avg 平均 (忽略非数值)', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'avg'), 80 / 4)
    })

    it('min 最小', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'min'), 10)
    })

    it('max 最大', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'max'), 30)
    })

    it('distinct 去重', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'distinct'), 3)
    })

    it('空数据返回 0', () => {
      assert.equal(agg.computeMetric([], 'v', 'sum'), 0)
    })

    it('全非数值返回 0', () => {
      assert.equal(agg.computeMetric([{ v: 'x' }, { v: 'y' }], 'v', 'sum'), 0)
    })

    it('未知 fn 返回 0', () => {
      assert.equal(agg.computeMetric(rows, 'v', 'unknown' as any), 0)
    })
  })

  describe('AGGR-3: timeBucket 时间维度截断', () => {
    it('day 粒度', () => {
      assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'day'), '2024-06-15')
    })

    it('month 粒度', () => {
      assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'month'), '2024-06')
    })

    it('year 粒度', () => {
      assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'year'), '2024')
    })

    it('week 粒度 ISO 周', () => {
      const w = agg.timeBucket('2024-06-15T10:30:00Z', 'week')
      assert.match(w, /^\d{4}-W\d{2}$/)
    })

    it('week 周一与周日归同一周', () => {
      const mon = agg.timeBucket('2024-06-10T00:00:00Z', 'week')
      const sun = agg.timeBucket('2024-06-16T23:59:59Z', 'week')
      assert.equal(mon, sun)
    })

    it('week 跨年处理 (ISO)', () => {
      // 2024-12-30 周一 → 2025-W01
      const w = agg.timeBucket('2024-12-30T00:00:00Z', 'week')
      assert.equal(w, '2025-W01')
    })

    it('未知粒度返回原 ISO', () => {
      assert.equal(agg.timeBucket('2024-06-15T10:30:00Z', 'unknown' as any), '2024-06-15T10:30:00Z')
    })
  })

  describe('AGGR-4: 多度量同时计算', () => {
    it('count + sum + avg', () => {
      const rows = [{ v: 10 }, { v: 20 }, { v: 30 }]
      const out = agg.computeMetricsForGroup(rows, [
        { field: 'v', fn: 'count', alias: 'cnt' },
        { field: 'v', fn: 'sum', alias: 'sum' },
        { field: 'v', fn: 'avg', alias: 'avg' }
      ])
      assert.equal(out.cnt, 3)
      assert.equal(out.sum, 60)
      assert.equal(out.avg, 20)
    })
  })

  describe('AGGR-5: 维度别名 alias', () => {
    it('alias 覆盖 field', () => {
      const rows = [{ method: 'wechat', amount: 100 }]
      const r = agg.aggregate(
        rows,
        [{ field: 'method', alias: 'payMethod' }],
        [{ field: 'amount', fn: 'sum', alias: 'totalAmount' }]
      )
      assert.equal(r[0].payMethod, 'wechat')
      assert.equal(r[0].totalAmount, 100)
      assert.equal(r[0].method, undefined)
    })
  })

  describe('AGGR-6: 维度带 granularity (时间维度)', () => {
    it('按月分组 createdAt', () => {
      const rows = [
        { createdAt: '2024-05-15T00:00:00Z', amount: 100 },
        { createdAt: '2024-05-20T00:00:00Z', amount: 50 },
        { createdAt: '2024-06-01T00:00:00Z', amount: 200 }
      ]
      const r = agg.aggregate(
        rows,
        [{ field: 'createdAt', granularity: 'month', alias: 'month' }],
        [{ field: 'amount', fn: 'sum', alias: 'total' }]
      )
      assert.equal(r.length, 2)
      assert.equal(r.find(x => x.month === '2024-05')?.total, 150)
      assert.equal(r.find(x => x.month === '2024-06')?.total, 200)
    })
  })

  describe('AGGR-7: null 维度处理', () => {
    it('null 值归入 null 组', () => {
      const rows = [
        { method: null, amount: 50 },
        { method: 'wechat', amount: 100 },
        { method: null, amount: 30 }
      ]
      const r = agg.aggregate(
        rows,
        [{ field: 'method' }],
        [{ field: 'amount', fn: 'sum', alias: 'total' }]
      )
      assert.equal(r.length, 2)
      assert.equal(r.find(x => x.method === null)?.total, 80)
    })
  })

  describe('AGGR-8: 数值字段字符串化', () => {
    it('parseDimensionValue 还原 number', () => {
      const r = agg.aggregate(
        [{ qty: 5 }, { qty: 10 }],
        [{ field: 'qty' }],
        [{ field: 'qty', fn: 'sum', alias: 'total' }]
      )
      assert.equal(typeof r[0].qty, 'number')
      assert.equal(r[0].qty, 5)
    })
  })
})