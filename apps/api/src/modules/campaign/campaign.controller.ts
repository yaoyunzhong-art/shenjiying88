import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  toCampaignDispatchContract,
  toCampaignPlanContract
} from './campaign.contract'
import {
  EvaluateCampaignDto,
  RegisterCampaignDto,
  UpdateCampaignStatusDto
} from './campaign.dto'
import {
  CampaignActionStatus,
  CampaignStatus,
  CampaignTrigger
} from './campaign.entity'
import { CampaignService } from './campaign.service'

@UseGuards(TenantGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  registerCampaign(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RegisterCampaignDto
  ) {
    const plan = this.campaignService.registerCampaign({
      tenantContext,
      code: body.code,
      title: body.title,
      description: body.description,
      triggerEvent: body.triggerEvent,
      conditions: body.conditions ?? [],
      actions: body.actions ?? [],
      priority: body.priority,
      scheduledStart: body.scheduledStart,
      scheduledEnd: body.scheduledEnd
    })
    return toCampaignPlanContract(plan)
  }

  @Get()
  listCampaigns(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('status') status?: CampaignStatus,
    @Query('triggerEvent') triggerEvent?: CampaignTrigger
  ) {
    return this.campaignService
      .listCampaigns(tenantContext.tenantId, { status, triggerEvent })
      .map((plan) => toCampaignPlanContract(plan))
  }

  @Get(':planId')
  getCampaign(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string
  ) {
    const plan = this.campaignService.getCampaign(planId, tenantContext.tenantId)
    return plan ? toCampaignPlanContract(plan) : null
  }

  @Patch(':planId/status')
  updateCampaignStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: UpdateCampaignStatusDto
  ) {
    const plan = this.campaignService.updateCampaignStatus(
      planId,
      body.status,
      tenantContext.tenantId
    )
    return toCampaignPlanContract(plan)
  }

  @Get(':planId/dispatches')
  listPlanDispatches(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string
  ) {
    return this.campaignService
      .listDispatches(tenantContext.tenantId, { planId })
      .map((dispatch) => toCampaignDispatchContract(dispatch))
  }

  @Get('dispatches/list')
  listDispatches(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('memberId') memberId?: string,
    @Query('status') status?: CampaignActionStatus
  ) {
    return this.campaignService
      .listDispatches(tenantContext.tenantId, { memberId, status })
      .map((dispatch) => toCampaignDispatchContract(dispatch))
  }

  @Post('evaluate')
  evaluateTriggers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: EvaluateCampaignDto
  ) {
    if (!body.eventName?.trim()) {
      throw new BadRequestException('eventName is required')
    }
    return this.campaignService.evaluateTriggers({ ...body, tenantContext })
  }
}
