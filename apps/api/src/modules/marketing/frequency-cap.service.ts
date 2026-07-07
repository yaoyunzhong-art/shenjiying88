import { Injectable } from '@nestjs/common'
import { CouponAdapter } from './datasources/coupon.adapter'
import type {
  TenantId,
  FrequencyCapStatus
} from './marketing.entity'

/**
 * Phase-42 T172: FrequencyCapService
 *
 * 反模式 v4 coupon-abuse-pattern: 频控独立服务, 防止单点绕过
 *  - 1/7d 默认窗口
 *  - 月预算 cap (V1 简化)
 *  - 跨 campaign 共享频控记录
 */
@Injectable()
export class FrequencyCapService {
  constructor(private readonly couponAdapter: CouponAdapter) {}

  /**
   * 检查单用户频控
   */
  checkCap(tenantId: TenantId, memberId: string, windowDays: number, maxPerWindow: number, now: number = Date.now()): FrequencyCapStatus {
    const windowMs = windowDays * 24 * 60 * 60 * 1000
    const issued = this.couponAdapter.countInWindow(tenantId, memberId, windowMs, now)
    const allowed = issued < maxPerWindow
    return {
      memberId,
      windowDays,
      issuedInWindow: issued,
      maxPerWindow,
      allowed,
      nextAvailableAt: allowed ? undefined : new Date(now + windowMs).toISOString()
    }
  }
}