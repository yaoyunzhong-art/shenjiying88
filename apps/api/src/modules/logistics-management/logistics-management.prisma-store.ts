/**
 * Logistics Management Prisma Store
 *
 * 将 InMemory Map store 替换为 Prisma 持久化。
 * 策略: 启动时预加载DB数据到内存Map, 读写查内存, 写时同步写回DB。
 */

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type { SupplyVendor, SupplyOrder, InventoryItem, MaintenanceTask, LogisticsManagementMetrics } from './logistics-management.entity'

@Injectable()
export class LogisticsManagementPrismaStore implements OnApplicationBootstrap {
  private readonly logger = new Logger(LogisticsManagementPrismaStore.name)

  readonly supplierStore = new Map<string, SupplyVendor>()
  readonly purchaseOrderStore = new Map<string, SupplyOrder>()
  readonly stockMovementStore = new Map<string, never>()  // StockMovement prisma model
  readonly stockItemStore = new Map<string, InventoryItem>()
  readonly maintenanceTaskStore = new Map<string, MaintenanceTask>()
  readonly logisticsKPIStore = new Map<string, LogisticsManagementMetrics>()

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.loadAllData()
    this.logger.log('Logistics management data loaded from database')
  }

  async loadAllData(): Promise<void> {
    const suppliers = await this.prisma.supplier.findMany()
    for (const s of suppliers) this.supplierStore.set(s.id, s as unknown as SupplyVendor)

    const orders = await this.prisma.purchaseOrder.findMany()
    for (const o of orders) this.purchaseOrderStore.set(o.id, o as unknown as SupplyOrder)

    const items = await this.prisma.stockItem.findMany()
    for (const i of items) this.stockItemStore.set(i.id, i as unknown as InventoryItem)

    const tasks = await this.prisma.maintenanceTask.findMany()
    for (const t of tasks) this.maintenanceTaskStore.set(t.id, t as unknown as MaintenanceTask)

    const kpis = await this.prisma.logisticsKPI.findMany()
    for (const k of kpis) this.logisticsKPIStore.set(k.id, k as unknown as LogisticsManagementMetrics)
  }

  private async persistEntity<T>(
    store: Map<string, T>,
    id: string,
    prismaModel: any,
  ): Promise<void> {
    const entity = store.get(id)
    if (!entity) return
    await prismaModel.upsert({ where: { id }, create: entity, update: entity })
  }

  async persistSupplier(id: string): Promise<void> { return this.persistEntity(this.supplierStore, id, this.prisma.supplier) }
  async persistPurchaseOrder(id: string): Promise<void> { return this.persistEntity(this.purchaseOrderStore, id, this.prisma.purchaseOrder) }
  async persistStockItem(id: string): Promise<void> { return this.persistEntity(this.stockItemStore, id, this.prisma.stockItem) }
  async persistMaintenanceTask(id: string): Promise<void> { return this.persistEntity(this.maintenanceTaskStore, id, this.prisma.maintenanceTask) }
  async persistLogisticsKPI(id: string): Promise<void> { return this.persistEntity(this.logisticsKPIStore, id, this.prisma.logisticsKPI) }

  resetAll(): void {
    this.supplierStore.clear()
    this.purchaseOrderStore.clear()
    this.stockItemStore.clear()
    this.maintenanceTaskStore.clear()
    this.logisticsKPIStore.clear()
  }
}
