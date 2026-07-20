import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { MemberSpendingAnalysisService } from './member-spending-analysis.service'
import { SpendingQueryDto, SpendingListDto, SpendingSummaryDto } from './member-spending-analysis.dto'
import type { MemberSpendingDto } from './member-spending-analysis.dto'
import type { SpendingAnalysis } from './member-spending-analysis.entity'

@UseGuards(TenantGuard)
@Controller('member-spending')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class MemberSpendingAnalysisController {
  constructor(private readonly spendingService: MemberSpendingAnalysisService) {}

  /** GET /member-spending — 列表查询（分页） */
  @Get()
  async list(@Query() query: SpendingQueryDto): Promise<{ success: boolean; data: SpendingListDto }> {
    const data = await this.spendingService.query(query)
    return { success: true, data }
  }

  /** GET /member-spending/summary — 消费总览 */
  @Get('summary')
  getSummary(): { success: boolean; data: SpendingSummaryDto } {
    const data = this.spendingService.getSummary()
    return { success: true, data }
  }

  /** GET /member-spending/:memberId — 单会员详情 */
  @Get(':memberId')
  async getMember(@Param('memberId') memberId: string): Promise<{ success: boolean; data: MemberSpendingDto }> {
    const data = await this.spendingService.getMemberSpending(memberId)
    return { success: true, data }
  }

  /** POST /member-spending — 创建分析记录 */
  @Post()
  async create(@Body() body: SpendingAnalysis): Promise<{ success: boolean; data: SpendingAnalysis }> {
    const data = await this.spendingService.create(body)
    return { success: true, data }
  }
}
