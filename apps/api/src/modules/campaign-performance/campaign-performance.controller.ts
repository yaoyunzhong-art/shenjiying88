// campaign-performance.controller.ts — Phase3 活动效果评估控制器

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CampaignQueryDto, CreateCampaignDto } from './campaign-performance.dto'
import { CampaignPerformanceService } from './campaign-performance.service'

@ApiTags('活动效果评估')
@UseGuards(TenantGuard)
@Controller('campaign-performance')
export class CampaignPerformanceController {
  constructor(
    private readonly campaignPerformanceService: CampaignPerformanceService,
  ) {}

  // ── 列表查询（分页+筛选） ──

  @Get()
  @ApiOperation({ summary: '活动效果列表', description: '按门店、时间、类型、状态筛选活动效果数据' })
  listCampaigns(@Query() query: CampaignQueryDto) {
    const records = this.campaignPerformanceService.listCampaigns({
      storeId: query.storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      campaignType: query.campaignType,
      status: query.status,
    })

    const items = records.map((r) => ({
      id: r.id,
      campaignName: r.name,
      type: r.type,
      startDate: r.startDate,
      endDate: r.endDate,
      budget: r.budget,
      actualCost: r.cost,
      participants: r.participants,
      newMembers: r.newMembers,
      revenue: r.revenue,
      roi: r.cost > 0 ? Number(((r.revenue / r.cost) * 100).toFixed(2)) : 0,
      satisfaction: r.satisfaction,
    }))

    const summary = this.campaignPerformanceService.getSummary({
      storeId: query.storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      campaignType: query.campaignType,
      status: query.status,
    })

    return {
      items,
      total: items.length,
      summary,
    }
  }

  // ── 汇总 ──

  @Get('summary')
  @ApiOperation({ summary: '活动效果汇总', description: '获取所有活动的预算/成本/营收/ROI 汇总' })
  getSummary(@Query() query: CampaignQueryDto) {
    return this.campaignPerformanceService.getSummary({
      storeId: query.storeId,
      startDate: query.startDate,
      endDate: query.endDate,
      campaignType: query.campaignType,
      status: query.status,
    })
  }

  // ── 单条详情 ──

  @Get(':id')
  @ApiOperation({ summary: '活动效果详情', description: '按 ID 获取单条活动效果详情' })
  getCampaign(@Param('id') id: string) {
    const record = this.campaignPerformanceService.getCampaign(id)
    if (!record) {
      return null
    }
    return {
      id: record.id,
      campaignName: record.name,
      type: record.type,
      startDate: record.startDate,
      endDate: record.endDate,
      budget: record.budget,
      actualCost: record.cost,
      participants: record.participants,
      newMembers: record.newMembers,
      revenue: record.revenue,
      roi: record.cost > 0 ? Number(((record.revenue / record.cost) * 100).toFixed(2)) : 0,
      satisfaction: record.satisfaction,
    }
  }

  // ── 创建活动记录 ──

  @Post()
  @ApiOperation({ summary: '创建活动记录', description: '创建一条新的活动效果记录' })
  createCampaign(@Body() body: CreateCampaignDto) {
    const record = this.campaignPerformanceService.createCampaign({
      name: body.campaignName,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      budget: body.budget,
      cost: body.actualCost,
      participants: body.participants,
      newMembers: body.newMembers,
      revenue: body.revenue,
      satisfaction: body.satisfaction ?? 0,
    })

    return {
      id: record.id,
      campaignName: record.name,
      type: record.type,
      startDate: record.startDate,
      endDate: record.endDate,
      budget: record.budget,
      actualCost: record.cost,
      participants: record.participants,
      newMembers: record.newMembers,
      revenue: record.revenue,
      roi: record.cost > 0 ? Number(((record.revenue / record.cost) * 100).toFixed(2)) : 0,
      satisfaction: record.satisfaction,
    }
  }
}
