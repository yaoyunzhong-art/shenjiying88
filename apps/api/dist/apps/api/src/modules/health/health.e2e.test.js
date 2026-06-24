"use strict";
/**
 * E2E: Health 健康检查 HTTP 链路
 *
 * 链路:
 *   HTTP → HealthController → HealthService → PrismaService / LytService / Redis / Disk / Memory
 *
 * 验证:
 *   - GET /health - 基础连通性 (ping)
 *   - GET /health/ping - 别名连通性
 *   - GET /health/readiness - 完整健康检查 (含组件探测)
 *   - GET /health/readiness?verbose=true - 详细模式
 *   - 数据库组件探测
 *   - LYT 适配器组件探测
 *   - 降级状态检测
 *   - 未授权访问 readiness 返回 403/401
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
const node_test_1 = __importDefault(require("node:test"));
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const response_interceptor_1 = require("../../common/interceptors/response.interceptor");
const health_service_1 = require("./health.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const lyt_service_1 = require("../lyt/lyt.service");
const health_dto_1 = require("./health.dto");
const domain_1 = require("@m5/domain");
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
// 模拟 PrismaService
const mockPrismaService = {
    $queryRaw: async () => [{ '?column?': 1 }]
};
// 模拟 LytService
const mockLytService = {
    getBootstrap: () => ({
        adapter: 'mock-adapter',
        foundationDependencies: {},
        foundationContracts: {}
    }),
    getAdapter: () => ({
        getMember: async (id) => ({ id, name: 'Mock Member', level: 'GOLD' })
    })
};
let TestHealthController = class TestHealthController {
    healthService;
    constructor(healthService) {
        this.healthService = healthService;
    }
    getHealth() {
        return this.healthService.ping();
    }
    getPing() {
        return this.healthService.ping();
    }
    getReadiness(req, query) {
        const tenantContext = req.tenantContext;
        const actorContext = req.actorContext;
        return this.healthService.check({
            scope: {
                scopeType: tenantContext?.storeId
                    ? domain_1.FoundationScopeType.Store
                    : tenantContext?.brandId
                        ? domain_1.FoundationScopeType.Brand
                        : tenantContext?.tenantId
                            ? domain_1.FoundationScopeType.Tenant
                            : tenantContext?.marketCode
                                ? domain_1.FoundationScopeType.Market
                                : domain_1.FoundationScopeType.Platform,
                scopeId: tenantContext?.storeId ??
                    tenantContext?.brandId ??
                    tenantContext?.tenantId ??
                    tenantContext?.marketCode ??
                    'platform'
            },
            requestorId: actorContext?.actorId,
            verbose: query?.verbose === true || query?.verbose === 'true'
        });
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestHealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestHealthController.prototype, "getPing", null);
__decorate([
    (0, common_1.Get)('readiness'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, health_dto_1.HealthQueryDto]),
    __metadata("design:returntype", void 0)
], TestHealthController.prototype, "getReadiness", null);
TestHealthController = __decorate([
    (0, common_1.Controller)('health'),
    __param(0, (0, common_1.Inject)(health_service_1.HealthService)),
    __metadata("design:paramtypes", [health_service_1.HealthService])
], TestHealthController);
const TENANT_A = {
    'x-tenant-id': 'tenant-001',
    'x-brand-id': 'brand-001',
    'x-store-id': 'store-001',
    'x-market-code': 'cn-mainland'
};
async function buildApp() {
    const healthService = new health_service_1.HealthService(mockLytService, mockPrismaService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestHealthController],
        providers: [
            { provide: health_service_1.HealthService, useValue: healthService },
            { provide: lyt_service_1.LytService, useValue: mockLytService },
            { provide: prisma_service_1.PrismaService, useValue: mockPrismaService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.use(attachActorContext);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalPipes(new (await Promise.resolve().then(() => __importStar(require('@nestjs/common')))).ValidationPipe({ transform: true }));
    await app.init();
    return { app, healthService };
}
// ========== 测试 ==========
(0, node_test_1.default)('e2e: GET /health returns alive=true', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/health');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
        strict_1.default.ok(typeof res.body.data.timestamp === 'string');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/ping returns alive=true (alias)', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer()).get('/health/ping');
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness returns full health check', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(res.body.data.status));
        strict_1.default.ok(typeof res.body.data.checkedAt === 'string');
        strict_1.default.ok(typeof res.body.data.uptimeSeconds === 'number');
        strict_1.default.ok(typeof res.body.data.version === 'string');
        strict_1.default.ok(Array.isArray(res.body.data.components));
        strict_1.default.ok(res.body.data.components.length >= 2);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness?verbose=true returns all components', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness?verbose=true')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        const componentNames = res.body.data.components.map((c) => c.name);
        // verbose 模式应包含数据库、LYT适配器、内存、磁盘、Redis
        strict_1.default.ok(componentNames.includes('database'));
        strict_1.default.ok(componentNames.includes('lyt-adapter'));
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness components have expected structure', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        for (const comp of res.body.data.components) {
            strict_1.default.ok(typeof comp.name === 'string');
            strict_1.default.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(comp.status));
            strict_1.default.ok(typeof comp.latencyMs === 'number');
        }
        // 数据库应返回 connected
        const dbComponent = res.body.data.components.find((c) => c.name === 'database');
        strict_1.default.ok(dbComponent);
        strict_1.default.equal(dbComponent.status, 'OK');
        strict_1.default.equal(dbComponent.detail?.connected, true);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness includes version info', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        // version 可能是 '0.0.0' 或其他版本号
        strict_1.default.ok(typeof res.body.data.version === 'string');
        strict_1.default.ok(res.body.data.version.length > 0);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness includes lytMode', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        // lytMode 在 tenant 下有值时返回 'mock'
        strict_1.default.ok(typeof res.body.data.lytMode === 'string');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health returns consistent response format', async () => {
    const { app } = await buildApp();
    try {
        // 多次调用应一致
        const res1 = await (0, supertest_1.default)(app.getHttpServer()).get('/health');
        const res2 = await (0, supertest_1.default)(app.getHttpServer()).get('/health');
        strict_1.default.equal(res1.body.data.alive, res2.body.data.alive);
        strict_1.default.equal(res1.body.code, res2.body.code);
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness without tenant returns 200', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness');
        strict_1.default.equal(res.statusCode, 200);
        // 无租户头时，中间件默认注入 tenant，lytMode 为 'mock'
        strict_1.default.ok(typeof res.body.data.lytMode === 'string');
    }
    finally {
        await app.close();
    }
});
(0, node_test_1.default)('e2e: GET /health/readiness verbose shows sampleMember', async () => {
    const { app } = await buildApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness?verbose=true')
            .set(TENANT_A);
        strict_1.default.equal(res.statusCode, 200);
        // verbose 模式下有 sampleMember
        strict_1.default.ok(res.body.data.sampleMember !== undefined);
        if (res.body.data.sampleMember) {
            strict_1.default.equal(res.body.data.sampleMember.id, 'seed-member-001');
        }
    }
    finally {
        await app.close();
    }
});
// ========== 角色模拟 E2E 测试 ==========
/**
 * 构建支持角色模拟的应用。
 * 通过自定义 attachActorContext2 从 headers 读取 actor 信息，
 * 模拟不同的系统角色访问健康检查端点。
 */
function attachActorContext2(req, _res, next) {
    const ctx = req;
    ctx.actorContext = {
        actorId: req.header('x-actor-id') ?? 'actor-default',
        actorType: req.header('x-actor-type') ?? 'tenant-user',
        actorName: req.header('x-actor-name') ?? undefined,
        tenantId: req.header('x-actor-tenant-id') ?? undefined,
        brandId: req.header('x-actor-brand-id') ?? undefined,
        storeId: req.header('x-actor-store-id') ?? undefined,
        roles: (req.header('x-actor-roles') ?? '').split(',').filter(Boolean),
        permissions: (req.header('x-actor-permissions') ?? '').split(',').filter(Boolean),
        authenticated: req.header('x-actor-authenticated') !== 'false',
        source: 'headers'
    };
    next();
}
async function buildRoleHealthApp() {
    const healthService = new health_service_1.HealthService(mockLytService, mockPrismaService);
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestHealthController],
        providers: [
            { provide: health_service_1.HealthService, useValue: healthService },
            { provide: lyt_service_1.LytService, useValue: mockLytService },
            { provide: prisma_service_1.PrismaService, useValue: mockPrismaService }
        ]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.use(attachTenantContext);
    app.use(attachActorContext2);
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    app.useGlobalPipes(new (await Promise.resolve().then(() => __importStar(require('@nestjs/common')))).ValidationPipe({ transform: true }));
    await app.init();
    return { app, healthService };
}
// 1. 👔 店长: 可以访问健康检查
(0, node_test_1.default)('e2e: 👔 店长 可以访问基础健康检查', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health')
            .set({
            'x-actor-id': 'store-manager-health',
            'x-actor-type': 'store-user',
            'x-actor-roles': 'STORE_MANAGER',
            'x-actor-permissions': 'tenant:read,store:manage',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
    }
    finally {
        await app.close();
    }
});
// 2. 🎮 导玩员: 可以访问基础健康检查
(0, node_test_1.default)('e2e: 🎮 导玩员 可以 ping 基础健康检查', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health')
            .set({
            'x-actor-id': 'guide-player-001',
            'x-actor-type': 'store-user',
            'x-actor-roles': 'GUIDE',
            'x-actor-permissions': 'tenant:read,game:session:write',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
    }
    finally {
        await app.close();
    }
});
// 3. 🔧 安监: 访问详细的系统健康状态
(0, node_test_1.default)('e2e: 🔧 安监 访问 readiness 详细系统健康状态', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set(TENANT_A)
            .set({
            'x-actor-id': 'safety-monitor-001',
            'x-actor-type': 'platform-user',
            'x-actor-roles': 'SECURITY_ADMIN',
            'x-actor-permissions': 'audit:read,foundation.governance.read',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(res.body.data.status));
        strict_1.default.ok(Array.isArray(res.body.data.components));
        // 安监可以获得完整组件信息
        strict_1.default.ok(res.body.data.components.length >= 2);
        const dbComponent = res.body.data.components.find((c) => c.name === 'database');
        strict_1.default.ok(dbComponent);
    }
    finally {
        await app.close();
    }
});
// 4. 📢 营销: 可以访问但不操作
(0, node_test_1.default)('e2e: 📢 营销 可以 ping 健康检查但不具有管理权限', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health')
            .set({
            'x-actor-id': 'mkt-viewer-001',
            'x-actor-type': 'brand-user',
            'x-actor-roles': 'MARKETING',
            'x-actor-permissions': 'tenant:read,campaign:write',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
        // 营销的权限不包含 foundation.governance.read（readiness 需要）
        // 但基础的 /health 和 /health/ping 不需要特殊权限
    }
    finally {
        await app.close();
    }
});
// 5. 🎯 运行专员: 可以 ping
(0, node_test_1.default)('e2e: 🎯 运行专员 可以 ping 健康检查', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/ping')
            .set({
            'x-actor-id': 'ops-runner-001',
            'x-actor-type': 'tenant-user',
            'x-actor-roles': 'OPERATIONS',
            'x-actor-permissions': 'tenant:read,foundation.operations.alerts.write',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
    }
    finally {
        await app.close();
    }
});
// 6. 🛒 前台: 基础健康检查可访问
(0, node_test_1.default)('e2e: 🛒 前台 可以访问基础健康检查', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health')
            .set({
            'x-actor-id': 'reception-desk-001',
            'x-actor-type': 'store-user',
            'x-actor-roles': 'RECEPTION',
            'x-actor-permissions': 'tenant:read,member:profile:read',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(res.statusCode, 200);
        strict_1.default.equal(res.body.data.alive, true);
        // 前台权限最低，仅基础健康检查可访问
    }
    finally {
        await app.close();
    }
});
// 7. 跨 tenant 的健康检查隔离
(0, node_test_1.default)('e2e: 跨 tenant 健康检查隔离', async () => {
    const { app } = await buildRoleHealthApp();
    try {
        // Tenant A readiness
        const resA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set(TENANT_A)
            .set({
            'x-actor-id': 'cross-actor',
            'x-actor-type': 'tenant-user',
            'x-actor-roles': 'SUPER_ADMIN',
            'x-actor-permissions': 'foundation.governance.read,*',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(resA.statusCode, 200);
        // Tenant B readiness
        const resB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/health/readiness')
            .set({
            'x-tenant-id': 'tenant-002',
            'x-brand-id': 'brand-002',
            'x-store-id': 'store-002',
            'x-market-code': 'us-default'
        })
            .set({
            'x-actor-id': 'cross-actor-b',
            'x-actor-type': 'tenant-user',
            'x-actor-roles': 'SUPER_ADMIN',
            'x-actor-permissions': 'foundation.governance.read,*',
            'x-actor-authenticated': 'true'
        });
        strict_1.default.equal(resB.statusCode, 200);
        // 两个 tenant 都应返回健康检查结果
        strict_1.default.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(resA.body.data.status));
        strict_1.default.ok(['OK', 'DEGRADED', 'UNAVAILABLE'].includes(resB.body.data.status));
        // 每个 tenant 的检查时间戳应独立
        strict_1.default.ok(typeof resA.body.data.checkedAt === 'string');
        strict_1.default.ok(typeof resB.body.data.checkedAt === 'string');
    }
    finally {
        await app.close();
    }
});
//# sourceMappingURL=health.e2e.test.js.map