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
const tenant_module_1 = require("./tenant.module");
const tenant_controller_1 = require("./tenant.controller");
const tenant_service_1 = require("./tenant.service");
(0, node_test_1.describe)('TenantModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [tenant_module_1.TenantModule],
        }).compile();
        strict_1.default.ok(moduleRef);
        strict_1.default.ok(moduleRef instanceof testing_1.TestingModule);
    });
    (0, node_test_1.default)('should provide TenantController', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [tenant_module_1.TenantModule],
        }).compile();
        const controller = moduleRef.get(tenant_controller_1.TenantController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof tenant_controller_1.TenantController);
    });
    (0, node_test_1.default)('should provide TenantService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [tenant_module_1.TenantModule],
        }).compile();
        const service = moduleRef.get(tenant_service_1.TenantService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof tenant_service_1.TenantService);
    });
    (0, node_test_1.default)('should export TenantService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [tenant_module_1.TenantModule],
        }).compile();
        const exported = moduleRef.get(tenant_service_1.TenantService);
        strict_1.default.ok(exported);
    });
});
//# sourceMappingURL=tenant.module.test.js.map