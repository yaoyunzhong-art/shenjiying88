import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { RecommenderService } from './recommender.service'
import { PersonalizedRecommenderService, type RecommendResponse } from './personalized-recommender.service'
import { ContextBuilderService } from './context-builder.service'
import { RagRetrievalService } from './rag-retrieval.service'
import {
  RecommendQueryDto,
  RecommendFeedbackDto,
  RecommendStatsQueryDto,
} from './recommender.dto'
import type { RecommendationItem, RecommendationLog } from './recommender.entity'

@Controller('recommender')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RecommenderController {
  constructor(
    private readonly personalizedRecommender: PersonalizedRecommenderService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly ragRetrieval: RagRetrievalService,
    private readonly recommenderService: RecommenderService,
  ) {}

  /**
   * 获取知识推荐
   * POST /recommender/recommend
   */
  @Post('recommend')
  recommend(@Body() dto: RecommendQueryDto): RecommendResponse {
    // champion 数据 → 完整推荐
    const champion = this.recommenderService.getChampion(dto.championId)
    const allChampions = this.recommenderService.getAllChampions()
    return this.personalizedRecommender.recommend({
      champion,
      currentFiles: dto.currentFiles,
      branch: dto.branch,
      allChampions,
      topK: dto.topK,
    })
  }

  /**
   * 获取指定 Champion 当前上下文
   * GET /recommender/context/:championId
   */
  @Get('context/:championId')
  getContext(@Param('championId') championId: string) {
    const champion = this.recommenderService.getChampion(championId)
    const allChampions = this.recommenderService.getAllChampions()
    return this.contextBuilder.build({
      champion,
      currentFiles: [],
      allChampions,
    })
  }

  /**
   * 记录推荐反馈（采纳/忽略/已读）
   * POST /recommender/feedback
   */
  @Post('feedback')
  recordFeedback(@Body() dto: RecommendFeedbackDto): { success: boolean } {
    this.recommenderService.recordFeedback(
      dto.championId,
      dto.chunkId,
      dto.action,
    )
    return { success: true }
  }

  /**
   * 检索知识库
   * POST /recommender/search
   */
  @Post('search')
  search(
    @Body() dto: RecommendQueryDto,
  ): Array<{ chunkId: string; sourcePath: string; content: string; totalScore: number; reason: string }> {
    const champion = this.recommenderService.getChampion(dto.championId)
    const allChampions = this.recommenderService.getAllChampions()
    const context = this.contextBuilder.build({
      champion,
      currentFiles: dto.currentFiles,
      branch: dto.branch,
      allChampions,
    })
    return this.ragRetrieval.retrieve({ context, topK: dto.topK })
  }

  /**
   * 获取推荐统计
   * GET /recommender/stats
   */
  @Get('stats')
  getStats(@Query() query: RecommendStatsQueryDto): RecommendationLog[] {
    return this.recommenderService.getStats({
      championId: query.championId,
      module: query.module,
      days: query.days,
    })
  }
}
