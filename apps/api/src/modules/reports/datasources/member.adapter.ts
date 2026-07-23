import { Injectable } from '@nestjs/common'
import type { ReportFilterGroup } from '../reports.entity'

/**
 * Phase-39 T169: Member DataAdapter
 *
 * 数据源: Member (T166)
 * 字段: id, tenantId, level, source, status, lifecycleStage, createdAt, lastActiveAt
 */

export interface MemberRow {
  id: string
  tenantId: string
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  source: string
  status: 'ACTIVE' | 'DORMANT' | 'CHURNED'
  lifecycleStage: 'NEW' | 'ACTIVE' | 'DORMANT' | 'CHURNED'
  createdAt: string
  lastActiveAt?: string
}

@Injectable()
export class MemberAdapter {
  private mockData: MemberRow[] = []

  seed(data: MemberRow[]): void {
    this.mockData.push(...data)
  }

  reset(): void {
    this.mockData = []
  }

  query(tenantId: string, from: string, to: string, filters?: ReportFilterGroup): MemberRow[] {
    let all = this.mockData.filter(m =>
      m.tenantId === tenantId &&
      m.createdAt >= from &&
      m.createdAt <= to
    )
    if (filters) all = all.filter(m => this.matchFilters(m, filters))
    return all
  }

  /** 全租户查询 (用于 member-count 等) */
  queryAll(tenantId: string): MemberRow[] {
    return this.mockData.filter(m => m.tenantId === tenantId)
  }

  private matchFilters(row: MemberRow, group: ReportFilterGroup): boolean {
    const results = group.conditions.map(c => {
      if ('conditions' in c) return this.matchFilters(row, c as ReportFilterGroup)
      const v = (row as Record<string, unknown>)[c.field]
      switch (c.op) {
        case '=': return v === c.value
        case '!=': return v !== c.value
        case 'in': return Array.isArray(c.value) && c.value.includes(v)
        case 'between': return Array.isArray(c.value) && v >= c.value[0] && v <= c.value[1]
        default: return false
      }
    })
    return group.op === 'AND' ? results.every(Boolean) : results.some(Boolean)
  }
}