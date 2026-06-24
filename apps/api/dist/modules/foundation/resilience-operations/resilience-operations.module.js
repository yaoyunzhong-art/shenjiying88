"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResilienceOperationsModule = void 0;
const common_1 = require("@nestjs/common");
const resilience_operations_controller_1 = require("./resilience-operations.controller");
const resilience_operations_service_1 = require("./resilience-operations.service");
let ResilienceOperationsModule = class ResilienceOperationsModule {
};
exports.ResilienceOperationsModule = ResilienceOperationsModule;
exports.ResilienceOperationsModule = ResilienceOperationsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [resilience_operations_controller_1.ResilienceOperationsController],
        providers: [resilience_operations_service_1.ResilienceOperationsService],
        exports: [resilience_operations_service_1.ResilienceOperationsService]
    })
], ResilienceOperationsModule);
//# sourceMappingURL=resilience-operations.module.js.map