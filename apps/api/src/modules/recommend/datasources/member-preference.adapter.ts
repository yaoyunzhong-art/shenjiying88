import { Injectable } from '@nestjs/common'
import type { MemberPreference } from '../recommend.entity'

/**
 * Phase-40 T170: MemberPreferenceAdapter (会员偏好)
 *
 * 反模式 v4 multi-tenant-data-isolation: query(tenantId, ...) 第一参数强制 tenantId
 * 数据来源: 会员模块生命周期 + 订单历史聚合
 */

@Injectable()
export class MemberPreferenceAdapter {
  private prefs: MemberPreference[] = []

  seed(prefs: MemberPreference[]): void {
    this.prefs = [...prefs]
  }

  /**
   * 更新会员偏好 (订单完成后增量更新)
   */
  update(pref: MemberPreference): void {
    const idx = this.prefs.findIndex(p =>
      p.tenantId === pref.tenantId && p.memberId === pref.memberId
    )
    if (idx >= 0) {
      this.prefs[idx] = pref
    } else {
      this.prefs.push(pref)
    }
  }

  /**
   * 查询单个会员偏好
   */
  query(tenantId: string, memberId: string): MemberPreference | null {
    return this.prefs.find(p =>
      p.tenantId === tenantId && p.memberId === memberId
    ) ?? null
  }

  /**
   * 批量查询 (同生命周期)
   */
  queryByLifecycle(tenantId: string, stage: string): MemberPreference[] {
    return this.prefs.filter(p =>
      p.tenantId === tenantId && p.lifecycleStage === stage
    )
  }

  /**
   * 全部会员偏好
   */
  queryAll(tenantId: string): MemberPreference[] {
    return this.prefs.filter(p => p.tenantId === tenantId)
  }

  reset(): void {
    this.prefs = []
  }
}