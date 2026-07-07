import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { EventEnvelope } from '../integration-orchestration/integration-orchestration.entity'
import {
  type OutboxRecord,
  type OutboxStore,
  type AppendOutboxInput,
  type OutboxWriter,
  type OutboxStatus
} from './outbox.port'

/**
 * InMemoryOutboxStore · 内存版 Outbox 持久层 (P1-3.2)
 *
 * 设计:
 *   - records: Map<id, OutboxRecord> 主索引
 *   - idemIndex: Map<idempotencyKey, id> 幂等键索引
 *   - claimBatch: 拉取 PENDING + nextAttemptAt <= now 的前 N 条
 *   - status 转换: PENDING/IN_FLIGHT → DELIVERED/DEAD_LETTERED
 *
 * 限制 (P1-3 MVP):
 *   - 进程重启后数据丢失
 *   - 无并发竞争 (Node.js 单线程事件循环保护)
 *   - 无持久化
 *
 * Phase-46+ 替换为 PrismaOutboxStore:
 *   - claimBatch → UPDATE ... WHERE status=PENDING AND next_attempt_at <= now
 *   - markFailed → UPDATE attempts++, next_attempt_at=...
 *   - moveToDeadLetter → UPDATE status=DEAD_LETTERED
 */

@Injectable()
export class InMemoryOutboxStore implements OutboxStore, OutboxWriter {
  private readonly logger = new Logger(InMemoryOutboxStore.name)
  /** id → record */
  private readonly records = new Map<string, OutboxRecord>()
  /** idempotencyKey → id (同 key 复用) */
  private readonly idemIndex = new Map<string, string>()

  /**
   * OutboxWriter.append
   * 同 idempotencyKey 已存在 → 返回已存在 record
   */
  async append(input: AppendOutboxInput): Promise<OutboxRecord> {
    if (input.idempotencyKey) {
      const existingId = this.idemIndex.get(input.idempotencyKey)
      if (existingId) {
        const existing = this.records.get(existingId)
        if (existing) {
          this.logger.debug(
            `Outbox idempotent append: key=${input.idempotencyKey} id=${existing.id} status=${existing.status}`
          )
          return existing
        }
      }
    }

    const now = new Date().toISOString()
    const envelope: EventEnvelope = {
      envelopeId: `env-${randomUUID()}`,
      eventName: input.eventName,
      source: 'outbox',
      aggregateId: input.sourceId,
      idempotencyKey: input.idempotencyKey ?? `outbox-${randomUUID()}`,
      occurredAt: now,
      receivedAt: now,
      payload: (input.payload as Record<string, unknown>) ?? {},
      headers: { 'x-tenant-id': input.tenantId }
    }

    const record: OutboxRecord = {
      id: `outbox-${randomUUID()}`,
      tenantId: input.tenantId,
      envelope,
      status: 'PENDING',
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 5,
      nextAttemptAt: Date.now(),
      createdAt: now,
      updatedAt: now
    }

    this.records.set(record.id, record)
    if (input.idempotencyKey) {
      this.idemIndex.set(input.idempotencyKey, record.id)
    }

    this.logger.debug(
      `Outbox append: id=${record.id} event=${input.eventName} tenant=${input.tenantId} maxAttempts=${record.maxAttempts}`
    )
    return record
  }

  // ─── OutboxStore 实现 ───────────────────────────────

  /**
   * 拉取 PENDING + nextAttemptAt <= now 的前 N 条
   * 拉取后立即标记为 IN_FLIGHT (防止并发重复消费)
   */
  async claimBatch(input: { batchSize: number; now: number }): Promise<OutboxRecord[]> {
    const claimed: OutboxRecord[] = []
    // 按 nextAttemptAt 升序 (最久未投递优先)
    const candidates = Array.from(this.records.values())
      .filter(
        (r) => r.status === 'PENDING' && r.nextAttemptAt <= input.now
      )
      .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt)

    for (const record of candidates) {
      if (claimed.length >= input.batchSize) break
      // 二次校验 (防止中途被改)
      const fresh = this.records.get(record.id)
      if (fresh && fresh.status === 'PENDING' && fresh.nextAttemptAt <= input.now) {
        fresh.status = 'IN_FLIGHT'
        fresh.updatedAt = new Date().toISOString()
        claimed.push(fresh)
      }
    }
    return claimed
  }

  async markDelivered(id: string, now: number): Promise<void> {
    const record = this.records.get(id)
    if (!record) {
      this.logger.warn(`markDelivered: record ${id} not found`)
      return
    }
    record.status = 'DELIVERED'
    record.deliveredAt = new Date(now).toISOString()
    record.updatedAt = record.deliveredAt
  }

  async markFailed(input: {
    id: string
    error: string
    now: number
    backoffMs: number
  }): Promise<OutboxRecord | null> {
    const record = this.records.get(input.id)
    if (!record) {
      this.logger.warn(`markFailed: record ${input.id} not found`)
      return null
    }
    record.attempts += 1
    record.lastError = input.error
    record.nextAttemptAt = input.now + input.backoffMs
    // 已用完所有重试 → DEAD_LETTERED
    if (record.attempts >= record.maxAttempts) {
      record.status = 'DEAD_LETTERED'
      record.deadLetteredAt = new Date(input.now).toISOString()
      this.logger.warn(
        `Outbox record ${record.id} exhausted ${record.attempts} attempts → DEAD_LETTERED: ${input.error}`
      )
    } else {
      record.status = 'PENDING'
    }
    record.updatedAt = new Date(input.now).toISOString()
    return record
  }

  async moveToDeadLetter(input: { id: string; error: string; now: number }): Promise<void> {
    const record = this.records.get(input.id)
    if (!record) {
      this.logger.warn(`moveToDeadLetter: record ${input.id} not found`)
      return
    }
    record.status = 'DEAD_LETTERED'
    record.lastError = input.error
    record.deadLetteredAt = new Date(input.now).toISOString()
    record.updatedAt = record.deadLetteredAt
  }

  async listDeadLetter(input?: { tenantId?: string; limit?: number }): Promise<OutboxRecord[]> {
    const filtered = Array.from(this.records.values())
      .filter((r) => r.status === 'DEAD_LETTERED')
      .filter((r) => !input?.tenantId || r.tenantId === input.tenantId)
      .sort((a, b) => (b.deadLetteredAt ?? '').localeCompare(a.deadLetteredAt ?? ''))
    return input?.limit ? filtered.slice(0, input.limit) : filtered
  }

  async replayFromDeadLetter(id: string, now: number): Promise<OutboxRecord | null> {
    const record = this.records.get(id)
    if (!record) {
      this.logger.warn(`replayFromDeadLetter: record ${id} not found`)
      return null
    }
    if (record.status !== 'DEAD_LETTERED') {
      this.logger.warn(
        `replayFromDeadLetter: record ${id} status=${record.status}, expected DEAD_LETTERED`
      )
      return null
    }
    record.status = 'PENDING'
    record.attempts = 0
    record.nextAttemptAt = now
    record.deadLetteredAt = undefined
    record.lastError = undefined
    record.updatedAt = new Date(now).toISOString()
    this.logger.log(
      `Outbox replay: id=${record.id} event=${record.envelope.eventName} tenant=${record.tenantId}`
    )
    return record
  }

  async listAll(input?: { status?: OutboxStatus; limit?: number }): Promise<OutboxRecord[]> {
    const filtered = Array.from(this.records.values())
      .filter((r) => !input?.status || r.status === input.status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return input?.limit ? filtered.slice(0, input.limit) : filtered
  }

  clear(): void {
    this.records.clear()
    this.idemIndex.clear()
  }

  count(): { total: number; pending: number; delivered: number; deadLettered: number } {
    let pending = 0
    let delivered = 0
    let deadLettered = 0
    for (const r of this.records.values()) {
      if (r.status === 'PENDING' || r.status === 'IN_FLIGHT') pending += 1
      else if (r.status === 'DELIVERED') delivered += 1
      else if (r.status === 'DEAD_LETTERED') deadLettered += 1
    }
    return { total: this.records.size, pending, delivered, deadLettered }
  }
}
