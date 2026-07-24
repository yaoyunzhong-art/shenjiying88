import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown
} from '@nestjs/common'
import {
  type OutboxRecord,
  type OutboxStore,
  type OutboxHandler,
  type OutboxRelayConfig,
  type RelayStats,
  type AppendOutboxInput,
  type OutboxWriter,
  OutboxError
} from './outbox.port'
import { InMemoryOutboxStore } from './in-memory-outbox.store'

/**
 * OutboxRelay · 事件可靠投递引擎 (P1-3.2)
 *
 * 启动后:
 *   1. 每 pollIntervalMs 拉取一批 PENDING 记录
 *   2. 按 eventName 路由到对应 handler
 *   3. 成功 → markDelivered
 *   4. 失败 → markFailed (exponential backoff)
 *   5. 超 maxAttempts → markFailed 自动转 DEAD_LETTERED
 *
 * 反模式 v4 cron-job-pitfall 防御:
 *   - reentry lock (drainInProgress) 防止多轮重叠
 *   - 异常隔离: 单 record 失败不影响其他
 *   - metrics: totalRuns / totalDelivered / totalFailed / totalDeadLettered
 *
 * P1-3 MVP: 内存 + 轮询
 * Phase-46+: LISTEN/NOTIFY 触发 (避免轮询)
 */

@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelay.name)
  private readonly handlers = new Map<string, OutboxHandler>()
  private drainInProgress = false
  private intervalHandle: NodeJS.Timeout | null = null
  private started = false
  private readonly config: Required<OutboxRelayConfig>
  private stats: RelayStats = {
    totalRuns: 0,
    totalClaimed: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalDeadLettered: 0,
    totalDurationMs: 0,
    lastRunAt: null,
    lastErrorAt: null,
    lastError: null
  }

  constructor(
    private readonly store: OutboxStore,
    config: OutboxRelayConfig = {}
  ) {
    this.config = {
      pollIntervalMs: config.pollIntervalMs ?? 1000,
      batchSize: config.batchSize ?? 10,
      defaultMaxAttempts: config.defaultMaxAttempts ?? 5,
      baseBackoffMs: config.baseBackoffMs ?? 1000
    }
  }

  // ─── 注册 handler ─────────────────────────────────

  registerHandler(handler: OutboxHandler): void {
    if (this.handlers.has(handler.eventName)) {
      this.logger.warn(
        `Handler for event=${handler.eventName} already registered, replacing`
      )
    }
    this.handlers.set(handler.eventName, handler)
    this.logger.log(`Handler registered for event=${handler.eventName}`)
  }

  // ─── 启动/停止 ────────────────────────────────────

  onApplicationBootstrap(): void {
    this.start()
  }

  onApplicationShutdown(): void {
    this.stop()
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.intervalHandle = setInterval(() => {
      this.drainOnce().catch((err) => {
        this.stats.lastError = (err as Error).message
        this.stats.lastErrorAt = new Date().toISOString()
        this.logger.error(`Outbox drain failed: ${(err as Error).message}`)
      })
    }, this.config.pollIntervalMs)
    this.logger.debug(
      `OutboxRelay started (pollIntervalMs=${this.config.pollIntervalMs} batchSize=${this.config.batchSize})`
    )
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
    this.logger.log('OutboxRelay stopped')
  }

  // ─── 投递一次 (测试 + 手动触发入口) ─────────────────

  /**
   * 拉一批 + 投递
   * 返回本次: claimed / delivered / failed / deadLettered
   */
  async drainOnce(): Promise<{
    claimed: number
    delivered: number
    failed: number
    deadLettered: number
    durationMs: number
  }> {
    if (this.drainInProgress) {
      this.logger.debug('Outbox drain already in progress, skip')
      return { claimed: 0, delivered: 0, failed: 0, deadLettered: 0, durationMs: 0 }
    }
    this.drainInProgress = true
    const startedAt = Date.now()
    let delivered = 0
    let failed = 0
    let deadLettered = 0

    try {
      const claimed = await this.store.claimBatch({
        batchSize: this.config.batchSize,
        now: Date.now()
      })
      this.stats.totalRuns += 1
      this.stats.totalClaimed += claimed.length

      for (const record of claimed) {
        const handler = this.handlers.get(record.envelope.eventName)
        if (!handler) {
          // 无订阅者 → 视为 retryable 失败 (handler 可能稍后注册)
          const backoffMs = this.computeBackoff(record.attempts + 1)
          const result = await this.store.markFailed({
            id: record.id,
            error: `no handler for event=${record.envelope.eventName}`,
            now: Date.now(),
            backoffMs
          })
          if (result?.status === 'DEAD_LETTERED') deadLettered += 1
          else failed += 1
          continue
        }

        try {
          await handler.handle(record)
          await this.store.markDelivered(record.id, Date.now())
          delivered += 1
        } catch (err) {
          const isFatal = err instanceof OutboxError && !err.retryable
          if (isFatal) {
            // 致命错误: 跳过重试, 直接入死信
            await this.store.moveToDeadLetter({
              id: record.id,
              error: (err as Error).message,
              now: Date.now()
            })
            deadLettered += 1
            this.logger.error(
              `Outbox handler fatal error (no retry): event=${record.envelope.eventName} err=${(err as Error).message}`
            )
          } else {
            const backoffMs = this.computeBackoff(record.attempts + 1)
            const result = await this.store.markFailed({
              id: record.id,
              error: (err as Error).message,
              now: Date.now(),
              backoffMs
            })
            if (result?.status === 'DEAD_LETTERED') deadLettered += 1
            else failed += 1
            this.logger.debug(
              `Outbox handler retry (attempt ${result?.attempts}/${record.maxAttempts}): event=${record.envelope.eventName} err=${(err as Error).message}`
            )
          }
        }
      }

      this.stats.totalDelivered += delivered
      this.stats.totalFailed += failed
      this.stats.totalDeadLettered += deadLettered
      this.stats.totalDurationMs += Date.now() - startedAt
      this.stats.lastRunAt = new Date().toISOString()

      const durationMs = Date.now() - startedAt
      if (claimed.length > 0) {
        this.logger.debug(
          `Outbox drain: claimed=${claimed.length} delivered=${delivered} failed=${failed} deadLettered=${deadLettered} ${durationMs}ms`
        )
      }
      return { claimed: claimed.length, delivered, failed, deadLettered, durationMs }
    } finally {
      this.drainInProgress = false
    }
  }

  /**
   * 指数退避: 1s, 2s, 4s, 8s, 16s (cap 60s)
   * attempts=0 → 1*1000, attempts=1 → 2*1000, ...
   */
  private computeBackoff(attempts: number): number {
    const base = this.config.baseBackoffMs
    const ms = base * Math.pow(2, Math.max(0, attempts - 1))
    return Math.min(ms, 60_000)
  }

  // ─── DLQ 重放 ───────────────────────────────────

  /**
   * 立即重放一条死信
   * 供 OutboxReplayService 调用
   */
  async replayNow(id: string): Promise<OutboxRecord | null> {
    const replayed = await (this.store as InMemoryOutboxStore).replayFromDeadLetter(
      id,
      Date.now()
    )
    if (!replayed) return null
    // 立即触发一次 drain
    await this.drainOnce()
    return replayed
  }

  getStats(): RelayStats {
    return { ...this.stats }
  }

  getConfig(): Required<OutboxRelayConfig> {
    return { ...this.config }
  }
}
