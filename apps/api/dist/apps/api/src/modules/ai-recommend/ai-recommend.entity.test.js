"use strict";
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
/**
 * 🐜 自动: [ai-recommend] [A] entity 测试
 * 类型契约测试：Recommendation, UserProfile, ItemScore, RecommendationStrategy, GenerateRecommendationsInput/Output
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
// ── RecommendType ──
(0, node_test_1.describe)('ai-recommend.entity: RecommendType', () => {
    (0, node_test_1.default)('supports all 5 recommendation types', () => {
        const types = ['game', 'product', 'activity', 'coupon', 'svip'];
        strict_1.default.equal(types.length, 5);
        for (const t of types) {
            strict_1.default.ok(['game', 'product', 'activity', 'coupon', 'svip'].includes(t));
        }
    });
    (0, node_test_1.default)('rejects invalid recommend type at type level', () => {
        const valid = 'game';
        strict_1.default.equal(valid, 'game');
        // @ts-expect-error - invalid type should be rejected
        const _invalid = 'invalid';
        void _invalid;
    });
});
// ── RecommendationStatus ──
(0, node_test_1.describe)('ai-recommend.entity: RecommendationStatus', () => {
    (0, node_test_1.default)('supports all 4 statuses', () => {
        const statuses = ['active', 'clicked', 'converted', 'expired'];
        strict_1.default.equal(statuses.length, 4);
    });
    (0, node_test_1.default)('active is default status', () => {
        const status = 'active';
        strict_1.default.equal(status, 'active');
    });
});
// ── VisitFrequency ──
(0, node_test_1.describe)('ai-recommend.entity: VisitFrequency', () => {
    (0, node_test_1.default)('supports all 4 frequencies', () => {
        const freqs = ['daily', 'weekly', 'monthly', 'occasional'];
        strict_1.default.equal(freqs.length, 4);
    });
});
// ── InteractionType ──
(0, node_test_1.describe)('ai-recommend.entity: InteractionType', () => {
    (0, node_test_1.default)('supports all 4 interaction types', () => {
        const types = ['view', 'click', 'purchase', 'play'];
        strict_1.default.equal(types.length, 4);
    });
});
// ── ScoreItemType ──
(0, node_test_1.describe)('ai-recommend.entity: ScoreItemType', () => {
    (0, node_test_1.default)('supports all 3 score item types', () => {
        const types = ['game', 'product', 'activity'];
        strict_1.default.equal(types.length, 3);
    });
});
// ── Recommendation ──
(0, node_test_1.describe)('ai-recommend.entity: Recommendation', () => {
    (0, node_test_1.default)('creates valid Recommendation with all required fields', () => {
        const rec = {
            id: 'rec-001',
            tenantId: 'tenant-1',
            type: 'game',
            itemId: 'game-001',
            itemName: '王者荣耀',
            score: 85,
            reason: '热门推荐',
            strategy: 'popularity',
            status: 'active',
            expiresAt: '2026-06-25T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(rec.id, 'rec-001');
        strict_1.default.equal(rec.tenantId, 'tenant-1');
        strict_1.default.equal(rec.type, 'game');
        strict_1.default.equal(rec.itemId, 'game-001');
        strict_1.default.equal(rec.itemName, '王者荣耀');
        strict_1.default.equal(rec.score, 85);
        strict_1.default.equal(rec.reason, '热门推荐');
        strict_1.default.equal(rec.strategy, 'popularity');
        strict_1.default.equal(rec.status, 'active');
        strict_1.default.equal(rec.expiresAt, '2026-06-25T00:00:00.000Z');
        strict_1.default.equal(rec.createdAt, '2026-06-24T00:00:00.000Z');
    });
    (0, node_test_1.default)('creates Recommendation with optional storeId and memberId', () => {
        const rec = {
            id: 'rec-002',
            tenantId: 'tenant-1',
            storeId: 'store-shanghai',
            memberId: 'member-001',
            type: 'product',
            itemId: 'product-001',
            itemName: '游戏手柄',
            score: 72,
            reason: '协同过滤',
            strategy: 'collaborative-filtering',
            status: 'clicked',
            expiresAt: '2026-06-25T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(rec.storeId, 'store-shanghai');
        strict_1.default.equal(rec.memberId, 'member-001');
        strict_1.default.equal(rec.status, 'clicked');
    });
    (0, node_test_1.default)('supports all status transitions', () => {
        const active = 'active';
        const clicked = 'clicked';
        const converted = 'converted';
        const expired = 'expired';
        const rec = {
            id: 'rec-003',
            tenantId: 't1',
            type: 'svip',
            itemId: 'svip-001',
            itemName: 'SVIP 月卡',
            score: 95,
            reason: '高转化率',
            strategy: 'hybrid',
            status: active,
            expiresAt: '2026-06-25T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(rec.status, 'active');
        const updated = { ...rec, status: clicked };
        strict_1.default.equal(updated.status, 'clicked');
        const convertedRec = { ...rec, status: converted };
        strict_1.default.equal(convertedRec.status, 'converted');
        const expiredRec = { ...rec, status: expired };
        strict_1.default.equal(expiredRec.status, 'expired');
    });
    (0, node_test_1.default)('score is number between 0-100', () => {
        const rec = {
            id: 'rec-score',
            tenantId: 't1',
            type: 'activity',
            itemId: 'act-001',
            itemName: '密室逃脱',
            score: 88,
            reason: '',
            strategy: 'popularity',
            status: 'active',
            expiresAt: '2026-06-25T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(typeof rec.score, 'number');
        strict_1.default.ok(rec.score >= 0 && rec.score <= 100);
    });
    (0, node_test_1.default)('supports coupon type recommendation', () => {
        const rec = {
            id: 'rec-coupon',
            tenantId: 't1',
            memberId: 'm-1',
            type: 'coupon',
            itemId: 'coupon-001',
            itemName: '满100减20券',
            score: 60,
            reason: '用户常客优惠',
            strategy: 'content-based',
            status: 'active',
            expiresAt: '2026-06-25T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(rec.type, 'coupon');
        strict_1.default.equal(rec.memberId, 'm-1');
    });
});
// ── UserProfile ──
(0, node_test_1.describe)('ai-recommend.entity: UserProfile', () => {
    (0, node_test_1.default)('creates valid UserProfile with nested preferences', () => {
        const profile = {
            id: 'profile-001',
            memberId: 'member-001',
            tenantId: 'tenant-1',
            preferences: {
                gameTypes: ['MOBA', 'RPG'],
                priceRange: { min: 0, max: 500 },
                visitFrequency: 'weekly',
                avgSpend: 120,
                favoriteTimeSlot: '18:00-22:00'
            },
            behaviorTags: ['game-enthusiast', 'high-spender'],
            lastUpdated: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(profile.memberId, 'member-001');
        strict_1.default.deepEqual(profile.preferences.gameTypes, ['MOBA', 'RPG']);
        strict_1.default.equal(profile.preferences.priceRange.min, 0);
        strict_1.default.equal(profile.preferences.priceRange.max, 500);
        strict_1.default.equal(profile.preferences.visitFrequency, 'weekly');
        strict_1.default.equal(profile.preferences.avgSpend, 120);
        strict_1.default.equal(profile.preferences.favoriteTimeSlot, '18:00-22:00');
        strict_1.default.ok(profile.behaviorTags.includes('game-enthusiast'));
    });
    (0, node_test_1.default)('supports minimal profile with empty arrays', () => {
        const profile = {
            id: 'profile-min',
            memberId: 'member-min',
            tenantId: 't1',
            preferences: {
                gameTypes: [],
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'occasional',
                avgSpend: 0,
                favoriteTimeSlot: '00:00'
            },
            behaviorTags: [],
            lastUpdated: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.deepEqual(profile.preferences.gameTypes, []);
        strict_1.default.deepEqual(profile.behaviorTags, []);
        strict_1.default.equal(profile.preferences.avgSpend, 0);
    });
    (0, node_test_1.default)('supports all visit frequencies', () => {
        const freqs = ['daily', 'weekly', 'monthly', 'occasional'];
        for (const freq of freqs) {
            const profile = {
                id: `profile-${freq}`,
                memberId: `m-${freq}`,
                tenantId: 't1',
                preferences: {
                    gameTypes: [],
                    priceRange: { min: 0, max: 100 },
                    visitFrequency: freq,
                    avgSpend: 0,
                    favoriteTimeSlot: '00:00'
                },
                behaviorTags: [],
                lastUpdated: '2026-06-24T00:00:00.000Z'
            };
            strict_1.default.equal(profile.preferences.visitFrequency, freq);
        }
    });
});
// ── ItemScore ──
(0, node_test_1.describe)('ai-recommend.entity: ItemScore', () => {
    (0, node_test_1.default)('creates valid ItemScore', () => {
        const score = {
            id: 'score-001',
            memberId: 'member-001',
            itemId: 'game-001',
            itemType: 'game',
            rating: 5,
            interaction: 'play',
            weight: 1.0,
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(score.rating, 5);
        strict_1.default.equal(score.interaction, 'play');
        strict_1.default.equal(score.weight, 1.0);
        strict_1.default.equal(score.itemType, 'game');
    });
    (0, node_test_1.default)('supports all interaction types', () => {
        const interactions = ['view', 'click', 'purchase', 'play'];
        for (const interaction of interactions) {
            const score = {
                id: `score-${interaction}`,
                memberId: 'm-1',
                itemId: 'game-001',
                itemType: 'product',
                rating: 3,
                interaction,
                weight: 0.5,
                createdAt: '2026-06-24T00:00:00.000Z'
            };
            strict_1.default.equal(score.interaction, interaction);
        }
    });
    (0, node_test_1.default)('rating is between 1 and 5', () => {
        const score = {
            id: 'score-rating',
            memberId: 'm-1',
            itemId: 'game-001',
            itemType: 'activity',
            rating: 4,
            interaction: 'view',
            weight: 0.3,
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.ok(score.rating >= 1 && score.rating <= 5);
    });
});
// ── StrategyWeightFactor ──
(0, node_test_1.describe)('ai-recommend.entity: StrategyWeightFactor', () => {
    (0, node_test_1.default)('creates valid weight factor with factor name and weight', () => {
        const factor = {
            factor: 'popularity',
            weight: 0.5
        };
        strict_1.default.equal(factor.factor, 'popularity');
        strict_1.default.equal(factor.weight, 0.5);
    });
    (0, node_test_1.default)('weight is between 0 and 1', () => {
        const factors = [
            { factor: 'a', weight: 0 },
            { factor: 'b', weight: 0.5 },
            { factor: 'c', weight: 1 }
        ];
        for (const f of factors) {
            strict_1.default.ok(f.weight >= 0 && f.weight <= 1);
        }
    });
    (0, node_test_1.default)('factor can be any descriptive string', () => {
        const factor = {
            factor: 'seasonality',
            weight: 0.4
        };
        strict_1.default.equal(factor.factor, 'seasonality');
    });
});
// ── RecommendationStrategy ──
(0, node_test_1.describe)('ai-recommend.entity: RecommendationStrategy', () => {
    (0, node_test_1.default)('creates valid RecommendationStrategy with config', () => {
        const strategy = {
            id: 'strategy-hybrid-v1',
            name: 'hybrid',
            description: '混合推荐策略',
            targetType: 'game',
            config: {
                weights: [
                    { factor: 'popularity', weight: 0.3 },
                    { factor: 'collaborative', weight: 0.3 },
                    { factor: 'contentMatch', weight: 0.4 }
                ],
                fallbackStrategy: 'strategy-popularity-v1',
                minScore: 20,
                maxResults: 15
            },
            isEnabled: true,
            createdAt: '2026-06-24T00:00:00.000Z',
            updatedAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(strategy.name, 'hybrid');
        strict_1.default.equal(strategy.targetType, 'game');
        strict_1.default.equal(strategy.config.weights.length, 3);
        strict_1.default.equal(strategy.config.fallbackStrategy, 'strategy-popularity-v1');
        strict_1.default.equal(strategy.config.minScore, 20);
        strict_1.default.equal(strategy.config.maxResults, 15);
        strict_1.default.equal(strategy.isEnabled, true);
    });
    (0, node_test_1.default)('supports strategy with optional fields omitted', () => {
        const strategy = {
            id: 'strategy-simple-v1',
            name: 'simple',
            description: 'Simple strategy',
            targetType: 'product',
            config: {
                weights: [{ factor: 'rating', weight: 1.0 }]
            },
            isEnabled: true,
            createdAt: '2026-06-24T00:00:00.000Z',
            updatedAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(strategy.config.fallbackStrategy, undefined);
        strict_1.default.equal(strategy.config.minScore, undefined);
        strict_1.default.equal(strategy.config.maxResults, undefined);
    });
    (0, node_test_1.default)('supports disabled strategy', () => {
        const strategy = {
            id: 'strategy-disabled',
            name: 'test-disabled',
            description: '',
            targetType: 'game',
            config: { weights: [] },
            isEnabled: false,
            createdAt: '2026-06-24T00:00:00.000Z',
            updatedAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(strategy.isEnabled, false);
    });
    (0, node_test_1.default)('supports all target types', () => {
        const types = ['game', 'product', 'activity', 'coupon', 'svip'];
        for (const t of types) {
            const strategy = {
                id: `strategy-${t}`,
                name: `test-${t}`,
                description: '',
                targetType: t,
                config: { weights: [] },
                isEnabled: true,
                createdAt: '2026-06-24T00:00:00.000Z',
                updatedAt: '2026-06-24T00:00:00.000Z'
            };
            strict_1.default.equal(strategy.targetType, t);
        }
    });
});
// ── GenerateRecommendationsInput ──
(0, node_test_1.describe)('ai-recommend.entity: GenerateRecommendationsInput', () => {
    (0, node_test_1.default)('requires strategyId only', () => {
        const input = {
            strategyId: 'strategy-popularity-v1'
        };
        strict_1.default.equal(input.strategyId, 'strategy-popularity-v1');
        strict_1.default.equal(input.memberId, undefined);
        strict_1.default.equal(input.limit, undefined);
    });
    (0, node_test_1.default)('accepts optional memberId, storeId, type, limit', () => {
        const input = {
            strategyId: 'strategy-hybrid-v1',
            memberId: 'member-001',
            storeId: 'store-shanghai',
            type: 'game',
            limit: 5
        };
        strict_1.default.equal(input.memberId, 'member-001');
        strict_1.default.equal(input.storeId, 'store-shanghai');
        strict_1.default.equal(input.type, 'game');
        strict_1.default.equal(input.limit, 5);
    });
});
// ── GenerateRecommendationsOutput ──
(0, node_test_1.describe)('ai-recommend.entity: GenerateRecommendationsOutput', () => {
    (0, node_test_1.default)('creates valid output with required fields', () => {
        const output = {
            strategy: 'hybrid',
            items: [],
            executionTimeMs: 15,
            timestamp: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(output.strategy, 'hybrid');
        strict_1.default.equal(output.items.length, 0);
        strict_1.default.equal(output.executionTimeMs, 15);
        strict_1.default.ok(!isNaN(Date.parse(output.timestamp)));
    });
    (0, node_test_1.default)('includes optional fallbackStrategy', () => {
        const output = {
            strategy: 'content-based',
            fallbackStrategy: 'strategy-popularity-v1',
            items: [
                {
                    id: 'rec-fallback',
                    tenantId: 't1',
                    type: 'game',
                    itemId: 'game-001',
                    itemName: '王者荣耀',
                    score: 80,
                    reason: '回退到热门',
                    strategy: 'popularity',
                    status: 'active',
                    expiresAt: '2026-06-25T00:00:00.000Z',
                    createdAt: '2026-06-24T00:00:00.000Z'
                }
            ],
            executionTimeMs: 20,
            timestamp: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(output.fallbackStrategy, 'strategy-popularity-v1');
        strict_1.default.equal(output.items.length, 1);
        strict_1.default.equal(output.items[0].id, 'rec-fallback');
    });
    (0, node_test_1.default)('executionTimeMs is non-negative', () => {
        const output = {
            strategy: 'popularity',
            items: [],
            executionTimeMs: 0,
            timestamp: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.ok(output.executionTimeMs >= 0);
    });
});
// ── Cross-type composition ──
(0, node_test_1.describe)('ai-recommend.entity: cross-type composition', () => {
    (0, node_test_1.default)('Recommendation can store svip type items', () => {
        const rec = {
            id: 'rec-svip',
            tenantId: 't1',
            memberId: 'm-1',
            type: 'svip',
            itemId: 'svip-gold',
            itemName: 'SVIP 黄金会员',
            score: 90,
            reason: '高价值用户推荐',
            strategy: 'content-based',
            status: 'active',
            expiresAt: '2026-07-01T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(rec.type, 'svip');
        strict_1.default.equal(rec.itemName, 'SVIP 黄金会员');
    });
    (0, node_test_1.default)('Recommendation can store coupon type items', () => {
        const rec = {
            id: 'rec-coupon-x',
            tenantId: 't1',
            memberId: 'm-2',
            type: 'coupon',
            itemId: 'coupon-discount-50',
            itemName: '50元优惠券',
            score: 65,
            reason: '用户常客优惠',
            strategy: 'hybrid',
            status: 'active',
            expiresAt: '2026-06-28T00:00:00.000Z',
            createdAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(rec.type, 'coupon');
        strict_1.default.equal(rec.score, 65);
    });
    (0, node_test_1.default)('StrategyWeightFactor can be reused across strategies', () => {
        const weight = { factor: 'recency', weight: 0.2 };
        const strategyA = {
            id: 'strat-a',
            name: 'A',
            description: '',
            targetType: 'game',
            config: { weights: [weight] },
            isEnabled: true,
            createdAt: '2026-06-24T00:00:00.000Z',
            updatedAt: '2026-06-24T00:00:00.000Z'
        };
        const strategyB = {
            id: 'strat-b',
            name: 'B',
            description: '',
            targetType: 'activity',
            config: { weights: [weight, { factor: 'popularity', weight: 0.8 }] },
            isEnabled: true,
            createdAt: '2026-06-24T00:00:00.000Z',
            updatedAt: '2026-06-24T00:00:00.000Z'
        };
        strict_1.default.equal(strategyA.config.weights[0].weight, 0.2);
        strict_1.default.equal(strategyB.config.weights[0].weight, 0.2);
    });
});
//# sourceMappingURL=ai-recommend.entity.test.js.map