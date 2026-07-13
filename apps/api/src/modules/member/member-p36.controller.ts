/**
 * P-36 会员中心控制器 (PRD-002 驱动)
 *
 * RQ-36-01  ~ RQ-36-10  接口暴露
 * AC-36-01  ~ AC-36-10  验收覆盖
 *
 * @see docs/knowledge/prd/prd-member-p36.md
 */

import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common'
import { MemberP36Service } from './member-p36.service'
import type { P36Member, LevelDisplay, ConsumptionRecord } from './member-p36.entity'

@Controller('api/v1/p36/members')
export class MemberP36Controller {
  constructor(private readonly svc: MemberP36Service) {}

  // ── AC-36-01: 会员注册 ──
  @Post('register')
  register(@Body() body: { phone: string; name: string }): P36Member {
    try {
      return this.svc.register(body.phone, body.name)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  // ── AC-36-02: 会员查询(手机号) ──
  @Get('query/:phone')
  queryByPhone(@Param('phone') phone: string): P36Member {
    const member = this.svc.queryByPhone(phone)
    if (!member) {
      throw new HttpException(
        { message: '该手机号未注册' },
        HttpStatus.NOT_FOUND
      )
    }
    return member
  }

  // ── AC-36-03: 等级展示(含进度条) ──
  @Get(':id/level')
  getLevelDisplay(@Param('id') id: string): LevelDisplay {
    const display = this.svc.getLevelDisplay(id)
    if (!display) {
      throw new HttpException({ message: '会员不存在' }, HttpStatus.NOT_FOUND)
    }
    return display
  }

  // ── AC-36-04: 积分累计 ──
  @Post(':id/points/earn')
  earnPoints(
    @Param('id') id: string,
    @Body() body: { consumptionAmount: number; orderId?: string }
  ): P36Member {
    try {
      return this.svc.earnPoints(id, body.consumptionAmount, body.orderId)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  // ── AC-36-05: 积分扣减 ──
  @Post(':id/points/redeem')
  redeemPoints(
    @Param('id') id: string,
    @Body() body: { points: number }
  ): { member: P36Member; deductionAmount: number } {
    try {
      return this.svc.redeemPoints(id, body.points)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  // ── AC-36-06: 余额充值 ──
  @Post(':id/balance/recharge')
  recharge(
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod?: string }
  ): P36Member {
    try {
      return this.svc.rechargeBalance(id, body.amount, body.paymentMethod)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  // ── AC-36-07: 余额支付 ──
  @Post(':id/balance/pay')
  payByBalance(
    @Param('id') id: string,
    @Body() body: { amount: number; orderId?: string }
  ): { success: boolean; member: P36Member } {
    try {
      return this.svc.payByBalance(id, body.amount, body.orderId)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  // ── AC-36-08: 消费记录查询 ──
  @Get(':id/records')
  getRecords(@Param('id') id: string): ConsumptionRecord[] {
    try {
      return this.svc.getConsumptionRecords(id)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.NOT_FOUND
      )
    }
  }

  // ── AC-36-09: 会员续费 ──
  @Post(':id/renew')
  renew(
    @Param('id') id: string,
    @Body() body: { months: number }
  ): P36Member {
    try {
      return this.svc.renewMember(id, body.months)
    } catch (e: unknown) {
      throw new HttpException(
        { message: (e as Error).message },
        HttpStatus.BAD_REQUEST
      )
    }
  }

  // ── AC-36-10: 权益展示 ──
  @Get(':id/benefits')
  getBenefits(@Param('id') id: string) {
    const result = this.svc.getBenefits(id)
    if (!result) {
      throw new HttpException({ message: '会员不存在' }, HttpStatus.NOT_FOUND)
    }
    return result
  }
}
