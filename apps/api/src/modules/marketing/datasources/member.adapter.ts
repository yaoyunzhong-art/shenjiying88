import { Injectable } from '@nestjs/common'
import type { TenantId } from '../marketing.entity'

/**
 * Phase-42 T172: MemberSnapshot
 * RFM 计算需要的会员画像 (简化版, 反模式 v4)
 */
export interface MemberSnapshot {
  id: string
  tenantId: TenantId
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'VIP'
  lifecycleStage: 'NEW' | 'ACTIVE' | 'DORMANT' | 'CHURNED'
  totalSpendCents: number
  orderCount: number
  lastActiveAt: string
  createdAt: string
}

/**
 * MemberAdapter (RFM 计算的会员数据源)
 */
@Injectable()
export class MemberAdapter {
  private members = new Map<string, MemberSnapshot>()

  seed(members: MemberSnapshot[]): void {
    for (const m of members) {
      this.members.set(m.id, { ...m })
    }
  }

  query(tenantId: TenantId, memberId: string): MemberSnapshot | null {
    const m = this.members.get(memberId)
    if (!m || m.tenantId !== tenantId) return null
    return { ...m }
  }

  queryByTenant(tenantId: TenantId): MemberSnapshot[] {
    return Array.from(this.members.values())
      .filter(m => m.tenantId === tenantId)
      .map(m => ({ ...m }))
  }

  reset(): void {
    this.members.clear()
  }
}