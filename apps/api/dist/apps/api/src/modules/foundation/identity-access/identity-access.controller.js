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
exports.IdentityAccessController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../../tenant/tenant.decorator");
const identity_access_decorator_1 = require("./identity-access.decorator");
const identity_access_service_1 = require("./identity-access.service");
let IdentityAccessController = class IdentityAccessController {
    identityAccessService;
    constructor(identityAccessService) {
        this.identityAccessService = identityAccessService;
    }
    getContext(tenantContext, actorContext) {
        return this.identityAccessService.resolveActorContext(tenantContext, actorContext);
    }
    validateRole(tenantContext, actorContext) {
        return {
            status: 'allowed',
            check: 'role',
            resolved: this.identityAccessService.resolveActorContext(tenantContext, actorContext)
        };
    }
    validatePermission(tenantContext, actorContext) {
        return {
            status: 'allowed',
            check: 'permission',
            authorization: this.identityAccessService.authorizeAction('identity-access:read', { tenantId: tenantContext.tenantId }, tenantContext, actorContext)
        };
    }
    validateTenantScope(tenantId, tenantContext, actorContext) {
        return {
            status: 'allowed',
            check: 'tenant-scope',
            targetTenantId: tenantId,
            authorization: this.identityAccessService.authorizeAction('tenant:read', { tenantId }, tenantContext, actorContext)
        };
    }
};
exports.IdentityAccessController = IdentityAccessController;
__decorate([
    (0, common_1.Get)('context'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IdentityAccessController.prototype, "getContext", null);
__decorate([
    (0, common_1.Get)('validate/role'),
    (0, identity_access_decorator_1.RequireRoles)('tenant-admin', 'platform-admin'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IdentityAccessController.prototype, "validateRole", null);
__decorate([
    (0, common_1.Get)('validate/permission'),
    (0, identity_access_decorator_1.RequirePermissions)('identity-access:read'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], IdentityAccessController.prototype, "validatePermission", null);
__decorate([
    (0, common_1.Get)('validate/tenant/:tenantId'),
    (0, identity_access_decorator_1.RequirePermissions)('tenant:read'),
    (0, identity_access_decorator_1.RequireTenantScope)({ tenantIdParam: 'tenantId', useRequestTenant: false }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __param(2, (0, identity_access_decorator_1.CurrentActor)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], IdentityAccessController.prototype, "validateTenantScope", null);
exports.IdentityAccessController = IdentityAccessController = __decorate([
    (0, common_1.Controller)('identity-access'),
    __metadata("design:paramtypes", [identity_access_service_1.IdentityAccessService])
], IdentityAccessController);
//# sourceMappingURL=identity-access.controller.js.map