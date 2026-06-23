import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
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

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Products ─────────────────────────────────────────

  @Post('products')
  createProduct(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateProductDto
  ) {
    return this.inventoryService.createProduct(tenantContext, body)
  }

  @Put('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: UpdateProductDto
  ) {
    return this.inventoryService.updateProduct(productId, tenantContext, body)
  }

  @Get('products/:productId')
  getProduct(
    @Param('productId') productId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inventoryService.getProduct(productId, tenantContext)
  }

  @Get('products')
  listProducts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ProductQueryDto = {} as ProductQueryDto
  ) {
    return this.inventoryService.listProducts(tenantContext, query)
  }

  // ─── Stock Operations ─────────────────────────────────

  @Post('stock/in')
  stockIn(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: StockInDto
  ) {
    return this.inventoryService.stockIn(tenantContext, body)
  }

  @Post('stock/out')
  stockOut(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: StockOutDto
  ) {
    return this.inventoryService.stockOut(tenantContext, body)
  }

  @Post('stock/adjust')
  adjustStock(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: AdjustStockDto
  ) {
    return this.inventoryService.adjustStock(tenantContext, body)
  }

  @Get('stock/check/:productId')
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
  getLowStockProducts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('threshold') threshold?: string
  ) {
    const thresholdNum = threshold ? Number(threshold) : undefined
    return this.inventoryService.getLowStockProducts(tenantContext, thresholdNum)
  }

  @Get('stock/records')
  getStockRecords(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: StockRecordQueryDto = {} as StockRecordQueryDto
  ) {
    return this.inventoryService.getStockRecords(tenantContext, query)
  }

  // ─── Suppliers ────────────────────────────────────────

  @Post('suppliers')
  createSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateSupplierDto
  ) {
    return this.inventoryService.createSupplier(tenantContext, body)
  }

  @Get('suppliers')
  listSuppliers(@TenantContext() tenantContext: RequestTenantContext) {
    return this.inventoryService.listSuppliers(tenantContext)
  }

  // ─── Purchase Orders ──────────────────────────────────

  @Post('purchase-orders')
  createPurchaseOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreatePurchaseOrderDto
  ) {
    return this.inventoryService.createPurchaseOrder(tenantContext, body)
  }

  @Post('purchase-orders/:orderId/confirm')
  confirmOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inventoryService.confirmOrder(orderId, tenantContext)
  }

  @Post('purchase-orders/:orderId/receive')
  receiveOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inventoryService.receiveOrder(orderId, tenantContext)
  }

  @Get('purchase-orders')
  listPurchaseOrders(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: PurchaseOrderQueryDto = {} as PurchaseOrderQueryDto
  ) {
    return this.inventoryService.listPurchaseOrders(tenantContext, query)
  }
}
