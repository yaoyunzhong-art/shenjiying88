import 'reflect-metadata';
/**
 * 用户偏好设置 DTO
 */
export declare class PreferencesDto {
    gameTypes: string[];
    priceRange: PriceRangeDto;
    visitFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    avgSpend: number;
    favoriteTimeSlot: string;
}
/**
 * 价格区间 DTO
 */
export declare class PriceRangeDto {
    min: number;
    max: number;
}
/**
 * 用户画像 DTO
 */
export declare class UserProfileDto {
    memberId: string;
    tenantId: string;
    preferences: PreferencesDto;
    behaviorTags: string[];
}
/**
 * 更新用户画像 DTO（所有字段可选）
 */
export declare class UpdateProfileDto {
    preferences?: PreferencesDto;
    behaviorTags?: string[];
}
/**
 * 物品评分 DTO
 */
export declare class ItemScoreDto {
    memberId: string;
    itemId: string;
    itemType: 'game' | 'product' | 'activity';
    rating: number;
    interaction: 'view' | 'click' | 'purchase' | 'play';
    weight: number;
}
/**
 * 记录交互 DTO（简化版，rating/weight 自动计算）
 */
export declare class RecordInteractionDto {
    memberId: string;
    itemId: string;
    itemType: 'game' | 'product' | 'activity';
    interaction: 'view' | 'click' | 'purchase' | 'play';
}
/**
 * 推荐查询 DTO
 */
export declare class RecommendationQueryDto {
    storeId?: string;
    memberId?: string;
    type?: 'game' | 'product' | 'activity' | 'coupon' | 'svip';
    limit?: number;
}
/**
 * 策略权重因子 DTO
 */
export declare class StrategyWeightDto {
    factor: string;
    weight: number;
}
/**
 * 创建推荐策略 DTO
 */
export declare class CreateStrategyDto {
    name: string;
    description: string;
    targetType: 'game' | 'product' | 'activity' | 'coupon' | 'svip';
    weights: StrategyWeightDto[];
    fallbackStrategy?: string;
    minScore?: number;
    maxResults?: number;
}
/**
 * 更新推荐策略 DTO（所有字段可选）
 */
export declare class UpdateStrategyDto {
    name?: string;
    description?: string;
    targetType?: 'game' | 'product' | 'activity' | 'coupon' | 'svip';
    weights?: StrategyWeightDto[];
    fallbackStrategy?: string;
    minScore?: number;
    maxResults?: number;
}
/**
 * 生成推荐 DTO
 */
export declare class GenerateRecommendationsDto {
    strategyId: string;
    memberId?: string;
    storeId?: string;
    type?: 'game' | 'product' | 'activity' | 'coupon' | 'svip';
    limit?: number;
}
/**
 * 转化记录 DTO
 */
export declare class RecordConversionDto {
    recommendationId: string;
}
//# sourceMappingURL=ai-recommend.dto.d.ts.map