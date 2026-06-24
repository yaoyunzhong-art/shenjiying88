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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const trust_governance_service_1 = require("../trust-governance/trust-governance.service");
const integration_orchestration_dto_1 = require("./integration-orchestration.dto");
const integration_orchestration_service_1 = require("./integration-orchestration.service");
function buildSignature(timestamp, payload) {
    const rawBody = JSON.stringify(payload);
    return `sha256=${(0, node_crypto_1.createHmac)('sha256', 'lyt-webhook-secret-v2').update(`${timestamp}.${rawBody}`).digest('hex')}`;
}
function createPrismaMock() {
    const events = [];
    return {
        domainEvent: {
            create: async ({ data }) => {
                if (data.idempotencyKey && events.some((event) => event.idempotencyKey === data.idempotencyKey)) {
                    const error = Object.assign(new Error('duplicate idempotency key'), {
                        code: 'P2002',
                        meta: {
                            target: ['idempotencyKey']
                        }
                    });
                    throw error;
                }
                const now = new Date();
                const event = {
                    id: `evt_${events.length + 1}`,
                    eventType: data.eventType,
                    aggregateId: data.aggregateId,
                    idempotencyKey: data.idempotencyKey ?? null,
                    payload: data.payload,
                    headers: data.headers,
                    occurredAt: data.occurredAt,
                    availableAt: data.availableAt,
                    processedAt: data.processedAt,
                    createdAt: now,
                    updatedAt: now
                };
                events.unshift(event);
                return event;
            },
            findUnique: async ({ where }) => {
                if (where.idempotencyKey) {
                    return events.find((event) => event.idempotencyKey === where.idempotencyKey) ?? null;
                }
                if (where.id) {
                    return events.find((event) => event.id === where.id) ?? null;
                }
                return null;
            },
            findMany: async ({ where, take } = {}) => {
                const filtered = where?.NOT?.idempotencyKey === null ? events.filter((event) => event.idempotencyKey) : events;
                return filtered.slice(0, take ?? filtered.length);
            }
        }
    };
}
let TestIntegrationOrchestrationE2eController = class TestIntegrationOrchestrationE2eController {
    integrationOrchestrationService;
    constructor(integrationOrchestrationService) {
        this.integrationOrchestrationService = integrationOrchestrationService;
    }
    publishEvent(body) {
        return this.integrationOrchestrationService.publishEvent(body.eventName, body.payload, {
            source: body.source,
            aggregateId: body.aggregateId,
            idempotencyKey: body.idempotencyKey
        });
    }
    ingestWebhook(source, body) {
        return this.integrationOrchestrationService.acceptWebhook(source, body);
    }
    getWebhookSources() {
        return this.integrationOrchestrationService.getWebhookSourceCatalog();
    }
    getIdempotencyRecords(query) {
        return this.integrationOrchestrationService.getIdempotencyRecords(query.source);
    }
    getEventEnvelopes(query) {
        return this.integrationOrchestrationService.getEventEnvelopes(query.source);
    }
};
__decorate([
    (0, common_1.Post)('events'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof integration_orchestration_dto_1.PublishEventDto !== "undefined" && integration_orchestration_dto_1.PublishEventDto) === "function" ? _a : Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationOrchestrationE2eController.prototype, "publishEvent", null);
__decorate([
    (0, common_1.Post)('webhooks/:source/ingest'),
    __param(0, (0, common_1.Param)('source')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof integration_orchestration_dto_1.WebhookIngestDto !== "undefined" && integration_orchestration_dto_1.WebhookIngestDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationOrchestrationE2eController.prototype, "ingestWebhook", null);
__decorate([
    (0, common_1.Get)('webhook-sources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestIntegrationOrchestrationE2eController.prototype, "getWebhookSources", null);
__decorate([
    (0, common_1.Get)('idempotency-records'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof integration_orchestration_dto_1.EventListQueryDto !== "undefined" && integration_orchestration_dto_1.EventListQueryDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationOrchestrationE2eController.prototype, "getIdempotencyRecords", null);
__decorate([
    (0, common_1.Get)('event-envelopes'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof integration_orchestration_dto_1.EventListQueryDto !== "undefined" && integration_orchestration_dto_1.EventListQueryDto) === "function" ? _d : Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationOrchestrationE2eController.prototype, "getEventEnvelopes", null);
TestIntegrationOrchestrationE2eController = __decorate([
    (0, common_1.Controller)('foundation/integration-orchestration'),
    __param(0, (0, common_1.Inject)(integration_orchestration_service_1.IntegrationOrchestrationService)),
    __metadata("design:paramtypes", [integration_orchestration_service_1.IntegrationOrchestrationService])
], TestIntegrationOrchestrationE2eController);
async function buildApp(audits = []) {
    const prismaMock = createPrismaMock();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestIntegrationOrchestrationE2eController],
        providers: [
            {
                provide: prisma_service_1.PrismaService,
                useValue: prismaMock
            },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useValue: {
                    recordAudit: async (eventType) => {
                        audits.push(eventType);
                        return {
                            auditId: `audit_${audits.length}`,
                            eventType
                        };
                    }
                }
            },
            {
                provide: integration_orchestration_service_1.IntegrationOrchestrationService,
                useFactory: (prisma, trustGovernanceService) => new integration_orchestration_service_1.IntegrationOrchestrationService(prisma, trustGovernanceService),
                inject: [prisma_service_1.PrismaService, trust_governance_service_1.TrustGovernanceService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return { app, prismaMock, audits };
}
(0, node_test_1.default)('e2e: repeated webhook delivery returns duplicate on second request', async () => {
    const { app, audits } = await buildApp();
    try {
        const payload = { orderId: 'o-2001', status: 'paid' };
        const timestamp = String(Date.now());
        const signature = buildSignature(timestamp, payload);
        const accepted = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-2001',
            eventType: 'lyt.webhook.received',
            timestamp,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        const acceptedPayload = accepted.body.data ?? accepted.body;
        strict_1.default.equal(accepted.statusCode, 201);
        strict_1.default.equal(acceptedPayload.status, 'accepted');
        strict_1.default.equal(acceptedPayload.idempotency.key, 'lyt:evt-2001');
        const duplicate = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-2001',
            eventType: 'lyt.webhook.received',
            timestamp,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        const duplicatePayload = duplicate.body.data ?? duplicate.body;
        strict_1.default.equal(duplicate.statusCode, 201);
        strict_1.default.equal(duplicatePayload.status, 'duplicate');
        strict_1.default.equal(duplicatePayload.idempotency.key, 'lyt:evt-2001');
        strict_1.default.match(JSON.stringify(audits), /foundation\.webhook\.accepted/);
        strict_1.default.match(JSON.stringify(audits), /foundation\.webhook\.duplicate/);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook ingest rejects unknown source with 404', async () => {
    const { app } = await buildApp();
    try {
        const payload = { foo: 'bar' };
        const timestamp = String(Date.now());
        const signature = `sha256=${(0, node_crypto_1.createHmac)('sha256', 'unknown-secret').update(`${timestamp}.${JSON.stringify(payload)}`).digest('hex')}`;
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/unknown-source/ingest')
            .send({
            eventId: 'evt-x',
            eventType: 'unknown.event',
            timestamp,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        strict_1.default.equal(res.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook ingest rejects missing signature with 400', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-sig',
            eventType: 'lyt.webhook.received',
            timestamp: String(Date.now()),
            payload: { x: 1 }
        });
        strict_1.default.equal(res.statusCode, 400);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook ingest rejects invalid signature with 401', async () => {
    const { app } = await buildApp();
    try {
        const payload = { foo: 'bar' };
        const timestamp = String(Date.now());
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-bad-sig',
            eventType: 'lyt.webhook.received',
            timestamp,
            signature: 'sha256=deadbeef',
            rawBody: JSON.stringify(payload),
            payload
        });
        strict_1.default.equal(res.statusCode, 401);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook ingest rejects stale timestamp outside tolerance with 401', async () => {
    const { app } = await buildApp();
    try {
        const payload = { foo: 'bar' };
        // 10 分钟前超过 300 秒容差
        const stale = String(Date.now() - 10 * 60 * 1000);
        const signature = buildSignature(stale, payload);
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-stale',
            eventType: 'lyt.webhook.received',
            timestamp: stale,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        strict_1.default.equal(res.statusCode, 401);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook ingest supports payment source with distinct secret', async () => {
    const { app } = await buildApp();
    try {
        const payload = { paymentId: 'pay-9', status: 'succeeded' };
        const timestamp = String(Date.now());
        const signature = `sha256=${(0, node_crypto_1.createHmac)('sha256', 'payment-webhook-secret-v1').update(`${timestamp}.${JSON.stringify(payload)}`).digest('hex')}`;
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/payment/ingest')
            .send({
            eventId: 'evt-pay-9',
            eventType: 'payment.callback.received',
            timestamp,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        strict_1.default.equal(res.statusCode, 201);
        const data = res.body.data ?? res.body;
        strict_1.default.equal(data.status, 'accepted');
        strict_1.default.equal(data.idempotency.key, 'payment:evt-pay-9');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: publishEvent persists event and records audit', async () => {
    const { app, audits } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/events')
            .send({
            eventName: 'order.paid',
            payload: { orderId: 'o-100', amount: 99 },
            aggregateId: 'o-100',
            idempotencyKey: 'event:order.paid:o-100:001'
        });
        strict_1.default.equal(res.statusCode, 201);
        const data = res.body.data ?? res.body;
        strict_1.default.equal(data.status, 'accepted');
        strict_1.default.ok(data.envelope);
        strict_1.default.equal(data.envelope.eventName, 'order.paid');
        strict_1.default.match(JSON.stringify(audits), /foundation\.domain-event\.published/);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: publishEvent returns duplicate on repeated idempotencyKey', async () => {
    const { app } = await buildApp();
    try {
        const body = {
            eventName: 'order.refunded',
            payload: { orderId: 'o-200' },
            idempotencyKey: 'idem:order.refunded:o-200:002'
        };
        const first = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/events')
            .send(body);
        strict_1.default.equal(first.statusCode, 201);
        const firstData = first.body.data ?? first.body;
        strict_1.default.equal(firstData.status, 'accepted');
        const second = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/events')
            .send(body);
        strict_1.default.equal(second.statusCode, 201);
        const secondData = second.body.data ?? second.body;
        strict_1.default.equal(secondData.status, 'duplicate');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: webhook source catalog exposes lyt and payment sources', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/integration-orchestration/webhook-sources');
        strict_1.default.equal(res.statusCode, 200);
        const data = res.body.data ?? res.body;
        strict_1.default.equal(data.length, 2);
        const sources = data.map((s) => s.source);
        strict_1.default.deepEqual(sources, ['lyt', 'payment']);
        strict_1.default.equal(data.every((s) => s.algorithm === 'hmac-sha256'), true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: idempotency records list filters by source', async () => {
    const { app } = await buildApp();
    try {
        const payload = { x: 1 };
        const timestamp = String(Date.now());
        const signature = buildSignature(timestamp, payload);
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-list-1',
            eventType: 'lyt.webhook.received',
            timestamp,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        const all = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/integration-orchestration/idempotency-records');
        strict_1.default.equal(all.statusCode, 200);
        const allData = all.body.data ?? all.body;
        strict_1.default.equal(allData.length, 1);
        strict_1.default.equal(allData[0].source, 'lyt');
        const filtered = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/integration-orchestration/idempotency-records?source=payment');
        strict_1.default.equal(filtered.statusCode, 200);
        const filteredData = filtered.body.data ?? filtered.body;
        strict_1.default.equal(filteredData.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: event envelopes list reflects ingested webhook', async () => {
    const { app } = await buildApp();
    try {
        const payload = { y: 2 };
        const timestamp = String(Date.now());
        const signature = buildSignature(timestamp, payload);
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/integration-orchestration/webhooks/lyt/ingest')
            .send({
            eventId: 'evt-env-1',
            eventType: 'lyt.webhook.received',
            timestamp,
            signature,
            rawBody: JSON.stringify(payload),
            payload
        });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/integration-orchestration/event-envelopes');
        strict_1.default.equal(res.statusCode, 200);
        const data = res.body.data ?? res.body;
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0].eventName, 'lyt.webhook.received');
        strict_1.default.equal(data[0].source, 'lyt');
        strict_1.default.equal(data[0].aggregateId, 'evt-env-1');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=integration-orchestration.e2e.test.js.map