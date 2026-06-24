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
const cross_module_module_1 = require("./cross-module.module");
const cross_module_controller_1 = require("./cross-module.controller");
const cross_module_service_1 = require("./cross-module.service");
(0, node_test_1.describe)('CrossModuleModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [cross_module_module_1.CrossModuleModule],
        }).compile();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide CrossModuleController', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [cross_module_module_1.CrossModuleModule],
        }).compile();
        const controller = moduleRef.get(cross_module_controller_1.CrossModuleController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof cross_module_controller_1.CrossModuleController);
    });
    (0, node_test_1.default)('should provide CrossModuleService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [cross_module_module_1.CrossModuleModule],
        }).compile();
        const service = moduleRef.get(cross_module_service_1.CrossModuleService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof cross_module_service_1.CrossModuleService);
    });
});
//# sourceMappingURL=cross-module.module.test.js.map