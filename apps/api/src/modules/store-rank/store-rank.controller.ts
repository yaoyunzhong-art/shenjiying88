import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { StoreRankService } from './store-rank.service'
import { RankQueryDto } from './store-rank.dto'
import { RankPeriod, RankMetric } from './store-rank.entity'

@Controller('store-rank')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StoreRankController {
  constructor(private readonly rankService: StoreRankService) {}

  // ── GET /store-rank — 排行列表 ──
  @Get()
  list(
    @TenantContext() tenant: RequestTenantContext,
    @Query() query: RankQueryDto
  ) {
    const items = this.rankService.list(tenant.tenantId, {
      sortBy: query.sortBy,
      period: query.period,
      limit: query.limit,
    })
    return { items, total: items.length }
  }

  // ── GET /store-rank/:id — 单条排行 ──
  @Get(':id')
  get(
    @TenantContext() tenant: RequestTenantContext,
    @Param('id') id: string
  ) {
    return this.rankService.require(id, tenant.tenantId)
  }

  // ── GET /store-rank/summary — 排行摘要 ──
  @Get('summary')
  getSummary(
    @TenantContext() tenant: RequestTenantContext,
    @Query('metric') metric?: string,
    @Query('period') period?: string
  ) {
    const validMetric = metric ? (metric as RankMetric) : undefined
    const validPeriod = period ? (period as RankPeriod) : undefined
    return this.rankService.getSummary(tenant.tenantId, validMetric, validPeriod)
  }

  // ── GET /store-rank/changes — 排名变化追踪 ──
  @Get('changes')
  getChanges(
    @TenantContext() tenant: RequestTenantContext,
    @Query('storeId') storeId?: string,
    @Query('period') period?: string
  ) {
    const validPeriod = period ? (period as RankPeriod) : undefined
    return this.rankService.getRankChanges(tenant.tenantId, storeId, validPeriod)
  }

  // ── POST /store-rank — 创建/计算排行 ──
  @Post()
  create(
    @TenantContext() tenant: RequestTenantContext,
    @Body() body: {
      storeId: string
      storeName: string
      revenue: number
      growth: number
      satisfaction: number
      efficiency: number
      memberCount: number
      deviceCount: number
      period: string
    }
  ) {
    const results = this.rankService.computeRanking({
      tenantId: tenant.tenantId,
      storeId: body.storeId,
      storeName: body.storeName,
      revenue: body.revenue,
      growth: body.growth,
      satisfaction: body.satisfaction,
      efficiency: body.efficiency,
      memberCount: body.memberCount,
      deviceCount: body.deviceCount,
      period: body.period as RankPeriod,
    })
    return results
  }

  // ── DELETE /store-rank/:id — 删除排行记录 ──
  @Delete(':id')
  delete(
    @TenantContext() tenant: RequestTenantContext,
    @Param('id') id: string
  ) {
    this.rankService.delete(id, tenant.tenantId)
    return { success: true }
  }
}
