"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustGovernanceController = void 0;
const common_1 = require("@nestjs/common");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
const trust_governance_dto_1 = require("./trust-governance.dto");
const trust_governance_service_1 = require("./trust-governance.service");
let TrustGovernanceController = class TrustGovernanceController {
    trustGovernanceService;
    constructor(trustGovernanceService) {
        this.trustGovernanceService = trustGovernanceService;
    }
    getManagementMetadata() {
        return this.trustGovernanceService.getManagementMetadata();
    }
    async getOperationsOverview() {
        return this.trustGovernanceService.getOperationsOverview();
    }
    async getApprovals(query) {
        return this.trustGovernanceService.listGovernanceApprovals(query);
    }
    async getApprovalSummary(query) {
        return this.trustGovernanceService.summarizeGovernanceApprovals(query);
    }
    async getApprovalDetail(approvalTicket) {
        return this.trustGovernanceService.getGovernanceApprovalDetail(approvalTicket);
    }
    async getApprovalTimeline(approvalTicket, query) {
        return this.trustGovernanceService.getGovernanceApprovalTimeline(approvalTicket, query.limit);
    }
    async approveApproval(approvalTicket, body) {
        return this.trustGovernanceService.approveGovernanceApproval(approvalTicket, body);
    }
    async rejectApproval(approvalTicket, body) {
        return this.trustGovernanceService.rejectGovernanceApproval(approvalTicket, body);
    }
    async cancelApproval(approvalTicket, body) {
        return this.trustGovernanceService.cancelGovernanceApproval(approvalTicket, body);
    }
    async resubmitApproval(approvalTicket, body) {
        return this.trustGovernanceService.resubmitGovernanceApproval(approvalTicket, body);
    }
    async getAudit(query) {
        return this.trustGovernanceService.getAuditRecords(query);
    }
    async getAuditSummary(query) {
        return this.trustGovernanceService.summarizeAuditRecords(query);
    }
    async recordAudit(body) {
        return this.trustGovernanceService.recordAudit(body.eventType, body.details, {
            tenantId: body.tenantId,
            actorId: body.actorId,
            source: body.source,
            riskLevel: body.riskLevel
        });
    }
    async checkRateLimit(body) {
        return this.trustGovernanceService.evaluateRateLimit(body);
    }
    async getRateLimitPolicies(query) {
        return this.trustGovernanceService.listRateLimitPolicies(query);
    }
    async saveRateLimitPolicy(body) {
        return this.trustGovernanceService.upsertRateLimitPolicy(body);
    }
    async getQuotaLedgers(query) {
        return this.trustGovernanceService.listQuotaLedgers(query);
    }
    async resetQuotaLedgers(body) {
        return this.trustGovernanceService.resetQuotaLedgers(body);
    }
    maskPii(body) {
        return this.trustGovernanceService.maskPii(body.payload);
    }
    reviewAi(body) {
        return this.trustGovernanceService.reviewAiInvocation(body.modelCode, {
            tenantId: body.tenantId,
            purpose: body.purpose,
            prompt: body.prompt,
            estimatedTokens: body.estimatedTokens
        });
    }
};
exports.TrustGovernanceController = TrustGovernanceController;
__decorate([
    (0, common_1.Get)('management-metadata'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], TrustGovernanceController.prototype, "getManagementMetadata", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getOperationsOverview", null);
__decorate([
    (0, common_1.Get)('approvals'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.ApprovalQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getApprovals", null);
__decorate([
    (0, common_1.Get)('approvals/summary'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.ApprovalQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getApprovalSummary", null);
__decorate([
    (0, common_1.Get)('approvals/:approvalTicket'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getApprovalDetail", null);
__decorate([
    (0, common_1.Get)('approvals/:approvalTicket/timeline'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_governance_dto_1.ApprovalTimelineQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getApprovalTimeline", null);
__decorate([
    (0, common_1.Post)('approvals/:approvalTicket/approve'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.decide'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_governance_dto_1.ApprovalDecisionDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "approveApproval", null);
__decorate([
    (0, common_1.Post)('approvals/:approvalTicket/reject'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.decide'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_governance_dto_1.ApprovalDecisionDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "rejectApproval", null);
__decorate([
    (0, common_1.Post)('approvals/:approvalTicket/cancel'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.decide'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_governance_dto_1.ApprovalLifecycleDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "cancelApproval", null);
__decorate([
    (0, common_1.Post)('approvals/:approvalTicket/resubmit'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.decide'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_governance_dto_1.ApprovalLifecycleDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "resubmitApproval", null);
__decorate([
    (0, common_1.Get)('audit'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.audit.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AuditQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getAudit", null);
__decorate([
    (0, common_1.Get)('audit/summary'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.audit.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AuditQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getAuditSummary", null);
__decorate([
    (0, common_1.Post)('audit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AuditRecordDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "recordAudit", null);
__decorate([
    (0, common_1.Post)('rate-limit/check'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.RateLimitCheckDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "checkRateLimit", null);
__decorate([
    (0, common_1.Get)('rate-limit/policies'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.rate-limit-policy.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.RateLimitPolicyQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getRateLimitPolicies", null);
__decorate([
    (0, common_1.Post)('rate-limit/policies'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.rate-limit-policy.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.UpsertRateLimitPolicyDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "saveRateLimitPolicy", null);
__decorate([
    (0, common_1.Get)('rate-limit/ledgers'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.quota-ledger.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.QuotaLedgerQueryDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "getQuotaLedgers", null);
__decorate([
    (0, common_1.Post)('rate-limit/ledgers/reset'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.quota-ledger.reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.ResetQuotaLedgerDto]),
    __metadata("design:returntype", Promise)
], TrustGovernanceController.prototype, "resetQuotaLedgers", null);
__decorate([
    (0, common_1.Post)('privacy/mask'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.MaskPiiDto]),
    __metadata("design:returntype", Object)
], TrustGovernanceController.prototype, "maskPii", null);
__decorate([
    (0, common_1.Post)('ai/review'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AiReviewDto]),
    __metadata("design:returntype", Object)
], TrustGovernanceController.prototype, "reviewAi", null);
exports.TrustGovernanceController = TrustGovernanceController = __decorate([
    (0, common_1.Controller)('foundation/trust-governance'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __metadata("design:paramtypes", [trust_governance_service_1.TrustGovernanceService])
], TrustGovernanceController);
//# sourceMappingURL=trust-governance.controller.js.map