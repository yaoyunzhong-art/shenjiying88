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
const lyt_service_1 = require("./lyt.service");
let LytController = class LytController {
    lytService;
    constructor(lytService) {
        this.lytService = lytService;
    }
    getBootstrap() {
        return this.lytService.getBootstrap();
    }
    getConnection(storeId) {
        return this.lytService.getAdapter();
    }
    async getDeviceStatus(deviceId) {
        const adapter = this.lytService.getAdapter();
        return adapter.getDeviceStatus(deviceId);
    }
};
exports.LytController = LytController;
__decorate([
    (0, common_1.Get)('bootstrap'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getBootstrap", null);
__decorate([
    (0, common_1.Get)('connection/:storeId'),
    __param(0, (0, common_1.Param)('storeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LytController.prototype, "getConnection", null);
__decorate([
    (0, common_1.Get)('devices/:deviceId/status'),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LytController.prototype, "getDeviceStatus", null);
exports.LytController = LytController = __decorate([
    (0, common_1.Controller)('lyt'),
    __metadata("design:paramtypes", [lyt_service_1.LytService])
], LytController);
//# sourceMappingURL=lyt.controller.js.map