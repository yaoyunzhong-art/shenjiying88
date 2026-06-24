import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { TenantContext } from '../../tenant/tenant.decorator'
import type { RequestTenantContext } from '../../tenant/tenant.types'
import {
  CurrentActor,
  RequirePermissions,
  RequireRoles,
  RequireTenantScope,
  type CurrentActorValue
} from '../identity-access/identity-access.decorator'
import {
  RecordRuntimeGovernanceCallbackDto,
  ReplayRuntimeGovernanceActionDto,
  SubmitRuntimeGovernanceActionDto,
  SyncRuntimeGovernanceActionDto
} from './runtime-governance.dto'
import { RuntimeGovernanceService } from './runtime-governance.service'

@Controller('foundation/runtime-governance')
@RequireTenantScope()
export class RuntimeGovernanceController {
  constructor(private readonly runtimeGovernanceService: RuntimeGovernanceService) {}

  @Post('actions')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  submitAction(
    @Body() body: SubmitRuntimeGovernanceActionDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.submitAction(enrichRuntimeRequestContext(body, tenantContext, actorContext))
  }

  @Get('actions/:receiptCode')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.read')
  getActionReceipt(@Param('receiptCode') receiptCode: string) {
    return this.runtimeGovernanceService.getActionReceipt(receiptCode)
  }

  @Post('actions/:receiptCode/sync')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  syncAction(
    @Param('receiptCode') receiptCode: string,
    @Body() body: SyncRuntimeGovernanceActionDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.syncAction(receiptCode, enrichRuntimeRequestContext(body, tenantContext, actorContext))
  }

  @Post('actions/:receiptCode/callback')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  recordCallback(
    @Param('receiptCode') receiptCode: string,
    @Body() body: RecordRuntimeGovernanceCallbackDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.recordCallback(
      receiptCode,
      enrichRuntimeRequestContext(body, tenantContext, actorContext)
    )
  }

  @Post('actions/:receiptCode/replay')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  replayAction(
    @Param('receiptCode') receiptCode: string,
    @Body() body: ReplayRuntimeGovernanceActionDto,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.replayAction(receiptCode, enrichRuntimeRequestContext(body, tenantContext, actorContext))
  }
}

function enrichRuntimeRequestContext<T extends object>(
  body: T,
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue
) {
  const baseBody = body as T & { actorId?: string }
  return {
    ...baseBody,
    actorId: actorContext?.actorId ?? (typeof baseBody.actorId === 'string' ? baseBody.actorId : undefined),
    tenantId: tenantContext?.tenantId,
    brandId: tenantContext?.brandId,
    storeId: tenantContext?.storeId,
    marketCode: tenantContext?.marketCode
  }
}
