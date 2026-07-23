import { createHash } from 'node:crypto'
import {
  advanceRuntimeGovernanceReplayPolicy,
  buildRuntimeGovernanceCallbackStallDetail,
  createRuntimeGovernanceReplayPolicy,
  type RuntimeGovernanceActionState,
  type RuntimeGovernanceCallbackReceipt,
  type RuntimeGovernanceCallbackStallDetail,
  type RuntimeGovernanceCallbackRequest,
  type RuntimeGovernanceEventRecord,
  type RuntimeGovernanceLedgerRecord,
  type RuntimeGovernanceRateLimitDecision,
  type RuntimeGovernanceReceipt,
  type RuntimeGovernanceReplayPolicy,
  type RuntimeGovernanceReplayRequest,
  type RuntimeGovernanceSubmitRequest,
  type RuntimeGovernanceSyncContract,
  type RuntimeGovernanceSyncRequest,
  type RuntimeGovernanceTicket
} from '@m5/types'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { IntegrationOrchestrationService } from '../integration-orchestration/integration-orchestration.service'
import { TrustGovernanceService } from '../trust-governance/trust-governance.service'
import type { FoundationModuleDescriptor } from '../foundation.types'

type PersistedRuntimeEvent = {
  id: string
  eventType: string
  aggregateId: string
  idempotencyKey: string | null
  payload: unknown
  createdAt: Date
}

type RuntimeGovernanceScopedSubmitRequest = RuntimeGovernanceSubmitRequest & {
  tenantId?: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

type RuntimeGovernanceScopedActionRequest<T> = T & {
  actorId?: string
  tenantId?: string
  brandId?: string
  storeId?: string
}

type RuntimeGovernanceOperationsOverview = {
  generatedAt: string
  summary: {
    backlog: number
    stalledCallbacks: number
    highRiskBacklog: number
    blockedActions: number
  }
  receipts: RuntimeGovernanceReceipt[]
  stalledReceipts: RuntimeGovernanceCallbackStallDetail[]
}

@Injectable()
export class RuntimeGovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationOrchestrationService: IntegrationOrchestrationService,
    private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  async submitAction(input: RuntimeGovernanceScopedSubmitRequest): Promise<RuntimeGovernanceReceipt> {
    const receiptCode = this.buildReceiptCode(input)
    const rateLimit = await this.buildRateLimitDecision(input)
    const receipt = this.createSubmitReceipt(input, receiptCode, rateLimit)
    const summary = `${input.app}:${input.action} 已进入 ${receipt.state} 治理链路。`

    const published = await this.integrationOrchestrationService.publishEvent(
      'runtime-governance.action.submitted',
      {
        receipt,
        summary,
        status: 'accepted'
      },
      {
        source: 'runtime-governance',
        aggregateId: receiptCode,
        idempotencyKey: input.idempotencyKey
      }
    )

    if (published.status === 'duplicate') {
      await this.recordDuplicateAuditAndEvent({
        receiptCode,
        duplicateEventType: 'runtime-governance.action.duplicate',
        summary: `${input.app}:${input.action} 命中重复提交，返回已存在 receipt。`,
        idempotencyKey: input.idempotencyKey,
        auditEventType: 'foundation.runtime-governance.submit',
        details: {
          receiptCode,
          app: input.app,
          action: input.action,
          state: receipt.state
        },
        context: {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: input.riskLevel
        }
      })
    } else {
      await this.trustGovernanceService.recordAudit(
        'foundation.runtime-governance.submit',
        {
          receiptCode,
          app: input.app,
          action: input.action,
          state: receipt.state,
          publicationStatus: 'accepted'
        },
        {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: input.riskLevel
        }
      )
    }

    return this.getActionReceipt(receiptCode)
  }

  async getActionReceipt(receiptCode: string): Promise<RuntimeGovernanceReceipt> {
    const events = await this.prisma.domainEvent.findMany({
      where: {
        aggregateType: 'runtime-governance',
        aggregateId: receiptCode
      },
      orderBy: [{ createdAt: 'asc' }],
      take: 100
    })

    if (events.length === 0) {
      throw new NotFoundException(`Runtime governance receipt not found: ${receiptCode}`)
    }

    const [firstEvent, ...restEvents] = events as unknown as [PersistedRuntimeEvent, ...PersistedRuntimeEvent[]]
    const firstPayload = this.getJsonRecord(firstEvent.payload)
    let receipt = this.asRuntimeReceipt(firstPayload.receipt)

    for (const event of restEvents) {
      const payload = this.getJsonRecord(event.payload)
      if (!payload.receipt) {
        continue
      }
      receipt = this.mergeReceipt(receipt, this.asPartialReceipt(payload.receipt))
    }

    return {
      ...receipt,
      events: (events as PersistedRuntimeEvent[]).map((event) => this.toEventRecord(event)),
      generatedAt: new Date().toISOString()
    }
  }

  async syncAction(receiptCode: string, input: RuntimeGovernanceScopedActionRequest<RuntimeGovernanceSyncRequest>) {
    const current = await this.getActionReceipt(receiptCode)
    const ready = current.ticket.status === 'ready-for-handler'
    const partial: Partial<RuntimeGovernanceReceipt> = {
      sync: {
        ...current.sync,
        handlerName: input.handlerName,
        idempotencyKey: input.idempotencyKey,
        ready,
        summary: ready ? `${input.handlerName} 已记录 sync 请求，继续等待 callback。` : `${input.handlerName} 尚未满足执行前置条件。`
      },
      callback: ready
        ? {
            ...current.callback,
            callbackStatus: 'awaiting-callback',
            lastEvent: 'HANDLER_ACCEPTED',
            summary: 'handler 已接受 sync 请求，等待 callback 回写。'
          }
        : current.callback
    }

    const published = await this.integrationOrchestrationService.publishEvent(
      'runtime-governance.handler.sync.requested',
      {
        receipt: partial,
        summary: ready ? 'handler sync 已接受。' : 'handler sync 已记录，但当前未放行。',
        status: 'accepted'
      },
      {
        source: 'runtime-governance',
        aggregateId: receiptCode,
        idempotencyKey: input.idempotencyKey
      }
    )

    if (published.status === 'duplicate') {
      await this.recordDuplicateAuditAndEvent({
        receiptCode,
        duplicateEventType: 'runtime-governance.handler.sync.duplicate',
        summary: `${input.handlerName} 命中重复 sync，返回既有治理状态。`,
        idempotencyKey: input.idempotencyKey,
        auditEventType: 'foundation.runtime-governance.sync',
        details: {
          receiptCode,
          handlerName: input.handlerName,
          ready
        },
        context: {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: current.riskLevel
        }
      })
    } else {
      await this.trustGovernanceService.recordAudit(
        'foundation.runtime-governance.sync',
        {
          receiptCode,
          handlerName: input.handlerName,
          ready,
          publicationStatus: 'accepted'
        },
        {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: current.riskLevel
        }
      )
    }

    return this.getActionReceipt(receiptCode)
  }

  async recordCallback(
    receiptCode: string,
    input: RuntimeGovernanceScopedActionRequest<RuntimeGovernanceCallbackRequest>
  ) {
    const current = await this.getActionReceipt(receiptCode)
    const partial: Partial<RuntimeGovernanceReceipt> = {
      state: input.callbackStatus === 'callback-recorded' ? 'callback-recorded' : current.state,
      callback: {
        callbackStatus: input.callbackStatus === 'callback-recorded' ? 'callback-recorded' : 'callback-blocked',
        ackToken: input.ackToken,
        lastEvent: input.lastEvent,
        summary: input.summary
      },
      ledger:
        input.callbackStatus === 'callback-recorded'
          ? {
              ...current.ledger,
              replayable: true,
              summary: 'callback 已记录，可继续进入统一 replay 入口。'
            }
          : current.ledger,
      retry:
        input.callbackStatus === 'callback-recorded'
          ? {
              ...current.retry,
              retryable: false,
              nextBackoffMs: 0,
              summary: 'callback 已记录，当前无需继续自动重试。'
            }
          : current.retry
    }

    const published = await this.integrationOrchestrationService.publishEvent(
      'runtime-governance.handler.callback.recorded',
      {
        receipt: partial,
        summary: input.summary,
        status: 'accepted'
      },
      {
        source: 'runtime-governance',
        aggregateId: receiptCode,
        idempotencyKey: input.idempotencyKey
      }
    )

    if (published.status === 'duplicate') {
      await this.recordDuplicateAuditAndEvent({
        receiptCode,
        duplicateEventType: 'runtime-governance.handler.callback.duplicate',
        summary: `${receiptCode} 命中重复 callback，沿用既有 callback 状态。`,
        idempotencyKey: input.idempotencyKey,
        auditEventType: 'foundation.runtime-governance.callback',
        details: {
          receiptCode,
          callbackStatus: input.callbackStatus,
          lastEvent: input.lastEvent
        },
        context: {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: current.riskLevel
        }
      })
    } else {
      await this.trustGovernanceService.recordAudit(
        'foundation.runtime-governance.callback',
        {
          receiptCode,
          callbackStatus: input.callbackStatus,
          lastEvent: input.lastEvent,
          publicationStatus: 'accepted'
        },
        {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: current.riskLevel
        }
      )
    }

    return this.getActionReceipt(receiptCode)
  }

  async replayAction(receiptCode: string, input: RuntimeGovernanceScopedActionRequest<RuntimeGovernanceReplayRequest>) {
    const current = await this.getActionReceipt(receiptCode)
    const nextRetry = advanceRuntimeGovernanceReplayPolicy(current.retry)
    const partial: Partial<RuntimeGovernanceReceipt> = {
      state: 'replay-scheduled',
      ledger: {
        ...current.ledger,
        ledgerKey: input.ledgerKey,
        replayable: false,
        summary: `已从 ${input.requestedFrom} 调度统一 replay。`
      },
      retry: {
        ...current.retry,
        ...nextRetry,
        summary: nextRetry.retryable ? 'replay 已入队，等待 callback 再决定是否继续重试。' : 'replay 次数已达上限，转人工复核。'
      }
    }

    const published = await this.integrationOrchestrationService.publishEvent(
      'runtime-governance.replay.scheduled',
      {
        receipt: partial,
        summary: `receipt ${receiptCode} 已调度 replay。`,
        status: 'accepted'
      },
      {
        source: 'runtime-governance',
        aggregateId: receiptCode,
        idempotencyKey: input.idempotencyKey
      }
    )

    if (published.status === 'duplicate') {
      await this.recordDuplicateAuditAndEvent({
        receiptCode,
        duplicateEventType: 'runtime-governance.replay.duplicate',
        summary: `receipt ${receiptCode} 命中重复 replay，请复用既有重放状态。`,
        idempotencyKey: input.idempotencyKey,
        auditEventType: 'foundation.runtime-governance.replay',
        details: {
          receiptCode,
          ledgerKey: input.ledgerKey,
          requestedFrom: input.requestedFrom
        },
        context: {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: current.riskLevel
        }
      })
    } else {
      await this.trustGovernanceService.recordAudit(
        'foundation.runtime-governance.replay',
        {
          receiptCode,
          ledgerKey: input.ledgerKey,
          requestedFrom: input.requestedFrom,
          publicationStatus: 'accepted'
        },
        {
          tenantId: input.tenantId,
          actorId: input.actorId,
          source: 'runtime-governance',
          riskLevel: current.riskLevel
        }
      )
    }

    return this.getActionReceipt(receiptCode)
  }

  async getOperationsOverview(tenantId?: string, now: string | Date = new Date()): Promise<RuntimeGovernanceOperationsOverview> {
    const receiptEntries = await this.listActionReceiptEntries(tenantId)
    const receipts = receiptEntries.map((entry) => entry.receipt)
    const backlogReceipts = receipts.filter((receipt) => this.isBacklogReceipt(receipt))
    const stalledReceipts = receiptEntries
      .map((entry) => buildRuntimeGovernanceCallbackStallDetail(entry.receipt, { now, startedAt: new Date(entry.updatedAt) }))
      .filter((detail) => detail.stalled)
    const highRiskBacklog = backlogReceipts.filter((receipt) => receipt.riskLevel === 'high')
    const blockedActions = receipts.filter(
      (receipt) => receipt.state === 'blocked' || receipt.state === 'challenge-issued'
    )

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        backlog: backlogReceipts.length,
        stalledCallbacks: stalledReceipts.length,
        highRiskBacklog: highRiskBacklog.length,
        blockedActions: blockedActions.length
      },
      receipts: backlogReceipts,
      stalledReceipts
    }
  }

  getDescriptor(): FoundationModuleDescriptor {
    return {
      key: 'runtime-governance',
      name: 'Runtime Governance Module',
      purpose: '统一敏感动作的 receipt、handler sync、callback、replay 与治理总览闭环。',
      inboundContracts: ['Runtime action submit request', 'Handler sync intent', 'Callback receipt', 'Replay request'],
      outboundContracts: ['Runtime governance receipt', 'Replay policy', 'Audit event timeline', 'Runtime operations overview'],
      capabilities: [
        {
          key: 'runtime-receipt',
          name: '运行态回执入口',
          responsibilities: [
            '持久化敏感动作 receipt',
            '统一生成 ticket/sync/callback/retry 视图',
            '提供 query 回查与 tenant 维度总览入口'
          ],
          entrypoints: [
            'RuntimeGovernanceService.submitAction',
            'RuntimeGovernanceService.getActionReceipt',
            'RuntimeGovernanceService.getOperationsOverview'
          ],
          consumers: ['portal', 'workbench'],
          status: 'active'
        },
        {
          key: 'handler-sync',
          name: 'Handler 同步入口',
          responsibilities: ['统一记录 handler sync 请求', '约束 callback 前状态', '沉淀幂等键与审计上下文'],
          entrypoints: ['RuntimeGovernanceService.syncAction'],
          consumers: ['portal', 'workbench'],
          status: 'active'
        },
        {
          key: 'callback-replay',
          name: 'Callback 与重放入口',
          responsibilities: ['记录 callback receipt', '统一调度 replay', '输出重试、人工兜底与 backlog 跟进建议'],
          entrypoints: ['RuntimeGovernanceService.recordCallback', 'RuntimeGovernanceService.replayAction'],
          consumers: ['portal', 'workbench'],
          status: 'active'
        }
      ]
    }
  }

  private async buildRateLimitDecision(input: RuntimeGovernanceScopedSubmitRequest): Promise<RuntimeGovernanceRateLimitDecision> {
    const scopeKey = `${input.app}:${input.action}:${input.tenantId ?? 'tenant-demo'}`
    const decision = await this.trustGovernanceService.evaluateRateLimit({
      scopeKey,
      limit: 12,
      windowSeconds: 60,
      blockSeconds: 60
    })

    return {
      allowed: decision.allowed,
      limit: decision.limit,
      remaining: decision.remaining,
      retryAfterSeconds: decision.retryAfterSeconds,
      scopeKey
    }
  }

  private createSubmitReceipt(
    input: RuntimeGovernanceSubmitRequest,
    receiptCode: string,
    rateLimit: RuntimeGovernanceRateLimitDecision
  ): RuntimeGovernanceReceipt {
    const state = this.resolveActionState(input.nextStep)
    const ticket = this.buildTicket(receiptCode, state, input.recommendedAction)
    const sync = this.buildSyncContract(receiptCode, input.handlerName, input.idempotencyKey, state)
    const callback = this.buildCallbackReceipt(state)
    const ledger = this.buildLedgerRecord(receiptCode, state)
    const retry = this.buildReplayPolicy(receiptCode, state)

    return {
      receiptCode,
      app: input.app,
      action: input.action,
      state,
      nextStep: input.nextStep,
      riskLevel: input.riskLevel,
      recommendedAction: input.recommendedAction,
      requestEndpoint: input.requestEndpoint,
      payloadSummary: input.payloadSummary,
      ticket,
      sync,
      callback,
      ledger,
      retry,
      rateLimit,
      events: [],
      generatedAt: new Date().toISOString()
    }
  }

  private async listActionReceiptEntries(tenantId?: string) {
    let events: PersistedRuntimeEvent[]
    try {
      events = (await this.prisma.domainEvent.findMany({
        where: {
          aggregateType: 'runtime-governance'
        },
        orderBy: [{ createdAt: 'asc' }],
        take: 500
      })) as PersistedRuntimeEvent[]
    } catch (error) {
      if (!this.shouldUseRuntimeFallback(error)) {
        throw error
      }
      events = []
    }

    const receiptMap = new Map<
      string,
      {
        receipt: RuntimeGovernanceReceipt
        updatedAt: number
      }
    >()

    for (const event of events as PersistedRuntimeEvent[]) {
      const payload = this.getJsonRecord(event.payload)
      const nextReceiptCandidate = payload.receipt
      if (!nextReceiptCandidate) {
        continue
      }

      const current = receiptMap.get(event.aggregateId)
      if (!current) {
        receiptMap.set(event.aggregateId, {
          receipt: this.asRuntimeReceipt(nextReceiptCandidate),
          updatedAt: event.createdAt.getTime()
        })
        continue
      }

      receiptMap.set(event.aggregateId, {
        receipt: this.mergeReceipt(current.receipt, this.asPartialReceipt(nextReceiptCandidate)),
        updatedAt: event.createdAt.getTime()
      })
    }

    return Array.from(receiptMap.values())
      .filter((entry) => this.matchesTenant(entry.receipt, tenantId))
      .sort((left, right) => right.updatedAt - left.updatedAt)
  }

  private matchesTenant(receipt: RuntimeGovernanceReceipt, tenantId?: string) {
    if (!tenantId) {
      return true
    }

    const scopeTenantId = receipt.rateLimit.scopeKey.split(':')[2]
    return (scopeTenantId ?? 'tenant-demo') === tenantId
  }

  private shouldUseRuntimeFallback(error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: unknown }).code : undefined
    return code === 'P2021' || code === 'P1010' || code === 'P1001'
  }

  private isBacklogReceipt(receipt: RuntimeGovernanceReceipt) {
    return (
      receipt.state === 'submitted' ||
      receipt.state === 'callback-recorded' ||
      receipt.state === 'replay-scheduled' ||
      receipt.callback.callbackStatus === 'awaiting-callback'
    )
  }

  private resolveActionState(nextStep: RuntimeGovernanceSubmitRequest['nextStep']): RuntimeGovernanceActionState {
    if (nextStep === 'CHALLENGE') {
      return 'challenge-issued'
    }
    if (nextStep === 'PROCEED') {
      return 'submitted'
    }

    return 'blocked'
  }

  private buildTicket(
    receiptCode: string,
    state: RuntimeGovernanceActionState,
    recommendedAction: RuntimeGovernanceSubmitRequest['recommendedAction']
  ): RuntimeGovernanceTicket {
    if (state === 'blocked') {
      return {
        ticketCode: `${receiptCode}-BLOCK`,
        ticketType: 'BLOCK_GUARD',
        status: 'waiting-prerequisite',
        summary: `当前动作仍被阻断，需先执行 ${recommendedAction}。`
      }
    }

    if (state === 'challenge-issued') {
      return {
        ticketCode: `${receiptCode}-CHALLENGE`,
        ticketType: 'CHALLENGE_GATE',
        status: 'pending-challenge',
        summary: '当前动作已进入 challenge gate，需等待挑战完成。'
      }
    }

    return {
      ticketCode: `${receiptCode}-HANDLER`,
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: '当前动作已具备 handler 执行前提。'
    }
  }

  private buildSyncContract(
    receiptCode: string,
    handlerName: string,
    idempotencyKey: string,
    state: RuntimeGovernanceActionState
  ): RuntimeGovernanceSyncContract {
    return {
      handlerName,
      syncMode: state === 'blocked' ? 'deferred' : state === 'challenge-issued' ? 'challenge-gated' : 'callback-followup',
      syncEndpoint: `/api/v1/foundation/runtime-governance/actions/${receiptCode}/sync`,
      callbackEndpoint: `/api/v1/foundation/runtime-governance/actions/${receiptCode}/callback`,
      idempotencyKey,
      ready: state === 'submitted',
      summary: state === 'submitted' ? `${handlerName} 已可同步服务端状态。` : `${handlerName} 仍需等待前置动作完成。`
    }
  }

  private buildCallbackReceipt(state: RuntimeGovernanceActionState): RuntimeGovernanceCallbackReceipt {
    if (state === 'blocked') {
      return {
        callbackStatus: 'callback-blocked',
        ackToken: 'runtime-ack-blocked',
        lastEvent: 'PREREQUISITE_PENDING',
        summary: '当前仍缺少前置条件，callback 仅记录阻断原因。'
      }
    }

    if (state === 'challenge-issued') {
      return {
        callbackStatus: 'callback-blocked',
        ackToken: 'runtime-ack-challenge',
        lastEvent: 'CHALLENGE_PENDING',
        summary: '当前仍等待挑战完成，callback 暂不落最终提交结果。'
      }
    }

    return {
      callbackStatus: 'awaiting-callback',
      ackToken: 'runtime-ack-handler',
      lastEvent: 'HANDLER_ACCEPTED',
      summary: 'handler 已接受请求，等待 callback 回写。'
    }
  }

  private buildLedgerRecord(receiptCode: string, state: RuntimeGovernanceActionState): RuntimeGovernanceLedgerRecord {
    return {
      ledgerKey: `runtime-ledger:${receiptCode}`,
      replayEndpoint: `/api/v1/foundation/runtime-governance/actions/${receiptCode}/replay`,
      replayable: state === 'submitted',
      summary: state === 'submitted' ? '当前记录可进入统一 replay 队列。' : '当前记录尚未进入可 replay 状态。'
    }
  }

  private buildReplayPolicy(receiptCode: string, state: RuntimeGovernanceActionState): RuntimeGovernanceReplayPolicy {
    return createRuntimeGovernanceReplayPolicy(receiptCode, state)
  }

  private buildReceiptCode(input: RuntimeGovernanceSubmitRequest) {
    const suffix = createHash('sha1').update(input.idempotencyKey).digest('hex').slice(0, 8).toUpperCase()
    return `${input.app.toUpperCase()}-${input.action.toUpperCase()}-${input.nextStep}-${suffix}`
  }

  private async recordDuplicateAuditAndEvent(input: {
    receiptCode: string
    duplicateEventType: string
    summary: string
    idempotencyKey?: string
    auditEventType: string
    details: Record<string, unknown>
    context?: { tenantId?: string; actorId?: string; source?: string; riskLevel?: 'low' | 'medium' | 'high' }
  }) {
    await this.integrationOrchestrationService.publishEvent(
      input.duplicateEventType,
      {
        status: 'duplicate',
        summary: input.summary,
        duplicateOfIdempotencyKey: input.idempotencyKey ?? null
      },
      {
        source: 'runtime-governance',
        aggregateId: input.receiptCode
      }
    )

    await this.trustGovernanceService.recordAudit(
      input.auditEventType,
      {
        ...input.details,
        publicationStatus: 'duplicate'
      },
      input.context
    )
  }

  private toEventRecord(event: PersistedRuntimeEvent): RuntimeGovernanceEventRecord {
    const payload = this.getJsonRecord(event.payload)
    return {
      eventType: event.eventType,
      status: payload.status === 'duplicate' ? 'duplicate' : 'accepted',
      idempotencyKey: event.idempotencyKey ?? event.id,
      occurredAt: event.createdAt.toISOString(),
      summary: typeof payload.summary === 'string' ? payload.summary : event.eventType
    }
  }

  private mergeReceipt(current: RuntimeGovernanceReceipt, next: Partial<RuntimeGovernanceReceipt>): RuntimeGovernanceReceipt {
    return {
      ...current,
      ...next,
      ticket: next.ticket ? { ...current.ticket, ...next.ticket } : current.ticket,
      sync: next.sync ? { ...current.sync, ...next.sync } : current.sync,
      callback: next.callback ? { ...current.callback, ...next.callback } : current.callback,
      ledger: next.ledger ? { ...current.ledger, ...next.ledger } : current.ledger,
      retry: next.retry ? { ...current.retry, ...next.retry } : current.retry,
      rateLimit: next.rateLimit ? { ...current.rateLimit, ...next.rateLimit } : current.rateLimit,
      events: current.events
    }
  }

  private asRuntimeReceipt(value: unknown): RuntimeGovernanceReceipt {
    return value as RuntimeGovernanceReceipt
  }

  private asPartialReceipt(value: unknown): Partial<RuntimeGovernanceReceipt> {
    return value as Partial<RuntimeGovernanceReceipt>
  }

  private getJsonRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  }
}
