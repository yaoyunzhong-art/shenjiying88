import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import {
  InventoryItemService,
  type CreateInventoryItemInput,
  type UpdateInventoryItemInput,
  type ListInventoryItemFilter,
  type StockOpInput,
  type AdjustInput,
  type ReserveInput
} from './inventory-item.service'

/**
 * Phase-37 T167: /api/inventory/items 路由
 *
 * 不影响 Phase-6 /api/inventory/products /api/inventory/stock/*
 * 路由前缀: /api/inventory/items
 */

interface TenantQuery { tenantId?: string }
interface StockQuery { tenantId?: string; qty?: number }

@UseGuards(TenantGuard)
@Controller('api/inventory/items')
export class InventoryItemController {
  constructor(private readonly svc: InventoryItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateInventoryItemInput) {
    return this.svc.create(body)
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getById(id, q.tenantId)
  }

  @Get()
  list(@Query() q: TenantQuery & Partial<ListInventoryItemFilter>) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.list(q as ListInventoryItemFilter)
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Query() q: TenantQuery & { version?: string },
    @Body() body: UpdateInventoryItemInput
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    const version = parseInt(q.version ?? '0', 10)
    return this.svc.update(id, q.tenantId, version, body)
  }

  @Post(':id/stock-in')
  stockIn(@Param('id') id: string, @Body() body: Omit<StockOpInput, 'itemId'>) {
    return this.svc.stockIn({ ...body, itemId: id })
  }

  @Post(':id/stock-out')
  stockOut(@Param('id') id: string, @Body() body: Omit<StockOpInput, 'itemId'>) {
    return this.svc.stockOut({ ...body, itemId: id })
  }

  @Post(':id/adjust')
  adjust(@Param('id') id: string, @Body() body: Omit<AdjustInput, 'itemId'>) {
    return this.svc.adjust({ ...body, itemId: id })
  }

  @Post(':id/reserve')
  @HttpCode(HttpStatus.CREATED)
  reserve(@Param('id') id: string, @Body() body: Omit<ReserveInput, 'itemId'>) {
    return this.svc.reserve({ ...body, itemId: id })
  }

  @Post('reservations/:rid/confirm')
  confirmReservation(
    @Param('rid') rid: string,
    @Query() q: TenantQuery
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.confirmReservation(rid, q.tenantId)
  }

  @Post('reservations/:rid/release')
  releaseReservation(
    @Param('rid') rid: string,
    @Query() q: TenantQuery,
    @Body() body: { reason?: string; releasedBy?: string } = {}
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.releaseReservation(rid, q.tenantId, body.reason, body.releasedBy)
  }

  @Get('reservations/:rid')
  getReservation(@Param('rid') rid: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getReservationById(rid, q.tenantId)
  }

  @Get('low-stock/list')
  getLowStock(@Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getLowStock(q.tenantId)
  }

  @Get(':id/audit')
  getAuditLog(@Param('id') id: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getAuditLog(id, q.tenantId)
  }
}
