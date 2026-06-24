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
exports.ResilienceOperationsController = void 0;
const common_1 = require("@nestjs/common");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
const resilience_operations_dto_1 = require("./resilience-operations.dto");
const resilience_operations_service_1 = require("./resilience-operations.service");
let ResilienceOperationsController = class ResilienceOperationsController {
    resilienceOperationsService;
    constructor(resilienceOperationsService) {
        this.resilienceOperationsService = resilienceOperationsService;
    }
    getManagementMetadata() {
        return this.resilienceOperationsService.getManagementMetadata();
    }
    getOperationsOverview() {
        return this.resilienceOperationsService.getOperationsOverview();
    }
    getObservabilitySignals(query) {
        return this.resilienceOperationsService.getObservabilitySignals(query);
    }
    getRetryPolicies(query) {
        return this.resilienceOperationsService.listRetryPolicies(query);
    }
    getRecoveryPlans(query) {
        return this.resilienceOperationsService.listRecoveryPlans(query);
    }
    getRecoveryPlan(resource) {
        return this.resilienceOperationsService.describeRecoveryPlan(resource);
    }
    stageEdgeReplay(body) {
        return this.resilienceOperationsService.stageEdgeReplay(body.storeId, body.operationCount);
    }
};
exports.ResilienceOperationsController = ResilienceOperationsController;
__decorate([
    (0, common_1.Get)('management-metadata'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "getManagementMetadata", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "getOperationsOverview", null);
__decorate([
    (0, common_1.Get)('observability'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.ObservabilityQueryDto]),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "getObservabilitySignals", null);
__decorate([
    (0, common_1.Get)('retry-policies'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.RetryPolicyQueryDto]),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "getRetryPolicies", null);
__decorate([
    (0, common_1.Get)('recovery-plans'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.RecoveryPlanQueryDto]),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "getRecoveryPlans", null);
__decorate([
    (0, common_1.Get)('recovery-plans/:resource'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __param(0, (0, common_1.Param)('resource')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "getRecoveryPlan", null);
__decorate([
    (0, common_1.Post)('edge-replay/stage'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.operations.recovery.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resilience_operations_dto_1.StageEdgeReplayDto]),
    __metadata("design:returntype", Object)
], ResilienceOperationsController.prototype, "stageEdgeReplay", null);
exports.ResilienceOperationsController = ResilienceOperationsController = __decorate([
    (0, common_1.Controller)('foundation/resilience-operations'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __metadata("design:paramtypes", [resilience_operations_service_1.ResilienceOperationsService])
], ResilienceOperationsController);
//# sourceMappingURL=resilience-operations.controller.js.map