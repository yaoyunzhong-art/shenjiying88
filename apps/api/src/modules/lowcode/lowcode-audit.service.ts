/**
 * lowcode-audit.service.ts - T113-4
 * 低代码页面构建器 + 实时审计告警服务
 */

import { Injectable } from '@nestjs/common'

// ============== 类型定义 ==============

export interface PageTemplate {
  id: string
  name: string
  components: { type: string; defaultProps: Record<string, unknown> }[]
}

export interface Page {
  id: string
  templateId: string
  name: string
  components: Component[]
  status: 'draft' | 'published'
  createdAt: Date
  updatedAt: Date
}

export interface Component {
  id: string
  type: string
  props: Record<string, unknown>
}

export interface MetricRecord {
  name: string
  value: number
  tags: Record<string, string>
  timestamp: Date
}

export interface AlertRecord {
  id: string
  metricName: string
  currentValue: number
  threshold: number
  triggeredAt: Date
  tags: Record<string, string>
}

export interface MetricTrend {
  metricName: string
  dataPoints: { timestamp: Date; value: number }[]
  window: string
}

// ============== LowCodePageBuilder ==============

@Injectable()
export class LowCodePageBuilder {
  private pages = new Map<string, Page>()
  private templates = new Map<string, PageTemplate>([
    ['tpl-dashboard', { id: 'tpl-dashboard', name: '仪表盘', components: [
      { type: 'navbar', defaultProps: { title: '仪表盘' } },
      { type: 'chart', defaultProps: { type: 'line' } },
    ]}],
    ['tpl-form', { id: 'tpl-form', name: '表单', components: [
      { type: 'navbar', defaultProps: { title: '表单' } },
      { type: 'input', defaultProps: { label: '输入' } },
      { type: 'button', defaultProps: { text: '提交' } },
    ]}],
    ['tpl-blank', { id: 'tpl-blank', name: '空白', components: [
      { type: 'navbar', defaultProps: { title: '页面' } },
    ]}],
  ])

  createPage(templateId: string, data?: Record<string, unknown>): Page {
    const tpl = this.templates.get(templateId)
    if (!tpl) throw new Error(`Template not found: ${templateId}`)

    const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const page: Page = {
      id: pageId,
      templateId,
      name: (data?.name as string) ?? tpl.name,
      components: tpl.components.map((def, idx) => ({
        id: `comp-${idx}`,
        type: def.type,
        props: { ...def.defaultProps },
      })),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.pages.set(pageId, page)
    return page
  }

  addComponent(pageId: string, component: Omit<Component, 'id'>): Component {
    const page = this.pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const comp: Component = { id: `comp-${Date.now()}`, type: component.type, props: component.props ?? {} }
    page.components.push(comp)
    page.updatedAt = new Date()
    return comp
  }

  updateComponent(pageId: string, componentId: string, props: Record<string, unknown>): Component {
    const page = this.pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const comp = page.components.find((c) => c.id === componentId)
    if (!comp) throw new Error(`Component not found: ${componentId}`)
    comp.props = { ...comp.props, ...props }
    page.updatedAt = new Date()
    return comp
  }

  removeComponent(pageId: string, componentId: string): boolean {
    const page = this.pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const idx = page.components.findIndex((c) => c.id === componentId)
    if (idx === -1) throw new Error(`Component not found: ${componentId}`)
    page.components.splice(idx, 1)
    page.updatedAt = new Date()
    return true
  }

  publishPage(pageId: string): Page {
    const page = this.pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    page.status = 'published'
    page.updatedAt = new Date()
    return page
  }

  renderPage(pageId: string): string {
    const page = this.pages.get(pageId)
    if (!page) throw new Error(`Page not found: ${pageId}`)
    const components = page.components.map((c) => `  <div data-component="${c.type}">${JSON.stringify(c.props)}</div>`).join('\n')
    return `<!DOCTYPE html>\n<html>\n<head><title>${page.name}</title></head>\n<body>\n${components}\n</body>\n</html>`
  }

  getPage(id: string) { return this.pages.get(id) }
  getTemplate(id: string) { return this.templates.get(id) }
}

// ============== LowcodeAuditService (审计管理) ==============

@Injectable()
export class LowcodeAuditService {
  private auditRecords: Array<{ pageId: string; reviewer: string; action: string; comment?: string; timestamp: Date }> = []

  recordAudit(record: { pageId: string; reviewer: string; action: string; comment?: string }): void {
    this.auditRecords.push({ ...record, timestamp: new Date() })
  }

  getAuditHistory(pageId: string): Array<{ pageId: string; reviewer: string; action: string; comment?: string; timestamp: Date }> {
    return this.auditRecords.filter(r => r.pageId === pageId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

// ============== AuditAlertService ==============

@Injectable()
export class AuditAlertService {
  private metrics: MetricRecord[] = []
  private alerts: AlertRecord[] = []
  private thresholds = new Map<string, number>([
    ['error_rate', 2],
    ['latency_p99', 500],
    ['cpu_usage', 80],
  ])

  recordMetric(name: string, value: number, tags: Record<string, string> = {}): MetricRecord {
    const record: MetricRecord = { name, value, tags, timestamp: new Date() }
    this.metrics.push(record)
    return record
  }

  checkThresholds(metricName: string): { exceeded: boolean; currentValue: number; threshold: number } {
    const threshold = this.thresholds.get(metricName) ?? 2
    const latest = this.metrics.filter((m) => m.name === metricName).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    return { exceeded: latest ? latest.value > threshold : false, currentValue: latest?.value ?? 0, threshold }
  }

  fireAlertIfExceeded(metricName: string, currentValue: number, threshold?: number): AlertRecord | null {
    const t = threshold ?? this.thresholds.get(metricName) ?? 2
    if (currentValue <= t) return null
    const alert: AlertRecord = { id: `alert-${Date.now()}`, metricName, currentValue, threshold: t, triggeredAt: new Date(), tags: {} }
    this.alerts.push(alert)
    return alert
  }

  getAlertHistory(filter?: { metricName?: string; startDate?: Date; endDate?: Date }): AlertRecord[] {
    let results = [...this.alerts]
    if (filter?.metricName) results = results.filter((a) => a.metricName === filter.metricName)
    if (filter?.startDate) results = results.filter((a) => a.triggeredAt >= filter.startDate!)
    if (filter?.endDate) results = results.filter((a) => a.triggeredAt <= filter.endDate!)
    return results.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
  }

  getMetricTrend(metricName: string, window: string = '1h'): MetricTrend {
    const ms = this.parseWindow(window)
    const cutoff = Date.now() - ms
    const points = this.metrics
      .filter((m) => m.name === metricName && m.timestamp.getTime() >= cutoff)
      .map((m) => ({ timestamp: m.timestamp, value: m.value }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    return { metricName, dataPoints: points, window }
  }

  private parseWindow(w: string): number {
    const m = w.match(/^(\d+)([smhd])$/)
    if (!m) return 3600000
    const v = parseInt(m[1])
    return { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]]! * v
  }

  clearMetrics() { this.metrics = [] }
  clearAlerts() { this.alerts = [] }
}
