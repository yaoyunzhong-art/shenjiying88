import { type Recommendation, type UserProfile, type ItemScore, type RecommendationStrategy, type RecommendType, type StrategyWeightFactor, type GenerateRecommendationsInput, type GenerateRecommendationsOutput } from './ai-recommend.entity';
export declare class AiRecommendService {
    private recommendations;
    private profiles;
    private itemScores;
    private strategies;
    private itemInteractionCounts;
    constructor();
    private seedDefaultStrategies;
    private seedMockInteractions;
    /**
     * 热门推荐：按交互次数排序，返回 top-N
     */
    getPopularRecommendations(storeId?: string, type?: RecommendType, limit?: number): Recommendation[];
    /**
     * 个性化推荐：基于用户画像进行内容匹配推荐
     * 冷启动处理：无画像时回退到热门推荐
     */
    getPersonalizedRecommendations(memberId: string, type?: RecommendType, limit?: number): Recommendation[];
    /**
     * 协同过滤：找到相似用户也喜欢的物品
     */
    private getSimilarUserRecommendations;
    private getItemGameType;
    /**
     * 按策略批量生成推荐
     */
    generateRecommendations(input: GenerateRecommendationsInput): GenerateRecommendationsOutput;
    createStrategy(dto: {
        name: string;
        description: string;
        targetType: RecommendType;
        weights: StrategyWeightFactor[];
        fallbackStrategy?: string;
        minScore?: number;
        maxResults?: number;
    }): RecommendationStrategy;
    getStrategies(): RecommendationStrategy[];
    getStrategy(id: string): RecommendationStrategy | undefined;
    updateStrategy(id: string, dto: Partial<{
        name: string;
        description: string;
        targetType: RecommendType;
        weights: StrategyWeightFactor[];
        fallbackStrategy?: string;
        minScore?: number;
        maxResults?: number;
    }>): RecommendationStrategy;
    enableStrategy(id: string): RecommendationStrategy;
    disableStrategy(id: string): RecommendationStrategy;
    /**
     * 记录物品交互/评分
     */
    recordInteraction(dto: {
        memberId: string;
        itemId: string;
        itemType: 'game' | 'product' | 'activity';
        rating: number;
        interaction: 'view' | 'click' | 'purchase' | 'play';
        weight: number;
    }): ItemScore;
    /**
     * 记录推荐转化
     */
    recordConversion(recommendationId: string): Recommendation | undefined;
    /**
     * 从交互自动更新用户画像
     */
    private updateProfileFromInteraction;
    /**
     * 更新用户画像
     */
    updateProfile(memberId: string, dto: {
        preferences?: {
            gameTypes?: string[];
            priceRange?: {
                min: number;
                max: number;
            };
            visitFrequency?: 'daily' | 'weekly' | 'monthly' | 'occasional';
            avgSpend?: number;
            favoriteTimeSlot?: string;
        };
        behaviorTags?: string[];
    }): UserProfile;
    getProfile(memberId: string): UserProfile | undefined;
    getRecommendations(query: {
        storeId?: string;
        memberId?: string;
        type?: RecommendType;
        limit?: number;
    }): Recommendation[];
}
//# sourceMappingURL=ai-recommend.service.d.ts.map