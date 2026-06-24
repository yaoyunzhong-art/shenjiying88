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
exports.BootstrapController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const bootstrap_contract_1 = require("./bootstrap.contract");
let BootstrapController = class BootstrapController {
    getBootstrapMetadata(tenantContext) {
        return {
            tenantContext,
            foundationDependencies: (0, bootstrap_contract_1.toBootstrapFoundationMetadata)(undefined).foundationDependencies,
            phase: 'scaffold'
        };
    }
    getHealth() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            phase: 'scaffold'
        };
    }
};
exports.BootstrapController = BootstrapController;
__decorate([
    (0, common_1.Get)('metadata'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BootstrapController.prototype, "getBootstrapMetadata", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BootstrapController.prototype, "getHealth", null);
exports.BootstrapController = BootstrapController = __decorate([
    (0, common_1.Controller)('bootstrap')
], BootstrapController);
//# sourceMappingURL=bootstrap.controller.js.map