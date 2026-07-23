/**
 * tenant-quota.controller.ts — P-31 多租户隔离: TenantQuotaService API 端点
 *
 * 端点说明:
 *   GET  /tenants/:id/quota        — 获取租户配额
 *   PUT  /tenants/:id/quota        — 更新租户配额 (override / tier upgrade)
 *   GET  /tenants/:id/quota/usage  — 获取租户当前使用量
 *
 * 设计约束:
 *   - 所有响应统一包裹 { data: ... } (与 tenant.controller.ts 一致)
 *   - 使用 class-validator DTO 校验 (whitelist + transform)
 *   - 未初始化时 GET quota 返回 404,GET usage 返回空 usage
 */

import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { TenantQuotaService } from './tenant-quota.service'
import { TenantQuotaParamsDto, UpdateTenantQuotaDto } from './tenant-quota.dto'
import type { TenantQuota, TenantQuotaUsage } from './tenant-quota.entity'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('tenants')
@UseGuards(TenantGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TenantQuotaController {
  constructor(private readonly tenantQuotaService: TenantQuotaService) {}

  /**
   * GET /tenants/:id/quota
   * 获取指定租户的配额配置
   * 未初始化时返回 404
   */
  @Get(':id/quota')
  getQuota(@Param() params: TenantQuotaParamsDto): { data: TenantQuota } {
    const { id } = params
    const quota = this.tenantQuotaService.getQuota(id)
    if (!quota) {
      throw new NotFoundException(`Tenant quota not found for id: ${id}`)
    }
    return { data: quota }
  }

  /**
   * PUT /tenants/:id/quota
   * 更新租户配额 (支持 tier 升级/降级 + 字段覆盖)
   * 未初始化时自动按 Free tier 初始化后再覆盖
   */
  @Put(':id/quota')
  updateQuota(
    @Param() params: TenantQuotaParamsDto,
    @Body() body: UpdateTenantQuotaDto,
  ): { data: TenantQuota } {
    const { id } = params
    const { tier, ...overrides } = body

    // 如果指定了 tier,先 setTier (应用默认值)
    if (tier !== undefined) {
      this.tenantQuotaService.setTier(id, tier)
    }

    // 如果有额外覆盖字段,应用 override
    const hasOverrides = Object.keys(overrides).length > 0
    if (hasOverrides) {
      const quota = this.tenantQuotaService.overrideQuota(id, overrides as Partial<Omit<TenantQuota, 'tenantId' | 'updatedAt'>>)
      return { data: quota }
    }

    // 只有 tier 变更
    const quota = this.tenantQuotaService.getOrInitQuota(id)
    return { data: quota }
  }

  /**
   * GET /tenants/:id/quota/usage
   * 获取指定租户的当前资源使用量
   * 未初始化时返回空 usage (不会报 404)
   */
  @Get(':id/quota/usage')
  getUsage(@Param() params: TenantQuotaParamsDto): { data: TenantQuotaUsage } {
    const { id } = params
    const usage = this.tenantQuotaService.getUsage(id)
    return { data: usage }
  }
}
