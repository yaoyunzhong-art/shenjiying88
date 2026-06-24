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
const foundation_service_1 = require("./foundation.service");
const descriptor = (key) => ({
    key: key,
    name: key,
    purpose: `${key} module`,
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [],
    // extended fields for backward compat
    moduleKey: key,
    modulePath: `src/modules/${key}`,
    displayName: key,
    description: `${key} module`,
    domainResponsibilities: [],
    consumers: [],
    managementMetadata: [],
    governanceBaselines: [],
    operationsDashboard: {
        overview: {},
        drilldowns: {}
    }
});
const governanceBaselines = [
    { key: 'baseline-1', name: 'Baseline 1' },
    { key: 'baseline-2', name: 'Baseline 2' }
];
const mockIdentityAccessService = { getDescriptor: () => descriptor('identity') };
const mockConfigurationGovernanceService = {
    getDescriptor: () => descriptor('configuration'),
    getGovernanceBaselines: () => governanceBaselines
};
const mockIntegrationOrchestrationService = { getDescriptor: () => descriptor('integration') };
const mockTrustGovernanceService = {
    getDescriptor: () => descriptor('trust'),
    getGovernanceBaselines: () => governanceBaselines
};
const mockResilienceOperationsService = {
    getDescriptor: () => descriptor('resilience'),
    getGovernanceBaselines: () => governanceBaselines
};
const mockRuntimeGovernanceService = { getDescriptor: () => descriptor('runtime') };
const mockPrisma = {};
function makeService() {
    return new foundation_service_1.FoundationService(mockIdentityAccessService, mockConfigurationGovernanceService, mockIntegrationOrchestrationService, mockTrustGovernanceService, mockResilienceOperationsService, mockRuntimeGovernanceService, mockPrisma);
}
(0, node_test_1.describe)('FoundationService', () => {
    (0, node_test_1.describe)('getModuleCatalog', () => {
        (0, node_test_1.default)('returns six modules', () => {
            const service = makeService();
            const catalog = service.getModuleCatalog();
            strict_1.default.equal(catalog.length, 6);
        });
        (0, node_test_1.default)('returns modules with required fields', () => {
            const service = makeService();
            for (const m of service.getModuleCatalog()) {
                strict_1.default.ok(m.key, 'key');
                strict_1.default.ok(m.name, 'name');
                strict_1.default.ok(m.purpose, 'purpose');
                strict_1.default.ok(Array.isArray(m.capabilities), 'capabilities');
            }
        });
        (0, node_test_1.default)('includes expected module keys', () => {
            const service = makeService();
            const keys = service.getModuleCatalog().map((m) => m.key).sort();
            strict_1.default.deepEqual(keys, ['configuration', 'identity', 'integration', 'resilience', 'runtime', 'trust']);
        });
    });
    (0, node_test_1.describe)('getConsumerCatalog', () => {
        (0, node_test_1.default)('returns four consumers', () => {
            const service = makeService();
            const catalog = service.getConsumerCatalog();
            strict_1.default.equal(catalog.length, 4);
        });
        (0, node_test_1.default)('each consumer has required fields', () => {
            const service = makeService();
            for (const c of service.getConsumerCatalog()) {
                strict_1.default.ok(c.consumer, 'consumer');
                strict_1.default.ok(Array.isArray(c.dependsOn), 'dependsOn');
                strict_1.default.ok(c.responsibility, 'responsibility');
            }
        });
        (0, node_test_1.default)('includes market, portal, workbench, and lyt-adapter consumers', () => {
            const service = makeService();
            const keys = service.getConsumerCatalog().map((c) => c.consumer).sort();
            strict_1.default.deepEqual(keys, ['lyt-adapter', 'market', 'portal', 'workbench']);
        });
    });
    (0, node_test_1.describe)('getGovernanceBaselines', () => {
        (0, node_test_1.default)('returns six baselines from three sub-services', () => {
            const service = makeService();
            const baselines = service.getGovernanceBaselines();
            strict_1.default.equal(baselines.length, 6);
        });
        (0, node_test_1.default)('each baseline has key and name', () => {
            const service = makeService();
            for (const b of service.getGovernanceBaselines()) {
                strict_1.default.ok(b.key, 'key');
                strict_1.default.ok(b.name, 'name');
            }
        });
    });
    (0, node_test_1.describe)('getBlueprint', () => {
        (0, node_test_1.default)('returns blueprint with required top-level fields', () => {
            const service = makeService();
            const blueprint = service.getBlueprint();
            strict_1.default.ok(blueprint.generatedAt, 'generatedAt');
            strict_1.default.ok(Array.isArray(blueprint.docs), 'docs');
            strict_1.default.ok(Array.isArray(blueprint.guardrails), 'guardrails');
            strict_1.default.ok(blueprint.modules, 'modules');
            strict_1.default.ok(blueprint.consumers, 'consumers');
            strict_1.default.ok(blueprint.governanceBaselines, 'governanceBaselines');
        });
        (0, node_test_1.default)('blueprint composits modules, consumers, and baselines', () => {
            const service = makeService();
            const blueprint = service.getBlueprint();
            strict_1.default.equal(blueprint.modules.length, 6);
            strict_1.default.equal(blueprint.consumers.length, 4);
            strict_1.default.equal(blueprint.governanceBaselines.length, 6);
        });
        (0, node_test_1.default)('blueprint docs include foundation-architecture.md', () => {
            const service = makeService();
            const blueprint = service.getBlueprint();
            strict_1.default.ok(blueprint.docs.some((d) => d.includes('foundation-architecture.md')));
        });
        (0, node_test_1.default)('blueprint guardrails are non-empty strings', () => {
            const service = makeService();
            for (const g of service.getBlueprint().guardrails) {
                strict_1.default.ok(typeof g === 'string' && g.length > 0);
            }
        });
        (0, node_test_1.default)('frontendBootstrap is defined', () => {
            const service = makeService();
            const blueprint = service.getBlueprint();
            strict_1.default.ok(blueprint.frontendBootstrap !== undefined);
            strict_1.default.ok(blueprint.frontendBootstrap !== null);
        });
        (0, node_test_1.default)('generatedAt is a valid ISO string', () => {
            const service = makeService();
            const blueprint = service.getBlueprint();
            const d = new Date(blueprint.generatedAt);
            strict_1.default.ok(!isNaN(d.getTime()));
        });
    });
    (0, node_test_1.describe)('getConsumerDependency', () => {
        (0, node_test_1.default)('returns matching consumer for known key', () => {
            const service = makeService();
            const dep = service.getConsumerDependency('market');
            strict_1.default.ok(dep);
            strict_1.default.equal(dep.consumer, 'market');
        });
        (0, node_test_1.default)('returns availableConsumers for unknown key', () => {
            const service = makeService();
            const dep = service.getConsumerDependency('nonexistent');
            strict_1.default.ok(Array.isArray(dep.availableConsumers));
            strict_1.default.ok(dep.availableConsumers.includes('market'));
        });
        (0, node_test_1.default)('availableConsumers includes all four keys', () => {
            const service = makeService();
            const dep = service.getConsumerDependency('unknown');
            strict_1.default.deepEqual(dep.availableConsumers.sort(), ['lyt-adapter', 'market', 'portal', 'workbench']);
        });
    });
    (0, node_test_1.describe)('getDependencySummary', () => {
        (0, node_test_1.default)('returns consumer for known key', () => {
            const service = makeService();
            const summary = service.getDependencySummary('portal');
            strict_1.default.ok(summary);
            strict_1.default.equal(summary.consumer, 'portal');
        });
        (0, node_test_1.default)('returns undefined for unknown key', () => {
            const service = makeService();
            const summary = service.getDependencySummary('nonexistent');
            strict_1.default.equal(summary, undefined);
        });
    });
});
//# sourceMappingURL=foundation.service.test.js.map