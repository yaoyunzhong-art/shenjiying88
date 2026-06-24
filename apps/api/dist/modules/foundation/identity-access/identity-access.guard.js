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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const identity_access_decorator_1 = require("./identity-access.decorator");
const identity_access_service_1 = require("./identity-access.service");
let IdentityAccessGuard = class IdentityAccessGuard {
    reflector;
    identityAccessService;
    constructor(reflector, identityAccessService) {
        this.reflector = reflector;
        this.identityAccessService = identityAccessService;
    }
    resolveScopeRequirement(req, metadata) {
        const readParam = (key) => {
            if (!key) {
                return undefined;
            }
            const value = req.params?.[key];
            return Array.isArray(value) ? value[0] : value;
        };
        const useRequestTenant = metadata?.useRequestTenant !== false;
        return {
            tenantId: readParam(metadata?.tenantIdParam) ?? (useRequestTenant ? req.tenantContext?.tenantId : undefined),
            brandId: readParam(metadata?.brandIdParam) ?? (useRequestTenant ? req.tenantContext?.brandId : undefined),
            storeId: readParam(metadata?.storeIdParam) ?? (useRequestTenant ? req.tenantContext?.storeId : undefined)
        };
    }
    canActivate(context) {
        const roles = this.reflector.getAllAndOverride(identity_access_decorator_1.ROLES_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ]) ?? [];
        const permissions = this.reflector.getAllAndOverride(identity_access_decorator_1.PERMISSIONS_METADATA_KEY, [
            context.getHandler(),
            context.getClass()
        ]) ?? [];
        const tenantScopeMetadata = this.reflector.getAllAndOverride(identity_access_decorator_1.TENANT_SCOPE_METADATA_KEY, [context.getHandler(), context.getClass()]);
        if (roles.length === 0 && permissions.length === 0 && !tenantScopeMetadata) {
            return true;
        }
        const req = context.switchToHttp().getRequest();
        const actorContext = req.actorContext;
        if (!actorContext?.authenticated) {
            throw new common_1.UnauthorizedException('Missing actor context headers.');
        }
        if (!this.identityAccessService.hasAnyRole(actorContext, roles)) {
            throw new common_1.ForbiddenException(`Required role not satisfied: ${roles.join(', ')}`);
        }
        if (!this.identityAccessService.hasAllPermissions(actorContext, permissions)) {
            throw new common_1.ForbiddenException(`Required permission not satisfied: ${permissions.join(', ')}`);
        }
        if (tenantScopeMetadata &&
            !this.identityAccessService.validateTenantScope(req.tenantContext, actorContext, this.resolveScopeRequirement(req, tenantScopeMetadata))) {
            throw new common_1.ForbiddenException('Tenant scope validation failed.');
        }
        return true;
    }
};
exports.IdentityAccessGuard = IdentityAccessGuard;
exports.IdentityAccessGuard = IdentityAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        identity_access_service_1.IdentityAccessService])
], IdentityAccessGuard);
//# sourceMappingURL=identity-access.guard.js.map