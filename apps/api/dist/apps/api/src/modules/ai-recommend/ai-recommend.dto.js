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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordConversionDto = exports.GenerateRecommendationsDto = exports.UpdateStrategyDto = exports.CreateStrategyDto = exports.StrategyWeightDto = exports.RecommendationQueryDto = exports.RecordInteractionDto = exports.ItemScoreDto = exports.UpdateProfileDto = exports.UserProfileDto = exports.PriceRangeDto = exports.PreferencesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
require("reflect-metadata");
/**
 * 用户偏好设置 DTO
 */
class PreferencesDto {
    gameTypes;
    priceRange;
    visitFrequency;
    avgSpend;
    favoriteTimeSlot;
}
exports.PreferencesDto = PreferencesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], PreferencesDto.prototype, "gameTypes", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PriceRangeDto),
    __metadata("design:type", PriceRangeDto)
], PreferencesDto.prototype, "priceRange", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['daily', 'weekly', 'monthly', 'occasional']),
    __metadata("design:type", String)
], PreferencesDto.prototype, "visitFrequency", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PreferencesDto.prototype, "avgSpend", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PreferencesDto.prototype, "favoriteTimeSlot", void 0);
/**
 * 价格区间 DTO
 */
class PriceRangeDto {
    min;
    max;
}
exports.PriceRangeDto = PriceRangeDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PriceRangeDto.prototype, "min", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PriceRangeDto.prototype, "max", void 0);
/**
 * 用户画像 DTO
 */
class UserProfileDto {
    memberId;
    tenantId;
    preferences;
    behaviorTags;
}
exports.UserProfileDto = UserProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PreferencesDto),
    __metadata("design:type", PreferencesDto)
], UserProfileDto.prototype, "preferences", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UserProfileDto.prototype, "behaviorTags", void 0);
/**
 * 更新用户画像 DTO（所有字段可选）
 */
class UpdateProfileDto {
    preferences;
    behaviorTags;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PreferencesDto),
    __metadata("design:type", PreferencesDto)
], UpdateProfileDto.prototype, "preferences", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateProfileDto.prototype, "behaviorTags", void 0);
/**
 * 物品评分 DTO
 */
class ItemScoreDto {
    memberId;
    itemId;
    itemType;
    rating;
    interaction;
    weight;
}
exports.ItemScoreDto = ItemScoreDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ItemScoreDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ItemScoreDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['game', 'product', 'activity']),
    __metadata("design:type", String)
], ItemScoreDto.prototype, "itemType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], ItemScoreDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['view', 'click', 'purchase', 'play']),
    __metadata("design:type", String)
], ItemScoreDto.prototype, "interaction", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], ItemScoreDto.prototype, "weight", void 0);
/**
 * 记录交互 DTO（简化版，rating/weight 自动计算）
 */
class RecordInteractionDto {
    memberId;
    itemId;
    itemType;
    interaction;
}
exports.RecordInteractionDto = RecordInteractionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecordInteractionDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecordInteractionDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['game', 'product', 'activity']),
    __metadata("design:type", String)
], RecordInteractionDto.prototype, "itemType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['view', 'click', 'purchase', 'play']),
    __metadata("design:type", String)
], RecordInteractionDto.prototype, "interaction", void 0);
/**
 * 推荐查询 DTO
 */
class RecommendationQueryDto {
    storeId;
    memberId;
    type;
    limit;
}
exports.RecommendationQueryDto = RecommendationQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['game', 'product', 'activity', 'coupon', 'svip']),
    __metadata("design:type", String)
], RecommendationQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], RecommendationQueryDto.prototype, "limit", void 0);
/**
 * 策略权重因子 DTO
 */
class StrategyWeightDto {
    factor;
    weight;
}
exports.StrategyWeightDto = StrategyWeightDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], StrategyWeightDto.prototype, "factor", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], StrategyWeightDto.prototype, "weight", void 0);
/**
 * 创建推荐策略 DTO
 */
class CreateStrategyDto {
    name;
    description;
    targetType;
    weights;
    fallbackStrategy;
    minScore;
    maxResults;
}
exports.CreateStrategyDto = CreateStrategyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStrategyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStrategyDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['game', 'product', 'activity', 'coupon', 'svip']),
    __metadata("design:type", String)
], CreateStrategyDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StrategyWeightDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], CreateStrategyDto.prototype, "weights", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStrategyDto.prototype, "fallbackStrategy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateStrategyDto.prototype, "minScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CreateStrategyDto.prototype, "maxResults", void 0);
/**
 * 更新推荐策略 DTO（所有字段可选）
 */
class UpdateStrategyDto {
    name;
    description;
    targetType;
    weights;
    fallbackStrategy;
    minScore;
    maxResults;
}
exports.UpdateStrategyDto = UpdateStrategyDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStrategyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStrategyDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['game', 'product', 'activity', 'coupon', 'svip']),
    __metadata("design:type", String)
], UpdateStrategyDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StrategyWeightDto),
    __metadata("design:type", Array)
], UpdateStrategyDto.prototype, "weights", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStrategyDto.prototype, "fallbackStrategy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateStrategyDto.prototype, "minScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpdateStrategyDto.prototype, "maxResults", void 0);
/**
 * 生成推荐 DTO
 */
class GenerateRecommendationsDto {
    strategyId;
    memberId;
    storeId;
    type;
    limit;
}
exports.GenerateRecommendationsDto = GenerateRecommendationsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateRecommendationsDto.prototype, "strategyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateRecommendationsDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateRecommendationsDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['game', 'product', 'activity', 'coupon', 'svip']),
    __metadata("design:type", String)
], GenerateRecommendationsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GenerateRecommendationsDto.prototype, "limit", void 0);
/**
 * 转化记录 DTO
 */
class RecordConversionDto {
    recommendationId;
}
exports.RecordConversionDto = RecordConversionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecordConversionDto.prototype, "recommendationId", void 0);
//# sourceMappingURL=ai-recommend.dto.js.map