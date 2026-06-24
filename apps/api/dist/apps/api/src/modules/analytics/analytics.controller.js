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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const analytics_dto_1 = require("./analytics.dto");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOperationSnapshot(tenantContext, body) {
        return this.analyticsService.getOperationSnapshot(tenantContext, {
            scope: body.scope,
            brandId: body.brandId,
            storeId: body.storeId
        });
    }
    getDiagnostics(tenantContext, body) {
        return this.analyticsService.getDiagnostics(tenantContext, {
            scope: body.scope,
            brandId: body.brandId,
            storeId: body.storeId
        });
    }
    getRecommendations(tenantContext, body) {
        return this.analyticsService.getRecommendations(tenantContext, {
            scope: body.scope,
            brandId: body.brandId,
            storeId: body.storeId
        });
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('snapshot'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_dto_1.GetOperationSnapshotDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getOperationSnapshot", null);
__decorate([
    (0, common_1.Get)('diagnostics'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_dto_1.GetDiagnosticsDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDiagnostics", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, analytics_dto_1.GetRecommendationsDto]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getRecommendations", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map