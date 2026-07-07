/**
 * 异构通道路由策略 (P2-2.1) · Heterogeneous Channel Routing
 *
 * 3 种策略:
 *   - priority:  按 priority 升序选第一个可用 (主备模式)
 *   - round_robin: 轮询分发 (负载均衡)
 *   - weighted:   按 weight 加权随机 (流量比例)
 *
 * 用法:
 *   const router = new HeterogeneousChannelRouter({
 *     strategy: 'priority',
 *     channels: [
 *       { id: 'wechat-main', priority: 1, weight: 70, healthy: true },
 *       { id: 'alipay-backup', priority: 2, weight: 30, healthy: true }
 *     ]
 *   })
 *   const selected = router.select()
 *   if (selected) callChannel(selected.id)
 *
 * 集成:
 *   - PaymentChannelRegistry 已内置 priority 策略
 *   - P2-2 增强: 同一 service 内可配置多策略
 */

export type RoutingStrategy = 'priority' | 'round_robin' | 'weighted'

export interface ChannelCandidate {
  id: string
  priority: number
  weight: number
  healthy: boolean
  /** 可选: 当前 circuit 状态 */
  circuitState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

export interface HeterogeneousRouterConfig {
  strategy: RoutingStrategy
  channels: ChannelCandidate[]
}

export interface RoutingStats {
  totalSelections: number
  perChannel: Record<string, number>
  /** 末次选择的 channel id */
  lastSelected: string | null
  /** 跳过次数 (候选被过滤) */
  skipped: number
}

/** 异构路由器接口 */
export interface HeterogeneousChannelRouter {
  select(): ChannelCandidate | null
  /** 标记候选健康状态变化 */
  setHealth(id: string, healthy: boolean): void
  /** 获取路由统计 */
  getStats(): RoutingStats
  /** 更换策略 (热切换) */
  setStrategy(strategy: RoutingStrategy): void
}
