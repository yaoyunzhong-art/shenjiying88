import { Injectable } from '@nestjs/common'

/**
 * V18 Day2 D3: ImplicitFeedbackService (隐式反馈处理)
 *
 * 协同过滤增强: 将隐式用户行为转化为可量化的偏好信号
 *
 * 支持的行为类型:
 *  - view (浏览):       权重 0.1, 短期兴趣信号
 *  - click (点击):      权重 0.2, 主动兴趣信号
 *  - addToCart (加购):  权重 0.5, 强购买意愿
 *  - purchase (购买):   权重 1.0, 最强度信号
 *  - share (分享):      权重 0.6, 社交推荐信号
 *  - wishlist (收藏):   权重 0.7, 长期兴趣信号
 *  - search (搜索):     权重 0.3, 类目偏好信号
 *  - review (评价):     权重 0.4, 互动信号
 */

export type ImplicitActionType =
  | 'view'
  | 'click'
  | 'addToCart'
  | 'purchase'
  | 'share'
  | 'wishlist'
  | 'search'
  | 'review'

export interface ImplicitAction {
  memberId: string
  tenantId: string
  itemId?: string
  category?: string
  tags?: string[]
  actionType: ImplicitActionType
  timestamp: string
  durationMs?: number
  quantity?: number
  metadata?: Record<string, unknown>
}

export interface ActionWeightConfig {
  view: number
  click: number
  addToCart: number
  purchase: number
  share: number
  wishlist: number
  search: number
  review: number
}

export interface ImplicitPreferenceProfile {
  memberId: string
  tenantId: string
  categoryAffinities: Map<string, number>
  tagAffinities: Map<string, number>
  itemScores: Map<string, number>
  totalActions: number
  recentActions: ImplicitAction[]
  lastActiveAt: string | null
}

@Injectable()
export class ImplicitFeedbackService {
  static readonly DEFAULT_WEIGHTS: ActionWeightConfig = {
    view: 0.1,
    click: 0.2,
    addToCart: 0.5,
    purchase: 1.0,
    share: 0.6,
    wishlist: 0.7,
    search: 0.3,
    review: 0.4,
  }

  /** 浏览保留最大时长 (毫秒) */
  private static readonly MAX_VIEW_DURATION_MS = 600_000

  /**
   * 计算单条隐式反馈的强度分值
   */
  scoreAction(
    action: ImplicitAction,
    weights: ActionWeightConfig = ImplicitFeedbackService.DEFAULT_WEIGHTS,
  ): number {
    let baseScore = weights[action.actionType] ?? 0

    // 浏览时长加成 (长时间浏览表明更强兴趣)
    if (action.actionType === 'view' && action.durationMs) {
      const durationSeconds = action.durationMs / 1000
      // 短于 2 秒可能是误触, 视为无价值
      if (action.durationMs < 2000) {
        baseScore *= 0.1
      } else {
        // 浏览时长加成系数: max(1.0, min(2.0, durationSeconds / 30))
        const durationBonus = Math.max(1.0, Math.min(2.0, durationSeconds / 30))
        baseScore *= durationBonus
      }
    }

    // 加购数量加成
    if (action.actionType === 'addToCart' && action.quantity && action.quantity > 1) {
      baseScore *= Math.min(2.0, action.quantity * 0.8)
    }

    // 购买数量加成
    if (action.actionType === 'purchase' && action.quantity && action.quantity > 1) {
      baseScore *= Math.min(3.0, 1 + action.quantity * 0.5)
    }

    return Math.min(2.0, baseScore)
  }

  /**
   * 基于隐式反馈构建会员偏好画像
   */
  buildPreferenceProfile(
    memberId: string,
    tenantId: string,
    actions: ImplicitAction[],
    weights: ActionWeightConfig = ImplicitFeedbackService.DEFAULT_WEIGHTS,
  ): ImplicitPreferenceProfile {
    const categoryAffinities = new Map<string, number>()
    const tagAffinities = new Map<string, number>()
    const itemScores = new Map<string, number>()
    const sortedActions = [...actions].sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp),
    )

    for (const action of sortedActions) {
      const score = this.scoreAction(action, weights)

      // 商品级别的累积
      if (action.itemId) {
        const curItemScore = itemScores.get(action.itemId) ?? 0
        itemScores.set(action.itemId, curItemScore + score)
      }

      // 类目偏好累积
      if (action.category) {
        const curCatScore = categoryAffinities.get(action.category) ?? 0
        categoryAffinities.set(action.category, curCatScore + score)
      }

      // 标签偏好累积
      if (action.tags) {
        for (const tag of action.tags) {
          const curTagScore = tagAffinities.get(tag) ?? 0
          tagAffinities.set(tag, curTagScore + score)
        }
      }
    }

    return {
      memberId,
      tenantId,
      categoryAffinities,
      tagAffinities,
      itemScores,
      totalActions: actions.length,
      recentActions: sortedActions.slice(0, 50),
      lastActiveAt: sortedActions.length > 0
        ? sortedActions[0].timestamp
        : null,
    }
  }

  /**
   * 基于隐式反馈计算商品与会员的匹配度 (0..1)
   */
  computeMatchScore(
    itemId: string,
    category: string,
    tags: string[],
    profile: ImplicitPreferenceProfile,
  ): number {
    const itemScore = profile.itemScores.get(itemId) ?? 0
    const catScore = profile.categoryAffinities.get(category) ?? 0
    const tagScore = tags.reduce((sum, tag) => {
      return sum + (profile.tagAffinities.get(tag) ?? 0)
    }, 0)

    // 归一化组合: itemScore * 0.5 + catScore * 0.3 + tagScore * 0.2
    const combined = itemScore * 0.5 + catScore * 0.3 + tagScore * 0.2

    // 映射到 [0, 1], 使用 sigmoid 近似
    return 1 / (1 + Math.exp(-combined + 3))
  }

  /**
   * 验证隐式反馈动作的有效性
   */
  validateAction(action: ImplicitAction): { valid: boolean; reason?: string } {
    if (!action.memberId || !action.tenantId) {
      return { valid: false, reason: 'memberId and tenantId required' }
    }

    if (!this.isValidActionType(action.actionType)) {
      return { valid: false, reason: `unknown action type: ${action.actionType}` }
    }

    if (!action.timestamp) {
      return { valid: false, reason: 'timestamp required' }
    }

    // 浏览时长超过最大限制的视为异常
    if (
      action.actionType === 'view' &&
      action.durationMs != null &&
      action.durationMs > ImplicitFeedbackService.MAX_VIEW_DURATION_MS
    ) {
      return { valid: false, reason: 'view duration exceeds max limit' }
    }

    return { valid: true }
  }

  private isValidActionType(type: string): type is ImplicitActionType {
    const validTypes: ImplicitActionType[] = [
      'view', 'click', 'addToCart', 'purchase',
      'share', 'wishlist', 'search', 'review',
    ]
    return (validTypes as string[]).includes(type)
  }

  /**
   * 清洗无效动作
   */
  filterValidActions(actions: ImplicitAction[]): ImplicitAction[] {
    return actions.filter(a => this.validateAction(a).valid)
  }
}
