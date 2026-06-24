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
exports.MarketController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const market_service_1 = require("./market.service");
let MarketController = class MarketController {
    marketService;
    constructor(marketService) {
        this.marketService = marketService;
    }
    getBootstrap() {
        return this.marketService.getBootstrap();
    }
    getScopedMarket(scopeType, scopeCode, tenantContext) {
        return {
            scopeType,
            scopeCode,
            marketProfile: this.marketService.getMergedProfile(tenantContext),
            overrides: this.marketService.getOverrides(tenantContext)
        };
    }
    getScopedPortalMarket(scopeType, scopeCode, tenantContext) {
        const marketProfile = this.marketService.getMergedProfile(tenantContext);
        return {
            scopeType,
            scopeCode,
            marketCode: marketProfile.marketCode,
            locale: marketProfile.locale,
            timezone: marketProfile.timezone,
            tax: marketProfile.tax,
            network: marketProfile.network,
            email: marketProfile.email,
            social: marketProfile.social
        };
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Get)('bootstrap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)(':scopeType/:scopeCode'),
    __param(0, (0, common_1.Param)('scopeType')),
    __param(1, (0, common_1.Param)('scopeCode')),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getScopedMarket", null);
__decorate([
    (0, common_1.Get)(':scopeType/:scopeCode/portal'),
    __param(0, (0, common_1.Param)('scopeType')),
    __param(1, (0, common_1.Param)('scopeCode')),
    __param(2, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getScopedPortalMarket", null);
exports.MarketController = MarketController = __decorate([
    (0, common_1.Controller)('markets'),
    __metadata("design:paramtypes", [market_service_1.MarketService])
], MarketController);
//# sourceMappingURL=market.controller.js.map