import { Module } from '@nestjs/common'
import { InventoryController } from './inventory.controller'
import { InventoryPurchaseController } from './inventory-purchase.controller'
import { PurchaseOrderController } from './purchase-order.controller'
import { InventoryService } from './inventory.service'
import { InventoryPurchaseService } from './inventory-purchase.service'
import { PurchaseOrderService } from './purchase-order.service'

/**
 * InventoryModule · 库存与采购模块 (P-37 增强)
 *
 * 包含:
 *  - InventoryController / InventoryService: 基础库存管理 CRUD (Products/Stock/Suppliers)
 *  - InventoryPurchaseController / InventoryPurchaseService: 采购单增强 (审批流/付款/退货)
 *  - PurchaseOrderController / PurchaseOrderService: 采购订单流转 (历史/时间线/批量操作)
 */
@Module({
  controllers: [
    InventoryController,
    InventoryPurchaseController,
    PurchaseOrderController
  ],
  providers: [
    InventoryService,
    InventoryPurchaseService,
    PurchaseOrderService
  ],
  exports: [
    InventoryService,
    InventoryPurchaseService,
    PurchaseOrderService
  ]
})
export class InventoryModule {}
