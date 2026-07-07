import { Injectable } from '@nestjs/common'
import type { TenantId } from '../marketing.entity'

/**
 * Phase-42 T172: OrderSnapshot
 */
export interface OrderSnapshot {
  id: string
  tenantId: TenantId
  memberId: string
  totalCents: number
  status: 'COMPLETED' | 'REFUNDED' | 'CANCELLED'
  createdAt: string
}

/**
 * OrderAdapter (RFM 计算的订单数据源)
 */
@Injectable()
export class OrderAdapter {
  private orders = new Map<string, OrderSnapshot>()

  seed(orders: OrderSnapshot[]): void {
    for (const o of orders) {
      this.orders.set(o.id, { ...o })
    }
  }

  queryByMember(tenantId: TenantId, memberId: string): OrderSnapshot[] {
    return Array.from(this.orders.values())
      .filter(o => o.tenantId === tenantId && o.memberId === memberId)
      .map(o => ({ ...o }))
  }

  queryByTenant(tenantId: TenantId): OrderSnapshot[] {
    return Array.from(this.orders.values())
      .filter(o => o.tenantId === tenantId)
      .map(o => ({ ...o }))
  }

  reset(): void {
    this.orders.clear()
  }
}