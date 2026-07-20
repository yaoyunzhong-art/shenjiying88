import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { AiRecommendService } from './ai-recommend.service'
import {
  RecommendationQueryDto,
  UserProfileDto,
  UpdateProfileDto,
  ItemScoreDto,
  RecordInteractionDto,
  CreateStrategyDto,
  UpdateStrategyDto,
  GenerateRecommendationsDto,
  RecordConversionDto
} from './ai-recommend.dto'
import type {
  Recommendation,
  UserProfile,
  ItemScore,
  RecommendationStrategy,
  GenerateRecommendationsOutput
} from './ai-recommend.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-recommend')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AiRecommendController {
  constructor(private readonly aiRecommendService: AiRecommendService) {}

  // ===== 推荐查询 =====

  /** 热门推荐 */
  @Get('recommendations/popular')
  getPopular(@Query() query: RecommendationQueryDto): Recommendation[] {
    return this.aiRecommendService.getPopularRecommendations(
      query.storeId,
      query.type,
      query.limit ?? 10
    )
  }

  /** 个性化推荐 */
  @Get('recommendations/personalized')
  getPersonalized(@Query() query: RecommendationQueryDto): Recommendation[] {
    if (!query.memberId) {
      throw new Error('个性化推荐需要 memberId 参数')
    }
    return this.aiRecommendService.getPersonalizedRecommendations(
      query.memberId,
      query.type,
      query.limit ?? 10
    )
  }

  /** 推荐历史查询 */
  @Get('recommendations')
  getRecommendations(@Query() query: RecommendationQueryDto): Recommendation[] {
    return this.aiRecommendService.getRecommendations({
      storeId: query.storeId,
      memberId: query.memberId,
      type: query.type,
      limit: query.limit
    })
  }

  // ===== 推荐生成 =====

  /** 按策略批量生成推荐 */
  @Post('generate')
  generateRecommendations(
    @Body() dto: GenerateRecommendationsDto
  ): GenerateRecommendationsOutput {
    return this.aiRecommendService.generateRecommendations({
      strategyId: dto.strategyId,
      memberId: dto.memberId,
      storeId: dto.storeId,
      type: dto.type,
      limit: dto.limit
    })
  }

  // ===== 策略管理 =====

  /** 创建推荐策略 */
  @Post('strategies')
  createStrategy(@Body() dto: CreateStrategyDto): RecommendationStrategy {
    return this.aiRecommendService.createStrategy(dto)
  }

  /** 获取所有策略 */
  @Get('strategies')
  getStrategies(): RecommendationStrategy[] {
    return this.aiRecommendService.getStrategies()
  }

  /** 获取指定策略 */
  @Get('strategies/:id')
  getStrategy(@Param('id') id: string): RecommendationStrategy | undefined {
    return this.aiRecommendService.getStrategy(id)
  }

  /** 更新策略 */
  @Put('strategies/:id')
  updateStrategy(
    @Param('id') id: string,
    @Body() dto: UpdateStrategyDto
  ): RecommendationStrategy {
    return this.aiRecommendService.updateStrategy(id, dto)
  }

  /** 启用策略 */
  @Patch('strategies/:id/enable')
  enableStrategy(@Param('id') id: string): RecommendationStrategy {
    return this.aiRecommendService.enableStrategy(id)
  }

  /** 禁用策略 */
  @Patch('strategies/:id/disable')
  disableStrategy(@Param('id') id: string): RecommendationStrategy {
    return this.aiRecommendService.disableStrategy(id)
  }

  // ===== 画像管理 =====

  /** 获取用户画像 */
  @Get('profiles/:memberId')
  getProfile(@Param('memberId') memberId: string): UserProfile | undefined {
    return this.aiRecommendService.getProfile(memberId)
  }

  /** 创建/更新用户画像 */
  @Put('profiles/:memberId')
  updateProfile(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateProfileDto
  ): UserProfile {
    return this.aiRecommendService.updateProfile(memberId, dto)
  }

  // ===== 反馈收集 =====

  /** 记录物品评分 */
  @Post('interactions/score')
  recordScore(@Body() dto: ItemScoreDto): ItemScore {
    return this.aiRecommendService.recordInteraction(dto)
  }

  /** 记录交互行为（简化版） */
  @Post('interactions')
  recordInteraction(@Body() dto: RecordInteractionDto): ItemScore {
    // 自动计算 weight 和 rating
    const weightMap: Record<string, number> = {
      view: 0.3,
      click: 0.5,
      purchase: 1.0,
      play: 0.8
    }
    const ratingMap: Record<string, number> = {
      view: 3,
      click: 3,
      purchase: 5,
      play: 4
    }

    return this.aiRecommendService.recordInteraction({
      memberId: dto.memberId,
      itemId: dto.itemId,
      itemType: dto.itemType,
      rating: ratingMap[dto.interaction] ?? 3,
      interaction: dto.interaction,
      weight: weightMap[dto.interaction] ?? 0.5
    })
  }

  /** 记录推荐转化 */
  @Post('conversions')
  recordConversion(
    @Body() dto: RecordConversionDto
  ): Recommendation | undefined {
    return this.aiRecommendService.recordConversion(dto.recommendationId)
  }
}
