import { Injectable, Logger } from '@nestjs/common'
import type { OutboxRecord, OutboxStore } from './outbox.port'
import { OutboxRelay } from './outbox.relay'

/**
 * OutboxReplayService · 死信重放管理 (P1-3.3)
 *
 * 用法:
 *   - 列出死信: list()
 *   - 单条重放: replay(id) → 立即触发 relay 投递
 *   - 批量重放: replayMany(ids)
 *
 * 风险:
 *   - 重放 = 重新执行 handler 业务逻辑
 *   - 必须配合下游幂等 (handler 自身去重)
 *
 * Phase-46+: 提供管理端 UI / 审批流
 */
@Injectable()
export class OutboxReplayService {
  private readonly logger = new Logger(OutboxReplayService.name)

  constructor(
    private readonly store: OutboxStore,
    private readonly relay: OutboxRelay
  ) {}

  /** 列出死信 (按 tenant 过滤) */
  async list(input: { tenantId?: string; limit?: number }): Promise<OutboxRecord[]> {
    return this.store.listDeadLetter(input)
  }

  /** 单条重放 */
  async replay(id: string): Promise<{ replayed: OutboxRecord | null; delivered: boolean }> {
    const replayed = await this.relay.replayNow(id)
    if (!replayed) {
      return { replayed: null, delivered: false }
    }
    // 检查是否已 DELIVERED
    const fresh = (await this.store.listAll({ status: 'DELIVERED' })).find(
      (r) => r.id === id
    )
    return { replayed, delivered: fresh != null }
  }

  /** 批量重放 */
  async replayMany(ids: string[]): Promise<{
    total: number
    replayed: number
    delivered: number
    failed: string[]
  }> {
    const failed: string[] = []
    let replayedCount = 0
    let deliveredCount = 0

    for (const id of ids) {
      try {
        const result = await this.replay(id)
        if (result.replayed) {
          replayedCount += 1
          if (result.delivered) deliveredCount += 1
        } else {
          failed.push(id)
        }
      } catch (err) {
        this.logger.error(`Replay ${id} failed: ${(err as Error).message}`)
        failed.push(id)
      }
    }
    return { total: ids.length, replayed: replayedCount, delivered: deliveredCount, failed }
  }

  /** 死信统计 */
  async deadLetterCount(tenantId?: string): Promise<number> {
    const list = await this.store.listDeadLetter({ tenantId })
    return list.length
  }
}
