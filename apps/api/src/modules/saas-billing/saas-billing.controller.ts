/**
 * SaaS 计费模块 — REST 控制器
 *
 * 提供套餐管理、订阅管理、配额监控、计费与账单、试用管理 API。
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { SaaSBillingService } from './saas-billing.service'
import {
  CreatePlanDto,
  SubscribeDto,
  ChangePlanDto,
  RecordUsageDto,
  StartTrialDto,
  CheckQuotaDto,
  OverageResponseDto,
} from './saas-billing.dto'
import type {
  PricingPlan,
  TenantSubscription,
  Invoice,
  QuotaUsage,
  TrialStatus,
  QuotaCheckResult,
} from './saas-billing.entity'

@ApiTags('SaaS 计费')
@Controller('saas-billing')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SaaSBillingController {
  constructor(private readonly billingService: SaaSBillingService) {}

  // ── 套餐管理 ────────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: '获取所有套餐列表' })
  listPlans(): PricingPlan[] {
    return this.billingService.listPlans()
  }

  @Get('plans/:planId')
  @ApiOperation({ summary: '获取指定套餐详情' })
  @ApiParam({ name: 'planId', description: '套餐 ID' })
  getPlan(@Param('planId') planId: string): PricingPlan | null {
    return this.billingService.getPlan(planId)
  }

  @Post('plans')
  @ApiOperation({ summary: '创建自定义套餐' })
  createPlan(@Body() dto: CreatePlanDto): PricingPlan {
    return this.billingService.createPlan(dto)
  }

  // ── 订阅管理 ────────────────────────────────────────────────────────────

  @Post('subscribe')
  @ApiOperation({ summary: '租户订阅套餐' })
  subscribe(@Body() dto: SubscribeDto): TenantSubscription {
    return this.billingService.subscribe(dto.tenantId, dto.planId, dto.billingCycle)
  }

  @Post('subscriptions/:tenantId/change-plan')
  @ApiOperation({ summary: '变更订阅套餐' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  changePlan(@Param('tenantId') tenantId: string, @Body() dto: ChangePlanDto): TenantSubscription {
    return this.billingService.changePlan(tenantId, dto.newPlanId)
  }

  @Post('subscriptions/:tenantId/cancel')
  @ApiOperation({ summary: '取消订阅' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  cancelSubscription(@Param('tenantId') tenantId: string): { success: boolean } {
    this.billingService.cancelSubscription(tenantId)
    return { success: true }
  }

  @Post('subscriptions/:tenantId/renew')
  @ApiOperation({ summary: '续费订阅' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  renewSubscription(@Param('tenantId') tenantId: string): TenantSubscription {
    return this.billingService.renew(tenantId)
  }

  @Get('subscriptions/:tenantId')
  @ApiOperation({ summary: '获取租户订阅信息' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  getSubscription(@Param('tenantId') tenantId: string): TenantSubscription | null {
    return this.billingService.getSubscription(tenantId)
  }

  // ── 配额监控 ────────────────────────────────────────────────────────────

  @Post('quotas/:tenantId/record')
  @ApiOperation({ summary: '记录配额使用' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  recordUsage(@Param('tenantId') tenantId: string, @Body() dto: RecordUsageDto): { success: boolean } {
    this.billingService.recordUsage(tenantId, dto.quota, dto.amount)
    return { success: true }
  }

  @Get('quotas/:tenantId')
  @ApiOperation({ summary: '获取租户所有配额使用情况' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  getQuotaUsage(@Param('tenantId') tenantId: string): QuotaUsage[] {
    return this.billingService.getQuotaUsage(tenantId)
  }

  @Post('quotas/:tenantId/check')
  @ApiOperation({ summary: '检查配额是否充足' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  checkQuota(
    @Param('tenantId') tenantId: string,
    @Body() dto: CheckQuotaDto,
  ): QuotaCheckResult {
    return this.billingService.checkQuota(tenantId, dto.quota, dto.amount)
  }

  @Get('quotas/:tenantId/overage')
  @ApiOperation({ summary: '计算超额费用' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  calculateOverage(@Param('tenantId') tenantId: string): OverageResponseDto {
    return this.billingService.calculateOverage(tenantId)
  }

  // ── 计费与账单 ──────────────────────────────────────────────────────────

  @Post('invoices/generate/:tenantId')
  @ApiOperation({ summary: '生成账单' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  generateInvoice(@Param('tenantId') tenantId: string): Invoice {
    return this.billingService.generateInvoice(tenantId)
  }

  @Post('invoices/:invoiceId/pay')
  @ApiOperation({ summary: '标记账单已支付' })
  @ApiParam({ name: 'invoiceId', description: '发票 ID' })
  markPaid(@Param('invoiceId') invoiceId: string): { success: boolean } {
    this.billingService.markPaid(invoiceId)
    return { success: true }
  }

  @Get('invoices/:tenantId')
  @ApiOperation({ summary: '获取租户账单列表' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  listInvoices(@Param('tenantId') tenantId: string): Invoice[] {
    return this.billingService.listInvoices(tenantId)
  }

  // ── 试用管理 ────────────────────────────────────────────────────────────

  @Post('trial/start')
  @ApiOperation({ summary: '开始试用' })
  startTrial(@Body() dto: StartTrialDto): TenantSubscription {
    return this.billingService.startTrial(dto.tenantId, dto.planId)
  }

  @Post('trial/:tenantId/convert')
  @ApiOperation({ summary: '试用转正' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  convertTrial(@Param('tenantId') tenantId: string): TenantSubscription {
    return this.billingService.convertTrial(tenantId)
  }

  @Get('trial/:tenantId/status')
  @ApiOperation({ summary: '检查试用状态' })
  @ApiParam({ name: 'tenantId', description: '租户 ID' })
  checkTrialStatus(@Param('tenantId') tenantId: string): TrialStatus {
    return this.billingService.checkTrialStatus(tenantId)
  }
}
