import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateRepairRequestDto,
  UpdateRepairRequestDto,
  DispatchRepairDto,
  CompleteRepairDto,
  RepairQueryDto,
  RepairStatsQueryDto,
} from './repair.dto'
import { RepairService } from './repair.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('repair-requests')
@UseGuards(TenantGuard)
export class RepairController {
  constructor(private readonly repairService: RepairService) {}

  // ── Submit repair request ──

  @Post()
  submitRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateRepairRequestDto,
  ) {
    return this.repairService.createRequest({
      tenantId: tenantContext.tenantId,
      title: body.title,
      description: body.description,
      category: body.category,
      urgency: body.urgency,
      reporterName: body.reporterName,
      reporterPhone: body.reporterPhone,
      location: body.location,
      deviceName: body.deviceName,
      deviceId: body.deviceId,
      remark: body.remark,
    })
  }

  // ── List repair requests ──

  @Get()
  listRepairs(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: RepairQueryDto,
  ) {
    return this.repairService.listRequests(tenantContext.tenantId, {
      status: query.status,
      category: query.category,
      urgency: query.urgency,
      reporterName: query.reporterName,
      assignedTo: query.assignedTo,
      location: query.location,
      deviceName: query.deviceName,
    })
  }

  // ── Get single repair request ──

  @Get(':requestId')
  getRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('requestId') requestId: string,
  ) {
    const req = this.repairService.getRequest(requestId, tenantContext.tenantId)
    if (!req) {
      throw new Error(`Repair request not found: ${requestId}`)
    }
    return req
  }

  // ── Update repair request ──

  @Patch(':requestId')
  updateRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('requestId') requestId: string,
    @Body() body: UpdateRepairRequestDto,
  ) {
    return this.repairService.updateRequest(requestId, tenantContext.tenantId, body)
  }

  // ── Dispatch / accept repair ──

  @Patch(':requestId/dispatch')
  dispatchRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('requestId') requestId: string,
    @Body() body: DispatchRepairDto,
  ) {
    return this.repairService.dispatchRepair(requestId, tenantContext.tenantId, {
      status: body.status,
      assignedTo: body.assignedTo,
      estimatedCost: body.estimatedCost,
    })
  }

  // ── Start repair ──

  @Patch(':requestId/start')
  startRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('requestId') requestId: string,
  ) {
    return this.repairService.startRepair(requestId, tenantContext.tenantId)
  }

  // ── Complete repair ──

  @Patch(':requestId/complete')
  completeRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('requestId') requestId: string,
    @Body() body: CompleteRepairDto,
  ) {
    return this.repairService.completeRepair(requestId, tenantContext.tenantId, {
      status: body.status,
      result: body.result,
      actualCost: body.actualCost,
      remark: body.remark,
    })
  }

  // ── Cancel repair ──

  @Patch(':requestId/cancel')
  cancelRepair(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('requestId') requestId: string,
    @Body('remark') remark?: string,
  ) {
    return this.repairService.cancelRepair(requestId, tenantContext.tenantId, remark)
  }

  // ── Statistics ──

  @Get('analysis/stats')
  getStats(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: RepairStatsQueryDto,
  ) {
    return this.repairService.getStats(
      tenantContext.tenantId,
      query.fromDate,
      query.toDate,
    )
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.repairService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock repair request data seeded' }
  }
}
