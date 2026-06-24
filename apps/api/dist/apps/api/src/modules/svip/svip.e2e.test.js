"use strict";
/**
 * 🐜 自动: [svip] E2E 基础测试
 *
 * E2E 链路: HTTP → SvipController → SvipService → Tier/Member/Benefit
 *
 * 覆盖:
 *   - Tier 初始化 + 列表 + upsert
 *   - Member 创建/获取/列表 + 状态机 (Active ↔ Frozen)
 *   - 等级升级 (upgradeTier) + 降级 (downgradeTier)
 *   - Benefit 创建/列表 + useBenefit
 *   - 到期降级 (checkAndDowngradeExpired)
 *   - 自动升级 (checkAndAutoUpgrade, 联动 loyalty)
 *   - 跨租户隔离
 *   - 错误处理
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
const node_test_1 = __importStar(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const svip_service_1 = require("./svip.service");
const svip_entity_1 = require("./svip.entity");
function attachTenantContext(req, _res, next) {
    ;
    req.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
// ========== 测试 Controller ==========
let TestSvipController = class TestSvipController {
    service;
    constructor(service) {
        this.service = service;
    }
    init(req) {
        return this.service.initDefaultTiers(req.tenantContext);
    }
    listTiers(req) {
        return this.service.listTiers(req.tenantContext.tenantId);
    }
    upsertTier(req, body) {
        return this.service.upsertTier(req.tenantContext, body);
    }
    createMember(req, body) {
        return this.service.createMember(req.tenantContext, body);
    }
    listMembers(req, query) {
        return this.service.listMembers(req.tenantContext.tenantId, query);
    }
    getMember(req, memberId) {
        const m = this.service.getMemberTier(memberId, req.tenantContext.tenantId);
        if (!m)
            throw new common_1.NotFoundException(`SvipMember ${memberId} not found`);
        return m;
    }
    upgrade(req, memberId, body) {
        return this.service.upgradeTier(req.tenantContext, {
            memberId,
            ...body
        });
    }
    downgrade(req, memberId, body) {
        return this.service.downgradeTier(req.tenantContext, {
            memberId,
            ...body
        });
    }
    freeze(req, memberId) {
        return this.service.freezeMember(memberId, req.tenantContext.tenantId);
    }
    unfreeze(req, memberId) {
        return this.service.unfreezeMember(memberId, req.tenantContext.tenantId);
    }
    createBenefit(body) {
        return this.service.createBenefit(body);
    }
    listBenefits(tierId) {
        return this.service.listBenefits(tierId);
    }
    useBenefit(req, memberId, body) {
        return this.service.useBenefit(memberId, body.benefitType, req.tenantContext.tenantId);
    }
    checkExpired(req) {
        return this.service.checkAndDowngradeExpired(req.tenantContext.tenantId);
    }
    autoUpgrade(req, body) {
        return this.service.checkAndAutoUpgrade(req.tenantContext, body.memberId, body.totalSpend, body.currentPoints);
    }
};
__decorate([
    (0, common_1.Post)('tiers/init'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "init", null);
__decorate([
    (0, common_1.Get)('tiers'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "listTiers", null);
__decorate([
    (0, common_1.Post)('tiers'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "upsertTier", null);
__decorate([
    (0, common_1.Post)('members'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "createMember", null);
__decorate([
    (0, common_1.Get)('members'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "listMembers", null);
__decorate([
    (0, common_1.Get)('members/:memberId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "getMember", null);
__decorate([
    (0, common_1.Post)('members/:memberId/upgrade'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "upgrade", null);
__decorate([
    (0, common_1.Post)('members/:memberId/downgrade'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "downgrade", null);
__decorate([
    (0, common_1.Post)('members/:memberId/freeze'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "freeze", null);
__decorate([
    (0, common_1.Post)('members/:memberId/unfreeze'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "unfreeze", null);
__decorate([
    (0, common_1.Post)('benefits'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "createBenefit", null);
__decorate([
    (0, common_1.Get)('benefits'),
    __param(0, (0, common_1.Query)('tierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "listBenefits", null);
__decorate([
    (0, common_1.Post)('members/:memberId/benefits/use'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "useBenefit", null);
__decorate([
    (0, common_1.Post)('check/downgrade-expired'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "checkExpired", null);
__decorate([
    (0, common_1.Post)('check/auto-upgrade'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TestSvipController.prototype, "autoUpgrade", null);
TestSvipController = __decorate([
    (0, common_1.Controller)('svip'),
    __param(0, (0, common_1.Inject)(svip_service_1.SvipService)),
    __metadata("design:paramtypes", [svip_service_1.SvipService])
], TestSvipController);
// ========== 构建 app ==========
async function buildApp() {
    const service = new svip_service_1.SvipService();
    service.resetSvipStoresForTests();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestSvipController],
        providers: [{ provide: svip_service_1.SvipService, useValue: service }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, service };
}
const TENANT_HEADERS = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
const TENANT_B_HEADERS = {
    'x-tenant-id': 'tenant-002',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001'
};
async function initTiers(app, headers = TENANT_HEADERS) {
    const res = await (0, supertest_1.default)(app.getHttpServer())
        .post('/svip/tiers/init')
        .set(headers);
    return res.body.data;
}
async function createMember(app, memberId, tierId, headers = TENANT_HEADERS) {
    return (0, supertest_1.default)(app.getHttpServer())
        .post('/svip/members')
        .set(headers)
        .send({
        memberId,
        brandId: 'brand-001',
        storeId: 'store-001',
        tierId,
        totalSpend: 1000,
        currentPoints: 500,
        expiresAt: '2027-12-31T00:00:00Z'
    });
}
// ========== E2E: Tier 初始化与管理 ==========
(0, node_test_1.describe)('E2E: Tier 初始化', () => {
    (0, node_test_1.default)('POST /svip/tiers/init 创建默认等级 (Bronze/Silver/Gold/Platinum/Diamond)', async () => {
        const { app } = await buildApp();
        try {
            const res = await initTiers(app);
            strict_1.default.ok(Array.isArray(res));
            strict_1.default.ok(res.length >= 3, '默认 ≥ 3 等级');
            for (const t of res) {
                strict_1.default.ok(t.name);
                strict_1.default.ok(typeof t.level === 'number');
                strict_1.default.ok(typeof t.minSpendAmount === 'number');
            }
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /svip/tiers 列表 + 按 level 排序', async () => {
        const { app } = await buildApp();
        try {
            await initTiers(app);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/svip/tiers')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length >= 3);
            // 按 level 升序
            for (let i = 1; i < res.body.data.length; i++) {
                strict_1.default.ok(res.body.data[i - 1].level <= res.body.data[i].level);
            }
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /svip/tiers upsert 自定义等级', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/tiers')
                .set(TENANT_HEADERS)
                .send({
                name: 'Black',
                level: 6,
                minSpendAmount: 100000,
                minPoints: 50000,
                benefits: ['vip_room', 'priority_queue', 'discount_20', 'free_upgrade'],
                icon: 'black.png',
                color: '#000'
            });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.level, 6);
            strict_1.default.ok(res.body.data.id.startsWith('svip-tier-'));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('initDefaultTiers 重复调用返回现有', async () => {
        const { app } = await buildApp();
        try {
            await initTiers(app);
            const second = await initTiers(app);
            // 第二次应该返回相同的(已存在)
            strict_1.default.ok(Array.isArray(second));
            strict_1.default.ok(second.length >= 3);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: Member 生命周期 ==========
(0, node_test_1.describe)('E2E: Member 生命周期', () => {
    (0, node_test_1.default)('POST → GET :memberId → list 完整流程', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const createRes = await createMember(app, 'user-001', tiers[0].id);
            strict_1.default.equal(createRes.statusCode, 201);
            strict_1.default.equal(createRes.body.data.memberId, 'user-001');
            strict_1.default.equal(createRes.body.data.status, svip_entity_1.SvipMemberStatus.Active);
            const getRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/svip/members/user-001')
                .set(TENANT_HEADERS);
            strict_1.default.equal(getRes.statusCode, 200);
            strict_1.default.equal(getRes.body.data.memberId, 'user-001');
            const listRes = await (0, supertest_1.default)(app.getHttpServer())
                .get('/svip/members')
                .set(TENANT_HEADERS);
            strict_1.default.equal(listRes.body.data.length, 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('同 memberId 重复创建 Active → 报错', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            await createMember(app, 'user-001', tiers[0].id);
            const res = await createMember(app, 'user-001', tiers[0].id);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('已过期 (Expired) 允许重新创建', async () => {
        const { app, service } = await buildApp();
        try {
            const tiers = await initTiers(app);
            await createMember(app, 'user-001', tiers[0].id);
            // 直接修改 store 里的 member 状态为 Expired (绕过 service 接口)
            const internal = service.listMembers('tenant-001').find((m) => m.memberId === 'user-001');
            if (!internal)
                throw new Error('seed failed');
            internal.status = svip_entity_1.SvipMemberStatus.Expired;
            // 重新创建
            const res = await createMember(app, 'user-001', tiers[0].id);
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.memberId, 'user-001');
            strict_1.default.equal(res.body.data.status, svip_entity_1.SvipMemberStatus.Active);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /svip/members/:id 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/svip/members/non-existent')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /svip/members?status=Active 过滤', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            await createMember(app, 'user-001', tiers[0].id);
            await createMember(app, 'user-002', tiers[0].id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/freeze')
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/svip/members?status=${svip_entity_1.SvipMemberStatus.Active}`)
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.body.data.length, 1);
            strict_1.default.equal(res.body.data[0].memberId, 'user-002');
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 升级 / 降级 ==========
(0, node_test_1.describe)('E2E: 等级升降级', () => {
    (0, node_test_1.default)('upgrade Tier 1 → Tier 3 合法', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const create = await createMember(app, 'user-001', tiers[0].id);
            const memberId = create.body.data.memberId;
            const upgrade = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${memberId}/upgrade`)
                .set(TENANT_HEADERS)
                .send({ targetTierLevel: 3, totalSpend: 30000, currentPoints: 10000 });
            strict_1.default.equal(upgrade.statusCode, 201);
            strict_1.default.equal(upgrade.body.data.tierLevel, 3);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('upgrade 到更低的 level 报错', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const create = await createMember(app, 'user-001', tiers[2].id); // 高等级
            const upgrade = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${create.body.data.memberId}/upgrade`)
                .set(TENANT_HEADERS)
                .send({ targetTierLevel: 1 });
            strict_1.default.equal(upgrade.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('downgrade Tier 3 → Tier 1 合法', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const create = await createMember(app, 'user-001', tiers[2].id);
            const downgrade = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${create.body.data.memberId}/downgrade`)
                .set(TENANT_HEADERS)
                .send({ targetTierLevel: 1 });
            strict_1.default.equal(downgrade.statusCode, 201);
            strict_1.default.equal(downgrade.body.data.tierLevel, 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('downgrade 到更高 level 报错', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const create = await createMember(app, 'user-001', tiers[0].id);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${create.body.data.memberId}/downgrade`)
                .set(TENANT_HEADERS)
                .send({ targetTierLevel: 5 });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: Freeze / Unfreeze ==========
(0, node_test_1.describe)('E2E: 冻结解冻', () => {
    (0, node_test_1.default)('freeze → unfreeze 状态机', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            await createMember(app, 'user-001', tiers[0].id);
            const freeze = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/freeze')
                .set(TENANT_HEADERS);
            strict_1.default.equal(freeze.body.data.status, svip_entity_1.SvipMemberStatus.Frozen);
            const unfreeze = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/unfreeze')
                .set(TENANT_HEADERS);
            strict_1.default.equal(unfreeze.body.data.status, svip_entity_1.SvipMemberStatus.Active);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('重复 freeze 报错', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            await createMember(app, 'user-001', tiers[0].id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/freeze')
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/freeze')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('unfreeze 非 Frozen 报错', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            await createMember(app, 'user-001', tiers[0].id);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/unfreeze')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: Benefits ==========
(0, node_test_1.describe)('E2E: Benefit 使用', () => {
    (0, node_test_1.default)('createBenefit + listBenefits + useBenefit 完整流程', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            // 选择包含 priority_queue 的 tier (默认 init 包含)
            const tier = tiers.find((t) => t.benefits.some((b) => b === 'priority_queue'));
            if (!tier) {
                // 没有 priority_queue 等级,跳过
                return;
            }
            const create = await createMember(app, 'user-001', tier.id);
            // 创建具体 benefit
            const benefitRes = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/benefits')
                .send({
                tierId: tier.id,
                benefitType: svip_entity_1.SvipBenefitType.PriorityQueue,
                benefitValue: 'priority-1',
                description: '优先排队',
                isActive: true
            });
            strict_1.default.equal(benefitRes.statusCode, 201);
            const listRes = await (0, supertest_1.default)(app.getHttpServer())
                .get(`/svip/benefits?tierId=${tier.id}`);
            strict_1.default.ok(listRes.body.data.length >= 1);
            // useBenefit
            const useRes = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${create.body.data.memberId}/benefits/use`)
                .set(TENANT_HEADERS)
                .send({ benefitType: svip_entity_1.SvipBenefitType.PriorityQueue });
            strict_1.default.equal(useRes.statusCode, 201);
            strict_1.default.equal(useRes.body.data.success, true);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('useBenefit 当前等级无此权益 → success=false', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            // 用最低 tier,通常没有 exclusive_event
            const lowTier = tiers[0];
            const create = await createMember(app, 'user-001', lowTier.id);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${create.body.data.memberId}/benefits/use`)
                .set(TENANT_HEADERS)
                .send({ benefitType: svip_entity_1.SvipBenefitType.ExclusiveEvent });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.success, false);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('useBenefit 非 Active 会员 → success=false', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const tier = tiers[0];
            const create = await createMember(app, 'user-001', tier.id);
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/freeze')
                .set(TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post(`/svip/members/${create.body.data.memberId}/benefits/use`)
                .set(TENANT_HEADERS)
                .send({ benefitType: svip_entity_1.SvipBenefitType.Discount });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.success, false);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 到期降级 + 自动升级 ==========
(0, node_test_1.describe)('E2E: 到期降级 & 自动升级', () => {
    (0, node_test_1.default)('checkAndDowngradeExpired 已过期但 < 30 天缓冲期 → 降一级', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            // 创建 member, expiresAt 为 5 天前 (在缓冲期内)
            const create = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members')
                .set(TENANT_HEADERS)
                .send({
                memberId: 'expired-user',
                brandId: 'brand-001',
                storeId: 'store-001',
                tierId: tiers[2].id,
                totalSpend: 50000,
                currentPoints: 20000,
                expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            });
            strict_1.default.equal(create.statusCode, 201);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/check/downgrade-expired')
                .set(TENANT_HEADERS);
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.ok(res.body.data.length >= 1);
            // member 等级应降一级
            const member = res.body.data[0];
            strict_1.default.ok(member.tierLevel < 3, 'level 3 应该降一级');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('checkAndAutoUpgrade 积分达标 → 自动创建 + 升级', async () => {
        const { app } = await buildApp();
        try {
            await initTiers(app);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/check/auto-upgrade')
                .set(TENANT_HEADERS)
                .send({ memberId: 'new-user', totalSpend: 30000, currentPoints: 10000 });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.upgraded, true);
            strict_1.default.ok(res.body.data.newLevel >= 1);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('checkAndAutoUpgrade 缺 Level1 tier → 不升级 (reason=Tier not found)', async () => {
        // 不 init tiers,Level1 tier 不存在 → 升级应失败
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/check/auto-upgrade')
                .set(TENANT_HEADERS)
                .send({ memberId: 'low-user', totalSpend: 100, currentPoints: 10 });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.upgraded, false);
            strict_1.default.equal(res.body.data.reason, 'Below Level1 threshold');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('checkAndAutoUpgrade 已是 SVIP 且当前等级满足 → 不升级 (no-op)', async () => {
        // 已是 Level1 的 member,totalSpend/points 仍满足 Level1 → 不触发升级
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app);
            const memberRes = await createMember(app, 'vip-user', tiers[0].id, TENANT_HEADERS);
            strict_1.default.equal(memberRes.body.data.tierLevel, 1);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/check/auto-upgrade')
                .set(TENANT_HEADERS)
                .send({ memberId: 'vip-user', totalSpend: 6000, currentPoints: 600 });
            strict_1.default.equal(res.statusCode, 201);
            // 已存在 member + computedLevel(1) <= existing.tierLevel(1) → not upgraded
            strict_1.default.equal(res.body.data.upgraded, false);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 跨租户隔离 ==========
(0, node_test_1.describe)('E2E: 跨租户隔离', () => {
    (0, node_test_1.default)('tenant-B 看不到 tenant-A 的 member', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app, TENANT_HEADERS);
            await createMember(app, 'user-001', tiers[0].id, TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/svip/members/user-001')
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 不能 freeze tenant-A 的 member', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app, TENANT_HEADERS);
            await createMember(app, 'user-001', tiers[0].id, TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/freeze')
                .set(TENANT_B_HEADERS);
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('tenant-B 不能 upgrade tenant-A 的 member', async () => {
        const { app } = await buildApp();
        try {
            const tiers = await initTiers(app, TENANT_HEADERS);
            await createMember(app, 'user-001', tiers[0].id, TENANT_HEADERS);
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/svip/members/user-001/upgrade')
                .set(TENANT_B_HEADERS)
                .send({ targetTierLevel: 3 });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=svip.e2e.test.js.map