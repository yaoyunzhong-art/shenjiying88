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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendController = void 0;
const common_1 = require("@nestjs/common");
const ai_recommend_service_1 = require("./ai-recommend.service");
const ai_recommend_dto_1 = require("./ai-recommend.dto");
let AiRecommendController = class AiRecommendController {
    aiRecommendService;
    constructor(aiRecommendService) {
        this.aiRecommendService = aiRecommendService;
    }
    // ===== 推荐查询 =====
    /** 热门推荐 */
    getPopular(query) {
        return this.aiRecommendService.getPopularRecommendations(query.storeId, query.type, query.limit ?? 10);
    }
    /** 个性化推荐 */
    getPersonalized(query) {
        if (!query.memberId) {
            throw new Error('个性化推荐需要 memberId 参数');
        }
        return this.aiRecommendService.getPersonalizedRecommendations(query.memberId, query.type, query.limit ?? 10);
    }
    /** 推荐历史查询 */
    getRecommendations(query) {
        return this.aiRecommendService.getRecommendations({
            storeId: query.storeId,
            memberId: query.memberId,
            type: query.type,
            limit: query.limit
        });
    }
    // ===== 推荐生成 =====
    /** 按策略批量生成推荐 */
    generateRecommendations(dto) {
        return this.aiRecommendService.generateRecommendations({
            strategyId: dto.strategyId,
            memberId: dto.memberId,
            storeId: dto.storeId,
            type: dto.type,
            limit: dto.limit
        });
    }
    // ===== 策略管理 =====
    /** 创建推荐策略 */
    createStrategy(dto) {
        return this.aiRecommendService.createStrategy(dto);
    }
    /** 获取所有策略 */
    getStrategies() {
        return this.aiRecommendService.getStrategies();
    }
    /** 获取指定策略 */
    getStrategy(id) {
        return this.aiRecommendService.getStrategy(id);
    }
    /** 更新策略 */
    updateStrategy(id, dto) {
        return this.aiRecommendService.updateStrategy(id, dto);
    }
    /** 启用策略 */
    enableStrategy(id) {
        return this.aiRecommendService.enableStrategy(id);
    }
    /** 禁用策略 */
    disableStrategy(id) {
        return this.aiRecommendService.disableStrategy(id);
    }
    // ===== 画像管理 =====
    /** 获取用户画像 */
    getProfile(memberId) {
        return this.aiRecommendService.getProfile(memberId);
    }
    /** 创建/更新用户画像 */
    updateProfile(memberId, dto) {
        return this.aiRecommendService.updateProfile(memberId, dto);
    }
    // ===== 反馈收集 =====
    /** 记录物品评分 */
    recordScore(dto) {
        return this.aiRecommendService.recordInteraction(dto);
    }
    /** 记录交互行为（简化版） */
    recordInteraction(dto) {
        // 自动计算 weight 和 rating
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
        return this.aiRecommendService.recordInteraction({
            memberId: dto.memberId,
            itemId: dto.itemId,
            itemType: dto.itemType,
            rating: ratingMap[dto.interaction] ?? 3,
            interaction: dto.interaction,
            weight: weightMap[dto.interaction] ?? 0.5
        });
    }
    /** 记录推荐转化 */
    recordConversion(dto) {
        return this.aiRecommendService.recordConversion(dto.recommendationId);
    }
};
exports.AiRecommendController = AiRecommendController;
__decorate([
    (0, common_1.Get)('recommendations/popular'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.RecommendationQueryDto]),
    __metadata("design:returntype", Array)
], AiRecommendController.prototype, "getPopular", null);
__decorate([
    (0, common_1.Get)('recommendations/personalized'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.RecommendationQueryDto]),
    __metadata("design:returntype", Array)
], AiRecommendController.prototype, "getPersonalized", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.RecommendationQueryDto]),
    __metadata("design:returntype", Array)
], AiRecommendController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.GenerateRecommendationsDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "generateRecommendations", null);
__decorate([
    (0, common_1.Post)('strategies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.CreateStrategyDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "createStrategy", null);
__decorate([
    (0, common_1.Get)('strategies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], AiRecommendController.prototype, "getStrategies", null);
__decorate([
    (0, common_1.Get)('strategies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "getStrategy", null);
__decorate([
    (0, common_1.Put)('strategies/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_recommend_dto_1.UpdateStrategyDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "updateStrategy", null);
__decorate([
    (0, common_1.Patch)('strategies/:id/enable'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "enableStrategy", null);
__decorate([
    (0, common_1.Patch)('strategies/:id/disable'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "disableStrategy", null);
__decorate([
    (0, common_1.Get)('profiles/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profiles/:memberId'),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_recommend_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('interactions/score'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.ItemScoreDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "recordScore", null);
__decorate([
    (0, common_1.Post)('interactions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.RecordInteractionDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "recordInteraction", null);
__decorate([
    (0, common_1.Post)('conversions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommend_dto_1.RecordConversionDto]),
    __metadata("design:returntype", Object)
], AiRecommendController.prototype, "recordConversion", null);
exports.AiRecommendController = AiRecommendController = __decorate([
    (0, common_1.Controller)('ai-recommend'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __metadata("design:paramtypes", [ai_recommend_service_1.AiRecommendService])
], AiRecommendController);
//# sourceMappingURL=ai-recommend.controller.js.map