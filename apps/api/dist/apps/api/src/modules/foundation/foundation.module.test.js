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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const foundation_module_1 = require("./foundation.module");
const foundation_controller_1 = require("./foundation.controller");
const foundation_service_1 = require("./foundation.service");
const identity_access_module_1 = require("./identity-access/identity-access.module");
const configuration_governance_module_1 = require("./configuration-governance/configuration-governance.module");
const integration_orchestration_module_1 = require("./integration-orchestration/integration-orchestration.module");
const trust_governance_module_1 = require("./trust-governance/trust-governance.module");
const resilience_operations_module_1 = require("./resilience-operations/resilience-operations.module");
const runtime_governance_module_1 = require("./runtime-governance/runtime-governance.module");
const governance_approval_module_1 = require("./governance-approval/governance-approval.module");
(0, node_test_1.describe)('FoundationModule', () => {
    (0, node_test_1.default)('FoundationModule exposes controller metadata', () => {
        const controllers = Reflect.getMetadata('controllers', foundation_module_1.FoundationModule) || [];
        strict_1.default.ok(controllers.includes(foundation_controller_1.FoundationController), 'FoundationController should be registered');
    });
    (0, node_test_1.default)('FoundationModule exposes provider metadata', () => {
        const providers = Reflect.getMetadata('providers', foundation_module_1.FoundationModule) || [];
        strict_1.default.ok(providers.includes(foundation_service_1.FoundationService), 'FoundationService should be registered');
    });
    (0, node_test_1.default)('FoundationModule imports all sub-modules', () => {
        const imports = Reflect.getMetadata('imports', foundation_module_1.FoundationModule) || [];
        const expectedModules = [
            identity_access_module_1.IdentityAccessModule,
            configuration_governance_module_1.ConfigurationGovernanceModule,
            integration_orchestration_module_1.IntegrationOrchestrationModule,
            trust_governance_module_1.TrustGovernanceModule,
            resilience_operations_module_1.ResilienceOperationsModule,
            runtime_governance_module_1.RuntimeGovernanceModule,
            governance_approval_module_1.GovernanceApprovalModule
        ];
        for (const mod of expectedModules) {
            strict_1.default.ok(imports.includes(mod), `Should import ${mod.name}`);
        }
    });
    (0, node_test_1.default)('FoundationModule exports FoundationService', () => {
        const exports_ = Reflect.getMetadata('exports', foundation_module_1.FoundationModule) || [];
        strict_1.default.ok(exports_.includes(foundation_service_1.FoundationService), 'FoundationService should be exported');
    });
    (0, node_test_1.default)('FoundationModule has the expected set of controllers (one)', () => {
        const controllers = Reflect.getMetadata('controllers', foundation_module_1.FoundationModule) || [];
        strict_1.default.strictEqual(controllers.length, 1, 'FoundationModule should have exactly 1 controller');
        strict_1.default.strictEqual(controllers[0], foundation_controller_1.FoundationController, 'The only controller should be FoundationController');
    });
    (0, node_test_1.default)('FoundationModule has exactly 1 provider (FoundationService)', () => {
        const providers = Reflect.getMetadata('providers', foundation_module_1.FoundationModule) || [];
        strict_1.default.strictEqual(providers.length, 1, 'FoundationModule should have exactly 1 provider');
        strict_1.default.strictEqual(providers[0], foundation_service_1.FoundationService, 'The only provider should be FoundationService');
    });
    (0, node_test_1.default)('FoundationModule imports exactly 7 sub-modules', () => {
        const imports = Reflect.getMetadata('imports', foundation_module_1.FoundationModule) || [];
        strict_1.default.strictEqual(imports.length, 7, 'FoundationModule should import exactly 7 sub-modules');
    });
    (0, node_test_1.default)('FoundationModule exports only FoundationService', () => {
        const exports_ = Reflect.getMetadata('exports', foundation_module_1.FoundationModule) || [];
        strict_1.default.strictEqual(exports_.length, 1, 'FoundationModule should export exactly 1 entity');
        strict_1.default.strictEqual(exports_[0], foundation_service_1.FoundationService, 'Should export FoundationService');
    });
});
//# sourceMappingURL=foundation.module.test.js.map