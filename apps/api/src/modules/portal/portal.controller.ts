import { Controller, Get, Optional } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { PortalService } from './portal.service'
import { CustomDomainService } from '../saas-advanced/custom-domain.service'
import {
  PortalBootstrapResponseDto,
  PortalDomainGovernanceSummaryDto,
  PortalDto,
} from './portal.dto'

@ApiTags('portal')
@Controller('portals')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    @Optional()
    private readonly customDomainService?: CustomDomainService,
  ) {}

  /** 获取完整的门户 bootstrap 信息（含 tenant/brand/store 门户 + 市场配置 + 基础依赖） */
  @ApiOperation({
    summary: '获取门户 bootstrap 信息',
    description: '返回租户、品牌、门店三层门户视图，以及市场画像、区域覆盖配置和 foundation 依赖元数据。',
  })
  @Get('bootstrap')
  @ApiOkResponse({ type: PortalBootstrapResponseDto })
  getBootstrap(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.getBootstrap(tenantContext)
  }

  /** 仅获取租户级别 ToB 门户信息 */
  @ApiOperation({
    summary: '获取租户级门户',
    description: '返回租户级 ToB 门户，主域名优先走已配置的 custom primary domain，否则回退平台默认域名。',
  })
  @Get('tenant-portal')
  @ApiOkResponse({ type: PortalDto })
  getTenantPortal(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.resolveTenantPortal(tenantContext)
  }

  /** 仅获取品牌级别 ToB 门户信息 */
  @ApiOperation({
    summary: '获取品牌级门户',
    description: '返回品牌级 ToB 门户，若品牌已绑定主域名则优先返回品牌主域名。',
  })
  @Get('brand-portal')
  @ApiOkResponse({ type: PortalDto })
  getBrandPortal(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.resolveBrandPortal(tenantContext)
  }

  /** 仅获取门店级别 ToC 门户信息 */
  @ApiOperation({
    summary: '获取门店级门户',
    description: '返回门店级 ToC 门户，包含多端 supportedSurfaces 和主域名决策结果。',
  })
  @Get('store-portal')
  @ApiOkResponse({ type: PortalDto })
  getStorePortal(@TenantContext() tenantContext: RequestTenantContext) {
    return this.portalService.resolveStorePortal(tenantContext)
  }

  /** 获取当前上下文门户关联的域名治理摘要 */
  @ApiOperation({
    summary: '获取门户域名治理摘要',
    description: '返回当前 tenant/brand/store 上下文对应的主域名治理摘要，用于门户侧展示风险提示与治理入口。',
  })
  @Get('domain-governance')
  @ApiOkResponse({ type: PortalDomainGovernanceSummaryDto })
  async getDomainGovernance(@TenantContext() tenantContext: RequestTenantContext) {
    return (
      (await this.customDomainService?.getGovernanceSummaryForRequest(tenantContext)) ?? {
        totalMissingPrimaryScopes: 0,
        totalActiveWithoutPrimaryDomains: 0,
        recommendedReadyScopes: 0,
        tenantMissingPrimaryScopes: 0,
        brandMissingPrimaryScopes: 0,
        storeMissingPrimaryScopes: 0,
        requiresAttention: false,
        lastEvaluatedAt: new Date().toISOString(),
        currentScopes: [],
      }
    )
  }
}
