import { Controller, Get, Param } from '@nestjs/common'
import { TenantContext } from '../../tenant/tenant.decorator'
import type { RequestActorContext, RequestTenantContext } from '../../tenant/tenant.types'
import {
  CurrentActor,
  RequirePermissions,
  RequireRoles,
  RequireTenantScope
} from './identity-access.decorator'
import { IdentityAccessService } from './identity-access.service'

@Controller('identity-access')
export class IdentityAccessController {
  constructor(private readonly identityAccessService: IdentityAccessService) {}

  @Get('context')
  getContext(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext?: RequestActorContext
  ) {
    return this.identityAccessService.resolveActorContext(tenantContext, actorContext)
  }

  @Get('validate/role')
  @RequireRoles('tenant-admin', 'platform-admin')
  validateRole(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext?: RequestActorContext
  ) {
    return {
      status: 'allowed',
      check: 'role',
      resolved: this.identityAccessService.resolveActorContext(tenantContext, actorContext)
    }
  }

  @Get('validate/permission')
  @RequirePermissions('identity-access:read')
  validatePermission(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext?: RequestActorContext
  ) {
    return {
      status: 'allowed',
      check: 'permission',
      authorization: this.identityAccessService.authorizeAction(
        'identity-access:read',
        { tenantId: tenantContext.tenantId },
        tenantContext,
        actorContext
      )
    }
  }

  @Get('validate/tenant/:tenantId')
  @RequirePermissions('tenant:read')
  @RequireTenantScope({ tenantIdParam: 'tenantId', useRequestTenant: false })
  validateTenantScope(
    @Param('tenantId') tenantId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext?: RequestActorContext
  ) {
    return {
      status: 'allowed',
      check: 'tenant-scope',
      targetTenantId: tenantId,
      authorization: this.identityAccessService.authorizeAction(
        'tenant:read',
        { tenantId },
        tenantContext,
        actorContext
      )
    }
  }
}
