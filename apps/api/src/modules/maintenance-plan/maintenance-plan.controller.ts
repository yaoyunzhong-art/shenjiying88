import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateMaintenancePlanDto,
  MaintenanceQueryDto,
  UpdateMaintenancePlanDto,
  UpdateMaintenanceStatusDto,
} from './maintenance-plan.dto'
import { MaintenancePlanService } from './maintenance-plan.service'

@Controller('maintenance-plans')
export class MaintenancePlanController {
  constructor(private readonly planService: MaintenancePlanService) {}

  // ── Plan CRUD ──

  @Post()
  createPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateMaintenancePlanDto,
  ) {
    return this.planService.createPlan({
      tenantId: tenantContext.tenantId,
      title: body.title,
      type: body.type,
      priority: body.priority,
      deviceName: body.deviceName,
      deviceId: body.deviceId,
      assignedTo: body.assignedTo,
      scheduledAt: body.scheduledAt,
      description: body.description,
      result: body.result,
      cost: body.cost,
    })
  }

  @Get()
  listPlans(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: MaintenanceQueryDto,
  ) {
    return this.planService.listPlans(tenantContext.tenantId, {
      status: query.status,
      type: query.type,
      priority: query.priority,
      deviceName: query.deviceName,
      assignedTo: query.assignedTo,
    })
  }

  @Get(':planId')
  getPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
  ) {
    const plan = this.planService.getPlan(planId, tenantContext.tenantId)
    if (!plan) {
      throw new Error(`Maintenance plan not found: ${planId}`)
    }
    return plan
  }

  @Patch(':planId')
  updatePlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: UpdateMaintenancePlanDto,
  ) {
    return this.planService.updatePlan(planId, tenantContext.tenantId, body)
  }

  @Patch(':planId/status')
  updatePlanStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: UpdateMaintenanceStatusDto,
  ) {
    return this.planService.updatePlanStatus(
      planId,
      body.status,
      tenantContext.tenantId,
      body.result,
      body.cost,
    )
  }

  // ── Scheduling ──

  @Get('analysis/scheduled')
  getScheduledPlans(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.planService.getScheduledPlans(tenantContext.tenantId, fromDate, toDate)
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.planService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock maintenance plan data seeded' }
  }
}
