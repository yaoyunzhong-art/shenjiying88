"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationOrchestrationModule = void 0;
const common_1 = require("@nestjs/common");
const integration_orchestration_controller_1 = require("./integration-orchestration.controller");
const integration_orchestration_service_1 = require("./integration-orchestration.service");
let IntegrationOrchestrationModule = class IntegrationOrchestrationModule {
};
exports.IntegrationOrchestrationModule = IntegrationOrchestrationModule;
exports.IntegrationOrchestrationModule = IntegrationOrchestrationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [integration_orchestration_controller_1.IntegrationOrchestrationController],
        providers: [integration_orchestration_service_1.IntegrationOrchestrationService],
        exports: [integration_orchestration_service_1.IntegrationOrchestrationService]
    })
], IntegrationOrchestrationModule);
//# sourceMappingURL=integration-orchestration.module.js.map