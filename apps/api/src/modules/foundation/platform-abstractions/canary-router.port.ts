/**
 * CanaryRouter 灰度发布端口 (P3-2.1) · 第二底座灰度接入
 *
 * 灰度发布阶段:
 *   Stage 0: 0%   (主 100%, 灰 0%)     - 准备阶段
 *   Stage 1: 5%   (主 95%,  灰 5%)     - 内测
 *   Stage 2: 25%  (主 75%,  灰 25%)    - 内部扩大
 *   Stage 3: 50%  (主 50%,  灰 50%)    - 半量
 *   Stage 4: 100% (主 0%,   灰 100%)   - 全面切换
 *
 * 决策依据 (按优先级):
 *   1. Per-tenant override (强制切/强制不切, 用于紧急回滚)
 *   2. Allowlist (白名单 tenant 总是切到 canary, 用于内部测试)
 *   3. Denylist (黑名单 tenant 永远不切, 用于重要客户)
 *   4. 阶段百分比 + hash 决定 (确定性 + 均匀分布)
 *
 * 用法:
 *   const decision = canaryRouter.shouldUseCanary({ tenantId, hashKey, percentage: 25 })
 *   if (decision.useCanary) callSecondary()
 *   else callPrimary()
 */

export type CanaryStage = 0 | 5 | 25 | 50 | 100

export interface CanaryDecision {
  useCanary: boolean
  bucket: 'primary' | 'canary'
  reason: 'override_force_canary' | 'override_force_primary' | 'allowlist' | 'denylist' | 'percentage_hash'
  /** 实际百分比快照 (调试用) */
  effectivePercentage: number
  /** 命中的 hash 桶 [0, 100) */
  hashBucket: number
}

export interface CanaryRouterConfig {
  /** 主 platform id (灰度目标 = 主) */
  primaryPlatformId: string
  /** 备用/新 platform id (灰度源) */
  canaryPlatformId: string
  /** 强制走 canary 的 tenant 列表 */
  allowlist?: string[]
  /** 强制不走 canary 的 tenant 列表 */
  denylist?: string[]
  /** 紧急回滚: 强制全部回主 */
  forceRollback?: boolean
}

export interface CanaryQuery {
  tenantId: string
  /** 灰度键 (保证同 key 总是同 bucket) */
  hashKey: string
  /** 当前阶段百分比 (0-100) */
  stagePercentage: number
}

export interface CanaryRouterStats {
  totalDecisions: number
  canaryDecisions: number
  primaryDecisions: number
  perReason: Record<CanaryDecision['reason'], number>
  currentStage: number
}
