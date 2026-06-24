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
exports.LytController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const lyt_service_1 = require("./lyt.service");
let LytController = class LytController {
    lytService;
    constructor(lytService) {
        this.lytService = lytService;
    }
    getFixtures(transport, capability) {
        return this.lytService.getFixtures({ transport, capability });
    }
    getFixtureSummary(transport, capability) {
        return this.lytService.getFixtureSummary({ transport, capability });
    }
    getFixture(key) {
        return this.lytService.getFixture(key);
    }
    compareFixture(key, body) {
        return this.lytService.compareFixtureInput(key, body);
    }
    importFixturePreview(key, body) {
        return this.lytService.previewFixtureImport(key, body);
    }
    importFixturePlan(key, body) {
        return this.lytService.planFixtureImport(key, body);
    }
    getBootstrap() {
        return this.lytService.getBootstrap();
    }
    async getConnection(storeId, tenantContext) {
        return this.lytService.getConnection(storeId, tenantContext);
    }
    async getConnectionCapabilityReadiness(storeId, tenantContext) {
        return this.lytService.getConnectionCapabilityReadiness(storeId, tenantContext);
    }
    async getStoreCapabilityAccessView(storeId, tenantContext) {
        return this.lytService.getStoreCapabilityAccessView(storeId, tenantContext);
    }
    async getAdapterSelection(storeId, tenantContext) {
        return this.lytService.getAdapterSelection(storeId, tenantContext);
    }
    async getConnectionGovernanceSummary(tenantContext) {
        return this.lytService.getConnectionGovernanceSummary(tenantContext);
    }
    async getConnectionGovernanceAlerts(tenantContext) {
        return this.lytService.getConnectionGovernanceAlerts(tenantContext);
    }
    async getDeviceStatus(deviceId) {
        const adapter = this.lytService.getAdapter();
        return adapter.getDeviceStatus(deviceId);
    }
    getDeviceHealthSummary(body) {
        return this.lytService.getDeviceHealthSummary(body.devices, body.thresholdMinutes);
    }
    async acceptWebhook(body) {
        return this.lytService.acceptWebhook(body);
    }
    async drillWebhook(body) {
        return this.lytService.drillWebhook(body);
    }
    async replayWebhookFixture(body) {
        return this.lytService.replayWebhookFixture(body);
    }
};
exports.LytController = LytController;
__decorate([
    (0, common_1.Get)('fixtures'),
    __param(0, (0, common_1.Query)('transport')),
    __param(1, (0, common_1.Query)('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getFixtures", null);
__decorate([
    (0, common_1.Get)('fixtures/summary'),
    __param(0, (0, common_1.Query)('transport')),
    __param(1, (0, common_1.Query)('capability')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getFixtureSummary", null);
__decorate([
    (0, common_1.Get)('fixtures/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getFixture", null);
__decorate([
    (0, common_1.Post)('fixtures/:key/compare'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "compareFixture", null);
__decorate([
    (0, common_1.Post)('fixtures/:key/import-preview'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "importFixturePreview", null);
__decorate([
    (0, common_1.Post)('fixtures/:key/import-plan'),
    __param(0, (0, common_1.Param)('key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "importFixturePlan", null);
__decorate([
    (0, common_1.Get)('bootstrap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)('connection/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getConnection", null);
__decorate([
    (0, common_1.Get)('connection/:storeId/readiness'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getConnectionCapabilityReadiness", null);
__decorate([
    (0, common_1.Get)('connection/:storeId/access-view'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getStoreCapabilityAccessView", null);
__decorate([
    (0, common_1.Get)('connection/:storeId/adapter'),
    __param(0, (0, common_1.Param)('storeId')),
    __param(1, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getAdapterSelection", null);
__decorate([
    (0, common_1.Get)('connection/governance-summary'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getConnectionGovernanceSummary", null);
__decorate([
    (0, common_1.Get)('connection/governance-alerts'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getConnectionGovernanceAlerts", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/status'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getDeviceStatus", null);
__decorate([
    (0, common_1.Post)('devices/health-summary'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getDeviceHealthSummary", null);
__decorate([
    (0, common_1.Post)('webhooks/callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "acceptWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/drill'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "drillWebhook", null);
__decorate([
    (0, common_1.Post)('webhooks/replay-fixture'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "replayWebhookFixture", null);
exports.LytController = LytController = __decorate([
    (0, common_1.Controller)('lyt'),
    __metadata("design:paramtypes", [lyt_service_1.LytService])
], LytController);
//# sourceMappingURL=lyt.controller.js.map