// referral.controller.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral 控制器

import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ReferralService } from './referral.service';
import {
  GenerateCodeDto,
  TrackClickDto,
  TrackSignupDto,
} from './referral.dto';
import type { ReferralCode } from './referral.entity';
import { TenantGuard } from '../agent/tenant.guard';

@Controller('referral')
@UseGuards(TenantGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  /**
   * POST /referral/code
   * 生成裂变短码
   */
  @Post('code')
  generateCode(@Body() dto: GenerateCodeDto) {
    const code = this.referralService.generateCode({
      parentUserId: dto.parentUserId,
      tenantId: dto.tenantId,
      baseUrl: dto.baseUrl,
      expiresInDays: dto.expiresInDays,
    });
    return code;
  }

  /**
   * GET /referral/code/:shortCode
   * 查询短码详情
   */
  @Get('code/:shortCode')
  getCode(
    @Param('shortCode') shortCode: string,
  ): { found: false; message: string } | { found: true; code: ReferralCode } {
    const code = this.referralService.getCode(shortCode);
    if (!code) {
      return { found: false, message: `Code not found: ${shortCode}` };
    }
    return { found: true, code };
  }

  /**
   * POST /referral/click
   * 记录裂变链接点击
   */
  @Post('click')
  trackClick(@Body() dto: TrackClickDto) {
    const code = this.referralService.trackClick({
      shortCode: dto.shortCode,
      childUserId: dto.childUserId,
      source: dto.source,
    });
    if (!code) {
      return { success: false, message: `Invalid or expired code: ${dto.shortCode}` };
    }
    return { success: true, totalClicks: code.totalClicks };
  }

  /**
   * POST /referral/signup
   * 注册补登（绑定短码和用户）
   */
  @Post('signup')
  trackSignup(@Body() dto: TrackSignupDto) {
    const record = this.referralService.trackSignup({
      shortCode: dto.shortCode,
      childUserId: dto.childUserId,
      signupAt: dto.signupAt,
    });
    return {
      recordId: record.recordId,
      parentUserId: record.parentUserId,
      childUserId: record.childUserId,
      level: record.level,
      ancestorChain: record.ancestorChain,
      source: record.source,
      tracked: record.tracked,
    };
  }

  /**
   * POST /referral/rewards/:recordId
   * 发放裂变奖励
   */
  @Post('rewards/:recordId')
  issueRewards(@Param('recordId') recordId: string) {
    const rewards = this.referralService.issueRewards(recordId);
    return {
      rewards: rewards.map(r => ({
        rewardId: r.rewardId,
        recipientUserId: r.recipientUserId,
        level: r.level,
        rewardType: r.rewardType,
        rewardValue: r.rewardValue,
        status: r.status,
      })),
    };
  }

  /**
   * GET /referral/metrics
   * 查询裂变指标
   */
  @Get('metrics')
  getMetrics(@Query('tenantId') tenantId?: string) {
    return this.referralService.getMetrics(tenantId);
  }

  /**
   * GET /referral/records
   * 查询裂变记录列表
   */
  @Get('records')
  listRecords(@Query('tenantId') tenantId: string) {
    const records = this.referralService.listRecords(tenantId);
    return { records: records.map(r => ({
      recordId: r.recordId,
      parentUserId: r.parentUserId,
      childUserId: r.childUserId,
      level: r.level,
      source: r.source,
      signedUpAt: r.signedUpAt,
      tracked: r.tracked,
    }))};
  }

  /**
   * GET /referral/rewards
   * 查询奖励记录列表
   */
  @Get('rewards')
  listRewards(@Query('tenantId') tenantId: string) {
    const rewards = this.referralService.listRewards(tenantId);
    return { rewards: rewards.map(r => ({
      rewardId: r.rewardId,
      recipientUserId: r.recipientUserId,
      level: r.level,
      rewardType: r.rewardType,
      rewardValue: r.rewardValue,
      status: r.status,
      issuedAt: r.issuedAt,
    }))};
  }
}
