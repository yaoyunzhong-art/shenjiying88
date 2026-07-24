import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { TenantOptional } from '../agent/tenant-guard.decorator'

import { Public } from '../foundation/identity-access/public.decorator'
import { DatabaseBackupService } from './database-backup.service'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CurrentActor,
  RequirePermissions,
  RequireRoles,
  RequireTenantScope,
  type CurrentActorValue
} from '../foundation/identity-access/identity-access.decorator'
import { FoundationScopeType } from '@m5/domain'
import { HealthQueryDto } from './health.dto'
import type { HealthCheckContext } from './health.entity'
import { HealthService } from './health.service'

@UseGuards(TenantGuard)
@Controller('health')
export class HealthController {
  constructor(
    private readonly backupService: DatabaseBackupService,private readonly healthService: HealthService) {}

  @Public()
  @TenantOptional()
  @Get()
  getHealth() {
    return this.healthService.ping()
  }

  /** 备份状态 */
  @Get('backup')
  @Public()
  @TenantOptional()
  async getBackupStatus() {
    return this.backupService.getStatus()
  }

  /** 手动触发备份 */
  @Get('backup/trigger')
  @Public()
  @TenantOptional()
  async triggerBackup() {
    return this.backupService.triggerBackup()
  }

  @Public()
  @TenantOptional()
  @Get('ping')
  getPing() {
    return this.healthService.ping()
  }

  @Get('readiness')
  @RequireTenantScope()
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getReadiness(
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue,
    @Query() query: HealthQueryDto
  ) {
    return this.healthService.check(toHealthCheckContext(tenantContext, actorContext, query))
  }
}

function toHealthCheckContext(
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue,
  query: HealthQueryDto | undefined
): HealthCheckContext {
  return {
    scope: {
      scopeType: tenantContext?.storeId
        ? FoundationScopeType.Store
        : tenantContext?.brandId
          ? FoundationScopeType.Brand
          : tenantContext?.tenantId
            ? FoundationScopeType.Tenant
            : tenantContext?.marketCode
              ? FoundationScopeType.Market
              : FoundationScopeType.Platform,
      scopeId:
        tenantContext?.storeId ??
        tenantContext?.brandId ??
        tenantContext?.tenantId ??
        tenantContext?.marketCode ??
        'platform'
    },
    requestorId: actorContext?.actorId,
    verbose: normalizeVerbose(query?.verbose)
  }
}

function normalizeVerbose(value: HealthQueryDto['verbose'] | string | undefined) {
  return value === true || value === 'true'
}
