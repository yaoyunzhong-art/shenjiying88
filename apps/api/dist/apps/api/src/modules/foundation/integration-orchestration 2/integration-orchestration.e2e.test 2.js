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
var _a, _b;
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
    ingestWebhook(source, body) {
        return this.integrationOrchestrationService.acceptWebhook(source, body);
    }
};
__decorate([
    (0, common_1.Post)('webhooks/:source/ingest'),
    __param(0, (0, common_1.Param)('source')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_b = typeof integration_orchestration_dto_1.WebhookIngestDto !== "undefined" && integration_orchestration_dto_1.WebhookIngestDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], TestIntegrationOrchestrationE2eController.prototype, "ingestWebhook", null);
TestIntegrationOrchestrationE2eController = __decorate([
    (0, common_1.Controller)('foundation/integration-orchestration'),
    __param(0, (0, common_1.Inject)(integration_orchestration_service_1.IntegrationOrchestrationService)),
    __metadata("design:paramtypes", [typeof (_a = typeof integration_orchestration_service_1.IntegrationOrchestrationService !== "undefined" && integration_orchestration_service_1.IntegrationOrchestrationService) === "function" ? _a : Object])
], TestIntegrationOrchestrationE2eController);
(0, node_test_1.default)('e2e: repeated webhook delivery returns duplicate on second request', async () => {
    const prismaMock = createPrismaMock();
    const audits = [];
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
//# sourceMappingURL=integration-orchestration.e2e.test%202.js.map