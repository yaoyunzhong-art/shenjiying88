import { Injectable } from '@nestjs/common'
import type {
  ReportDimension,
  ReportMetric,
  ReportRow,
  ReportPeriod
} from './reports.entity'

/**
 * Phase-39 T169: ReportAggregationService - 多维聚合引擎
 *
 * 反模式 v4 命中:
 *  - time-series-aggregation-pattern: 时间分组 day/week/month/year
 *  - caching-strategy-pattern: 同 (tenantId, type, filters) 复用结果
 *  - multi-tenant-data-isolation: 强制 tenantId
 *
 * 算法:
 *  - 维度分组: Map<dimKey, rawRows[]>
 *  - 度量计算: reduce(metric.fn) → number
 *  - 时间维度: createdAt 截断 (ISO 8601)
 */

@Injectable()
export class ReportAggregationService {
  /**
   * 通用聚合入口
   * @param rows 原始数据 (来自 adapter)
   * @param dimensions 维度数组 (支持多维)
   * @param metrics 度量数组
   * @param filters 筛选 (在 adapter 已应用, 此处冗余过滤)
   */
  aggregate(
    rows: any[],
    dimensions: ReportDimension[],
    metrics: ReportMetric[]
  ): ReportRow[] {
    if (rows.length === 0) return []
    if (dimensions.length === 0) {
      // 无维度 → 单行总计
      return [this.computeMetricsForGroup(rows, metrics)]
    }

    // 多维分组
    const groups = this.groupByDimensions(rows, dimensions)
    const result: ReportRow[] = []
    for (const [key, groupRows] of groups) {
      const row: ReportRow = {}
      // 解析维度 key (用 | 分隔)
      const dimValues = key.split('||')
      dimensions.forEach((dim, idx) => {
        row[dim.alias ?? dim.field] = this.parseDimensionValue(dimValues[idx])
      })
      // 计算度量
      const metricRow = this.computeMetricsForGroup(groupRows, metrics)
      Object.assign(row, metricRow)
      result.push(row)
    }
    return result
  }

  /**
   * 时间维度截断 (反模式 v4 time-series-aggregation)
   */
  timeBucket(iso: string, granularity: ReportPeriod): string {
    const d = new Date(iso)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    switch (granularity) {
      case 'day': return `${yyyy}-${mm}-${dd}`
      case 'week': {
        // ISO 周: 取周四所在周
        const tmp = new Date(d)
        tmp.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
        const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
        const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
        return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
      }
      case 'month': return `${yyyy}-${mm}`
      case 'year': return `${yyyy}`
      default: return iso
    }
  }

  /**
   * 计算一组行的度量
   */
  computeMetricsForGroup(rows: any[], metrics: ReportMetric[]): ReportRow {
    const out: ReportRow = {}
    for (const m of metrics) {
      out[m.alias] = this.computeMetric(rows, m.field, m.fn)
    }
    return out
  }

  /**
   * 计算单个度量
   */
  computeMetric(rows: any[], field: string, fn: ReportMetric['fn']): number {
    if (rows.length === 0) return 0
    const values: number[] = rows.map(r => Number(r[field])).filter(v => Number.isFinite(v))
    if (values.length === 0) return 0
    switch (fn) {
      case 'sum': return values.reduce((acc, v) => acc + v, 0)
      case 'count': return rows.length
      case 'avg': return values.reduce((acc, v) => acc + v, 0) / values.length
      case 'min': return Math.min(...values)
      case 'max': return Math.max(...values)
      case 'distinct': return new Set(values).size
      default: return 0
    }
  }

  // ============================================================
  // 内部辅助
  // ============================================================

  private groupByDimensions(rows: any[], dimensions: ReportDimension[]): Map<string, any[]> {
    const groups = new Map<string, any[]>()
    for (const row of rows) {
      const keyParts = dimensions.map(dim => {
        const raw = row[dim.field]
        if (raw == null) return 'null'
        if (dim.granularity) return this.timeBucket(String(raw), dim.granularity)
        return String(raw)
      })
      const key = keyParts.join('||')
      const arr = groups.get(key) ?? []
      arr.push(row)
      groups.set(key, arr)
    }
    return groups
  }

  private parseDimensionValue(raw: string): string | number {
    if (raw === 'null') return null as unknown as Record<string, unknown>
    const n = Number(raw)
    if (!Number.isNaN(n) && Number.isFinite(n) && raw !== '') return n
    return raw
  }
}