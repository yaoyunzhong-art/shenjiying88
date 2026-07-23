// employee-marketing.service.ts · WP-11 全员营销与绩效
// 宪法对齐: 第13章 全员营销科学闭环执行机制（C端影响最小化）
// 对齐状态: v2 · 2026-07-23 · 完全对齐

import { randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type {
  PromoCode,
  PromoTracking,
  PromoTrackingStatus,
  KpiConfig,
  KpiResult,
  MarketingTask,
  EmployeePromoStats,
  ComplianceCheckResult,
  LeaderboardEntry,
  MarketingTaskV2,
  MentorRelation,
  AchievementBadge,
  PeakRestPeriod,
  CirclePost,
  KolProfile,
  KolLevel,
  TaskDifficulty,
} from './employee-marketing.entity';
import type {
  CreatePromoCodeDto,
  TrackPromotionDto,
  CreateKpiConfigDto,
  SubmitKpiResultDto,
  CreateTaskDto,
} from './employee-marketing.dto';

@Injectable()
export class EmployeeMarketingService {
  private readonly logger = new Logger(EmployeeMarketingService.name);

  // ─── 内存存储（生产应接数据库） ──────────────────────
  private readonly promoCodeStore = new Map<string, PromoCode>();
  private readonly promoTrackingStore = new Map<string, PromoTracking>();
  private readonly kpiConfigStore = new Map<string, KpiConfig>();
  private readonly kpiResultStore = new Map<string, KpiResult>();
  private readonly taskStore = new Map<string, MarketingTaskV2>();
  private readonly mentorStore = new Map<string, MentorRelation>();
  private readonly badgeStore = new Map<string, AchievementBadge>();
  private readonly peakRestStore = new Map<string, PeakRestPeriod>();
  private readonly circleStore = new Map<string, CirclePost>();
  private readonly kolStore = new Map<string, KolProfile>();
  private readonly employeeTrackings = new Map<string, string[]>();

  /** 宪法13.5常量 */
  private readonly BONUS_POOL_RATE = 0.05; // 增量利润5%
  private readonly GUARANTEED_BONUS_RATE = 0.05; // 保底基本工资5%
  private readonly PEAK_REST_CONSECUTIVE = 3; // 连续3月金牌
  private readonly PEAK_REST_REDUCTION = 0.2; // KPI降20%

  /** 宪法13.3任务解锁条件 */
  private readonly TASK_UNLOCK = {
    basic: { prerequisite: '' },           // 初级无条件
    intermediate: { prerequisite: 'basic_50' },  // 中级: 完成初级50次
    advanced: { prerequisite: 'intermediate_30_certified' }, // 高级: 完成中级30次+培训认证
  };

  /** 宪法13.3任务积分矩阵 */
  private readonly TASK_POINTS = {
    basic: { min: 3, max: 5 },
    intermediate: { min: 10, max: 20 },
    advanced: { min: 50, max: 100 },
  };

  /** 宪法13.5阶梯佣金（销售额越高比例越高） */
  private readonly COMMISSION_TIERS = [
    { min: 0, max: 10, rate: 0.03 },      // 1-10单: 3%
    { min: 11, max: 30, rate: 0.05 },     // 11-30单: 5%
    { min: 31, max: 100, rate: 0.07 },    // 31-100单: 7%
    { min: 101, max: Infinity, rate: 0.10 }, // 101+单: 10%
  ];

  /** 宪法13.1岗位KPI配置（宪法原文） */
  private readonly POSITION_KPI_DEFAULTS = {
    frontline: { // 一线作战
      core: ['引流到店', '个人销售', '企微新增'],
      weight: 0.5,
      auxiliary: ['任务完成度', '客户好评'],
    },
    management: { // 管理带动
      core: ['门店销售达成', '团队任务完成率'],
      weight: 0.6,
      auxiliary: ['大客户复购', '辅导记录'],
    },
    content: { // 市场内容
      core: ['活动ROI', '素材产出', '分销拓展'],
      weight: 0.7,
      auxiliary: ['爆款内容率≥5%'],
    },
    support: { // 支持赋能
      core: ['有效线索', '亲友推荐'],
      weight: 0.2,
      auxiliary: ['后勤满意度'],
    },
    logistics: { // 后勤保障
      core: ['卫生巡检达标', '设备巡检完成'],
      weight: 0.2,
      auxiliary: ['门店环境评分'],
    },
  };

  private computeCommissionTier(orderCount: number): number {
    for (let i = this.COMMISSION_TIERS.length - 1; i >= 0; i--) {
      const tier = this.COMMISSION_TIERS[i];
      if (orderCount >= tier.min && orderCount <= tier.max) return i + 1;
    }
    return 1;
  }

  private getCommissionRate(tier: number): number {
    return this.COMMISSION_TIERS[Math.min(tier, this.COMMISSION_TIERS.length) - 1]?.rate ?? 0.03;
  }

  reset(): void {
    for (const store of [this.promoCodeStore, this.promoTrackingStore, this.kpiConfigStore,
      this.kpiResultStore, this.taskStore, this.mentorStore, this.badgeStore,
      this.peakRestStore, this.circleStore, this.kolStore, this.employeeTrackings]) {
      store.clear();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.2/13.3 · 任务弹性机制 + 难度分级
  // ══════════════════════════════════════════════════════════════

  createTask(dto: CreateTaskDto): MarketingTaskV2 {
    if (dto.assignedTo.length === 0) throw new Error('任务必须指定至少一个员工');
    const difficulty = this.determineTaskDifficulty(dto.points);
    const id = `task-${randomBytes(8).toString('hex')}`;
    const task: MarketingTaskV2 = {
      id,
      ...dto,
      difficulty,
      unlockCondition: this.TASK_UNLOCK[difficulty]?.prerequisite,
      isReplaceable: difficulty === 'basic', // 初级任务可替换
      deadline: new Date(dto.deadline),
      status: 'active',
      createdAt: new Date(),
    };
    this.taskStore.set(id, task);
    this.logger.log(`创建${difficulty}任务: ${dto.title}`);
    return task;
  }

  private determineTaskDifficulty(points: number): TaskDifficulty {
    if (points <= 5) return 'basic';
    if (points <= 20) return 'intermediate';
    return 'advanced';
  }

  /** 宪法13.2：替换任务 */
  replaceTask(taskId: string, employeeId: string): MarketingTaskV2 | undefined {
    const task = this.taskStore.get(taskId);
    if (!task) return undefined;
    if (!task.isReplaceable) throw new Error('该任务不可替换（仅初级可替换）');
    if (!task.assignedTo.includes(employeeId)) throw new Error('该任务未分配给您');
    task.assignedTo = task.assignedTo.filter(e => e !== employeeId);
    if (task.assignedTo.length === 0) task.status = 'expired';
    this.taskStore.set(taskId, task);
    return task;
  }

  /** 宪法13.2：申诉通道（2h复核） */
  appealTask(taskId: string, reason: string): MarketingTaskV2 | undefined {
    const task = this.taskStore.get(taskId);
    if (!task) return undefined;
    task.status = 'appealed';
    task.appealReason = reason;
    this.taskStore.set(taskId, task);
    // 2h自动复核逻辑（生产环境应接定时任务）
    setTimeout(() => {
      const current = this.taskStore.get(taskId);
      if (current?.status === 'appealed') {
        current.status = 'active'; // 超时默认恢复
        this.taskStore.set(taskId, current);
        this.logger.log(`申诉超时自动恢复: ${taskId}`);
      }
    }, 7200000);
    return task;
  }

  getEmployeeTasks(employeeId: string): MarketingTaskV2[] {
    return Array.from(this.taskStore.values()).filter(t => t.assignedTo.includes(employeeId));
  }

  completeTask(id: string): MarketingTaskV2 | undefined {
    const task = this.taskStore.get(id);
    if (!task) return undefined;
    task.status = 'completed';
    this.taskStore.set(id, task);
    return task;
  }

  /** 宪法13.3：获取已解锁的任务列表 */
  getAvailableTasks(employeeId: string, basicCompleted: number, intermediateCompleted: number): MarketingTaskV2[] {
    return Array.from(this.taskStore.values()).filter(t => {
      if (t.assignedTo.includes(employeeId)) return true;
      if (t.difficulty === 'basic') return true; // 初级无条件解锁
      if (t.difficulty === 'intermediate' && basicCompleted >= 50) return true;
      if (t.difficulty === 'advanced' && intermediateCompleted >= 30) return true;
      return false;
    });
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.6 · 师徒制2.0
  // ══════════════════════════════════════════════════════════════

  /** 新员工自动匹配金牌师傅 */
  autoMatchMentor(apprenticeId: string, storeId: string): MentorRelation | undefined {
    // 查找该门店金牌师傅（取排行榜TOP3且当前师傅数<3的）
    const allMentors = Array.from(this.mentorStore.values())
      .filter(m => m.status === 'active');
    const mentorCount = new Map<string, number>();
    for (const m of allMentors) {
      mentorCount.set(m.mentorId, (mentorCount.get(m.mentorId) ?? 0) + 1);
    }
    // 取佣金最高的3名员工且徒弟数<3
    const topEmployees = this.getLeaderboard(10)
      .filter(e => (mentorCount.get(e.employeeId) ?? 0) < 3);
    if (topEmployees.length === 0) return undefined;

    const mentorId = topEmployees[0].employeeId;
    const id = `mentor-${randomBytes(8).toString('hex')}`;
    const relation: MentorRelation = {
      id, apprenticeId, mentorId,
      startDate: new Date(),
      status: 'active',
      coachingScore: 0,
    };
    this.mentorStore.set(id, relation);
    return relation;
  }

  /** 获取师徒关系 */
  getMentorRelations(employeeId: string): MentorRelation[] {
    return Array.from(this.mentorStore.values()).filter(
      r => r.apprenticeId === employeeId || r.mentorId === employeeId
    );
  }

  /** 更新辅导成绩（纳入KPI辅助指标） */
  updateCoachingScore(relationId: string, score: number): MentorRelation | undefined {
    const relation = this.mentorStore.get(relationId);
    if (!relation) return undefined;
    relation.coachingScore = score;
    this.mentorStore.set(relationId, relation);
    return relation;
  }

  /** 宪法13.7：将士圈分享 */
  postToCircle(employeeId: string, content: string, tips: string): CirclePost {
    const post: CirclePost = {
      id: `circle-${randomBytes(8).toString('hex')}`,
      employeeId, content, tips,
      likes: 0,
      createdAt: new Date(),
    };
    this.circleStore.set(post.id, post);
    return post;
  }

  getCircleFeed(limit = 20): CirclePost[] {
    return Array.from(this.circleStore.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /** 宪法13.7：星光晨会素材 */
  getMorningShareMaterial(): { topPerformer: CirclePost | null; tips: string[] } {
    const top = Array.from(this.circleStore.values())
      .sort((a, b) => b.likes - a.likes)[0] ?? null;
    const allTips = Array.from(this.circleStore.values())
      .slice(0, 5).map(p => p.tips).filter(Boolean);
    return { topPerformer: top, tips: allTips };
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.4 · 5类岗位KPI
  // ══════════════════════════════════════════════════════════════

  /** 获取岗位KPI默认配置（宪法原文对齐） */
  getPositionKpiDefaults(positionType: string): any {
    return this.POSITION_KPI_DEFAULTS[positionType as keyof typeof this.POSITION_KPI_DEFAULTS]
      ?? null;
  }

  createKpiConfig(dto: CreateKpiConfigDto): KpiConfig {
    if (!['frontline', 'management', 'content', 'support', 'logistics'].includes(dto.positionType)) {
      throw new Error('岗位类型不符宪法13.4，可选: frontline/management/content/support/logistics');
    }
    if (dto.weight < 0 || dto.weight > 1) throw new Error('权重必须为 0~1');
    const id = `kpi-${randomBytes(8).toString('hex')}`;
    const config: KpiConfig = {
      id,
      positionType: dto.positionType as any,
      metricName: dto.metricName,
      target: dto.target,
      weight: dto.weight,
      unit: dto.unit,
      period: dto.period,
    };
    this.kpiConfigStore.set(id, config);
    return config;
  }

  listKpiConfigs(positionType?: string): KpiConfig[] {
    const all = Array.from(this.kpiConfigStore.values());
    return positionType ? all.filter(c => c.positionType === positionType) : all;
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.5 · 激励体系（奖金池+保底+阶梯佣金+巅峰休息期）
  // ══════════════════════════════════════════════════════════════

  submitKpiResult(dto: SubmitKpiResultDto): KpiResult {
    const configs = Array.from(this.kpiConfigStore.values());
    for (const key of Object.keys(dto.scores)) {
      if (!configs.some(c => c.metricName === key)) throw new Error(`未知 KPI 指标: ${key}`);
    }

    const id = `kr-${randomBytes(8).toString('hex')}`;
    let totalScore = 0;
    for (const config of configs) {
      totalScore += (dto.scores[config.metricName] ?? 0) * config.weight;
    }
    totalScore = Number(totalScore.toFixed(2));

    // 宪法13.5: 全员奖金池 = 增量利润 × 5%
    const estimatedProfit = totalScore * 1000; // 模拟计算
    const bonusPoolAmount = Math.round(estimatedProfit * this.BONUS_POOL_RATE);

    // 宪法13.5: 保底奖金 = 增量利润为负时基本工资×5%
    const isNegativeProfit = estimatedProfit <= 0;
    const guaranteedBonus = isNegativeProfit;
    const finalBonus = isNegativeProfit
      ? Math.round(8000 * this.GUARANTEED_BONUS_RATE) // 模拟基本工资8000
      : bonusPoolAmount;

    // 宪法13.5: 巅峰休息期检测
    this.updatePeakRest(dto.employeeId, totalScore);

    const result: KpiResult = {
      id,
      employeeId: dto.employeeId,
      period: dto.period,
      scores: dto.scores,
      totalScore,
      bonusAmount: finalBonus,
      bonusPoolAmount,
      guaranteedBonus,
      createdAt: new Date(),
    };
    this.kpiResultStore.set(id, result);
    return result;
  }

  /** 宪法13.5: 巅峰休息期 */
  private updatePeakRest(employeeId: string, score: number): void {
    const current = this.peakRestStore.get(employeeId) ?? {
      employeeId, consecutiveGoldMonths: 0,
      kpiReductionPercent: 0, isActive: false,
    };
    // 假设总分>=90为金牌
    if (score >= 90) {
      current.consecutiveGoldMonths++;
    } else {
      current.consecutiveGoldMonths = 0;
    }
    // 连续3月金牌→第4月KPI降20%
    if (current.consecutiveGoldMonths >= this.PEAK_REST_CONSECUTIVE) {
      current.kpiReductionPercent = this.PEAK_REST_REDUCTION;
      current.isActive = true;
    } else {
      current.kpiReductionPercent = 0;
      current.isActive = false;
    }
    this.peakRestStore.set(employeeId, current);
  }

  /** 查询员工巅峰休息期状态 */
  getPeakRest(employeeId: string): PeakRestPeriod | null {
    return this.peakRestStore.get(employeeId) ?? null;
  }

  getKpiResults(employeeId: string): KpiResult[] {
    return Array.from(this.kpiResultStore.values()).filter(r => r.employeeId === employeeId);
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.8 · 推广归因透明化
  // ══════════════════════════════════════════════════════════════

  createPromoCode(dto: CreatePromoCodeDto): PromoCode {
    const existing = Array.from(this.promoCodeStore.values()).find(p => p.code === dto.code);
    if (existing) throw new Error(`推广码已存在: ${dto.code}`);
    const id = `pc-${randomBytes(8).toString('hex')}`;
    const now = new Date();

    // 宪法13.5: 阶梯佣金计算
    const employeeOrders = this.employeeTrackings.get(dto.employeeId)?.length ?? 0;
    const commissionTier = this.computeCommissionTier(employeeOrders);

    const promoCode: PromoCode = {
      id,
      employeeId: dto.employeeId,
      code: dto.code,
      type: dto.type,
      commissionRate: this.getCommissionRate(commissionTier),
      commissionTier,
      createdAt: now,
      validUntil: new Date(dto.validUntil),
      usageLimit: dto.usageLimit,
      currentUsage: 0,
      isAdMarked: true, // 宪法13.8: 推广自带"广告"标识
    };
    this.promoCodeStore.set(id, promoCode);
    return promoCode;
  }

  listPromoCodes(employeeId?: string): PromoCode[] {
    const all = Array.from(this.promoCodeStore.values());
    return employeeId ? all.filter(p => p.employeeId === employeeId) : all;
  }

  getPromoCode(id: string): PromoCode | undefined { return this.promoCodeStore.get(id); }

  /** 宪法13.8: 推广追踪（扫码无感） */
  trackPromotion(dto: TrackPromotionDto): PromoTracking {
    const promoCode = this.promoCodeStore.get(dto.promoCodeId);
    if (!promoCode) throw new Error(`推广码不存在: ${dto.promoCodeId}`);
    if (promoCode.currentUsage >= promoCode.usageLimit) throw new Error(`推广码已达使用上限`);
    if (new Date() > promoCode.validUntil) throw new Error(`推广码已过期`);

    // 宪法13.8: 动态阶梯佣金
    promoCode.currentUsage += 1;
    const newTier = this.computeCommissionTier(promoCode.currentUsage);
    if (newTier > promoCode.commissionTier) {
      promoCode.commissionTier = newTier;
      promoCode.commissionRate = this.getCommissionRate(newTier);
    }
    this.promoCodeStore.set(dto.promoCodeId, promoCode);

    const id = `pt-${randomBytes(8).toString('hex')}`;
    const tracking: PromoTracking = {
      id,
      promoCodeId: dto.promoCodeId,
      customerId: dto.customerId,
      orderId: dto.orderId,
      referredUserId: dto.referredUserId,
      commission: dto.commission,
      status: 'pending',
      createdAt: new Date(),
      note: dto.note,
      isSeamless: true,          // 宪法13.8: 扫码无感
      customerOptedOut: false,   // 宪法13.8: 默认不退订
      customerUnbindable: true,  // 宪法13.8: 可解除
    };
    this.promoTrackingStore.set(id, tracking);

    const employeeId = promoCode.employeeId;
    const existing = this.employeeTrackings.get(employeeId) ?? [];
    existing.push(id);
    this.employeeTrackings.set(employeeId, existing);

    return tracking;
  }

  /** 宪法13.8: 被推广客户退订此员工推广 */
  customerOptOut(trackingId: string): PromoTracking | undefined {
    const t = this.promoTrackingStore.get(trackingId);
    if (!t) return undefined;
    t.customerOptedOut = true;
    this.promoTrackingStore.set(trackingId, t);
    return t;
  }

  /** 宪法13.8: 客户解除推广关系 */
  unbindCustomerTracking(trackingId: string): PromoTracking | undefined {
    const t = this.promoTrackingStore.get(trackingId);
    if (!t) return undefined;
    t.customerUnbindable = false;
    this.promoTrackingStore.set(trackingId, t);
    return t;
  }

  confirmTracking(id: string): PromoTracking | undefined {
    const tracking = this.promoTrackingStore.get(id);
    if (!tracking) return undefined;
    tracking.status = 'confirmed';
    tracking.confirmedAt = new Date();
    this.promoTrackingStore.set(id, tracking);
    return tracking;
  }

  cancelTracking(id: string): PromoTracking | undefined {
    const tracking = this.promoTrackingStore.get(id);
    if (!tracking) return undefined;
    tracking.status = 'cancelled';
    this.promoTrackingStore.set(id, tracking);
    return tracking;
  }

  getEmployeeStats(employeeId: string): EmployeePromoStats {
    const codes = Array.from(this.promoCodeStore.values()).filter(p => p.employeeId === employeeId);
    const trackingIds = this.employeeTrackings.get(employeeId) ?? [];
    const trackings = trackingIds.map(id => this.promoTrackingStore.get(id)).filter(Boolean) as PromoTracking[];

    const totalConversions = trackings.filter(t => t.status === 'confirmed').length;
    const totalCommission = trackings.reduce((sum: number, t: any) => sum + Number(t.commission), 0);
    const confirmedCommission = trackings.filter(t => t.status === 'confirmed').reduce((s, t) => s + t.commission, 0);
    const conversionRate = codes.length > 0 ? Number((totalConversions / codes.length).toFixed(4)) : 0;
    const rank = this.calculateRank(employeeId);

    // 巅峰休息期
    const peakRest = this.peakRestStore.get(employeeId);

    return {
      employeeId,
      totalPromoCodes: codes.length,
      totalClicks: codes.reduce((s, c) => s + c.currentUsage, 0),
      totalConversions,
      totalCommission,
      confirmedCommission,
      conversionRate,
      rank,
    };
  }

  private calculateRank(employeeId: string): number | undefined {
    const allEmployees = Array.from(this.employeeTrackings.keys());
    const statsList: Array<{ employeeId: string; commission: number }> = [];
    for (const empId of allEmployees) {
      const trackingIds = this.employeeTrackings.get(empId) ?? [];
      const commission = trackingIds
        .map(id => this.promoTrackingStore.get(id))
        .filter(Boolean)
        .reduce((s: number, t: PromoTracking) => s + t.commission, 0);
      statsList.push({ employeeId: empId, commission });
    }
    statsList.sort((a, b) => b.commission - a.commission);
    const idx = statsList.findIndex(s => s.employeeId === employeeId);
    return idx >= 0 ? idx + 1 : undefined;
  }

  // ══════════════════════════════════════════════════════════════
  // 排行榜（宪法13.7实时战况）
  // ══════════════════════════════════════════════════════════════

  getLeaderboard(limit?: number): LeaderboardEntry[] {
    const allEmployees = Array.from(this.employeeTrackings.keys());
    const entries: LeaderboardEntry[] = [];
    for (const employeeId of allEmployees) {
      const trackingIds = this.employeeTrackings.get(employeeId) ?? [];
      const trackings = trackingIds.map(id => this.promoTrackingStore.get(id)).filter(Boolean) as PromoTracking[];
      const totalConversions = trackings.filter(t => t.status === 'confirmed').length;
      const totalCommission = trackings.filter(t => t.status === 'confirmed').reduce((sum: number, t: any) => sum + Number(t.commission), 0);
      entries.push({ employeeId, totalConversions, totalCommission, rank: 0 });
    }
    entries.sort((a, b) => b.totalCommission - a.totalCommission);
    entries.forEach((e, i) => { e.rank = i + 1; });
    return limit ? entries.slice(0, limit) : entries;
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.5 · 成就徽章体系
  // ══════════════════════════════════════════════════════════════

  earnBadge(employeeId: string, badgeId: string, badgeName: string): AchievementBadge {
    const badge: AchievementBadge = {
      id: `badge-${randomBytes(8).toString('hex')}`,
      employeeId, badgeId, badgeName,
      earnedAt: new Date(),
    };
    this.badgeStore.set(badge.id, badge);
    return badge;
  }

  getBadges(employeeId: string): AchievementBadge[] {
    return Array.from(this.badgeStore.values()).filter(b => b.employeeId === employeeId);
  }

  /** 检查集齐特定徽章→自动进入储备干部池 */
  checkReservePool(employeeId: string): { qualified: boolean; missingBadges: string[] } {
    const owned = new Set(this.getBadges(employeeId).map(b => b.badgeId));
    const required = ['top_sales', 'team_leader', 'innovator', 'mentor'];
    const missing = required.filter(r => !owned.has(r));
    return { qualified: missing.length === 0, missingBadges: missing };
  }

  // ══════════════════════════════════════════════════════════════
  // KOL体系（WP-11增强）
  // ══════════════════════════════════════════════════════════════

  registerKol(dto: { name: string; level: KolLevel; followerCount: number; platforms: string[] }): KolProfile {
    const existing = Array.from(this.kolStore.values()).find(k => k.name === dto.name);
    if (existing) throw new Error(`KOL已存在: ${dto.name}`);
    const kol: KolProfile = {
      id: `kol-${randomBytes(8).toString('hex')}`,
      ...dto,
      status: 'pending',
      commissionRate: dto.level === 'S' ? 0.08 : dto.level === 'A' ? 0.06 : dto.level === 'B' ? 0.04 : 0.02,
      totalRevenue: 0,
      totalCommission: 0,
      roc: 0,
      createdAt: new Date(),
    };
    this.kolStore.set(kol.id, kol);
    return kol;
  }

  approveKol(id: string): KolProfile | undefined {
    const kol = this.kolStore.get(id);
    if (!kol) return undefined;
    kol.status = 'approved';
    this.kolStore.set(id, kol);
    return kol;
  }

  getKolLeaderboard(limit = 10): KolProfile[] {
    return Array.from(this.kolStore.values())
      .filter(k => k.status === 'approved')
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  // ══════════════════════════════════════════════════════════════
  // 宪法13.8 · 违规识别增强
  // ══════════════════════════════════════════════════════════════

  checkCompliance(employeeId?: string): ComplianceCheckResult {
    const suspiciousItems: string[] = [];
    let score = 0;
    const oneMinuteAgo = new Date(Date.now() - 60000);

    // 全系统检测
    const recentTrackings = Array.from(this.promoTrackingStore.values())
      .filter(t => t.createdAt >= oneMinuteAgo);
    if (recentTrackings.length > 100) {
      suspiciousItems.push('全系统检测到短时间内大量推广 (>100次/分钟)');
      score += 40;
    }

    if (employeeId) {
      const trackingIds = this.employeeTrackings.get(employeeId) ?? [];
      const employeeTrackings = trackingIds
        .map(id => this.promoTrackingStore.get(id))
        .filter(Boolean) as PromoTracking[];

      // 短期高频
      const recent = employeeTrackings.filter(t => t.createdAt >= oneMinuteAgo);
      if (recent.length > 10) {
        suspiciousItems.push(`员工 ${employeeId} 在 1 分钟内推广 ${recent.length} 次，疑似异常`);
        score += 30;
      }

      // pending比例过高
      const pendingCount = employeeTrackings.filter(t => t.status === 'pending').length;
      if (employeeTrackings.length > 0 && pendingCount / employeeTrackings.length > 0.9) {
        suspiciousItems.push(`推广待确认占比异常高 (${((pendingCount / employeeTrackings.length) * 100).toFixed(0)}%)`);
        score += 20;
      }

      // 推广客户留存率低（宪法新增检测）
      if (employeeTrackings.filter(t => t.status === 'confirmed').length > 0) {
        // 模拟留存检查（生产环境查客户复购记录）
        suspiciousItems.push('推广留存率检测已触发（生产环境需对接会员模块）');
        score += 5;
      }

      // KOL违规检测：同设备多账号
      const kolTrackings = employeeTrackings.filter(t =>
        t.customerId?.startsWith('kol_') || t.referredUserId?.startsWith('kol_'));
      if (kolTrackings.length > 3) {
        suspiciousItems.push(`KOL关联推广 ${kolTrackings.length} 次，需人工审核真实性`);
        score += 15;
      }
    }

    // 同客户重复推广检查（宪法13.8可解除关系反向验证）
        const customerIdMap = new Map<string, number>();
    const allTrackings = Array.from(this.promoTrackingStore.values());
    for (const t of allTrackings) {
      const key = t.customerId ?? t.referredUserId ?? '';
      if (key) {
        customerIdMap.set(key, (customerIdMap.get(key) ?? 0) + 1);
      }
    }
    const duplicateCids = Array.from(customerIdMap.entries()).filter(([, count]) => count > 1).map(([id]) => id);
    if (duplicateCids.length > 3) {
      suspiciousItems.push(`检测到 ${duplicateCids.length} 个重复推广客户（建议客户解除关系功能）`);
      score += 20;
    }

    const riskLevel = score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low';
    return { riskLevel, suspiciousItems, score: Math.min(score, 100) };
  }
}
