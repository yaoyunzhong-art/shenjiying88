import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  AssignItemDto,
  CreateWarehouseBinDto,
  UpdateWarehouseBinDto,
  WarehouseBinQueryDto,
} from './warehouse-bin.dto'
import { WarehouseBinService } from './warehouse-bin.service'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('warehouse-bins')
@UseGuards(TenantGuard)
export class WarehouseBinController {
  constructor(private readonly binService: WarehouseBinService) {}

  // ── CRUD ──

  @Post()
  createBin(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateWarehouseBinDto
  ) {
    return this.binService.createBin({
      tenantId: tenantContext.tenantId,
      code: body.code,
      area: body.area,
      type: body.type,
      status: body.status,
      capacity: body.capacity,
      usedCapacity: body.usedCapacity,
      currentItem: body.currentItem,
    })
  }

  @Get()
  listBins(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: WarehouseBinQueryDto
  ) {
    return this.binService.listBins(tenantContext.tenantId, {
      status: query.status,
      type: query.type,
      area: query.area,
      search: query.search,
    })
  }

  @Get(':binId')
  getBin(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string
  ) {
    const bin = this.binService.getBin(binId, tenantContext.tenantId)
    if (!bin) {
      throw new Error(`Warehouse bin not found: ${binId}`)
    }
    return bin
  }

  @Patch(':binId')
  updateBin(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string,
    @Body() body: UpdateWarehouseBinDto
  ) {
    return this.binService.updateBin(binId, tenantContext.tenantId, body)
  }

  @Delete(':binId')
  deleteBin(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string
  ) {
    this.binService.deleteBin(binId, tenantContext.tenantId)
    return { success: true }
  }

  // ── Capacity operations ──

  @Post(':binId/assign')
  assignItem(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string,
    @Body() body: AssignItemDto
  ) {
    return this.binService.assignItem(
      binId,
      body.itemName,
      body.quantity,
      tenantContext.tenantId
    )
  }

  @Post(':binId/remove')
  removeItem(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string,
    @Body() body: { quantity: number }
  ) {
    return this.binService.removeItem(
      binId,
      body.quantity,
      tenantContext.tenantId
    )
  }

  @Post(':binId/reserve')
  reserveBin(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string
  ) {
    return this.binService.reserveBin(binId, tenantContext.tenantId)
  }

  @Post(':binId/maintenance')
  setMaintenance(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('binId') binId: string
  ) {
    return this.binService.setMaintenance(binId, tenantContext.tenantId)
  }

  // ── Query views ──

  @Get('views/empty')
  getEmptyBins(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.binService.getEmptyBins(tenantContext.tenantId)
  }

  @Get('views/utilization')
  getCapacityUtilization(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.binService.getCapacityUtilization(tenantContext.tenantId)
  }

  @Get('area/:area/occupied')
  getOccupiedBinsByArea(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('area') area: string
  ) {
    return this.binService.getOccupiedBinsByArea(area, tenantContext.tenantId)
  }
}
