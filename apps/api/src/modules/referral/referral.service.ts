// referral.service.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-68 下午主任务
// 状态: IMPLEMENTED · 短码 + 二维码 + track + 奖励计算 + 三级裂变
// 关联: tasks.md T8

import { randomBytes } from 'node:crypto';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service';
import {
  type GenerateCodeInput,
  type ReferralCode,
  type ReferralLevel,
  type ReferralMetrics,
  type ReferralRecord,
  type ReferralReward,
  type TrackClickInput,
  type TrackSignupInput,
} from './referral.entity';

/**
 * ReferralService · 社群裂变追踪服务 (Phase-17 T8)
 *
 * 核心能力:
 * 1. 生成短码 (6-8 位 base62) + 二维码 URL
 * 2. 点击追踪 (短码 → child userId 临时绑定)
 * 3. 注册补登 (临时绑定 → 正式 record)
 * 4. 三级裂变 (L1 直接邀请, L2/L3 间接邀请)
 * 5. 奖励计算 (L1: 100 积分 + 50 元券, L2: 50 积分, L3: 10 积分)
 * 6. 追踪率指标 (目标 ≥95%)
 *
 * 设计:
 * - 内存存储 (生产应接 Redis + Postgres)
 * - 短码不可猜测 (6 字节 random → 8 字符 base64url)
 * - 三级限制 (防刷): 只追踪 L1/L2/L3, 超过深度的不追踪
 */
@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  // 短码 → ReferralCode
  private readonly codeStore = new Map<string, ReferralCode>();
  // recordId → ReferralRecord
  private readonly recordStore = new Map<string, ReferralRecord>();
  // rewardId → ReferralReward
  private readonly rewardStore = new Map<string, ReferralReward>();
  constructor(@Optional() private readonly marketingMetricsService?: MarketingMetricsService) {}

  /** L1/L2/L3 奖励规则 (用户可配置) */
  private readonly rewardRules: Record<ReferralLevel, { points: number; coupon: number }> = {
    1: { points: 100, coupon: 50 },
    2: { points: 50, coupon: 0 },
    3: { points: 10, coupon: 0 },
  };

  /** 临时绑定:shortCode → childUserId (等待注册补登) */
  private readonly pendingByCode = new Map<string, { childUserId?: string; clickedAt: string }>();

  /** 测试 helper: 清空 */
  reset(): void {
    this.codeStore.clear();
    this.recordStore.clear();
    this.rewardStore.clear();
    this.pendingByCode.clear();
  }

  /**
   * 一站式创建 Referral: 生成短码 + 追踪注册, 一步完成
   * 用于测试中需要直接创建完整推荐记录的场景
   */
  createReferral(
    tenantContext: { tenantId: string },
    referrerId: string,
    refereeId: string,
    code?: string,
  ): ReferralCode {
    // 生成短码
    const generateInput: GenerateCodeInput = {
      parentUserId: referrerId,
      tenantId: tenantContext.tenantId,
    };
    const referralCode = this.generateCode(generateInput);
    const shortCode = referralCode.shortCode;

    // 如果提供了自定义 code, 替换生成的 shortCode
    if (code) {
      const existing = this.codeStore.get(code);
      if (existing) {
        // code 已存在, 使用自动生成的 new code
        this.logger.warn(`Code ${code} already exists, using ${shortCode} instead`);
      } else {
        // 用自定义 code 替换
        this.codeStore.delete(shortCode);
        const newCode: ReferralCode = { ...referralCode, shortCode: code };
        this.codeStore.set(code, newCode);
        referralCode.shortCode = code;
      }
    }

    // 模拟点击
    this.trackClick({
      shortCode: referralCode.shortCode,
      childUserId: refereeId,
      source: 'link',
    });

    // 模拟注册补登 → 生成 record
    this.trackSignup({
      shortCode: referralCode.shortCode,
      childUserId: refereeId,
    });

    return referralCode;
  }

  /**
   * 获取 Referral 的详细记录 (按短码查找)
   */
  getReferral(shortCode: string): ReferralCode | undefined {
    return this.getCode(shortCode);
  }

  /**
   * 获取某个 referrer 的所有推荐记录
   */
  getReferrerReferrals(referrerId: string, tenantContext: { tenantId: string }): ReferralRecord[] {
    return Array.from(this.recordStore.values()).filter(
      r => r.parentUserId === referrerId && r.tenantId === tenantContext.tenantId,
    );
  }

  /**
   * 获取推荐漏斗指标
   */
  getFunnelMetrics(tenantContext: { tenantId: string }): { totalReferrals: number } {
    const records = Array.from(this.recordStore.values()).filter(
      r => r.tenantId === tenantContext.tenantId,
    );
    return { totalReferrals: records.length };
  }

  /** 测试 helper: 设置奖励规则 */
  setRewardRules(rules: Record<ReferralLevel, { points: number; coupon: number }>): void {
    Object.assign(this.rewardRules, rules);
  }

  // ─── 1. 短码生成 ────────────────────────────────────────

  generateCode(input: GenerateCodeInput): ReferralCode {
    const shortCode = this.makeShortCode();
    const codeId = `code-${randomBytes(6).toString('hex')}`;
    const baseUrl = input.baseUrl ?? 'https://m.shenjiying88.com';
    const code: ReferralCode = {
      codeId,
      shortCode,
      parentUserId: input.parentUserId,
      tenantId: input.tenantId,
      qrCodeUrl: `${baseUrl}/qr/${shortCode}.png`,
      landingUrl: `${baseUrl}/r/${shortCode}`,
      createdAt: new Date().toISOString(),
      expiresAt: input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000).toISOString()
        : undefined,
      totalClicks: 0,
      totalSignups: 0,
    };
    this.codeStore.set(shortCode, code);
    this.logger.log(`Generated code ${shortCode} for parent ${input.parentUserId}`);
    return code;
  }

  private makeShortCode(): string {
    // 6 bytes → 8 chars base64url (去掉 padding)
    return randomBytes(6).toString('base64url').slice(0, 8);
  }

  getCode(shortCode: string): ReferralCode | undefined {
    return this.codeStore.get(shortCode);
  }

  // ─── 2. 点击追踪 ────────────────────────────────────────

  trackClick(input: TrackClickInput): ReferralCode | undefined {
    const code = this.codeStore.get(input.shortCode);
    if (!code) return undefined;
    if (code.expiresAt && code.expiresAt < new Date().toISOString()) {
      this.logger.warn(`Code ${input.shortCode} expired`);
      return undefined;
    }
    code.totalClicks += 1;
    this.pendingByCode.set(input.shortCode, {
      childUserId: input.childUserId,
      clickedAt: new Date().toISOString(),
    });
    this.marketingMetricsService?.incrReferralTrack(code.tenantId);
    this.logger.debug(`Click tracked: ${input.shortCode} → ${input.source}`);
    return code;
  }

  // ─── 3. 注册补登 + 三级裂变 ──────────────────────────────

  trackSignup(input: TrackSignupInput): ReferralRecord {
    const code = this.codeStore.get(input.shortCode);
    if (!code) {
      throw new Error(`Referral code not found: ${input.shortCode}`);
    }
    code.totalSignups += 1;

    // 三级裂变: 向上追 parent 的祖先链 (递归查 L2 + L3)
    const ancestorChain: string[] = [code.parentUserId];
    let cursorParentId = code.parentUserId;
    for (let i = 0; i < 2; i++) {
      const parentRecord = this.findRecordByChild(cursorParentId);
      if (!parentRecord) break;
      ancestorChain.push(parentRecord.parentUserId);
      cursorParentId = parentRecord.parentUserId;
    }

    const recordId = `rec-${randomBytes(6).toString('hex')}`;
    const record: ReferralRecord = {
      recordId,
      parentUserId: code.parentUserId,
      childUserId: input.childUserId,
      tenantId: code.tenantId,
      level: 1,
      ancestorChain,
      source: this.pendingByCode.get(input.shortCode)?.childUserId ? 'wechat' : 'link',
      clickedAt: this.pendingByCode.get(input.shortCode)?.clickedAt ?? new Date().toISOString(),
      signedUpAt: input.signupAt ?? new Date().toISOString(),
      tracked: true,
    };
    this.recordStore.set(recordId, record);
    this.logger.log(`Signup tracked: ${input.shortCode} → child ${input.childUserId}`);
    return record;
  }

  /** 查 child 的最近 record (用于 ancestor chain) */
  private findRecordByChild(childUserId: string): ReferralRecord | undefined {
    for (const r of this.recordStore.values()) {
      if (r.childUserId === childUserId) return r;
    }
    return undefined;
  }

  // ─── 4. 奖励发放 ────────────────────────────────────────

  issueRewards(recordId: string): ReferralReward[] {
    const record = this.recordStore.get(recordId);
    if (!record) throw new Error(`Record not found: ${recordId}`);
    const rewards: ReferralReward[] = [];

    // 链头 (L1) 是当前邀请人
    // 链 2/3 是 L2/L3
    const allRecipients = [
      { userId: record.parentUserId, level: 1 as ReferralLevel },
    ];
    if (record.ancestorChain.length >= 2) {
      allRecipients.push({ userId: record.ancestorChain[1], level: 2 as ReferralLevel });
    }
    if (record.ancestorChain.length >= 3) {
      allRecipients.push({ userId: record.ancestorChain[2], level: 3 as ReferralLevel });
    }

    for (const { userId, level } of allRecipients) {
      const rule = this.rewardRules[level];
      const rewardId = `reward-${randomBytes(6).toString('hex')}`;
      const reward: ReferralReward = {
        rewardId,
        recordId,
        recipientUserId: userId,
        level,
        rewardType: 'points',
        rewardValue: rule.points,
        couponPlanId: rule.coupon > 0 ? `coupon-l${level}-${rule.coupon}` : undefined,
        status: 'issued',
        triggeredAt: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
      };
      this.rewardStore.set(rewardId, reward);
      rewards.push(reward);
      this.marketingMetricsService?.incrReferralReward(record.tenantId);
    }
    return rewards;
  }

  // ─── 5. 指标查询 ────────────────────────────────────────

  getMetrics(tenantId?: string): ReferralMetrics {
    const codes = tenantId
      ? Array.from(this.codeStore.values()).filter(c => c.tenantId === tenantId)
      : Array.from(this.codeStore.values());
    const records = tenantId
      ? Array.from(this.recordStore.values()).filter(r => r.tenantId === tenantId)
      : Array.from(this.recordStore.values());
    const rewards = tenantId
      ? Array.from(this.rewardStore.values())
      : Array.from(this.rewardStore.values());

    const totalClicks = codes.reduce((s, c) => s + c.totalClicks, 0);
    const totalSignups = records.length;
    const trackRate = totalClicks > 0 ? totalSignups / totalClicks : 0;
    const conversionRate = totalClicks > 0 ? totalSignups / totalClicks : 0;
    const totalRewardsValue = rewards.reduce((s, r) => s + r.rewardValue, 0);

    return {
      totalCodes: codes.length,
      totalClicks,
      totalSignups,
      trackRate,
      conversionRate,
      totalRewardsIssued: rewards.length,
      totalRewardsValue,
    };
  }

  listRecords(tenantId: string): ReferralRecord[] {
    return Array.from(this.recordStore.values()).filter(r => r.tenantId === tenantId);
  }

  listRewards(tenantId: string): ReferralReward[] {
    // 通过 recordId 过滤
    const tenantRecordIds = new Set(
      Array.from(this.recordStore.values())
        .filter(r => r.tenantId === tenantId)
        .map(r => r.recordId),
    );
    return Array.from(this.rewardStore.values()).filter(r => tenantRecordIds.has(r.recordId));
  }
}
