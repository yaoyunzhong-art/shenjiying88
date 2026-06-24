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
const cross_module_service_1 = require("./cross-module.service");
const cross_module_entity_1 = require("./cross-module.entity");
(0, node_test_1.describe)('CrossModuleService', () => {
    let service;
    (0, node_test_1.beforeEach)(() => {
        service = new cross_module_service_1.CrossModuleService();
        service.resetAll();
    });
    // ── listChains ──
    (0, node_test_1.describe)('listChains', () => {
        (0, node_test_1.default)('lists all 4 chains by default', () => {
            const chains = service.listChains();
            strict_1.default.equal(chains.length, 4);
        });
        (0, node_test_1.default)('filters by chain name', () => {
            const chains = service.listChains({ chainName: 'admin-to-consumer' });
            strict_1.default.equal(chains.length, 1);
            strict_1.default.equal(chains[0].name, 'admin-to-consumer');
        });
        (0, node_test_1.default)('filters by status', () => {
            const chains = service.listChains({ status: cross_module_entity_1.ChainStatus.Defined });
            strict_1.default.equal(chains.length, 4); // all start as Defined
        });
        (0, node_test_1.default)('non-existent chain name returns empty', () => {
            const chains = service.listChains({ chainName: 'non-existent' });
            strict_1.default.equal(chains.length, 0);
        });
        (0, node_test_1.default)('non-matching status returns empty', () => {
            const chains = service.listChains({ status: cross_module_entity_1.ChainStatus.Verified });
            strict_1.default.equal(chains.length, 0); // none start as Verified
        });
    });
    // ── getSummary ──
    (0, node_test_1.describe)('getSummary', () => {
        (0, node_test_1.default)('initial summary has 4 defined', () => {
            const summary = service.getSummary();
            strict_1.default.equal(summary.total, 4);
            strict_1.default.equal(summary.defined, 4);
            strict_1.default.equal(summary.verified, 0);
            strict_1.default.equal(summary.broken, 0);
        });
        (0, node_test_1.default)('summary after validation reflects results', async () => {
            await service.validate(undefined);
            const summary = service.getSummary();
            strict_1.default.equal(summary.verified, 4); // all pass in mock
        });
    });
    // ── validate ──
    (0, node_test_1.describe)('validate', () => {
        (0, node_test_1.default)('validates all chains when no names given', async () => {
            const results = await service.validate(undefined);
            strict_1.default.equal(results.length, 4);
            for (const result of results) {
                strict_1.default.equal(result.passed, true);
            }
        });
        (0, node_test_1.default)('validates specific chain by name', async () => {
            const results = await service.validate(['admin-to-consumer']);
            strict_1.default.equal(results.length, 1);
            strict_1.default.equal(results[0].chainName, 'admin-to-consumer');
            strict_1.default.equal(results[0].passed, true);
        });
        (0, node_test_1.default)('validation updates chain status to verified', async () => {
            await service.validate(['sdk-to-api']);
            const chains = service.listChains({ chainName: 'sdk-to-api' });
            strict_1.default.equal(chains[0].status, cross_module_entity_1.ChainStatus.Verified);
            strict_1.default.ok(chains[0].lastVerifiedAt);
        });
        (0, node_test_1.default)('validation result includes stages', async () => {
            const results = await service.validate(['admin-to-consumer']);
            const chain = results[0];
            // admin-to-consumer has 6 modules, so 5 edges (stages)
            strict_1.default.equal(chain.stages.length, 5);
            strict_1.default.equal(chain.stages[0].from, 'tenant');
            strict_1.default.equal(chain.stages[0].to, 'bootstrap');
            strict_1.default.equal(chain.stages[chain.stages.length - 1].to, 'miniapp');
        });
        (0, node_test_1.default)('sdk-to-api validation has 3 stages', async () => {
            const results = await service.validate(['sdk-to-api']);
            strict_1.default.equal(results[0].stages.length, 3);
        });
        (0, node_test_1.default)('governance-chain validation has 4 stages', async () => {
            const results = await service.validate(['governance-chain']);
            strict_1.default.equal(results[0].stages.length, 4);
        });
        (0, node_test_1.default)('multi-client-consistency validation has 4 stages', async () => {
            const results = await service.validate(['multi-client-consistency']);
            strict_1.default.equal(results[0].stages.length, 4);
        });
        (0, node_test_1.default)('validation uses provided context', async () => {
            const results = await service.validate(['admin-to-consumer'], {
                tenantId: 'tenant-001',
                marketCode: 'default'
            });
            strict_1.default.equal(results[0].passed, true);
        });
        (0, node_test_1.default)('results have executedAt timestamp', async () => {
            const results = await service.validate(['admin-to-consumer']);
            strict_1.default.ok(results[0].executedAt);
        });
        (0, node_test_1.default)('results have durationMs', async () => {
            const results = await service.validate(['admin-to-consumer']);
            strict_1.default.ok(typeof results[0].durationMs === 'number');
            strict_1.default.ok(results[0].durationMs >= 0);
        });
    });
    // ── checkAllVerified ──
    (0, node_test_1.describe)('checkAllVerified', () => {
        (0, node_test_1.default)('initially not all verified', () => {
            strict_1.default.equal(service.checkAllVerified(), false);
        });
        (0, node_test_1.default)('after full validation, all verified', async () => {
            await service.validate(undefined);
            strict_1.default.equal(service.checkAllVerified(), true);
        });
    });
    // ── checkHasBroken ──
    (0, node_test_1.describe)('checkHasBroken', () => {
        (0, node_test_1.default)('initially no broken chains', () => {
            strict_1.default.equal(service.checkHasBroken(), false);
        });
    });
    // ── resetAll ──
    (0, node_test_1.describe)('resetAll', () => {
        (0, node_test_1.default)('resets verified chains back to defined', async () => {
            await service.validate(undefined);
            strict_1.default.equal(service.checkAllVerified(), true);
            service.resetAll();
            strict_1.default.equal(service.checkAllVerified(), false);
            const summary = service.getSummary();
            strict_1.default.equal(summary.defined, 4);
            strict_1.default.equal(summary.verified, 0);
        });
        (0, node_test_1.default)('reset clears lastVerifiedAt', async () => {
            await service.validate(['admin-to-consumer']);
            let chains = service.listChains({ chainName: 'admin-to-consumer' });
            strict_1.default.ok(chains[0].lastVerifiedAt);
            service.resetAll();
            chains = service.listChains({ chainName: 'admin-to-consumer' });
            strict_1.default.equal(chains[0].lastVerifiedAt, undefined);
        });
    });
});
//# sourceMappingURL=cross-module.service.test.js.map