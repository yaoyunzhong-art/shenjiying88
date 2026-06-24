"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationOrchestrationService = void 0;
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const trust_governance_service_1 = require("../trust-governance/trust-governance.service");
let IntegrationOrchestrationService = class IntegrationOrchestrationService {
    prisma;
    trustGovernanceService;
    constructor(prisma, trustGovernanceService) {
        this.prisma = prisma;
        this.trustGovernanceService = trustGovernanceService;
    }
    webhookSources = [
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
    ];
    async publishEvent(eventName, payload, options) {
        const receivedAt = new Date().toISOString();
        const source = options?.source ?? 'foundation';
        const aggregateId = options?.aggregateId ?? this.buildPayloadChecksum(payload);
        const idempotencyKey = options?.idempotencyKey ?? this.buildEphemeralIdempotencyKey(eventName, source, aggregateId, receivedAt);
        let eventRecord;
        try {
            eventRecord = await this.prisma.domainEvent.create({
                data: {
                    eventType: eventName,
                    aggregateType: this.deriveAggregateType(eventName, source),
                    aggregateId,
                    scopeType: client_1.FoundationScopeType.PLATFORM,
                    idempotencyKey,
                    status: client_1.EventStatus.PUBLISHED,
                    payload: this.toInputJsonValue(payload),
                    headers: this.toInputJsonValue({
                        ...(options?.headers ?? {}),
                        'x-event-source': source
                    }),
                    occurredAt: new Date(receivedAt),
                    availableAt: new Date(receivedAt),
                    processedAt: new Date(receivedAt)
                }
            });
        }
        catch (error) {
            if (this.isDomainEventIdempotencyConflict(error, idempotencyKey)) {
                const existingEvent = await this.prisma.domainEvent.findUnique({
                    where: { idempotencyKey }
                });
                if (existingEvent) {
                    return {
                        status: 'duplicate',
                        envelope: this.toEventEnvelope(existingEvent),
                        persistedEventId: existingEvent.id,
                        guarantees: ['database-unique-idempotency-key', 'duplicate-detected-during-create']
                    };
                }
            }
            throw error;
        }
        await this.trustGovernanceService.recordAudit('foundation.domain-event.published', {
            eventType: eventName,
            aggregateId,
            source,
            domainEventId: eventRecord.id
        }, {
            source,
            riskLevel: 'low'
        });
        const envelope = {
            envelopeId: eventRecord.id,
            eventName,
            source,
            aggregateId,
            idempotencyKey: eventRecord.idempotencyKey ?? this.buildPayloadChecksum(payload),
            occurredAt: receivedAt,
            receivedAt,
            payload,
            headers: options?.headers ?? {}
        };
        return {
            status: 'accepted',
            envelope,
            persistedEventId: eventRecord.id,
            guarantees: ['signature-verified-before-accept', 'idempotency-recorded', 'retry-ready']
        };
    }
    async acceptWebhook(source, input) {
        const webhookSource = this.getWebhookSource(source);
        const rawBody = input.rawBody ?? this.stableStringify(input.payload);
        const signature = input.signature?.trim();
        if (!signature) {
            throw new common_1.BadRequestException('Webhook signature is required.');
        }
        const timestampMs = Number.parseInt(input.timestamp, 10);
        if (!Number.isFinite(timestampMs)) {
            throw new common_1.BadRequestException('Webhook timestamp must be a unix epoch milliseconds string.');
        }
        const ageSeconds = Math.abs(Date.now() - timestampMs) / 1000;
        if (ageSeconds > webhookSource.toleranceSeconds) {
            throw new common_1.UnauthorizedException('Webhook timestamp is outside the allowed tolerance window.');
        }
        const expectedSignature = this.generateSignature(source, input.timestamp, rawBody);
        if (!this.signaturesEqual(signature, expectedSignature)) {
            throw new common_1.UnauthorizedException('Webhook signature verification failed.');
        }
        const eventId = input.eventId ?? this.buildPayloadChecksum(input.payload);
        const recordKey = `${source}:${eventId}`;
        const existingEvent = await this.prisma.domainEvent.findUnique({
            where: { idempotencyKey: recordKey },
        });
        if (existingEvent) {
            const existingRecord = this.toIdempotencyRecord(existingEvent, source);
            await this.trustGovernanceService.recordAudit('foundation.webhook.duplicate', {
                source,
                eventId,
                domainEventId: existingEvent.id
            }, {
                source,
                riskLevel: 'medium'
            });
            return {
                status: 'duplicate',
                source,
                signatureVerified: true,
                idempotency: existingRecord,
                pipeline: ['signature-check', 'idempotency-check', 'audit-log', 'skip-duplicate']
            };
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
        });
        if (published.status === 'duplicate') {
            const persistedEvent = await this.prisma.domainEvent.findUnique({
                where: { idempotencyKey: recordKey }
            });
            if (persistedEvent) {
                await this.trustGovernanceService.recordAudit('foundation.webhook.duplicate-race', {
                    source,
                    eventId,
                    domainEventId: persistedEvent.id
                }, {
                    source,
                    riskLevel: 'medium'
                });
                return {
                    status: 'duplicate',
                    source,
                    signatureVerified: true,
                    idempotency: this.toIdempotencyRecord(persistedEvent, source),
                    pipeline: ['signature-check', 'idempotency-check', 'database-unique-key', 'skip-duplicate']
                };
            }
        }
        await this.trustGovernanceService.recordAudit('foundation.webhook.accepted', {
            source,
            eventId,
            eventType: input.eventType ?? `${source}.webhook.received`,
            payloadChecksum: this.buildPayloadChecksum(input.payload)
        }, {
            source,
            riskLevel: 'medium'
        });
        const persistedEvent = await this.prisma.domainEvent.findUnique({
            where: { id: published.persistedEventId }
        });
        const idempotencyRecord = this.toIdempotencyRecord(persistedEvent, source);
        return {
            status: 'accepted',
            source,
            signatureVerified: true,
            idempotency: idempotencyRecord,
            envelope: published.envelope,
            pipeline: ['signature-check', 'idempotency-check', 'event-envelope', 'audit-log']
        };
    }
    getWebhookSourceCatalog() {
        return this.webhookSources.map((source) => ({
            source: source.source,
            algorithm: source.algorithm,
            toleranceSeconds: source.toleranceSeconds,
            description: source.description,
            secretRef: `${source.source}-webhook-signing-secret`
        }));
    }
    async getIdempotencyRecords(source) {
        const events = await this.prisma.domainEvent.findMany({
            where: {
                NOT: { idempotencyKey: null }
            },
            orderBy: [{ createdAt: 'desc' }],
            take: 100
        });
        return events
            .map((event) => this.toIdempotencyRecord(event))
            .filter((record) => !source || record.source === source);
    }
    async getEventEnvelopes(source) {
        const events = await this.prisma.domainEvent.findMany({
            orderBy: [{ createdAt: 'desc' }],
            take: 100
        });
        return events
            .map((event) => this.toEventEnvelope(event))
            .filter((event) => !source || event.source === source);
    }
    generateSignature(source, timestamp, rawBody) {
        const webhookSource = this.getWebhookSource(source);
        const digest = (0, node_crypto_1.createHmac)('sha256', webhookSource.secret).update(`${timestamp}.${rawBody}`).digest('hex');
        return `sha256=${digest}`;
    }
    getDescriptor() {
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
        };
    }
    getWebhookSource(source) {
        const match = this.webhookSources.find((item) => item.source === source);
        if (!match) {
            throw new common_1.NotFoundException(`Webhook source not found: ${source}`);
        }
        return match;
    }
    buildPayloadChecksum(payload) {
        return (0, node_crypto_1.createHash)('sha256').update(this.stableStringify(payload)).digest('hex');
    }
    stableStringify(value) {
        if (Array.isArray(value)) {
            return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
        }
        if (value && typeof value === 'object') {
            const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
            return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${this.stableStringify(item)}`).join(',')}}`;
        }
        return JSON.stringify(value);
    }
    signaturesEqual(left, right) {
        const leftBuffer = Buffer.from(left);
        const rightBuffer = Buffer.from(right);
        return leftBuffer.length === rightBuffer.length && (0, node_crypto_1.timingSafeEqual)(leftBuffer, rightBuffer);
    }
    deriveAggregateType(eventName, source) {
        return eventName.split('.')[0] || source;
    }
    buildEphemeralIdempotencyKey(eventName, source, aggregateId, occurredAt) {
        return `event:${source}:${eventName}:${aggregateId}:${occurredAt}`;
    }
    isDomainEventIdempotencyConflict(error, idempotencyKey) {
        if (!idempotencyKey || !error || typeof error !== 'object') {
            return false;
        }
        const maybePrismaError = error;
        if (maybePrismaError.code !== 'P2002') {
            return false;
        }
        const target = maybePrismaError.meta?.target;
        if (Array.isArray(target)) {
            return target.includes('idempotencyKey');
        }
        return target === 'idempotencyKey' || target === 'DomainEvent_idempotencyKey_key';
    }
    toEventEnvelope(event) {
        const headers = this.getJsonRecord(event.headers);
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
        };
    }
    toIdempotencyRecord(event, source) {
        const headers = this.getJsonRecord(event.headers);
        const resolvedSource = source ?? this.getHeaderValue(headers, 'x-event-source') ?? 'foundation';
        return {
            key: event.idempotencyKey ?? `${resolvedSource}:${event.aggregateId}`,
            source: resolvedSource,
            eventId: event.aggregateId,
            eventType: event.eventType,
            firstSeenAt: event.createdAt.toISOString(),
            envelopeId: event.id,
            status: 'accepted',
            payloadChecksum: this.buildPayloadChecksum(this.getJsonRecord(event.payload))
        };
    }
    getJsonRecord(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }
    getHeaderValue(headers, key) {
        const value = headers[key];
        return typeof value === 'string' ? value : undefined;
    }
    toStringRecord(headers) {
        return Object.fromEntries(Object.entries(headers)
            .filter(([, value]) => typeof value === 'string')
            .map(([key, value]) => [key, value]));
    }
    toInputJsonValue(value) {
        return JSON.parse(JSON.stringify(value));
    }
};
exports.IntegrationOrchestrationService = IntegrationOrchestrationService;
exports.IntegrationOrchestrationService = IntegrationOrchestrationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        trust_governance_service_1.TrustGovernanceService])
], IntegrationOrchestrationService);
//# sourceMappingURL=integration-orchestration.service%202.js.map