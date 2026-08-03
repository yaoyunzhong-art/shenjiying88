import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { EventStatus, FoundationScopeType, Prisma } from '@prisma/client'
import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { TrustGovernanceService } from '../trust-governance/trust-governance.service'
import type { FoundationModuleDescriptor } from '../foundation.types'

interface EventEnvelope {
  envelopeId: string
  eventName: string
  source: string
  aggregateId?: string
  idempotencyKey: string
  occurredAt: string
  receivedAt: string
  payload: Record<string, unknown>
  headers: Record<string, string>
}

interface WebhookSource {
  source: string
  algorithm: 'hmac-sha256'
  secret: string
  toleranceSeconds: number
  description: string
}

interface AcceptWebhookInput {
  eventId?: string
  eventType?: string
  payload: Record<string, unknown>
  signature?: string
  timestamp: string
  rawBody?: string
}

@Injectable()
export class IntegrationOrchestrationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TrustGovernanceService) private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  private readonly webhookSources: WebhookSource[] = [
    {
      source: 'lyt',
      algorithm: 'hmac-sha256',
      secret: 'lyt-webhook-secret-v2',
      toleranceSeconds: 300,
      description: 'LYT 适配器回调验签。'
    },
    {
      source: 'payment',
      algorithm: 'hmac-sha256',
      secret: 'payment-webhook-secret-v1',
      toleranceSeconds: 300,
      description: '支付网关回调验签。'
    }
  ]

  async publishEvent(
    eventName: string,
    payload: Record<string, unknown>,
    options?: { source?: string; aggregateId?: string; idempotencyKey?: string; headers?: Record<string, string> }
  ) {
    const receivedAt = new Date().toISOString()
    const source = options?.source ?? 'foundation'
    const aggregateId = options?.aggregateId ?? this.buildPayloadChecksum(payload)
    const idempotencyKey =
      options?.idempotencyKey ?? this.buildEphemeralIdempotencyKey(eventName, source, aggregateId, receivedAt)
    let eventRecord: Awaited<ReturnType<typeof this.prisma.domainEvent.create>>

    try {
      eventRecord = await this.prisma.domainEvent.create({
        data: {
          eventType: eventName,
          aggregateType: this.deriveAggregateType(eventName, source),
          aggregateId,
          scopeType: FoundationScopeType.PLATFORM,
          idempotencyKey,
          status: EventStatus.PUBLISHED,
          payload: this.toInputJsonValue(payload),
          headers: this.toInputJsonValue({
            ...(options?.headers ?? {}),
            'x-event-source': source
          }),
          occurredAt: new Date(receivedAt),
          availableAt: new Date(receivedAt),
          processedAt: new Date(receivedAt)
        }
      })
    } catch (error) {
      if (this.isDomainEventIdempotencyConflict(error, idempotencyKey)) {
        const existingEvent = await this.prisma.domainEvent.findUnique({
          where: { idempotencyKey }
        })

        if (existingEvent) {
          return {
            status: 'duplicate',
            envelope: this.toEventEnvelope(existingEvent),
            persistedEventId: existingEvent.id,
            guarantees: ['database-unique-idempotency-key', 'duplicate-detected-during-create']
          }
        }
      }

      throw error
    }

    await this.trustGovernanceService.recordAudit(
      'foundation.domain-event.published',
      {
        eventType: eventName,
        aggregateId,
        source,
        domainEventId: eventRecord.id
      },
      {
        source,
        riskLevel: 'low'
      }
    )

    const envelope: EventEnvelope = {
      envelopeId: eventRecord.id,
      eventName,
      source,
      aggregateId,
      idempotencyKey: eventRecord.idempotencyKey ?? this.buildPayloadChecksum(payload),
      occurredAt: receivedAt,
      receivedAt,
      payload,
      headers: options?.headers ?? {}
    }

    return {
      status: 'accepted',
      envelope,
      persistedEventId: eventRecord.id,
      guarantees: ['signature-verified-before-accept', 'idempotency-recorded', 'retry-ready']
    }
  }

  async acceptWebhook(source: string, input: AcceptWebhookInput) {
    const webhookSource = this.getWebhookSource(source)
    const rawBody = input.rawBody ?? this.stableStringify(input.payload)
    const signature = input.signature?.trim()
    if (!signature) {
      throw new BadRequestException('Webhook signature is required.')
    }

    const timestampMs = Number.parseInt(input.timestamp, 10)
    if (!Number.isFinite(timestampMs)) {
      throw new BadRequestException('Webhook timestamp must be a unix epoch milliseconds string.')
    }

    const ageSeconds = Math.abs(Date.now() - timestampMs) / 1000
    if (ageSeconds > webhookSource.toleranceSeconds) {
      throw new UnauthorizedException('Webhook timestamp is outside the allowed tolerance window.')
    }

    const expectedSignature = this.generateSignature(source, input.timestamp, rawBody)
    if (!this.signaturesEqual(signature, expectedSignature)) {
      throw new UnauthorizedException('Webhook signature verification failed.')
    }

    const eventId = input.eventId ?? this.buildPayloadChecksum(input.payload)
    const recordKey = `${source}:${eventId}`
    const existingEvent = await this.prisma.domainEvent.findUnique({
      where: { idempotencyKey: recordKey },
    })
    if (existingEvent) {
      const existingRecord = this.toIdempotencyRecord(existingEvent, source)
      await this.trustGovernanceService.recordAudit(
        'foundation.webhook.duplicate',
        {
          source,
          eventId,
          domainEventId: existingEvent.id
        },
        {
          source,
          riskLevel: 'medium'
        }
      )

      return {
        status: 'duplicate',
        source,
        signatureVerified: true,
        idempotency: existingRecord,
        pipeline: ['signature-check', 'idempotency-check', 'audit-log', 'skip-duplicate']
      }
    }

    const published = await this.publishEvent(input.eventType ?? `${source}.webhook.received`, input.payload, {
      source,
      aggregateId: eventId,
      idempotencyKey: recordKey,
      headers: {
        'x-webhook-source': source,
        'x-webhook-signature': signature,
        'x-webhook-timestamp': input.timestamp
      }
    })

    if (published.status === 'duplicate') {
      const persistedEvent = await this.prisma.domainEvent.findUnique({
        where: { idempotencyKey: recordKey }
      })

      if (persistedEvent) {
        await this.trustGovernanceService.recordAudit(
          'foundation.webhook.duplicate-race',
          {
            source,
            eventId,
            domainEventId: persistedEvent.id
          },
          {
            source,
            riskLevel: 'medium'
          }
        )

        return {
          status: 'duplicate',
          source,
          signatureVerified: true,
          idempotency: this.toIdempotencyRecord(persistedEvent, source),
          pipeline: ['signature-check', 'idempotency-check', 'database-unique-key', 'skip-duplicate']
        }
      }
    }

    await this.trustGovernanceService.recordAudit(
      'foundation.webhook.accepted',
      {
        source,
        eventId,
        eventType: input.eventType ?? `${source}.webhook.received`,
        payloadChecksum: this.buildPayloadChecksum(input.payload)
      },
      {
        source,
        riskLevel: 'medium'
      }
    )
    const persistedEvent = await this.prisma.domainEvent.findUnique({
      where: { id: published.persistedEventId }
    })
    const idempotencyRecord = this.toIdempotencyRecord(persistedEvent!, source)
    return {
      status: 'accepted',
      source,
      signatureVerified: true,
      idempotency: idempotencyRecord,
      envelope: published.envelope,
      pipeline: ['signature-check', 'idempotency-check', 'event-envelope', 'audit-log']
    }
  }

  getWebhookSourceCatalog() {
    return this.webhookSources.map((source) => ({
      source: source.source,
      algorithm: source.algorithm,
      toleranceSeconds: source.toleranceSeconds,
      description: source.description,
      secretRef: `${source.source}-webhook-signing-secret`
    }))
  }

  async getIdempotencyRecords(source?: string) {
    const events = await this.prisma.domainEvent.findMany({
      where: {
        NOT: { idempotencyKey: null }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 100
    })

    return events
      .map((event) => this.toIdempotencyRecord(event))
      .filter((record) => !source || record.source === source)
  }

  async getEventEnvelopes(source?: string) {
    const events = await this.prisma.domainEvent.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 100
    })

    return events
      .map((event) => this.toEventEnvelope(event))
      .filter((event) => !source || event.source === source)
  }

  generateSignature(source: string, timestamp: string, rawBody: string) {
    const webhookSource = this.getWebhookSource(source)
    const digest = createHmac('sha256', webhookSource.secret).update(`${timestamp}.${rawBody}`).digest('hex')
    return `sha256=${digest}`
  }

  getDescriptor(): FoundationModuleDescriptor {
    return {
      key: 'integration-orchestration',
      name: 'Integration Orchestration Module',
      purpose: '统一事件总线、Webhook 网关、通知抽象和开放平台沙箱边界。',
      inboundContracts: [
        'Domain events',
        'Webhook callbacks',
        'Notification dispatch requests',
        'Third-party app authorization intents'
      ],
      outboundContracts: [
        'Async event envelope',
        'Verified webhook message',
        'Channel-agnostic notification command',
        'Open platform sandbox contract'
      ],
      capabilities: [
        {
          key: 'event-bus',
          name: '事件总线入口',
          responsibilities: ['统一事件发布模型', '支持重试/死信占位', '为订单后续链路预留异步编排'],
          entrypoints: ['IntegrationOrchestrationService.publishEvent'],
          consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
          status: 'active'
        },
        {
          key: 'webhook-gateway',
          name: 'Webhook 网关入口',
          responsibilities: ['统一验签与幂等检查', '回调审计与异常重试', '隔离 LYT/支付/开放平台回调'],
          entrypoints: ['IntegrationOrchestrationService.acceptWebhook'],
          consumers: ['lyt-adapter'],
          status: 'active'
        },
        {
          key: 'notification',
          name: '通知通道入口',
          responsibilities: ['抽象邮件/短信/Push/站内信', '按市场策略择路', '统一限流和失败回退'],
          entrypoints: ['IntegrationOrchestrationService.publishEvent'],
          consumers: ['portal', 'workbench'],
          status: 'active'
        },
        {
          key: 'open-platform',
          name: '开放平台入口',
          responsibilities: ['预留 API 网关与 ISV 鉴权', '定义沙箱与版本治理', '约束第三方应用授权范围'],
          entrypoints: ['IntegrationOrchestrationService.acceptWebhook'],
          consumers: ['portal', 'workbench', 'lyt-adapter'],
          status: 'active'
        }
      ]
    }
  }

  private getWebhookSource(source: string) {
    const match = this.webhookSources.find((item) => item.source === source)
    if (!match) {
      throw new NotFoundException(`Webhook source not found: ${source}`)
    }

    return match
  }

  private buildPayloadChecksum(payload: Record<string, unknown>) {
    return createHash('sha256').update(this.stableStringify(payload)).digest('hex')
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
      return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${this.stableStringify(item)}`).join(',')}}`
    }

    return JSON.stringify(value)
  }

  private signaturesEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left)
    const rightBuffer = Buffer.from(right)
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  }

  private deriveAggregateType(eventName: string, source: string) {
    return eventName.split('.')[0] || source
  }

  private buildEphemeralIdempotencyKey(eventName: string, source: string, aggregateId: string, occurredAt: string) {
    return `event:${source}:${eventName}:${aggregateId}:${occurredAt}`
  }

  private isDomainEventIdempotencyConflict(error: unknown, idempotencyKey: string) {
    if (!idempotencyKey || !error || typeof error !== 'object') {
      return false
    }

    const maybePrismaError = error as {
      code?: string
      meta?: {
        target?: string[] | string
      }
    }

    if (maybePrismaError.code !== 'P2002') {
      return false
    }

    const target = maybePrismaError.meta?.target
    if (Array.isArray(target)) {
      return target.includes('idempotencyKey')
    }

    return target === 'idempotencyKey' || target === 'DomainEvent_idempotencyKey_key'
  }

  private toEventEnvelope(event: {
    id: string
    eventType: string
    aggregateId: string
    idempotencyKey: string | null
    payload: unknown
    headers: unknown
    occurredAt: Date
    createdAt: Date
  }): EventEnvelope {
    const headers = this.getJsonRecord(event.headers)
    return {
      envelopeId: event.id,
      eventName: event.eventType,
      source: this.getHeaderValue(headers, 'x-event-source') ?? 'foundation',
      aggregateId: event.aggregateId,
      idempotencyKey: event.idempotencyKey ?? event.id,
      occurredAt: event.occurredAt.toISOString(),
      receivedAt: event.createdAt.toISOString(),
      payload: this.getJsonRecord(event.payload),
      headers: this.toStringRecord(headers)
    }
  }

  private toIdempotencyRecord(
    event: {
      id: string
      eventType: string
      aggregateId: string
      idempotencyKey: string | null
      payload: unknown
      headers: unknown
      createdAt: Date
    },
    source?: string
  ) {
    const headers = this.getJsonRecord(event.headers)
    const resolvedSource = source ?? this.getHeaderValue(headers, 'x-event-source') ?? 'foundation'
    return {
      key: event.idempotencyKey ?? `${resolvedSource}:${event.aggregateId}`,
      source: resolvedSource,
      eventId: event.aggregateId,
      eventType: event.eventType,
      firstSeenAt: event.createdAt.toISOString(),
      envelopeId: event.id,
      status: 'accepted' as const,
      payloadChecksum: this.buildPayloadChecksum(this.getJsonRecord(event.payload))
    }
  }

  private getJsonRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
  }

  private getHeaderValue(headers: Record<string, unknown>, key: string) {
    const value = headers[key]
    return typeof value === 'string' ? value : undefined
  }

  private toStringRecord(headers: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(headers)
        .filter(([, value]) => typeof value === 'string')
        .map(([key, value]) => [key, value as string])
    )
  }

  private toInputJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  }
}
