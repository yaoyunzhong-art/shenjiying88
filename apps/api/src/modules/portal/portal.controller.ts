import { Controller, Get } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { PortalService } from './portal.service'

@Controller('portals')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  /** 获取完整的门户 bootstrap 信息（含 tenant/brand/store 门户 + 市场配置 + 基础依赖） */
  @Get('bootstrap')
  getBootstrap(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.getBootstrap(tenantContext)
  }

  /** 仅获取租户级别 ToB 门户信息 */
  @Get('tenant-portal')
  getTenantPortal(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.resolveTenantPortal(tenantContext)
  }

  /** 仅获取品牌级别 ToB 门户信息 */
  @Get('brand-portal')
  getBrandPortal(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.resolveBrandPortal(tenantContext)
  }

  /** 仅获取门店级别 ToC 门户信息 */
  @Get('store-portal')
  getStorePortal(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.resolveStorePortal(tenantContext)
  }
}
