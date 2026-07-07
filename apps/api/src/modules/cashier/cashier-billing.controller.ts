import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  Headers,
  Logger,
  Inject
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger'
import { TenantGuard } from '../agent/tenant.guard'
import { BillingWall } from '../foundation/commercial-billing/billing-wall'
import { BillingServiceImpl, InMemoryBillingMeter } from '../foundation/commercial-billing/billing.service'
import type { Bill, PricingPlan, Wallet } from '../foundation/commercial-billing/billing.port'

/**
 * P3-5 商业化计费 admin 端点 (Cashier 模块)
 *
 * 5 个端点:
 *   - GET  /cashier/admin/billing/usage?period=YYYY-MM       本期 usage 报告
 *   - GET  /cashier/admin/billing/wallet                     查钱包余额
 *   - POST /cashier/admin/billing/wallet/recharge            充值
 *   - GET  /cashier/admin/billing/bills                      查账单列表
 *   - POST /cashier/admin/billing/plan                       设置 / 切换套餐
 *   - GET  /cashier/admin/billing/plan                       查当前套餐
 *
 * 全部端点 @UseGuards(TenantGuard), tenantId 从 x-tenant-id header 注入
 *
 * 注意: 这是 admin 端点, 实际生产应再加 RBAC (admin/finance 角色)
 */
@ApiTags('cashier-billing')
@Controller('cashier/admin/billing')
@UseGuards(TenantGuard)
export class CashierBillingController {
  private readonly logger = new Logger(CashierBillingController.name)

  constructor(
    @Inject(BillingWall) private readonly wall: BillingWall,
    @Inject(BillingServiceImpl) private readonly billing: BillingServiceImpl,
    @Inject(InMemoryBillingMeter) private readonly meter: InMemoryBillingMeter
  ) {}

  // ─── usage ─────────────────────────────────────

  @Get('usage')
  @ApiOperation({
    summary: '查本期 usage 报告',
    description: '返回 tenant 当期 (默认本月) 各 metric 的累计用量 (events/quants/timestamps)'
  })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: '租户 ID' })
  @ApiOkResponse({
    description: '本期 usage 报告',
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string', example: 'tenant-001' },
        period: { type: 'string', example: '2026-07' },
        items: { type: 'array', items: { $ref: '#/components/schemas/UsageAggregate' } }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Missing x-tenant-id header' })
  getUsage(
    @Headers('x-tenant-id') tenantId: string,
    @Query('period') period?: string
  ) {
    if (!tenantId) throw new BadRequestException('x-tenant-id required')
    const p = period ?? this.meter.currentPeriod()
    return {
      tenantId,
      period: p,
      items: this.wall.getUsageReport(tenantId, p)
    }
  }

  // ─── wallet ────────────────────────────────────

  @Get('wallet')
  @ApiOperation({
    summary: '查钱包余额',
    description: '返回 tenant 当前钱包状态 (balance/totalRecharged/totalConsumed)'
  })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: '租户 ID' })
  @ApiOkResponse({ description: '钱包状态', type: Object })
  @ApiUnauthorizedResponse({ description: 'Missing x-tenant-id header' })
  getWallet(@Headers('x-tenant-id') tenantId: string): Wallet {
    if (!tenantId) throw new BadRequestException('x-tenant-id required')
    return this.billing.getWallet(tenantId)
  }

  @Post('wallet/recharge')
  @ApiOperation({
    summary: '充值',
    description: '向 tenant 钱包充值 (amount > 0), 同步更新 totalRecharged'
  })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: '租户 ID' })
  @ApiOkResponse({ description: '充值后的钱包状态', type: Object })
  @ApiBadRequestResponse({ description: 'amount 缺失或 <= 0' })
  @ApiUnauthorizedResponse({ description: 'Missing x-tenant-id header' })
  recharge(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { amount: number; currency?: string }
  ): Wallet {
    if (!tenantId) throw new BadRequestException('x-tenant-id required')
    if (!body || typeof body.amount !== 'number' || body.amount <= 0) {
      throw new BadRequestException('amount must be > 0')
    }
    const w = this.billing.recharge(tenantId, body.amount, body.currency)
    this.logger.log(`Recharge tenant=${tenantId} amount=${body.amount} balance=${w.balance}`)
    return w
  }

  // ─── bills ─────────────────────────────────────

  @Get('bills')
  @ApiOperation({
    summary: '查账单列表',
    description: '返回 tenant 历史上所有月度账单 (按 issueAt 倒序)'
  })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: '租户 ID' })
  @ApiOkResponse({
    description: '账单列表',
    schema: { type: 'array', items: { $ref: '#/components/schemas/Bill' } }
  })
  @ApiUnauthorizedResponse({ description: 'Missing x-tenant-id header' })
  listBills(@Headers('x-tenant-id') tenantId: string): Bill[] {
    if (!tenantId) throw new BadRequestException('x-tenant-id required')
    return this.billing.listBills(tenantId)
  }

  // ─── plan ──────────────────────────────────────

  @Post('plan')
  @ApiOperation({
    summary: '设置 / 切换套餐',
    description: '为 tenant 设置或切换计费套餐 (FREE / FLAT / PER_UNIT / TIERED)'
  })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: '租户 ID' })
  @ApiOkResponse({ description: '设置成功', type: Object })
  @ApiBadRequestResponse({ description: 'plan 缺少 id 或 type' })
  @ApiUnauthorizedResponse({ description: 'Missing x-tenant-id header' })
  setPlan(
    @Headers('x-tenant-id') tenantId: string,
    @Body() plan: PricingPlan
  ) {
    if (!tenantId) throw new BadRequestException('x-tenant-id required')
    if (!plan || !plan.id || !plan.type) {
      throw new BadRequestException('plan must have id and type')
    }
    this.billing.setPlan(tenantId, plan)
    return { ok: true, plan }
  }

  @Get('plan')
  @ApiOperation({
    summary: '查当前套餐',
    description: '返回 tenant 当前生效的计费套餐 (null 表示未设置)'
  })
  @ApiHeader({ name: 'x-tenant-id', required: true, description: '租户 ID' })
  @ApiOkResponse({ description: '当前套餐或 null', type: Object })
  @ApiUnauthorizedResponse({ description: 'Missing x-tenant-id header' })
  getPlan(@Headers('x-tenant-id') tenantId: string): PricingPlan | null {
    if (!tenantId) throw new BadRequestException('x-tenant-id required')
    return this.billing.getPlan(tenantId)
  }
}
