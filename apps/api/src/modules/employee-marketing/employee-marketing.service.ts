// employee-marketing.service.ts · WP-11 全员营销与绩效
// 日期: 2026-07-23
// 状态: IMPLEMENTED
// 核心能力: 推广码管理 / 推广追踪 / KPI 配置与考核 / 排行榜 / 违规识别 / 任务管理

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

  // 内存存储（生产应接数据库）
  private readonly promoCodeStore = new Map<string, PromoCode>();
  private readonly promoTrackingStore = new Map<string, PromoTracking>();
  private readonly kpiConfigStore = new Map<string, KpiConfig>();
  private readonly kpiResultStore = new Map<string, KpiResult>();
  private readonly taskStore = new Map<string, MarketingTask>();
  // employeeId -> promoTrackingId[]
  private readonly employeeTrackings = new Map<string, string[]>();

  /** 测试辅助：清空全部存储 */
  reset(): void {
    this.promoCodeStore.clear();
    this.promoTrackingStore.clear();
    this.kpiConfigStore.clear();
    this.kpiResultStore.clear();
    this.taskStore.clear();
    this.employeeTrackings.clear();
  }

  // ═════════════════════════════════════════════════════════════
  // 推广码管理
  // ═════════════════════════════════════════════════════════════

  createPromoCode(dto: CreatePromoCodeDto): PromoCode {
    const existing = Array.from(this.promoCodeStore.values()).find(
      p => p.code === dto.code,
    );
    if (existing) {
      throw new Error(`推广码已存在: ${dto.code}`);
    }
    const id = `pc-${randomBytes(8).toString('hex')}`;
    const now = new Date();
    const promoCode: PromoCode = {
      id,
      employeeId: dto.employeeId,
      code: dto.code,
      type: dto.type,
      commissionRate: dto.commissionRate,
      createdAt: now,
      validUntil: new Date(dto.validUntil),
      usageLimit: dto.usageLimit,
      currentUsage: 0,
    };
    this.promoCodeStore.set(id, promoCode);
    this.logger.log(`创建推广码: ${dto.code} (员工: ${dto.employeeId})`);
    return promoCode;
  }

  listPromoCodes(employeeId?: string): PromoCode[] {
    const all = Array.from(this.promoCodeStore.values());
    if (employeeId) {
      return all.filter(p => p.employeeId === employeeId);
    }
    return all;
  }

  getPromoCode(id: string): PromoCode | undefined {
    return this.promoCodeStore.get(id);
  }

  // ═════════════════════════════════════════════════════════════
  // 推广追踪
  // ═════════════════════════════════════════════════════════════

  trackPromotion(dto: TrackPromotionDto): PromoTracking {
    const promoCode = this.promoCodeStore.get(dto.promoCodeId);
    if (!promoCode) {
      throw new Error(`推广码不存在: ${dto.promoCodeId}`);
    }
    if (promoCode.currentUsage >= promoCode.usageLimit) {
      throw new Error(`推广码已达使用上限: ${promoCode.code}`);
    }
    if (new Date() > promoCode.validUntil) {
      throw new Error(`推广码已过期: ${promoCode.code}`);
    }

    // 增加使用计数
    promoCode.currentUsage += 1;
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
    };
    this.promoTrackingStore.set(id, tracking);

    // 关联到员工
    const employeeId = promoCode.employeeId;
    const existing = this.employeeTrackings.get(employeeId) ?? [];
    existing.push(id);
    this.employeeTrackings.set(employeeId, existing);

    this.logger.log(`推广追踪: ${id} (码: ${promoCode.code}, 佣金: ${dto.commission})`);
    return tracking;
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

  // ═════════════════════════════════════════════════════════════
  // 员工推广统计
  // ═════════════════════════════════════════════════════════════

  getEmployeeStats(employeeId: string): EmployeePromoStats {
    const codes = Array.from(this.promoCodeStore.values()).filter(
      p => p.employeeId === employeeId,
    );
    const trackingIds = this.employeeTrackings.get(employeeId) ?? [];
    const trackings = trackingIds
      .map(id => this.promoTrackingStore.get(id))
      .filter((t): t is PromoTracking => t !== undefined);

    const totalConversions = trackings.filter(
      t => t.status === 'confirmed',
    ).length;
    const totalCommission = trackings.reduce((s, t) => s + t.commission, 0);
    const confirmedCommission = trackings
      .filter(t => t.status === 'confirmed')
      .reduce((s, t) => s + t.commission, 0);

    const conversionRate =
      codes.length > 0
        ? Number((totalConversions / codes.length).toFixed(4))
        : 0;

    // 计算排名
    const rank = this.calculateRank(employeeId);

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
    // 按佣金总额排序
    const allEmployees = new Set(
      Array.from(this.employeeTrackings.keys()),
    );
    const statsList: Array<{ employeeId: string; commission: number }> = [];
    for (const empId of allEmployees) {
      const trackingIds = this.employeeTrackings.get(empId) ?? [];
      const commission = trackingIds
        .map(id => this.promoTrackingStore.get(id))
        .filter((t): t is PromoTracking => t !== undefined)
        .reduce((s, t) => s + t.commission, 0);
      statsList.push({ employeeId: empId, commission });
    }
    statsList.sort((a, b) => b.commission - a.commission);
    const idx = statsList.findIndex(s => s.employeeId === employeeId);
    return idx >= 0 ? idx + 1 : undefined;
  }

  // ═════════════════════════════════════════════════════════════
  // KPI 配置
  // ═════════════════════════════════════════════════════════════

  createKpiConfig(dto: CreateKpiConfigDto): KpiConfig {
    if (dto.weight < 0 || dto.weight > 1) {
      throw new Error('权重必须为 0~1');
    }
    const id = `kpi-${randomBytes(8).toString('hex')}`;
    const config: KpiConfig = {
      id,
      positionType: dto.positionType,
      metricName: dto.metricName,
      target: dto.target,
      weight: dto.weight,
      unit: dto.unit,
      period: dto.period,
    };
    this.kpiConfigStore.set(id, config);
    this.logger.log(`创建 KPI 配置: ${dto.positionType} / ${dto.metricName}`);
    return config;
  }

  listKpiConfigs(positionType?: string): KpiConfig[] {
    const all = Array.from(this.kpiConfigStore.values());
    if (positionType) {
      return all.filter(c => c.positionType === positionType);
    }
    return all;
  }

  // ═════════════════════════════════════════════════════════════
  // 绩效结果
  // ═════════════════════════════════════════════════════════════

  submitKpiResult(dto: SubmitKpiResultDto): KpiResult {
    // 验证评分字段
    const configs = Array.from(this.kpiConfigStore.values());
    for (const key of Object.keys(dto.scores)) {
      if (!configs.some(c => c.metricName === key)) {
        throw new Error(`未知 KPI 指标: ${key}`);
      }
    }

    const id = `kr-${randomBytes(8).toString('hex')}`;
    // 计算总分（加权）
    let totalScore = 0;
    for (const config of configs) {
      const score = dto.scores[config.metricName] ?? 0;
      totalScore += score * config.weight;
    }
    totalScore = Number(totalScore.toFixed(2));

    // 简单奖金计算：每分 = 50 元
    const bonusAmount = totalScore * 50;

    const result: KpiResult = {
      id,
      employeeId: dto.employeeId,
      period: dto.period,
      scores: dto.scores,
      totalScore,
      bonusAmount,
      createdAt: new Date(),
    };
    this.kpiResultStore.set(id, result);
    this.logger.log(`提交绩效: ${dto.employeeId} / ${dto.period} / ${totalScore}分`);
    return result;
  }

  getKpiResults(employeeId: string): KpiResult[] {
    return Array.from(this.kpiResultStore.values()).filter(
      r => r.employeeId === employeeId,
    );
  }

  // ═════════════════════════════════════════════════════════════
  // 排行榜
  // ═════════════════════════════════════════════════════════════

  getLeaderboard(limit?: number): LeaderboardEntry[] {
    const allEmployees = new Set(
      Array.from(this.employeeTrackings.keys()),
    );
    const entries: LeaderboardEntry[] = [];

    for (const employeeId of allEmployees) {
      const trackingIds = this.employeeTrackings.get(employeeId) ?? [];
      const trackings = trackingIds
        .map(id => this.promoTrackingStore.get(id))
        .filter((t): t is PromoTracking => t !== undefined);
      const totalConversions = trackings.filter(
        t => t.status === 'confirmed',
      ).length;
      const totalCommission = trackings
        .filter(t => t.status === 'confirmed')
        .reduce((s, t) => s + t.commission, 0);

      entries.push({ employeeId, totalConversions, totalCommission, rank: 0 });
    }

    // 按佣金降序排序
    entries.sort((a, b) => b.totalCommission - a.totalCommission);
    entries.forEach((e, i) => { e.rank = i + 1; });

    return limit ? entries.slice(0, limit) : entries;
  }

  // ═════════════════════════════════════════════════════════════
  // 营销任务
  // ═════════════════════════════════════════════════════════════

  createTask(dto: CreateTaskDto): MarketingTask {
    if (dto.assignedTo.length === 0) {
      throw new Error('任务必须指定至少一个员工');
    }
    const id = `task-${randomBytes(8).toString('hex')}`;
    const task: MarketingTask = {
      id,
      title: dto.title,
      description: dto.description,
      points: dto.points,
      deadline: new Date(dto.deadline),
      status: 'active',
      assignedTo: dto.assignedTo,
      createdAt: new Date(),
    };
    this.taskStore.set(id, task);
    this.logger.log(`创建任务: ${dto.title} (${dto.assignedTo.length}人)`);
    return task;
  }

  getEmployeeTasks(employeeId: string): MarketingTask[] {
    return Array.from(this.taskStore.values()).filter(
      t => t.assignedTo.includes(employeeId),
    );
  }

  completeTask(id: string): MarketingTask | undefined {
    const task = this.taskStore.get(id);
    if (!task) return undefined;
    task.status = 'completed';
    this.taskStore.set(id, task);
    return task;
  }

  expireTask(id: string): MarketingTask | undefined {
    const task = this.taskStore.get(id);
    if (!task) return undefined;
    task.status = 'expired';
    this.taskStore.set(id, task);
    return task;
  }

  // ═════════════════════════════════════════════════════════════
  // 违规检测
  // ═════════════════════════════════════════════════════════════

  checkCompliance(employeeId?: string): ComplianceCheckResult {
    const suspiciousItems: string[] = [];
    let score = 0;

    // 1. 检测短期内大量推广（1 分钟 > 10 次视为异常）
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentTrackings = Array.from(this.promoTrackingStore.values()).filter(
      t => t.createdAt >= oneMinuteAgo,
    );

    if (recentTrackings.length > 100) {
      suspiciousItems.push('全系统检测到短时间内大量推广 (>100次/分钟)');
      score += 40;
    }

    // 如果指定了员工，检查该员工的异常
    if (employeeId) {
      const trackingIds = this.employeeTrackings.get(employeeId) ?? [];
      const employeeTrackings = trackingIds
        .map(id => this.promoTrackingStore.get(id))
        .filter((t): t is PromoTracking => t !== undefined);

      // 短期高频推广
      const recentEmployee = employeeTrackings.filter(
        t => t.createdAt >= oneMinuteAgo,
      );
      if (recentEmployee.length > 10) {
        suspiciousItems.push(`员工 ${employeeId} 在 1 分钟内推广 ${recentEmployee.length} 次，疑似异常`);
        score += 30;
      }

      // 异常高频转化（pending 状态比例过高）
      const pendingCount = employeeTrackings.filter(
        t => t.status === 'pending',
      ).length;
      if (employeeTrackings.length > 0 && pendingCount / employeeTrackings.length > 0.9) {
        suspiciousItems.push(`员工 ${employeeId} 推广转化异常率高 (${((pendingCount / employeeTrackings.length) * 100).toFixed(0)}% 待确认)`);
        score += 20;
      }
    }

    // 检测同设备多账号（根据 referredUserId 去重）
    const allCustomerIds = new Set<string>();
    const duplicateCustomerIds: string[] = [];
    for (const t of this.promoTrackingStore.values()) {
      const key = t.customerId ?? t.referredUserId ?? '';
      if (key) {
        if (allCustomerIds.has(key)) {
          duplicateCustomerIds.push(key);
        }
        allCustomerIds.add(key);
      }
    }
    if (duplicateCustomerIds.length > 3) {
      suspiciousItems.push(`检测到 ${duplicateCustomerIds.length} 个重复客户被推广`);
      score += 20;
    }

    // 确定风险等级
    let riskLevel: 'high' | 'medium' | 'low';
    if (score >= 50) {
      riskLevel = 'high';
    } else if (score >= 20) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return { riskLevel, suspiciousItems, score: Math.min(score, 100) };
  }
}
