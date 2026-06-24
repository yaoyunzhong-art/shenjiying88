"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
(0, node_test_1.default)('configuration-governance controller path metadata is set', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const path = Reflect.getMetadata('path', ConfigurationGovernanceController);
    strict_1.default.equal(path, 'foundation/configuration-governance');
});
(0, node_test_1.default)('configuration-governance controller management-metadata route has GET metadata', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const method = Reflect.getMetadata('method', ConfigurationGovernanceController.prototype.getManagementMetadata);
    const path = Reflect.getMetadata('path', ConfigurationGovernanceController.prototype.getManagementMetadata);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'management-metadata');
});
(0, node_test_1.default)('configuration-governance controller overview route has GET metadata', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const method = Reflect.getMetadata('method', ConfigurationGovernanceController.prototype.getOperationsOverview);
    const path = Reflect.getMetadata('path', ConfigurationGovernanceController.prototype.getOperationsOverview);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'overview');
});
(0, node_test_1.default)('configuration-governance controller snapshot route has GET metadata', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const method = Reflect.getMetadata('method', ConfigurationGovernanceController.prototype.getSnapshot);
    const path = Reflect.getMetadata('path', ConfigurationGovernanceController.prototype.getSnapshot);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'snapshot');
});
(0, node_test_1.default)('configuration-governance controller feature-flags route has GET metadata', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const method = Reflect.getMetadata('method', ConfigurationGovernanceController.prototype.getFeatureFlags);
    const path = Reflect.getMetadata('path', ConfigurationGovernanceController.prototype.getFeatureFlags);
    strict_1.default.equal(method, 0);
    strict_1.default.equal(path, 'feature-flags');
});
(0, node_test_1.default)('configuration-governance controller saveFeatureFlag route has POST metadata', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const method = Reflect.getMetadata('method', ConfigurationGovernanceController.prototype.saveFeatureFlag);
    const path = Reflect.getMetadata('path', ConfigurationGovernanceController.prototype.saveFeatureFlag);
    strict_1.default.equal(method, 1); // POST = 1 in RequestMethod enum
    strict_1.default.equal(path, 'feature-flags');
});
(0, node_test_1.default)('configuration-governance controller getManagementMetadata delegates to service', () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const mockMetadata = {
        module: 'configuration-governance',
        entrypoints: ['getManagementMetadata', 'resolveConfigSnapshot']
    };
    const mockService = {
        getManagementMetadata: () => mockMetadata
    };
    const controller = new ConfigurationGovernanceController(mockService);
    const result = controller.getManagementMetadata();
    strict_1.default.deepStrictEqual(result, mockMetadata);
});
(0, node_test_1.default)('configuration-governance controller getOperationsOverview delegates to service', async () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const mockOverview = {
        totalConfigEntries: 42,
        totalFeatureFlags: 12,
        activeSecrets: 8
    };
    const mockService = {
        getOperationsOverview: () => Promise.resolve(mockOverview)
    };
    const controller = new ConfigurationGovernanceController(mockService);
    const result = await controller.getOperationsOverview();
    strict_1.default.deepStrictEqual(result, mockOverview);
});
(0, node_test_1.default)('configuration-governance controller getSnapshot delegates to service with tenant context', async () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const mockSnapshot = { featureFlags: {}, configEntries: {} };
    const mockService = {
        resolveConfigSnapshot: (_ctx) => Promise.resolve(mockSnapshot)
    };
    const controller = new ConfigurationGovernanceController(mockService);
    const query = {
        tenantId: 't-cfg-1',
        brandId: 'b-cfg-1',
        storeId: 's-cfg-1',
        marketCode: 'zh-cn'
    };
    const result = await controller.getSnapshot(query);
    strict_1.default.deepStrictEqual(result, mockSnapshot);
});
(0, node_test_1.default)('configuration-governance controller saveFeatureFlag delegates to service', async () => {
    const { ConfigurationGovernanceController } = require('./configuration-governance.controller');
    const mockResult = { flagKey: 'new-checkout-flow', status: 'ENABLED' };
    const mockService = {
        saveFeatureFlag: (_body) => Promise.resolve(mockResult)
    };
    const controller = new ConfigurationGovernanceController(mockService);
    const body = {
        flagKey: 'new-checkout-flow',
        status: 'ENABLED',
        flagLabel: 'New Checkout Flow',
        tenantId: 't-cfg-1'
    };
    const result = await controller.saveFeatureFlag(body);
    strict_1.default.deepStrictEqual(result, mockResult);
});
//# sourceMappingURL=configuration-governance.controller.test.js.map