import { Injectable } from '@nestjs/common'
import type { TenantId, CouponIssueRecord, CouponPrecisionRule } from '../marketing.entity'

/**
 * CouponAdapter (优惠券发放记录 + 规则)
 */
@Injectable()
export class CouponAdapter {
  private records = new Map<string, CouponIssueRecord>()
  private rules: CouponPrecisionRule[] = []

  seedRules(rules: CouponPrecisionRule[]): void {
    this.rules = [...rules]
  }

  seedRecords(records: CouponIssueRecord[]): void {
    for (const r of records) {
      this.records.set(r.id, { ...r })
    }
  }

  save(record: CouponIssueRecord): CouponIssueRecord {
    this.records.set(record.id, { ...record })
    return record
  }

  query(tenantId: TenantId, recordId: string): CouponIssueRecord | null {
    const r = this.records.get(recordId)
    if (!r || r.tenantId !== tenantId) return null
    return { ...r }
  }

  queryByMember(tenantId: TenantId, memberId: string): CouponIssueRecord[] {
    return Array.from(this.records.values())
      .filter(r => r.tenantId === tenantId && r.memberId === memberId)
      .map(r => ({ ...r }))
  }

  /**
   * 频控查询: 时间窗口内发放数量
   */
  countInWindow(tenantId: TenantId, memberId: string, windowMs: number, now: number = Date.now()): number {
    const cutoff = now - windowMs
    let count = 0
    for (const r of this.records.values()) {
      if (r.tenantId !== tenantId || r.memberId !== memberId) continue
      const issuedAt = new Date(r.issuedAt).getTime()
      if (issuedAt >= cutoff) count++
    }
    return count
  }

  /**
   * 月预算查询 (V1 简化)
   */
  monthlyBudget(tenantId: TenantId, campaignId: string): number {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    let total = 0
    for (const r of this.records.values()) {
      if (r.tenantId !== tenantId || r.campaignId !== campaignId) continue
      const issuedAt = new Date(r.issuedAt).getTime()
      if (issuedAt >= monthStart) total++
    }
    return total
  }

  getRules(tenantId: TenantId): CouponPrecisionRule[] {
    return this.rules.filter(r => r.tenantId === tenantId && r.enabled)
  }

  reset(): void {
    this.records.clear()
    this.rules = []
  }
}