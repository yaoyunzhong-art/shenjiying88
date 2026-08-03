/**
 * push-priority.enum.ts — 推送分级定义 (P0~P3)
 *
 * WP-13A: 推送分级定义
 * - P0: 紧急告警（不可关闭）
 * - P1: 重要通知（如订单/结算）
 * - P2: 一般推送（通用信息）
 * - P3: 营销推送（可一键关闭）
 *
 * BS-0168 ~ BS-0184
 */

export enum PushBusinessPriority {
  /**
   * P0 — 紧急告警
   * 不可关闭，系统强制发送，用于安全告警、服务中断等场景
   */
  P0 = 'P0',

  /**
   * P1 — 重要通知
   * 订单状态、结算结果、身份验证等关键业务通知
   */
  P1 = 'P1',

  /**
   * P2 — 一般推送
   * 通用信息推送，用户可在偏好设置中选择关闭
   */
  P2 = 'P2',

  /**
   * P3 — 营销推送
   * 促销活动、优惠券、新品推荐等
   * 提供「一键关闭」配置入口
   */
  P3 = 'P3',
}

/**
 * P3 营销推送配置项
 * user_settings.push_marketing_enabled = false 表示关闭所有 P3 营销推送
 */
export const PUSH_MARKETING_SETTING_KEY = 'push_marketing_enabled'

/**
 * 获取推送分级的可关闭性
 * P0 = true (不可关闭)
 * P3 = false (可关闭)
 */
export function isPushPriorityMandatory(priority: PushBusinessPriority): boolean {
  return priority === PushBusinessPriority.P0
}

/**
 * 推送分级映射到技术优先级
 */
export function toPushPriority(priority: PushBusinessPriority): 'high' | 'normal' | 'low' {
  switch (priority) {
    case PushBusinessPriority.P0:
    case PushBusinessPriority.P1:
      return 'high'
    case PushBusinessPriority.P2:
      return 'normal'
    case PushBusinessPriority.P3:
      return 'low'
  }
}
