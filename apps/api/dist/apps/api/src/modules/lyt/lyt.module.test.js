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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const lyt_module_1 = require("./lyt.module");
const lyt_controller_1 = require("./lyt.controller");
const lyt_adapter_registry_1 = require("./lyt-adapter.registry");
const lyt_service_1 = require("./lyt.service");
const lyt_connection_manager_1 = require("./lyt-connection.manager");
const mock_lyt_adapter_1 = require("./adapters/mock-lyt.adapter");
const real_lyt_adapter_1 = require("./adapters/real-lyt.adapter");
const sandbox_lyt_adapter_1 = require("./adapters/sandbox-lyt.adapter");
const foundation_module_1 = require("../foundation/foundation.module");
const integration_orchestration_service_1 = require("../foundation/integration-orchestration/integration-orchestration.service");
const stubFoundationService = {
    getDependencySummary: () => ({
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['contract-a', 'contract-b']
    })
};
const stubIntegrationOrchestrationService = {
    acceptWebhook: async () => ({ status: 'accepted', source: 'lyt', idempotency: { key: 'lyt:evt-1' } }),
    publishEvent: async () => ({ status: 'accepted', envelope: { aggregateId: 'evt-1' } })
};
/** 轻量 stub 替代 FoundationModule，避免引入全部 sub‑module 和 Prisma 依赖 */
let StubFoundationModule = class StubFoundationModule {
};
StubFoundationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            { provide: 'FoundationService', useValue: stubFoundationService },
            { provide: integration_orchestration_service_1.IntegrationOrchestrationService, useValue: stubIntegrationOrchestrationService }
        ],
        exports: ['FoundationService', integration_orchestration_service_1.IntegrationOrchestrationService]
    })
], StubFoundationModule);
function createTestingModule() {
    return testing_1.Test.createTestingModule({ imports: [lyt_module_1.LytModule] })
        .overrideModule(foundation_module_1.FoundationModule)
        .useModule(StubFoundationModule)
        .compile();
}
(0, node_test_1.describe)('LytModule', () => {
    (0, node_test_1.default)('should compile and instantiate', async () => {
        const moduleRef = await createTestingModule();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide LytController', async () => {
        const moduleRef = await createTestingModule();
        const controller = moduleRef.get(lyt_controller_1.LytController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof lyt_controller_1.LytController);
    });
    (0, node_test_1.default)('should provide LytService', async () => {
        const moduleRef = await createTestingModule();
        const service = moduleRef.get(lyt_service_1.LytService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof lyt_service_1.LytService);
    });
    (0, node_test_1.default)('should provide LytConnectionManager', async () => {
        const moduleRef = await createTestingModule();
        const manager = moduleRef.get(lyt_connection_manager_1.LytConnectionManager);
        strict_1.default.ok(manager);
        strict_1.default.ok(manager instanceof lyt_connection_manager_1.LytConnectionManager);
    });
    (0, node_test_1.default)('should provide MockLytAdapter', async () => {
        const moduleRef = await createTestingModule();
        const adapter = moduleRef.get(mock_lyt_adapter_1.MockLytAdapter);
        strict_1.default.ok(adapter);
        strict_1.default.ok(adapter instanceof mock_lyt_adapter_1.MockLytAdapter);
    });
    (0, node_test_1.default)('should provide SandboxLytAdapter and RealLytAdapter', async () => {
        const moduleRef = await createTestingModule();
        const sandbox = moduleRef.get(sandbox_lyt_adapter_1.SandboxLytAdapter);
        const real = moduleRef.get(real_lyt_adapter_1.RealLytAdapter);
        strict_1.default.ok(sandbox instanceof sandbox_lyt_adapter_1.SandboxLytAdapter);
        strict_1.default.ok(real instanceof real_lyt_adapter_1.RealLytAdapter);
    });
    (0, node_test_1.default)('should provide LytAdapterRegistry', async () => {
        const moduleRef = await createTestingModule();
        const registry = moduleRef.get(lyt_adapter_registry_1.LytAdapterRegistry);
        strict_1.default.ok(registry);
        strict_1.default.ok(registry instanceof lyt_adapter_registry_1.LytAdapterRegistry);
    });
});
//# sourceMappingURL=lyt.module.test.js.map