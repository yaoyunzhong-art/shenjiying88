import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import {
  RequirePermissions,
  RequireTenantScope
} from '../foundation/identity-access/identity-access.decorator'

import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  StockInDto,
  StockOutDto,
  AdjustStockDto,
  StockRecordQueryDto,
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  PurchaseOrderQueryDto
} from './inventory.dto'
import { InventoryService } from './inventory.service'

const STOCK_TRANSFER_READ_PERMISSION = 'stock-transfer:read'
const STOCK_TRANSFER_FORM_PERMISSION = 'stock-transfer:form:read'
const PRODUCT_READ_PERMISSION = 'product:read'
const INVENTORY_WRITE_PERMISSION = 'inventory:update'
const SUPPLIERS_READ_PERMISSION = 'suppliers:read'
const SUPPLIERS_FORM_PERMISSION = 'suppliers:form:read'
const INVENTORY_PURCHASE_READ_PERMISSION = 'inventory.purchase.read'
const INVENTORY_PURCHASE_WRITE_PERMISSION = 'inventory.purchase.write'

@UseGuards(TenantGuard)
@Controller('inventory')
@RequireTenantScope()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Products ─────────────────────────────────────────

  @Post('products')
  @RequirePermissions(INVENTORY_WRITE_PERMISSION)
  createProduct(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateProductDto
  ) {
    return this.inventoryService.createProduct(tenantContext, body)
  }

  @Put('products/:productId')
  @RequirePermissions(INVENTORY_WRITE_PERMISSION)
  updateProduct(
    @Param('productId') productId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: UpdateProductDto
  ) {
    return this.inventoryService.updateProduct(productId, tenantContext, body)
  }

  @Get('products/:productId')
  @RequirePermissions(PRODUCT_READ_PERMISSION)
  getProduct(
    @Param('productId') productId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inventoryService.getProduct(productId, tenantContext)
  }

  @Get('products')
  @RequirePermissions(PRODUCT_READ_PERMISSION)
  listProducts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ProductQueryDto = {} as ProductQueryDto
  ) {
    return this.inventoryService.listProducts(tenantContext, query)
  }

  // ─── Stock Operations ─────────────────────────────────

  @Post('stock/in')
  @RequireTenantScope()
  @RequirePermissions(STOCK_TRANSFER_FORM_PERMISSION)
  stockIn(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: StockInDto
  ) {
    return this.inventoryService.stockIn(tenantContext, body)
  }

  @Post('stock/out')
  @RequireTenantScope()
  @RequirePermissions(STOCK_TRANSFER_FORM_PERMISSION)
  stockOut(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: StockOutDto
  ) {
    return this.inventoryService.stockOut(tenantContext, body)
  }

  @Post('stock/adjust')
  @RequireTenantScope()
  @RequirePermissions(STOCK_TRANSFER_FORM_PERMISSION)
  adjustStock(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: AdjustStockDto
  ) {
    return this.inventoryService.adjustStock(tenantContext, body)
  }

  @Get('stock/check/:productId')
  @RequireTenantScope()
  @RequirePermissions(STOCK_TRANSFER_READ_PERMISSION)
  checkStock(
    @Param('productId') productId: string,
    @Query('qty') qty: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    const requiredQty = Number(qty) || 0
    const ok = this.inventoryService.checkStock(productId, requiredQty, tenantContext)
    return { productId, requiredQty, sufficient: ok }
  }

  @Get('stock/low-products')
  @RequireTenantScope()
  @RequirePermissions(STOCK_TRANSFER_READ_PERMISSION)
  getLowStockProducts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('threshold') threshold?: string
  ) {
    const thresholdNum = threshold ? Number(threshold) : undefined
    return this.inventoryService.getLowStockProducts(tenantContext, thresholdNum)
  }

  @Get('stock/records')
  @RequireTenantScope()
  @RequirePermissions(STOCK_TRANSFER_READ_PERMISSION)
  getStockRecords(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: StockRecordQueryDto = {} as StockRecordQueryDto
  ) {
    return this.inventoryService.getStockRecords(tenantContext, query)
  }

  // ─── Suppliers ────────────────────────────────────────

  @Post('suppliers')
  @RequirePermissions(SUPPLIERS_FORM_PERMISSION)
  createSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateSupplierDto
  ) {
    return this.inventoryService.createSupplier(tenantContext, body)
  }

  @Get('suppliers')
  @RequirePermissions(SUPPLIERS_READ_PERMISSION)
  listSuppliers(@TenantContext() tenantContext: RequestTenantContext) {
    return this.inventoryService.listSuppliers(tenantContext)
  }

  // ─── Purchase Orders ──────────────────────────────────

  @Post('purchase-orders')
  @RequirePermissions(INVENTORY_PURCHASE_WRITE_PERMISSION)
  createPurchaseOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreatePurchaseOrderDto
  ) {
    return this.inventoryService.createPurchaseOrder(tenantContext, body)
  }

  @Post('purchase-orders/:orderId/confirm')
  @RequirePermissions(INVENTORY_PURCHASE_WRITE_PERMISSION)
  confirmOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inventoryService.confirmOrder(orderId, tenantContext)
  }

  @Post('purchase-orders/:orderId/receive')
  @RequirePermissions(INVENTORY_PURCHASE_WRITE_PERMISSION)
  receiveOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inventoryService.receiveOrder(orderId, tenantContext)
  }

  @Get('purchase-orders')
  @RequirePermissions(INVENTORY_PURCHASE_READ_PERMISSION)
  listPurchaseOrders(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: PurchaseOrderQueryDto = {} as PurchaseOrderQueryDto
  ) {
    return this.inventoryService.listPurchaseOrders(tenantContext, query)
  }
}
