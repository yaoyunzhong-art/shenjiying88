/**
 * P-36 店A增强 会员中心控制器 (V17)
 *
 * Store A 特有能力暴露的 REST API
 * - GET /api/members/:id — 查询会员信息
 * - POST /api/members — 注册新会员(包含积分账户创建)
 * - POST /api/members/:id/points — 累计积分
 * - POST /api/members/:id/redeem — 兑换积分
 * - GET /api/members/:id/levels — 查看会员等级
 */

import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { MemberStoreAService } from './member-store-a.service'
import type { RegisterRequest, PointsEarnRequest, PointsRedeemRequest } from './member-store-a.service'

@UseGuards(TenantGuard)
@Controller('api/members')
export class MemberStoreAController {
  constructor(private readonly svc: MemberStoreAService) {}

  /**
   * GET /api/members/:id — 查询会员信息
   */
  @Get(':id')
  getMember(@Param('id') id: string) {
    const info = this.svc.getMemberInfo(id)
    if (!info) {
      throw new HttpException({ message: '会员不存在' }, HttpStatus.NOT_FOUND)
    }
    return info
  }

  /**
   * POST /api/members — 注册新会员(包含积分账户创建)
   */
  @Post()
  register(@Body() body: RegisterRequest) {
    try {
      return this.svc.register(body)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  /**
   * POST /api/members/:id/points — 累计积分
   */
  @Post(':id/points')
  earnPoints(
    @Param('id') id: string,
    @Body() body: PointsEarnRequest
  ) {
    try {
      return this.svc.earnPoints(id, body.consumptionAmount, body.orderId, body.activityId)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  /**
   * POST /api/members/:id/redeem — 兑换积分
   */
  @Post(':id/redeem')
  redeemPoints(
    @Param('id') id: string,
    @Body() body: PointsRedeemRequest
  ) {
    try {
      return this.svc.redeemPoints(id, body.points)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  /**
   * GET /api/members/:id/levels — 查看会员等级
   */
  @Get(':id/levels')
  getLevels(@Param('id') id: string) {
    const info = this.svc.getLevelInfo(id)
    if (!info) {
      throw new HttpException({ message: '会员不存在' }, HttpStatus.NOT_FOUND)
    }
    return info
  }
}
