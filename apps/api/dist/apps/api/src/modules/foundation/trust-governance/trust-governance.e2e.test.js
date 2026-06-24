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
function createRateLimitPrismaMock() {
    const policies = [];
    const ledgers = [];
    const prisma = {
        rateLimitPolicy: {
            findUnique: async ({ where }) => policies.find((policy) => policy.code === where.code) ?? null,
            findUniqueOrThrow: async ({ where }) => {
                const policy = policies.find((item) => item.code === where.code);
                if (!policy) {
                    throw new Error(`Policy not found: ${where.code}`);
                }
                return policy;
            },
            create: async ({ data }) => {
                const policy = {
                    id: `policy_${policies.length + 1}`,
                    code: data.code,
                    scopeType: data.scopeType,
                    period: data.period,
                    limit: data.limit,
                    burstLimit: data.burstLimit ?? null,
                    dimensionKeys: data.dimensionKeys,
                    algorithm: data.algorithm,
                    metadata: data.metadata
                };
                policies.push(policy);
                return policy;
            }
        },
        quotaLedger: {
            findMany: undefined,
            findUnique: async ({ where }) => ledgers.find((ledger) => ledger.rateLimitPolicyId === where.rateLimitPolicyId_subjectKey_resetAt.rateLimitPolicyId &&
                ledger.subjectKey === where.rateLimitPolicyId_subjectKey_resetAt.subjectKey &&
                ledger.resetAt.getTime() === where.rateLimitPolicyId_subjectKey_resetAt.resetAt.getTime()) ?? null,
            findUniqueOrThrow: async ({ where }) => {
                const ledger = ledgers.find((item) => item.rateLimitPolicyId === where.rateLimitPolicyId_subjectKey_resetAt.rateLimitPolicyId &&
                    item.subjectKey === where.rateLimitPolicyId_subjectKey_resetAt.subjectKey &&
                    item.resetAt.getTime() === where.rateLimitPolicyId_subjectKey_resetAt.resetAt.getTime());
                if (!ledger) {
                    throw new Error('Ledger not found');
                }
                return ledger;
            },
            create: async ({ data }) => {
                const now = new Date();
                const ledger = {
                    id: `ledger_${ledgers.length + 1}`,
                    rateLimitPolicyId: data.rateLimitPolicyId,
                    subjectKey: data.subjectKey,
                    period: data.period,
                    consumed: data.consumed,
                    remaining: data.remaining,
                    resetAt: data.resetAt,
                    metadata: data.metadata,
                    createdAt: now,
                    updatedAt: now
                };
                ledgers.push(ledger);
                return ledger;
            },
            update: async ({ where, data }) => {
                const ledger = ledgers.find((item) => item.id === where.id);
                if (!ledger) {
                    throw new Error(`Ledger not found: ${where.id}`);
                }
                ledger.consumed = data.consumed;
                ledger.remaining = data.remaining;
                ledger.metadata = data.metadata;
                ledger.updatedAt = new Date();
                return ledger;
            }
        },
        $transaction: async (callback) => callback(prisma)
    };
    return {
        prisma,
        policies,
        ledgers
    };
}
let TestTrustGovernanceRateLimitController = class TestTrustGovernanceRateLimitController {
    trustGovernanceService;
    constructor(trustGovernanceService) {
        this.trustGovernanceService = trustGovernanceService;
    }
    check(body) {
        return this.trustGovernanceService.evaluateRateLimit(body);
    }
};
__decorate([
    (0, common_1.Post)('rate-limit/check'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.RateLimitCheckDto]),
    __metadata("design:returntype", void 0)
], TestTrustGovernanceRateLimitController.prototype, "check", null);
TestTrustGovernanceRateLimitController = __decorate([
    (0, common_1.Controller)('foundation/trust-governance'),
    __param(0, (0, common_1.Inject)(trust_governance_service_1.TrustGovernanceService)),
    __metadata("design:paramtypes", [trust_governance_service_1.TrustGovernanceService])
], TestTrustGovernanceRateLimitController);
async function buildRateLimitApp() {
    const { prisma, ledgers } = createRateLimitPrismaMock();
    prisma.quotaLedger.findMany = async ({ where } = {}) => {
        if (!where?.tenantId)
            return ledgers;
        return ledgers.filter((l) => Boolean(l.subjectKey));
    };
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestTrustGovernanceRateLimitController],
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
    return { app, prisma, ledgers };
}
(0, node_test_1.default)('e2e: rate limit endpoint persists ledger and blocks after threshold', async () => {
    const { prisma, policies, ledgers } = createRateLimitPrismaMock();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestTrustGovernanceRateLimitController],
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
        const first = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/check').send({
            scopeKey: 'tenant-demo:login:127.0.0.1',
            limit: 1,
            windowSeconds: 60,
            blockSeconds: 120
        });
        const firstPayload = first.body.data ?? first.body;
        strict_1.default.equal(first.statusCode, 201);
        strict_1.default.equal(firstPayload.allowed, true);
        strict_1.default.equal(firstPayload.remaining, 0);
        const second = await (0, supertest_1.default)(app.getHttpServer()).post('/foundation/trust-governance/rate-limit/check').send({
            scopeKey: 'tenant-demo:login:127.0.0.1',
            limit: 1,
            windowSeconds: 60,
            blockSeconds: 120
        });
        const secondPayload = second.body.data ?? second.body;
        strict_1.default.equal(second.statusCode, 201);
        strict_1.default.equal(secondPayload.allowed, false);
        strict_1.default.equal(secondPayload.remaining, 0);
        strict_1.default.ok(secondPayload.retryAfterSeconds > 0);
        strict_1.default.equal(policies.length, 1);
        strict_1.default.equal(ledgers.length, 1);
        strict_1.default.equal(ledgers[0]?.consumed, 2);
        strict_1.default.match(JSON.stringify(ledgers[0]?.metadata ?? {}), /blockedUntil/);
    }
    finally {
        await app.close();
    }
});
// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-1 补强：trust-governance rate-limit 变体 + 集成路径
// ──────────────────────────────────────────────────────────────────────────
(0, node_test_1.default)('e2e phase-5: rate-limit ledger has scopeKey containing policy name', async () => {
    const { app, prisma } = await buildRateLimitApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/trust-governance/rate-limit/check')
            .send({
            tenantId: 'tenant-scope',
            actorId: 'actor-scope',
            scopeKey: 'foundation.feature-flag.created',
            limit: 5,
            windowSeconds: 60
        });
        const payload = res.body.data ?? res.body;
        strict_1.default.equal(payload.allowed, true);
        const ledgers = await prisma.quotaLedger.findMany({ where: { tenantId: 'tenant-scope' } });
        strict_1.default.ok(ledgers.length >= 1);
        strict_1.default.ok(ledgers[0]?.subjectKey?.includes('foundation.feature-flag.created'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: rate-limit ledger for different action keeps independent counter', async () => {
    const { app, prisma } = await buildRateLimitApp();
    try {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/trust-governance/rate-limit/check')
            .send({
            tenantId: 'tenant-iso',
            actorId: 'actor-iso',
            scopeKey: 'foundation.config-entry.updated',
            limit: 5,
            windowSeconds: 60
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/foundation/trust-governance/rate-limit/check')
            .send({
            tenantId: 'tenant-iso',
            actorId: 'actor-iso',
            scopeKey: 'foundation.feature-flag.created',
            limit: 5,
            windowSeconds: 60
        });
        const ledgers = await prisma.quotaLedger.findMany({ where: { tenantId: 'tenant-iso' } });
        strict_1.default.ok(ledgers.length >= 2);
        const actions = new Set(ledgers.map((l) => l.subjectKey));
        strict_1.default.ok(actions.size >= 2);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: rate-limit at exactly limit threshold still allowed on final call', async () => {
    const { app } = await buildRateLimitApp();
    try {
        const limit = 3;
        const results = [];
        for (let i = 0; i < limit; i += 1) {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/foundation/trust-governance/rate-limit/check')
                .send({
                tenantId: 'tenant-edge',
                actorId: 'actor-edge',
                scopeKey: 'foundation.secret.rotated',
                limit,
                windowSeconds: 3600
            });
            const payload = res.body.data ?? res.body;
            results.push(payload.allowed);
        }
        strict_1.default.deepEqual(results, [true, true, true]);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e phase-5: rate-limit ledger without tenant returns empty list', async () => {
    const { app, prisma } = await buildRateLimitApp();
    try {
        const ledgers = await prisma.quotaLedger.findMany({
            where: { tenantId: 'tenant-nonexistent' }
        });
        strict_1.default.deepEqual(ledgers, []);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=trust-governance.e2e.test.js.map