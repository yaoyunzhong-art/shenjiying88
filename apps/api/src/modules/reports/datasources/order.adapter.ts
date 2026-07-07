import { Injectable } from '@nestjs/common'
import type { ReportFilterGroup } from '../reports.entity'

/**
 * Phase-39 T169: Order DataAdapter
 *
 * 反模式 v4 命中:
 *  - multi-tenant-data-isolation: 强制 tenantId
 *  - time-series-aggregation: createdAt 索引
 *
 * 数据源: 订单 (in-memory mock)
 * 字段: id, tenantId, orderId, status, totalCents, createdAt, source, memberId
 */

export interface OrderRow {
  id: string
  tenantId: string
  orderId: string
  status: 'CREATED' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  totalCents: number
  source: string  // 渠道: web/app/wechat/alipay/miniprogram
  memberId?: string
  itemCount: number
  createdAt: string  // ISO
}

@Injectable()
export class OrderAdapter {
  /** 测试/演示数据 (跨租户聚合后被过滤) */
  private mockData: OrderRow[] = []

  /** 注入测试数据 */
  seed(data: OrderRow[]): void {
    this.mockData.push(...data)
  }

  reset(): void {
    this.mockData = []
  }

  /**
   * 查询订单 (支持时间范围 + 筛选)
   */
  query(
    tenantId: string,
    from: string,
    to: string,
    filters?: ReportFilterGroup
  ): OrderRow[] {
    let all = this.mockData.filter(o =>
      o.tenantId === tenantId &&
      o.createdAt >= from &&
      o.createdAt <= to
    )
    if (filters) {
      all = all.filter(o => this.matchFilters(o, filters))
    }
    return all
  }

  /**
   * 简易 DSL 匹配
   */
  private matchFilters(row: OrderRow, group: ReportFilterGroup): boolean {
    const results = group.conditions.map(c => {
      if ('conditions' in c) {
        return this.matchFilters(row, c as ReportFilterGroup)
      }
      const v = (row as any)[c.field]
      switch (c.op) {
        case '=': return v === c.value
        case '!=': return v !== c.value
        case '>': return v > c.value
        case '>=': return v >= c.value
        case '<': return v < c.value
        case '<=': return v <= c.value
        case 'in': return Array.isArray(c.value) && c.value.includes(v)
        case 'notIn': return Array.isArray(c.value) && !c.value.includes(v)
        case 'between': return Array.isArray(c.value) && v >= c.value[0] && v <= c.value[1]
        case 'like': return typeof v === 'string' && v.includes(String(c.value).replace(/%/g, ''))
        default: return false
      }
    })
    return group.op === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }
}