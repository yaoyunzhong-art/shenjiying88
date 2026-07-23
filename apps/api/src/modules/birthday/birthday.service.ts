// birthday.service.ts · WP-15 生日趴引擎
// BS-0199~BS-0206

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import {
  BirthdayPlan,
  BirthdayReward,
  BirthdayTracking,
  BirthdayDashboard,
  BirthdayTier,
  RewardType,
  BirthdayPlanStatus,
} from './birthday.entity';

@Injectable()
export class BirthdayService {
  private readonly logger = new Logger(BirthdayService.name);

  /** 内存存储 — 生产环境应替换为数据库 */
  private readonly planStore = new Map<string, BirthdayPlan>();
  private readonly rewardStore = new Map<string, BirthdayReward>();
  private readonly trackingStore = new Map<string, BirthdayTracking>();

  // ────────── 测试辅助 ──────────

  reset(): void {
    this.planStore.clear();
    this.rewardStore.clear();
    this.trackingStore.clear();
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0199: 生日识别 — 从会员模块获取生日信息，标记近30天生日客户
  // ══════════════════════════════════════════════════════════════

  /**
   * 标记指定会员的生日方案为「近30天即将生日」
   * 由外部定时任务/会员模块调用
   */
  markUpcomingBirthdays(memberIds: string[], birthdayMap: Record<string, string>): { marked: number } {
    let marked = 0;
    for (const memberId of memberIds) {
      const birthday = birthdayMap[memberId];
      if (!birthday) continue;

      // 找到该会员的活跃方案或创建一个临时标记
      const plan = this.findPlanByMember(memberId, 'pending') ?? this.findPlanByMember(memberId, 'active');
      if (plan) {
        plan.isUpcoming = true;
        plan.updatedAt = new Date();
        this.planStore.set(plan.id, plan);
        marked++;
      }
    }
    this.logger.log(`标记 ${marked}/${memberIds.length} 个会员为近30天生日`);
    return { marked };
  }

  /**
   * 检查单会员是否近30天生日
   */
  checkIsUpcoming(memberId: string, birthday: string): boolean {
    if (!birthday) return false;
    const [month, day] = birthday.split('-').map(Number);
    if (!month || !day) return false;

    const now = new Date();
    const currentYear = now.getFullYear();

    // 今年生日
    const thisYearBirthday = new Date(currentYear, month - 1, day);
    // 下年生日（跨年情况）
    const nextYearBirthday = new Date(currentYear + 1, month - 1, day);

    // 距离生日天数
    const diffThisYear = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const diffNextYear = Math.ceil((nextYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const diff = diffThisYear >= 0 ? diffThisYear : diffNextYear;
    return diff >= 0 && diff <= 30;
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0200~BS-0202: 自动营销 — 生日前N天自动发送优惠券/活动推送
  // ══════════════════════════════════════════════════════════════

  /**
   * 创建生日方案
   */
  createPlan(dto: {
    memberId: string;
    birthday: string;
    advanceDays: number;
    tier: BirthdayTier;
    rewardType: RewardType;
    rewardValue: number;
    allowFriends?: boolean;
    friendDiscount?: number;
  }): BirthdayPlan {
    // 校验参数
    if (!dto.memberId) throw new BadRequestException('memberId 不能为空');
    if (!dto.birthday || !/^\d{2}-\d{2}$/.test(dto.birthday)) {
      throw new BadRequestException('birthday 格式必须为 MM-DD');
    }
    if (dto.advanceDays < 0 || dto.advanceDays > 30) {
      throw new BadRequestException('advanceDays 必须在 0~30 范围内');
    }
    if (dto.rewardValue <= 0) {
      throw new BadRequestException('rewardValue 必须大于 0');
    }
    if (dto.allowFriends && (dto.friendDiscount == null || dto.friendDiscount < 0 || dto.friendDiscount > 1)) {
      throw new BadRequestException('friendDiscount 必须在 0~1 范围内');
    }

    // 检查同一会员是否已有活跃方案
    const existing = this.findPlanByMember(dto.memberId, 'pending') ?? this.findPlanByMember(dto.memberId, 'active');
    if (existing) {
      throw new ConflictException(`会员 ${dto.memberId} 已有进行中的方案: ${existing.id}`);
    }

    // 计算 planDate = 生日 - advanceDays，取今年
    const now = new Date();
    const [m, d] = dto.birthday.split('-').map(Number);
    const birthday = new Date(now.getFullYear(), m - 1, d);
    // 如果生日已过，取明年
    if (birthday.getTime() < now.getTime()) {
      birthday.setFullYear(birthday.getFullYear() + 1);
    }
    const planDate = new Date(birthday);
    planDate.setDate(planDate.getDate() - dto.advanceDays);

    const id = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const plan: BirthdayPlan = {
      id,
      memberId: dto.memberId,
      birthday: dto.birthday,
      planDate: planDate.toISOString().slice(0, 10),
      advanceDays: dto.advanceDays,
      tier: dto.tier,
      rewardType: dto.rewardType,
      rewardValue: dto.rewardValue,
      status: 'pending',
      isUpcoming: this.checkIsUpcoming(dto.memberId, dto.birthday),
      allowFriends: dto.allowFriends ?? false,
      friendDiscount: dto.friendDiscount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.planStore.set(id, plan);
    this.logger.log(`创建生日方案: ${id} (会员: ${dto.memberId})`);
    return plan;
  }

  /**
   * 获取生日方案列表
   */
  listPlans(params?: { month?: string; status?: BirthdayPlanStatus }): BirthdayPlan[] {
    let plans = Array.from(this.planStore.values());

    if (params?.status) {
      plans = plans.filter(p => p.status === params.status);
    }

    if (params?.month) {
      // month = "YYYY-MM"，匹配 planDate
      plans = plans.filter(p => p.planDate.startsWith(params.month!));
    }

    return plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 获取方案详情
   */
  getPlan(id: string): BirthdayPlan {
    const plan = this.planStore.get(id);
    if (!plan) throw new NotFoundException(`生日方案不存在: ${id}`);
    return plan;
  }

  /**
   * 触发生日推送 — 发送奖励
   */
  triggerPush(planId: string): BirthdayReward {
    const plan = this.getPlan(planId);

    if (plan.status !== 'pending') {
      throw new BadRequestException(`方案状态为 ${plan.status}，不可触发推送`);
    }

    // 更新方案状态
    plan.status = 'active';
    plan.updatedAt = new Date();
    this.planStore.set(planId, plan);

    // 创建奖励记录
    const reward: BirthdayReward = {
      id: `reward-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      planId,
      type: plan.rewardType,
      value: plan.rewardValue,
      sentAt: new Date(),
      createdAt: new Date(),
    };
    this.rewardStore.set(reward.id, reward);

    this.logger.log(`生日推送触发: ${planId} → 奖励 ${reward.id}`);
    return reward;
  }

  /**
   * 领取奖励
   */
  claimReward(planId: string): BirthdayReward {
    const plan = this.getPlan(planId);

    if (plan.status !== 'active') {
      throw new BadRequestException(`方案状态为 ${plan.status}，不可领取奖励`);
    }

    // 找到该方案下已发送的奖励
    const reward = this.getRewardByPlan(planId);
    if (!reward) {
      throw new NotFoundException(`方案 ${planId} 无已发送的奖励记录`);
    }
    if (reward.claimedAt) {
      throw new BadRequestException('奖励已被领取');
    }

    reward.claimedAt = new Date();
    this.rewardStore.set(reward.id, reward);

    // 方案完成
    plan.status = 'completed';
    plan.updatedAt = new Date();
    this.planStore.set(planId, plan);

    this.logger.log(`奖励已领取: ${reward.id}`);
    return reward;
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0203~BS-0204: 传播裂变 — 到店庆生可带好友，好友享优惠
  // ══════════════════════════════════════════════════════════════

  /**
   * 记录消费追踪（含好友裂变数据）
   */
  recordTracking(dto: {
    planId: string;
    friendInvited?: number;
    totalSpend?: number;
    returnVisitDays?: number;
  }): BirthdayTracking {
    const plan = this.getPlan(dto.planId);

    if (dto.totalSpend != null && dto.totalSpend < 0) {
      throw new BadRequestException('totalSpend 不能为负');
    }
    if (dto.friendInvited != null && dto.friendInvited < 0) {
      throw new BadRequestException('friendInvited 不能为负');
    }
    if (dto.returnVisitDays != null && dto.returnVisitDays < 0) {
      throw new BadRequestException('returnVisitDays 不能为负');
    }

    if (!plan.allowFriends && (dto.friendInvited ?? 0) > 0) {
      throw new BadRequestException('该方案不允许带好友');
    }

    const tracking: BirthdayTracking = {
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      planId: dto.planId,
      friendInvited: dto.friendInvited ?? 0,
      totalSpend: dto.totalSpend ?? 0,
      returnVisitDays: dto.returnVisitDays ?? 0,
      createdAt: new Date(),
    };

    this.trackingStore.set(tracking.id, tracking);
    this.logger.log(`追踪记录: ${tracking.id} (方案: ${dto.planId})`);
    return tracking;
  }

  /**
   * 查询会员的裂变好友数
   */
  getFriendStats(memberId: string): { totalInvited: number; avgSpend: number } {
    const plans = this.listPlansByMember(memberId);
    const trackingEntries = plans
      .map(p => this.getTrackingByPlan(p.id))
      .filter(Boolean) as BirthdayTracking[];

    const totalInvited = trackingEntries.reduce((s, t) => s + t.friendInvited, 0);
    const totalSpend = trackingEntries.reduce((s, t) => s + t.totalSpend, 0);
    const avgSpend = trackingEntries.length > 0 ? totalSpend / trackingEntries.length : 0;

    return { totalInvited, avgSpend };
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0205~BS-0206: 复购追踪 — 生日的消费记录、复购率看板
  // ══════════════════════════════════════════════════════════════

  /**
   * 生日趴看板
   */
  getDashboard(month?: string): BirthdayDashboard {
    const now = new Date();
    const targetMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const plans = this.listPlans({ month: targetMonth });
    const allPlans = Array.from(this.planStore.values());
    const activePlans = allPlans.filter(p => p.status === 'active').length;
    const allTracking = Array.from(this.trackingStore.values());

    // 当月生日数
    const monthlyBirthdays = plans.length;

    // 转化率 — 已领取的奖励 / 已发送的奖励
    const allRewards = Array.from(this.rewardStore.values());
    const sentCount = allRewards.filter(r => r.sentAt).length;
    const claimedCount = allRewards.filter(r => r.claimedAt).length;
    const conversionRate = sentCount > 0 ? claimedCount / sentCount : 0;

    // 平均消费
    const totalSpend = allTracking.reduce((s, t) => s + t.totalSpend, 0);
    const avgSpend = allTracking.length > 0 ? totalSpend / allTracking.length : 0;

    // 复购率 — 30天内复购的追踪数占比
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const returnCount = allTracking.filter(
      t => t.returnVisitDays > 0 && t.returnVisitDays <= 30
    ).length;
    const returnRate = allTracking.length > 0 ? returnCount / allTracking.length : 0;

    return {
      monthlyBirthdays,
      activePlans,
      conversionRate: Number(conversionRate.toFixed(4)),
      avgSpend: Number(avgSpend.toFixed(2)),
      returnRate: Number(returnRate.toFixed(4)),
      month: targetMonth,
      updatedAt: now,
    };
  }

  /**
   * 会员生日统计
   */
  getMemberStats(memberId: string): {
    planCount: number;
    totalSpend: number;
    totalInvited: number;
    avgReturnVisitDays: number;
    lastBirthday?: string;
  } {
    const plans = this.listPlansByMember(memberId);
    const trackingEntries = plans
      .map(p => this.getTrackingByPlan(p.id))
      .filter(Boolean) as BirthdayTracking[];

    const totalSpend = trackingEntries.reduce((s, t) => s + t.totalSpend, 0);
    const totalInvited = trackingEntries.reduce((s, t) => s + t.friendInvited, 0);
    const returnDays = trackingEntries.filter(t => t.returnVisitDays > 0);
    const avgReturnVisitDays =
      returnDays.length > 0
        ? returnDays.reduce((s, t) => s + t.returnVisitDays, 0) / returnDays.length
        : 0;

    const lastPlan = plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    const lastBirthday = lastPlan?.planDate;

    return {
      planCount: plans.length,
      totalSpend,
      totalInvited,
      avgReturnVisitDays: Number(avgReturnVisitDays.toFixed(2)),
      lastBirthday,
    };
  }

  // ────────── 内部辅助方法 ──────────

  private findPlanByMember(memberId: string, status?: BirthdayPlanStatus): BirthdayPlan | undefined {
    return Array.from(this.planStore.values()).find(
      p => p.memberId === memberId && (!status || p.status === status)
    );
  }

  private listPlansByMember(memberId: string): BirthdayPlan[] {
    return Array.from(this.planStore.values()).filter(p => p.memberId === memberId);
  }

  private getRewardByPlan(planId: string): BirthdayReward | undefined {
    return Array.from(this.rewardStore.values()).find(r => r.planId === planId);
  }

  private getTrackingByPlan(planId: string): BirthdayTracking | undefined {
    return Array.from(this.trackingStore.values()).find(t => t.planId === planId);
  }
}
