import { Injectable, Logger } from '@nestjs/common'
import {
  type ChannelCandidate,
  type HeterogeneousRouterConfig,
  type HeterogeneousChannelRouter as IHeterogeneousChannelRouter,
  type RoutingStats,
  type RoutingStrategy
} from './heterogeneous-router.port'

/**
 * HeterogeneousChannelRouter 实现 (P2-2.1)
 *
 * 3 种策略:
 *   - priority:   priority 升序, 选第一个 healthy
 *   - round_robin: 轮询, 跳过不 healthy
 *   - weighted:    按 weight 加权随机 (不 healthy 视为 weight=0)
 *
 * 状态:
 *   - channels: 可变列表 (支持 setHealth)
 *   - roundRobinIndex: round_robin 内部指针
 *   - stats: 累计 metrics
 */
@Injectable()
export class HeterogeneousChannelRouter implements IHeterogeneousChannelRouter {
  private readonly logger = new Logger(HeterogeneousChannelRouter.name)
  private strategy: RoutingStrategy
  private channels: ChannelCandidate[]
  private roundRobinIndex = 0
  private stats: RoutingStats = {
    totalSelections: 0,
    perChannel: {},
    lastSelected: null,
    skipped: 0
  }

  constructor(config: HeterogeneousRouterConfig) {
    this.strategy = config.strategy
    this.channels = config.channels.map((c) => ({ ...c }))
    for (const c of this.channels) {
      this.stats.perChannel[c.id] = 0
    }
  }

  /**
   * 选择下一个可用 channel
   * - 全部 unhealthy → null
   */
  select(): ChannelCandidate | null {
    const healthy = this.channels.filter((c) => c.healthy)
    if (healthy.length === 0) {
      this.stats.skipped += 1
      return null
    }

    let chosen: ChannelCandidate | null = null
    switch (this.strategy) {
      case 'priority':
        chosen = this.selectByPriority(healthy)
        break
      case 'round_robin':
        chosen = this.selectByRoundRobin(healthy)
        break
      case 'weighted':
        chosen = this.selectByWeight(healthy)
        break
    }

    if (chosen) {
      this.stats.totalSelections += 1
      this.stats.perChannel[chosen.id] = (this.stats.perChannel[chosen.id] ?? 0) + 1
      this.stats.lastSelected = chosen.id
    } else {
      this.stats.skipped += 1
    }
    return chosen
  }

  setHealth(id: string, healthy: boolean): void {
    const c = this.channels.find((c) => c.id === id)
    if (c) {
      c.healthy = healthy
      this.logger.log(`Channel ${id} health: ${healthy}`)
    }
  }

  getStats(): RoutingStats {
    return { ...this.stats, perChannel: { ...this.stats.perChannel } }
  }

  setStrategy(strategy: RoutingStrategy): void {
    this.logger.log(`Strategy change: ${this.strategy} -> ${strategy}`)
    this.strategy = strategy
  }

  /** 当前 channels 快照 (调试) */
  listChannels(): ChannelCandidate[] {
    return this.channels.map((c) => ({ ...c }))
  }

  // ─── 私有策略实现 ─────────────────────────────

  private selectByPriority(channels: ChannelCandidate[]): ChannelCandidate {
    return [...channels].sort((a, b) => a.priority - b.priority)[0]!
  }

  private selectByRoundRobin(channels: ChannelCandidate[]): ChannelCandidate {
    // 找从 roundRobinIndex 开始, 第一个出现在 channels 列表的 healthy channel
    const allIds = this.channels.map((c) => c.id)
    const startIdx = this.roundRobinIndex % allIds.length
    for (let i = 0; i < allIds.length; i++) {
      const idx = (startIdx + i) % allIds.length
      const c = this.channels[idx]!
      if (c.healthy) {
        this.roundRobinIndex = (idx + 1) % allIds.length
        return c
      }
    }
    return channels[0]! // 兜底 (healthy 必有元素)
  }

  private selectByWeight(channels: ChannelCandidate[]): ChannelCandidate {
    const totalWeight = channels.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight <= 0) return channels[0]!
    const r = Math.random() * totalWeight
    let acc = 0
    for (const c of channels) {
      acc += c.weight
      if (r < acc) return c
    }
    return channels[channels.length - 1]!
  }

  /** 测试/管理: 强制重置 round robin 指针 + stats */
  reset(): void {
    this.roundRobinIndex = 0
    this.stats = {
      totalSelections: 0,
      perChannel: Object.fromEntries(this.channels.map((c) => [c.id, 0])),
      lastSelected: null,
      skipped: 0
    }
  }
}
