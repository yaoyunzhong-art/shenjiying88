import { AiRecommendService } from './ai-recommend.service';
import { RecommendationQueryDto, UpdateProfileDto, ItemScoreDto, RecordInteractionDto, CreateStrategyDto, UpdateStrategyDto, GenerateRecommendationsDto, RecordConversionDto } from './ai-recommend.dto';
import type { Recommendation, UserProfile, ItemScore, RecommendationStrategy, GenerateRecommendationsOutput } from './ai-recommend.entity';
export declare class AiRecommendController {
    private readonly aiRecommendService;
    constructor(aiRecommendService: AiRecommendService);
    /** 热门推荐 */
    getPopular(query: RecommendationQueryDto): Recommendation[];
    /** 个性化推荐 */
    getPersonalized(query: RecommendationQueryDto): Recommendation[];
    /** 推荐历史查询 */
    getRecommendations(query: RecommendationQueryDto): Recommendation[];
    /** 按策略批量生成推荐 */
    generateRecommendations(dto: GenerateRecommendationsDto): GenerateRecommendationsOutput;
    /** 创建推荐策略 */
    createStrategy(dto: CreateStrategyDto): RecommendationStrategy;
    /** 获取所有策略 */
    getStrategies(): RecommendationStrategy[];
    /** 获取指定策略 */
    getStrategy(id: string): RecommendationStrategy | undefined;
    /** 更新策略 */
    updateStrategy(id: string, dto: UpdateStrategyDto): RecommendationStrategy;
    /** 启用策略 */
    enableStrategy(id: string): RecommendationStrategy;
    /** 禁用策略 */
    disableStrategy(id: string): RecommendationStrategy;
    /** 获取用户画像 */
    getProfile(memberId: string): UserProfile | undefined;
    /** 创建/更新用户画像 */
    updateProfile(memberId: string, dto: UpdateProfileDto): UserProfile;
    /** 记录物品评分 */
    recordScore(dto: ItemScoreDto): ItemScore;
    /** 记录交互行为（简化版） */
    recordInteraction(dto: RecordInteractionDto): ItemScore;
    /** 记录推荐转化 */
    recordConversion(dto: RecordConversionDto): Recommendation | undefined;
}
//# sourceMappingURL=ai-recommend.controller.d.ts.map