import type { RequestTenantContext } from '../tenant/tenant.types'
import type { CashierOrder, CashierPayment } from './cashier.entity'

/**
 * ICashierStore — 收银台存储接口
 *
 * 职责：收银台订单与支付记录的 CRUD 操作。
 * 实现方：CashierMemoryStore（测试/开发用）、CashierPrismaStore（生产用）
 *
 * 业务规则/状态机逻辑依然保留在 CashierService 中，Store 只负责持久化。
 */
export interface ICashierStore {
  saveOrder(order: CashierOrder): Promise<void>
  getOrder(orderId: string, tenantId: string): Promise<CashierOrder | undefined>
  listOrders(tenantId: string): Promise<CashierOrder[]>

  savePayment(payment: CashierPayment): Promise<void>
  getPayment(paymentId: string): Promise<CashierPayment | undefined>
  listPayments(orderId: string, tenantId: string): Promise<CashierPayment[]>

  updateOrder(orderId: string, tenantId: string, updates: Partial<CashierOrder>): Promise<void>
  updatePayment(paymentId: string, updates: Partial<CashierPayment>): Promise<void>

  /** 仅用于测试：清除所有内部状态 */
  resetForTests(): Promise<void>

  /**
   * 获取某个租户下所有订单（不按 tenant 过滤的原始迭代）
   * 仅用于统计/聚合操作（如 getChannelStats）
   */
  allOrders(): Promise<CashierOrder[]>

  /**
   * 获取某个租户下所有支付（不按 tenant 过滤的原始迭代）
   * 仅用于统计/聚合操作
   */
  allPayments(): Promise<CashierPayment[]>
}
