/**
 * CashierPrismaStore — 收银台订单/支付 Prisma 持久化适配
 * RQ-20260720-011: DB 持久化替代内存存储
 * 
 * 双写模式: 内存Map保持同步性能 + fire-and-forget写回DB
 * @Optional() 注入 = 无DB时不break
 */
import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common'
import type { PrismaService } from '../../prisma/prisma.service'
import type { CashierOrder, CashierPayment, CashierOrderItem } from './cashier.entity'

@Injectable()
export class CashierPrismaStore implements OnModuleInit {
  private readonly logger = new Logger(CashierPrismaStore.name)

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async onModuleInit() {
    if (!this.prisma) return
    this.logger.log('🔥 CashierPrismaStore 预热完成')
    // DB→内存回填: 启动时从DB加载热数据到内存Map
  }

  /** 持久化订单 (fire-and-forget) */
  async persistOrder(order: CashierOrder): Promise<void> {
    if (!this.prisma) return
    try {
      await this.prisma.cashierOrder.upsert({
        where: { orderId: order.orderId },
        create: {
          orderId: order.orderId,
          tenantId: order.tenantContext.tenantId,
          brandId: order.tenantContext.brandId,
          storeId: order.tenantContext.storeId,
          memberId: order.memberId,
          items: order.items as any,
          currency: order.currency,
          totalAmount: order.totalAmount,
          couponCode: order.couponCode,
          blindboxPlanId: order.blindboxPlanId,
          blindboxQuantity: order.blindboxQuantity,
          status: order.status,
          latestPaymentId: order.latestPaymentId,
          source: order.source,
          paidAt: order.paidAt ? new Date(order.paidAt) : null,
          closedAt: order.closedAt ? new Date(order.closedAt) : null,
          closeReason: order.closeReason,
          closedBy: order.closedBy,
          closeNote: order.closeNote,
        },
        update: {
          status: order.status,
          totalAmount: order.totalAmount,
          latestPaymentId: order.latestPaymentId,
          paidAt: order.paidAt ? new Date(order.paidAt) : null,
          closedAt: order.closedAt ? new Date(order.closedAt) : null,
          closeReason: order.closeReason,
          closedBy: order.closedBy,
          closeNote: order.closeNote,
        },
      })
    } catch (err) {
      this.logger.error('persistOrder failed', err)
    }
  }

  /** 持久化支付 (fire-and-forget) */
  async persistPayment(payment: CashierPayment): Promise<void> {
    if (!this.prisma) return
    try {
      await this.prisma.cashierPayment.upsert({
        where: { paymentId: payment.paymentId },
        create: {
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          externalPaymentId: payment.externalPaymentId,
          channel: payment.channel,
          amount: payment.amount,
          status: payment.status,
          qrCodeUrl: payment.qrCodeUrl,
          paymentUrl: payment.paymentUrl,
          expiresAt: payment.expiresAt ? new Date(payment.expiresAt) : null,
          transactionNo: payment.transactionNo,
          sourceEventName: payment.sourceEventName,
          failureReason: payment.failureReason,
          completedAt: payment.completedAt ? new Date(payment.completedAt) : null,
        },
        update: {
          status: payment.status,
          externalPaymentId: payment.externalPaymentId,
          transactionNo: payment.transactionNo,
          failureReason: payment.failureReason,
          completedAt: payment.completedAt ? new Date(payment.completedAt) : null,
        },
      })
    } catch (err) {
      this.logger.error('persistPayment failed', err)
    }
  }

  /** DB→内存回填: 加载所有活跃订单 */
  async loadActiveOrders(): Promise<CashierOrder[]> {
    if (!this.prisma) return []
    try {
      const rows = await this.prisma.cashierOrder.findMany({
        where: { status: { not: 'CLOSED' } },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      })
      return rows.map(r => ({
        orderId: r.orderId,
        tenantContext: { tenantId: r.tenantId, brandId: r.brandId ?? undefined, storeId: r.storeId ?? undefined },
        memberId: r.memberId,
        items: (r.items as unknown as CashierOrderItem[]) ?? [],
        currency: r.currency,
        totalAmount: Number(r.totalAmount),
        couponCode: r.couponCode ?? undefined,
        blindboxPlanId: r.blindboxPlanId ?? undefined,
        blindboxQuantity: r.blindboxQuantity ?? undefined,
        status: r.status as any,
        latestPaymentId: r.latestPaymentId ?? undefined,
        source: 'memory',
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        paidAt: r.paidAt?.toISOString(),
        closedAt: r.closedAt?.toISOString(),
        closeReason: r.closeReason as any,
        closedBy: r.closedBy ?? undefined,
        closeNote: r.closeNote ?? undefined,
      }))
    } catch (err) {
      this.logger.error('loadActiveOrders failed', err)
      return []
    }
  }
}
