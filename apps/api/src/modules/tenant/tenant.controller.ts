import { Controller, Get, Post, Body, Query, Param, Req, UsePipes, ValidationPipe } from '@nestjs/common'
import { TenantAwareRequest } from './tenant.types'
import { TenantService } from './tenant.service'
import { TenantQuotaService } from './tenant-quota.service'
import { TenantLifecycleService } from './tenant-lifecycle.service'
import { TenantContextSetDto } from './tenant.dto'
import { QuotaResourceKind, TenantTier } from './tenant-quota.entity'
import { TenantLifecycleStatus, TenantStatusReason } from './tenant-lifecycle.entity'
import type { TenantQuota, TenantQuotaUsage, QuotaCheckResult } from './tenant-quota.entity'
import type { TenantLifecycleRecord } from './tenant-lifecycle.entity'

@Controller('tenant')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantQuotaService: TenantQuotaService,
    private readonly tenantLifecycleService: TenantLifecycleService,
  ) {}

  @Get('resolve')
  resolveTenant(@Req() req: TenantAwareRequest) {
    const { tenantContext, actorContext, governanceContext } = req

    const effectiveTenantId = actorContext?.tenantId ?? tenantContext?.tenantId ?? 'tenant-demo'

    return {
      requestId: governanceContext?.requestId,
      effectiveTenantId,
      effectiveBrandId: actorContext?.brandId ?? tenantContext?.brandId,
      effectiveStoreId: actorContext?.storeId ?? tenantContext?.storeId,
      effectiveMarketCode: tenantContext?.marketCode,
      actor: actorContext
        ? {
            actorId: actorContext.actorId,
            actorType: actorContext.actorType,
            actorName: actorContext.actorName,
            roles: actorContext.roles,
            permissions: actorContext.permissions,
            authenticated: actorContext.authenticated
          }
        : null,
      source: 'tenant-module'
    }
  }

  // ─── 配额管理 (TenantQuotaService) ───

  @Post('quota/init')
  initQuota(@Body() body: { tenantId: string; tier?: TenantTier }): { data: TenantQuota } {
    const quota = this.tenantQuotaService.initialize(body.tenantId, body.tier)
    return { data: quota }
  }

  @Get('quota/:tenantId')
  getQuota(@Param('tenantId') tenantId: string): { data: TenantQuota | null } {
    const quota = this.tenantQuotaService.getQuota(tenantId)
    return { data: quota ?? null }
  }

  @Post('quota/set-tier')
  setTier(@Body() body: { tenantId: string; tier: TenantTier }): { data: TenantQuota } {
    const quota = this.tenantQuotaService.setTier(body.tenantId, body.tier)
    return { data: quota }
  }

  @Post('quota/override')
  overrideQuota(
    @Body() body: { tenantId: string; overrides: Partial<Omit<TenantQuota, 'tenantId' | 'updatedAt'>> }
  ): { data: TenantQuota } {
    const quota = this.tenantQuotaService.overrideQuota(body.tenantId, body.overrides)
    return { data: quota }
  }

  @Post('quota/check')
  checkQuota(@Body() body: { tenantId: string; resource: QuotaResourceKind }): { data: QuotaCheckResult } {
    const result = this.tenantQuotaService.check(body.tenantId, body.resource)
    return { data: result }
  }

  @Post('quota/reserve')
  reserveQuota(@Body() body: { tenantId: string; resource: QuotaResourceKind }): { data: QuotaCheckResult } {
    const result = this.tenantQuotaService.reserve(body.tenantId, body.resource)
    return { data: result }
  }

  @Get('quota/:tenantId/usage')
  getUsage(@Param('tenantId') tenantId: string): { data: TenantQuotaUsage } {
    const usage = this.tenantQuotaService.getUsage(tenantId)
    return { data: usage }
  }

  @Get('quota/defaults')
  getDefaultTierQuotas(): { data: ReturnType<TenantQuotaService['listDefaultTierQuotas']> } {
    return { data: this.tenantQuotaService.listDefaultTierQuotas() }
  }

  // ─── 生命周期管理 (TenantLifecycleService) ───

  @Post('lifecycle/init')
  initLifecycle(@Body() body: { tenantId: string }): { data: TenantLifecycleRecord } {
    const lifecycle = this.tenantLifecycleService.initialize(body.tenantId)
    return { data: lifecycle }
  }

  @Get('lifecycle/:tenantId')
  getLifecycle(@Param('tenantId') tenantId: string): { data: TenantLifecycleRecord | null } {
    const lifecycle = this.tenantLifecycleService.getLifecycle(tenantId)
    return { data: lifecycle ?? null }
  }

  @Get('lifecycle/:tenantId/status')
  getStatus(@Param('tenantId') tenantId: string): { data: { status: TenantLifecycleStatus } } {
    const status = this.tenantLifecycleService.getStatus(tenantId)
    return { data: { status } }
  }

  @Post('lifecycle/suspend')
  suspend(
    @Body() body: { tenantId: string; reason?: TenantStatusReason; actorId?: string; note?: string }
  ): { data: TenantLifecycleRecord } {
    const lifecycle = this.tenantLifecycleService.suspend(body.tenantId, body.reason, body.actorId, body.note)
    return { data: lifecycle }
  }

  @Post('lifecycle/reactivate')
  reactivate(
    @Body() body: { tenantId: string; actorId?: string; note?: string }
  ): { data: TenantLifecycleRecord } {
    const lifecycle = this.tenantLifecycleService.reactivate(body.tenantId, body.actorId, body.note)
    return { data: lifecycle }
  }

  @Post('lifecycle/delete')
  softDelete(
    @Body() body: { tenantId: string; reason?: TenantStatusReason; actorId?: string; note?: string }
  ): { data: TenantLifecycleRecord } {
    const lifecycle = this.tenantLifecycleService.softDelete(body.tenantId, body.reason, body.actorId, body.note)
    return { data: lifecycle }
  }

  @Get('lifecycle/active')
  listActive(): { data: TenantLifecycleRecord[] } {
    return { data: this.tenantLifecycleService.listByStatus(TenantLifecycleStatus.Active) }
  }

  @Get('lifecycle/suspended')
  listSuspended(): { data: TenantLifecycleRecord[] } {
    return { data: this.tenantLifecycleService.listByStatus(TenantLifecycleStatus.Suspended) }
  }
}
