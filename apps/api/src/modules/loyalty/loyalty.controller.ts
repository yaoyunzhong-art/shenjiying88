import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ActivateCouponPlanDto,
  ActivateBlindboxPlanDto,
  BlindboxDrawAuditQueryDto,
  BlindboxProbabilityOverviewQueryDto,
  IssueCouponFromPlanDto,
  IssueBlindboxFromPlanDto,
  RegisterCouponPlanDto,
  RegisterBlindboxPlanDto
} from './loyalty.dto'
import { LoyaltyService } from './loyalty.service'

@UseGuards(TenantGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('points-ledger')
  listPointsLedger(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.listPointsLedger(tenantContext.tenantId)
  }

  @Get('coupon-redemptions')
  listCouponRedemptions(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.listCouponRedemptions(tenantContext.tenantId)
  }

  @Get('blindbox-fulfillments')
  listBlindboxFulfillments(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.listBlindboxFulfillments(tenantContext.tenantId)
  }

  @Get('blindbox-draw-records')
  listBlindboxDrawRecords(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: BlindboxDrawAuditQueryDto
  ) {
    return this.loyaltyService.listBlindboxDrawAuditLogPage(tenantContext.tenantId, query)
  }

  @Get('blindbox-draw-records/integrity')
  getBlindboxDrawRecordIntegrity(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.getBlindboxDrawAuditIntegrityReport(tenantContext.tenantId)
  }

  @Get('blindbox-members/:memberId/overview')
  getBlindboxMemberOverview(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('memberId') memberId: string
  ) {
    return this.loyaltyService.getBlindboxMemberOverview(tenantContext.tenantId, memberId)
  }

  @Get('settlements')
  listSettlements(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.listSettlements(tenantContext.tenantId)
  }

  @Post('coupon-plans')
  registerCouponPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RegisterCouponPlanDto
  ) {
    return this.loyaltyService.registerCouponPlan({
      tenantContext,
      code: body.code,
      title: body.title,
      description: body.description,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount,
      totalQuota: body.totalQuota,
      perMemberLimit: body.perMemberLimit,
      validFrom: body.validFrom,
      validUntil: body.validUntil
    })
  }

  @Get('coupon-plans')
  listCouponPlans(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.listCouponPlans(tenantContext.tenantId)
  }

  @Get('coupon-plans/:planId')
  getCouponPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string
  ) {
    return this.loyaltyService.getCouponPlan(planId, tenantContext.tenantId)
  }

  @Patch('coupon-plans/:planId/status')
  activateCouponPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: ActivateCouponPlanDto
  ) {
    return this.loyaltyService.updateCouponPlanStatus(
      planId,
      body.status,
      tenantContext.tenantId
    )
  }

  @Post('coupon-plans/:planId/issue')
  issueCoupon(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: IssueCouponFromPlanDto
  ) {
    return this.loyaltyService.issueCouponFromPlan({
      tenantContext,
      memberId: body.memberId,
      planId,
      source: body.source
    })
  }

  @Post('blindbox-plans')
  registerBlindboxPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RegisterBlindboxPlanDto
  ) {
    return this.loyaltyService.registerBlindboxPlan({
      tenantContext,
      blindboxPlanId: body.blindboxPlanId,
      title: body.title,
      description: body.description,
      unitPrice: body.unitPrice,
      totalQuota: body.totalQuota,
      rewardPool: body.rewardPool,
      caseGuarantee: body.caseGuarantee,
      validFrom: body.validFrom,
      validUntil: body.validUntil
    })
  }

  @Get('blindbox-plans')
  listBlindboxPlans(@TenantContext() tenantContext: RequestTenantContext) {
    return this.loyaltyService.listBlindboxPlans(tenantContext.tenantId)
  }

  @Get('blindbox-plans/:planId')
  getBlindboxPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string
  ) {
    return this.loyaltyService.getBlindboxPlan(planId, tenantContext.tenantId)
  }

  @Get('blindbox-plans/:planId/probability')
  getBlindboxProbabilityOverview(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Query() query: BlindboxProbabilityOverviewQueryDto
  ) {
    return this.loyaltyService.getBlindboxProbabilityOverview(planId, tenantContext.tenantId, query)
  }

  @Patch('blindbox-plans/:planId/status')
  activateBlindboxPlan(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: ActivateBlindboxPlanDto
  ) {
    return this.loyaltyService.updateBlindboxPlanStatus(
      planId,
      body.status,
      tenantContext.tenantId
    )
  }

  @Post('blindbox-plans/:planId/issue')
  async issueBlindbox(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('planId') planId: string,
    @Body() body: IssueBlindboxFromPlanDto
  ) {
    return this.loyaltyService.issueBlindboxFromPlanAtomically({
      tenantContext,
      memberId: body.memberId,
      planId,
      quantity: body.quantity
    })
  }
}
