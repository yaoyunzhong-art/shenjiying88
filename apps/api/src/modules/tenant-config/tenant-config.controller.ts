/**
 * 三级独立配置 - Controller (V9 需求 4 · V10 Day 6 Phase 90)
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import { TenantConfigService } from './tenant-config.service'
import {
  GetConfigDto,
  SetConfigBatchDto,
  RollbackConfigDto,
  maskConfigResponse,
  type ConfigResponse,
  type EffectiveConfigResponse,
} from './tenant-config.dto'
import type { ConfigInstance, ConfigItemDefinition, ConfigLevel } from './tenant-config.entity'
import { BUILTIN_CONFIG_DEFINITIONS, LEVEL_TO_WORKBENCH } from './tenant-config.entity'

@Controller('tenant-config')
export class TenantConfigController {
  constructor(private readonly service: TenantConfigService) {}

  /**
   * GET /tenant-config
   * 查询当前级别的配置
   */
  @Get()
  async listConfigs(@Query() query: GetConfigDto): Promise<{
    workbench: string
    level: ConfigLevel
    items: ConfigResponse[]
    total: number
  }> {
    const instances = await this.service.getConfigs({
      category: query.category,
      level: query.level,
      keys: query.keys,
    })
    const defs = new Map(BUILTIN_CONFIG_DEFINITIONS.map((d) => [d.key, d]))
    const items: ConfigResponse[] = instances.map((inst) => {
      const def = defs.get(inst.key)
      return maskConfigResponse(inst, def?.sensitivity ?? 'public')
    })
    return {
      workbench: query.level ? LEVEL_TO_WORKBENCH[query.level] : 'auto',
      level: query.level ?? 'tenant',
      items,
      total: items.length,
    }
  }

  /**
   * GET /tenant-config/effective
   * 获取生效值 (考虑继承链)
   */
  @Get('effective')
  async effective(@Query('category') category?: string): Promise<{
    items: EffectiveConfigResponse[]
    total: number
  }> {
    const items = await this.service.getEffectiveConfigs(category)
    return { items, total: items.length }
  }

  /**
   * GET /tenant-config/workbench/:code
   * 工作台视角 (W-S / W-T / W-B)
   */
  @Get('workbench/:code')
  async workbench(
    @Param('code') code: string,
    @Query('category') category?: string,
  ): Promise<{ workbench: string; items: EffectiveConfigResponse[]; total: number }> {
    if (!['W-S', 'W-T', 'W-B'].includes(code)) {
      throw new BadRequestException(`Invalid workbench code: ${code}`)
    }
    const items = await this.service.getWorkbenchConfigs(code as any, category)
    return {
      workbench: code,
      items,
      total: items.length,
    }
  }

  /**
   * GET /tenant-config/:key
   * 查询单个配置
   */
  @Get(':key')
  async getOne(@Param('key') key: string): Promise<ConfigResponse | null> {
    const instance = await this.service.getConfig(key)
    if (!instance) return null
    const def = BUILTIN_CONFIG_DEFINITIONS.find((d) => d.key === key)
    return maskConfigResponse(instance, def?.sensitivity ?? 'public')
  }

  /**
   * POST /tenant-config/batch
   * 批量设置配置
   */
  @Post('batch')
  async batch(@Body() body: SetConfigBatchDto): Promise<{
    items: ConfigResponse[]
    total: number
  }> {
    const instances = await this.service.setConfigBatch(body.items)
    const defs = new Map(BUILTIN_CONFIG_DEFINITIONS.map((d) => [d.key, d]))
    const items: ConfigResponse[] = instances.map((inst) => {
      const def = defs.get(inst.key)
      return maskConfigResponse(inst, def?.sensitivity ?? 'public')
    })
    return { items, total: items.length }
  }

  /**
   * POST /tenant-config/rollback
   * 回滚配置到指定版本
   */
  @Post('rollback')
  async rollback(@Body() body: RollbackConfigDto): Promise<ConfigResponse> {
    const instance = await this.service.rollback(body.targetVersion, body.configId)
    const def = BUILTIN_CONFIG_DEFINITIONS.find((d) => d.key === instance.key)
    return maskConfigResponse(instance, def?.sensitivity ?? 'public')
  }

  /**
   * GET /tenant-config/definitions
   * 获取所有配置项定义 (前端 UI 用)
   */
  @Get('meta/definitions')
  definitions(): { items: ConfigItemDefinition[]; total: number } {
    return { items: BUILTIN_CONFIG_DEFINITIONS, total: BUILTIN_CONFIG_DEFINITIONS.length }
  }
}
