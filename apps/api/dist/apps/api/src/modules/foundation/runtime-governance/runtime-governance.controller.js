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
exports.RuntimeGovernanceController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../../tenant/tenant.decorator");
const identity_access_decorator_1 = require("../identity-access/identity-access.decorator");
const runtime_governance_dto_1 = require("./runtime-governance.dto");
const runtime_governance_service_1 = require("./runtime-governance.service");
let RuntimeGovernanceController = class RuntimeGovernanceController {
    runtimeGovernanceService;
    constructor(runtimeGovernanceService) {
        this.runtimeGovernanceService = runtimeGovernanceService;
    }
    submitAction(body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.submitAction(enrichRuntimeRequestContext(body, tenantContext, actorContext));
    }
    getActionReceipt(receiptCode) {
        return this.runtimeGovernanceService.getActionReceipt(receiptCode);
    }
    syncAction(receiptCode, body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.syncAction(receiptCode, enrichRuntimeRequestContext(body, tenantContext, actorContext));
    }
    recordCallback(receiptCode, body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.recordCallback(receiptCode, enrichRuntimeRequestContext(body, tenantContext, actorContext));
    }
    replayAction(receiptCode, body, tenantContext, actorContext) {
        return this.runtimeGovernanceService.replayAction(receiptCode, enrichRuntimeRequestContext(body, tenantContext, actorContext));
    }
};
exports.RuntimeGovernanceController = RuntimeGovernanceController;
__decorate([
    (0, common_1.Post)('actions'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [runtime_governance_dto_1.SubmitRuntimeGovernanceActionDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RuntimeGovernanceController.prototype, "submitAction", null);
__decorate([
    (0, common_1.Get)('actions/:receiptCode'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.read'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuntimeGovernanceController.prototype, "getActionReceipt", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/sync'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.SyncRuntimeGovernanceActionDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RuntimeGovernanceController.prototype, "syncAction", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/callback'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.RecordRuntimeGovernanceCallbackDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RuntimeGovernanceController.prototype, "recordCallback", null);
__decorate([
    (0, common_1.Post)('actions/:receiptCode/replay'),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.runtime-governance.write'),
    __param(0, (0, common_1.Param)('receiptCode')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __param(3, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, runtime_governance_dto_1.ReplayRuntimeGovernanceActionDto, Object, Object]),
    __metadata("design:returntype", void 0)
], RuntimeGovernanceController.prototype, "replayAction", null);
exports.RuntimeGovernanceController = RuntimeGovernanceController = __decorate([
    (0, common_1.Controller)('foundation/runtime-governance'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    __metadata("design:paramtypes", [runtime_governance_service_1.RuntimeGovernanceService])
], RuntimeGovernanceController);
function enrichRuntimeRequestContext(body, tenantContext, actorContext) {
    const baseBody = body;
    return {
        ...baseBody,
        actorId: actorContext?.actorId ?? (typeof baseBody.actorId === 'string' ? baseBody.actorId : undefined),
        tenantId: tenantContext?.tenantId,
        brandId: tenantContext?.brandId,
        storeId: tenantContext?.storeId,
        marketCode: tenantContext?.marketCode
    };
}
//# sourceMappingURL=runtime-governance.controller.js.map