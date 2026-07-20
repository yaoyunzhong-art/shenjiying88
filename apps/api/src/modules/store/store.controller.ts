/**
 * store.controller.ts · 门店管理 Controller
 *
 * Phase 1 商店管理模块 REST API
 * - GET /api/stores — 列表分页查询
 * - GET /api/stores/:id — 详情
 * - POST /api/stores — 创建门店
 * - PUT /api/stores/:id — 更新
 * - DELETE /api/stores/:id — 删除
 * - GET /api/stores/:id/stats — 门店统计数据
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { TenantGuard } from '../agent/tenant.guard'
import { StoreService } from './store.service'
import {
  CreateStoreDto,
  UpdateStoreDto,
  StoreQueryDto,
  StoreDto,
  StoreListDto,
  StoreStatsDto,
} from './store.dto'

@ApiTags('门店管理')
@ApiBearerAuth()
@Controller('api/stores')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  /**
   * GET /api/stores — 列表分页查询
   */
  @Get()
  @ApiOperation({ summary: '门店列表', description: '分页查询门店列表，支持关键字搜索、状态/类型筛选' })
  @ApiOkResponse({ type: StoreListDto })
  list(
    @TenantContext() ctx: RequestTenantContext,
    @Query() query: StoreQueryDto = {} as StoreQueryDto,
  ): StoreListDto {
    const result = this.storeService.list(ctx, query)
    return {
      items: result.items as unknown as StoreDto[],
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  }

  /**
   * GET /api/stores/:id — 详情
   */
  @Get(':id')
  @ApiOperation({ summary: '门店详情', description: '根据 ID 获取门店详细信息' })
  @ApiOkResponse({ type: StoreDto })
  getById(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): StoreDto {
    return this.storeService.getById(id, ctx) as unknown as StoreDto
  }

  /**
   * POST /api/stores — 创建门店
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建门店', description: '创建新门店' })
  @ApiOkResponse({ type: StoreDto })
  create(
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: CreateStoreDto,
  ): StoreDto {
    return this.storeService.create(ctx, body) as unknown as StoreDto
  }

  /**
   * PUT /api/stores/:id — 更新门店
   */
  @Put(':id')
  @ApiOperation({ summary: '更新门店', description: '更新门店信息' })
  @ApiOkResponse({ type: StoreDto })
  update(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
    @Body() body: UpdateStoreDto,
  ): StoreDto {
    return this.storeService.update(id, ctx, body) as unknown as StoreDto
  }

  /**
   * DELETE /api/stores/:id — 删除门店
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除门店', description: '删除指定门店' })
  @ApiOkResponse({ type: Object })
  delete(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): { success: boolean } {
    this.storeService.delete(id, ctx)
    return { success: true }
  }

  /**
   * GET /api/stores/:id/stats — 门店统计数据
   */
  @Get(':id/stats')
  @ApiOperation({ summary: '门店统计', description: '获取门店运营统计数据' })
  @ApiOkResponse({ type: StoreStatsDto })
  getStats(
    @Param('id') id: string,
    @TenantContext() ctx: RequestTenantContext,
  ): StoreStatsDto {
    return this.storeService.getStats(id, ctx) as unknown as StoreStatsDto
  }
}
