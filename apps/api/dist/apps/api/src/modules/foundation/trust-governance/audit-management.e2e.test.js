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
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const trust_governance_dto_1 = require("./trust-governance.dto");
const trust_governance_service_1 = require("./trust-governance.service");
function createAuditManagementPrismaMock() {
    const logs = [
        {
            id: 'audit_1',
            tenantId: 'tenant-demo',
            action: 'foundation.secret.rotated',
            operatorId: 'sec-admin',
            sourceChannel: 'configuration-governance',
            requestId: 'req-1',
            metadata: { riskLevel: 'high' },
            payload: { key: 'lyt-webhook' },
            createdAt: new Date('2026-06-12T08:00:00.000Z')
        },
        {
            id: 'audit_2',
            tenantId: 'tenant-demo',
            action: 'foundation.feature-flag.created',
            operatorId: 'ops-user',
            sourceChannel: 'configuration-governance',
            requestId: 'req-2',
            metadata: { riskLevel: 'medium' },
            payload: { key: 'new-loyalty-center' },
            createdAt: new Date('2026-06-12T09:00:00.000Z')
        },
        {
            id: 'audit_3',
            tenantId: 'tenant-premium',
            action: 'foundation.config-entry.updated',
            operatorId: 'ops-user',
            sourceChannel: 'configuration-governance',
            requestId: 'req-3',
            metadata: { riskLevel: 'low' },
            payload: { key: 'paymentChannels' },
            createdAt: new Date('2026-06-12T10:00:00.000Z')
        }
    ];
    return {
        prisma: {
            auditLog: {
                findMany: async ({ where, take } = {}) => logs
                    .filter((log) => {
                    if (where?.tenantId && log.tenantId !== where.tenantId)
                        return false;
                    if (where?.action && log.action !== where.action)
                        return false;
                    if (where?.sourceChannel && log.sourceChannel !== where.sourceChannel)
                        return false;
                    if (where?.requestId && log.requestId !== where.requestId)
                        return false;
                    if (where?.operatorId && log.operatorId !== where.operatorId)
                        return false;
                    if (where?.createdAt?.gte && log.createdAt.getTime() < where.createdAt.gte.getTime())
                        return false;
                    if (where?.createdAt?.lte && log.createdAt.getTime() > where.createdAt.lte.getTime())
                        return false;
                    return true;
                })
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, take ?? logs.length)
            }
        },
        logs
    };
}
let TestAuditManagementController = class TestAuditManagementController {
    trustGovernanceService;
    constructor(trustGovernanceService) {
        this.trustGovernanceService = trustGovernanceService;
    }
    getAudit(query) {
        return this.trustGovernanceService.getAuditRecords(query);
    }
};
__decorate([
    (0, common_1.Get)('audit'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AuditQueryDto]),
    __metadata("design:returntype", void 0)
], TestAuditManagementController.prototype, "getAudit", null);
TestAuditManagementController = __decorate([
    (0, common_1.Controller)('foundation/trust-governance'),
    __param(0, (0, common_1.Inject)(trust_governance_service_1.TrustGovernanceService)),
    __metadata("design:paramtypes", [trust_governance_service_1.TrustGovernanceService])
], TestAuditManagementController);
(0, node_test_1.default)('e2e: filters audit records by actor risk level and time window', async () => {
    const { prisma } = createAuditManagementPrismaMock();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuditManagementController],
        providers: [
            {
                provide: prisma_service_1.PrismaService,
                useValue: prisma
            },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useFactory: (prismaService) => new trust_governance_service_1.TrustGovernanceService(prismaService),
                inject: [prisma_service_1.PrismaService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const filtered = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({
            tenantId: 'tenant-demo',
            actorId: 'sec-admin',
            riskLevel: 'high',
            from: '2026-06-12T07:30:00.000Z',
            to: '2026-06-12T08:30:00.000Z'
        });
        const payload = filtered.body.data ?? filtered.body;
        strict_1.default.equal(filtered.statusCode, 200);
        strict_1.default.equal(payload.length, 1);
        strict_1.default.equal(payload[0]?.eventType, 'foundation.secret.rotated');
        strict_1.default.equal(payload[0]?.actorId, 'sec-admin');
        strict_1.default.equal(payload[0]?.riskLevel, 'high');
    }
    finally {
        await app.close();
    }
});
async function buildAuditApp() {
    const { prisma } = createAuditManagementPrismaMock();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuditManagementController],
        providers: [
            { provide: prisma_service_1.PrismaService, useValue: prisma },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useFactory: (prismaService) => new trust_governance_service_1.TrustGovernanceService(prismaService),
                inject: [prisma_service_1.PrismaService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return { app };
}
(0, node_test_1.default)('e2e: audit endpoint without filters returns all records sorted desc by createdAt', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/foundation/trust-governance/audit');
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 3);
        strict_1.default.equal(data[0]?.eventType, 'foundation.config-entry.updated');
        strict_1.default.equal(data[2]?.eventType, 'foundation.secret.rotated');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: audit endpoint filters by tenantId only', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ tenantId: 'tenant-demo' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 2);
        strict_1.default.ok(data.every((r) => r.tenantId === 'tenant-demo'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: audit endpoint filters by sourceChannel returns expected records', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ sourceChannel: 'configuration-governance' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 3);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: audit endpoint with no matching filter returns empty list', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ tenantId: 'tenant-unknown' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: audit endpoint filters by riskLevel=low returns tenant-premium record', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ riskLevel: 'low' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.riskLevel, 'low');
        strict_1.default.equal(data[0]?.eventType, 'foundation.config-entry.updated');
    }
    finally {
        await app.close();
    }
});
// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-1 补强：覆盖更多 audit filter + recordAudit 集成路径
// ──────────────────────────────────────────────────────────────────────────
(0, node_test_1.default)('e2e phase-5: audit endpoint filters by single action returns exact match', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ action: 'foundation.feature-flag.created' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.eventType, 'foundation.feature-flag.created');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: audit endpoint filters by requestId returns single record', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ requestId: 'req-2' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.eventType, 'foundation.feature-flag.created');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: audit endpoint limit query param caps returned records', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ limit: 1 });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.eventType, 'foundation.config-entry.updated');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: audit endpoint from=to boundary time window matches inclusive', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({
            from: '2026-06-12T09:00:00.000Z',
            to: '2026-06-12T09:00:00.000Z'
        });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(data.length >= 1);
        strict_1.default.ok(data.every((r) => r.eventType === 'foundation.feature-flag.created'));
    }
    finally {
        await app.close();
    }
});
function buildAuditAppWithRecord() {
    const { prisma, logs } = createAuditManagementPrismaMock();
    const auditLogCreate = async ({ data }) => {
        const record = {
            id: `audit_${logs.length + 1}`,
            tenantId: data.tenantId ?? 'tenant-demo',
            action: data.action,
            operatorId: data.operatorId ?? 'foundation-system',
            sourceChannel: data.sourceChannel ?? null,
            requestId: data.requestId ?? null,
            metadata: data.metadata ?? {},
            payload: data.payload ?? {},
            createdAt: new Date()
        };
        logs.push(record);
        return record;
    };
    prisma.auditLog.create = auditLogCreate;
    return { prisma, logs };
}
(0, node_test_1.default)('e2e phase-5: recordAudit + getAuditRecords roundtrip persists and queries back', async () => {
    const { prisma } = buildAuditAppWithRecord();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuditManagementController],
        providers: [
            { provide: prisma_service_1.PrismaService, useValue: prisma },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useFactory: (prismaService) => new trust_governance_service_1.TrustGovernanceService(prismaService),
                inject: [prisma_service_1.PrismaService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const svc = moduleRef.get(trust_governance_service_1.TrustGovernanceService);
        await svc.recordAudit('foundation.secret.rotated', { key: 'lyt-new-key', approvalTicket: 'APR-NEW-001' }, { tenantId: 'tenant-demo', actorId: 'sec-admin-2', source: 'configuration-governance', riskLevel: 'high' });
        const records = await svc.getAuditRecords({
            tenantId: 'tenant-demo',
            actorId: 'sec-admin-2',
            approvalTicket: 'APR-NEW-001'
        });
        strict_1.default.ok(records.length >= 1);
        const found = records.find((r) => r.details.approvalTicket === 'APR-NEW-001');
        strict_1.default.ok(found);
        strict_1.default.equal(found.eventType, 'foundation.secret.rotated');
        strict_1.default.equal(found.riskLevel, 'high');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: recordAudit masks PII fields in payload before persisting', async () => {
    const { prisma } = buildAuditAppWithRecord();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuditManagementController],
        providers: [
            { provide: prisma_service_1.PrismaService, useValue: prisma },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useFactory: (prismaService) => new trust_governance_service_1.TrustGovernanceService(prismaService),
                inject: [prisma_service_1.PrismaService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const svc = moduleRef.get(trust_governance_service_1.TrustGovernanceService);
        const created = await svc.recordAudit('foundation.member.profile.updated', {
            actorEmail: 'user@example.com',
            actorPassword: 'super-secret-123',
            apiKey: 'sk-test-1234567890abcdef',
            description: 'profile rotate',
            approvalTicket: 'APR-PII-001'
        }, { tenantId: 'tenant-demo', actorId: 'sec-pii', source: 'member', riskLevel: 'medium' });
        const payloadStr = JSON.stringify(created.details);
        strict_1.default.equal(payloadStr.includes('super-secret-123'), false);
        strict_1.default.equal(payloadStr.includes('sk-test-1234567890abcdef'), false);
        strict_1.default.equal(payloadStr.includes('user@example.com'), false);
        strict_1.default.ok(payloadStr.includes('profile rotate'));
    }
    finally {
        await app.close();
    }
});
// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-2 🐜4 补强：audit-management D-E2E 集成路径 (recordAudit + 复合过滤)
// ──────────────────────────────────────────────────────────────────────────
(0, node_test_1.default)('e2e phase-5: audit endpoint filters by combined tenantId + action returns exact match', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({
            tenantId: 'tenant-demo',
            action: 'foundation.feature-flag.created'
        });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.tenantId, 'tenant-demo');
        strict_1.default.equal(data[0]?.eventType, 'foundation.feature-flag.created');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: audit endpoint filters by operatorId returns expected records', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({ actorId: 'ops-user' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 2);
        strict_1.default.ok(data.every((r) => r.actorId === 'ops-user'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: recordAudit with high riskLevel persists riskLevel metadata correctly', async () => {
    const { prisma } = buildAuditAppWithRecord();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAuditManagementController],
        providers: [
            { provide: prisma_service_1.PrismaService, useValue: prisma },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useFactory: (prismaService) => new trust_governance_service_1.TrustGovernanceService(prismaService),
                inject: [prisma_service_1.PrismaService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const svc = moduleRef.get(trust_governance_service_1.TrustGovernanceService);
        const created = await svc.recordAudit('foundation.secret.deleted', { key: 'lyt-secret', tenantId: 'tenant-demo' }, { tenantId: 'tenant-demo', actorId: 'sec-admin', source: 'configuration-governance', riskLevel: 'high' });
        strict_1.default.equal(created.eventType, 'foundation.secret.deleted');
        strict_1.default.equal(created.riskLevel, 'high');
        strict_1.default.equal(created.actorId, 'sec-admin');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: audit listing with all filters combined returns single precise record', async () => {
    const { app } = await buildAuditApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/trust-governance/audit')
            .query({
            tenantId: 'tenant-premium',
            actorId: 'ops-user',
            riskLevel: 'low',
            action: 'foundation.config-entry.updated'
        });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.tenantId, 'tenant-premium');
        strict_1.default.equal(data[0]?.actorId, 'ops-user');
        strict_1.default.equal(data[0]?.riskLevel, 'low');
        strict_1.default.equal(data[0]?.eventType, 'foundation.config-entry.updated');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=audit-management.e2e.test.js.map