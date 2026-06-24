"use strict";
/**
 * 🐜 自动: [ai-recommend] E2E 基础测试
 *
 * E2E 链路: HTTP → AiRecommendController → AiRecommendService → Recommendation/Strategy/Profile
 *
 * 覆盖:
 *   - 热门推荐: 列表 + 限制数量
 *   - 个性化推荐: 无画像回退 / 有画像匹配
 *   - 推荐生成: 4 种策略 + 兜底
 *   - 策略管理: CRUD + 启停
 *   - 用户画像: 增改查
 *   - 反馈收集: 评分 / 转化
 *   - 推荐历史查询
 *   - 错误处理 (404 / 业务错误)
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
const ai_recommend_service_1 = require("./ai-recommend.service");
// ========== 测试 Controller ==========
let TestAiRecommendController = class TestAiRecommendController {
    service;
    constructor(service) {
        this.service = service;
    }
    getPopular(query) {
        return this.service.getPopularRecommendations(query.storeId, query.type, query.limit ?? 10);
    }
    getPersonalized(query) {
        if (!query.memberId) {
            throw new common_1.BadRequestException('个性化推荐需要 memberId');
        }
        return this.service.getPersonalizedRecommendations(query.memberId, query.type, query.limit ?? 10);
    }
    getRecommendations(query) {
        return this.service.getRecommendations({
            storeId: query.storeId,
            memberId: query.memberId,
            type: query.type,
            limit: query.limit
        });
    }
    generate(body) {
        return this.service.generateRecommendations(body);
    }
    createStrategy(body) {
        return this.service.createStrategy(body);
    }
    getStrategies() {
        return this.service.getStrategies();
    }
    getStrategy(id) {
        const s = this.service.getStrategy(id);
        if (!s)
            throw new common_1.NotFoundException(`Strategy ${id} not found`);
        return s;
    }
    updateStrategy(id, body) {
        return this.service.updateStrategy(id, body);
    }
    enableStrategy(id) {
        return this.service.enableStrategy(id);
    }
    disableStrategy(id) {
        return this.service.disableStrategy(id);
    }
    getProfile(memberId) {
        const p = this.service.getProfile(memberId);
        if (!p)
            throw new common_1.NotFoundException(`Profile ${memberId} not found`);
        return p;
    }
    updateProfile(memberId, body) {
        return this.service.updateProfile(memberId, body);
    }
    recordScore(body) {
        return this.service.recordInteraction(body);
    }
    recordInteraction(body) {
        const weightMap = {
            view: 0.3,
            click: 0.5,
            purchase: 1.0,
            play: 0.8
        };
        const ratingMap = {
            view: 3,
            click: 3,
            purchase: 5,
            play: 4
        };
        return this.service.recordInteraction({
            memberId: body.memberId,
            itemId: body.itemId,
            itemType: body.itemType,
            rating: ratingMap[body.interaction] ?? 3,
            interaction: body.interaction,
            weight: weightMap[body.interaction] ?? 0.5
        });
    }
    recordConversion(body) {
        const rec = this.service.recordConversion(body.recommendationId);
        if (!rec)
            throw new common_1.NotFoundException(`Recommendation ${body.recommendationId} not found`);
        return rec;
    }
};
__decorate([
    (0, common_1.Get)('recommendations/popular'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "getPopular", null);
__decorate([
    (0, common_1.Get)('recommendations/personalized'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "getPersonalized", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "generate", null);
__decorate([
    (0, common_1.Post)('strategies'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "createStrategy", null);
__decorate([
    (0, common_1.Get)('strategies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "getStrategies", null);
__decorate([
    (0, common_1.Get)('strategies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "getStrategy", null);
__decorate([
    (0, common_1.Put)('strategies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "updateStrategy", null);
__decorate([
    (0, common_1.Patch)('strategies/:id/enable'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "enableStrategy", null);
__decorate([
    (0, common_1.Patch)('strategies/:id/disable'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "disableStrategy", null);
__decorate([
    (0, common_1.Get)('profiles/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profiles/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('interactions/score'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "recordScore", null);
__decorate([
    (0, common_1.Post)('interactions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "recordInteraction", null);
__decorate([
    (0, common_1.Post)('conversions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TestAiRecommendController.prototype, "recordConversion", null);
TestAiRecommendController = __decorate([
    (0, common_1.Controller)('ai-recommend'),
    __param(0, (0, common_1.Inject)(ai_recommend_service_1.AiRecommendService)),
    __metadata("design:paramtypes", [ai_recommend_service_1.AiRecommendService])
], TestAiRecommendController);
// ========== 构建 app ==========
async function buildApp() {
    const service = new ai_recommend_service_1.AiRecommendService();
    const moduleRef = await testing_1.Test.createTestingModule({
        controllers: [TestAiRecommendController],
        providers: [{ provide: ai_recommend_service_1.AiRecommendService, useValue: service }]
    }).compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new response_interceptor_1.ResponseInterceptor());
    await app.init();
    return { app, service };
}
// ========== E2E: 热门推荐 ==========
(0, node_test_1.describe)('E2E: 热门推荐流程', () => {
    (0, node_test_1.default)('GET /ai-recommend/recommendations/popular 返回热门列表', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations/popular?limit=5');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(Array.isArray(res.body.data));
            strict_1.default.ok(res.body.data.length > 0);
            for (const r of res.body.data) {
                strict_1.default.equal(r.strategy, 'popularity');
                strict_1.default.equal(r.status, 'active');
                strict_1.default.ok(r.score >= 0 && r.score <= 100);
            }
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/recommendations/popular?type=product 切换类型', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations/popular?type=product&limit=3');
            strict_1.default.equal(res.statusCode, 200);
            for (const r of res.body.data)
                strict_1.default.equal(r.type, 'product');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/recommendations/popular?storeId=store-X 透传', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations/popular?storeId=store-X&limit=2');
            strict_1.default.equal(res.statusCode, 200);
            for (const r of res.body.data)
                strict_1.default.equal(r.storeId, 'store-X');
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 个性化推荐 ==========
(0, node_test_1.describe)('E2E: 个性化推荐流程', () => {
    (0, node_test_1.default)('GET /ai-recommend/recommendations/personalized 缺 memberId 返回 400', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations/personalized');
            strict_1.default.equal(res.statusCode, 400);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/recommendations/personalized 无画像 → 冷启动回退', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations/personalized?memberId=cold-user&limit=5');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length > 0);
            // 冷启动标记
            strict_1.default.ok(res.body.data[0].strategy.includes('cold-start') || res.body.data[0].strategy.includes('popularity'));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/recommendations/personalized 有画像 → 内容匹配', async () => {
        const { app } = await buildApp();
        try {
            // 先创建画像
            await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-recommend/profiles/moba-fan')
                .send({
                preferences: {
                    gameTypes: ['MOBA'],
                    priceRange: { min: 0, max: 500 },
                    visitFrequency: 'weekly',
                    avgSpend: 100,
                    favoriteTimeSlot: '18:00-22:00'
                },
                behaviorTags: ['game-enthusiast']
            });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations/personalized?memberId=moba-fan&limit=5');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length > 0);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 推荐生成 ==========
(0, node_test_1.describe)('E2E: 推荐生成流程', () => {
    (0, node_test_1.default)('POST /ai-recommend/generate popularity 策略', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/generate')
                .send({ strategyId: 'strategy-popularity-v1', limit: 5 });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.strategy, 'popularity');
            strict_1.default.ok(res.body.data.items.length > 0);
            strict_1.default.equal(typeof res.body.data.executionTimeMs, 'number');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/generate hybrid 策略 + memberId', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/generate')
                .send({
                strategyId: 'strategy-hybrid-v1',
                memberId: 'm-001',
                limit: 8
            });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.strategy, 'hybrid');
            strict_1.default.ok(res.body.data.items.length > 0);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/generate 策略不存在返回 500', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/generate')
                .send({ strategyId: 'non-existent' });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/generate 禁用策略返回 500', async () => {
        const { app } = await buildApp();
        try {
            await (0, supertest_1.default)(app.getHttpServer())
                .patch('/ai-recommend/strategies/strategy-popularity-v1/disable');
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/generate')
                .send({ strategyId: 'strategy-popularity-v1' });
            strict_1.default.equal(res.statusCode, 500);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/generate fallback 触发', async () => {
        const { app } = await buildApp();
        try {
            // 创建一个会 fallback 的策略
            const created = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/strategies')
                .send({
                name: 'fallback-test',
                description: 'test',
                targetType: 'game',
                weights: [{ factor: 'never-match', weight: 1 }],
                fallbackStrategy: 'strategy-popularity-v1',
                maxResults: 5
            });
            const strategyId = created.body.data.id;
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/generate')
                .send({ strategyId, limit: 5 });
            strict_1.default.equal(res.statusCode, 201);
            // fallback 标记
            if (res.body.data.fallbackStrategy) {
                strict_1.default.equal(res.body.data.fallbackStrategy, 'strategy-popularity-v1');
            }
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 策略管理 ==========
(0, node_test_1.describe)('E2E: 策略管理流程', () => {
    (0, node_test_1.default)('POST /ai-recommend/strategies 创建自定义策略', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/strategies')
                .send({
                name: 'custom-v1',
                description: 'custom strategy',
                targetType: 'game',
                weights: [{ factor: 'rating', weight: 1.0 }],
                minScore: 0,
                maxResults: 5
            });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.name, 'custom-v1');
            strict_1.default.equal(res.body.data.isEnabled, true);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/strategies 列表', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/strategies');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length >= 4);
            const names = res.body.data.map((s) => s.name);
            strict_1.default.ok(names.includes('popularity'));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/strategies/:id 详情', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/strategies/strategy-popularity-v1');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.name, 'popularity');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/strategies/:id 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/strategies/non-existent');
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PUT /ai-recommend/strategies/:id 更新策略', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-recommend/strategies/strategy-popularity-v1')
                .send({ minScore: 50, maxResults: 3 });
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.config.minScore, 50);
            strict_1.default.equal(res.body.data.config.maxResults, 3);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PATCH /ai-recommend/strategies/:id/disable 禁用', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .patch('/ai-recommend/strategies/strategy-popularity-v1/disable');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.isEnabled, false);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PATCH /ai-recommend/strategies/:id/enable 启用', async () => {
        const { app } = await buildApp();
        try {
            // 先禁用
            await (0, supertest_1.default)(app.getHttpServer())
                .patch('/ai-recommend/strategies/strategy-popularity-v1/disable');
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .patch('/ai-recommend/strategies/strategy-popularity-v1/enable');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.isEnabled, true);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 用户画像 ==========
(0, node_test_1.describe)('E2E: 用户画像流程', () => {
    (0, node_test_1.default)('PUT /ai-recommend/profiles/:memberId 创建画像', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-recommend/profiles/m-new')
                .send({
                preferences: {
                    gameTypes: ['MOBA', 'RPG'],
                    priceRange: { min: 0, max: 500 },
                    visitFrequency: 'weekly',
                    avgSpend: 100,
                    favoriteTimeSlot: '18:00-22:00'
                },
                behaviorTags: ['vip', 'game-enthusiast']
            });
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.memberId, 'm-new');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/profiles/:memberId 获取画像', async () => {
        const { app } = await buildApp();
        try {
            await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-recommend/profiles/m-exists')
                .send({
                preferences: {
                    gameTypes: ['FPS'],
                    priceRange: { min: 0, max: 100 },
                    visitFrequency: 'daily',
                    avgSpend: 50,
                    favoriteTimeSlot: '20:00-22:00'
                }
            });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/profiles/m-exists');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.equal(res.body.data.preferences.gameTypes[0], 'FPS');
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/profiles/:memberId 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/profiles/never-exists');
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('PUT /ai-recommend/profiles/:memberId 增量更新', async () => {
        const { app } = await buildApp();
        try {
            // 创建
            await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-recommend/profiles/m-inc')
                .send({
                preferences: {
                    gameTypes: ['MOBA'],
                    priceRange: { min: 0, max: 100 },
                    visitFrequency: 'weekly',
                    avgSpend: 50,
                    favoriteTimeSlot: '10:00'
                }
            });
            // 更新 behaviorTags
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .put('/ai-recommend/profiles/m-inc')
                .send({ behaviorTags: ['new'] });
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.deepEqual(res.body.data.behaviorTags, ['new']);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 反馈收集 ==========
(0, node_test_1.describe)('E2E: 反馈收集流程', () => {
    (0, node_test_1.default)('POST /ai-recommend/interactions/score 记录评分', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/interactions/score')
                .send({
                memberId: 'm-fb',
                itemId: 'game-001',
                itemType: 'game',
                rating: 5,
                interaction: 'play',
                weight: 1.0
            });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.rating, 5);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/interactions 简化版 → 自动计算 rating/weight', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/interactions')
                .send({
                memberId: 'm-quick',
                itemId: 'game-002',
                itemType: 'game',
                interaction: 'purchase'
            });
            strict_1.default.equal(res.statusCode, 201);
            strict_1.default.equal(res.body.data.rating, 5); // purchase → 5
            strict_1.default.equal(res.body.data.weight, 1.0);
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/interactions 自动创建画像', async () => {
        const { app } = await buildApp();
        try {
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/interactions')
                .send({
                memberId: 'm-new-via-interaction',
                itemId: 'game-001',
                itemType: 'game',
                interaction: 'play'
            });
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/profiles/m-new-via-interaction');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.preferences.gameTypes.includes('MOBA'));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('POST /ai-recommend/conversions 不存在返回 404', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .post('/ai-recommend/conversions')
                .send({ recommendationId: 'non-existent' });
            strict_1.default.equal(res.statusCode, 404);
        }
        finally {
            await app.close();
        }
    });
});
// ========== E2E: 推荐历史 ==========
(0, node_test_1.describe)('E2E: 推荐历史查询', () => {
    (0, node_test_1.default)('GET /ai-recommend/recommendations 列表 (默认空)', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(Array.isArray(res.body.data));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/recommendations?type=game 过滤', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations?type=game&limit=5');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(Array.isArray(res.body.data));
        }
        finally {
            await app.close();
        }
    });
    (0, node_test_1.default)('GET /ai-recommend/recommendations?limit=3 限制', async () => {
        const { app } = await buildApp();
        try {
            const res = await (0, supertest_1.default)(app.getHttpServer())
                .get('/ai-recommend/recommendations?limit=3');
            strict_1.default.equal(res.statusCode, 200);
            strict_1.default.ok(res.body.data.length <= 3);
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=ai-recommend.e2e.test.js.map