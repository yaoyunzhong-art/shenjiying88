"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_test_1 = __importDefault(require("node:test"));
const integration_orchestration_service_1 = require("./integration-orchestration.service");
function makePrisma(overrides = {}) {
    const store = [];
    return {
        domainEvent: {
            store,
            create: async (args) => {
                const record = { id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...args.data };
                store.push(record);
                return record;
            },
            findUnique: async () => null,
            findMany: async () => [],
            ...overrides
        }
    };
}
function makeTrustGovernance() {
    const audits = [];
    return {
        audits,
        recordAudit: async (eventType) => {
            audits.push(eventType);
            return { auditId: `audit_${audits.length}`, eventType };
        }
    };
}
function makeSignature(source, timestamp, payload) {
    const secret = source === 'payment' ? 'payment-webhook-secret-v1' : 'lyt-webhook-secret-v2';
    const rawBody = JSON.stringify(payload);
    return `sha256=${(0, node_crypto_1.createHmac)('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')}`;
}
(0, node_test_1.default)('generateSignature produces valid hmac-sha256 signature', () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const timestamp = '1718234567890';
    const signature = service.generateSignature('lyt', timestamp, JSON.stringify({ orderId: 'o-1' }));
    strict_1.default.ok(signature.startsWith('sha256='));
    strict_1.default.equal(signature.length, 71); // "sha256=" prefix + 64 hex chars
});
(0, node_test_1.default)('acceptWebhook rejects missing signature', async () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    await strict_1.default.rejects(() => service.acceptWebhook('lyt', {
        timestamp: String(Date.now()),
        payload: { orderId: 'o-1' }
    }), { message: /signature is required/i });
});
(0, node_test_1.default)('acceptWebhook rejects invalid timestamp format', async () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    await strict_1.default.rejects(() => service.acceptWebhook('lyt', {
        timestamp: 'not-a-number',
        signature: 'sha256=abc123',
        payload: { orderId: 'o-1' }
    }), { message: /timestamp/i });
});
(0, node_test_1.default)('acceptWebhook rejects expired timestamp', async () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const oldTimestamp = String(Date.now() - 600000); // 10 minutes ago, beyond 300s tolerance
    await strict_1.default.rejects(() => service.acceptWebhook('lyt', {
        timestamp: oldTimestamp,
        signature: 'sha256=abc123',
        payload: { orderId: 'o-1' }
    }), { message: /tolerance window/i });
});
(0, node_test_1.default)('acceptWebhook rejects wrong signature', async () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const timestamp = String(Date.now());
    await strict_1.default.rejects(() => service.acceptWebhook('lyt', {
        timestamp,
        signature: 'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        payload: { orderId: 'o-1' }
    }), { message: /signature verification failed/i });
});
(0, node_test_1.default)('acceptWebhook rejects unknown source', async () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const timestamp = String(Date.now());
    const payload = { orderId: 'o-1' };
    await strict_1.default.rejects(() => service.acceptWebhook('unknown', {
        timestamp,
        signature: 'sha256=abc123',
        payload
    }), { message: /not found/i });
});
(0, node_test_1.default)('acceptWebhook handles duplicate webhook (existing idempotency record)', async () => {
    const now = new Date();
    const existingEvent = {
        id: 'evt_dup',
        eventType: 'lyt.webhook.received',
        aggregateId: 'evt-001',
        idempotencyKey: 'lyt:evt-001',
        payload: { orderId: 'o-1001' },
        headers: { 'x-event-source': 'lyt' },
        createdAt: now,
        occurredAt: now,
        updatedAt: now
    };
    const prisma = makePrisma({
        findUnique: async () => existingEvent,
        findMany: async () => [existingEvent]
    });
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const timestamp = String(Date.now());
    const payload = { orderId: 'o-1001' };
    const result = await service.acceptWebhook('lyt', {
        eventId: 'evt-001',
        eventType: 'lyt.webhook.received',
        timestamp,
        signature: makeSignature('lyt', timestamp, payload),
        rawBody: JSON.stringify(payload),
        payload
    });
    strict_1.default.equal(result.status, 'duplicate');
    strict_1.default.equal(result.source, 'lyt');
    strict_1.default.ok(result.signatureVerified);
    strict_1.default.ok(result.idempotency);
    strict_1.default.equal(result.idempotency.key, 'lyt:evt-001');
    strict_1.default.ok(result.pipeline.includes('skip-duplicate'));
    strict_1.default.equal(trustGov.audits.length, 1);
    strict_1.default.equal(trustGov.audits[0], 'foundation.webhook.duplicate');
});
(0, node_test_1.default)('acceptWebhook accepts valid first-time webhook', async () => {
    const now = new Date();
    let createdEvent = null;
    const prisma = makePrisma({
        create: async (args) => {
            createdEvent = { id: `evt_${Date.now()}`, ...args.data, createdAt: now, occurredAt: now };
            return createdEvent;
        },
        findUnique: async () => createdEvent
    });
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const timestamp = String(Date.now());
    const payload = { orderId: 'o-2001', status: 'paid' };
    const result = await service.acceptWebhook('lyt', {
        eventId: 'evt-2001',
        eventType: 'lyt.webhook.received',
        timestamp,
        signature: makeSignature('lyt', timestamp, payload),
        rawBody: JSON.stringify(payload),
        payload
    });
    strict_1.default.equal(result.status, 'accepted');
    strict_1.default.equal(result.source, 'lyt');
    strict_1.default.ok(result.signatureVerified);
    strict_1.default.ok(result.idempotency);
    strict_1.default.ok(result.envelope);
    strict_1.default.equal(result.envelope.eventName, 'lyt.webhook.received');
    strict_1.default.ok(result.pipeline.includes('event-envelope'));
    strict_1.default.ok(result.pipeline.includes('audit-log'));
    strict_1.default.ok(trustGov.audits.length >= 2); // publish event audit + webhook accepted audit
});
(0, node_test_1.default)('publishEvent creates domain event and returns accepted envelope', async () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const result = await service.publishEvent('order.created', { orderId: 'o-3001' }, { source: 'market' });
    strict_1.default.equal(result.status, 'accepted');
    strict_1.default.ok(result.persistedEventId);
    strict_1.default.ok(result.envelope);
    strict_1.default.equal(result.envelope.eventName, 'order.created');
    strict_1.default.equal(result.envelope.source, 'market');
    strict_1.default.deepEqual(result.envelope.payload, { orderId: 'o-3001' });
    strict_1.default.ok(result.envelope.idempotencyKey);
    strict_1.default.ok(result.guarantees.includes('domain-event-persisted'));
    strict_1.default.ok(result.guarantees.includes('idempotency-recorded'));
    strict_1.default.equal(trustGov.audits.length, 1);
    strict_1.default.equal(trustGov.audits[0], 'foundation.domain-event.published');
});
(0, node_test_1.default)('getWebhookSourceCatalog returns known sources', () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const catalog = service.getWebhookSourceCatalog();
    strict_1.default.equal(catalog.length, 2);
    strict_1.default.deepEqual(catalog.map((s) => s.source).sort(), ['lyt', 'payment']);
    catalog.forEach((entry) => {
        strict_1.default.equal(entry.algorithm, 'hmac-sha256');
        strict_1.default.ok(typeof entry.toleranceSeconds === 'number');
        strict_1.default.ok(typeof entry.description === 'string');
        strict_1.default.ok(typeof entry.secretRef === 'string');
    });
});
(0, node_test_1.default)('getIdempotencyRecords filters by source', async () => {
    const now = new Date();
    const events = [
        {
            id: 'evt_1',
            eventType: 'lyt.callback',
            aggregateId: 'agg_1',
            idempotencyKey: 'lyt:agg_1',
            payload: {},
            headers: { 'x-event-source': 'lyt' },
            createdAt: now
        },
        {
            id: 'evt_2',
            eventType: 'payment.callback',
            aggregateId: 'agg_2',
            idempotencyKey: 'payment:agg_2',
            payload: {},
            headers: { 'x-event-source': 'payment' },
            createdAt: now
        }
    ];
    const prisma = makePrisma({ findMany: async () => events });
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const all = await service.getIdempotencyRecords();
    strict_1.default.equal(all.length, 2);
    const lytOnly = await service.getIdempotencyRecords('lyt');
    strict_1.default.equal(lytOnly.length, 1);
    strict_1.default.equal(lytOnly[0].source, 'lyt');
});
(0, node_test_1.default)('getEventEnvelopes filters by source', async () => {
    const now = new Date();
    const events = [
        {
            id: 'evt_1',
            eventType: 'order.created',
            aggregateId: 'agg_1',
            idempotencyKey: 'ik_1',
            payload: { orderId: 'o-1' },
            headers: { 'x-event-source': 'market' },
            occurredAt: now,
            createdAt: now
        },
        {
            id: 'evt_2',
            eventType: 'user.signed_up',
            aggregateId: 'agg_2',
            idempotencyKey: 'ik_2',
            payload: { userId: 'u-1' },
            headers: { 'x-event-source': 'portal' },
            occurredAt: now,
            createdAt: now
        }
    ];
    const prisma = makePrisma({ findMany: async () => events });
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const all = await service.getEventEnvelopes();
    strict_1.default.equal(all.length, 2);
    const marketOnly = await service.getEventEnvelopes('market');
    strict_1.default.equal(marketOnly.length, 1);
    strict_1.default.equal(marketOnly[0].eventName, 'order.created');
});
(0, node_test_1.default)('getDescriptor returns valid foundation module descriptor', () => {
    const prisma = makePrisma();
    const trustGov = makeTrustGovernance();
    const service = new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGov);
    const desc = service.getDescriptor();
    strict_1.default.equal(desc.key, 'integration-orchestration');
    strict_1.default.equal(typeof desc.name, 'string');
    strict_1.default.equal(typeof desc.purpose, 'string');
    strict_1.default.ok(Array.isArray(desc.inboundContracts));
    strict_1.default.ok(Array.isArray(desc.outboundContracts));
    strict_1.default.ok(Array.isArray(desc.capabilities));
    strict_1.default.equal(desc.capabilities.length, 4);
    desc.capabilities.forEach((cap) => {
        strict_1.default.ok(cap.key);
        strict_1.default.ok(cap.name);
        strict_1.default.ok(Array.isArray(cap.responsibilities));
        strict_1.default.ok(Array.isArray(cap.entrypoints));
        strict_1.default.ok(cap.status === 'active');
    });
});
//# sourceMappingURL=integration-orchestration.service.test.js.map