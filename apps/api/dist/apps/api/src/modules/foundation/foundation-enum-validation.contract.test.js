"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const configuration_governance_service_1 = require("./configuration-governance/configuration-governance.service");
const foundation_service_1 = require("./foundation.service");
const identity_access_service_1 = require("./identity-access/identity-access.service");
const integration_orchestration_service_1 = require("./integration-orchestration/integration-orchestration.service");
const resilience_operations_service_1 = require("./resilience-operations/resilience-operations.service");
const runtime_governance_service_1 = require("./runtime-governance/runtime-governance.service");
const trust_governance_service_1 = require("./trust-governance/trust-governance.service");
function buildModuleStub(key) {
    return {
        getDescriptor: () => ({
            key,
            name: key,
            purpose: 'stub',
            inboundContracts: [],
            outboundContracts: [],
            capabilities: []
        }),
        getGovernanceBaselines: () => [],
        getOperationsOverview: async () => ({}),
        listGovernanceApprovals: async () => [],
        getAuditRecords: async () => [],
        listQuotaLedgers: async () => [],
        getSecretMetadata: async () => []
    };
}
(0, node_test_1.default)('contract: foundation module detail returns available keys on unknown moduleKey', async () => {
    const service = new foundation_service_1.FoundationService(buildModuleStub('identity-access'), buildModuleStub('configuration-governance'), buildModuleStub('integration-orchestration'), buildModuleStub('trust-governance'), buildModuleStub('resilience-operations'), buildModuleStub('runtime-governance'), {});
    const result = await service.getOperationsModuleDetail('unknown-module', undefined);
    strict_1.default.equal(Array.isArray(result.availableModuleKeys), true);
    strict_1.default.equal(result.availableModuleKeys.includes('runtime-governance'), true);
});
(0, node_test_1.default)('contract: foundation alert drilldown returns available codes on unknown code', async () => {
    const service = new foundation_service_1.FoundationService(buildModuleStub('identity-access'), buildModuleStub('configuration-governance'), buildModuleStub('integration-orchestration'), buildModuleStub('trust-governance'), buildModuleStub('resilience-operations'), buildModuleStub('runtime-governance'), {});
    const result = await service.getOperationsAlertDrilldown('unknown-alert', undefined);
    strict_1.default.equal(Array.isArray(result.availableAlertCodes), true);
    strict_1.default.equal(result.availableAlertCodes.includes('runtime-governance-backlog'), true);
    strict_1.default.equal(result.availableAlertCodes.includes('lyt-connection-governance-risk'), true);
});
(0, node_test_1.default)('contract: foundation module descriptors expose active capabilities', () => {
    const descriptors = [
        new identity_access_service_1.IdentityAccessService().getDescriptor(),
        new configuration_governance_service_1.ConfigurationGovernanceService({}, {}).getDescriptor(),
        new integration_orchestration_service_1.IntegrationOrchestrationService({}, {}).getDescriptor(),
        new trust_governance_service_1.TrustGovernanceService({}).getDescriptor(),
        new resilience_operations_service_1.ResilienceOperationsService().getDescriptor(),
        new runtime_governance_service_1.RuntimeGovernanceService({}, {}, {}).getDescriptor()
    ];
    for (const descriptor of descriptors) {
        strict_1.default.equal(descriptor.capabilities.length > 0, true);
        strict_1.default.equal(descriptor.capabilities.every((capability) => capability.status === 'active'), true);
    }
});
//# sourceMappingURL=foundation-enum-validation.contract.test.js.map