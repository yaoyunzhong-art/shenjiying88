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
exports.FoundationController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const identity_access_decorator_1 = require("./identity-access/identity-access.decorator");
const foundation_service_1 = require("./foundation.service");
let FoundationController = class FoundationController {
    foundationService;
    constructor(foundationService) {
        this.foundationService = foundationService;
    }
    getBootstrap(tenantContext) {
        return {
            tenantContext,
            ...this.foundationService.getBlueprint()
        };
    }
    getModules() {
        return this.foundationService.getModuleCatalog();
    }
    async getOperationsOverview(tenantContext) {
        return this.foundationService.getOperationsOverview(tenantContext);
    }
    async getOperationsAlerts(tenantContext) {
        return this.foundationService.getOperationsAlerts(tenantContext);
    }
    async getOperationsAlertsCatalog(tenantContext) {
        return this.foundationService.getOperationsAlertsCatalog(tenantContext);
    }
    async getOperationsAlertDrilldown(code, tenantContext) {
        return this.foundationService.getOperationsAlertDrilldown(code, tenantContext);
    }
    async acknowledgeOperationsAlert(code, tenantContext, actorContext, body) {
        return this.foundationService.acknowledgeOperationsAlert(code, tenantContext, actorContext, body?.note);
    }
    async muteOperationsAlert(code, tenantContext, actorContext, body) {
        return this.foundationService.muteOperationsAlert(code, tenantContext, actorContext, body);
    }
    async unmuteOperationsAlert(code, tenantContext, actorContext, body) {
        return this.foundationService.unmuteOperationsAlert(code, tenantContext, actorContext, body?.note);
    }
    async getOperationsModuleDetail(moduleKey, tenantContext) {
        return this.foundationService.getOperationsModuleDetail(moduleKey, tenantContext);
    }
    getConsumers() {
        return this.foundationService.getConsumerCatalog();
    }
    getConsumer(consumer) {
        return this.foundationService.getConsumerDependency(consumer);
    }
};
exports.FoundationController = FoundationController;
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FoundationController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)('modules'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FoundationController.prototype, "getModules", null);
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "getOperationsOverview", null);
__decorate([
    (0, common_1.Get)('overview/alerts'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "getOperationsAlerts", null);
__decorate([
    (0, common_1.Get)('overview/alerts/catalog'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "getOperationsAlertsCatalog", null);
__decorate([
    (0, common_1.Get)('overview/alerts/:code/drilldown'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "getOperationsAlertDrilldown", null);
__decorate([
    (0, common_1.Post)('overview/alerts/:code/ack'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.alerts.write'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "acknowledgeOperationsAlert", null);
__decorate([
    (0, common_1.Post)('overview/alerts/:code/mute'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.alerts.write'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "muteOperationsAlert", null);
__decorate([
    (0, common_1.Post)('overview/alerts/:code/unmute'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.alerts.write'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "unmuteOperationsAlert", null);
__decorate([
    (0, common_1.Get)('overview/modules/:moduleKey'),
    __param(0, (0, common_1.Param)('moduleKey')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FoundationController.prototype, "getOperationsModuleDetail", null);
__decorate([
    (0, common_1.Get)('consumers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FoundationController.prototype, "getConsumers", null);
__decorate([
    (0, common_1.Get)('consumers/:consumer'),
    __param(0, (0, common_1.Param)('consumer')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FoundationController.prototype, "getConsumer", null);
exports.FoundationController = FoundationController = __decorate([
    (0, common_1.Controller)('foundation'),
    __metadata("design:paramtypes", [foundation_service_1.FoundationService])
], FoundationController);
//# sourceMappingURL=foundation.controller.js.map