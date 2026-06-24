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
const workbench_module_1 = require("./workbench.module");
const workbench_controller_1 = require("./workbench.controller");
const workbench_service_1 = require("./workbench.service");
const foundation_service_1 = require("../foundation/foundation.service");
const runtime_governance_service_1 = require("../foundation/runtime-governance/runtime-governance.service");
const market_service_1 = require("../market/market.service");
const portal_service_1 = require("../portal/portal.service");
const stubFoundationService = {
    getDependencySummary: (_module) => ({
        module: 'foundation',
        generatedAt: '2026-01-01',
        dependencies: [],
        contracts: [],
    }),
};
const stubMarketService = {
    getMergedProfile: () => ({
        locale: { supportedLanguages: ['zh-CN', 'en-US'] },
        marketCode: 'cn-mainland',
    }),
};
const stubPortalService = {
    getBootstrap: () => ({
        storePortal: {},
        tenantPortal: {
            loginEntry: { loginPath: '/login', ssoEnabled: false },
        },
        brandPortal: {},
    }),
};
const stubRuntimeGovernanceService = {
    submitAction: async () => ({ receiptCode: 'REC-001', state: 'submitted' }),
    getActionReceipt: async () => ({ receiptCode: 'REC-001', state: 'submitted' }),
    syncAction: async () => ({ receiptCode: 'REC-001', state: 'submitted' }),
    recordCallback: async () => ({ receiptCode: 'REC-001', state: 'callback-recorded' }),
    replayAction: async () => ({ receiptCode: 'REC-001', state: 'replay-scheduled' }),
};
(0, node_test_1.describe)('WorkbenchModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [workbench_module_1.WorkbenchModule],
        })
            .overrideProvider(foundation_service_1.FoundationService)
            .useValue(stubFoundationService)
            .overrideProvider(runtime_governance_service_1.RuntimeGovernanceService)
            .useValue(stubRuntimeGovernanceService)
            .overrideProvider(market_service_1.MarketService)
            .useValue(stubMarketService)
            .overrideProvider(portal_service_1.PortalService)
            .useValue(stubPortalService)
            .compile();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide WorkbenchController', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [workbench_module_1.WorkbenchModule],
        })
            .overrideProvider(foundation_service_1.FoundationService)
            .useValue(stubFoundationService)
            .overrideProvider(runtime_governance_service_1.RuntimeGovernanceService)
            .useValue(stubRuntimeGovernanceService)
            .overrideProvider(market_service_1.MarketService)
            .useValue(stubMarketService)
            .overrideProvider(portal_service_1.PortalService)
            .useValue(stubPortalService)
            .compile();
        const controller = moduleRef.get(workbench_controller_1.WorkbenchController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof workbench_controller_1.WorkbenchController);
    });
    (0, node_test_1.default)('should provide WorkbenchService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [workbench_module_1.WorkbenchModule],
        })
            .overrideProvider(foundation_service_1.FoundationService)
            .useValue(stubFoundationService)
            .overrideProvider(runtime_governance_service_1.RuntimeGovernanceService)
            .useValue(stubRuntimeGovernanceService)
            .overrideProvider(market_service_1.MarketService)
            .useValue(stubMarketService)
            .overrideProvider(portal_service_1.PortalService)
            .useValue(stubPortalService)
            .compile();
        const service = moduleRef.get(workbench_service_1.WorkbenchService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof workbench_service_1.WorkbenchService);
    });
});
//# sourceMappingURL=workbench.module.test.js.map