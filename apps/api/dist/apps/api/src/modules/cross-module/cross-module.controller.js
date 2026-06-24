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
exports.CrossModuleController = void 0;
const common_1 = require("@nestjs/common");
const cross_module_service_1 = require("./cross-module.service");
let CrossModuleController = class CrossModuleController {
    crossModuleService;
    constructor(crossModuleService) {
        this.crossModuleService = crossModuleService;
    }
    /** 返回跨模块 E2E 验证链路清单 */
    getChainStatus() {
        const chains = this.crossModuleService.listChains();
        return {
            chains: chains.map((c) => ({
                name: c.name,
                modules: c.modules,
                status: c.status,
                lastVerifiedAt: c.lastVerifiedAt,
                brokenNodes: c.brokenNodes
            })),
            total: chains.length,
            runtime: 'cross-module-e2e',
        };
    }
    /** 返回验证摘要统计 */
    getSummary() {
        return this.crossModuleService.getSummary();
    }
    /** 执行跨模块链路验证 */
    async validate(body) {
        return this.crossModuleService.validate(body.chainNames, {
            tenantId: body.tenantId,
            storeId: body.storeId,
            marketCode: body.marketCode
        });
    }
    /** 验证单条链路 */
    async validateChain(chainName, body) {
        const results = await this.crossModuleService.validate([chainName], {
            tenantId: body.tenantId,
            storeId: body.storeId,
            marketCode: body.marketCode
        });
        return results[0] ?? null;
    }
    /** 检查是否所有链路已验证通过 */
    getAllVerified() {
        const verified = this.crossModuleService.checkAllVerified();
        return { allVerified: verified, checkedAt: new Date().toISOString() };
    }
    /** 检查是否有断开链路 */
    getHasBroken() {
        const broken = this.crossModuleService.checkHasBroken();
        return { hasBroken: broken, checkedAt: new Date().toISOString() };
    }
    /** 重置所有链路状态到 Defined */
    resetAll() {
        this.crossModuleService.resetAll();
        return { reset: true, resetAt: new Date().toISOString() };
    }
};
exports.CrossModuleController = CrossModuleController;
__decorate([
    (0, common_1.Get)('chain-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], CrossModuleController.prototype, "getChainStatus", null);
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CrossModuleController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)('validate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], CrossModuleController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)('validate/:chainName'),
    __param(0, (0, common_1.Param)('chainName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], CrossModuleController.prototype, "validateChain", null);
__decorate([
    (0, common_1.Get)('all-verified'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CrossModuleController.prototype, "getAllVerified", null);
__decorate([
    (0, common_1.Get)('has-broken'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CrossModuleController.prototype, "getHasBroken", null);
__decorate([
    (0, common_1.Post)('reset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CrossModuleController.prototype, "resetAll", null);
exports.CrossModuleController = CrossModuleController = __decorate([
    (0, common_1.Controller)('cross-module'),
    __metadata("design:paramtypes", [cross_module_service_1.CrossModuleService])
], CrossModuleController);
//# sourceMappingURL=cross-module.controller.js.map