"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const bootstrap_contract_1 = require("./bootstrap.contract");
(0, node_test_1.default)('contract mapper: bootstrap foundation metadata normalizes empty dependency summary', () => {
    strict_1.default.deepEqual((0, bootstrap_contract_1.toBootstrapFoundationMetadata)(undefined), {
        foundationDependencies: [],
        foundationContracts: []
    });
});
(0, node_test_1.default)('contract mapper: regional login policy is explicit contract object', () => {
    strict_1.default.deepEqual((0, bootstrap_contract_1.toRegionalLoginPolicyContract)('/cn-mainland/tenant-demo/login', true), {
        defaultLoginPath: '/cn-mainland/tenant-demo/login',
        ssoEnabled: true
    });
});
//# sourceMappingURL=bootstrap.contract.test.js.map