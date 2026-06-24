import { Controller, Get, Req } from '@nestjs/common'
import { TenantAwareRequest } from './tenant.types'

@Controller('tenant')
export class TenantController {
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
}
