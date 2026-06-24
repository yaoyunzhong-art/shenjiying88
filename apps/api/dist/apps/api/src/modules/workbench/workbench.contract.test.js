"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const bootstrap_fixtures_1 = require("../../testing/bootstrap-fixtures");
const workbench_contract_1 = require("./workbench.contract");
(0, node_test_1.default)('contract mapper: workbench contracts normalize marketCodes and tenant context', () => {
    const workbench = (0, workbench_contract_1.toRoleWorkbenchContract)({
        role: 'GUIDE',
        channel: 'PAD',
        title: '导购工作台',
        description: 'demo',
        navItems: [{ key: 'crm', label: '会员接待', href: '/workbench/guide', description: '画像、标签、推荐和回访' }]
    });
    const tenantContext = (0, workbench_contract_1.toTenantContextContract)((0, bootstrap_fixtures_1.createMinimalTenantContextFixture)());
    strict_1.default.deepEqual(workbench.marketCodes, []);
    strict_1.default.deepEqual(tenantContext, { tenantId: 'tenant-demo' });
});
(0, node_test_1.default)('fixture: supported clients source stays stable', () => {
    strict_1.default.deepEqual((0, bootstrap_fixtures_1.createSupportedClientsFixture)(), ['PC', 'PAD', 'H5', 'MINIAPP', 'APP']);
});
//# sourceMappingURL=workbench.contract.test.js.map