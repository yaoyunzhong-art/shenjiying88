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
exports.ConfigurationGovernanceController = void 0;
const common_1 = require("@nestjs/common");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
const trust_governance_dto_1 = require("../trust-governance/trust-governance.dto");
const configuration_governance_service_1 = require("./configuration-governance.service");
const configuration_governance_dto_1 = require("./configuration-governance.dto");
let ConfigurationGovernanceController = class ConfigurationGovernanceController {
    configurationGovernanceService;
    constructor(configurationGovernanceService) {
        this.configurationGovernanceService = configurationGovernanceService;
    }
    getManagementMetadata() {
        return this.configurationGovernanceService.getManagementMetadata();
    }
    async getOperationsOverview() {
        return this.configurationGovernanceService.getOperationsOverview();
    }
    async getSnapshot(query) {
        return this.configurationGovernanceService.resolveConfigSnapshot(this.toTenantContext(query));
    }
    async getFeatureFlags(query) {
        return this.configurationGovernanceService.getFeatureFlags(this.toTenantContext(query), query.subjectKey);
    }
    async getFeatureFlagRecords(query) {
        return this.configurationGovernanceService.listPersistedFeatureFlags(this.toTenantContext(query), query.subjectKey);
    }
    async getFeatureFlag(flagKey, query) {
        return this.configurationGovernanceService.evaluateFeatureFlag(flagKey, this.toTenantContext(query), query.subjectKey);
    }
    async saveFeatureFlag(body) {
        return this.configurationGovernanceService.saveFeatureFlag(body);
    }
    async getConfigEntries(query) {
        return this.configurationGovernanceService.listConfigEntries(query);
    }
    async getAudit(query) {
        return this.configurationGovernanceService.getAuditRecords(query);
    }
    async getAuditSummary(query) {
        return this.configurationGovernanceService.summarizeAuditRecords(query);
    }
    async getApprovals(query) {
        return this.configurationGovernanceService.listGovernanceApprovals(query);
    }
    async getApprovalSummary(query) {
        return this.configurationGovernanceService.summarizeGovernanceApprovals(query);
    }
    async getApprovalDetail(approvalTicket) {
        return this.configurationGovernanceService.getGovernanceApprovalDetail(approvalTicket);
    }
    async getApprovalTimeline(approvalTicket, query) {
        return this.configurationGovernanceService.getGovernanceApprovalTimeline(approvalTicket, query.limit);
    }
    async saveConfigEntry(body) {
        return this.configurationGovernanceService.saveConfigEntry(body);
    }
    async getSecrets() {
        return this.configurationGovernanceService.getSecretMetadata();
    }
    async getSecretsCertificatePosture() {
        return this.configurationGovernanceService.getSecretsCertificatePosture();
    }
    async getSecret(secretName) {
        return (await this.configurationGovernanceService.getSecretMetadata(secretName))[0];
    }
    async getCertificates(query) {
        return this.configurationGovernanceService.getCertificateMetadata(query);
    }
    async getCertificate(certificateName, query) {
        return this.configurationGovernanceService.getCertificateDetail(certificateName, query);
    }
    async rotateSecret(secretName, body) {
        return this.configurationGovernanceService.rotateSecret(secretName, body.rotatedBy, {
            requestedBy: body.requestedBy,
            approvalTicket: body.approvalTicket,
            approvalStatus: body.approvalStatus
        });
    }
    async registerSecret(body) {
        return this.configurationGovernanceService.registerSecret(body);
    }
    toTenantContext(query) {
        return {
            tenantId: query.tenantId ?? 'tenant-demo',
            brandId: query.brandId,
            storeId: query.storeId,
            marketCode: query.marketCode
        };
    }
};
exports.ConfigurationGovernanceController = ConfigurationGovernanceController;
__decorate([
    (0, common_1.Get)('management-metadata'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ConfigurationGovernanceController.prototype, "getManagementMetadata", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getOperationsOverview", null);
__decorate([
    (0, common_1.Get)('snapshot'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.ConfigurationScopeDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getSnapshot", null);
__decorate([
    (0, common_1.Get)('feature-flags'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.FeatureFlagQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getFeatureFlags", null);
__decorate([
    (0, common_1.Get)('feature-flag-records'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.feature-flag.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.FeatureFlagQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getFeatureFlagRecords", null);
__decorate([
    (0, common_1.Get)('feature-flags/:flagKey'),
    __param(0, (0, common_1.Param)('flagKey')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, configuration_governance_dto_1.FeatureFlagQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getFeatureFlag", null);
__decorate([
    (0, common_1.Post)('feature-flags'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.feature-flag.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.PersistFeatureFlagDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "saveFeatureFlag", null);
__decorate([
    (0, common_1.Get)('config-entries'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.config.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.ConfigEntryQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getConfigEntries", null);
__decorate([
    (0, common_1.Get)('audit'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.audit.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AuditQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getAudit", null);
__decorate([
    (0, common_1.Get)('audit/summary'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.audit.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.AuditQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getAuditSummary", null);
__decorate([
    (0, common_1.Get)('approvals'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.ApprovalQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getApprovals", null);
__decorate([
    (0, common_1.Get)('approvals/summary'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trust_governance_dto_1.ApprovalQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getApprovalSummary", null);
__decorate([
    (0, common_1.Get)('approvals/:approvalTicket'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getApprovalDetail", null);
__decorate([
    (0, common_1.Get)('approvals/:approvalTicket/timeline'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.approval.read'),
    __param(0, (0, common_1.Param)('approvalTicket')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, trust_governance_dto_1.ApprovalTimelineQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getApprovalTimeline", null);
__decorate([
    (0, common_1.Post)('config-entries'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.config.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.UpsertConfigEntryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "saveConfigEntry", null);
__decorate([
    (0, common_1.Get)('secrets'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.secret.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getSecrets", null);
__decorate([
    (0, common_1.Get)('secrets-certificates/posture'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getSecretsCertificatePosture", null);
__decorate([
    (0, common_1.Get)('secrets/:secretName'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.secret.read'),
    __param(0, (0, common_1.Param)('secretName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getSecret", null);
__decorate([
    (0, common_1.Get)('certificates'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.secret.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.CertificateQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getCertificates", null);
__decorate([
    (0, common_1.Get)('certificates/:certificateName'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.secret.read'),
    __param(0, (0, common_1.Param)('certificateName')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, configuration_governance_dto_1.CertificateQueryDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "getCertificate", null);
__decorate([
    (0, common_1.Post)('secrets/:secretName/rotate'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.secret.rotate'),
    __param(0, (0, common_1.Param)('secretName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, configuration_governance_dto_1.RotateSecretDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "rotateSecret", null);
__decorate([
    (0, common_1.Post)('secrets/register'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.secret.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [configuration_governance_dto_1.RegisterSecretDto]),
    __metadata("design:returntype", Promise)
], ConfigurationGovernanceController.prototype, "registerSecret", null);
exports.ConfigurationGovernanceController = ConfigurationGovernanceController = __decorate([
    (0, common_1.Controller)('foundation/configuration-governance'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __metadata("design:paramtypes", [configuration_governance_service_1.ConfigurationGovernanceService])
], ConfigurationGovernanceController);
//# sourceMappingURL=configuration-governance.controller.js.map