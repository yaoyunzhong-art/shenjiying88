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
exports.SvipController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const svip_dto_1 = require("./svip.dto");
const svip_service_1 = require("./svip.service");
let SvipController = class SvipController {
    svipService;
    constructor(svipService) {
        this.svipService = svipService;
    }
    // ── 等级管理 ───────────────────────────────────────────
    initDefaultTiers(tenantContext) {
        return this.svipService.initDefaultTiers(tenantContext);
    }
    listTiers(tenantContext, query) {
        const tiers = this.svipService.listTiers(tenantContext.tenantId);
        if (query.level !== undefined) {
            return tiers.filter((t) => t.level === query.level);
        }
        return tiers;
    }
    getTier(tenantContext, tierId) {
        return this.svipService.getTier(tierId, tenantContext.tenantId);
    }
    upsertTier(tenantContext, body) {
        return this.svipService.upsertTier(tenantContext, body);
    }
    // ── 会员管理 ───────────────────────────────────────────
    createMember(tenantContext, body) {
        return this.svipService.createMember(tenantContext, body);
    }
    listMembers(tenantContext, query) {
        return this.svipService.listMembers(tenantContext.tenantId, {
            status: query.status,
            tierLevel: query.tierLevel
        });
    }
    getMemberTier(tenantContext, memberId) {
        return this.svipService.getMemberTier(memberId, tenantContext.tenantId);
    }
    getMemberBenefits(tenantContext, memberId) {
        return this.svipService.getMemberAvailableBenefits(memberId, tenantContext.tenantId);
    }
    upgradeTier(tenantContext, body) {
        return this.svipService.upgradeTier(tenantContext, body);
    }
    downgradeTier(tenantContext, body) {
        return this.svipService.downgradeTier(tenantContext, body);
    }
    freezeMember(tenantContext, memberId) {
        return this.svipService.freezeMember(memberId, tenantContext.tenantId);
    }
    unfreezeMember(tenantContext, memberId) {
        return this.svipService.unfreezeMember(memberId, tenantContext.tenantId);
    }
    checkAndDowngradeExpired(tenantContext) {
        return this.svipService.checkAndDowngradeExpired(tenantContext.tenantId);
    }
    // ── 权益管理 ───────────────────────────────────────────
    listBenefits(tierId) {
        return this.svipService.listBenefits(tierId);
    }
    createBenefit(body) {
        return this.svipService.createBenefit(body);
    }
    updateBenefit(benefitId, body) {
        return this.svipService.updateBenefit(benefitId, body);
    }
    useBenefit(tenantContext, body) {
        return this.svipService.useBenefit(body.memberId, body.benefitType, tenantContext.tenantId);
    }
};
exports.SvipController = SvipController;
__decorate([
    (0, common_1.Post)('tiers/init'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "initDefaultTiers", null);
__decorate([
    (0, common_1.Get)('tiers'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.SvipTierQueryDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "listTiers", null);
__decorate([
    (0, common_1.Get)('tiers/:tierId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('tierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "getTier", null);
__decorate([
    (0, common_1.Post)('tiers'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.SvipTierDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "upsertTier", null);
__decorate([
    (0, common_1.Post)('members'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.CreateSvipMemberDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "createMember", null);
__decorate([
    (0, common_1.Get)('members'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.SvipMemberQueryDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "listMembers", null);
__decorate([
    (0, common_1.Get)('members/:memberId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "getMemberTier", null);
__decorate([
    (0, common_1.Get)('members/:memberId/benefits'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "getMemberBenefits", null);
__decorate([
    (0, common_1.Post)('upgrade'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.SvipUpgradeDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "upgradeTier", null);
__decorate([
    (0, common_1.Post)('downgrade'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.SvipUpgradeDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "downgradeTier", null);
__decorate([
    (0, common_1.Post)('members/:memberId/freeze'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "freezeMember", null);
__decorate([
    (0, common_1.Post)('members/:memberId/unfreeze'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "unfreezeMember", null);
__decorate([
    (0, common_1.Patch)('expired/check'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "checkAndDowngradeExpired", null);
__decorate([
    (0, common_1.Get)('benefits/:tierId'),
    __param(0, (0, common_1.Param)('tierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "listBenefits", null);
__decorate([
    (0, common_1.Post)('benefits'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [svip_dto_1.SvipBenefitDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "createBenefit", null);
__decorate([
    (0, common_1.Patch)('benefits/:benefitId'),
    __param(0, (0, common_1.Param)('benefitId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "updateBenefit", null);
__decorate([
    (0, common_1.Post)('benefits/use'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, svip_dto_1.UseSvipBenefitDto]),
    __metadata("design:returntype", void 0)
], SvipController.prototype, "useBenefit", null);
exports.SvipController = SvipController = __decorate([
    (0, common_1.Controller)('svip'),
    __metadata("design:paramtypes", [svip_service_1.SvipService])
], SvipController);
//# sourceMappingURL=svip.controller.js.map