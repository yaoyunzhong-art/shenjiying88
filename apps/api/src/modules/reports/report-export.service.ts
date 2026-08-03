import { BadRequestException, Injectable } from '@nestjs/common'
import type { ReportResult } from './reports.entity'
import { ReportQueryService } from './report-query.service'

/**
 * Phase-39 T169: ReportExportService - 导出 CSV/JSON/HTML + 批量导出
 *
 * 反模式 v4 命中:
 *  - csv-injection: 字段值转义 (=, +, -, @ 开头的字段前加 ')
 *  - escaping: 双引号包裹 + 双引号转义
 *  - batch-size-limit: 批量导出限制 (最大 10000 条)
 */

export interface BatchExportRequest {
  /** 报告类型 */
  type: string
  /** 租户ID */
  tenantId: string
  /** 时间范围 */
  period: {
    from: string
    to: string
  }
  /** 导出格式 */
  format: 'csv' | 'json' | 'html' | 'xlsx'
  /** 筛选条件 */
  filter?: Record<string, unknown>
  /** 最大导出条数 (默认 1000, 最大 10000) */
  limit?: number
}

export interface BatchExportResult {
  /** 导出任务ID */
  taskId: string
  /** 租户ID */
  tenantId: string
  /** 报表类型 */
  type: string
  /** 导出格式 */
  format: BatchExportRequest['format']
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /** 文件名 */
  filename: string
  /** 文件大小 (字节) */
  size: number
  /** 导出条数 */
  rowCount: number
  /** 下载链接 */
  downloadUrl?: string
  /** 创建时间 */
  createdAt: string
  /** 过期时间 */
  expiresAt: string
  /** 完成时间 */
  completedAt?: string
  /** 错误信息 */
  error?: string
}

export interface BatchExportDownloadPayload {
  tenantId: string
  filename: string
  format: 'csv' | 'json' | 'html'
  size: number
  contentType: string
  content: string
  createdAt: string
  expiresAt: string
}

export interface ListExportTaskOptions {
  status?: BatchExportResult['status']
  type?: string
  format?: BatchExportRequest['format']
  limit?: number
}

@Injectable()
export class ReportExportService {
  private readonly MAX_BATCH_SIZE = 10000
  private readonly DEFAULT_BATCH_SIZE = 1000
  private readonly APPROVAL_THRESHOLD = 500
  private readonly EXPORT_TTL_HOURS = 24
  private readonly taskStore = new Map<string, BatchExportResult>()
  private readonly downloadStore = new Map<string, BatchExportDownloadPayload>()

  constructor(private readonly reportQueryService: ReportQueryService = new ReportQueryService()) {}
  /**
   * 导出为 CSV (RFC 4180)
   */
  toCSV(result: ReportResult): string {
    const header = result.columns.map(c => this.csvEscape(c.alias)).join(',')
    const rows = result.rows.map(r =>
      result.columns.map(c => this.csvEscape(String(r[c.field] ?? ''))).join(',')
    )
    const lines = [header, ...rows]
    if (result.totals) {
      lines.push(result.columns.map(c => this.csvEscape(String(result.totals![c.field] ?? ''))).join(','))
    }
    return lines.join('\n')
  }

  /**
   * 导出为 JSON
   */
  toJSON(result: ReportResult): string {
    return JSON.stringify(result, null, 2)
  }

  /**
   * 导出为 HTML (简单 table)
   */
  toHTML(result: ReportResult): string {
    const headerCells = result.columns.map(c => `<th>${this.htmlEscape(c.alias)}</th>`).join('')
    const bodyRows = result.rows.map(r => {
      const cells = result.columns.map(c => `<td>${this.htmlEscape(String(r[c.field] ?? ''))}</td>`).join('')
      return `<tr>${cells}</tr>`
    }).join('\n')
    const totalsRow = result.totals ? `<tr style="font-weight:bold;background:#f3f4f6">${
      result.columns.map(c => `<td>${this.htmlEscape(String(result.totals![c.field] ?? ''))}</td>`).join('')
    }</tr>` : ''
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Report ${result.type}</title>
<style>body{font-family:system-ui,sans-serif;padding:20px}h1{margin-bottom:16px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f9fafb;font-weight:600}</style>
</head><body>
<h1>📊 ${result.type.toUpperCase()} Report</h1>
<p>Tenant: <code>${result.tenantId}</code> | Period: ${result.period.from} → ${result.period.to} | Generated: ${result.generatedAt}${result.cached ? ' | <span style="color:#f59e0b">⚡ Cached</span>' : ''}</p>
<table>
<thead><tr>${headerCells}</tr></thead>
<tbody>${bodyRows}${totalsRow}</tbody>
</table>
</body></html>`
  }

  /**
   * 生成文件名
   */
  filename(result: ReportResult, format: 'csv' | 'json' | 'html'): string {
    const period = `${result.period.from.slice(0, 10)}_to_${result.period.to.slice(0, 10)}`
    return `${result.type}-${result.tenantId}-${period}.${format}`
  }

  getApprovalThreshold(): number {
    return this.APPROVAL_THRESHOLD
  }

  requiresApproval(rowCount: number): boolean {
    return rowCount > this.APPROVAL_THRESHOLD
  }

  // ============================================================
  // 批量导出功能 (V10 Sprint 3 Day 25)
  // ============================================================

  /**
   * 创建批量导出任务
   */
  async createBatchExportTask(request: BatchExportRequest): Promise<BatchExportResult> {
    const limit = Math.min(
      request.limit ?? this.DEFAULT_BATCH_SIZE,
      this.MAX_BATCH_SIZE
    )

    const taskId = `export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const createdAt = new Date().toISOString()
    const expiresAt = this.calculateExpiresAt(createdAt)

    const task: BatchExportResult = {
      taskId,
      tenantId: request.tenantId,
      type: request.type,
      format: request.format,
      status: 'pending',
      filename: `${request.type}_${request.tenantId}_${createdAt.slice(0, 10)}.${request.format}`,
      size: 0,
      rowCount: 0,
      createdAt,
      expiresAt,
    }

    this.taskStore.set(taskId, task)

    // 异步处理导出任务（延迟一帧避免同步修改 task.status）
    setTimeout(() => {
      this.processBatchExportTask(taskId, request, limit).catch(error => {
        const t = this.taskStore.get(taskId)
        if (t) {
          t.status = 'failed'
          t.error = error.message
          t.completedAt = new Date().toISOString()
        }
      })
    }, 0)

    return task
  }

  /**
   * 基于真实报表结果创建批量导出任务
   */
  async createBatchExportTaskFromResult(
    request: BatchExportRequest,
    result: ReportResult,
  ): Promise<BatchExportResult> {
    const taskId = `export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const createdAt = new Date().toISOString()
    const expiresAt = this.calculateExpiresAt(createdAt)

    const task: BatchExportResult = {
      taskId,
      tenantId: request.tenantId,
      type: request.type,
      format: request.format,
      status: 'pending',
      filename: this.resolveExportFilename(result, request.format),
      size: 0,
      rowCount: 0,
      createdAt,
      expiresAt,
    }

    this.taskStore.set(taskId, task)

    this.processBatchExportResultTask(taskId, request, result).catch(error => {
      const current = this.taskStore.get(taskId)
      if (current) {
        current.status = 'failed'
        current.error = error instanceof Error ? error.message : 'Unknown export error'
        current.completedAt = new Date().toISOString()
      }
    })

    return task
  }

  /**
   * 获取导出任务状态
   */
  getExportTask(taskId: string, tenantId?: string): BatchExportResult | undefined {
    const task = this.taskStore.get(taskId)
    if (!task) return undefined
    if (this.isExpired(task.expiresAt)) {
      this.removeTask(taskId)
      return undefined
    }
    if (!tenantId || task.tenantId !== tenantId) {
      return undefined
    }
    return task
  }

  getDownloadPayload(taskId: string, tenantId?: string): BatchExportDownloadPayload | undefined {
    const task = this.taskStore.get(taskId)
    const payload = this.downloadStore.get(taskId)
    if (!task) {
      if (payload) {
        this.downloadStore.delete(taskId)
      }
      return undefined
    }
    if (!payload) return undefined
    if (this.isExpired(task.expiresAt) || this.isExpired(payload.expiresAt)) {
      this.removeTask(taskId)
      return undefined
    }
    if (!tenantId || task.tenantId !== tenantId || payload.tenantId !== tenantId) {
      return undefined
    }
    if (task.status !== 'completed' || !task.completedAt || !task.downloadUrl) {
      return undefined
    }
    if (!this.isDownloadPayloadConsistent(task, payload)) {
      this.removeTask(taskId)
      return undefined
    }
    return payload
  }

  /**
   * 列出所有导出任务
   */
  listExportTasks(tenantId?: string, options?: ListExportTaskOptions): BatchExportResult[] {
    this.cleanupExpiredTasks()
    let tasks = Array.from(this.taskStore.values())
    if (tenantId) {
      tasks = tasks.filter(t => t.tenantId === tenantId)
    }
    if (options?.status) {
      tasks = tasks.filter(t => t.status === options.status)
    }
    if (options?.type) {
      tasks = tasks.filter(t => t.type === options.type)
    }
    if (options?.format) {
      tasks = tasks.filter(t => t.format === options.format)
    }
    tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (options?.limit && options.limit > 0) {
      tasks = tasks.slice(0, options.limit)
    }
    return tasks
  }

  deleteExportTask(taskId: string, tenantId?: string): boolean {
    const task = this.taskStore.get(taskId)
    if (!task) return false
    if (this.isExpired(task.expiresAt)) {
      this.removeTask(taskId)
      return false
    }
    if (!tenantId || task.tenantId !== tenantId) {
      return false
    }
    this.removeTask(taskId)
    return true
  }

  /**
   * 清理过期任务
   */
  cleanupExpiredTasks(maxAgeHours: number = 24): number {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000
    let count = 0
    for (const [taskId, task] of this.taskStore) {
      const taskExpired = this.isExpired(task.expiresAt)
      const taskTooOld = new Date(task.createdAt).getTime() < cutoff
      if (taskExpired || taskTooOld) {
        this.removeTask(taskId)
        count++
      }
    }
    for (const [taskId, payload] of this.downloadStore) {
      const taskExists = this.taskStore.has(taskId)
      const payloadExpired = this.isExpired(payload.expiresAt)
      if (!taskExists || payloadExpired) {
        this.downloadStore.delete(taskId)
      }
    }
    return count
  }

  /**
   * 处理批量导出任务
   */
  private async processBatchExportTask(
    taskId: string,
    request: BatchExportRequest,
    limit: number,
  ): Promise<void> {
    const task = this.taskStore.get(taskId)
    if (!task) throw new Error('Task not found')

    task.status = 'processing'

    try {
      const sourceType = this.resolveSourceType(request.type)
      const dsl = this.buildExportDSL(request)

      // 当前阶段先完成 DSL 校验与解析，后续再接真实仓储查询。
      this.reportQueryService.parse(sourceType, dsl)
      await this.generateBatchExport(task, request, limit)

      task.status = 'completed'
      task.completedAt = new Date().toISOString()
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown export error'
      task.completedAt = new Date().toISOString()
      throw error
    }
  }

  /**
   * 生成导出元数据
   */
  private async generateBatchExport(
    task: BatchExportResult,
    request: BatchExportRequest,
    limit: number,
  ): Promise<void> {
    const appliedLimit = Math.min(request.limit ?? this.DEFAULT_BATCH_SIZE, limit, this.MAX_BATCH_SIZE)
    const filterCount = request.filter ? Object.keys(request.filter).length : 0

    // 当前阶段先基于请求规模给出稳定结果，避免随机行为导致任务状态不确定。
    task.rowCount = Math.max(1, appliedLimit - filterCount)
    task.size = task.rowCount * 128
    task.downloadUrl = `/api/reports/exports/${task.taskId}/download`

    await Promise.resolve()
  }

  private async processBatchExportResultTask(
    taskId: string,
    request: BatchExportRequest,
    result: ReportResult,
  ): Promise<void> {
    const task = this.taskStore.get(taskId)
    if (!task) throw new Error('Task not found')

    task.status = 'processing'

    try {
      const payload = this.renderExportPayload(result, request.format)

      this.downloadStore.set(taskId, payload)
      task.filename = payload.filename
      task.size = payload.size
      task.rowCount = result.rows.length
      task.downloadUrl = `/api/reports/exports/${taskId}/download`
      task.status = 'completed'
      task.completedAt = new Date().toISOString()
    } catch (error) {
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown export error'
      task.completedAt = new Date().toISOString()
      throw error
    }
  }

  private buildExportDSL(request: BatchExportRequest): Record<string, unknown> {
    const conditions: Array<Record<string, unknown>> = [
      {
        field: 'createdAt',
        op: '>=',
        value: request.period.from,
      },
      {
        field: 'createdAt',
        op: '<=',
        value: request.period.to,
      },
    ]

    if (request.filter) {
      for (const [field, value] of Object.entries(request.filter)) {
        conditions.push({
          field,
          op: Array.isArray(value) ? 'in' : '=',
          value,
        })
      }
    }

    return { AND: conditions }
  }

  private renderExportPayload(
    result: ReportResult,
    format: BatchExportRequest['format'],
  ): BatchExportDownloadPayload {
    if (format === 'xlsx') {
      throw new BadRequestException('Unsupported export format: xlsx')
    }

    const content =
      format === 'csv'
        ? this.toCSV(result)
        : format === 'json'
          ? this.toJSON(result)
          : this.toHTML(result)

    const createdAt = new Date().toISOString()
    const expiresAt = this.calculateExpiresAt(createdAt)

    return {
      tenantId: result.tenantId,
      filename: this.resolveExportFilename(result, format),
      format,
      size: content.length,
      contentType: this.resolveContentType(format),
      content,
      createdAt,
      expiresAt,
    }
  }

  private resolveExportFilename(result: ReportResult, format: BatchExportRequest['format']): string {
    if (format === 'xlsx') {
      const period = `${result.period.from.slice(0, 10)}_to_${result.period.to.slice(0, 10)}`
      return `${result.type}-${result.tenantId}-${period}.xlsx`
    }
    return this.filename(result, format)
  }

  private resolveContentType(format: 'csv' | 'json' | 'html'): string {
    switch (format) {
      case 'csv':
        return 'text/csv; charset=utf-8'
      case 'json':
        return 'application/json; charset=utf-8'
      case 'html':
        return 'text/html; charset=utf-8'
    }
  }

  private calculateExpiresAt(createdAt: string): string {
    return new Date(
      new Date(createdAt).getTime() + this.EXPORT_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString()
  }

  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= Date.now()
  }

  private removeTask(taskId: string): void {
    this.taskStore.delete(taskId)
    this.downloadStore.delete(taskId)
  }

  private isDownloadPayloadConsistent(
    task: BatchExportResult,
    payload: BatchExportDownloadPayload,
  ): boolean {
    return (
      task.filename === payload.filename &&
      task.format === payload.format &&
      task.size === payload.size &&
      payload.size === payload.content.length &&
      payload.contentType === this.resolveContentType(payload.format)
    )
  }

  private resolveSourceType(reportType: string): 'order' | 'payment' | 'refund' | 'member' | 'inventory' {
    const normalized = reportType.toLowerCase()
    const sourceTypeMap: Record<string, 'order' | 'payment' | 'refund' | 'member' | 'inventory'> = {
      order: 'order',
      revenue: 'payment',
      payment: 'payment',
      'payment-mix': 'payment',
      refund: 'refund',
      member: 'member',
      inventory: 'inventory',
      'inventory-alert': 'inventory',
      sales: 'order',
      transaction: 'payment',
    }

    const sourceType = sourceTypeMap[normalized]
    if (!sourceType) {
      throw new BadRequestException(`Unsupported report type: ${reportType}`)
    }

    return sourceType
  }

  // ============================================================
  // 转义辅助 (反模式 v4 csv-injection)
  // ============================================================

  private csvEscape(value: string): string {
    // 反模式 v4 csv-injection: 防御 formula injection
    const dangerous = /^[=+\-@\t\r]/
    let safe = dangerous.test(value) ? `'${value}` : value
    // RFC 4180: 包含逗号/双引号/换行 → 包裹双引号 + 转义双引号
    if (/[",\n\r]/.test(safe)) {
      safe = `"${safe.replace(/"/g, '""')}"`
    }
    return safe
  }

  private htmlEscape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
