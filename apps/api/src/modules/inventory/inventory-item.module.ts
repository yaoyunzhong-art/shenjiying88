import { Module } from '@nestjs/common'
import { InventoryItemController } from './inventory-item.controller'
import { InventoryItemService } from './inventory-item.service'
import { InventoryReservationCron } from './inventory.cron'

/**
 * Phase-37 T167: 库存 SKU 维度 (InventoryItem + Reservation)
 *
 * 不影响 Phase-6 inventory.service.ts / inventory.controller.ts (Product/Supplier)
 * 路由前缀 /api/inventory/items (与 /api/inventory/products 并存)
 */

@Module({
  controllers: [InventoryItemController],
  providers: [InventoryItemService, InventoryReservationCron],
  exports: [InventoryItemService]
})
export class InventoryItemModule {}
