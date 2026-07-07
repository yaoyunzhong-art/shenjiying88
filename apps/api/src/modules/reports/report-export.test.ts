import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ReportExportService } from './report-export.service'
import type { ReportResult } from './reports.entity'

describe('ReportExportService - CSV/JSON/HTML 导出', () => {
  const exp = new ReportExportService()

  const sample = (): ReportResult => ({
    type: 'revenue',
    tenantId: 'T-001',
    period: { from: '2024-06-01', to: '2024-06-30' },
    columns: [
      { field: 'day', alias: 'Day', type: 'dimension' },
      { field: 'total', alias: 'Total', type: 'metric' },
      { field: 'count', alias: 'Count', type: 'metric' }
    ],
    rows: [
      { day: '2024-06-01', total: 1000, count: 10 },
      { day: '2024-06-02', total: 2000, count: 20 }
    ],
    totals: { day: '合计', total: 3000, count: 30 },
    generatedAt: '2024-06-28T10:00:00Z',
    cached: false
  })

  describe('EXPORT-1: toCSV RFC 4180', () => {
    it('输出包含 header + rows + totals', () => {
      const csv = exp.toCSV(sample())
      const lines = csv.split('\n')
      assert.equal(lines.length, 4)  // header + 2 rows + totals
      assert.equal(lines[0], 'Day,Total,Count')
      assert.equal(lines[1], '2024-06-01,1000,10')
      assert.equal(lines[3], '合计,3000,30')
    })

    it('无 totals 不输出尾行', () => {
      const s = sample()
      delete s.totals
      const csv = exp.toCSV(s)
      const lines = csv.split('\n')
      assert.equal(lines.length, 3)
    })

    it('空 rows 仅输出 header', () => {
      const s = sample()
      s.rows = []
      delete s.totals
      const csv = exp.toCSV(s)
      assert.equal(csv, 'Day,Total,Count')
    })
  })

  describe('EXPORT-2: CSV 防御 csv-injection (反模式 v4)', () => {
    it('= 开头的值加单引号前缀', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'name', alias: 'Name', type: 'dimension' }],
        rows: [{ name: '=SUM(A1:A10)' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /'/)
      // = 开头的值会被加 ' 前缀
      assert.ok(csv.includes("'=SUM"))
    })

    it('+ 开头防御', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'v', alias: 'V', type: 'metric' }],
        rows: [{ v: '+1+1' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /'\+1\+1/)
    })

    it('- 开头防御', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'v', alias: 'V', type: 'metric' }],
        rows: [{ v: '-2' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /'-2/)
    })

    it('@ 开头防御', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'v', alias: 'V', type: 'metric' }],
        rows: [{ v: '@SUM' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /'@SUM/)
    })

    it('普通字符串不加前缀', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'name', alias: 'Name', type: 'dimension' }],
        rows: [{ name: '张三' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /张三/)
    })
  })

  describe('EXPORT-3: CSV RFC 4180 转义', () => {
    it('逗号包裹双引号', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'name', alias: 'Name', type: 'dimension' }],
        rows: [{ name: 'hello, world' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /"hello, world"/)
    })

    it('双引号转义为两个双引号', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'name', alias: 'Name', type: 'dimension' }],
        rows: [{ name: 'say "hi"' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /"say ""hi"""/)
    })

    it('换行包裹双引号', () => {
      const csv = exp.toCSV({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'v', alias: 'V', type: 'metric' }],
        rows: [{ v: 'line1\nline2' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(csv, /"line1\nline2"/)
    })
  })

  describe('EXPORT-4: toJSON', () => {
    it('输出合法 JSON', () => {
      const json = exp.toJSON(sample())
      const parsed = JSON.parse(json)
      assert.equal(parsed.type, 'revenue')
      assert.equal(parsed.tenantId, 'T-001')
      assert.equal(parsed.rows.length, 2)
      assert.equal(parsed.rows[0].total, 1000)
    })

    it('包含 totals', () => {
      const json = exp.toJSON(sample())
      const parsed = JSON.parse(json)
      assert.equal(parsed.totals.total, 3000)
    })

    it('pretty-print (有换行)', () => {
      const json = exp.toJSON(sample())
      assert.match(json, /\n  "/)
    })
  })

  describe('EXPORT-5: toHTML', () => {
    it('包含 DOCTYPE', () => {
      const html = exp.toHTML(sample())
      assert.match(html, /<!DOCTYPE html>/)
    })

    it('包含表格 thead/tbody', () => {
      const html = exp.toHTML(sample())
      assert.match(html, /<thead>/)
      assert.match(html, /<tbody>/)
    })

    it('th 包含列 alias', () => {
      const html = exp.toHTML(sample())
      assert.match(html, /<th>Day<\/th>/)
      assert.match(html, /<th>Total<\/th>/)
    })

    it('td 包含数据', () => {
      const html = exp.toHTML(sample())
      assert.match(html, /<td>2024-06-01<\/td>/)
    })

    it('HTML 转义防御 XSS', () => {
      const html = exp.toHTML({
        type: 'revenue',
        tenantId: 'T',
        period: { from: '2024-01-01', to: '2024-01-02' },
        columns: [{ field: 'name', alias: 'Name', type: 'dimension' }],
        rows: [{ name: '<script>alert(1)</script>' }],
        generatedAt: '2024-01-01',
        cached: false
      })
      assert.match(html, /&lt;script&gt;/)
      assert.doesNotMatch(html, /<script>alert/)
    })

    it('cached=true 显示 ⚡ Cached 标识', () => {
      const s = sample()
      s.cached = true
      const html = exp.toHTML(s)
      assert.match(html, /⚡ Cached/)
    })
  })

  describe('EXPORT-6: filename', () => {
    it('CSV 文件名格式', () => {
      const f = exp.filename(sample(), 'csv')
      assert.equal(f, 'revenue-T-001-2024-06-01_to_2024-06-30.csv')
    })

    it('JSON 文件名格式', () => {
      const f = exp.filename(sample(), 'json')
      assert.match(f, /\.json$/)
    })

    it('HTML 文件名格式', () => {
      const f = exp.filename(sample(), 'html')
      assert.match(f, /\.html$/)
    })
  })
})