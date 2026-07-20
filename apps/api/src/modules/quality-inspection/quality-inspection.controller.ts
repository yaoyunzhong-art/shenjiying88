import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateInspectionRecordDto,
  InspectionRecordQueryDto,
  UpdateInspectionRecordDto,
} from './quality-inspection.dto'
import { InspectionType } from './quality-inspection.entity'
import { QualityInspectionService } from './quality-inspection.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('quality-inspections')
@UseGuards(TenantGuard)
export class QualityInspectionController {
  constructor(private readonly inspectionService: QualityInspectionService) {}

  // ── CRUD ──

  @Post()
  createInspection(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateInspectionRecordDto
  ) {
    return this.inspectionService.createInspection({
      tenantId: tenantContext.tenantId,
      inspectNo: body.inspectNo,
      type: body.type,
      itemName: body.itemName,
      itemBatch: body.itemBatch,
      result: body.result,
      severity: body.severity,
      defects: body.defects,
      inspector: body.inspector,
      inspectedAt: body.inspectedAt,
      notes: body.notes,
    })
  }

  @Get()
  listInspections(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: InspectionRecordQueryDto
  ) {
    return this.inspectionService.listInspections(tenantContext.tenantId, {
      type: query.type,
      result: query.result,
      severity: query.severity,
      inspector: query.inspector,
      search: query.search,
    })
  }

  @Get(':inspectId')
  getInspection(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('inspectId') inspectId: string
  ) {
    const record = this.inspectionService.getInspection(inspectId, tenantContext.tenantId)
    if (!record) {
      throw new Error(`Inspection record not found: ${inspectId}`)
    }
    return record
  }

  @Patch(':inspectId')
  updateInspection(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('inspectId') inspectId: string,
    @Body() body: UpdateInspectionRecordDto
  ) {
    return this.inspectionService.updateInspection(inspectId, tenantContext.tenantId, body)
  }

  @Delete(':inspectId')
  deleteInspection(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('inspectId') inspectId: string
  ) {
    this.inspectionService.deleteInspection(inspectId, tenantContext.tenantId)
    return { success: true }
  }

  // ── Query views ──

  @Get('views/failed')
  getFailedInspections(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inspectionService.getFailedInspections(tenantContext.tenantId)
  }

  @Get('views/pass-rate')
  getPassRate(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.inspectionService.getPassRate(tenantContext.tenantId)
  }

  @Get('type/:type')
  getInspectionsByType(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('type') type: string
  ) {
    return this.inspectionService.getInspectionsByType(
      type as InspectionType,
      tenantContext.tenantId
    )
  }

  @Get('item/:itemName')
  getInspectionsByItem(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('itemName') itemName: string
  ) {
    return this.inspectionService.getInspectionsByItems(itemName, tenantContext.tenantId)
  }
}
