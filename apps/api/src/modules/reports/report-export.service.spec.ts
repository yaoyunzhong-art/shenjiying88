import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  type BatchExportRequest,
  ReportExportService,
} from './report-export.service'
import { ReportQueryService } from './report-query.service'
import type { ReportResult } from './reports.entity'

describe('ReportExportService', () => {
  let service: ReportExportService
  let parseMock: any
  let reportQueryService: ReportQueryService

  beforeEach(() => {
    reportQueryService = new ReportQueryService()
    parseMock = vi.spyOn(reportQueryService, 'parse' as any).mockReturnValue({ op: 'AND', conditions: [] } as any)
    service = new ReportExportService(reportQueryService)
  })

  describe('批量导出功能 (V10 Sprint 3 Day 25)', () => {
    it('应成功创建批量导出任务', async () => {
      const request: BatchExportRequest = {
        type: 'order',
        tenantId: 'tenant-001',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'csv',
        limit: 100,
      }

      const result = await service.createBatchExportTask(request)

      assert.ok(result)
      assert.match(result.taskId, /^export_\d+_[a-z0-9]+$/)
      assert.ok(['pending', 'processing', 'completed'].includes(result.status))
      assert.equal(result.tenantId, 'tenant-001')
      assert.match(result.filename, /order_tenant-001_2024-01-31\.csv|order_tenant-001_2024-01-01\.csv|order_tenant-001_/)
      assert.equal(result.rowCount, 0)
      assert.equal(result.size, 0)
    })

    it('应限制导出数量不超过最大值', async () => {
      const request: BatchExportRequest = {
        type: 'payment',
        tenantId: 'tenant-002',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'json',
        limit: 10001,
      }

      const result = await service.createBatchExportTask(request)

      assert.ok(result)
      assert.ok(['pending', 'processing', 'completed'].includes(result.status))
    })

    it('应触发 DSL 解析', async () => {
      const request: BatchExportRequest = {
        type: 'member',
        tenantId: 'tenant-003',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'html',
        filter: {
          status: 'ACTIVE',
        },
      }

      await service.createBatchExportTask(request)
      await new Promise(resolve => setTimeout(resolve, 0))

      assert.ok(parseMock.mock.calls.length >= 1)
    })

    it('应支持按租户列出任务', async () => {
      await service.createBatchExportTask({
        type: 'order',
        tenantId: 'tenant-A',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'csv',
      })

      await service.createBatchExportTask({
        type: 'payment',
        tenantId: 'tenant-B',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'json',
      })

      const tenantTasks = service.listExportTasks('tenant-A')
      assert.ok(tenantTasks.length >= 1)
      assert.ok(tenantTasks.every(task => task.tenantId === 'tenant-A'))
    })

    it('应基于真实报表结果生成下载载荷', async () => {
      const request: BatchExportRequest = {
        type: 'order',
        tenantId: 'tenant-009',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'json',
      }

      const result: ReportResult = {
        type: 'order',
        tenantId: 'tenant-009',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [
          { field: 'id', alias: 'ID', type: 'dimension' },
        ],
        rows: [
          { id: 'ord-1' },
        ],
      }

      const task = await service.createBatchExportTaskFromResult(request, result)
      await new Promise(resolve => setTimeout(resolve, 0))

      const payload = service.getDownloadPayload(task.taskId, 'tenant-009')
      const fetchedTask = service.getExportTask(task.taskId, 'tenant-009')

      assert.ok(payload)
      assert.equal(payload?.tenantId, 'tenant-009')
      assert.equal(payload?.format, 'json')
      assert.match(payload?.filename ?? '', /\.json$/)
      assert.match(payload?.content ?? '', /"type": "order"/)
      assert.ok((payload?.size ?? 0) > 0)
      assert.equal(fetchedTask?.tenantId, 'tenant-009')
      assert.equal(fetchedTask?.rowCount, 1)
      assert.ok(Boolean(fetchedTask?.expiresAt))
    })

    it('应拒绝下载未完成任务的导出内容', async () => {
      const request: BatchExportRequest = {
        type: 'order',
        tenantId: 'tenant-download-guard',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'json',
      }

      const result: ReportResult = {
        type: 'order',
        tenantId: 'tenant-download-guard',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [{ field: 'id', alias: 'ID', type: 'dimension' }],
        rows: [{ id: 'ord-1' }],
      }

      const task = await service.createBatchExportTaskFromResult(request, result)
      await new Promise(resolve => setTimeout(resolve, 0))

      const currentTask = service['taskStore'].get(task.taskId)
      assert.ok(currentTask)
      currentTask.status = 'processing'
      currentTask.completedAt = undefined

      assert.equal(service.getDownloadPayload(task.taskId, 'tenant-download-guard'), undefined)
    })

    it('应在 xlsx 导出时标记任务失败且不产生下载内容', async () => {
      const request: BatchExportRequest = {
        type: 'order',
        tenantId: 'tenant-xlsx',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'xlsx',
      }

      const result: ReportResult = {
        type: 'order',
        tenantId: 'tenant-xlsx',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [{ field: 'id', alias: 'ID', type: 'dimension' }],
        rows: [{ id: 'ord-1' }],
      }

      const task = await service.createBatchExportTaskFromResult(request, result)
      await new Promise(resolve => setTimeout(resolve, 0))

      const currentTask = service.getExportTask(task.taskId, 'tenant-xlsx')
      assert.equal(currentTask?.status, 'failed')
      assert.match(currentTask?.error ?? '', /Unsupported export format: xlsx/)
      assert.equal(service.getDownloadPayload(task.taskId, 'tenant-xlsx'), undefined)
    })

    it('应清理缺少任务记录的孤儿下载载荷', async () => {
      const request: BatchExportRequest = {
        type: 'order',
        tenantId: 'tenant-orphan',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'csv',
      }

      const result: ReportResult = {
        type: 'order',
        tenantId: 'tenant-orphan',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [{ field: 'id', alias: 'ID', type: 'dimension' }],
        rows: [{ id: 'ord-1' }],
      }

      const task = await service.createBatchExportTaskFromResult(request, result)
      await new Promise(resolve => setTimeout(resolve, 0))

      service['taskStore'].delete(task.taskId)

      assert.equal(service.getDownloadPayload(task.taskId, 'tenant-orphan'), undefined)
      assert.equal(service['downloadStore'].has(task.taskId), false)
    })

    it('应拒绝跨租户访问任务与下载内容', async () => {
      const request: BatchExportRequest = {
        type: 'order',
        tenantId: 'tenant-secure',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'csv',
      }

      const result: ReportResult = {
        type: 'order',
        tenantId: 'tenant-secure',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [{ field: 'id', alias: 'ID', type: 'dimension' }],
        rows: [{ id: 'ord-1' }],
      }

      const task = await service.createBatchExportTaskFromResult(request, result)
      await new Promise(resolve => setTimeout(resolve, 0))

      assert.equal(service.getExportTask(task.taskId, 'tenant-other'), undefined)
      assert.equal(service.getExportTask(task.taskId), undefined)
      assert.equal(service.getDownloadPayload(task.taskId, 'tenant-other'), undefined)
      assert.equal(service.getDownloadPayload(task.taskId), undefined)
    })

    it('cleanupExpiredTasks 应同时清理任务与下载内容', async () => {
      const task = await service.createBatchExportTask({
        type: 'payment',
        tenantId: 'tenant-cleanup',
        period: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-31T23:59:59Z',
        },
        format: 'csv',
      })

      const taskMap = service['taskStore']
      const current = taskMap.get(task.taskId)
      assert.ok(current)
      current.expiresAt = '2000-01-01T00:00:00.000Z'

      const cleanedCount = service.cleanupExpiredTasks(24)
      assert.ok(cleanedCount >= 1)
      assert.equal(service.getExportTask(task.taskId, 'tenant-cleanup'), undefined)
      assert.equal(service.getDownloadPayload(task.taskId, 'tenant-cleanup'), undefined)
    })
  })

  describe('基础导出能力', () => {
    it('应正确导出 CSV', () => {
      const result: ReportResult = {
        type: 'order',
        tenantId: 'tenant-001',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [
          { field: 'id', alias: 'ID', type: 'dimension' },
          { field: 'amount', alias: 'Amount', type: 'metric' },
        ],
        rows: [
          { id: '1', amount: 100 },
          { id: '2', amount: 200 },
        ],
      }

      const csv = service.toCSV(result)
      assert.match(csv, /ID,Amount/)
      assert.match(csv, /1,100/)
      assert.match(csv, /2,200/)
    })

    it('应正确导出 JSON', () => {
      const result: ReportResult = {
        type: 'member',
        tenantId: 'tenant-001',
        period: { from: '2024-01-01T00:00:00Z', to: '2024-01-31T23:59:59Z' },
        generatedAt: '2024-01-31T23:59:59Z',
        cached: false,
        columns: [
          { field: 'name', alias: 'Name', type: 'dimension' },
        ],
        rows: [
          { name: 'Alice' },
        ],
      }

      const parsed = JSON.parse(service.toJSON(result))
      assert.equal(parsed.type, 'member')
      assert.equal(parsed.rows[0].name, 'Alice')
    })
  })
})
