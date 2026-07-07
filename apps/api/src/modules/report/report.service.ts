/**
 * 报表/看板 - Service (V10 Day 7 Phase 91)
 *
 * 核心能力:
 * - 8 类指标聚合 (sales/member/inventory/marketing/ai)
 * - 4 类周期 (daily/weekly/monthly/custom)
 * - 7 类维度 (store/tenant/brand/category/product/campaign/member_tier)
 * - 内存缓存 (TTL 可配)
 * - 看板布局 CRUD
 */

import { Injectable, NotFoundException } from '@nestjs/common'
import type {
  ReportDefinition,
  ReportDataPoint,
  DashboardLayout,
  ReportQueryRequest,
  ReportQueryResponse,
  ReportMetric,
  ReportPeriod,
} from './report.entity'

@Injectable()
export class ReportService {
  private readonly reports = new Map<string, ReportDefinition>()
  private readonly dashboards = new Map<string, DashboardLayout>()
  private readonly dataPoints: ReportDataPoint[] = []
  /** 简单内存缓存 */
  private readonly cache = new Map<string, { value: ReportQueryResponse; expiresAt: number }>()

  constructor() {
    this.seed()
  }

  // ============ 1. 报表 CRUD ============

  createReport(input: Omit<ReportDefinition, 'id' | 'createdAt' | 'updatedAt'>): ReportDefinition {
    const id = `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const report: ReportDefinition = { ...input, id, createdAt: now, updatedAt: now }
    this.reports.set(id, report)
    return report
  }

  getReport(id: string): ReportDefinition | null {
    return this.reports.get(id) ?? null
  }

  listReports(): ReportDefinition[] {
    return Array.from(this.reports.values())
  }

  // ============ 2. 数据查询 (聚合 + 缓存) ============

  async query(req: ReportQueryRequest): Promise<ReportQueryResponse> {
    const cacheKey = `${req.reportId}:${req.period}:${req.from ?? ''}:${req.to ?? ''}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value
    }

    const report = this.reports.get(req.reportId)
    if (!report) throw new NotFoundException(`Report ${req.reportId} not found`)

    const data = this.aggregate(report, req)
    const response: ReportQueryResponse = {
      reportId: req.reportId,
      period: req.period,
      generatedAt: new Date().toISOString(),
      data,
      totalPoints: data.length,
    }
    this.cache.set(cacheKey, { value: response, expiresAt: Date.now() + report.cacheTtl * 1000 })
    return response
  }

  private aggregate(report: ReportDefinition, req: ReportQueryRequest): ReportDataPoint[] {
    const metrics = req.metrics ?? report.metrics
    const filtered = this.dataPoints.filter((dp) => {
      if (!metrics.includes(dp.metric)) return false
      if (report.source !== this.sourceToDataSource(dp.metric)) return false
      if (req.from && dp.bucket < req.from) return false
      if (req.to && dp.bucket > req.to) return false
      return true
    })
    return filtered
  }

  private sourceToDataSource(metric: ReportMetric): string {
    if (metric.startsWith('sales')) return 'orders'
    if (metric.startsWith('member')) return 'members'
    if (metric.startsWith('inventory')) return 'inventory'
    if (metric.startsWith('marketing')) return 'marketing'
    if (metric.startsWith('ai')) return 'ai_logs'
    return 'orders'
  }

  // ============ 3. 数据注入 (模拟数据源) ============

  /** 模拟 BI 上报数据 */
  ingestDataPoints(points: ReportDataPoint[]): void {
    this.dataPoints.push(...points)
    if (this.dataPoints.length > 100000) {
      this.dataPoints.splice(0, this.dataPoints.length - 100000)
    }
    this.cache.clear() // 数据变化,失效缓存
  }

  /** 批量聚合 (按维度) */
  aggregateBy(metric: ReportMetric, dimension: string): Map<string, number> {
    const result = new Map<string, number>()
    for (const dp of this.dataPoints) {
      if (dp.metric !== metric) continue
      const key = dp.dimension
      result.set(key, (result.get(key) ?? 0) + dp.value)
    }
    return result
  }

  // ============ 4. 看板 CRUD ============

  createDashboard(input: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): DashboardLayout {
    const id = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const dashboard: DashboardLayout = { ...input, id, createdAt: now, updatedAt: now }
    this.dashboards.set(id, dashboard)
    return dashboard
  }

  getDashboard(id: string): DashboardLayout | null {
    return this.dashboards.get(id) ?? null
  }

  listDashboards(ownerId: string): DashboardLayout[] {
    return Array.from(this.dashboards.values()).filter(
      (d) => d.ownerId === ownerId || d.isShared,
    )
  }

  updateDashboard(id: string, patch: Partial<DashboardLayout>): DashboardLayout | null {
    const d = this.dashboards.get(id)
    if (!d) return null
    const updated = { ...d, ...patch, id: d.id, updatedAt: new Date().toISOString() }
    this.dashboards.set(id, updated)
    return updated
  }

  // ============ 5. 种子 (V10 Day 7) ============

  private seed(): void {
    const now = new Date().toISOString()
    const today = new Date()
    today.setDate(today.getDate() - 1)
    const dateStr = today.toISOString().slice(0, 10)

    // 报表定义 (3 个)
    this.reports.set('rpt-seed-sales', {
      id: 'rpt-seed-sales', name: '销售日报', period: 'daily',
      metrics: ['sales.amount', 'sales.count'], dimensions: ['store'],
      source: 'orders', cacheTtl: 60, createdBy: 'system',
      createdAt: now, updatedAt: now,
    })
    this.reports.set('rpt-seed-member', {
      id: 'rpt-seed-member', name: '会员周报', period: 'weekly',
      metrics: ['member.new', 'member.active'], dimensions: ['member_tier'],
      source: 'members', cacheTtl: 300, createdBy: 'system',
      createdAt: now, updatedAt: now,
    })
    this.reports.set('rpt-seed-ai', {
      id: 'rpt-seed-ai', name: 'AI 使用报表', period: 'daily',
      metrics: ['ai.tokens', 'ai.latency'], dimensions: ['store'],
      source: 'ai_logs', cacheTtl: 30, createdBy: 'system',
      createdAt: now, updatedAt: now,
    })

    // 数据点 (3 天 × 3 门店 × 4 metric)
    for (let day = 0; day < 3; day++) {
      const d = new Date(today)
      d.setDate(d.getDate() - day)
      const date = d.toISOString().slice(0, 10)
      for (const store of ['store-001', 'store-002', 'store-003']) {
        this.dataPoints.push({
          bucket: date, dimension: store, metric: 'sales.amount',
          value: 50000 + Math.floor(Math.random() * 30000),
        })
        this.dataPoints.push({
          bucket: date, dimension: store, metric: 'sales.count',
          value: 100 + Math.floor(Math.random() * 80),
        })
        this.dataPoints.push({
          bucket: date, dimension: store, metric: 'ai.tokens',
          value: 10000 + Math.floor(Math.random() * 5000),
        })
        this.dataPoints.push({
          bucket: date, dimension: store, metric: 'ai.latency',
          value: 200 + Math.floor(Math.random() * 100),
        })
      }
    }

    // 看板示例
    this.dashboards.set('dash-seed-overview', {
      id: 'dash-seed-overview', name: '总览看板',
      cards: [
        { id: 'c1', reportId: 'rpt-seed-sales', display: 'number', title: '今日销售额', size: { w: 3, h: 2 }, position: { x: 0, y: 0 } },
        { id: 'c2', reportId: 'rpt-seed-sales', display: 'line', title: '销售趋势', size: { w: 6, h: 4 }, position: { x: 3, y: 0 } },
        { id: 'c3', reportId: 'rpt-seed-ai', display: 'bar', title: 'AI 使用', size: { w: 3, h: 4 }, position: { x: 9, y: 0 } },
      ],
      ownerId: 'tenant-A', isShared: true,
      createdAt: now, updatedAt: now,
    })
  }
}
