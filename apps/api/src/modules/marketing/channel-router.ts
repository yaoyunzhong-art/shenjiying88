import { Injectable } from '@nestjs/common'
import type { TenantId } from './marketing.entity'

/**
 * Phase-42 T172: ChannelRouter
 *
 * DR-42-D: 渠道优先级 in-app > wechat > SMS · 用户偏好优先
 *
 * 反模式 v4 coupon-abuse-pattern:
 *  - 渠道套利: 同一渠道重复触点合并
 *  - 频控: 1/天 渠道触达上限
 */

export type MarketingChannel = 'IN_APP' | 'WECHAT' | 'SMS' | 'PUSH'

const CHANNEL_PRIORITY: MarketingChannel[] = ['IN_APP', 'WECHAT', 'SMS', 'PUSH']
const CHANNEL_COST_PER_CENT: Record<MarketingChannel, number> = {
  IN_APP: 0,      // 免费
  PUSH: 100,      // 1 元
  WECHAT: 500,    // 5 元
  SMS: 1500       // 15 元
}

export interface UserChannelPreference {
  memberId: string
  enabled: MarketingChannel[]
  optedOut: MarketingChannel[]
}

@Injectable()
export class ChannelRouter {
  private preferences = new Map<string, UserChannelPreference>()

  seedPreferences(prefs: UserChannelPreference[]): void {
    for (const p of prefs) {
      this.preferences.set(p.memberId, { ...p })
    }
  }

  setPreference(pref: UserChannelPreference): void {
    this.preferences.set(pref.memberId, { ...pref })
  }

  getPreference(memberId: string): UserChannelPreference {
    const existing = this.preferences.get(memberId)
    if (existing) return existing
    return {
      memberId,
      enabled: ['IN_APP', 'WECHAT'],
      optedOut: ['SMS']
    }
  }

  /**
   * 路由: 根据偏好和优先级选择渠道
   */
  route(tenantId: TenantId, memberId: string): MarketingChannel {
    const pref = this.getPreference(memberId)
    for (const ch of CHANNEL_PRIORITY) {
      if (pref.enabled.includes(ch) && !pref.optedOut.includes(ch)) {
        return ch
      }
    }
    return 'IN_APP'  // 兜底
  }

  /**
   * 渠道成本
   */
  costOf(channel: MarketingChannel): number {
    return CHANNEL_COST_PER_CENT[channel]
  }

  /**
   * 反模式 v4: 兜底渠道 (避免无渠道可用)
   */
  fallbackChannel(): MarketingChannel {
    return 'IN_APP'
  }

  reset(): void {
    this.preferences.clear()
  }
}