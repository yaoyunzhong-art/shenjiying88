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
exports.LoyaltyController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const loyalty_dto_1 = require("./loyalty.dto");
const loyalty_service_1 = require("./loyalty.service");
let LoyaltyController = class LoyaltyController {
    loyaltyService;
    constructor(loyaltyService) {
        this.loyaltyService = loyaltyService;
    }
    listPointsLedger(tenantContext) {
        return this.loyaltyService.listPointsLedger(tenantContext.tenantId);
    }
    listCouponRedemptions(tenantContext) {
        return this.loyaltyService.listCouponRedemptions(tenantContext.tenantId);
    }
    listBlindboxFulfillments(tenantContext) {
        return this.loyaltyService.listBlindboxFulfillments(tenantContext.tenantId);
    }
    listSettlements(tenantContext) {
        return this.loyaltyService.listSettlements(tenantContext.tenantId);
    }
    registerCouponPlan(tenantContext, body) {
        return this.loyaltyService.registerCouponPlan({
            tenantContext,
            code: body.code,
            title: body.title,
            description: body.description,
            discountType: body.discountType,
            discountValue: body.discountValue,
            minOrderAmount: body.minOrderAmount,
            totalQuota: body.totalQuota,
            perMemberLimit: body.perMemberLimit,
            validFrom: body.validFrom,
            validUntil: body.validUntil
        });
    }
    listCouponPlans(tenantContext) {
        return this.loyaltyService.listCouponPlans(tenantContext.tenantId);
    }
    getCouponPlan(tenantContext, planId) {
        return this.loyaltyService.getCouponPlan(planId, tenantContext.tenantId);
    }
    activateCouponPlan(tenantContext, planId, body) {
        return this.loyaltyService.updateCouponPlanStatus(planId, body.status, tenantContext.tenantId);
    }
    issueCoupon(tenantContext, planId, body) {
        return this.loyaltyService.issueCouponFromPlan({
            tenantContext,
            memberId: body.memberId,
            planId,
            source: body.source
        });
    }
    registerBlindboxPlan(tenantContext, body) {
        return this.loyaltyService.registerBlindboxPlan({
            tenantContext,
            blindboxPlanId: body.blindboxPlanId,
            title: body.title,
            description: body.description,
            unitPrice: body.unitPrice,
            totalQuota: body.totalQuota,
            rewardPool: body.rewardPool,
            validFrom: body.validFrom,
            validUntil: body.validUntil
        });
    }
    listBlindboxPlans(tenantContext) {
        return this.loyaltyService.listBlindboxPlans(tenantContext.tenantId);
    }
    getBlindboxPlan(tenantContext, planId) {
        return this.loyaltyService.getBlindboxPlan(planId, tenantContext.tenantId);
    }
    activateBlindboxPlan(tenantContext, planId, body) {
        return this.loyaltyService.updateBlindboxPlanStatus(planId, body.status, tenantContext.tenantId);
    }
    issueBlindbox(tenantContext, planId, body) {
        return this.loyaltyService.issueBlindboxFromPlan({
            tenantContext,
            memberId: body.memberId,
            planId,
            quantity: body.quantity
        });
    }
};
exports.LoyaltyController = LoyaltyController;
__decorate([
    (0, common_1.Get)('points-ledger'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listPointsLedger", null);
__decorate([
    (0, common_1.Get)('coupon-redemptions'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listCouponRedemptions", null);
__decorate([
    (0, common_1.Get)('blindbox-fulfillments'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listBlindboxFulfillments", null);
__decorate([
    (0, common_1.Get)('settlements'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listSettlements", null);
__decorate([
    (0, common_1.Post)('coupon-plans'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, loyalty_dto_1.RegisterCouponPlanDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "registerCouponPlan", null);
__decorate([
    (0, common_1.Get)('coupon-plans'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listCouponPlans", null);
__decorate([
    (0, common_1.Get)('coupon-plans/:planId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "getCouponPlan", null);
__decorate([
    (0, common_1.Patch)('coupon-plans/:planId/status'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, loyalty_dto_1.ActivateCouponPlanDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "activateCouponPlan", null);
__decorate([
    (0, common_1.Post)('coupon-plans/:planId/issue'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, loyalty_dto_1.IssueCouponFromPlanDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "issueCoupon", null);
__decorate([
    (0, common_1.Post)('blindbox-plans'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, loyalty_dto_1.RegisterBlindboxPlanDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "registerBlindboxPlan", null);
__decorate([
    (0, common_1.Get)('blindbox-plans'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listBlindboxPlans", null);
__decorate([
    (0, common_1.Get)('blindbox-plans/:planId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "getBlindboxPlan", null);
__decorate([
    (0, common_1.Patch)('blindbox-plans/:planId/status'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, loyalty_dto_1.ActivateBlindboxPlanDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "activateBlindboxPlan", null);
__decorate([
    (0, common_1.Post)('blindbox-plans/:planId/issue'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, loyalty_dto_1.IssueBlindboxFromPlanDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "issueBlindbox", null);
exports.LoyaltyController = LoyaltyController = __decorate([
    (0, common_1.Controller)('loyalty'),
    __metadata("design:paramtypes", [loyalty_service_1.LoyaltyService])
], LoyaltyController);
//# sourceMappingURL=loyalty.controller.js.map