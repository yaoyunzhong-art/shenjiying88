"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contract_assertions_1 = require("../../testing/contract-assertions");
const bootstrap_fixtures_1 = require("../../testing/bootstrap-fixtures");
const portal_service_1 = require("./portal.service");
(0, node_test_1.default)('contract: portal bootstrap shape', () => {
    const marketService = {
        getMergedProfile: () => (0, bootstrap_fixtures_1.createMarketProfileFixture)(),
        getOverrides: () => (0, bootstrap_fixtures_1.createRegionalOverridesFixture)()
    };
    const foundationService = {
        getDependencySummary: () => (0, bootstrap_fixtures_1.createContractTestFoundationDependencySummary)()
    };
    const service = new portal_service_1.PortalService(marketService, foundationService);
    const bootstrap = service.getBootstrap({ tenantId: 'tenant-demo' });
    (0, contract_assertions_1.assertExactKeys)(bootstrap, [
        'tenantPortal',
        'brandPortal',
        'storePortal',
        'marketProfile',
        'regionalOverrides',
        'foundationDependencies',
        'foundationContracts'
    ]);
    strict_1.default.equal(typeof bootstrap.tenantPortal, 'object');
    strict_1.default.equal(typeof bootstrap.brandPortal, 'object');
    strict_1.default.equal(typeof bootstrap.storePortal, 'object');
    strict_1.default.equal(typeof bootstrap.marketProfile, 'object');
    strict_1.default.equal(Array.isArray(bootstrap.regionalOverrides), true);
    strict_1.default.equal(Array.isArray(bootstrap.foundationDependencies), true);
    strict_1.default.equal(Array.isArray(bootstrap.foundationContracts), true);
    strict_1.default.deepEqual(bootstrap.foundationDependencies, ['identity-access', 'configuration-governance']);
    strict_1.default.deepEqual(bootstrap.foundationContracts, ['contract-a']);
    const tenantOverride = bootstrap.regionalOverrides[0];
    const brandOverride = bootstrap.regionalOverrides[1];
    const storeOverride = bootstrap.regionalOverrides[2];
    (0, contract_assertions_1.assertExactKeys)(tenantOverride, ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'email']);
    (0, contract_assertions_1.assertExactKeys)(tenantOverride.email, ['fromName']);
    (0, contract_assertions_1.assertExactKeys)(brandOverride, ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'social']);
    (0, contract_assertions_1.assertExactKeys)(brandOverride.social, ['primaryPlatforms']);
    (0, contract_assertions_1.assertExactKeys)(storeOverride, ['scopeType', 'scopeCode', 'inheritanceMode', 'marketCode', 'timezone']);
    (0, contract_assertions_1.assertExactKeys)(storeOverride.timezone, ['timezone']);
    (0, contract_assertions_1.assertExactKeys)(bootstrap.tenantPortal, [
        'audience',
        'scopeType',
        'scopeCode',
        'tenantCode',
        'brandCode',
        'marketCode',
        'channel',
        'name',
        'primaryDomain',
        'supportedLanguages',
        'heroTitle',
        'heroSubtitle',
        'solutionTags',
        'loginEntry'
    ]);
    (0, contract_assertions_1.assertExactKeys)(bootstrap.tenantPortal.loginEntry, ['label', 'loginPath', 'ssoEnabled']);
    strict_1.default.equal(typeof bootstrap.tenantPortal.primaryDomain, 'string');
    (0, contract_assertions_1.assertExactKeys)(bootstrap.brandPortal, [
        'audience',
        'scopeType',
        'scopeCode',
        'tenantCode',
        'brandCode',
        'marketCode',
        'channel',
        'name',
        'primaryDomain',
        'supportedLanguages',
        'heroTitle',
        'heroSubtitle',
        'solutionTags',
        'loginEntry'
    ]);
    (0, contract_assertions_1.assertExactKeys)(bootstrap.brandPortal.loginEntry, ['label', 'loginPath', 'ssoEnabled']);
    strict_1.default.equal(typeof bootstrap.brandPortal.primaryDomain, 'string');
    (0, contract_assertions_1.assertExactKeys)(bootstrap.storePortal, [
        'audience',
        'scopeType',
        'scopeCode',
        'tenantCode',
        'brandCode',
        'storeCode',
        'storeName',
        'marketCode',
        'channel',
        'name',
        'primaryDomain',
        'supportedLanguages',
        'supportedSurfaces'
    ]);
    strict_1.default.equal(typeof bootstrap.storePortal.primaryDomain, 'string');
    (0, contract_assertions_1.assertExactKeys)(bootstrap.marketProfile, [
        'marketCode',
        'marketName',
        'countryCode',
        'locale',
        'timezone',
        'currency',
        'tax',
        'network',
        'email',
        'social'
    ]);
    const marketProfileRecord = bootstrap.marketProfile;
    (0, contract_assertions_1.assertExactKeys)(marketProfileRecord.tax, ['taxMode', 'taxRate', 'taxLabel']);
    (0, contract_assertions_1.assertExactKeys)(marketProfileRecord.network, ['networkRegion', 'apiBaseUrl', 'cdnBaseUrl', 'callbackBaseUrl']);
    (0, contract_assertions_1.assertExactKeys)(marketProfileRecord.email, ['provider', 'fromName', 'fromAddress', 'replyTo']);
});
//# sourceMappingURL=portal-bootstrap.contract.test.js.map