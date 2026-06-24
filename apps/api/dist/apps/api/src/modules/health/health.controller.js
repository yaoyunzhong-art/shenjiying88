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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const identity_access_decorator_1 = require("../foundation/identity-access/identity-access.decorator");
const domain_1 = require("@m5/domain");
const health_dto_1 = require("./health.dto");
const health_service_1 = require("./health.service");
let HealthController = class HealthController {
    healthService;
    constructor(healthService) {
        this.healthService = healthService;
    }
    getHealth() {
        return this.healthService.ping();
    }
    getPing() {
        return this.healthService.ping();
    }
    getReadiness(tenantContext, actorContext, query) {
        return this.healthService.check(toHealthCheckContext(tenantContext, actorContext, query));
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getPing", null);
__decorate([
    (0, common_1.Get)('readiness'),
    (0, identity_access_decorator_1.RequireTenantScope)(),
    (0, identity_access_decorator_1.RequireRoles)('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'),
    (0, identity_access_decorator_1.RequirePermissions)('foundation.governance.read'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, identity_access_decorator_1.CurrentActor)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, health_dto_1.HealthQueryDto]),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "getReadiness", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [health_service_1.HealthService])
], HealthController);
function toHealthCheckContext(tenantContext, actorContext, query) {
    return {
        scope: {
            scopeType: tenantContext?.storeId
                ? domain_1.FoundationScopeType.Store
                : tenantContext?.brandId
                    ? domain_1.FoundationScopeType.Brand
                    : tenantContext?.tenantId
                        ? domain_1.FoundationScopeType.Tenant
                        : tenantContext?.marketCode
                            ? domain_1.FoundationScopeType.Market
                            : domain_1.FoundationScopeType.Platform,
            scopeId: tenantContext?.storeId ??
                tenantContext?.brandId ??
                tenantContext?.tenantId ??
                tenantContext?.marketCode ??
                'platform'
        },
        requestorId: actorContext?.actorId,
        verbose: normalizeVerbose(query?.verbose)
    };
}
function normalizeVerbose(value) {
    return value === true || value === 'true';
}
//# sourceMappingURL=health.controller.js.map