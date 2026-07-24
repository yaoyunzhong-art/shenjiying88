import { Inject, Injectable, Optional, Logger } from '@nestjs/common'
import { EVENT_BUS_SERVICE, type EventBusService } from '../../infrastructure/event-bus/event-bus.module'
import type { MemberLevelUpgradeEvent } from './member-level-upgrade.event'
import {
  MemberLevelTier,
  MemberLevelSub,
  type MemberLevelKey,
  type LevelInfo,
  type LevelEvaluationInput,
  type LevelThreshold,
  type BatchLevelInput,
  type BatchLevelOutput,
  type LevelChangeRecord,
  type LevelConfig,
  type AllLevelConfig
} from './member-level.entity'

/**
 * 6阶18级等级阈值配置
 * REGULAR < VIP < SVIP < DIAMOND < LEGEND < MYTH
 * 每阶各 L1/L2/L3
 */
const LEVEL_THRESHOLDS: LevelThreshold[] = [
  // REGULAR 阶
  { tier: MemberLevelTier.REGULAR, sub: MemberLevelSub.L1, requiredGrowth: 0, requiredSpend: 0, requiredVisits: 0, benefits: ['基础会员权益', '每月签到积分'] },
  { tier: MemberLevelTier.REGULAR, sub: MemberLevelSub.L2, requiredGrowth: 100, requiredSpend: 200, requiredVisits: 2, benefits: ['基础会员权益', '签到积分加倍'] },
  { tier: MemberLevelTier.REGULAR, sub: MemberLevelSub.L3, requiredGrowth: 300, requiredSpend: 500, requiredVisits: 5, benefits: ['基础会员权益', '生日优惠券'] },
  // VIP 阶
  { tier: MemberLevelTier.VIP, sub: MemberLevelSub.L1, requiredGrowth: 800, requiredSpend: 1000, requiredVisits: 10, benefits: ['VIP专享折扣9.5折', '生日双倍积分'] },
  { tier: MemberLevelTier.VIP, sub: MemberLevelSub.L2, requiredGrowth: 1500, requiredSpend: 3000, requiredVisits: 20, benefits: ['VIP折扣9折', '生日优惠券', '优先排队'] },
  { tier: MemberLevelTier.VIP, sub: MemberLevelSub.L3, requiredGrowth: 2500, requiredSpend: 5000, requiredVisits: 30, benefits: ['VIP折扣8.8折', '生日礼包', '免费饮品券'] },
  // SVIP 阶
  { tier: MemberLevelTier.SVIP, sub: MemberLevelSub.L1, requiredGrowth: 4000, requiredSpend: 10000, requiredVisits: 50, benefits: ['SVIP折扣8.5折', '生日大礼包', '专属客服'] },
  { tier: MemberLevelTier.SVIP, sub: MemberLevelSub.L2, requiredGrowth: 6000, requiredSpend: 20000, requiredVisits: 80, benefits: ['SVIP折扣8折', '季度礼包', '专属客服', '免排队'] },
  { tier: MemberLevelTier.SVIP, sub: MemberLevelSub.L3, requiredGrowth: 9000, requiredSpend: 35000, requiredVisits: 120, benefits: ['SVIP折扣7.8折', '双月礼包', '24H客服', '包厢优先'] },
  // DIAMOND 阶
  { tier: MemberLevelTier.DIAMOND, sub: MemberLevelSub.L1, requiredGrowth: 14000, requiredSpend: 50000, requiredVisits: 180, benefits: ['钻石折扣7.5折', '每月礼包', '专属管家', '无限免排'] },
  { tier: MemberLevelTier.DIAMOND, sub: MemberLevelSub.L2, requiredGrowth: 20000, requiredSpend: 80000, requiredVisits: 250, benefits: ['钻石折扣7折', '双月超级礼包', '专属管家', '活动优先参与'] },
  { tier: MemberLevelTier.DIAMOND, sub: MemberLevelSub.L3, requiredGrowth: 28000, requiredSpend: 120000, requiredVisits: 350, benefits: ['钻石折扣6.8折', '季度超级礼包', '黑卡管家', '私人活动邀请'] },
  // LEGEND 阶
  { tier: MemberLevelTier.LEGEND, sub: MemberLevelSub.L1, requiredGrowth: 40000, requiredSpend: 200000, requiredVisits: 500, benefits: ['传奇折扣6折', '季度尊享礼包', '传奇管家', 'VIP活动VIP席'] },
  { tier: MemberLevelTier.LEGEND, sub: MemberLevelSub.L2, requiredGrowth: 55000, requiredSpend: 350000, requiredVisits: 700, benefits: ['传奇折扣5.5折', '双月传奇礼包', '传奇管家', '免费旅游名额'] },
  { tier: MemberLevelTier.LEGEND, sub: MemberLevelSub.L3, requiredGrowth: 75000, requiredSpend: 500000, requiredVisits: 1000, benefits: ['传奇折扣5折', '月度传奇礼包', '传奇管家', '年度盛典VIP席位'] },
  // MYTH 阶
  { tier: MemberLevelTier.MYTH, sub: MemberLevelSub.L1, requiredGrowth: 100000, requiredSpend: 800000, requiredVisits: 1500, benefits: ['神话折扣4.5折', '神话礼盒', '神话管家团队', '全球VIP活动入场券'] },
  { tier: MemberLevelTier.MYTH, sub: MemberLevelSub.L2, requiredGrowth: 150000, requiredSpend: 1200000, requiredVisits: 2000, benefits: ['神话折扣4折', '神话大礼盒', '神话管家团队', '品牌联名限量品'] },
  { tier: MemberLevelTier.MYTH, sub: MemberLevelSub.L3, requiredGrowth: 250000, requiredSpend: 2000000, requiredVisits: 3000, benefits: ['神话折扣3.8折', '神话至尊礼盒', '专享CEO接待', '合伙人级权益'] }
]

@Injectable()
export class MemberLevelService {
  private readonly logger = new Logger(MemberLevelService.name)

  constructor(
    @Optional() @Inject(EVENT_BUS_SERVICE) private readonly eventBus?: EventBusService
  ) {}

  /**
   * 根据成长值计算会员等级
   */
  async calculateLevel(growthValue: number): Promise<LevelInfo> {
    return this.evaluateMemberLevel({
      memberId: 'system',
      growthValue,
      totalSpend: growthValue * 10,  // 简化映射
      totalVisits: Math.floor(growthValue / 50),
      tenantId: 'system'
    })
  }

  /**
   * 评估成员等级
   */
  evaluate(input: LevelEvaluationInput): LevelInfo {
    return this.evaluateMemberLevel(input)
  }

  /**
   * 评估成员等级（核心方法）
   * 规则：取满足所有条件的最高等级
   * BS-0114: 升级后发射 MemberLevelUpgradeEvent
   */
  evaluateMemberLevel(input: LevelEvaluationInput, previousLevelKey?: MemberLevelKey): LevelInfo {
    const { memberId, growthValue, totalSpend, totalVisits, tenantId } = input

    // 从高到低遍历，找到第一个满足所有条件的等级
    let matchedLevel: LevelThreshold | null = null

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      const threshold = LEVEL_THRESHOLDS[i]
      if (
        growthValue >= threshold.requiredGrowth &&
        totalSpend >= threshold.requiredSpend &&
        totalVisits >= threshold.requiredVisits
      ) {
        matchedLevel = threshold
        break
      }
    }

    // 默认 REGULAR_L1
    if (!matchedLevel) {
      matchedLevel = LEVEL_THRESHOLDS[0]
    }

    const baseThresholdIndex = this.getThresholdIndex(matchedLevel)

    // 计算下一级阈值
    const nextThreshold = baseThresholdIndex < LEVEL_THRESHOLDS.length - 1
      ? LEVEL_THRESHOLDS[baseThresholdIndex + 1]
      : undefined

    // 计算升级进度
    const upgradeProgress = this.calculateUpgradeProgress(input, matchedLevel, nextThreshold)

    // 检查是否升级
    const isBaseLevel = matchedLevel.sub === MemberLevelSub.L1 &&
      matchedLevel.tier === MemberLevelTier.REGULAR &&
      growthValue === 0

    const currentLevelKey = `${matchedLevel.tier}_${matchedLevel.sub}` as MemberLevelKey
    const evaluatedAt = new Date().toISOString()

    const result: LevelInfo = {
      memberId,
      currentTier: matchedLevel.tier,
      currentSub: matchedLevel.sub,
      currentLevelKey,
      growthValue,
      totalSpend,
      totalVisits,
      nextLevelThreshold: nextThreshold,
      upgradeProgress,
      benefits: matchedLevel.benefits,
      evaluatedAt,
      upgraded: !isBaseLevel
    }

    // BS-0114: 当等级发生实际变化时发射升级事件
    if (previousLevelKey && currentLevelKey !== previousLevelKey) {
      const event: MemberLevelUpgradeEvent = {
        eventType: 'member-level.upgraded',
        timestamp: evaluatedAt,
        memberId,
        tenantId,
        fromLevelKey: previousLevelKey,
        toLevelKey: currentLevelKey,
        fromTier: previousLevelKey.split('_')[0] as MemberLevelTier,
        toTier: matchedLevel.tier,
        growthValue,
        totalSpend,
        totalVisits,
        newBenefits: matchedLevel.benefits,
        reason: `成长值 ${growthValue} / 消费 ¥${totalSpend} / 到访 ${totalVisits} 达到 ${currentLevelKey} 门槛`
      }

      this.eventBus?.publish('member-level.upgraded', event).catch((err: Error) => {
        this.logger.error(`Failed to emit upgrade event for ${memberId}: ${err.message}`)
      })
    }

    return result
  }

  /**
   * 批量评估
   */
  batchEvaluate(input: BatchLevelInput): BatchLevelOutput {
    const results = input.items.map(item => this.evaluateMemberLevel(item))
    const upgradedCount = results.filter(r => r.upgraded).length

    return {
      items: results,
      totalEvaluated: results.length,
      upgradedCount,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 获取全量等级配置
   */
  getAllLevelConfig(): AllLevelConfig {
    return {
      tiers: LEVEL_THRESHOLDS.map(t => ({
        tier: t.tier,
        label: `${t.tier} ${t.sub}`,
        growthRequired: t.requiredGrowth,
        spendRequired: t.requiredSpend,
        visitRequired: t.requiredVisits,
        benefits: t.benefits
      })),
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * 获取某等级变更到目标等级的路径
   */
  getUpgradePath(currentTier: MemberLevelTier, currentSub: MemberLevelSub, targetTier: MemberLevelTier, targetSub: MemberLevelSub): LevelChangeRecord[] {
    const path: LevelChangeRecord[] = []
    const allKeys = LEVEL_THRESHOLDS.filter(t =>
      (t.tier === MemberLevelTier[currentTier] && t.sub === MemberLevelSub[currentSub]) ||
      this.getThresholdIndex(t) > this.getThresholdIndex(
        LEVEL_THRESHOLDS.find(t2 => t2.tier === currentTier && t2.sub === currentSub)!
      )
    )

    for (const level of allKeys) {
      const idx = this.getThresholdIndex(level)
      const nextIdx = idx + 1
      if (nextIdx < LEVEL_THRESHOLDS.length) {
        const next = LEVEL_THRESHOLDS[nextIdx]
        path.push({
          memberId: 'calculated',
          fromTier: level.tier,
          fromSub: level.sub,
          toTier: next.tier,
          toSub: next.sub,
          reason: `满足 ${next.requiredGrowth} 成长值 / ¥${next.requiredSpend} 消费 / ${next.requiredVisits} 到访`,
          changedAt: new Date().toISOString()
        })
      }
    }

    return path
  }

  /**
   * 计算升级进度
   */
  private calculateUpgradeProgress(
    input: LevelEvaluationInput,
    current: LevelThreshold,
    next?: LevelThreshold
  ): number {
    if (!next) return 1.0 // 已是最高等级

    // 取三个维度中进度最慢的
    const growthProgress = Math.min(1, (input.growthValue - current.requiredGrowth) / Math.max(1, next.requiredGrowth - current.requiredGrowth))
    const spendProgress = Math.min(1, (input.totalSpend - current.requiredSpend) / Math.max(1, next.requiredSpend - current.requiredSpend))
    const visitProgress = Math.min(1, (input.totalVisits - current.requiredVisits) / Math.max(1, next.requiredVisits - current.requiredVisits))

    return Math.min(growthProgress, spendProgress, visitProgress, 1.0)
  }

  /**
   * 获取阈值在列表中的索引
   */
  private getThresholdIndex(threshold: LevelThreshold): number {
    return LEVEL_THRESHOLDS.findIndex(
      t => t.tier === threshold.tier && t.sub === threshold.sub
    )
  }
}

export { LEVEL_THRESHOLDS }
