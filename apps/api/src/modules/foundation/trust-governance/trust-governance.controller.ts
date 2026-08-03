import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { RequirePermissions, RequireRoles, RequireTenantScope } from '../identity-access/identity-access.decorator'
import {
  ApprovalDecisionDto,
  ApprovalLifecycleDto,
  ApprovalQueryDto,
  ApprovalTimelineQueryDto,
  AiReviewDto,
  AuditQueryDto,
  AuditRecordDto,
  MaskPiiDto,
  QuotaLedgerQueryDto,
  RateLimitCheckDto,
  RateLimitPolicyQueryDto,
  ResetQuotaLedgerDto,
  UpsertRateLimitPolicyDto
} from './trust-governance.dto'
import { TrustGovernanceService } from './trust-governance.service'
import { TenantGuard } from '../../agent/tenant.guard';

@Controller('foundation/trust-governance')
@UseGuards(TenantGuard)
@RequireTenantScope()
export class TrustGovernanceController {
  constructor(private readonly trustGovernanceService: TrustGovernanceService) {}

  @Get('management-metadata')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  getManagementMetadata(): unknown {
    return this.trustGovernanceService.getManagementMetadata()
  }

  @Get('overview')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.governance.read')
  async getOperationsOverview(): Promise<unknown> {
    return this.trustGovernanceService.getOperationsOverview()
  }

  @Get('approvals')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovals(@Query() query: ApprovalQueryDto): Promise<unknown> {
    return this.trustGovernanceService.listGovernanceApprovals(query)
  }

  @Get('approvals/summary')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovalSummary(@Query() query: ApprovalQueryDto): Promise<unknown> {
    return this.trustGovernanceService.summarizeGovernanceApprovals(query)
  }

  @Get('approvals/:approvalTicket')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovalDetail(@Param('approvalTicket') approvalTicket: string): Promise<unknown> {
    return this.trustGovernanceService.getGovernanceApprovalDetail(approvalTicket)
  }

  @Get('approvals/:approvalTicket/timeline')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.read')
  async getApprovalTimeline(
    @Param('approvalTicket') approvalTicket: string,
    @Query() query: ApprovalTimelineQueryDto
  ): Promise<unknown> {
    return this.trustGovernanceService.getGovernanceApprovalTimeline(approvalTicket, query.limit)
  }

  @Post('approvals/:approvalTicket/approve')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.decide')
  async approveApproval(
    @Param('approvalTicket') approvalTicket: string,
    @Body() body: ApprovalDecisionDto
  ): Promise<unknown> {
    return this.trustGovernanceService.approveGovernanceApproval(approvalTicket, body)
  }

  @Post('approvals/:approvalTicket/reject')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.decide')
  async rejectApproval(
    @Param('approvalTicket') approvalTicket: string,
    @Body() body: ApprovalDecisionDto
  ): Promise<unknown> {
    return this.trustGovernanceService.rejectGovernanceApproval(approvalTicket, body)
  }

  @Post('approvals/:approvalTicket/cancel')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.decide')
  async cancelApproval(
    @Param('approvalTicket') approvalTicket: string,
    @Body() body: ApprovalLifecycleDto
  ): Promise<unknown> {
    return this.trustGovernanceService.cancelGovernanceApproval(approvalTicket, body)
  }

  @Post('approvals/:approvalTicket/resubmit')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.approval.decide')
  async resubmitApproval(
    @Param('approvalTicket') approvalTicket: string,
    @Body() body: ApprovalLifecycleDto
  ): Promise<unknown> {
    return this.trustGovernanceService.resubmitGovernanceApproval(approvalTicket, body)
  }

  @Get('audit')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.audit.read')
  async getAudit(@Query() query: AuditQueryDto): Promise<unknown> {
    return this.trustGovernanceService.getAuditRecords(query)
  }

  @Get('audit/summary')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.audit.read')
  async getAuditSummary(@Query() query: AuditQueryDto): Promise<unknown> {
    return this.trustGovernanceService.summarizeAuditRecords(query)
  }

  @Post('audit')
  async recordAudit(@Body() body: AuditRecordDto): Promise<unknown> {
    return this.trustGovernanceService.recordAudit(body.eventType, body.details, {
      tenantId: body.tenantId,
      actorId: body.actorId,
      source: body.source,
      riskLevel: body.riskLevel
    })
  }

  @Post('rate-limit/check')
  async checkRateLimit(@Body() body: RateLimitCheckDto): Promise<unknown> {
    return this.trustGovernanceService.evaluateRateLimit(body)
  }

  @Get('rate-limit/policies')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.rate-limit-policy.read')
  async getRateLimitPolicies(@Query() query: RateLimitPolicyQueryDto): Promise<unknown> {
    return this.trustGovernanceService.listRateLimitPolicies(query)
  }

  @Post('rate-limit/policies')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.rate-limit-policy.write')
  async saveRateLimitPolicy(@Body() body: UpsertRateLimitPolicyDto): Promise<unknown> {
    return this.trustGovernanceService.upsertRateLimitPolicy(body)
  }

  @Get('rate-limit/ledgers')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.quota-ledger.read')
  async getQuotaLedgers(@Query() query: QuotaLedgerQueryDto): Promise<unknown> {
    return this.trustGovernanceService.listQuotaLedgers(query)
  }

  @Post('rate-limit/ledgers/reset')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.quota-ledger.reset')
  async resetQuotaLedgers(@Body() body: ResetQuotaLedgerDto): Promise<unknown> {
    return this.trustGovernanceService.resetQuotaLedgers(body)
  }

  @Post('privacy/mask')
  maskPii(@Body() body: MaskPiiDto): unknown {
    return this.trustGovernanceService.maskPii(body.payload)
  }

  @Post('ai/review')
  reviewAi(@Body() body: AiReviewDto): unknown {
    return this.trustGovernanceService.reviewAiInvocation(body.modelCode, {
      tenantId: body.tenantId,
      purpose: body.purpose,
      prompt: body.prompt,
      estimatedTokens: body.estimatedTokens
    })
  }
}
