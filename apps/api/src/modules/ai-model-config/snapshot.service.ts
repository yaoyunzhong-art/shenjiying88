/**
 * 90天历史快照服务 (V9 需求 1 · V10 Day 2)
 *
 * 用途: 自动保存配置变更历史,支持90天内任意时刻回滚
 * 策略:
 * - 每次配置变更自动创建快照
 * - 保留90天(自动清理过期)
 * - 支持按时间点查询历史状态
 */

import { Injectable, Logger } from '@nestjs/common'
import { AiModelConfigRepository } from './ai-model-config.repository'
import type { AiModelConfigHistory, AiModelStoreConfig } from './ai-model-config.entity'

export interface SnapshotPoint {
  timestamp: Date
  configId: string
  configName: string
  provider: string
  changedBy: string
  changeReason?: string
}

function toDate(v: Date | string): Date {
  return typeof v === 'string' ? new Date(v) : v
}

export interface TimeTravelResult {
  timestamp: Date
  config: AiModelStoreConfig | null
  history: AiModelConfigHistory | null
}

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name)
  private readonly RETENTION_DAYS = 90

  constructor(private readonly repo: AiModelConfigRepository) {}

  /**
   * 获取配置的时间线(所有快照点)
   * @param configId 配置ID
   * @param limit 最多返回多少条
   */
  async getTimeline(configId: string, limit = 50): Promise<SnapshotPoint[]> {
    const history = await this.repo.listHistory(configId, limit)
    
    return history.map(h => ({
      timestamp: toDate(h.changedAt),
      configId: h.configId,
      configName: h.snapshot.configName ?? '',
      provider: h.snapshot.provider ?? '',
      changedBy: h.changedBy,
      changeReason: h.reason,
    }))
  }

  /**
   * 时间旅行 - 查询指定时间点的配置状态
   * @param configId 配置ID
   * @param timestamp 目标时间点
   */
  async timeTravel(configId: string, timestamp: Date): Promise<TimeTravelResult> {
    // 获取所有历史
    const history = await this.repo.listHistory(configId, 1000)
    
    // 找到指定时间点前最新的快照
    const snapshot = history
      .filter(h => toDate(h.changedAt) <= timestamp)
      .sort((a: any, b: any) => toDate(b.changedAt).getTime() - toDate(a.changedAt).getTime())[0]

    if (!snapshot) {
      this.logger.warn(`No snapshot found for config ${configId} at ${timestamp}`)
      return {
        timestamp,
        config: null,
        history: null,
      }
    }

    return {
      timestamp,
      config: snapshot.snapshot as AiModelStoreConfig,
      history: snapshot,
    }
  }

  /**
   * 清理过期快照(自动维护)
   * - 每天自动清理一次
   * - 保留90天
   */
  async cleanupExpiredSnapshots(): Promise<{ deleted: number }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS)

    const r = this.repo as unknown as {
      deleteHistoryBefore: (d: Date) => Promise<number> | number
      getHistoryStats: () => Promise<{ totalCount: number; oldestDate: Date | null; newestDate: Date | null; uniqueConfigCount: number }> | { totalCount: number; oldestDate: Date | null; newestDate: Date | null; uniqueConfigCount: number }
    }
    const deleted = await r.deleteHistoryBefore(cutoffDate)

    this.logger.log(`Cleaned up ${deleted} expired snapshots (before ${cutoffDate.toISOString()})`)

    return { deleted }
  }

  /**
   * 获取快照统计信息
   */
  async getSnapshotStats(): Promise<{
    totalSnapshots: number
    oldestSnapshot: Date | null
    newestSnapshot: Date | null
    configsWithSnapshots: number
  }> {
    const repo = this.repo as unknown as { getHistoryStats: () => Promise<{ totalCount: number; oldestDate: Date | null; newestDate: Date | null; uniqueConfigCount: number }> | { totalCount: number; oldestDate: Date | null; newestDate: Date | null; uniqueConfigCount: number } }
    const stats = await repo.getHistoryStats()
    
    return {
      totalSnapshots: stats.totalCount,
      oldestSnapshot: stats.oldestDate,
      newestSnapshot: stats.newestDate,
      configsWithSnapshots: stats.uniqueConfigCount,
    }
  }

  /**
   * 比较两个快照的差异
   */
  compareSnapshots(
    before: AiModelStoreConfig,
    after: AiModelStoreConfig,
  ): Array<{
    field: string
    before: unknown
    after: unknown
    changed: boolean
  }> {
    const fields: Array<keyof AiModelStoreConfig> = [
      'configName',
      'provider',
      'endpointUrl',
      'contextWindow',
      'temperature',
      'maxTokens',
      'customHeaders',
    ]

    return fields.map(field => ({
      field,
      before: before[field],
      after: after[field],
      changed: JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    }))
  }
}
