import { Controller, Get, Post, Body, Param, Query, UsePipes, ValidationPipe, NotFoundException } from '@nestjs/common'
import { MemberPredictService } from './member-predict.service'
import { PredictQueryDto } from './member-predict.dto'
import type { MemberPredictDto, PredictSummaryDto, MemberPredictListDto } from './member-predict.dto'

@Controller('member-predict')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MemberPredictController {
  constructor(private readonly memberPredictService: MemberPredictService) {}

  /** GET /member-predict - 预测列表 */
  @Get()
  async findAll(@Query() query: PredictQueryDto): Promise<{ success: boolean; data: MemberPredictListDto }> {
    const items = await this.memberPredictService.findAll(query.storeId, query.riskLevel, query.minScore)
    return {
      success: true,
      data: {
        items,
        total: items.length
      }
    }
  }

  /** GET /member-predict/summary - 预测汇总 */
  @Get('summary')
  async getSummary(): Promise<{ success: boolean; data: PredictSummaryDto }> {
    const summary = await this.memberPredictService.getSummary()
    return { success: true, data: summary }
  }

  /** GET /member-predict/risk-distribution - 按风险等级统计 */
  @Get('risk-distribution')
  async getRiskDistribution(): Promise<{
    success: boolean
    data: { riskLevel: string; count: number; avgScore: number }[]
  }> {
    const distribution = await this.memberPredictService.getRiskDistribution()
    return { success: true, data: distribution }
  }

  /** POST /member-predict/evaluate - 流失风险评估 */
  @Post('evaluate')
  async evaluateRisk(
    @Body() body: { memberId: string; riskScore: number; churnProbability: number }
  ): Promise<{ success: boolean; data: { riskLevel: string; suggestion: string } }> {
    const result = await this.memberPredictService.evaluateRisk(body.memberId, body.riskScore, body.churnProbability)
    return { success: true, data: result }
  }

  /** GET /member-predict/:id - 按会员 ID 查询 */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<{ success: boolean; data: MemberPredictDto | null }> {
    const prediction = await this.memberPredictService.findById(id)
    if (!prediction) {
      throw new NotFoundException(`Prediction for member "${id}" not found`)
    }
    return { success: true, data: prediction }
  }

  /** POST /member-predict - 添加预测 */
  @Post()
  async create(
    @Body() body: {
      memberId: string
      memberName: string
      memberLevel: string
      riskScore: number
      churnProbability: number
      mainReason: string
      suggestedAction: string
      lastActiveDate: string
      storeId: string
    }
  ): Promise<{ success: boolean; data: MemberPredictDto }> {
    const result = await this.memberPredictService.create(body)
    return { success: true, data: result }
  }
}
