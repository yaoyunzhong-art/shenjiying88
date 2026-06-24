"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const market_contract_1 = require("./market.contract");
(0, node_test_1.default)('contract mapper: regional override omits undefined nested keys', () => {
    const contract = (0, market_contract_1.toRegionalConfigOverrideContract)({
        scopeType: 'TENANT',
        scopeCode: 'tenant-demo',
        inheritanceMode: 'TENANT_DEFAULT',
        marketCode: 'cn-mainland',
        email: {
            fromName: 'tenant-demo HQ'
        }
    });
    strict_1.default.deepEqual(contract, {
        scopeType: 'TENANT',
        scopeCode: 'tenant-demo',
        inheritanceMode: 'TENANT_DEFAULT',
        marketCode: 'cn-mainland',
        email: {
            fromName: 'tenant-demo HQ'
        }
    });
});
//# sourceMappingURL=market.contract.test.js.map