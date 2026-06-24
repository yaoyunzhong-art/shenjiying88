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
const bootstrap_entity_1 = require("./bootstrap.entity");
(0, node_test_1.describe)('BootstrapPhase enum', () => {
    (0, node_test_1.default)('has four phases', () => {
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Scaffold, 'scaffold');
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Provision, 'provision');
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Handoff, 'handoff');
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Ready, 'ready');
    });
});
(0, node_test_1.describe)('toBootstrapHealth', () => {
    (0, node_test_1.default)('returns default healthy scaffold state', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)();
        strict_1.default.equal(health.status, 'ok');
        strict_1.default.equal(health.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
        strict_1.default.equal(typeof health.uptime, 'number');
        strict_1.default.ok(health.uptime >= 0);
        strict_1.default.ok(new Date(health.checkedAt).getTime() > 0);
    });
    (0, node_test_1.default)('accepts overrides', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)({ status: 'error', phase: bootstrap_entity_1.BootstrapPhase.Ready });
        strict_1.default.equal(health.status, 'error');
        strict_1.default.equal(health.phase, bootstrap_entity_1.BootstrapPhase.Ready);
    });
    (0, node_test_1.default)('preserves uptime when not overridden', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)({ status: 'degraded' });
        strict_1.default.equal(health.status, 'degraded');
        strict_1.default.equal(health.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
        strict_1.default.ok(health.uptime >= 0);
    });
    (0, node_test_1.default)('satisfies BootstrapHealth interface', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)();
        strict_1.default.equal(typeof health.checkedAt, 'string');
        strict_1.default.equal(health.status, 'ok');
    });
});
(0, node_test_1.describe)('toBootstrapMetadata', () => {
    (0, node_test_1.default)('returns metadata with given tenant context', () => {
        const ctx = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'cn' };
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)(ctx);
        strict_1.default.deepStrictEqual(meta.tenantContext, ctx);
        strict_1.default.deepStrictEqual(meta.foundationDependencies, []);
        strict_1.default.deepStrictEqual(meta.foundationContracts, []);
        strict_1.default.equal(meta.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
        strict_1.default.ok(new Date(meta.generatedAt).getTime() > 0);
    });
    (0, node_test_1.default)('accepts overrides for dependencies', () => {
        const ctx = { tenantId: 't-2' };
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)(ctx, {
            foundationDependencies: ['foundation'],
            foundationContracts: ['handoff-v1'],
            phase: bootstrap_entity_1.BootstrapPhase.Ready
        });
        strict_1.default.deepStrictEqual(meta.foundationDependencies, ['foundation']);
        strict_1.default.deepStrictEqual(meta.foundationContracts, ['handoff-v1']);
        strict_1.default.equal(meta.phase, bootstrap_entity_1.BootstrapPhase.Ready);
    });
    (0, node_test_1.default)('satisfies BootstrapMetadata interface', () => {
        const ctx = { tenantId: 't-3' };
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)(ctx);
        strict_1.default.equal(typeof meta.generatedAt, 'string');
        strict_1.default.equal(meta.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
    });
    (0, node_test_1.default)('handles minimal tenant context', () => {
        const ctx = { tenantId: 'min-t' };
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)(ctx);
        strict_1.default.equal(meta.tenantContext.tenantId, 'min-t');
        strict_1.default.equal(meta.tenantContext.brandId, undefined);
    });
});
(0, node_test_1.describe)('RegionalLoginPolicy type', () => {
    (0, node_test_1.default)('constructs valid policy object', () => {
        const policy = {
            defaultLoginPath: '/login',
            ssoEnabled: true,
            supportedMarkets: ['cn-mainland', 'en-global']
        };
        strict_1.default.equal(policy.defaultLoginPath, '/login');
        strict_1.default.ok(policy.ssoEnabled);
        strict_1.default.deepStrictEqual(policy.supportedMarkets, ['cn-mainland', 'en-global']);
    });
    (0, node_test_1.default)('allows empty supported markets', () => {
        const policy = {
            defaultLoginPath: '/sso',
            ssoEnabled: false,
            supportedMarkets: []
        };
        strict_1.default.equal(policy.defaultLoginPath, '/sso');
        strict_1.default.ok(!policy.ssoEnabled);
        strict_1.default.deepStrictEqual(policy.supportedMarkets, []);
    });
});
(0, node_test_1.describe)('BootstrapConsumerDependency type', () => {
    (0, node_test_1.default)('constructs valid dependency object', () => {
        const dep = {
            consumerName: 'market',
            dependsOn: ['foundation'],
            contracts: ['market-data-contract'],
            responsibility: '输出多市场默认值'
        };
        strict_1.default.equal(dep.consumerName, 'market');
        strict_1.default.deepStrictEqual(dep.dependsOn, ['foundation']);
        strict_1.default.deepStrictEqual(dep.contracts, ['market-data-contract']);
        strict_1.default.equal(dep.responsibility, '输出多市场默认值');
    });
});
//# sourceMappingURL=bootstrap.entity.test.js.map