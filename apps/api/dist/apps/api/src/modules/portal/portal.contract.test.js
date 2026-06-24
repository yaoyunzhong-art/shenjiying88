"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const bootstrap_fixtures_1 = require("../../testing/bootstrap-fixtures");
const portal_contract_1 = require("./portal.contract");
(0, node_test_1.default)('contract mapper: portal contracts preserve provided primaryDomain', () => {
    const tenantPortal = (0, portal_contract_1.toTobPortalContract)((0, bootstrap_fixtures_1.createTenantPortalFixture)());
    const storePortal = (0, portal_contract_1.toStorePortalContract)((0, bootstrap_fixtures_1.createStorePortalFixture)());
    strict_1.default.equal(tenantPortal.primaryDomain, 'tenant-demo.cn-mainland.b2b.local');
    strict_1.default.equal(storePortal.primaryDomain, 'store-001.brand-demo.tenant-demo.cn-mainland.local');
});
(0, node_test_1.default)('contract mapper: portal contracts backfill missing primaryDomain', () => {
    const storePortal = (0, portal_contract_1.toStorePortalContract)({
        ...(0, bootstrap_fixtures_1.createStorePortalFixture)(),
        primaryDomain: undefined
    });
    strict_1.default.equal(storePortal.primaryDomain, 'store-001.cn-mainland.local');
});
//# sourceMappingURL=portal.contract.test.js.map