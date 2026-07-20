/**
 * 付费授权 - Controller (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * RESTful API:
 * - GET    /api/license/check?scope=ai.capability    前置校验 (UI 入口拦截调用)
 * - GET    /api/license/tenant                       列出租户授权
 * - GET    /api/license/store                        列出门店授权
 * - POST   /api/license                              创建授权 (admin)
 * - POST   /api/license/:id/suspend                  暂停
 * - GET    /api/license/audit                        审计日志 (180 天)
 *
 * 激活码 API:
 * - POST   /api/license/activate                      激活码激活
 * - POST   /api/license/codes/generate               生成激活码 (admin)
 * - GET    /api/license/codes/:code/verify           验证激活码
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
  ForbiddenException,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import type { Request } from 'express'
import { LicenseService } from './license.service'
import { ActivationCodeService } from './services/activation-code.service'
import { RequireLicense } from './license.guard'
import { runWithTenant, type TenantContext } from '../../common/context/tenant-context'
import type { LicenseScope } from './license.entity'

@UseGuards(TenantGuard)
@Controller('license')
export class LicenseController {
  constructor(
    private readonly service: LicenseService,
    private readonly activationCodeService: ActivationCodeService,
  ) {}

  /** GET /license/check?scope=...&storeId=... */
  @Get('check')
  @RequireLicense('ai.capability', { allowTrial: true })
  async check(
    @Req() req: Request,
    @Query('scope') scope: LicenseScope,
    @Query('storeId') storeId?: string,
  ) {
    const ctx = this.extractTenant(req, { storeId })
    return runWithTenant(ctx, () => this.service.checkLicense({ scope, storeId }))
  }

  /** GET /license/tenant */
  @Get('tenant')
  @RequireLicense('ai.capability')
  async listTenantLicenses(@Req() req: Request) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const data = await this.service.listLicensesByTenant(ctx.tenantId)
      return { data, total: data.length }
    })
  }

  /** GET /license/store?storeId=... */
  @Get('store')
  @RequireLicense('ai.capability')
  async listStoreLicenses(@Req() req: Request, @Query('storeId') storeId: string) {
    const ctx = this.extractTenant(req, { storeId })
    return runWithTenant(ctx, async () => {
      const data = await this.service.listLicensesByStore(ctx.tenantId, storeId)
      return { data, total: data.length }
    })
  }

  /** GET /license/audit?limit=100 */
  @Get('audit')
  @RequireLicense('ai.capability')
  async listAudit(@Req() req: Request, @Query('limit') limitStr?: string) {
    const ctx = this.extractTenant(req)
    const limit = Math.min(parseInt(limitStr ?? '100', 10) || 100, 500)
    return runWithTenant(ctx, async () => {
      const data = await this.service.listAuditLogs(ctx.tenantId, limit)
      return { data, total: data.length }
    })
  }

  /** POST /license/:id/suspend */
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const ctx = this.extractTenant(req)
    return runWithTenant(ctx, async () => {
      const license = await this.service.suspend(id, ctx.userId ?? 'system', reason ?? 'admin suspend')
      return { data: license }
    })
  }

  // ============ 激活码 API ============

  /** POST /license/activate - 使用激活码激活授权 */
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Req() req: Request,
    @Body('code') code: string,
    @Body('scope') scope: LicenseScope,
    @Body('storeId') storeId?: string,
  ) {
    const ctx = this.extractTenant(req, { storeId })
    
    const result = await this.activationCodeService.verifyAndActivate({
      code,
      scope,
      tenantId: ctx.tenantId,
      storeId,
    })

    if (!result.success) {
      throw new ForbiddenException({
        code: 'ACTIVATION_FAILED',
        message: result.message,
      })
    }

    return {
      success: true,
      licenseId: result.licenseId,
      message: result.message,
      expiresAt: result.expiresAt?.toISOString(),
    }
  }

  /** POST /license/codes/generate - 生成激活码 (admin only) */
  @Post('codes/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateActivationCode(
    @Req() req: Request,
    @Body() body: {
      scope: string
      durationDays: number
      quota?: number
      level: 'tenant' | 'store'
      count?: number
    },
  ) {
    const user = (req as any).user ?? {}
    
    // 仅 admin 可生成激活码
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '仅管理员可生成激活码',
      })
    }

    const count = body.count ?? 1
    const codes: string[] = []

    for (let i = 0; i < count; i++) {
      const code = await this.activationCodeService.generateCode({
        scope: body.scope,
        durationDays: body.durationDays,
        quota: body.quota,
        level: body.level,
      })
      codes.push(code)
    }

    return {
      codes,
      count: codes.length,
      scope: body.scope,
      durationDays: body.durationDays,
      generatedBy: user.id ?? user.userId,
      generatedAt: new Date().toISOString(),
    }
  }

  /** GET /license/codes/:code/verify - 验证激活码有效性 */
  @Get('codes/:code/verify')
  async verifyActivationCode(
    @Param('code') code: string,
    @Query('scope') scope: string,
  ) {
    // 这里只做格式验证，详细验证在 activate 时进行
    const isValidFormat = this.activationCodeService.validateFormat(code)
    
    return {
      code,
      scope,
      formatValid: isValidFormat,
      message: isValidFormat ? '激活码格式正确' : '激活码格式无效',
    }
  }

  // ============ 私有 ============

  private extractTenant(req: Request, override?: { storeId?: string }): TenantContext {
    const user = (req as any).user ?? {}
    if (!user.tenantId) {
      throw new Error('[controller] Missing tenantId in req.user')
    }
    return {
      tenantId: user.tenantId,
      storeId: override?.storeId ?? user.storeId,
      userId: user.id ?? user.userId,
      role: user.role,
    }
  }
}