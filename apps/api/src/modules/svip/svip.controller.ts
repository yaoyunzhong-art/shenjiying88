import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateSvipMemberDto,
  SvipBenefitDto,
  SvipMemberQueryDto,
  SvipTierDto,
  SvipTierQueryDto,
  SvipUpgradeDto,
  UseSvipBenefitDto
} from './svip.dto'
import { SvipService } from './svip.service'

@Controller('svip')
export class SvipController {
  constructor(private readonly svipService: SvipService) {}

  // ── 等级管理 ───────────────────────────────────────────

  @Post('tiers/init')
  initDefaultTiers(@TenantContext() tenantContext: RequestTenantContext) {
    return this.svipService.initDefaultTiers(tenantContext)
  }

  @Get('tiers')
  listTiers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: SvipTierQueryDto
  ) {
    const tiers = this.svipService.listTiers(tenantContext.tenantId)
    if (query.level !== undefined) {
      return tiers.filter((t) => t.level === query.level)
    }
    return tiers
  }

  @Get('tiers/:tierId')
  getTier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tierId') tierId: string
  ) {
    return this.svipService.getTier(tierId, tenantContext.tenantId)
  }

  @Post('tiers')
  upsertTier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SvipTierDto
  ) {
    return this.svipService.upsertTier(tenantContext, body)
  }

  // ── 会员管理 ───────────────────────────────────────────

  @Post('members')
  createMember(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateSvipMemberDto
  ) {
    return this.svipService.createMember(tenantContext, body)
  }

  @Get('members')
  listMembers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: SvipMemberQueryDto
  ) {
    return this.svipService.listMembers(tenantContext.tenantId, {
      status: query.status,
      tierLevel: query.tierLevel
    })
  }

  @Get('members/:memberId')
  getMemberTier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('memberId') memberId: string
  ) {
    return this.svipService.getMemberTier(memberId, tenantContext.tenantId)
  }

  @Get('members/:memberId/benefits')
  getMemberBenefits(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('memberId') memberId: string
  ) {
    return this.svipService.getMemberAvailableBenefits(memberId, tenantContext.tenantId)
  }

  @Post('upgrade')
  upgradeTier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SvipUpgradeDto
  ) {
    return this.svipService.upgradeTier(tenantContext, body)
  }

  @Post('downgrade')
  downgradeTier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: SvipUpgradeDto
  ) {
    return this.svipService.downgradeTier(tenantContext, body)
  }

  @Post('members/:memberId/freeze')
  freezeMember(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('memberId') memberId: string
  ) {
    return this.svipService.freezeMember(memberId, tenantContext.tenantId)
  }

  @Post('members/:memberId/unfreeze')
  unfreezeMember(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('memberId') memberId: string
  ) {
    return this.svipService.unfreezeMember(memberId, tenantContext.tenantId)
  }

  @Patch('expired/check')
  checkAndDowngradeExpired(@TenantContext() tenantContext: RequestTenantContext) {
    return this.svipService.checkAndDowngradeExpired(tenantContext.tenantId)
  }

  // ── 权益管理 ───────────────────────────────────────────

  @Get('benefits/:tierId')
  listBenefits(@Param('tierId') tierId: string) {
    return this.svipService.listBenefits(tierId)
  }

  @Post('benefits')
  createBenefit(@Body() body: SvipBenefitDto) {
    return this.svipService.createBenefit(body)
  }

  @Patch('benefits/:benefitId')
  updateBenefit(
    @Param('benefitId') benefitId: string,
    @Body() body: Partial<SvipBenefitDto>
  ) {
    return this.svipService.updateBenefit(benefitId, body)
  }

  @Post('benefits/use')
  useBenefit(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: UseSvipBenefitDto
  ) {
    return this.svipService.useBenefit(body.memberId, body.benefitType, tenantContext.tenantId)
  }
}
