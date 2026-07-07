import type { EventEnvelope } from '../integration-orchestration/integration-orchestration.entity'

/**
 * Outbox 端口 (P1-3.1) · 事件可靠投递基础设施
 *
 * Outbox 模式核心:
 *   1. 业务代码 commit 主事务 + append outbox (同事务)
 *   2. 后台 relay 轮询 outbox, 发布到订阅者
 *   3. 失败重试 (指数退避) → 超过 maxAttempts 入死信
 *   4. DLQ 支持手动 replay
 *
 * 与 integration-orchestration 的关系:
 *   - EventEnvelope: 标准化事件信封 (上游已定义)
 *   - OutboxRecord: 待发送事件 (含重试状态)
 *   - OutboxRelay: 投递引擎
 *
 * P1-3 MVP: InMemoryOutboxStore (Phase-38 内存版)
 * Phase-46+: 替换为 PrismaOutboxStore (持久化)
 */

/** Outbox 投递状态 */
export type OutboxStatus = 'PENDING' | 'IN_FLIGHT' | 'DELIVERED' | 'DEAD_LETTERED'

/** Outbox 记录 */
export interface OutboxRecord {
  id: string
  tenantId: string
  envelope: EventEnvelope
  status: OutboxStatus
  attempts: number
  maxAttempts: number
  /** 下次可重试时间 (unix ms) — 0 表示立即 */
  nextAttemptAt: number
  lastError?: string
  createdAt: string
  updatedAt: string
  deliveredAt?: string
  deadLetteredAt?: string
}

/** 写入入参 */
export interface AppendOutboxInput {
  tenantId: string
  eventName: string
  payload: unknown
  /** 覆盖默认 maxAttempts */
  maxAttempts?: number
  /** 关联业务 ID (用于追踪) */
  sourceId?: string
  /** 幂等键 (同 key 复用, 不重写) */
  idempotencyKey?: string
}

/** Outbox Writer (业务入口) */
export interface OutboxWriter {
  /**
   * 追加事件到 outbox
   * - 同 idempotencyKey 第二次调用: 返回已存在 record (不重写)
   * - 否则: 创建 PENDING record
   */
  append(input: AppendOutboxInput): Promise<OutboxRecord>
}

/** Outbox Store (持久层抽象) */
export interface OutboxStore {
  /** 拉取一批可投递的记录 (PENDING + nextAttemptAt <= now) */
  claimBatch(input: { batchSize: number; now: number }): Promise<OutboxRecord[]>

  /** 标记为已投递 (PENDING/IN_FLIGHT → DELIVERED) */
  markDelivered(id: string, now: number): Promise<void>

  /** 标记为失败: attempts++, 计算 nextAttemptAt, 仍 PENDING */
  markFailed(input: {
    id: string
    error: string
    now: number
    backoffMs: number
  }): Promise<OutboxRecord | null>

  /** 移入死信 (PENDING/IN_FLIGHT → DEAD_LETTERED) */
  moveToDeadLetter(input: { id: string; error: string; now: number }): Promise<void>

  /** 列出死信 (按 tenantId 过滤, 可选) */
  listDeadLetter(input?: { tenantId?: string; limit?: number }): Promise<OutboxRecord[]>

  /** 从死信恢复 (DEAD_LETTERED → PENDING, attempts=0, nextAttemptAt=now) */
  replayFromDeadLetter(id: string, now: number): Promise<OutboxRecord | null>

  /** 测试/管理: 列出全部 */
  listAll(input?: { status?: OutboxStatus; limit?: number }): Promise<OutboxRecord[]>

  /** 测试辅助: 清空 */
  clear(): void

  /** 统计 */
  count(): { total: number; pending: number; delivered: number; deadLettered: number }
}

/** Outbox 处理器 (订阅者) */
export interface OutboxHandler {
  /** 订阅的事件名 */
  eventName: string
  /** 处理函数, 抛错 → 触发重试 */
  handle(record: OutboxRecord): Promise<void>
}

/** Outbox Relay 投递统计 */
export interface RelayStats {
  totalRuns: number
  totalClaimed: number
  totalDelivered: number
  totalFailed: number
  totalDeadLettered: number
  totalDurationMs: number
  lastRunAt: string | null
  lastErrorAt: string | null
  lastError: string | null
}

/** Relay 配置 */
export interface OutboxRelayConfig {
  /** 轮询间隔 ms (默认 1000) */
  pollIntervalMs?: number
  /** 单次批量 (默认 10) */
  batchSize?: number
  /** 默认最大重试次数 (默认 5) */
  defaultMaxAttempts?: number
  /** 基础退避 ms (默认 1000, 指数递增: 1s, 2s, 4s, 8s, 16s) */
  baseBackoffMs?: number
}

/** 错误分类 */
export class OutboxError extends Error {
  readonly retryable: boolean
  constructor(input: { message: string; retryable: boolean; cause?: unknown }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined)
    this.name = 'OutboxError'
    this.retryable = input.retryable
  }
}
