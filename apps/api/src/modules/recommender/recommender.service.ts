/**
 * RecommenderService - Champion 推荐引擎主服务
 *
 * 职责:
 * 1. Champion 数据管理
 * 2. 推荐反馈记录
 * 3. 推荐统计
 *
 * 关联: phase-19-intelligence/spec.md §Phase 3
 */
import { Injectable } from '@nestjs/common'
import type {
  ChampionSummary,
  RecommendationLog,
} from './recommender.entity'

/** 内部存储的反馈记录 */
interface FeedbackRecord {
  championId: string
  chunkId: string
  action: 'adopted' | 'dismissed' | 'read'
  timestamp: string
}

@Injectable()
export class RecommenderService {
  private champions = new Map<string, ChampionSummary>()
  private feedbacks: FeedbackRecord[] = []
  private recommendationLogs: RecommendationLog[] = []

  /**
   * 获取 Champion 信息
   */
  getChampion(championId: string): ChampionSummary {
    const champion = this.champions.get(championId)
    if (champion) return champion

    // fallback: 创建一个默认 Champion
    const fallback: ChampionSummary = {
      championId,
      name: `Champion-${championId}`,
      role: 'CHAMPION',
      totalScore: 0,
      topModules: [],
      recentContributions: [],
    }
    this.champions.set(championId, fallback)
    return fallback
  }

  /**
   * 获取所有 Champion
   */
  getAllChampions(): ChampionSummary[] {
    return Array.from(this.champions.values())
  }

  /**
   * 注册或更新 Champion
   */
  upsertChampion(champion: ChampionSummary): void {
    this.champions.set(champion.championId, champion)
  }

  /**
   * 记录推荐反馈
   */
  recordFeedback(
    championId: string,
    chunkId: string,
    action: 'adopted' | 'dismissed' | 'read',
  ): void {
    this.feedbacks.push({ championId, chunkId, action, timestamp: new Date().toISOString() })

    // 跟踪推荐日志
    if (action === 'adopted') {
      const log = this.recommendationLogs.find(
        (l) => l.championId === championId,
      )
      if (log) log.adoptedCount++
    }
  }

  /**
   * 记录一次推荐事件
   */
  logRecommendation(
    championId: string,
    module: string,
    count: number,
    executionTimeMs: number,
  ): void {
    this.recommendationLogs.push({
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      championId,
      module,
      recommendationsCount: count,
      adoptedCount: 0,
      executedAt: new Date().toISOString(),
      executionTimeMs,
    })
  }

  /**
   * 获取推荐统计
   */
  getStats(filter: {
    championId?: string
    module?: string
    days?: number
  }): RecommendationLog[] {
    let logs = this.recommendationLogs

    if (filter.championId) {
      logs = logs.filter((l) => l.championId === filter.championId)
    }
    if (filter.module) {
      logs = logs.filter((l) => l.module === filter.module)
    }
    if (filter.days) {
      const cutoff = Date.now() - filter.days * 24 * 60 * 60 * 1000
      logs = logs.filter(
        (l) => new Date(l.executedAt).getTime() > cutoff,
      )
    }

    return logs.sort(
      (a, b) =>
        new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime(),
    )
  }

  /**
   * 获取反馈统计
   */
  getFeedbackStats(): {
    total: number
    adopted: number
    dismissed: number
    read: number
  } {
    return {
      total: this.feedbacks.length,
      adopted: this.feedbacks.filter((f) => f.action === 'adopted').length,
      dismissed: this.feedbacks.filter((f) => f.action === 'dismissed').length,
      read: this.feedbacks.filter((f) => f.action === 'read').length,
    }
  }
}
