import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { ICashierStore } from './cashier-store.interface'
import type { CashierOrder, CashierPayment } from './cashier.entity'

/**
 * CashierPrismaStore — Prisma 实现的收银台存储（生产环境）
 *
 * TODO: 在 prisma/schema.prisma 中完成 cashier 相关表定义后实现各方法。
 */
@Injectable()
export class CashierPrismaStore implements ICashierStore {
  constructor(private readonly prisma: PrismaService) {}

  async saveOrder(order: CashierOrder): Promise<void> {
    // TODO: 实现 Prisma upsert
    // 先在 cashier 模块 prisma schema 建表
    throw new Error('Not implemented yet')
  }

  async getOrder(orderId: string, tenantId: string): Promise<CashierOrder | undefined> {
    throw new Error('Not implemented yet')
  }

  async listOrders(tenantId: string): Promise<CashierOrder[]> {
    throw new Error('Not implemented yet')
  }

  async savePayment(payment: CashierPayment): Promise<void> {
    throw new Error('Not implemented yet')
  }

  async getPayment(paymentId: string): Promise<CashierPayment | undefined> {
    throw new Error('Not implemented yet')
  }

  async listPayments(orderId: string, tenantId: string): Promise<CashierPayment[]> {
    throw new Error('Not implemented yet')
  }

  async updateOrder(orderId: string, tenantId: string, updates: Partial<CashierOrder>): Promise<void> {
    throw new Error('Not implemented yet')
  }

  async updatePayment(paymentId: string, updates: Partial<CashierPayment>): Promise<void> {
    throw new Error('Not implemented yet')
  }

  async resetForTests(): Promise<void> {
    // No-op: PrismaStore 的测试重置通过事务回滚
  }

  async allOrders(): Promise<CashierOrder[]> {
    throw new Error('Not implemented yet')
  }

  async allPayments(): Promise<CashierPayment[]> {
    throw new Error('Not implemented yet')
  }
}
