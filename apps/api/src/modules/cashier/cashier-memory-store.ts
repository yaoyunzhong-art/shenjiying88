import { Injectable } from '@nestjs/common'
import type { ICashierStore } from './cashier-store.interface'
import type { CashierOrder, CashierPayment } from './cashier.entity'

/**
 * CashierMemoryStore — 内存实现的收银台存储
 *
 * 用于测试/开发环境，作为 CashierService 的默认 fallback。
 * 所有方法返回 Promise，但内部操作同步执行后 Promise.resolve。
 *
 * ⚠️ 同步访问器（以 Sync 结尾的方法）不被 ICashierStore 接口包含，
 * 仅用于 CashierService 中需要同步读写的公开方法向后兼容。
 */
@Injectable()
export class CashierMemoryStore implements ICashierStore {
  private readonly orders = new Map<string, CashierOrder>()
  private readonly payments = new Map<string, CashierPayment>()

  // ── ICashierStore 接口实现：异步 ────────────────────────────────

  async saveOrder(order: CashierOrder): Promise<void> {
    this.orders.set(order.orderId, order)
  }

  async getOrder(orderId: string, _tenantId: string): Promise<CashierOrder | undefined> {
    return this.orders.get(orderId)
  }

  async listOrders(tenantId: string): Promise<CashierOrder[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.tenantContext.tenantId === tenantId
    )
  }

  async savePayment(payment: CashierPayment): Promise<void> {
    this.payments.set(payment.paymentId, payment)
  }

  async getPayment(paymentId: string): Promise<CashierPayment | undefined> {
    return this.payments.get(paymentId)
  }

  async listPayments(orderId: string, tenantId: string): Promise<CashierPayment[]> {
    return Array.from(this.payments.values()).filter((payment) => {
      const order = this.orders.get(payment.orderId)
      return payment.orderId === orderId && order?.tenantContext.tenantId === tenantId
    })
  }

  async updateOrder(orderId: string, _tenantId: string, updates: Partial<CashierOrder>): Promise<void> {
    const existing = this.orders.get(orderId)
    if (existing) {
      this.orders.set(orderId, { ...existing, ...updates })
    }
  }

  async updatePayment(paymentId: string, updates: Partial<CashierPayment>): Promise<void> {
    const existing = this.payments.get(paymentId)
    if (existing) {
      this.payments.set(paymentId, { ...existing, ...updates })
    }
  }

  async resetForTests(): Promise<void> {
    this.orders.clear()
    this.payments.clear()
  }

  async allOrders(): Promise<CashierOrder[]> {
    return Array.from(this.orders.values())
  }

  async allPayments(): Promise<CashierPayment[]> {
    return Array.from(this.payments.values())
  }

  // ── 同步访问器（向后兼容，不在 ICashierStore 接口中）────────────

  /** 同步获取订单（用于 CashierService 的 sync public methods） */
  getOrderSync(orderId: string): CashierOrder | undefined {
    return this.orders.get(orderId)
  }

  /** 同步列出某租户的订单 */
  listOrdersSync(tenantId: string): CashierOrder[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.tenantContext.tenantId === tenantId
    )
  }

  /** 同步获取支付记录 */
  getPaymentSync(paymentId: string): CashierPayment | undefined {
    return this.payments.get(paymentId)
  }

  /** 同步列出某订单的支付记录（不按 tenant 过滤） */
  listPaymentsByOrderSync(orderId: string): CashierPayment[] {
    return Array.from(this.payments.values()).filter((p) => p.orderId === orderId)
  }

  /** 同步列出某租户的所有支付（通过订单关联） */
  listPaymentsByTenantSync(tenantId: string): CashierPayment[] {
    return Array.from(this.payments.values()).filter((payment) => {
      const order = this.orders.get(payment.orderId)
      return order?.tenantContext.tenantId === tenantId
    })
  }

  /** 同步迭代所有订单 */
  allOrdersValuesSync(): IterableIterator<CashierOrder> {
    return this.orders.values()
  }

  /** 将 store 的同步引用绑定到 existing Maps */
  bindMaps(orders: Map<string, CashierOrder>, payments: Map<string, CashierPayment>): void {
    // 清除当前引用
    this.orders.clear()
    this.payments.clear()
    // Nullish pattern — 本实现在构造时自行创建内部 Map，无需 bind
  }
}
