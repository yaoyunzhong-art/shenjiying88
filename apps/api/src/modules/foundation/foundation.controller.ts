import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { CurrentActor, RequirePermissions, RequireRoles, RequireTenantScope, type CurrentActorValue } from './identity-access/identity-access.decorator'
import { FoundationService } from './foundation.service'

@Controller('foundation')
export class FoundationController {
  constructor(private readonly foundationService: FoundationService) {}

  @Get('bootstrap')
  getBootstrap(@TenantContext() tenantContext: RequestTenantContext) {
    return {
      tenantContext,
      ...this.foundationService.getBlueprint()
    }
  }

  @Get('modules')
  getModules() {
    return this.foundationService.getModuleCatalog()
  }

  @Get('overview')
  async getOperationsOverview(@TenantContext() tenantContext: RequestTenantContext | undefined) {
    return this.foundationService.getOperationsOverview(tenantContext)
  }

  @Get('overview/alerts')
  async getOperationsAlerts(@TenantContext() tenantContext: RequestTenantContext | undefined) {
    return this.foundationService.getOperationsAlerts(tenantContext)
  }

  @Get('overview/alerts/catalog')
  async getOperationsAlertsCatalog(@TenantContext() tenantContext: RequestTenantContext | undefined) {
    return this.foundationService.getOperationsAlertsCatalog(tenantContext)
  }

  @Get('overview/alerts/:code/drilldown')
  async getOperationsAlertDrilldown(
    @Param('code') code: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined
  ) {
    return this.foundationService.getOperationsAlertDrilldown(code, tenantContext)
  }

  @Post('overview/alerts/:code/ack')
  @RequireTenantScope()
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.operations.alerts.write')
  async acknowledgeOperationsAlert(
    @Param('code') code: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { note?: string }
  ) {
    return this.foundationService.acknowledgeOperationsAlert(code, tenantContext, actorContext, body?.note)
  }

  @Post('overview/alerts/:code/mute')
  @RequireTenantScope()
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.operations.alerts.write')
  async muteOperationsAlert(
    @Param('code') code: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { mutedUntil?: string; note?: string }
  ) {
    return this.foundationService.muteOperationsAlert(code, tenantContext, actorContext, body)
  }

  @Post('overview/alerts/:code/unmute')
  @RequireTenantScope()
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.operations.alerts.write')
  async unmuteOperationsAlert(
    @Param('code') code: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { note?: string }
  ) {
    return this.foundationService.unmuteOperationsAlert(code, tenantContext, actorContext, body?.note)
  }

  @Get('overview/modules/:moduleKey')
  async getOperationsModuleDetail(
    @Param('moduleKey') moduleKey: string,
    @TenantContext() tenantContext: RequestTenantContext | undefined
  ) {
    return this.foundationService.getOperationsModuleDetail(moduleKey, tenantContext)
  }

  @Get('consumers')
  getConsumers() {
    return this.foundationService.getConsumerCatalog()
  }

  @Get('consumers/:consumer')
  getConsumer(@Param('consumer') consumer: string) {
    return this.foundationService.getConsumerDependency(consumer)
  }
}
