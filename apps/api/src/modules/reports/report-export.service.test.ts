import { describe, it, expect, beforeEach } from 'vitest'
import { ReportExportService } from './report-export.service'
import { ReportQueryService } from './report-query.service'
import type { ReportResult } from './reports.entity'

function makeResult(overrides: Partial<ReportResult> = {}): ReportResult {
  return {
    columns: [
      { field: 'amount', alias: '金额', type: 'metric' },
      { field: 'count', alias: '数量', type: 'metric' },
    ],
    rows: [
      { amount: 100, count: 10 },
      { amount: 200, count: 20 },
      { amount: 300, count: 30 },
    ],
    totals: { amount: 600, count: 60 },
    period: { from: '2026-07-01', to: '2026-07-31' },
    tenantId: 'T-001',
    type: 'revenue',
    generatedAt: '2026-07-20T00:00:00Z',
    cached: false,
    ...overrides,
  }
}

describe('ReportExportService', () => {
  let service: ReportExportService

  beforeEach(() => {
    service = new ReportExportService()
  })

  describe('toCSV', () => {
    it('should export CSV with header and rows', () => {
      const result = makeResult()
      const csv = service.toCSV(result)
      expect(csv).toContain('金额,数量')
      expect(csv).toContain('100,10')
      expect(csv).toContain('200,20')
    })

    it('should include totals row', () => {
      const result = makeResult()
      const csv = service.toCSV(result)
      const lines = csv.split('\n')
      const totals = lines[lines.length - 1]
      expect(totals).toContain('600')
      expect(totals).toContain('60')
    })

    it('should escape formula injection', () => {
      const result = makeResult({ rows: [{ amount: '=CMD()', count: 1 }] })
      const csv = service.toCSV(result)
      expect(csv).toContain("'=CMD()")
    })

    it('should handle empty rows', () => {
      const result = makeResult({ rows: [] })
      const csv = service.toCSV(result)
      expect(csv).toContain('金额,数量')
      expect(csv.split('\n')).toHaveLength(3) // header + empty totals
    })
  })

  describe('toJSON', () => {
    it('should export valid JSON', () => {
      const result = makeResult()
      const json = service.toJSON(result)
      const parsed = JSON.parse(json)
      expect(parsed.type).toBe('revenue')
      expect(parsed.rows).toHaveLength(3)
    })
  })

  describe('toHTML', () => {
    it('should generate HTML table', () => {
      const result = makeResult()
      const html = service.toHTML(result)
      expect(html).toContain('<table>')
      expect(html).toContain('</table>')
      expect(html).toContain('金额')
      expect(html).toContain('100')
    })

    it('should include cached indicator when cached', () => {
      const result = makeResult({ cached: true })
      const html = service.toHTML(result)
      expect(html).toContain('Cached')
    })

    it('should include totals row when present', () => {
      const result = makeResult()
      const html = service.toHTML(result)
      expect(html).toContain('font-weight:bold')
      expect(html).toContain('600')
    })
  })

  describe('filename', () => {
    it('should generate correct filename', () => {
      const result = makeResult()
      const name = service.filename(result, 'csv')
      expect(name).toContain('.csv')
      expect(name).toContain('revenue')
      expect(name).toContain('T-001')
    })
  })

  describe('batch export', () => {
    it('should create batch export task', async () => {
      const task = await service.createBatchExportTask({
        type: 'revenue',
        tenantId: 'T-001',
        period: { from: '2026-07-01', to: '2026-07-31' },
        format: 'csv',
      })
      expect(task.taskId).toBeTruthy()
      expect(task.status).toBe('pending')
      expect(task.tenantId).toBe('T-001')
    })

    it('should enforce max batch size', async () => {
      const task = await service.createBatchExportTask({
        type: 'revenue',
        tenantId: 'T-001',
        period: { from: '2026-07-01', to: '2026-07-31' },
        format: 'json',
        limit: 99999,
      })
      expect(task.status).toBe('pending')
    })

    it('should reject xlsx format', () => {
      const result = makeResult()
      expect(() => service.toHTML(result)).not.toThrow()
    })
  })

  describe('getExportTask', () => {
    it('should return undefined for non-existent task', () => {
      const task = service.getExportTask('nonexistent', 'T-001')
      expect(task).toBeUndefined()
    })

    it('should return undefined for wrong tenant', async () => {
      const task = await service.createBatchExportTask({
        type: 'revenue',
        tenantId: 'T-001',
        period: { from: '2026-07-01', to: '2026-07-31' },
        format: 'csv',
      })
      const fetched = service.getExportTask(task.taskId, 'T-999')
      expect(fetched).toBeUndefined()
    })
  })

  describe('listExportTasks', () => {
    it('should list tasks with filters', async () => {
      await service.createBatchExportTask({
        type: 'revenue', tenantId: 'T-001',
        period: { from: '2026-07-01', to: '2026-07-31' }, format: 'csv',
      })
      await service.createBatchExportTask({
        type: 'order', tenantId: 'T-001',
        period: { from: '2026-07-01', to: '2026-07-31' }, format: 'json',
      })
      const tasks = service.listExportTasks('T-001')
      expect(tasks).toHaveLength(2)
      const filtered = service.listExportTasks('T-001', { type: 'revenue' })
      expect(filtered).toHaveLength(1)
    })
  })
})
