import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { TenantGuard } from '../agent/tenant.guard'
import { LogisticsManagementService } from './logistics-management.service'
import {
  CreateSupplyOrderDto,
  UpdateSupplyOrderDto,
  QuerySupplyOrderDto,
  CreateSupplyVendorDto,
  UpdateSupplyVendorDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  QueryInventoryItemDto,
  CreateMaintenanceTaskDto,
  UpdateMaintenanceTaskDto,
  QueryMaintenanceTaskDto,
} from './logistics-management.dto'
import type {
  SupplyOrder,
  SupplyVendor,
  InventoryItem,
  MaintenanceTask,
  LogisticsManagementMetrics,
} from './logistics-management.entity'
import type {
  VendorStatus,
  SupplyOrderStatus,
  MaintenanceTaskStatus,
  MaintenanceTaskType,
} from './logistics-management.entity'

// 当前 P-30 骨架阶段使用硬编码 tenant; 上线后替换为真实租户上下文
const MOCK_TENANT_ID = 'tenant-1'

@UseGuards(TenantGuard)
@Controller('logistics-management')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class LogisticsManagementController {
  constructor(private readonly service: LogisticsManagementService) {}

  // ═══════════════════════════════════════════
  //  SupplyOrder (采购订单CRUD)
  // ═══════════════════════════════════════════

  @Post('supply-orders')
  createSupplyOrder(@Body() body: CreateSupplyOrderDto): SupplyOrder {
    return this.service.createSupplyOrder({
      tenantId: MOCK_TENANT_ID,
      storeId: body.storeId,
      orderNumber: body.orderNumber,
      vendorId: body.vendorId,
      vendorName: body.vendorName,
      items: body.items.map((i) => ({
        inventoryItemId: i.inventoryItemId,
        itemName: i.itemName,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      expectedDeliveryDate: body.expectedDeliveryDate,
      notes: body.notes,
      createdBy: MOCK_TENANT_ID,
      createdByName: body.createdByName,
    })
  }

  @Get('supply-orders')
  listSupplyOrders(@Query() query: QuerySupplyOrderDto): SupplyOrder[] {
    return this.service.listSupplyOrders(MOCK_TENANT_ID, {
      status: query.status as SupplyOrderStatus | undefined,
      vendorId: query.vendorId,
    })
  }

  @Get('supply-orders/:id')
  getSupplyOrder(@Param('id') id: string): SupplyOrder | undefined {
    return this.service.getSupplyOrder(id, MOCK_TENANT_ID)
  }

  @Patch('supply-orders/:id')
  updateSupplyOrder(
    @Param('id') id: string,
    @Body() body: UpdateSupplyOrderDto,
  ): SupplyOrder {
    return this.service.updateSupplyOrder(id, MOCK_TENANT_ID, body)
  }

  @Delete('supply-orders/:id')
  deleteSupplyOrder(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteSupplyOrder(id, MOCK_TENANT_ID)
    return { success: result }
  }

  // ═══════════════════════════════════════════
  //  SupplyVendor (供应商管理)
  // ═══════════════════════════════════════════

  @Post('supply-vendors')
  createSupplyVendor(@Body() body: CreateSupplyVendorDto): SupplyVendor {
    return this.service.createSupplyVendor({
      tenantId: MOCK_TENANT_ID,
      code: body.code,
      name: body.name,
      category: body.category,
      grade: body.grade as any,
      contacts: body.contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email,
        position: c.position,
      })),
      address: body.address,
      mainProducts: body.mainProducts,
      cooperationYears: body.cooperationYears,
      notes: body.notes,
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('supply-vendors')
  listSupplyVendors(
    @Query('status') status?: string,
    @Query('category') category?: string,
  ): SupplyVendor[] {
    return this.service.listSupplyVendors(MOCK_TENANT_ID, {
      status: status as VendorStatus | undefined,
      category,
    })
  }

  @Get('supply-vendors/:id')
  getSupplyVendor(@Param('id') id: string): SupplyVendor | undefined {
    return this.service.getSupplyVendor(id, MOCK_TENANT_ID)
  }

  @Patch('supply-vendors/:id')
  updateSupplyVendor(
    @Param('id') id: string,
    @Body() body: UpdateSupplyVendorDto,
  ): SupplyVendor {
    return this.service.updateSupplyVendor(id, MOCK_TENANT_ID, body)
  }

  @Delete('supply-vendors/:id')
  deleteSupplyVendor(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteSupplyVendor(id, MOCK_TENANT_ID)
    return { success: result }
  }

  // ═══════════════════════════════════════════
  //  InventoryItem (库存物品CRUD + 盘点)
  // ═══════════════════════════════════════════

  @Post('inventory-items')
  createInventoryItem(@Body() body: CreateInventoryItemDto): InventoryItem {
    return this.service.createInventoryItem({
      tenantId: MOCK_TENANT_ID,
      storeId: body.storeId,
      itemCode: body.itemCode,
      name: body.name,
      category: body.category as any,
      specification: body.specification,
      unit: body.unit,
      quantity: body.quantity,
      minQuantity: body.minQuantity,
      unitCost: body.unitCost,
      warehouseCode: body.warehouseCode,
      location: body.location,
      notes: body.notes,
      createdBy: MOCK_TENANT_ID,
    })
  }

  @Get('inventory-items')
  listInventoryItems(@Query() query: QueryInventoryItemDto): InventoryItem[] {
    return this.service.listInventoryItems(MOCK_TENANT_ID, {
      category: query.category as any,
      storeId: query.storeId,
      search: query.search,
    })
  }

  @Get('inventory-items/:id')
  getInventoryItem(@Param('id') id: string): InventoryItem | undefined {
    return this.service.getInventoryItem(id, MOCK_TENANT_ID)
  }

  @Patch('inventory-items/:id')
  updateInventoryItem(
    @Param('id') id: string,
    @Body() body: UpdateInventoryItemDto,
  ): InventoryItem {
    return this.service.updateInventoryItem(id, MOCK_TENANT_ID, body)
  }

  @Delete('inventory-items/:id')
  deleteInventoryItem(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteInventoryItem(id, MOCK_TENANT_ID)
    return { success: result }
  }

  @Post('inventory-items/:id/stocktake')
  stocktake(
    @Param('id') id: string,
    @Body() body: { quantity: number; note?: string },
  ): InventoryItem {
    return this.service.stocktake(id, MOCK_TENANT_ID, body.quantity, body.note)
  }

  @Get('inventory-items/low-stock')
  getLowStockItems(@Query('storeId') storeId?: string): InventoryItem[] {
    return this.service.getLowStockItems(MOCK_TENANT_ID, storeId)
  }

  // ═══════════════════════════════════════════
  //  MaintenanceTask (维护任务CRUD + 排期)
  // ═══════════════════════════════════════════

  @Post('maintenance-tasks')
  createMaintenanceTask(@Body() body: CreateMaintenanceTaskDto): MaintenanceTask {
    return this.service.createMaintenanceTask({
      tenantId: MOCK_TENANT_ID,
      storeId: body.storeId,
      equipmentName: body.equipmentName,
      equipmentId: body.equipmentId,
      taskType: body.taskType as any,
      priority: body.priority as any,
      description: body.description,
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      scheduledAt: body.scheduledAt,
      reportedBy: MOCK_TENANT_ID,
      reportedByName: body.reportedByName,
    })
  }

  @Get('maintenance-tasks')
  listMaintenanceTasks(@Query() query: QueryMaintenanceTaskDto): MaintenanceTask[] {
    return this.service.listMaintenanceTasks(MOCK_TENANT_ID, {
      status: query.status as MaintenanceTaskStatus | undefined,
      taskType: query.taskType as MaintenanceTaskType | undefined,
      storeId: query.storeId,
    })
  }

  @Get('maintenance-tasks/:id')
  getMaintenanceTask(@Param('id') id: string): MaintenanceTask | undefined {
    return this.service.getMaintenanceTask(id, MOCK_TENANT_ID)
  }

  @Patch('maintenance-tasks/:id')
  updateMaintenanceTask(
    @Param('id') id: string,
    @Body() body: UpdateMaintenanceTaskDto,
  ): MaintenanceTask {
    return this.service.updateMaintenanceTask(id, MOCK_TENANT_ID, body)
  }

  @Delete('maintenance-tasks/:id')
  deleteMaintenanceTask(@Param('id') id: string): { success: boolean } {
    const result = this.service.deleteMaintenanceTask(id, MOCK_TENANT_ID)
    return { success: result }
  }

  @Get('maintenance-tasks/due')
  getDueMaintenanceTasks(): MaintenanceTask[] {
    return this.service.getDueMaintenanceTasks(MOCK_TENANT_ID)
  }

  // ═══════════════════════════════════════════
  //  Metrics (统计)
  // ═══════════════════════════════════════════

  @Get('metrics')
  getMetrics(): LogisticsManagementMetrics {
    return this.service.getMetrics(MOCK_TENANT_ID)
  }
}
