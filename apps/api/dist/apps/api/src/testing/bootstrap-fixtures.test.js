"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const bootstrap_fixtures_1 = require("./bootstrap-fixtures");
(0, node_test_1.default)('fixture: foundation dependency summaries preserve consumer-specific contract names', () => {
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createContractTestFoundationDependencySummary)(), {
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['contract-a']
    });
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createE2EFoundationDependencySummary)(), {
        dependsOn: ['identity-access', 'configuration-governance'],
        handoffContracts: ['@m5/types']
    });
});
(0, node_test_1.default)('fixture: market and portal fixtures remain aligned to bootstrap samples', () => {
    strict_1.default.equal((0, bootstrap_fixtures_1.createMarketProfileFixture)().marketCode, 'cn-mainland');
    strict_1.default.equal((0, bootstrap_fixtures_1.createMarketProfileFixture)().tax.taxMode, 'PRICES_INCLUDE_TAX');
    strict_1.default.equal((0, bootstrap_fixtures_1.createTenantPortalFixture)().loginEntry.loginPath, '/cn-mainland/tenant-demo/login');
    strict_1.default.equal((0, bootstrap_fixtures_1.createBrandPortalFixture)().scopeType, 'BRAND');
    strict_1.default.equal((0, bootstrap_fixtures_1.createStorePortalFixture)().primaryDomain, 'store-001.brand-demo.tenant-demo.cn-mainland.local');
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createStorePortalFixture)().supportedSurfaces, [
        'OFFICIAL_SITE',
        'H5',
        'MINIAPP',
        'APP',
        'PC_CONSOLE',
        'PAD_CONSOLE'
    ]);
});
(0, node_test_1.default)('fixture: regional override collection remains stable', () => {
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createRegionalOverridesFixture)(), [
        {
            scopeType: 'TENANT',
            scopeCode: 'tenant-demo',
            inheritanceMode: 'TENANT_DEFAULT',
            marketCode: 'cn-mainland',
            email: { fromName: 'tenant-demo HQ' }
        },
        {
            scopeType: 'BRAND',
            scopeCode: 'brand-demo',
            inheritanceMode: 'BRAND_OVERRIDE',
            marketCode: 'cn-mainland',
            social: { primaryPlatforms: ['WECHAT'] }
        },
        {
            scopeType: 'STORE',
            scopeCode: 'store-001',
            inheritanceMode: 'STORE_OVERRIDE',
            marketCode: 'cn-mainland',
            timezone: { timezone: 'Asia/Shanghai' }
        }
    ]);
});
(0, node_test_1.default)('fixture: resolved tenant context and supported clients stay stable', () => {
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createMinimalTenantContextFixture)(), {
        tenantId: 'tenant-demo'
    });
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createResolvedTenantContextFixture)(), {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
    });
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createSupportedClientsFixture)(), ['PC', 'PAD', 'H5', 'MINIAPP', 'APP']);
});
//# sourceMappingURL=bootstrap-fixtures.test.js.map