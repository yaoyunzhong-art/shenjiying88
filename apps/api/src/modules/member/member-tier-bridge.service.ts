/**
 * MemberTierBridgeService — member ↔ member-level 桥接服务
 *
 * 当会员成长值发生变化时，调用 MemberLevelService 进行 6 阶 18 级评估，
 * 并将结果同步到 MemberProfile。
 *
 * BS-0114/BS-0115 门禁级功能
 *
 * @emits MemberLevelUpgradeEvent — 等级升级时触发
 * @see MemberLevelService
 * @see MemberLevelUpgradeEvent
 */

import { Injectable, Optional, Inject, Logger } from '@nestjs/common'
import { MemberLevelService } from '../member-level/member-level.service'
import type { LevelEvaluationInput, LevelInfo, MemberLevelKey } from '../member-level/member-level.entity'
import {
  resolveBenefits,
  type MemberBenefitResolution,
} from '../member-level/member-level-benefit'
import type {
  MemberLevelUpgradeEvent,
} from '../member-level/member-level-upgrade.event'
import { MemberLevelTier, MemberLevelSub } from '../member-level/member-level.entity'
import type { MemberProfile } from './member.entity'

/**
 * 会员等级桥接结果（附加在 MemberProfile 上的 6 阶 18 级信息）
 */
export interface TierBridgeResult {
  /** 6 阶 18 级等级 KEY（如 REGULAR_L1） */
  memberLevelKey: MemberLevelKey
  /** 等级 tier */
  memberTier: MemberLevelTier
  /** 等级子级 */
  memberSub: MemberLevelSub
  /** 权益列表 */
  benefits: string[]
  /** 权益决议结果 */
  benefitResolution: MemberBenefitResolution
  /** 是否升级 */
  upgraded: boolean
  /** 评估时间 */
  evaluatedAt: string
  /** 升级事件（仅 upgraded=true 时非空） */
  upgradeEvent?: MemberLevelUpgradeEvent
}

@Injectable()
export class MemberTierBridgeService {
  private readonly logger = new Logger(MemberTierBridgeService.name)

  constructor(
    @Inject(MemberLevelService)
    private readonly memberLevelService: MemberLevelService
  ) {}

  /**
   * 根据会员档案评估 6 阶 18 级
   *
   * @param profile 当前会员档案
   * @param previousLevelKey 之前记录的等级 KEY（用于判断是否升级）
   * @returns 桥接结果
   */
  evaluateMemberTier(
    profile: MemberProfile,
    previousLevelKey?: MemberLevelKey
  ): TierBridgeResult {
    const input: LevelEvaluationInput = {
      memberId: profile.memberId,
      growthValue: profile.growthValue ?? profile.points,
      totalSpend: profile.lastPaymentAmount ?? 0,
      totalVisits: 0, // 无到访次数统计时默认 0
      tenantId: profile.tenantContext.tenantId
    }

    const result: LevelInfo = this.memberLevelService.evaluateMemberLevel(input)

    const benefitResolution = resolveBenefits(result)

    let upgradeEvent: MemberLevelUpgradeEvent | undefined

    if (previousLevelKey && result.upgraded && result.currentLevelKey !== previousLevelKey) {
      upgradeEvent = this.buildUpgradeEvent(profile, previousLevelKey, result)
      this.logger.log(
        `Member ${profile.memberId} upgraded: ${previousLevelKey} → ${result.currentLevelKey}`
      )
    }

    return {
      memberLevelKey: result.currentLevelKey,
      memberTier: result.currentTier,
      memberSub: result.currentSub,
      benefits: result.benefits,
      benefitResolution,
      upgraded: result.upgraded,
      evaluatedAt: result.evaluatedAt,
      upgradeEvent
    }
  }

  /**
   * 构建升级事件
   */
  private buildUpgradeEvent(
    profile: MemberProfile,
    fromLevelKey: MemberLevelKey,
    result: LevelInfo
  ): MemberLevelUpgradeEvent {
    const fromTier = fromLevelKey.split('_')[0] as MemberLevelTier
    const fromSub = fromLevelKey.split('_')[1] as MemberLevelSub
    const oldBenefits: string[] = []

    // 获取旧等级的权益
    const config = this.memberLevelService.getAllLevelConfig()
    const fromConfig = config.tiers.find(
      t => t.tier === fromTier && t.label.endsWith(fromSub)
    )
    if (fromConfig) {
      oldBenefits.push(...fromConfig.benefits)
    }

    const newBenefits = result.benefits.filter(b => !oldBenefits.includes(b))

    return {
      eventType: 'member-level.upgraded',
      timestamp: result.evaluatedAt,
      memberId: profile.memberId,
      tenantId: profile.tenantContext.tenantId,
      fromLevelKey,
      toLevelKey: result.currentLevelKey,
      fromTier,
      toTier: result.currentTier,
      growthValue: result.growthValue,
      totalSpend: result.totalSpend,
      totalVisits: result.totalVisits,
      newBenefits,
      reason: `成长值 ${result.growthValue} / 消费 ¥${result.totalSpend} / 到访 ${result.totalVisits} 达到 ${result.currentLevelKey} 门槛`
    }
  }
}
