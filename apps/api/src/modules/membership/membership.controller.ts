/**
 * membership.controller.ts — 会员管理 REST Controller
 *
 * 路由前缀: /membership
 * 守卫: TenantGuard (从 x-tenant-id header 提取租户)
 *
 * 功能:
 *   POST   /membership/register         注册会员
 *   POST   /membership/get-or-create    获取或创建
 *   GET    /membership/:id              查询会员
 *   GET    /membership/phone/:phone     手机号查询
 *   PUT    /membership/:id              更新会员
 *   DELETE /membership/:id              删除
 *   GET    /membership                  列表查询
 *   GET    /membership/:id/level        等级信息
 *   GET    /membership/:id/upgrade      升级进度
 *   POST   /membership/:id/points/earn  积分累计
 *   POST   /membership/:id/points/redeem 积分扣减
 *   GET    /membership/:id/points/history  积分流水
 *   POST   /membership/:id/balance/recharge 充值
 *   POST   /membership/:id/balance/pay     余额支付
 *   GET    /membership/:id/balance/history  余额流水
 *   GET    /membership/stats             统计
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { Public } from '../foundation/identity-access/public.decorator'
import { TenantGuard } from '../agent/tenant.guard'
import {
  RequirePermissions,
  RequireTenantScope,
} from '../foundation/identity-access/identity-access.decorator'
import { MembershipService, type MemberLevel } from './membership.service'
import type {
  RegisterMemberDto,
  UpdateMemberDto,
  ListMembersQueryDto,
  EarnPointsDto,
  RedeemPointsDto,
  AdjustPointsDto,
  RechargeBalanceDto,
  PayWithBalanceDto,
} from './membership.dto'

const MEMBERSHIP_MEMBER_READ_PERMISSION = 'member:read'
const MEMBERSHIP_MEMBER_UPDATE_PERMISSION = 'member:update'
const MEMBERSHIP_SETTLEMENT_PAY_PERMISSION = 'settlement:pay'

@Controller('membership')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@RequireTenantScope()
@RequirePermissions(MEMBERSHIP_MEMBER_READ_PERMISSION)
export class MembershipController {
  constructor(private readonly svc: MembershipService) {}

  // ─── 会员管理 ─────────────────────────────────────────────

  /**
   * 注册新会员
   * RQ-36-01: 输入手机号+姓名→创建会员
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  register(
    @Body() body: RegisterMemberDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    try {
      const member = this.svc.register({
        phone: body.phone,
        name: body.name ?? '未知客户',
        tenantId,
      })
      return { success: true, data: member }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 获取或创建会员
   */
  @Post('get-or-create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  getOrCreate(
    @Body() body: RegisterMemberDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    const member = this.svc.getOrCreate({
      phone: body.phone,
      name: body.name ?? '未知客户',
      tenantId,
    })
    return { success: true, data: member }
  }

  /**
   * 根据ID查询会员
   * RQ-36-02: 返回会员信息
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    const member = this.svc.getById(id)
    if (!member) {
      return { success: false, message: `会员 ${id} 不存在` }
    }
    return { success: true, data: member }
  }

  /**
   * 根据手机号查询
   */
  @Get('phone/:phone')
  findByPhone(
    @Param('phone') phone: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    const member = this.svc.findByPhone(phone, tenantId)
    if (!member) {
      return { success: false, message: `手机号 ${phone} 未注册` }
    }
    return { success: true, data: member }
  }

  /**
   * 更新会员信息
   */
  @Put(':id')
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  update(@Param('id') id: string, @Body() body: UpdateMemberDto) {
    try {
      const member = this.svc.update(id, body)
      return { success: true, data: member }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 删除会员
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  delete(@Param('id') id: string) {
    try {
      this.svc.delete(id)
      return { success: true, data: { id, deleted: true } }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 会员列表
   */
  @Get()
  list(@Query() query: ListMembersQueryDto) {
    const members = this.svc.list({
      phone: query.phone,
      level: query.level,
      search: query.search,
    })
    return { success: true, data: { members, total: members.length } }
  }

  // ─── 等级管理 ─────────────────────────────────────────────

  /**
   * 等级配置
   */
  @Get('levels')
  getLevels() {
    return { success: true, data: this.svc.getLevelConfigs() }
  }

  /**
   * 会员等级详情
   */
  @Get(':id/level')
  getLevel(@Param('id') id: string) {
    const member = this.svc.getById(id)
    if (!member) {
      return { success: false, message: `会员 ${id} 不存在` }
    }
    const cfg = this.svc.getLevelConfig(member.level)
    return { success: true, data: { level: member.level, config: cfg } }
  }

  /**
   * 升级进度
   */
  @Get(':id/upgrade')
  getUpgradeProgress(@Param('id') id: string) {
    try {
      const progress = this.svc.getUpgradeProgress(id)
      return { success: true, data: progress }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 刷新等级（自动升级/降级）
   */
  @Post(':id/refresh-level')
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  refreshLevel(@Param('id') id: string) {
    try {
      const member = this.svc.refreshLevel(id)
      return { success: true, data: member }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  // ─── 积分管理 ─────────────────────────────────────────────

  /**
   * 积分累计
   * RQ-36-04: 消费完成后自动增加积分
   */
  @Post(':id/points/earn')
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  earnPoints(@Param('id') id: string, @Body() body: EarnPointsDto) {
    try {
      const tx = this.svc.earnPoints(id, body.amount, body.orderId)
      return { success: true, data: tx }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 积分扣减
   * RQ-36-05: 用积分抵扣
   */
  @Post(':id/points/redeem')
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  redeemPoints(@Param('id') id: string, @Body() body: RedeemPointsDto) {
    try {
      const result = this.svc.redeemPoints(id, body.points, body.orderId)
      return { success: true, data: result }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 积分流水
   * RQ-36-08: 消费记录
   */
  @Get(':id/points/history')
  pointsHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    const maxLimit = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50
    const txs = this.svc.listPointsTransactions(id, maxLimit)
    return { success: true, data: { transactions: txs, total: txs.length } }
  }

  /**
   * 管理员调整积分
   */
  @Post(':id/points/adjust')
  @RequirePermissions(MEMBERSHIP_MEMBER_UPDATE_PERMISSION)
  adjustPoints(@Param('id') id: string, @Body() body: AdjustPointsDto) {
    try {
      const member = this.svc.adjustPoints(id, body.amount, body.remark)
      return { success: true, data: member }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  // ─── 余额管理 ─────────────────────────────────────────────

  /**
   * 余额充值
   * RQ-36-06: 充值→余额增加
   */
  @Post(':id/balance/recharge')
  @RequirePermissions(MEMBERSHIP_SETTLEMENT_PAY_PERMISSION)
  recharge(
    @Param('id') id: string,
    @Body() body: RechargeBalanceDto,
  ) {
    try {
      const member = this.svc.recharge(id, body.amount, body.paymentMethod, body.orderId)
      return { success: true, data: member }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 余额支付
   * RQ-36-07: 余额支付→扣减余额
   */
  @Post(':id/balance/pay')
  @RequirePermissions(MEMBERSHIP_SETTLEMENT_PAY_PERMISSION)
  payWithBalance(@Param('id') id: string, @Body() body: PayWithBalanceDto) {
    try {
      const paid = this.svc.payWithBalance(id, body.amount, body.orderId)
      return { success: true, data: { paid } }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message }
    }
  }

  /**
   * 余额流水
   */
  @Get(':id/balance/history')
  balanceHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    const maxLimit = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50
    const txs = this.svc.listBalanceTransactions(id, maxLimit)
    return { success: true, data: { transactions: txs, total: txs.length } }
  }

  // ─── 统计 ─────────────────────────────────────────────────

  /**
   * 会员统计
   */
  @Get('stats')
  stats() {
    return { success: true, data: this.svc.getStats() }
  }
}
