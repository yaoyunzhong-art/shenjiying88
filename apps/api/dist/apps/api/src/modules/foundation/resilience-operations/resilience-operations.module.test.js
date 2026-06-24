"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const testing_1 = require("@nestjs/testing");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const resilience_operations_module_1 = require("./resilience-operations.module");
const resilience_operations_controller_1 = require("./resilience-operations.controller");
const resilience_operations_service_1 = require("./resilience-operations.service");
(0, node_test_1.describe)('ResilienceOperationsModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [resilience_operations_module_1.ResilienceOperationsModule]
        }).compile();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide ResilienceOperationsController', () => {
        const controller = moduleRef.get(resilience_operations_controller_1.ResilienceOperationsController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof resilience_operations_controller_1.ResilienceOperationsController);
    });
    (0, node_test_1.default)('should provide ResilienceOperationsService', () => {
        const service = moduleRef.get(resilience_operations_service_1.ResilienceOperationsService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof resilience_operations_service_1.ResilienceOperationsService);
    });
    (0, node_test_1.default)('should export ResilienceOperationsService for cross-module use', () => {
        const service = moduleRef.get(resilience_operations_service_1.ResilienceOperationsService);
        strict_1.default.ok(service);
    });
});
//# sourceMappingURL=resilience-operations.module.test.js.map