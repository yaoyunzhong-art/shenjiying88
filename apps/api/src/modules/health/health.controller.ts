import { Controller, Get, Query } from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { Public } from '../foundation/identity-access/public.decorator'
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
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  getHealth() {
    return this.healthService.ping()
  }

  @Public()
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
