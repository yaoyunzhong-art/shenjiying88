// birthday.controller.ts · WP-15 生日趴引擎
// BS-0199~BS-0206

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BirthdayService } from './birthday.service';
import { BirthdayTier, BirthdayPlanStatus } from './birthday.entity';

@Controller('birthday')
export class BirthdayController {
  constructor(private readonly svc: BirthdayService) {}

  // ══════════════════════════════════════════════════════
  // BS-0199: 生日识别 + BS-0200~0202: 自动营销
  // ══════════════════════════════════════════════════════

  /**
   * POST /birthday/plans — 创建生日方案
   */
  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  createPlan(
    @Body() body: {
      memberId: string;
      birthday: string;
      advanceDays?: number;
      tier?: BirthdayTier;
      rewardType?: string;
      rewardValue?: number;
      allowFriends?: boolean;
      friendDiscount?: number;
    },
  ): any {
    return this.svc.createPlan({
      memberId: body.memberId,
      birthday: body.birthday,
      advanceDays: body.advanceDays ?? 3,
      tier: (body.tier as BirthdayTier) ?? BirthdayTier.Standard,
      rewardType: (body.rewardType as any) ?? 'coupon',
      rewardValue: body.rewardValue ?? 50,
      allowFriends: body.allowFriends,
      friendDiscount: body.friendDiscount,
    });
  }

  /**
   * GET /birthday/plans — 生日方案列表
   */
  @Get('plans')
  listPlans(
    @Query('month') month?: string,
    @Query('status') status?: BirthdayPlanStatus,
  ): any {
    return { plans: this.svc.listPlans({ month, status }) };
  }

  /**
   * GET /birthday/plans/:id — 方案详情
   */
  @Get('plans/:id')
  getPlan(@Param('id') id: string): any {
    return this.svc.getPlan(id);
  }

  /**
   * POST /birthday/plans/:id/trigger — 触发生日推送
   */
  @Post('plans/:id/trigger')
  @HttpCode(HttpStatus.OK)
  triggerPush(@Param('id') id: string): any {
    return this.svc.triggerPush(id);
  }

  /**
   * POST /birthday/plans/:id/claim — 领取奖励
   */
  @Post('plans/:id/claim')
  @HttpCode(HttpStatus.OK)
  claimReward(@Param('id') id: string): any {
    return this.svc.claimReward(id);
  }

  // ══════════════════════════════════════════════════════
  // BS-0203~BS-0204: 传播裂变
  // ══════════════════════════════════════════════════════

  /**
   * POST /birthday/plans/:id/track — 记录消费追踪
   */
  @Post('plans/:id/track')
  @HttpCode(HttpStatus.CREATED)
  recordTracking(
    @Param('id') id: string,
    @Body() body: { friendInvited?: number; totalSpend?: number; returnVisitDays?: number },
  ): any {
    return this.svc.recordTracking({
      planId: id,
      friendInvited: body.friendInvited,
      totalSpend: body.totalSpend,
      returnVisitDays: body.returnVisitDays,
    });
  }

  // ══════════════════════════════════════════════════════
  // BS-0205~BS-0206: 复购追踪与看板
  // ══════════════════════════════════════════════════════

  /**
   * GET /birthday/stats — 生日趴看板数据
   */
  @Get('stats')
  getDashboard(@Query('month') month?: string): any {
    return this.svc.getDashboard(month);
  }

  /**
   * GET /birthday/stats/:memberId — 会员生日统计
   */
  @Get('stats/:memberId')
  getMemberStats(@Param('memberId') memberId: string): any {
    return this.svc.getMemberStats(memberId);
  }
}
