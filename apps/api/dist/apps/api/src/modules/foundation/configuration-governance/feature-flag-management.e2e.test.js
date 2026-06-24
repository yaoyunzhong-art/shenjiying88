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
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const trust_governance_service_1 = require("../trust-governance/trust-governance.service");
const configuration_governance_dto_1 = require("./configuration-governance.dto");
const configuration_governance_service_1 = require("./configuration-governance.service");
function createFeatureFlagPrismaMock() {
    const flags = [];
    const prisma = {
        featureFlag: {
            findFirst: async ({ where }) => flags.find((flag) => flag.key === where.key &&
                flag.scopeType === where.scopeType &&
                flag.tenantId === (where.tenantId ?? null) &&
                flag.brandId === (where.brandId ?? null) &&
                flag.storeId === (where.storeId ?? null) &&
                flag.marketProfileId === (where.marketProfileId ?? null)) ?? null,
            findMany: async ({ where } = {}) => flags
                .filter((flag) => {
                if (where?.key && flag.key !== where.key)
                    return false;
                if (where?.OR?.length) {
                    return where.OR.some((scope) => {
                        if (flag.scopeType !== scope.scopeType)
                            return false;
                        if ('tenantId' in scope && flag.tenantId !== (scope.tenantId ?? null))
                            return false;
                        if ('brandId' in scope && flag.brandId !== (scope.brandId ?? null))
                            return false;
                        if ('storeId' in scope && flag.storeId !== (scope.storeId ?? null))
                            return false;
                        return true;
                    });
                }
                return true;
            })
                .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
            create: async ({ data }) => {
                const now = new Date();
                const flag = {
                    id: `flag_${flags.length + 1}`,
                    key: data.key,
                    name: data.name,
                    scopeType: data.scopeType,
                    tenantId: data.tenantId ?? null,
                    brandId: data.brandId ?? null,
                    storeId: data.storeId ?? null,
                    marketProfileId: data.marketProfileId ?? null,
                    status: data.status,
                    strategy: data.strategy,
                    enabled: data.enabled,
                    percentage: data.percentage ?? null,
                    allowList: data.allowList,
                    conditions: data.conditions ?? null,
                    metadata: data.metadata,
                    startsAt: data.startsAt ?? null,
                    endsAt: data.endsAt ?? null,
                    createdAt: now,
                    updatedAt: now
                };
                flags.push(flag);
                return flag;
            },
            update: async ({ where, data }) => {
                const flag = flags.find((item) => item.id === where.id);
                if (!flag) {
                    throw new Error(`Feature flag not found: ${where.id}`);
                }
                flag.name = data.name;
                flag.status = data.status;
                flag.strategy = data.strategy;
                flag.enabled = data.enabled;
                flag.percentage = data.percentage ?? null;
                flag.allowList = data.allowList;
                flag.conditions = data.conditions ?? null;
                flag.metadata = data.metadata;
                flag.startsAt = data.startsAt ?? null;
                flag.endsAt = data.endsAt ?? null;
                flag.updatedAt = new Date();
                return flag;
            }
        },
        configEntry: {
            findMany: async () => []
        },
        secretAsset: {
            findMany: async () => []
        }
    };
    return {
        prisma,
        flags
    };
}
let TestFeatureFlagManagementController = class TestFeatureFlagManagementController {
    configurationGovernanceService;
    constructor(configurationGovernanceService) {
        this.configurationGovernanceService = configurationGovernanceService;
    }
    saveFlag(body) {
        return this.configurationGovernanceService.saveFeatureFlag(body);
    }
    listFlagRecords(query) {
        return this.configurationGovernanceService.listPersistedFeatureFlags({
            tenantId: query.tenantId ?? 'tenant-demo',
            brandId: query.brandId,
            storeId: query.storeId,
            marketCode: query.marketCode
        }, query.subjectKey);
    }
    evaluateFlag(flagKey, query) {
        return this.configurationGovernanceService.evaluateFeatureFlag(flagKey, {
            tenantId: query.tenantId ?? 'tenant-demo',
            brandId: query.brandId,
            storeId: query.storeId,
            marketCode: query.marketCode
        }, query.subjectKey);
    }
};
__decorate([
    (0, common_1.Post)('feature-flags'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof configuration_governance_dto_1.PersistFeatureFlagDto !== "undefined" && configuration_governance_dto_1.PersistFeatureFlagDto) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], TestFeatureFlagManagementController.prototype, "saveFlag", null);
__decorate([
    (0, common_1.Get)('feature-flag-records'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof configuration_governance_dto_1.FeatureFlagQueryDto !== "undefined" && configuration_governance_dto_1.FeatureFlagQueryDto) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], TestFeatureFlagManagementController.prototype, "listFlagRecords", null);
__decorate([
    (0, common_1.Get)('feature-flags/:flagKey'),
    __param(0, (0, common_1.Param)('flagKey')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_d = typeof configuration_governance_dto_1.FeatureFlagQueryDto !== "undefined" && configuration_governance_dto_1.FeatureFlagQueryDto) === "function" ? _d : Object]),
    __metadata("design:returntype", void 0)
], TestFeatureFlagManagementController.prototype, "evaluateFlag", null);
TestFeatureFlagManagementController = __decorate([
    (0, common_1.Controller)('foundation/configuration-governance'),
    __param(0, (0, common_1.Inject)(configuration_governance_service_1.ConfigurationGovernanceService)),
    __metadata("design:paramtypes", [typeof (_a = typeof configuration_governance_service_1.ConfigurationGovernanceService !== "undefined" && configuration_governance_service_1.ConfigurationGovernanceService) === "function" ? _a : Object])
], TestFeatureFlagManagementController);
(0, node_test_1.default)('e2e: manages feature flags and validates persisted rollout decisions', async () => {
    const { prisma, flags } = createFeatureFlagPrismaMock();
    const audits = [];
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestFeatureFlagManagementController],
        providers: [
            {
                provide: prisma_service_1.PrismaService,
                useValue: prisma
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
                provide: configuration_governance_service_1.ConfigurationGovernanceService,
                useFactory: (prismaService, trustGovernanceService) => new configuration_governance_service_1.ConfigurationGovernanceService(prismaService, trustGovernanceService),
                inject: [prisma_service_1.PrismaService, trust_governance_service_1.TrustGovernanceService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    try {
        const created = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/configuration-governance/feature-flags').send({
            tenantId: 'tenant-demo',
            key: 'new-loyalty-center',
            name: '新积分中心',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'ALLOW_LIST',
            enabled: true,
            allowList: ['vip-user-1'],
            description: '只给白名单会员灰度'
        });
        const createdPayload = created.body.data ?? created.body;
        strict_1.default.equal(created.statusCode, 201);
        strict_1.default.equal(createdPayload.status, 'created');
        strict_1.default.equal(createdPayload.record.key, 'new-loyalty-center');
        const evaluatedAllow = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/new-loyalty-center')
            .query({ tenantId: 'tenant-demo', subjectKey: 'vip-user-1' });
        const allowPayload = evaluatedAllow.body.data ?? evaluatedAllow.body;
        strict_1.default.equal(evaluatedAllow.statusCode, 200);
        strict_1.default.equal(allowPayload.enabled, true);
        strict_1.default.equal(allowPayload.rolloutPercentage, 100);
        strict_1.default.equal(allowPayload.source, 'prisma');
        const evaluatedDeny = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/new-loyalty-center')
            .query({ tenantId: 'tenant-demo', subjectKey: 'visitor-2' });
        const denyPayload = evaluatedDeny.body.data ?? evaluatedDeny.body;
        strict_1.default.equal(evaluatedDeny.statusCode, 200);
        strict_1.default.equal(denyPayload.enabled, false);
        strict_1.default.equal(denyPayload.rolloutPercentage, 0);
        const listed = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flag-records')
            .query({ tenantId: 'tenant-demo', subjectKey: 'vip-user-1' });
        const listedPayload = listed.body.data ?? listed.body;
        strict_1.default.equal(listed.statusCode, 200);
        strict_1.default.equal(Array.isArray(listedPayload), true);
        strict_1.default.equal(listedPayload[0]?.key, 'new-loyalty-center');
        strict_1.default.equal(listedPayload[0]?.enabled, true);
        strict_1.default.equal(flags.length, 1);
        strict_1.default.deepEqual(audits, ['foundation.feature-flag.created']);
    }
    finally {
        await app.close();
    }
});
async function buildFeatureFlagApp(audits = []) {
    const { prisma } = createFeatureFlagPrismaMock();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestFeatureFlagManagementController],
        providers: [
            { provide: prisma_service_1.PrismaService, useValue: prisma },
            {
                provide: trust_governance_service_1.TrustGovernanceService,
                useValue: {
                    recordAudit: async (eventType) => {
                        audits.push(eventType);
                        return { auditId: `audit_${audits.length}`, eventType };
                    }
                }
            },
            {
                provide: configuration_governance_service_1.ConfigurationGovernanceService,
                useFactory: (prismaService, trustGovernanceService) => new configuration_governance_service_1.ConfigurationGovernanceService(prismaService, trustGovernanceService),
                inject: [prisma_service_1.PrismaService, trust_governance_service_1.TrustGovernanceService]
            }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return { app, prisma };
}
(0, node_test_1.default)('e2e: feature flag evaluate returns 404 when no flag persisted', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/unknown-flag')
            .query({ tenantId: 'tenant-demo' });
        strict_1.default.equal(res.statusCode, 404);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: feature flag with PERCENTAGE strategy rolls out based on subjectKey hash', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'half-rollout',
            name: 'half rollout',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'PERCENTAGE',
            enabled: true,
            percentage: 50,
            allowList: []
        });
        const a = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/half-rollout')
            .query({ tenantId: 'tenant-demo', subjectKey: 'user-A' });
        const b = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/half-rollout')
            .query({ tenantId: 'tenant-demo', subjectKey: 'user-B' });
        const c = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/half-rollout')
            .query({ tenantId: 'tenant-demo', subjectKey: 'user-C' });
        const enabled = [a, b, c].map((r) => {
            const data = r.body.data ?? r.body;
            return data.enabled;
        });
        strict_1.default.ok(enabled.includes(true));
        strict_1.default.ok(enabled.includes(false));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: feature flag INACTIVE status always returns disabled', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'paused-flag',
            name: 'paused',
            scopeType: 'TENANT',
            status: 'PAUSED',
            strategy: 'ALLOW_LIST',
            enabled: true,
            allowList: ['user-X']
        });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/paused-flag')
            .query({ tenantId: 'tenant-demo', subjectKey: 'user-X' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.enabled, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: feature flag records listing returns empty array when no flags exist', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flag-records')
            .query({ tenantId: 'tenant-demo' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.deepEqual(data, []);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: feature flag listPersistedFeatureFlags returns flags created via saveFeatureFlag', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'list-test',
            name: 'list test',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'ALLOW_LIST',
            enabled: true,
            allowList: ['user-1', 'user-2']
        });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flag-records')
            .query({ tenantId: 'tenant-demo', subjectKey: 'user-1' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0]?.key, 'list-test');
        strict_1.default.equal(data[0]?.enabled, true);
    }
    finally {
        await app.close();
    }
});
// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-1 补强：feature-flag D-E2E 覆盖更多策略/边界场景
// ──────────────────────────────────────────────────────────────────────────
(0, node_test_1.default)('e2e phase-5: feature flag with ALL strategy evaluates enabled for all subjects', async () => {
    const audits = [];
    const { app } = await buildFeatureFlagApp(audits);
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'all-on',
            name: 'all on',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'ALL',
            enabled: true,
            allowList: []
        });
        const subjects = ['user-A', 'user-B', 'user-C'];
        for (const subject of subjects) {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/foundation/configuration-governance/feature-flags/all-on')
                .query({ tenantId: 'tenant-demo', subjectKey: subject });
            const data = res.body.data ?? res.body;
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(data.enabled, true, `expected enabled for subject=${subject}`);
            strict_1.default.equal(data.rolloutPercentage, 100);
        }
        strict_1.default.ok(audits.includes('foundation.feature-flag.created'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: feature flag with NONE strategy always disabled', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'all-off',
            name: 'all off',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'NONE',
            enabled: false,
            allowList: []
        });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/all-off')
            .query({ tenantId: 'tenant-demo', subjectKey: 'any-user' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.enabled, false);
        strict_1.default.equal(data.rolloutPercentage, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: feature flag with zero percentage and empty allowList returns disabled', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'zero-rollout',
            name: 'zero rollout',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'PERCENTAGE',
            enabled: true,
            percentage: 0,
            allowList: []
        });
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/zero-rollout')
            .query({ tenantId: 'tenant-demo', subjectKey: 'random-user' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(data.enabled, false);
        strict_1.default.equal(data.rolloutPercentage, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: feature flag update mutates status from ACTIVE to PAUSED via save', async () => {
    const { app, prisma } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'toggle-flag',
            name: 'toggle flag',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'ALL',
            enabled: true,
            allowList: []
        });
        const before = await prisma.featureFlag.findFirst({
            where: { key: 'toggle-flag', scopeType: 'TENANT', tenantId: 'tenant-demo' }
        });
        strict_1.default.equal(before?.status, 'ACTIVE');
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'toggle-flag',
            name: 'toggle flag v2',
            scopeType: 'TENANT',
            status: 'PAUSED',
            strategy: 'ALL',
            enabled: false,
            allowList: []
        });
        const after = await prisma.featureFlag.findFirst({
            where: { key: 'toggle-flag', scopeType: 'TENANT', tenantId: 'tenant-demo' }
        });
        strict_1.default.equal(after?.status, 'PAUSED');
        strict_1.default.equal(after?.enabled, false);
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/toggle-flag')
            .query({ tenantId: 'tenant-demo', subjectKey: 'any' });
        const data = res.body.data ?? res.body;
        strict_1.default.equal(data.enabled, false);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: feature flag save persists BRAND scope flag with brandId field', async () => {
    const { app, prisma } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            brandId: 'brand-x',
            key: 'brand-x-flag',
            name: 'brand x flag',
            scopeType: 'BRAND',
            status: 'ACTIVE',
            strategy: 'ALL',
            enabled: true,
            allowList: []
        });
        const persisted = await prisma.featureFlag.findFirst({
            where: { key: 'brand-x-flag', scopeType: 'BRAND', tenantId: 'tenant-demo', brandId: 'brand-x' }
        });
        strict_1.default.ok(persisted, 'expected brand-x-flag persisted in prisma');
        strict_1.default.equal(persisted.brandId, 'brand-x');
        strict_1.default.equal(persisted.scopeType, 'BRAND');
        strict_1.default.equal(persisted.enabled, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: feature flag ALLOW_LIST with multi-subject returns enabled for members', async () => {
    const { app } = await buildFeatureFlagApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/configuration-governance/feature-flags')
            .send({
            tenantId: 'tenant-demo',
            key: 'vip-feature',
            name: 'vip feature',
            scopeType: 'TENANT',
            status: 'ACTIVE',
            strategy: 'ALLOW_LIST',
            enabled: true,
            allowList: ['vip-A', 'vip-B']
        });
        for (const subject of ['vip-A', 'vip-B']) {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/foundation/configuration-governance/feature-flags/vip-feature')
                .query({ tenantId: 'tenant-demo', subjectKey: subject });
            const data = res.body.data ?? res.body;
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(data.enabled, true, `expected enabled for ${subject}`);
        }
        const denied = await (0, supertest_1.default)(app.getHttpServer())
            .get('/foundation/configuration-governance/feature-flags/vip-feature')
            .query({ tenantId: 'tenant-demo', subjectKey: 'normal-user' });
        const deniedData = denied.body.data ?? denied.body;
        strict_1.default.equal(denied.statusCode, 200);
        strict_1.default.equal(deniedData.enabled, false);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=feature-flag-management.e2e.test.js.map