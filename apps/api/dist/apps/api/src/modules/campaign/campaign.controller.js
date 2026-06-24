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
exports.CampaignController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const campaign_contract_1 = require("./campaign.contract");
const campaign_dto_1 = require("./campaign.dto");
const campaign_entity_1 = require("./campaign.entity");
const campaign_service_1 = require("./campaign.service");
let CampaignController = class CampaignController {
    campaignService;
    constructor(campaignService) {
        this.campaignService = campaignService;
    }
    registerCampaign(tenantContext, body) {
        const plan = this.campaignService.registerCampaign({
            tenantContext,
            code: body.code,
            title: body.title,
            description: body.description,
            triggerEvent: body.triggerEvent,
            conditions: body.conditions,
            actions: body.actions,
            priority: body.priority,
            scheduledStart: body.scheduledStart,
            scheduledEnd: body.scheduledEnd
        });
        return (0, campaign_contract_1.toCampaignPlanContract)(plan);
    }
    listCampaigns(tenantContext, status, triggerEvent) {
        return this.campaignService
            .listCampaigns(tenantContext.tenantId, { status, triggerEvent })
            .map((plan) => (0, campaign_contract_1.toCampaignPlanContract)(plan));
    }
    getCampaign(tenantContext, planId) {
        const plan = this.campaignService.getCampaign(planId, tenantContext.tenantId);
        return plan ? (0, campaign_contract_1.toCampaignPlanContract)(plan) : null;
    }
    updateCampaignStatus(tenantContext, planId, body) {
        const plan = this.campaignService.updateCampaignStatus(planId, body.status, tenantContext.tenantId);
        return (0, campaign_contract_1.toCampaignPlanContract)(plan);
    }
    listPlanDispatches(tenantContext, planId) {
        return this.campaignService
            .listDispatches(tenantContext.tenantId, { planId })
            .map((dispatch) => (0, campaign_contract_1.toCampaignDispatchContract)(dispatch));
    }
    listDispatches(tenantContext, memberId, status) {
        return this.campaignService
            .listDispatches(tenantContext.tenantId, { memberId, status })
            .map((dispatch) => (0, campaign_contract_1.toCampaignDispatchContract)(dispatch));
    }
    evaluateTriggers(tenantContext, body) {
        return this.campaignService.evaluateTriggers({ ...body, tenantContext });
    }
};
exports.CampaignController = CampaignController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, campaign_dto_1.RegisterCampaignDto]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "registerCampaign", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('triggerEvent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "listCampaigns", null);
__decorate([
    (0, common_1.Get)(':planId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "getCampaign", null);
__decorate([
    (0, common_1.Patch)(':planId/status'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, campaign_dto_1.UpdateCampaignStatusDto]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "updateCampaignStatus", null);
__decorate([
    (0, common_1.Get)(':planId/dispatches'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "listPlanDispatches", null);
__decorate([
    (0, common_1.Get)('dispatches/list'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('memberId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "listDispatches", null);
__decorate([
    (0, common_1.Post)('evaluate'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CampaignController.prototype, "evaluateTriggers", null);
exports.CampaignController = CampaignController = __decorate([
    (0, common_1.Controller)('campaigns'),
    __metadata("design:paramtypes", [campaign_service_1.CampaignService])
], CampaignController);
//# sourceMappingURL=campaign.controller.js.map