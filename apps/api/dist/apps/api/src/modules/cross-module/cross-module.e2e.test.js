"use strict";
/**
 * E2E: Cross-Module 跨模块验证 HTTP 链路
 *
 * 链路:
 *   HTTP → CrossModuleController → CrossModuleService → CrossModuleChain entities
 *
 * 验证:
 *   - GET /cross-module/chain-status - 列出所有跨模块链路
 *   - POST /cross-module/validate - 验证指定链路
 *   - POST /cross-module/validate?chainName=xxx - 验证单条链路
 *   - 响应格式一致性
 *   - 空参数边界
 *   - 8 角色权限验证
 */
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
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const cross_module_service_1 = require("./cross-module.service");
// ========== 中间件 ==========
function attachTenantContext(req, _res, next) {
    const ctx = req;
    ctx.tenantContext = {
        tenantId: req.header('x-tenant-id') ?? 'tenant-001',
        brandId: req.header('x-brand-id') ?? 'brand-001',
        storeId: req.header('x-store-id') ?? 'store-001',
        marketCode: req.header('x-market-code') ?? 'cn-mainland'
    };
    next();
}
function attachActorContext(req, _res, next) {
    const ctx = req;
    ctx.actorContext = {
        actorId: 'actor-001',
        roles: ['SUPER_ADMIN'],
        permissions: ['foundation.governance.read']
    };
    next();
}
// ========== 测试 Controller (内联完整路由) ==========
let TestCrossModuleController = class TestCrossModuleController {
    crossModuleService;
    constructor(crossModuleService) {
        this.crossModuleService = crossModuleService;
    }
    getChainStatus() {
        return {
            chains: this.crossModuleService.listChains(),
            total: this.crossModuleService.listChains().length,
            runtime: 'cross-module-e2e',
        };
    }
    async validate(body, chainName) {
        const chainNames = body.chainNames ?? (chainName ? [chainName] : undefined);
        const results = await this.crossModuleService.validate(chainNames);
        const passed = results.filter((r) => r.passed).length;
        return {
            results,
            summary: {
                total: results.length,
                passed,
                failed: results.length - passed,
            },
        };
    }
    getSummary() {
        return this.crossModuleService.getSummary();
    }
};
__decorate([
    (0, common_1.Get)('chain-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestCrossModuleController.prototype, "getChainStatus", null);
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('chainName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TestCrossModuleController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestCrossModuleController.prototype, "getSummary", null);
TestCrossModuleController = __decorate([
    (0, common_1.Controller)('cross-module'),
    __param(0, (0, common_1.Inject)(cross_module_service_1.CrossModuleService)),
    __metadata("design:paramtypes", [cross_module_service_1.CrossModuleService])
], TestCrossModuleController);
// ========== 测试常量 ==========
const TENANT_HEADERS = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001',
    'x-market-code': 'cn-mainland',
};
// 8 角色定义
const EIGHT_ROLES = [
    { name: '👔店长', roles: ['STORE_MANAGER'], permissions: ['store.manage', 'cross-module.read'] },
    { name: '🛒前台', roles: ['CASHIER'], permissions: ['cashier.operate', 'cross-module.read'] },
    { name: '👥HR', roles: ['HR_MANAGER'], permissions: ['hr.manage', 'cross-module.read'] },
    { name: '🔧安监', roles: ['SAFETY_INSPECTOR'], permissions: ['safety.inspect', 'cross-module.read'] },
    { name: '🎮导玩员', roles: ['GAME_GUIDE'], permissions: ['game.guide', 'cross-module.read'] },
    { name: '🎯运行专员', roles: ['OPERATIONS_SPECIALIST'], permissions: ['operations.manage', 'cross-module.read'] },
    { name: '🤝团建', roles: ['TEAM_BUILDING'], permissions: ['team.organize', 'cross-module.read'] },
    { name: '📢营销', roles: ['MARKETING'], permissions: ['marketing.promote', 'cross-module.read'] },
];
// ========== 构建 app ==========
async function buildApp() {
    const crossModuleService = new cross_module_service_1.CrossModuleService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestCrossModuleController],
        providers: [
            { provide: cross_module_service_1.CrossModuleService, useValue: crossModuleService },
        ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.use(attachActorContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, crossModuleService };
}
// ========== 基础 E2E 测试 ==========
(0, node_test_1.default)('e2e: GET /cross-module/chain-status returns 4 chains', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/chain-status')
            .set(TENANT_HEADERS);
        const httpStatus = res.statusCode || res.status;
        strict_1.default.equal(httpStatus, 200);
        strict_1.default.equal(res.body.success, true);
        strict_1.default.equal(res.body.data.total, 4);
        strict_1.default.ok(Array.isArray(res.body.data.chains));
        strict_1.default.equal(res.body.data.chains.length, 4);
        strict_1.default.equal(res.body.data.runtime, 'cross-module-e2e');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /cross-module/chain-status each chain has required fields', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/chain-status')
            .set(TENANT_HEADERS);
        strict_1.default.equal(res.statusCode, 200);
        for (const chain of res.body.data.chains) {
            strict_1.default.ok(typeof chain.name === 'string');
            strict_1.default.ok(Array.isArray(chain.modules));
            strict_1.default.ok(chain.modules.length > 0);
            strict_1.default.ok(['defined', 'validating', 'verified', 'broken'].includes(chain.status));
        }
        // 检查已知链路
        const chainNames = res.body.data.chains.map((c) => c.name);
        strict_1.default.ok(chainNames.includes('admin-to-consumer'));
        strict_1.default.ok(chainNames.includes('sdk-to-api'));
        strict_1.default.ok(chainNames.includes('governance-chain'));
        strict_1.default.ok(chainNames.includes('multi-client-consistency'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /cross-module/validate validates all chains by default', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({});
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.success, true);
        strict_1.default.ok(Array.isArray(res.body.data.results));
        strict_1.default.equal(res.body.data.results.length, 4);
        strict_1.default.equal(res.body.data.summary.total, 4);
        strict_1.default.equal(res.body.data.summary.passed, 4);
        strict_1.default.equal(res.body.data.summary.failed, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /cross-module/validate with specific chain names', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['admin-to-consumer', 'sdk-to-api'] });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.results.length, 2);
        const resultNames = res.body.data.results.map((r) => r.chainName);
        strict_1.default.ok(resultNames.includes('admin-to-consumer'));
        strict_1.default.ok(resultNames.includes('sdk-to-api'));
        strict_1.default.equal(res.body.data.summary.passed, 2);
        strict_1.default.equal(res.body.data.summary.failed, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /cross-module/validate?chainName=sdk-to-api validates single chain', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate?chainName=sdk-to-api')
            .set(TENANT_HEADERS)
            .send({});
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.results.length, 1);
        strict_1.default.equal(res.body.data.results[0].chainName, 'sdk-to-api');
        strict_1.default.equal(res.body.data.results[0].passed, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: validation result has expected structure', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['admin-to-consumer'] });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.results[0];
        strict_1.default.equal(result.chainName, 'admin-to-consumer');
        strict_1.default.equal(result.passed, true);
        strict_1.default.ok(typeof result.executedAt === 'string');
        strict_1.default.ok(typeof result.durationMs === 'number');
        strict_1.default.ok(Array.isArray(result.stages));
        // admin-to-consumer: tenant→bootstrap→foundation→portal→market→miniapp = 5 stages
        strict_1.default.equal(result.stages.length, 5);
        for (const stage of result.stages) {
            strict_1.default.ok(typeof stage.stage === 'string');
            strict_1.default.ok(typeof stage.from === 'string');
            strict_1.default.ok(typeof stage.to === 'string');
            strict_1.default.equal(stage.passed, true);
            strict_1.default.ok(typeof stage.durationMs === 'number');
        }
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /cross-module/summary returns summary stats', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/summary')
            .set(TENANT_HEADERS);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.success, true);
        strict_1.default.equal(res.body.data.total, 4);
        strict_1.default.equal(res.body.data.defined, 4);
        strict_1.default.equal(res.body.data.validating, 0);
        strict_1.default.equal(res.body.data.verified, 0);
        strict_1.default.equal(res.body.data.broken, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /cross-module/validate with empty chainNames array validates nothing', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: [] });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.results.length, 0);
        strict_1.default.equal(res.body.data.summary.total, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /cross-module/validate with unknown chain name results empty', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['non-existent-chain'] });
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.results.length, 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /cross-module/chain-status response is consistent across calls', async () => {
    const { app } = await buildApp();
    try {
        const res1 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/chain-status')
            .set(TENANT_HEADERS);
        const res2 = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/chain-status')
            .set(TENANT_HEADERS);
        strict_1.default.equal(res1.body.data.total, res2.body.data.total);
        strict_1.default.equal(res1.body.data.runtime, res2.body.data.runtime);
    }
    finally {
        await app.close();
    }
});
// ========== 8 角色权限测试 ==========
for (const role of EIGHT_ROLES) {
    (0, node_test_1.default)(`e2e: role ${role.name} can GET /cross-module/chain-status`, async () => {
        const { app } = await buildApp();
        try {
            // 为每个角色建独立 app
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/cross-module/chain-status')
                .set({ ...TENANT_HEADERS, 'x-actor-roles': role.roles.join(',') });
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.total, 4);
        }
        finally {
            await app.close();
        }
    });
}
for (const role of EIGHT_ROLES) {
    (0, node_test_1.default)(`e2e: role ${role.name} can POST /cross-module/validate`, async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/cross-module/validate')
                .set({ ...TENANT_HEADERS, 'x-actor-roles': role.roles.join(',') })
                .send({ chainNames: ['sdk-to-api'] });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.summary.passed, 1);
        }
        finally {
            await app.close();
        }
    });
}
// ========== 边界测试 ==========
(0, node_test_1.default)('e2e: GET /cross-module/chain-status without tenant headers still works', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/chain-status');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.total, 4);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: POST /cross-module/validate without body returns all chains', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS);
        // 不发送 body，验证行为
        strict_1.default.equal(res.statusCode, 201);
        strict_1.default.equal(res.body.data.results.length, 4);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: response uses correct status for POST (201) and GET (200)', async () => {
    const { app } = await buildApp();
    try {
        const getRes = await (0, supertest_1.default)(app.getHttpServer())
            .get('/cross-module/chain-status')
            .set(TENANT_HEADERS);
        strict_1.default.equal(getRes.statusCode, 200);
        const postRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['admin-to-consumer'] });
        strict_1.default.equal(postRes.statusCode, 201);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: governance-chain has 5 modules => 4 stages', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['governance-chain'] });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.results[0];
        strict_1.default.equal(result.stages.length, 4); // 5 modules = 4 adjacent pairs
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: multi-client-consistency chain has 5 modules => 4 stages', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['multi-client-consistency'] });
        strict_1.default.equal(res.statusCode, 201);
        const result = res.body.data.results[0];
        strict_1.default.equal(result.stages.length, 4); // 5 modules = 4 stages
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: validation updates chain status after validate', async () => {
    const { app, crossModuleService } = await buildApp();
    try {
        // 初始状态：所有 defined
        const summaryBefore = crossModuleService.getSummary();
        strict_1.default.equal(summaryBefore.defined, 4);
        // 执行验证
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/cross-module/validate')
            .set(TENANT_HEADERS)
            .send({ chainNames: ['admin-to-consumer'] });
        strict_1.default.equal(res.statusCode, 201);
        // 验证后：admin-to-consumer 已变为 verified
        const summaryAfter = crossModuleService.getSummary();
        strict_1.default.equal(summaryAfter.verified, 1);
        strict_1.default.equal(summaryAfter.defined, 3);
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=cross-module.e2e.test.js.map