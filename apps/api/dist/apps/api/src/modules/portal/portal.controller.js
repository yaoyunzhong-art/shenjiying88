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
exports.PortalController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const portal_service_1 = require("./portal.service");
let PortalController = class PortalController {
    portalService;
    constructor(portalService) {
        this.portalService = portalService;
    }
    /** 获取完整的门户 bootstrap 信息（含 tenant/brand/store 门户 + 市场配置 + 基础依赖） */
    getBootstrap(tenantContext) {
        return this.portalService.getBootstrap(tenantContext);
    }
    /** 仅获取租户级别 ToB 门户信息 */
    getTenantPortal(tenantContext) {
        return this.portalService.resolveTenantPortal(tenantContext);
    }
    /** 仅获取品牌级别 ToB 门户信息 */
    getBrandPortal(tenantContext) {
        return this.portalService.resolveBrandPortal(tenantContext);
    }
    /** 仅获取门店级别 ToC 门户信息 */
    getStorePortal(tenantContext) {
        return this.portalService.resolveStorePortal(tenantContext);
    }
};
exports.PortalController = PortalController;
__decorate([
    (0, common_1.Get)('bootstrap'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)('tenant-portal'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalController.prototype, "getTenantPortal", null);
__decorate([
    (0, common_1.Get)('brand-portal'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalController.prototype, "getBrandPortal", null);
__decorate([
    (0, common_1.Get)('store-portal'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PortalController.prototype, "getStorePortal", null);
exports.PortalController = PortalController = __decorate([
    (0, common_1.Controller)('portals'),
    __metadata("design:paramtypes", [portal_service_1.PortalService])
], PortalController);
//# sourceMappingURL=portal.controller.js.map