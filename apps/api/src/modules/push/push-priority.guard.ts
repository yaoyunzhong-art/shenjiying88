/**
 * push-priority.guard.ts — 推送分级守卫
 *
 * WP-13A: 推送分级 (P0~P3) 执行逻辑
 * BS-0168 ~ BS-0184
 *
 * 功能:
 * - P0: 强制推送，不经过任何过滤
 * - P1: 检查 DND，频控
 * - P2: 检查 DND，频控，用户偏好
 * - P3: 检查 DND，频控，用户偏好，检查「一键关闭」配置
 */

import { Injectable, Logger } from '@nestjs/common'
import {
  PushBusinessPriority,
  isPushPriorityMandatory,
  PUSH_MARKETING_SETTING_KEY,
} from './push-priority.enum'
import { DndConfigService, FrequencyCapService } from './dnd-config'

export interface PushGuardResult {
  /** 是否允许推送 */
  allowed: boolean
  /** 拒绝原因 */
  reason?: string
  /** 免打扰拦截 */
  blockedByDnd?: boolean
  /** 频控拦截 */
  blockedByFrequencyCap?: boolean
  /** 用户偏好拦截 */
  blockedByPreference?: boolean
}

@Injectable()
export class PushPriorityGuard {
  private readonly logger = new Logger(PushPriorityGuard.name)

  constructor(
    private readonly dndConfig: DndConfigService,
    private readonly frequencyCap: FrequencyCapService,
  ) {}

  /**
   * 检查推送是否应被执行
   *
   * @param priority 推送分级
   * @param tenantId 租户 ID
   * @param memberId 会员 ID (可为空, 用于频控)
   * @param userSettings 用户偏好设置 (P3 检查 push_marketing_enabled)
   */
  check(
    priority: PushBusinessPriority,
    tenantId: string,
    memberId?: string,
    userSettings?: Record<string, unknown>,
  ): PushGuardResult {
    const isMandatory = isPushPriorityMandatory(priority)

    // P0: 强制推送，不经过任何过滤
    if (isMandatory) {
      this.logger.debug(`[PriorityGuard] P0 push allowed (mandatory): tenant=${tenantId}`)
      return { allowed: true }
    }

    // DND 检查
    const dndAllowed = this.dndConfig.shouldAllow(tenantId, isMandatory)
    if (!dndAllowed) {
      this.logger.debug(
        `[PriorityGuard] Blocked by DND: priority=${priority} tenant=${tenantId}`
      )
      return { allowed: false, reason: 'DND hours', blockedByDnd: true }
    }

    // 频控检查
    if (memberId) {
      const capState = this.frequencyCap.checkAndIncrement(tenantId, memberId)
      if (capState.exceeded) {
        this.logger.debug(
          `[PriorityGuard] Blocked by frequency cap: priority=${priority} tenant=${tenantId} member=${memberId}`
        )
        return {
          allowed: false,
          reason: 'Frequency cap exceeded',
          blockedByFrequencyCap: true,
        }
      }
    }

    // P3 一键关闭检查
    if (priority === PushBusinessPriority.P3) {
      const marketingEnabled = userSettings?.[PUSH_MARKETING_SETTING_KEY]
      if (marketingEnabled === false || marketingEnabled === 'false') {
        this.logger.debug(
          `[PriorityGuard] Blocked by P3 marketing preference: tenant=${tenantId} member=${memberId}`
        )
        return {
          allowed: false,
          reason: 'P3 marketing push disabled by user preference',
          blockedByPreference: true,
        }
      }
    }

    return { allowed: true }
  }
}
