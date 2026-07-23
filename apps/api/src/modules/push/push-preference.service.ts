/**
 * push-preference.service.ts — 用户推送偏好服务
 *
 * WP-13B: C端便捷化 (BS-0164~BS-0167)
 *
 * 功能:
 * - 用户级免打扰时段 (覆盖/继承租户级)
 * - 推送类型开启/关闭
 * - 一键关闭 P3 营销推送
 * - 通道偏好设置
 */

import { Injectable, Logger } from '@nestjs/common'
import { PushBusinessPriority } from './push-priority.enum'
import type { PushUserPreference } from './push-preference.entity'
import { DEFAULT_USER_PUSH_PREFERENCE } from './push-preference.entity'

/**
 * In-memory 用户偏好存储
 * 生产环境应使用 Redis / DB 持久化
 */
const userPreferenceStore = new Map<string, PushUserPreference>()

export function resetPushPreferenceTestState(): void {
  userPreferenceStore.clear()
}

@Injectable()
export class PushPreferenceService {
  private readonly logger = new Logger(PushPreferenceService.name)

  /**
   * 获取用户推送偏好
   * 若无配置则返回默认值
   */
  getPreference(memberId: string, tenantId: string): PushUserPreference {
    const key = `${tenantId}:${memberId}`
    return userPreferenceStore.get(key) ?? this.createDefault(memberId, tenantId)
  }

  /**
   * 设置用户推送偏好 (全量覆盖)
   */
  setPreference(
    memberId: string,
    tenantId: string,
    patch: Partial<Omit<PushUserPreference, 'memberId' | 'tenantId' | 'createdAt'>>
  ): PushUserPreference {
    const key = `${tenantId}:${memberId}`
    const existing = this.getPreference(memberId, tenantId)
    const updated: PushUserPreference = {
      ...existing,
      ...patch,
      memberId,
      tenantId,
      updatedAt: new Date().toISOString(),
    }
    userPreferenceStore.set(key, updated)
    this.logger.log(`[Preference] Updated for member=${memberId} tenant=${tenantId}`)
    return updated
  }

  /**
   * 一键关闭 P3 营销推送
   * BS-0167: 用户可一键关闭所有 P3 营销推送
   */
  disableMarketingPush(memberId: string, tenantId: string): PushUserPreference {
    return this.setPreference(memberId, tenantId, {
      marketingPushEnabled: false,
      priorityEnabled: {
        ...this.getPreference(memberId, tenantId).priorityEnabled,
        [PushBusinessPriority.P3]: false,
      },
    })
  }

  /**
   * 一键开启 P3 营销推送
   */
  enableMarketingPush(memberId: string, tenantId: string): PushUserPreference {
    return this.setPreference(memberId, tenantId, {
      marketingPushEnabled: true,
      priorityEnabled: {
        ...this.getPreference(memberId, tenantId).priorityEnabled,
        [PushBusinessPriority.P3]: true,
      },
    })
  }

  /**
   * 设置用户级免打扰时段
   * BS-0165: 用户自定义免打扰时间段
   */
  setDndHours(
    memberId: string,
    tenantId: string,
    enabled: boolean,
    startTime: string,
    endTime: string
  ): PushUserPreference {
    return this.setPreference(memberId, tenantId, {
      dndEnabled: enabled,
      dndStartTime: startTime,
      dndEndTime: endTime,
    })
  }

  /**
   * 设置首选推送通道
   * BS-0172: 通道优先级配置
   */
  setPreferredChannel(
    memberId: string,
    tenantId: string,
    preferredChannel: string,
    fallbackChannels: string[]
  ): PushUserPreference {
    return this.setPreference(memberId, tenantId, {
      preferredChannel,
      fallbackChannels,
    })
  }

  /**
   * 检查推送是否被用户偏好拦截
   *
   * @returns true = 允许推送, false = 被拦截
   */
  shouldAllowPush(
    memberId: string,
    tenantId: string,
    priority: PushBusinessPriority,
    currentHour?: number,
    currentMinute?: number
  ): boolean {
    const pref = this.getPreference(memberId, tenantId)

    // 检查优先级是否开启
    const prioritySetting = pref.priorityEnabled[priority]
    if (prioritySetting === false) {
      // P0 强制推送不受用户偏好控制
      if (priority === PushBusinessPriority.P0) return true
      this.logger.debug(`[Preference] Blocked by priority setting: priority=${priority} member=${memberId}`)
      return false
    }

    // P3 营销推送 - 检查一键关闭
    if (priority === PushBusinessPriority.P3 && !pref.marketingPushEnabled) {
      this.logger.debug(`[Preference] Blocked by P3 marketing off: member=${memberId}`)
      return false
    }

    // 检查用户级免打扰时段
    if (pref.dndEnabled) {
      const hour = currentHour ?? new Date().getHours()
      const minute = currentMinute ?? new Date().getMinutes()
      const currentMinutes = hour * 60 + minute

      const [startH, startM] = pref.dndStartTime.split(':').map(Number)
      const [endH, endM] = pref.dndEndTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      if (startMinutes <= endMinutes) {
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) return false
      } else {
        // 跨天: 22:00 ~ 08:00
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) return false
      }
    }

    return true
  }

  /**
   * 获取用户首选的推送通道
   */
  getPreferredChannels(memberId: string, tenantId: string): {
    primary: string
    fallbacks: string[]
  } {
    const pref = this.getPreference(memberId, tenantId)
    return {
      primary: pref.preferredChannel,
      fallbacks: pref.fallbackChannels,
    }
  }

  /**
   * 创建默认偏好
   */
  private createDefault(memberId: string, tenantId: string): PushUserPreference {
    const now = new Date().toISOString()
    const pref: PushUserPreference = {
      memberId,
      tenantId,
      ...DEFAULT_USER_PUSH_PREFERENCE,
      updatedAt: now,
      createdAt: now,
    }
    const key = `${tenantId}:${memberId}`
    userPreferenceStore.set(key, pref)
    return pref
  }

  /**
   * 测试辅助: 清空所有偏好
   */
  reset(): void {
    userPreferenceStore.clear()
  }
}
