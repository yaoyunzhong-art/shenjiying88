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
const workbench_service_1 = require("./workbench.service");
(0, node_test_1.default)('contract: workbench bootstrap shape', () => {
    const marketService = {
        getMergedProfile: () => (0, bootstrap_fixtures_1.createMarketProfileFixture)()
    };
    const portalService = {
        getBootstrap: () => ({
            tenantPortal: (0, bootstrap_fixtures_1.createTenantPortalFixture)(),
            brandPortal: (0, bootstrap_fixtures_1.createBrandPortalFixture)(),
            storePortal: (0, bootstrap_fixtures_1.createStorePortalFixture)()
        })
    };
    const foundationService = {
        getDependencySummary: () => (0, bootstrap_fixtures_1.createContractTestFoundationDependencySummary)()
    };
    const runtimeGovernanceService = {};
    const service = new workbench_service_1.WorkbenchService(marketService, portalService, foundationService, runtimeGovernanceService);
    const bootstrap = service.getBootstrap((0, bootstrap_fixtures_1.createMinimalTenantContextFixture)());
    (0, contract_assertions_1.assertExactKeys)(bootstrap, [
        'tenantContext',
        'workbenches',
        'storePortals',
        'tenantPortal',
        'brandPortal',
        'marketProfile',
        'regionalLoginPolicies',
        'supportedLocales',
        'supportedClients',
        'foundationDependencies',
        'foundationContracts'
    ]);
    strict_1.default.equal(bootstrap.tenantContext.tenantId, 'tenant-demo');
    strict_1.default.equal(Array.isArray(bootstrap.workbenches), true);
    strict_1.default.equal(Array.isArray(bootstrap.storePortals), true);
    strict_1.default.equal(typeof bootstrap.regionalLoginPolicies.defaultLoginPath, 'string');
    strict_1.default.equal(typeof bootstrap.regionalLoginPolicies.ssoEnabled, 'boolean');
    (0, contract_assertions_1.assertExactKeys)(bootstrap.regionalLoginPolicies, ['defaultLoginPath', 'ssoEnabled']);
    strict_1.default.equal(Array.isArray(bootstrap.supportedLocales), true);
    strict_1.default.equal(Array.isArray(bootstrap.supportedClients), true);
    strict_1.default.equal(Array.isArray(bootstrap.foundationDependencies), true);
    strict_1.default.equal(Array.isArray(bootstrap.foundationContracts), true);
    (0, contract_assertions_1.assertExactKeys)(bootstrap.tenantContext, ['tenantId']);
    strict_1.default.equal(bootstrap.tenantContext.tenantId, 'tenant-demo');
    strict_1.default.deepEqual(bootstrap.supportedLocales, ['zh-CN']);
    strict_1.default.deepEqual(bootstrap.supportedClients, (0, bootstrap_fixtures_1.createSupportedClientsFixture)());
    strict_1.default.deepEqual(bootstrap.foundationDependencies, ['identity-access', 'configuration-governance']);
    strict_1.default.deepEqual(bootstrap.foundationContracts, ['contract-a']);
    strict_1.default.deepEqual(bootstrap.regionalLoginPolicies, {
        defaultLoginPath: '/cn-mainland/tenant-demo/login',
        ssoEnabled: true
    });
    strict_1.default.equal(bootstrap.workbenches.length, 10);
    strict_1.default.deepEqual(bootstrap.workbenches.map((workbench) => workbench.role), [
        'SUPER_ADMIN',
        'TENANT_ADMIN',
        'BRAND_MANAGER',
        'STORE_MANAGER',
        'GUIDE',
        'CASHIER',
        'OPERATIONS',
        'FINANCE',
        'WAREHOUSE',
        'COACH'
    ]);
    for (const workbench of bootstrap.workbenches) {
        (0, contract_assertions_1.assertExactKeys)(workbench, ['role', 'channel', 'title', 'description', 'marketCodes', 'navItems']);
        strict_1.default.equal(Array.isArray(workbench.marketCodes), true);
        strict_1.default.equal(Array.isArray(workbench.navItems), true);
        strict_1.default.equal(workbench.navItems.length > 0, true);
        (0, contract_assertions_1.assertExactKeys)(workbench.navItems[0], ['key', 'label', 'href', 'description']);
    }
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
//# sourceMappingURL=workbench-bootstrap.contract.test.js.map