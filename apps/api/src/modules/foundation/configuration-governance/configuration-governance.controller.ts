import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import type { RequestTenantContext } from '../../tenant/tenant.types'
import { RequirePermissions, RequireRoles, RequireTenantScope } from '../identity-access/identity-access.decorator'
import { ApprovalQueryDto, ApprovalTimelineQueryDto, AuditQueryDto } from '../trust-governance/trust-governance.dto'
import { ConfigurationGovernanceService } from './configuration-governance.service'
import {
  CertificateQueryDto,
  ConfigEntryQueryDto,
  ConfigurationScopeDto,
  FeatureFlagQueryDto,
  PersistFeatureFlagDto,
  RegisterSecretDto,
  RotateSecretDto,
  UpsertConfigEntryDto
} from './configuration-governance.dto'

@Controller('foundation/configuration-governance')
@UseGuards(TenantGuard)
@RequireTenantScope()
export class ConfigurationGovernanceController {
  constructor(private readonly configurationGovernanceService: ConfigurationGovernanceService) {}

  @Get('management-metadata')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getManagementMetadata(): unknown {
    return this.configurationGovernanceService.getManagementMetadata()
  }

  @Get('overview')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  async getOperationsOverview(): Promise<unknown> {
    return this.configurationGovernanceService.getOperationsOverview()
  }

  @Get('snapshot')
  async getSnapshot(@Query() query: ConfigurationScopeDto): Promise<unknown> {
    return this.configurationGovernanceService.resolveConfigSnapshot(this.toTenantContext(query))
  }

  @Get('feature-flags')
  async getFeatureFlags(@Query() query: FeatureFlagQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.getFeatureFlags(this.toTenantContext(query), query.subjectKey)
  }

  @Get('feature-flag-records')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS')
  @RequirePermissions('foundation.feature-flag.read')
  async getFeatureFlagRecords(@Query() query: FeatureFlagQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.listPersistedFeatureFlags(this.toTenantContext(query), query.subjectKey)
  }

  @Get('feature-flags/:flagKey')
  async getFeatureFlag(@Param('flagKey') flagKey: string, @Query() query: FeatureFlagQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.evaluateFeatureFlag(flagKey, this.toTenantContext(query), query.subjectKey)
  }

  @Post('feature-flags')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS')
  @RequirePermissions('foundation.feature-flag.write')
  async saveFeatureFlag(@Body() body: PersistFeatureFlagDto): Promise<unknown> {
    return this.configurationGovernanceService.saveFeatureFlag(body)
  }

  @Get('config-entries')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS')
  @RequirePermissions('foundation.config.read')
  async getConfigEntries(@Query() query: ConfigEntryQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.listConfigEntries(query)
  }

  @Get('audit')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.audit.read')
  async getAudit(@Query() query: AuditQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.getAuditRecords(query)
  }

  @Get('audit/summary')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.audit.read')
  async getAuditSummary(@Query() query: AuditQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.summarizeAuditRecords(query)
  }

  @Get('approvals')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovals(@Query() query: ApprovalQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.listGovernanceApprovals(query)
  }

  @Get('approvals/summary')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovalSummary(@Query() query: ApprovalQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.summarizeGovernanceApprovals(query)
  }

  @Get('approvals/:approvalTicket')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovalDetail(@Param('approvalTicket') approvalTicket: string): Promise<unknown> {
    return this.configurationGovernanceService.getGovernanceApprovalDetail(approvalTicket)
  }

  @Get('approvals/:approvalTicket/timeline')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovalTimeline(
    @Param('approvalTicket') approvalTicket: string,
    @Query() query: ApprovalTimelineQueryDto
  ): Promise<unknown> {
    return this.configurationGovernanceService.getGovernanceApprovalTimeline(approvalTicket, query.limit)
  }

  @Post('config-entries')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN')
  @RequirePermissions('foundation.config.write')
  async saveConfigEntry(@Body() body: UpsertConfigEntryDto): Promise<unknown> {
    return this.configurationGovernanceService.saveConfigEntry(body)
  }

  @Get('secrets')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.secret.read')
  async getSecrets(): Promise<unknown> {
    return this.configurationGovernanceService.getSecretMetadata()
  }

  @Get('secrets-certificates/posture')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  async getSecretsCertificatePosture(): Promise<unknown> {
    return this.configurationGovernanceService.getSecretsCertificatePosture()
  }

  @Get('secrets/:secretName')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.secret.read')
  async getSecret(@Param('secretName') secretName: string): Promise<unknown> {
    return (await this.configurationGovernanceService.getSecretMetadata(secretName))[0]
  }

  @Get('certificates')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.secret.read')
  async getCertificates(@Query() query: CertificateQueryDto): Promise<unknown> {
    return this.configurationGovernanceService.getCertificateMetadata(query)
  }

  @Get('certificates/:certificateName')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.secret.read')
  async getCertificate(
    @Param('certificateName') certificateName: string,
    @Query() query: CertificateQueryDto
  ): Promise<unknown> {
    return this.configurationGovernanceService.getCertificateDetail(certificateName, query)
  }

  @Post('secrets/:secretName/rotate')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.secret.rotate')
  async rotateSecret(@Param('secretName') secretName: string, @Body() body: RotateSecretDto): Promise<unknown> {
    return this.configurationGovernanceService.rotateSecret(secretName, body.rotatedBy, {
      requestedBy: body.requestedBy,
      approvalTicket: body.approvalTicket,
      approvalStatus: body.approvalStatus
    })
  }

  @Post('secrets/register')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.secret.write')
  async registerSecret(@Body() body: RegisterSecretDto): Promise<unknown> {
    return this.configurationGovernanceService.registerSecret(body)
  }

  private toTenantContext(query: ConfigurationScopeDto): RequestTenantContext {
    return {
      tenantId: query.tenantId ?? 'tenant-demo',
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    }
  }
}
