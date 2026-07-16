import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { PriceMonitorService } from './price-monitor.service'
import { PriceQueryDto } from './price-monitor.dto'
import { PriceCategory } from './price-monitor.entity'

@Controller('price-monitor')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PriceMonitorController {
  constructor(private readonly priceService: PriceMonitorService) {}

  // ── GET /price-monitor — 价格列表 ──
  @Get()
  list(
    @TenantContext() tenant: RequestTenantContext,
    @Query() query: PriceQueryDto
  ) {
    const items = this.priceService.list(tenant.tenantId, {
      storeId: query.storeId,
      category: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    })
    return { items, total: items.length }
  }

  // ── GET /price-monitor/:id — 单条价格 ──
  @Get(':id')
  get(
    @TenantContext() tenant: RequestTenantContext,
    @Param('id') id: string
  ) {
    return this.priceService.require(id, tenant.tenantId)
  }

  // ── GET /price-monitor/summary — 价格监控摘要 ──
  @Get('summary')
  getSummary(
    @TenantContext() tenant: RequestTenantContext,
    @Query('storeId') storeId?: string,
    @Query('category') category?: string
  ) {
    const validCategory = category ? (category as PriceCategory) : undefined
    return this.priceService.getSummary(tenant.tenantId, {
      storeId,
      category: validCategory,
    })
  }

  // ── GET /price-monitor/anomalies — 价格异常列表 ──
  @Get('anomalies')
  getAnomalies(
    @TenantContext() tenant: RequestTenantContext,
    @Query('storeId') storeId?: string,
    @Query('category') category?: string,
    @Query('minDiffPercent') minDiffPercent?: string
  ) {
    const validCategory = category ? (category as PriceCategory) : undefined
    const threshold = minDiffPercent ? Number(minDiffPercent) : undefined
    return this.priceService.getAnomalies(tenant.tenantId, {
      storeId,
      category: validCategory,
      minDiffPercent: threshold,
    })
  }

  // ── GET /price-monitor/comparison — 市场均价对比 ──
  @Get('comparison')
  getComparison(
    @TenantContext() tenant: RequestTenantContext,
    @Query('storeId') storeId?: string,
    @Query('category') category?: string
  ) {
    const validCategory = category ? (category as PriceCategory) : undefined
    return this.priceService.getPriceComparison(tenant.tenantId, {
      storeId,
      category: validCategory,
    })
  }

  // ── POST /price-monitor — 创建价格记录 ──
  @Post()
  create(
    @TenantContext() tenant: RequestTenantContext,
    @Body() body: {
      storeId: string
      storeName: string
      itemName: string
      category: string
      price: number
      marketAvgPrice: number
    }
  ) {
    return this.priceService.create({
      tenantId: tenant.tenantId,
      storeId: body.storeId,
      storeName: body.storeName,
      itemName: body.itemName,
      category: body.category as PriceCategory,
      price: body.price,
      marketAvgPrice: body.marketAvgPrice,
    })
  }

  // ── DELETE /price-monitor/:id — 删除 ──
  @Delete(':id')
  delete(
    @TenantContext() tenant: RequestTenantContext,
    @Param('id') id: string
  ) {
    this.priceService.delete(id, tenant.tenantId)
    return { success: true }
  }
}
