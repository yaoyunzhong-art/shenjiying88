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
 * 🐜 自动: [ai-recommend] [A] DTO 测试
 * 验证 class-validator 装饰器的约束和 DTO 转换
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const ai_recommend_dto_1 = require("./ai-recommend.dto");
// ── PriceRangeDto ──
(0, node_test_1.describe)('ai-recommend.dto: PriceRangeDto', () => {
    (0, node_test_1.default)('validates correct price range', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { min: 0, max: 500 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects negative min', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { min: -1, max: 100 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'min'));
    });
    (0, node_test_1.default)('rejects negative max', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { min: 0, max: -1 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'max'));
    });
    (0, node_test_1.default)('rejects missing min', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { max: 100 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'min'));
    });
    (0, node_test_1.default)('rejects missing max', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { min: 0 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'max'));
    });
    (0, node_test_1.default)('rejects string min', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { min: 'abc', max: 100 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── PreferencesDto ──
(0, node_test_1.describe)('ai-recommend.dto: PreferencesDto', () => {
    (0, node_test_1.default)('validates correct preferences', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PreferencesDto, {
            gameTypes: ['MOBA', 'RPG'],
            priceRange: { min: 0, max: 500 },
            visitFrequency: 'weekly',
            avgSpend: 120,
            favoriteTimeSlot: '18:00-22:00'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid visitFrequency', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PreferencesDto, {
            gameTypes: ['MOBA'],
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'yearly',
            avgSpend: 50,
            favoriteTimeSlot: '10:00'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'visitFrequency'));
    });
    (0, node_test_1.default)('rejects negative avgSpend', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PreferencesDto, {
            gameTypes: [],
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'daily',
            avgSpend: -10,
            favoriteTimeSlot: '10:00'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'avgSpend'));
    });
    (0, node_test_1.default)('rejects empty gameTypes without array', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PreferencesDto, {
            gameTypes: 'not-array',
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'weekly',
            avgSpend: 50,
            favoriteTimeSlot: '10:00'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects empty favoriteTimeSlot', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PreferencesDto, {
            gameTypes: ['MOBA'],
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'weekly',
            avgSpend: 50,
            favoriteTimeSlot: ''
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'favoriteTimeSlot'));
    });
});
// ── UserProfileDto ──
(0, node_test_1.describe)('ai-recommend.dto: UserProfileDto', () => {
    (0, node_test_1.default)('validates correct user profile', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UserProfileDto, {
            memberId: 'member-001',
            tenantId: 'tenant-1',
            preferences: {
                gameTypes: ['MOBA'],
                priceRange: { min: 0, max: 500 },
                visitFrequency: 'weekly',
                avgSpend: 100,
                favoriteTimeSlot: '18:00-22:00'
            },
            behaviorTags: ['game-enthusiast']
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing memberId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UserProfileDto, {
            tenantId: 'tenant-1',
            preferences: {
                gameTypes: [],
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'daily',
                avgSpend: 0,
                favoriteTimeSlot: '10:00'
            },
            behaviorTags: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'memberId'));
    });
    (0, node_test_1.default)('rejects missing tenantId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UserProfileDto, {
            memberId: 'm-1',
            preferences: {
                gameTypes: [],
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'daily',
                avgSpend: 0,
                favoriteTimeSlot: '10:00'
            },
            behaviorTags: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'tenantId'));
    });
    (0, node_test_1.default)('rejects empty memberId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UserProfileDto, {
            memberId: '',
            tenantId: 't1',
            preferences: {
                gameTypes: [],
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'daily',
                avgSpend: 0,
                favoriteTimeSlot: '10:00'
            },
            behaviorTags: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('validates nested PreferencesDto', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UserProfileDto, {
            memberId: 'm-1',
            tenantId: 't1',
            preferences: 'not-object',
            behaviorTags: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── UpdateProfileDto ──
(0, node_test_1.describe)('ai-recommend.dto: UpdateProfileDto', () => {
    (0, node_test_1.default)('validates empty update (all optional)', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateProfileDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates partial update with preferences only', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateProfileDto, {
            preferences: {
                gameTypes: ['MOBA'],
                priceRange: { min: 0, max: 500 },
                visitFrequency: 'weekly',
                avgSpend: 100,
                favoriteTimeSlot: '18:00-22:00'
            }
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates partial update with behaviorTags only', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateProfileDto, {
            behaviorTags: ['new-tag']
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid nested preferences in update', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateProfileDto, {
            preferences: {
                gameTypes: 'not-array',
                priceRange: { min: 0, max: 100 },
                visitFrequency: 'daily',
                avgSpend: 50,
                favoriteTimeSlot: '10:00'
            }
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── ItemScoreDto ──
(0, node_test_1.describe)('ai-recommend.dto: ItemScoreDto', () => {
    (0, node_test_1.default)('validates correct item score', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'member-001',
            itemId: 'game-001',
            itemType: 'game',
            rating: 5,
            interaction: 'play',
            weight: 1.0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid itemType', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'invalid',
            rating: 3,
            interaction: 'view',
            weight: 0.5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'itemType'));
    });
    (0, node_test_1.default)('rejects invalid interaction type', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'game',
            rating: 3,
            interaction: 'invalid',
            weight: 0.5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'interaction'));
    });
    (0, node_test_1.default)('rejects rating below 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'game',
            rating: 0,
            interaction: 'view',
            weight: 0.5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'rating'));
    });
    (0, node_test_1.default)('rejects rating above 5', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'game',
            rating: 6,
            interaction: 'view',
            weight: 0.5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'rating'));
    });
    (0, node_test_1.default)('rejects weight below 0', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'game',
            rating: 3,
            interaction: 'view',
            weight: -0.1
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'weight'));
    });
    (0, node_test_1.default)('rejects weight above 10', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.ItemScoreDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'game',
            rating: 3,
            interaction: 'view',
            weight: 10.1
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'weight'));
    });
});
// ── RecordInteractionDto ──
(0, node_test_1.describe)('ai-recommend.dto: RecordInteractionDto', () => {
    (0, node_test_1.default)('validates correct interaction record', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordInteractionDto, {
            memberId: 'member-001',
            itemId: 'game-001',
            itemType: 'game',
            interaction: 'purchase'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid interaction type', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordInteractionDto, {
            memberId: 'm-1',
            itemId: 'x',
            itemType: 'game',
            interaction: 'bad'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'interaction'));
    });
    (0, node_test_1.default)('rejects missing memberId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordInteractionDto, {
            itemId: 'x',
            itemType: 'game',
            interaction: 'view'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'memberId'));
    });
    (0, node_test_1.default)('rejects empty itemId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordInteractionDto, {
            memberId: 'm-1',
            itemId: '',
            itemType: 'game',
            interaction: 'view'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── RecommendationQueryDto ──
(0, node_test_1.describe)('ai-recommend.dto: RecommendationQueryDto', () => {
    (0, node_test_1.default)('validates empty query (all optional)', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates query with all fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, {
            storeId: 'store-001',
            memberId: 'member-001',
            type: 'game',
            limit: 10
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid type in query', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, {
            type: 'invalid'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'type'));
    });
    (0, node_test_1.default)('rejects limit below 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, {
            limit: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'limit'));
    });
    (0, node_test_1.default)('rejects limit above 100', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, {
            limit: 101
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'limit'));
    });
    (0, node_test_1.default)('accepts limit at boundary values', async () => {
        const dto1 = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, { limit: 1 });
        const errors1 = await (0, class_validator_1.validate)(dto1);
        strict_1.default.equal(errors1.length, 0);
        const dto2 = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecommendationQueryDto, { limit: 100 });
        const errors2 = await (0, class_validator_1.validate)(dto2);
        strict_1.default.equal(errors2.length, 0);
    });
});
// ── StrategyWeightDto ──
(0, node_test_1.describe)('ai-recommend.dto: StrategyWeightDto', () => {
    (0, node_test_1.default)('validates correct weight factor', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, {
            factor: 'popularity',
            weight: 0.5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects empty factor', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, {
            factor: '',
            weight: 0.5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'factor'));
    });
    (0, node_test_1.default)('rejects weight below 0', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, {
            factor: 'test',
            weight: -0.1
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'weight'));
    });
    (0, node_test_1.default)('rejects weight above 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, {
            factor: 'test',
            weight: 1.1
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'weight'));
    });
    (0, node_test_1.default)('accepts weight at boundaries', async () => {
        const dto1 = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, { factor: 'a', weight: 0 });
        const errors1 = await (0, class_validator_1.validate)(dto1);
        strict_1.default.equal(errors1.length, 0);
        const dto2 = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, { factor: 'b', weight: 1 });
        const errors2 = await (0, class_validator_1.validate)(dto2);
        strict_1.default.equal(errors2.length, 0);
    });
});
// ── CreateStrategyDto ──
(0, node_test_1.describe)('ai-recommend.dto: CreateStrategyDto', () => {
    (0, node_test_1.default)('validates correct create strategy', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test-strategy',
            description: 'A test strategy',
            targetType: 'game',
            weights: [{ factor: 'popularity', weight: 1.0 }],
            minScore: 10,
            maxResults: 20
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates create with minimal optional fields', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'minimal',
            description: 'Minimal',
            targetType: 'game',
            weights: [{ factor: 'rating', weight: 0.5 }]
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing name', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            description: 'test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 1.0 }]
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'name'));
    });
    (0, node_test_1.default)('rejects missing description', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 1.0 }]
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'description'));
    });
    (0, node_test_1.default)('rejects empty name', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: '',
            description: 'test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 1.0 }]
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects invalid targetType', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test',
            description: 'test',
            targetType: 'invalid',
            weights: [{ factor: 'a', weight: 1.0 }]
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'targetType'));
    });
    (0, node_test_1.default)('rejects empty weights array', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test',
            description: 'test',
            targetType: 'game',
            weights: []
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'weights'));
    });
    (0, node_test_1.default)('rejects minScore below 0', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test',
            description: 'test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 0.5 }],
            minScore: -1
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'minScore'));
    });
    (0, node_test_1.default)('rejects maxResults below 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test',
            description: 'test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 0.5 }],
            maxResults: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'maxResults'));
    });
    (0, node_test_1.default)('rejects maxResults above 100', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'test',
            description: 'test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 0.5 }],
            maxResults: 101
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'maxResults'));
    });
});
// ── UpdateStrategyDto ──
(0, node_test_1.describe)('ai-recommend.dto: UpdateStrategyDto', () => {
    (0, node_test_1.default)('validates empty update (all optional)', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateStrategyDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates partial update with name only', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateStrategyDto, {
            name: 'new-name'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates partial update with weights only', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateStrategyDto, {
            weights: [{ factor: 'popularity', weight: 0.8 }]
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects invalid targetType in update', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.UpdateStrategyDto, {
            targetType: 'invalid'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'targetType'));
    });
});
// ── GenerateRecommendationsDto ──
(0, node_test_1.describe)('ai-recommend.dto: GenerateRecommendationsDto', () => {
    (0, node_test_1.default)('validates correct generate request', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            strategyId: 'strategy-hybrid-v1',
            memberId: 'member-001',
            storeId: 'store-001',
            type: 'game',
            limit: 5
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('validates generate with only strategyId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            strategyId: 'strategy-popularity-v1'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing strategyId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            memberId: 'm-1'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'strategyId'));
    });
    (0, node_test_1.default)('rejects empty strategyId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            strategyId: ''
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects invalid type in generate', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            strategyId: 'hybrid',
            type: 'invalid'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects limit below 1', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            strategyId: 'hybrid',
            limit: 0
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('rejects limit above 100', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.GenerateRecommendationsDto, {
            strategyId: 'hybrid',
            limit: 200
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── RecordConversionDto ──
(0, node_test_1.describe)('ai-recommend.dto: RecordConversionDto', () => {
    (0, node_test_1.default)('validates correct conversion record', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordConversionDto, {
            recommendationId: 'rec-001'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('rejects missing recommendationId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordConversionDto, {});
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
        strict_1.default.ok(errors.some(e => e.property === 'recommendationId'));
    });
    (0, node_test_1.default)('rejects empty recommendationId', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.RecordConversionDto, {
            recommendationId: ''
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
});
// ── Cross-DTO edge case ──
(0, node_test_1.describe)('ai-recommend.dto: cross-DTO edge cases', () => {
    (0, node_test_1.default)('price range min can equal max', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PriceRangeDto, { min: 100, max: 100 });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('gameTypes can include non-array values rejected', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.PreferencesDto, {
            gameTypes: 'string-illegal',
            priceRange: { min: 0, max: 100 },
            visitFrequency: 'daily',
            avgSpend: 0,
            favoriteTimeSlot: '10:00'
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.ok(errors.length > 0);
    });
    (0, node_test_1.default)('weight factor names can be arbitrary strings', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.StrategyWeightDto, {
            factor: 'custom-long-factor-name',
            weight: 0.33
        });
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
    (0, node_test_1.default)('CreateStrategyDto fallbackStrategy is optional', async () => {
        const dto = (0, class_transformer_1.plainToInstance)(ai_recommend_dto_1.CreateStrategyDto, {
            name: 'no-fallback',
            description: 'no fallback test',
            targetType: 'game',
            weights: [{ factor: 'a', weight: 1.0 }]
        });
        // fallbackStrategy is optional, so accessing it is fine
        strict_1.default.equal(dto.fallbackStrategy, undefined);
        const errors = await (0, class_validator_1.validate)(dto);
        strict_1.default.equal(errors.length, 0);
    });
});
//# sourceMappingURL=ai-recommend.dto.test.js.map