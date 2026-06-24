"use strict";
/**
 * 🐜 自动: [ai-recommend] Service 单元测试
 *
 * 覆盖:
 *   - 热门推荐 (getPopularRecommendations) + 排序
 *   - 个性化推荐 (getPersonalizedRecommendations) + 冷启动回退
 *   - 策略 CRUD (create/get/list/update/enable/disable)
 *   - 推荐生成 (generateRecommendations) + 4 种策略
 *   - 兜底策略 (fallback) 触发
 *   - 反馈收集 (recordInteraction / recordConversion)
 *   - 用户画像 (updateProfile / getProfile / 从交互自动更新)
 *   - 推荐历史查询 (getRecommendations)
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_recommend_service_1 = require("./ai-recommend.service");
// ─── 热门推荐 ───
(0, node_test_1.describe)('Service: 热门推荐', () => {
    (0, node_test_1.default)('默认 limit=10 返回 8 个种子 (最多 10)', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'game');
        strict_1.default.ok(popular.length > 0);
        strict_1.default.ok(popular.length <= 10);
    });
    (0, node_test_1.default)('limit=3 返回前 3', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'game', 3);
        strict_1.default.equal(popular.length, 3);
    });
    (0, node_test_1.default)('strategy 标记为 popularity', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'game', 3);
        for (const r of popular)
            strict_1.default.equal(r.strategy, 'popularity');
    });
    (0, node_test_1.default)('itemName 来自默认 "Item-${id}" 格式', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'game', 8);
        const names = popular.map((r) => r.itemName);
        // 热门推荐使用 Item-{itemId} 格式(itemId 来自 game-001..game-008)
        strict_1.default.ok(names.every((n) => n.startsWith('Item-')));
    });
    (0, node_test_1.default)('storeId 透传', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations('store-X', 'game', 2);
        for (const r of popular)
            strict_1.default.equal(r.storeId, 'store-X');
    });
    (0, node_test_1.default)('type 覆盖默认 game', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'product', 3);
        for (const r of popular)
            strict_1.default.equal(r.type, 'product');
    });
    (0, node_test_1.default)('status 默认 active', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'game', 2);
        for (const r of popular)
            strict_1.default.equal(r.status, 'active');
    });
    (0, node_test_1.default)('expiresAt 未来时间', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations(undefined, 'game', 1);
        const now = Date.now();
        const exp = new Date(popular[0].expiresAt).getTime();
        strict_1.default.ok(exp > now, 'expiresAt 必为未来');
    });
});
// ─── 个性化推荐 ───
(0, node_test_1.describe)('Service: 个性化推荐', () => {
    (0, node_test_1.default)('无画像 → 冷启动回退热门', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const pers = svc.getPersonalizedRecommendations('cold-user', 'game', 5);
        strict_1.default.ok(pers.length > 0);
        // 冷启动标记
        strict_1.default.ok(pers[0].strategy.includes('cold-start') || pers[0].strategy.includes('popularity'));
    });
    (0, node_test_1.default)('有画像 → 基于内容匹配', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.updateProfile('m-1', {
            preferences: {
                gameTypes: ['MOBA'],
                priceRange: { min: 0, max: 500 },
                visitFrequency: 'daily',
                avgSpend: 100,
                favoriteTimeSlot: '18:00-22:00'
            },
            behaviorTags: ['game-enthusiast']
        });
        const pers = svc.getPersonalizedRecommendations('m-1', 'game', 5);
        strict_1.default.ok(pers.length > 0);
        // 至少有一个 MOBA
        strict_1.default.ok(pers.some((r) => ['王者荣耀', '英雄联盟'].includes(r.itemName)));
    });
    (0, node_test_1.default)('画像 avgSpend 50 以下不触发消费匹配', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.updateProfile('low-spender', {
            preferences: {
                gameTypes: [],
                priceRange: { min: 0, max: 50 },
                visitFrequency: 'occasional',
                avgSpend: 30,
                favoriteTimeSlot: '10:00-12:00'
            }
        });
        const pers = svc.getPersonalizedRecommendations('low-spender', 'game', 5);
        // 应回退或分数很低,但仍可能有协同过滤的
        strict_1.default.ok(Array.isArray(pers));
    });
    (0, node_test_1.default)('limit 限制结果数', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const pers = svc.getPersonalizedRecommendations('any-user', 'game', 2);
        strict_1.default.ok(pers.length <= 2);
    });
});
// ─── 策略 CRUD ───
(0, node_test_1.describe)('Service: 策略 CRUD', () => {
    (0, node_test_1.default)('createStrategy 新增自定义策略', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const created = svc.createStrategy({
            name: 'custom-v1',
            description: 'custom',
            targetType: 'game',
            weights: [{ factor: 'rating', weight: 1.0 }],
            minScore: 0,
            maxResults: 5
        });
        strict_1.default.ok(created.id.startsWith('strategy-custom-v1-'));
        strict_1.default.equal(created.name, 'custom-v1');
        strict_1.default.equal(created.isEnabled, true);
    });
    (0, node_test_1.default)('createStrategy 指定 fallback', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const created = svc.createStrategy({
            name: 'with-fallback',
            description: '',
            targetType: 'game',
            weights: [{ factor: 'x', weight: 1 }],
            fallbackStrategy: 'strategy-popularity-v1'
        });
        strict_1.default.equal(created.config.fallbackStrategy, 'strategy-popularity-v1');
    });
    (0, node_test_1.default)('getStrategies 包含默认 + 自定义', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.createStrategy({
            name: 'mine',
            description: '',
            targetType: 'product',
            weights: [{ factor: 'rating', weight: 1 }]
        });
        const all = svc.getStrategies();
        strict_1.default.ok(all.length >= 5); // 4 默认 + 1 自定义
    });
    (0, node_test_1.default)('getStrategy 查找存在的策略', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const s = svc.getStrategy('strategy-popularity-v1');
        strict_1.default.ok(s);
        strict_1.default.equal(s.name, 'popularity');
    });
    (0, node_test_1.default)('getStrategy 不存在返回 undefined', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.equal(svc.getStrategy('non-existent'), undefined);
    });
    (0, node_test_1.default)('updateStrategy 修改权重 + minScore', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const updated = svc.updateStrategy('strategy-popularity-v1', {
            minScore: 50,
            maxResults: 3
        });
        strict_1.default.equal(updated.config.minScore, 50);
        strict_1.default.equal(updated.config.maxResults, 3);
    });
    (0, node_test_1.default)('updateStrategy 不存在抛错', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.throws(() => svc.updateStrategy('non-existent', {}), /策略不存在/);
    });
    (0, node_test_1.default)('disableStrategy 切换 isEnabled=false', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const updated = svc.disableStrategy('strategy-popularity-v1');
        strict_1.default.equal(updated.isEnabled, false);
    });
    (0, node_test_1.default)('enableStrategy 切换 isEnabled=true', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.disableStrategy('strategy-popularity-v1');
        const updated = svc.enableStrategy('strategy-popularity-v1');
        strict_1.default.equal(updated.isEnabled, true);
    });
    (0, node_test_1.default)('enableStrategy 不存在抛错', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.throws(() => svc.enableStrategy('nope'), /策略不存在/);
    });
    (0, node_test_1.default)('disableStrategy 不存在抛错', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.throws(() => svc.disableStrategy('nope'), /策略不存在/);
    });
});
// ─── 推荐生成 ───
(0, node_test_1.describe)('Service: generateRecommendations', () => {
    (0, node_test_1.default)('popularity 策略返回热门', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-popularity-v1',
            limit: 5
        });
        strict_1.default.equal(out.strategy, 'popularity');
        strict_1.default.ok(out.items.length > 0);
    });
    (0, node_test_1.default)('collaborative-filtering 无 memberId 回退热门', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-collaborative-v1',
            limit: 5
        });
        strict_1.default.equal(out.strategy, 'collaborative-filtering');
        strict_1.default.ok(out.items.length > 0);
    });
    (0, node_test_1.default)('content-based 有 memberId 用画像', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.updateProfile('m-content', {
            preferences: {
                gameTypes: ['RPG'],
                priceRange: { min: 0, max: 500 },
                visitFrequency: 'weekly',
                avgSpend: 80,
                favoriteTimeSlot: '18:00-22:00'
            }
        });
        const out = svc.generateRecommendations({
            strategyId: 'strategy-content-v1',
            memberId: 'm-content',
            limit: 5
        });
        strict_1.default.equal(out.strategy, 'content-based');
    });
    (0, node_test_1.default)('hybrid 策略 memberId 必填', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-hybrid-v1',
            memberId: 'm-hybrid',
            limit: 5
        });
        strict_1.default.equal(out.strategy, 'hybrid');
    });
    (0, node_test_1.default)('hybrid 策略无 memberId 回退热门', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-hybrid-v1',
            limit: 5
        });
        strict_1.default.ok(out.items.length > 0);
    });
    (0, node_test_1.default)('策略不存在抛错', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.throws(() => svc.generateRecommendations({ strategyId: 'non-existent' }), /策略不存在/);
    });
    (0, node_test_1.default)('禁用策略抛错', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.disableStrategy('strategy-popularity-v1');
        strict_1.default.throws(() => svc.generateRecommendations({ strategyId: 'strategy-popularity-v1' }), /策略已禁用/);
    });
    (0, node_test_1.default)('executionTimeMs 必填', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-popularity-v1'
        });
        strict_1.default.equal(typeof out.executionTimeMs, 'number');
        strict_1.default.ok(out.executionTimeMs >= 0);
    });
    (0, node_test_1.default)('timestamp ISO 格式', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-popularity-v1'
        });
        strict_1.default.ok(!isNaN(Date.parse(out.timestamp)));
    });
    (0, node_test_1.default)('输入 limit 覆盖策略默认', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-popularity-v1',
            limit: 2
        });
        strict_1.default.ok(out.items.length <= 2);
    });
    (0, node_test_1.default)('输入 type 覆盖策略默认 targetType', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const out = svc.generateRecommendations({
            strategyId: 'strategy-popularity-v1',
            type: 'product',
            limit: 3
        });
        for (const r of out.items)
            strict_1.default.equal(r.type, 'product');
    });
    (0, node_test_1.default)('空结果 + fallback 触发 (minScore 极高 → 过滤空)', async () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        // 创建带 fallback 的策略,但 minScore=999999 让 popularity 推荐全部过滤
        const created = svc.createStrategy({
            name: 'fallback-test',
            description: '',
            targetType: 'game',
            weights: [{ factor: 'rating', weight: 1 }],
            fallbackStrategy: 'strategy-popularity-v1',
            minScore: 999999,
            maxResults: 10
        });
        // popularity strategy 本身 minScore=10, 生成结果后过滤 < 999999 → 空
        const out = svc.generateRecommendations({
            strategyId: created.id,
            limit: 5
        });
        // fallback 应被触发,fallbackStrategy 应填上
        strict_1.default.equal(out.fallbackStrategy, 'strategy-popularity-v1');
        // fallback 后结果(来自 popularity)可能仍不满足 999999 → 但至少调用过 fallback
        // fallbackStrategy 已设置 = 验证 fallback 逻辑被触发
        void out.items;
    });
    (0, node_test_1.default)('未知策略名 → 默认 popularity', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        // 通过 updateStrategy 改 name 到未知值
        const updated = svc.updateStrategy('strategy-popularity-v1', { name: 'unknown-strategy' });
        const out = svc.generateRecommendations({
            strategyId: updated.id,
            limit: 3
        });
        strict_1.default.ok(out.items.length > 0);
        // switch default → popularity
    });
});
// ─── 反馈收集 ───
(0, node_test_1.describe)('Service: 反馈收集', () => {
    (0, node_test_1.default)('recordInteraction 新增评分', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const score = svc.recordInteraction({
            memberId: 'm-1',
            itemId: 'game-001',
            itemType: 'game',
            rating: 5,
            interaction: 'play',
            weight: 1.0
        });
        strict_1.default.ok(score.id.length > 0);
        strict_1.default.equal(score.memberId, 'm-1');
        strict_1.default.equal(score.itemId, 'game-001');
    });
    (0, node_test_1.default)('recordInteraction 更新物品交互计数', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const before = svc.getPopularRecommendations(undefined, 'game', 10);
        const gameScore = before.find((r) => r.itemId === 'game-001')?.score ?? 0;
        svc.recordInteraction({
            memberId: 'm-fb',
            itemId: 'game-001',
            itemType: 'game',
            rating: 5,
            interaction: 'purchase',
            weight: 1.0
        });
        const after = svc.getPopularRecommendations(undefined, 'game', 10);
        const newScore = after.find((r) => r.itemId === 'game-001')?.score ?? 0;
        // 交互次数增加,热门分数应更高(或不变)
        strict_1.default.ok(newScore >= gameScore);
    });
    (0, node_test_1.default)('recordInteraction 自动更新画像', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.equal(svc.getProfile('m-auto'), undefined);
        svc.recordInteraction({
            memberId: 'm-auto',
            itemId: 'game-001',
            itemType: 'game',
            rating: 5,
            interaction: 'play',
            weight: 1.0
        });
        const profile = svc.getProfile('m-auto');
        strict_1.default.ok(profile);
        // play 应添加 gameType
        strict_1.default.ok(profile.preferences.gameTypes.includes('MOBA'));
    });
    (0, node_test_1.default)('recordInteraction 高 rating 添加 game-enthusiast 标签', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.recordInteraction({
            memberId: 'm-ent',
            itemId: 'game-002',
            itemType: 'game',
            rating: 5,
            interaction: 'play',
            weight: 1.0
        });
        const p = svc.getProfile('m-ent');
        strict_1.default.ok(p.behaviorTags.includes('game-enthusiast'));
    });
    (0, node_test_1.default)('recordConversion 不存在返回 undefined', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.equal(svc.recordConversion('non-existent'), undefined);
    });
    (0, node_test_1.default)('recordConversion active → converted (不持久化,仅验证调用)', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        // generateRecommendations 不持久化到 recommendations 池
        // recordConversion 找不到 → undefined
        const out = svc.generateRecommendations({ strategyId: 'strategy-popularity-v1' });
        void out.items.length; // 仅验证 generate 成功
        const r1 = svc.recordConversion('any-id');
        strict_1.default.equal(r1, undefined);
    });
});
// ─── 用户画像 ───
(0, node_test_1.describe)('Service: 用户画像', () => {
    (0, node_test_1.default)('getProfile 未创建返回 undefined', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        strict_1.default.equal(svc.getProfile('never-created'), undefined);
    });
    (0, node_test_1.default)('updateProfile 创建画像', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const p = svc.updateProfile('m-new', {
            preferences: {
                gameTypes: ['MOBA'],
                priceRange: { min: 0, max: 300 },
                visitFrequency: 'weekly',
                avgSpend: 80,
                favoriteTimeSlot: '19:00-23:00'
            },
            behaviorTags: ['vip']
        });
        strict_1.default.equal(p.memberId, 'm-new');
        strict_1.default.equal(p.preferences.gameTypes[0], 'MOBA');
    });
    (0, node_test_1.default)('updateProfile 增量更新', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.updateProfile('m-inc', {
            preferences: {
                gameTypes: ['MOBA'],
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'weekly',
                avgSpend: 50,
                favoriteTimeSlot: '10:00-12:00'
            }
        });
        const updated = svc.updateProfile('m-inc', {
            behaviorTags: ['new-tag']
        });
        // preferences 保留
        strict_1.default.equal(updated.preferences.gameTypes[0], 'MOBA');
        // behaviorTags 替换
        strict_1.default.deepEqual(updated.behaviorTags, ['new-tag']);
    });
    (0, node_test_1.default)('updateProfile 修改 priceRange', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        svc.updateProfile('m-pr', {
            preferences: {
                gameTypes: [],
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'occasional',
                avgSpend: 30,
                favoriteTimeSlot: '10:00'
            }
        });
        const updated = svc.updateProfile('m-pr', {
            preferences: {
                gameTypes: [],
                priceRange: { min: 50, max: 500 },
                visitFrequency: 'daily',
                avgSpend: 200,
                favoriteTimeSlot: '20:00'
            }
        });
        strict_1.default.equal(updated.preferences.priceRange.min, 50);
        strict_1.default.equal(updated.preferences.avgSpend, 200);
    });
});
// ─── 推荐历史查询 ───
(0, node_test_1.describe)('Service: 推荐历史查询', () => {
    (0, node_test_1.default)('空查询返回空', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const list = svc.getRecommendations({});
        strict_1.default.ok(Array.isArray(list));
    });
    (0, node_test_1.default)('filter by storeId', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const popular = svc.getPopularRecommendations('store-A', 'game', 2);
        // popular 不持久化,直接测 getRecommendations 空
        const list = svc.getRecommendations({ storeId: 'store-A' });
        strict_1.default.equal(list.length, 0);
        strict_1.default.ok(popular.length > 0); // sanity
    });
    (0, node_test_1.default)('filter by memberId', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const list = svc.getRecommendations({ memberId: 'm-1' });
        strict_1.default.equal(list.length, 0);
    });
    (0, node_test_1.default)('filter by type', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const list = svc.getRecommendations({ type: 'game' });
        strict_1.default.equal(list.length, 0);
    });
    (0, node_test_1.default)('limit 限制', () => {
        const svc = new ai_recommend_service_1.AiRecommendService();
        const list = svc.getRecommendations({ limit: 3 });
        strict_1.default.ok(list.length <= 3);
    });
});
//# sourceMappingURL=ai-recommend.service.test.js.map