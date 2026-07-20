/**
 * Phase 96 自定义域名 Controller (V10 Sprint 2 Day 22)
 */

import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { requireTenantContext } from '../../common/context/tenant-context'
import {
  RequirePermissions,
  RequireRoles,
  RequireTenantScope,
} from '../foundation/identity-access/identity-access.decorator'
import { CustomDomainService } from './custom-domain.service'
import { isValidDomain, buildVerificationHost, buildVerificationValue } from './custom-domain.entity'
import {
  AddDomainRequest,
  ActiveWithoutPrimaryGovernanceQueryRequest,
  ActiveWithoutPrimaryGovernanceResponse,
  BatchRecommendPrimaryDomainRequest,
  BatchRecommendPrimaryDomainResponse,
  BatchCurrentPrimaryDomainRequest,
  BatchCurrentPrimaryDomainResponse,
  CurrentPrimaryDomainQueryRequest,
  CurrentPrimaryDomainResponse,
  DomainGovernanceSummaryResponse,
  RecommendPrimaryDomainRequest,
  RecommendPrimaryByQueryRequest,
  RecommendPrimaryDomainResponse,
  DomainDetailResponse,
  DomainListQueryRequest,
  DomainListResponse,
  ResolveHostRequest,
  ResolveHostResponse,
  ValidateDomainRequest,
  ValidateDomainResponse,
} from './custom-domain.dto'

const DOMAIN_GOVERNANCE_READ_ROLES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'BRAND_MANAGER',
  'STORE_MANAGER',
  'OPERATIONS',
  'SECURITY_ADMIN',
] as const

const DOMAIN_GOVERNANCE_WRITE_ROLES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'BRAND_MANAGER',
  'STORE_MANAGER',
  'OPERATIONS',
] as const

const DOMAIN_GOVERNANCE_READ_PERMISSION = 'foundation.governance.read'
const DOMAIN_GOVERNANCE_WRITE_PERMISSION = 'foundation.governance.write'

@ApiTags('saas-domain')
@Controller('saas/domain')
@UseGuards(TenantGuard)
export class CustomDomainController {
  constructor(private readonly service: CustomDomainService) {}

  /**
   * 添加自定义域名 (返回待 TXT 校验记录)
   * POST /saas/domain
   */
  @ApiOperation({ summary: '添加自定义域名' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: AddDomainRequest })
  @ApiCreatedResponse({ type: DomainDetailResponse })
  async addDomain(@Body() body: AddDomainRequest) {
    return this.service.addDomain(body.domain)
  }

  /**
   * 列出当前租户所有域名
   * GET /saas/domain
   */
  @ApiOperation({ summary: '列出当前租户可见域名' })
  @ApiQuery({ name: 'keyword', type: String, required: false, description: '按域名关键字模糊搜索' })
  @ApiQuery({ name: 'status', type: String, required: false, description: '按域名状态筛选' })
  @ApiQuery({ name: 'scopeType', type: String, required: false, description: '按作用域类型筛选' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '分页页码，默认 1' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: '分页大小，默认 10' })
  @ApiQuery({ name: 'sortBy', type: String, required: false, description: '排序字段，默认 createdAt' })
  @ApiQuery({ name: 'sortOrder', type: String, required: false, description: '排序方向，默认 desc' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_READ_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_READ_PERMISSION)
  @Get()
  @ApiOkResponse({ type: DomainListResponse })
  async list(@Query() query: DomainListQueryRequest = new DomainListQueryRequest()) {
    return this.service.listPage(query)
  }

  /**
   * 查询当前 scope 的主域名
   * GET /saas/domain/primary/current
   */
  @ApiOperation({ summary: '查询当前作用域主域名' })
  @ApiQuery({ name: 'scopeType', type: String, required: false, description: '作用域类型，默认按当前租户上下文推断' })
  @ApiQuery({ name: 'brandId', type: String, required: false, description: '品牌作用域标识' })
  @ApiQuery({ name: 'storeId', type: String, required: false, description: '门店作用域标识' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_READ_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_READ_PERMISSION)
  @Get('primary/current')
  @ApiOkResponse({ type: CurrentPrimaryDomainResponse })
  async getCurrentPrimary(
    @Query() query: CurrentPrimaryDomainQueryRequest = new CurrentPrimaryDomainQueryRequest(),
  ) {
    const ctx = requireTenantContext()
    const scopeType =
      query.scopeType ?? (ctx.storeId ? 'STORE' : ctx.brandId ? 'BRAND' : 'TENANT')
    const brandId = query.brandId ?? ctx.brandId
    const storeId = query.storeId ?? ctx.storeId
    const item = await this.service.getCurrentPrimary(query)
    return {
      scopeType,
      tenantId: ctx.tenantId,
      brandId,
      storeId,
      resolved: item != null,
      item,
    }
  }

  /**
   * 批量查询多个作用域当前主域名
   * POST /saas/domain/primary/batch/current
   */
  @ApiOperation({ summary: '批量查询多个作用域当前主域名' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_READ_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_READ_PERMISSION)
  @Post('primary/batch/current')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: BatchCurrentPrimaryDomainRequest })
  @ApiOkResponse({ type: BatchCurrentPrimaryDomainResponse })
  async getCurrentPrimaryBatch(@Body() body: BatchCurrentPrimaryDomainRequest) {
    return {
      items: await this.service.getCurrentPrimaryBatch(body.items),
    }
  }

  /**
   * 查询 active 但尚未设置主域名的治理视图
   * GET /saas/domain/governance/active-without-primary
   */
  @ApiOperation({ summary: '查询 active 但尚未设置主域名的治理视图' })
  @ApiQuery({ name: 'scopeType', type: String, required: false, description: '按作用域类型过滤治理视图' })
  @ApiQuery({ name: 'brandId', type: String, required: false, description: '按品牌作用域过滤治理视图' })
  @ApiQuery({ name: 'storeId', type: String, required: false, description: '按门店作用域过滤治理视图' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '治理视图分页页码，默认 1' })
  @ApiQuery({ name: 'pageSize', type: Number, required: false, description: '治理视图分页大小，默认 10' })
  @ApiQuery({ name: 'sortBy', type: String, required: false, description: '治理视图排序字段，默认 activeCount' })
  @ApiQuery({ name: 'sortOrder', type: String, required: false, description: '治理视图排序方向，默认 desc' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_READ_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_READ_PERMISSION)
  @Get('governance/active-without-primary')
  @ApiOkResponse({ type: ActiveWithoutPrimaryGovernanceResponse })
  async listActiveWithoutPrimary(
    @Query()
    query: ActiveWithoutPrimaryGovernanceQueryRequest = new ActiveWithoutPrimaryGovernanceQueryRequest(),
  ) {
    return this.service.listActiveWithoutPrimary(query)
  }

  /**
   * 获取当前租户/上下文的域名治理摘要
   * GET /saas/domain/governance/summary
   */
  @ApiOperation({ summary: '获取当前上下文的域名治理摘要' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_READ_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_READ_PERMISSION)
  @Get('governance/summary')
  @ApiOkResponse({ type: DomainGovernanceSummaryResponse })
  async getGovernanceSummary() {
    return this.service.getGovernanceSummary()
  }

  /**
   * 为缺主域名作用域自动推荐并补选 primary
   * POST /saas/domain/governance/primary/recommend
   */
  @ApiOperation({ summary: '为缺主域名作用域自动推荐并补选 primary' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post('governance/primary/recommend')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RecommendPrimaryDomainRequest })
  @ApiOkResponse({ type: RecommendPrimaryDomainResponse })
  async recommendPrimary(@Body() body: RecommendPrimaryDomainRequest) {
    return this.service.recommendPrimary(body)
  }

  /**
   * 按治理筛选结果批量推荐并补选 primary
   * POST /saas/domain/governance/primary/recommend/by-query
   */
  @ApiOperation({ summary: '按治理筛选结果批量推荐并补选 primary' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post('governance/primary/recommend/by-query')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RecommendPrimaryByQueryRequest })
  @ApiOkResponse({ type: BatchRecommendPrimaryDomainResponse })
  async recommendPrimaryByQuery(@Body() body: RecommendPrimaryByQueryRequest) {
    return this.service.recommendPrimaryByQuery(body)
  }

  /**
   * 批量为缺主域名作用域自动推荐并补选 primary
   * POST /saas/domain/governance/primary/recommend/batch
   */
  @ApiOperation({ summary: '批量为缺主域名作用域自动推荐并补选 primary' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post('governance/primary/recommend/batch')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: BatchRecommendPrimaryDomainRequest })
  @ApiOkResponse({ type: BatchRecommendPrimaryDomainResponse })
  async recommendPrimaryBatch(@Body() body: BatchRecommendPrimaryDomainRequest) {
    return this.service.recommendPrimaryBatch(body.items)
  }

  /**
   * 获取域名详情 + 校验提示
   * GET /saas/domain/:id
   */
  @ApiOperation({ summary: '获取域名详情与 TXT 校验提示' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_READ_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_READ_PERMISSION)
  @Get(':id')
  @ApiOkResponse({ type: DomainDetailResponse })
  async getById(@Param('id') id: string) {
    const m = await this.service.getById(id)
    return {
      ...m,
      hint: {
        host: m.verificationHost,
        value: buildVerificationValue(m.verificationToken),
        type: 'TXT',
        instructions: `请在 DNS 服务商添加 TXT 记录: ${m.verificationHost} = shenjiying-verify=${m.verificationToken}`,
      },
    }
  }

  /**
   * 删除域名
   * DELETE /saas/domain/:id
   */
  @ApiOperation({ summary: '删除域名' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: '删除成功' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id)
  }

  /**
   * 触发 DNS TXT 校验
   * POST /saas/domain/:id/verify
   */
  @ApiOperation({ summary: '触发 DNS TXT 校验' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DomainDetailResponse })
  async verify(@Param('id') id: string) {
    return this.service.verify(id)
  }

  /**
   * 申请 SSL 证书 (active → active_ssl)
   * POST /saas/domain/:id/ssl
   */
  @ApiOperation({ summary: '申请 SSL 证书' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post(':id/ssl')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DomainDetailResponse })
  async requestSsl(@Param('id') id: string) {
    return this.service.requestSsl(id)
  }

  /**
   * 切换当前 scope 的主域名
   * POST /saas/domain/:id/primary
   */
  @ApiOperation({ summary: '切换主域名' })
  @RequireTenantScope()
  @RequireRoles(...DOMAIN_GOVERNANCE_WRITE_ROLES)
  @RequirePermissions(DOMAIN_GOVERNANCE_WRITE_PERMISSION)
  @Post(':id/primary')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DomainDetailResponse })
  async setPrimary(@Param('id') id: string) {
    return this.service.setPrimary(id)
  }

  /**
   * Host → tenantId 解析 (CDN/网关用, 无需租户上下文)
   * GET /saas/domain/resolve/host?host=acme.shenjiying88.com
   */
  @Get('resolve/host')
  @ApiOperation({ summary: '按 Host 解析租户上下文' })
  @ApiQuery({ name: 'host', type: String, required: true, description: '需要解析的访问 Host' })
  @ApiOkResponse({ type: ResolveHostResponse })
  async resolveHost(@Query() query: ResolveHostRequest) {
    const tenantId = this.service.resolveTenantByHost(query.host)
    return { host: query.host, tenantId, resolved: tenantId != null }
  }

  /**
   * 域名格式预校验 (前端表单用)
   * POST /saas/domain/validate
   */
  @ApiOperation({ summary: '预校验域名格式' })
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: ValidateDomainRequest })
  @ApiOkResponse({ type: ValidateDomainResponse })
  async validateDomain(@Body() body: ValidateDomainRequest) {
    const result = isValidDomain(body.domain)
    return result
  }
}
