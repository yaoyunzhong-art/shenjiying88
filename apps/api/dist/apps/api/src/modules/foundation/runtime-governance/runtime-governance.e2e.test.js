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
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const runtime_governance_dto_1 = require("./runtime-governance.dto");
const runtime_governance_service_1 = require("./runtime-governance.service");
function createRuntimeGovernanceHarness() {
    const events = [];
    const approvals = [];
    const prisma = {
        governanceApproval: {
            findUnique: async ({ where }) => {
                if (where.approvalTicket) {
                    return approvals.find((approval) => approval.approvalTicket === where.approvalTicket) ?? null;
                }
                if (where.id) {
                    return approvals.find((approval) => approval.id === where.id) ?? null;
                }
                return null;
            },
            create: async ({ data }) => {
                const now = new Date();
                const record = {
                    id: `apr_${approvals.length + 1}`,
                    approvalTicket: data.approvalTicket ?? null,
                    operation: data.operation,
                    resourceType: data.resourceType,
                    resourceKey: data.resourceKey,
                    scopeType: data.scopeType ?? client_1.FoundationScopeType.PLATFORM,
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    required: data.required ?? false,
                    requestedBy: data.requestedBy ?? null,
                    status: data.status ?? client_1.ApprovalStatus.PENDING,
                    version: data.version ?? 1,
                    decisionNote: data.decisionNote ?? null,
                    decidedBy: null,
                    decidedAt: null,
                    summary: data.summary ?? null,
                    createdAt: now,
                    updatedAt: now
                };
                approvals.push(record);
                return record;
            },
            update: async ({ where, data }) => {
                const index = approvals.findIndex((approval) => approval.id === where.id);
                if (index === -1) {
                    throw new Error(`Approval ${where.id} not found`);
                }
                const existing = approvals[index];
                const updated = {
                    ...existing,
                    approvalTicket: data.approvalTicket ?? existing.approvalTicket,
                    operation: data.operation ?? existing.operation,
                    resourceType: data.resourceType ?? existing.resourceType,
                    resourceKey: data.resourceKey ?? existing.resourceKey,
                    status: data.status ?? existing.status,
                    version: data.version ?? existing.version,
                    decisionNote: data.decisionNote !== undefined ? data.decisionNote : existing.decisionNote,
                    decidedBy: data.decidedBy !== undefined ? data.decidedBy : existing.decidedBy,
                    decidedAt: data.decidedAt !== undefined ? data.decidedAt : existing.decidedAt,
                    summary: data.summary !== undefined ? data.summary : existing.summary,
                    updatedAt: new Date()
                };
                approvals[index] = updated;
                return updated;
            }
        },
        domainEvent: {
            findMany: async ({ where } = {}) => events.filter((event) => (!where?.aggregateType || event.aggregateType === where.aggregateType) &&
                (!where?.aggregateId || event.aggregateId === where.aggregateId))
        }
    };
    const integrationOrchestrationService = {
        publishEvent: async (eventType, payload, options) => {
            const existing = options?.idempotencyKey
                ? events.find((event) => event.idempotencyKey === options.idempotencyKey)
                : null;
            if (existing) {
                return {
                    status: 'duplicate',
                    envelope: null,
                    persistedEventId: existing.id
                };
            }
            const event = {
                id: `evt_${events.length + 1}`,
                eventType,
                aggregateType: 'runtime-governance',
                aggregateId: options?.aggregateId ?? `aggregate-${events.length + 1}`,
                idempotencyKey: options?.idempotencyKey ?? null,
                payload,
                createdAt: new Date(Date.UTC(2026, 5, 12, 0, 0, events.length))
            };
            events.push(event);
            return {
                status: 'accepted',
                envelope: null,
                persistedEventId: event.id
            };
        }
    };
    const trustGovernanceService = {
        evaluateRateLimit: async ({ scopeKey }) => ({
            allowed: true,
            scopeKey,
            limit: 12,
            remaining: 11,
            retryAfterSeconds: 0
        }),
        recordAudit: async () => ({ auditId: 'audit_1' })
    };
    return {
        prisma,
        integrationOrchestrationService,
        trustGovernanceService
    };
}
let TestRuntimeGovernanceController = class TestRuntimeGovernanceController {
    runtimeGovernanceService;
    constructor(runtimeGovernanceService) {
        this.runtimeGovernanceService = runtimeGovernanceService;
    }
    submitAction(body) {
        return this.runtimeGovernanceService.submitAction(body);
    }
    getActionReceipt(receiptCode) {
        return this.runtimeGovernanceService.getActionReceipt(receiptCode);
    }
    syncAction(receiptCode, body) {
        return this.runtimeGovernanceService.syncAction(receiptCode, body);
    }
    recordCallback(receiptCode, body) {
        return this.runtimeGovernanceService.recordCallback(receiptCode, body);
    }
    replayAction(receiptCode, body) {
        return this.runtimeGovernanceService.replayAction(receiptCode, body);
    }
    getOperationsOverview() {
        return this.runtimeGovernanceService.getOperationsOverview();
    }
};
__decorate([
    (0, common_1.Post)('actions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [runtime_governance_dto_1.SubmitRuntimeGovernanceActionDto]),
    __metadata("design:returntype", void 0)
], TestRuntimeGovernanceController.prototype, "submitAction", null);
__decorate([
    (0, common_1.Get)('actions/:receiptCode'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestRuntimeGovernanceController.prototype, "getActionReceipt", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/sync'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.SyncRuntimeGovernanceActionDto]),
    __metadata("design:returntype", void 0)
], TestRuntimeGovernanceController.prototype, "syncAction", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/callback'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.RecordRuntimeGovernanceCallbackDto]),
    __metadata("design:returntype", void 0)
], TestRuntimeGovernanceController.prototype, "recordCallback", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/replay'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.ReplayRuntimeGovernanceActionDto]),
    __metadata("design:returntype", void 0)
], TestRuntimeGovernanceController.prototype, "replayAction", null);
__decorate([
    (0, common_1.Get)('operations-overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestRuntimeGovernanceController.prototype, "getOperationsOverview", null);
TestRuntimeGovernanceController = __decorate([
    (0, common_1.Controller)('foundation/runtime-governance'),
    __param(0, (0, common_1.Inject)(runtime_governance_service_1.RuntimeGovernanceService)),
    __metadata("design:paramtypes", [runtime_governance_service_1.RuntimeGovernanceService])
], TestRuntimeGovernanceController);
(0, node_test_1.default)('e2e: runtime governance endpoints expose submit, sync, query, callback, and replay closure', async () => {
    const harness = createRuntimeGovernanceHarness();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestRuntimeGovernanceController],
        providers: [
            {
                provide: runtime_governance_service_1.RuntimeGovernanceService,
                useFactory: () => new runtime_governance_service_1.RuntimeGovernanceService(harness.prisma, harness.integrationOrchestrationService, harness.trustGovernanceService)
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const submit = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'miniapp',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
            payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'miniapp-booking-submit-handler',
            idempotencyKey: 'miniapp-sync:http-001'
        });
        const submitPayload = submit.body.data ?? submit.body;
        strict_1.default.equal(submit.statusCode, 201);
        strict_1.default.equal(submitPayload.state, 'submitted');
        const receipt = await (0, supertest_1.default)(app.getHttpServer()).get(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}`);
        const receiptPayload = receipt.body.data ?? receipt.body;
        strict_1.default.equal(receipt.statusCode, 200);
        strict_1.default.equal(receiptPayload.receiptCode, submitPayload.receiptCode);
        const sync = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
            .send({
            handlerName: 'miniapp-booking-submit-handler',
            ticketCode: submitPayload.ticket.ticketCode,
            idempotencyKey: 'miniapp-handler-sync:http-001'
        });
        const syncPayload = sync.body.data ?? sync.body;
        strict_1.default.equal(sync.statusCode, 201);
        strict_1.default.equal(syncPayload.callback.callbackStatus, 'awaiting-callback');
        strict_1.default.equal(syncPayload.events.length, 2);
        const duplicateSync = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/sync`)
            .send({
            handlerName: 'miniapp-booking-submit-handler',
            ticketCode: submitPayload.ticket.ticketCode,
            idempotencyKey: 'miniapp-handler-sync:http-001'
        });
        const duplicateSyncPayload = duplicateSync.body.data ?? duplicateSync.body;
        strict_1.default.equal(duplicateSync.statusCode, 201);
        strict_1.default.equal(duplicateSyncPayload.events.length, 3);
        strict_1.default.equal(duplicateSyncPayload.events[2]?.status, 'duplicate');
        strict_1.default.equal(duplicateSyncPayload.events[2]?.eventType, 'runtime-governance.handler.sync.duplicate');
        const callback = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/callback`)
            .send({
            callbackStatus: 'callback-recorded',
            ackToken: `${submitPayload.receiptCode}-ACK`,
            lastEvent: 'HANDLER_COMPLETED',
            summary: 'handler completed',
            idempotencyKey: 'miniapp-callback:http-001'
        });
        const callbackPayload = callback.body.data ?? callback.body;
        strict_1.default.equal(callback.statusCode, 201);
        strict_1.default.equal(callbackPayload.state, 'callback-recorded');
        const replay = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/foundation/runtime-governance/actions/${submitPayload.receiptCode}/replay`)
            .send({
            ledgerKey: callbackPayload.ledger.ledgerKey,
            requestedFrom: 'MINIAPP_RUNTIME',
            ticketCode: callbackPayload.ticket.ticketCode,
            idempotencyKey: 'miniapp-replay:http-001'
        });
        const replayPayload = replay.body.data ?? replay.body;
        strict_1.default.equal(replay.statusCode, 201);
        strict_1.default.equal(replayPayload.state, 'replay-scheduled');
        strict_1.default.equal(replayPayload.events.length, 5);
        const adminSubmit = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'admin-web',
            action: 'runtime-replay',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            payload: { sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-001' },
            payloadSummary: '{"sourceReceiptCode":"ADMIN-WORKBENCH-RUNTIME-REPLAY-001"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'admin-runtime-replay-handler',
            idempotencyKey: 'admin-web:runtime-replay:http-001'
        });
        const adminSubmitPayload = adminSubmit.body.data ?? adminSubmit.body;
        strict_1.default.equal(adminSubmit.statusCode, 201);
        strict_1.default.equal(adminSubmitPayload.app, 'admin-web');
        strict_1.default.equal(adminSubmitPayload.ledger.replayable, true);
        const adminReplay = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/foundation/runtime-governance/actions/${adminSubmitPayload.receiptCode}/replay`)
            .send({
            ledgerKey: adminSubmitPayload.ledger.ledgerKey,
            requestedFrom: 'ADMIN_WEB_RUNTIME',
            ticketCode: adminSubmitPayload.ticket.ticketCode,
            idempotencyKey: 'admin-web:runtime-replay:http-001:replay'
        });
        const adminReplayPayload = adminReplay.body.data ?? adminReplay.body;
        strict_1.default.equal(adminReplay.statusCode, 201);
        strict_1.default.equal(adminReplayPayload.state, 'submitted');
        strict_1.default.equal(adminReplayPayload.approval?.status, 'PENDING');
        strict_1.default.equal(adminReplayPayload.approval?.required, true);
        strict_1.default.equal(typeof adminReplayPayload.approval?.ticket, 'string');
        const tobSubmit = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'tob-web',
            action: 'member-login',
            nextStep: 'CHALLENGE',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/members/session/challenge',
            payload: { loginChannel: 'tenant-portal' },
            payloadSummary: '{"loginChannel":"tenant-portal"}',
            recommendedAction: 'COMPLETE_CHALLENGE',
            handlerName: 'tob-member-login-handler',
            idempotencyKey: 'tob-web:member-login:http-001'
        });
        const tobSubmitPayload = tobSubmit.body.data ?? tobSubmit.body;
        strict_1.default.equal(tobSubmit.statusCode, 201);
        strict_1.default.equal(tobSubmitPayload.app, 'tob-web');
        strict_1.default.equal(tobSubmitPayload.state, 'challenge-issued');
        const storefrontSubmit = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'storefront-web',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { bookingCode: 'STORE-BOOKING-001' },
            payloadSummary: '{"bookingCode":"STORE-BOOKING-001"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'storefront-booking-submit-handler',
            idempotencyKey: 'storefront-web:booking-submit:http-001'
        });
        const storefrontSubmitPayload = storefrontSubmit.body.data ?? storefrontSubmit.body;
        strict_1.default.equal(storefrontSubmit.statusCode, 201);
        strict_1.default.equal(storefrontSubmitPayload.app, 'storefront-web');
        strict_1.default.equal(storefrontSubmitPayload.ledger.replayable, true);
        const storefrontReplay = await (0, supertest_1.default)(app.getHttpServer())
            .post(`/foundation/runtime-governance/actions/${storefrontSubmitPayload.receiptCode}/replay`)
            .send({
            ledgerKey: storefrontSubmitPayload.ledger.ledgerKey,
            requestedFrom: 'STOREFRONT_WEB_RUNTIME',
            ticketCode: storefrontSubmitPayload.ticket.ticketCode,
            idempotencyKey: 'storefront-web:booking-submit:http-001:replay'
        });
        const storefrontReplayPayload = storefrontReplay.body.data ?? storefrontReplay.body;
        strict_1.default.equal(storefrontReplay.statusCode, 201);
        strict_1.default.equal(storefrontReplayPayload.state, 'submitted');
        strict_1.default.equal(storefrontReplayPayload.approval?.status, 'PENDING');
        strict_1.default.equal(storefrontReplayPayload.approval?.required, true);
        strict_1.default.equal(typeof storefrontReplayPayload.approval?.ticket, 'string');
    }
    finally {
        await app.close();
    }
});
async function buildGovernanceApp() {
    const harness = createRuntimeGovernanceHarness();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestRuntimeGovernanceController],
        providers: [
            {
                provide: runtime_governance_service_1.RuntimeGovernanceService,
                useFactory: () => new runtime_governance_service_1.RuntimeGovernanceService(harness.prisma, harness.integrationOrchestrationService, harness.trustGovernanceService)
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return { app, harness };
}
(0, node_test_1.default)('e2e: getActionReceipt returns 404 for unknown receiptCode', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/runtime-governance/actions/UNKNOWN-RECEIPT');
        strict_1.default.equal(res.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: getOperationsOverview returns generatedAt and batchSummary', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/runtime-governance/operations-overview');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(typeof data.generatedAt, 'string');
        strict_1.default.ok(data.batchSummary);
        strict_1.default.equal(typeof data.batchSummary.filteredReceipts, 'number');
        strict_1.default.equal(typeof data.batchSummary.replayableReceipts, 'number');
        strict_1.default.equal(typeof data.batchSummary.governanceAuditReceipts, 'number');
        strict_1.default.equal(typeof data.batchSummary.stalledReceipts, 'number');
        strict_1.default.equal(typeof data.batchSummary.blockedReceipts, 'number');
        strict_1.default.equal(typeof data.batchSummary.highRiskReceipts, 'number');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: syncAction on unknown receiptCode returns 404', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions/UNKNOWN-RECEIPT/sync')
            .send({
            handlerName: 'test-handler',
            ticketCode: 'TCK-1',
            idempotencyKey: 'idem-sync-1'
        });
        strict_1.default.equal(res.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: recordCallback on unknown receiptCode returns 404', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions/UNKNOWN-RECEIPT/callback')
            .send({
            callbackStatus: 'callback-recorded',
            ackToken: 'ACK-1',
            lastEvent: 'HANDLER_COMPLETED',
            summary: 'summary',
            idempotencyKey: 'idem-callback-1'
        });
        strict_1.default.equal(res.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: replayAction on unknown receiptCode returns 404', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions/UNKNOWN-RECEIPT/replay')
            .send({
            ledgerKey: 'ledg-1',
            requestedFrom: 'MINIAPP_RUNTIME',
            ticketCode: 'TCK-1',
            idempotencyKey: 'idem-replay-1'
        });
        strict_1.default.equal(res.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: submitAction with missing required fields is rejected', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/runtime-governance/actions')
            .send({
            app: 'miniapp'
            // 故意缺失 action / nextStep / riskLevel 等必填字段
        });
        // 拒绝：可能是 400 (ValidationPipe) 或 500 (service throw) — 都视为拒绝
        strict_1.default.ok(res.statusCode === 400 || res.statusCode === 500, `expected 400 or 500, got ${res.statusCode}`);
        strict_1.default.notEqual(res.statusCode, 201);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: getOperationsOverview counters are non-negative', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/runtime-governance/operations-overview');
        const data = res.body.data ?? res.body;
        for (const key of [
            'filteredReceipts',
            'replayableReceipts',
            'governanceAuditReceipts',
            'stalledReceipts',
            'blockedReceipts',
            'highRiskReceipts'
        ]) {
            strict_1.default.ok(data.batchSummary[key] >= 0, `${key} should be >= 0`);
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: submitAction returns receiptCode in standard format', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const submit = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'miniapp',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { test: true },
            payloadSummary: '{"test":true}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'test-handler',
            idempotencyKey: 'idem-format-check'
        });
        const data = submit.body.data ?? submit.body;
        strict_1.default.equal(submit.statusCode, 201);
        strict_1.default.ok(typeof data.receiptCode === 'string');
        strict_1.default.ok(data.receiptCode.length > 0);
        strict_1.default.ok(data.ticket);
        strict_1.default.equal(typeof data.ticket.ticketCode, 'string');
        strict_1.default.ok(data.ledger);
        strict_1.default.equal(typeof data.ledger.ledgerKey, 'string');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: submitAction with same idempotencyKey returns the same receipt', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const idempotencyKey = 'idem-dup-check-001';
        const payload = {
            app: 'miniapp',
            action: 'booking-submit',
            nextStep: 'PROCEED',
            riskLevel: 'medium',
            requestEndpoint: '/api/v1/storefront/bookings',
            payload: { test: true },
            payloadSummary: '{"test":true}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'test-handler',
            idempotencyKey
        };
        const first = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send(payload);
        const firstData = first.body.data ?? first.body;
        strict_1.default.equal(first.statusCode, 201);
        const second = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send(payload);
        const secondData = second.body.data ?? second.body;
        strict_1.default.equal(second.statusCode, 201);
        strict_1.default.equal(firstData.receiptCode, secondData.receiptCode);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: getActionReceipt returns complete payload after submit', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const submit = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
            app: 'miniapp',
            action: 'coupon-claim',
            nextStep: 'PROCEED',
            riskLevel: 'low',
            requestEndpoint: '/api/v1/storefront/coupons',
            payload: { memberId: 'm-001' },
            payloadSummary: '{"memberId":"m-001"}',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            handlerName: 'coupon-claim-handler',
            idempotencyKey: 'idem-receipt-check'
        });
        const submitData = submit.body.data ?? submit.body;
        strict_1.default.equal(submit.statusCode, 201);
        const receipt = await (0, supertest_1.default)(app.getHttpServer()).get(`/foundation/runtime-governance/actions/${submitData.receiptCode}`);
        const receiptData = receipt.body.data ?? receipt.body;
        strict_1.default.equal(receipt.statusCode, 200);
        strict_1.default.equal(receiptData.receiptCode, submitData.receiptCode);
        strict_1.default.equal(receiptData.app, 'miniapp');
        strict_1.default.equal(receiptData.action, 'coupon-claim');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: operationsOverview generatedAt is ISO 8601', async () => {
    const { app } = await buildGovernanceApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/runtime-governance/operations-overview');
        const data = res.body.data ?? res.body;
        strict_1.default.match(data.generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=runtime-governance.e2e.test.js.map