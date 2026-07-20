/**
 * AI 模型配置 - Controller V2 (V9 需求 1 · V10 Day 2)
 *
 * 升级要点:
 * - 全部方法 async + await (PG repository 异步)
 * - 用 service.withTenant() 注入 tenant context (V9 需求 5)
 * - 用户信息从 req.user 提取,V9 等保三级要求
 * - DTO 入参全量 class-validator (V10 硬约束)
 *
 * RESTful API:
 * - GET    /api/ai-model-config/presets              查询预设列表 (跨租户)
 * - GET    /api/ai-model-config/presets/:id          查询单个预设
 * - POST   /api/ai-model-config/store-configs        创建门店配置 (需 tenant)
 * - GET    /api/ai-model-config/store-configs        列出门店配置 (RLS)
 * - POST   /api/ai-model-config/switch               一键切换 (< 500ms)
 * - GET    /api/ai-model-config/history/:configId    历史版本 (RLS)
 * - POST   /api/ai-model-config/rollback             回滚 (RLS)
 */

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
UseGuards,
} from '@nestjs/common'
import type { Request } from 'express'
import { AiModelConfigService, type StoreConfigResponse } from './ai-model-config.service'
import {
  CreateAiModelStoreConfigDto,
  SwitchAiModelDto,
  RollbackAiModelDto,
  QueryAiModelPresetDto,
} from './ai-model-config.dto'
import type { TenantContext } from '../../common/context/tenant-context'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-model-config')
@UseGuards(TenantGuard)
export class AiModelConfigController {
  constructor(private readonly service: AiModelConfigService) {}

  // ============ 1. 系统预设 (无需 tenant 注入, 跨租户共享) ============

  /** GET /presets - 查询预设列表 */
  @Get('presets')
  async listPresets(@Query() query: QueryAiModelPresetDto) {
    const data = await this.service.listPresets({
      provider: query.provider,
      industry: query.industry,
      isActive: query.isActive,
    })
    return { data, total: data.length }
  }

  /** GET /presets/:id - 查询单个预设 */
  @Get('presets/:id')
  async getPreset(@Param('id') id: string) {
    return this.service.getPreset(id)
  }

  // ============ 2. 门店配置 (需 tenant 注入) ============

  /** POST /store-configs - 创建门店配置 */
  @Post('store-configs')
  @HttpCode(HttpStatus.CREATED)
  async createStoreConfig(
    @Req() req: Request,
    @Body() dto: CreateAiModelStoreConfigDto,
  ): Promise<StoreConfigResponse> {
    const ctx = this.extractTenant(req, { storeId: dto.storeId })
    return this.service.withTenant(ctx, () =>
      this.service.createStoreConfig(dto),
    )
  }

  /** GET /store-configs - 列出门店配置 (脱敏) */
  @Get('store-configs')
  async listStoreConfigs(@Req() req: Request) {
    const ctx = this.extractTenant(req)
    return this.service.withTenant(ctx, async () => {
      const storeId = ctx.storeId!
      const data = await this.service.listStoreConfigs(storeId)
      return { data, total: data.length }
    })
  }

  /** GET /store-configs/current - 获取当前生效配置 */
  @Get('store-configs/current')
  async getCurrentConfig(@Req() req: Request) {
    const ctx = this.extractTenant(req)
    return this.service.withTenant(ctx, async () => {
      const config = await this.service.getCurrentConfig(ctx.storeId!)
      return { data: config }
    })
  }

  // ============ 3. 一键切换 (热加载) ============

  /** POST /switch - 一键切换 */
  @Post('switch')
  @HttpCode(HttpStatus.OK)
  async switchConfig(@Req() req: Request, @Body() dto: SwitchAiModelDto) {
    const ctx = this.extractTenant(req)
    return this.service.withTenant(ctx, () => this.service.switchConfig(dto))
  }

  // ============ 4. 历史版本 + 回滚 ============

  /** GET /history/:configId - 历史版本 */
  @Get('history/:configId')
  async listHistory(@Req() req: Request, @Param('configId') configId: string) {
    const ctx = this.extractTenant(req)
    return this.service.withTenant(ctx, async () => {
      const data = await this.service.listHistory(configId)
      return { data, total: data.length }
    })
  }

  /** POST /rollback - 回滚 */
  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  async rollback(@Req() req: Request, @Body() dto: RollbackAiModelDto) {
    const ctx = this.extractTenant(req)
    return this.service.withTenant(ctx, () =>
      this.service.rollbackToHistory(dto.historyId, dto.reason),
    )
  }

  // ============ 私有: 提取 tenant context ============

  /**
   * 从 req.user (JWT/session 中间件注入) 提取 TenantContext
   * V9 等保三级: tenant_id 必填,store_id 在门店操作时必填
   */
  private extractTenant(req: Request, override?: { storeId?: string }): TenantContext {
    const user = (req as any).user ?? {}
    if (!user.tenantId) {
      throw new Error('[controller] Missing tenantId in req.user (auth guard not applied?)')
    }
    return {
      tenantId: user.tenantId,
      storeId: override?.storeId ?? user.storeId,
      userId: user.id ?? user.userId,
      role: user.role,
    }
  }
}