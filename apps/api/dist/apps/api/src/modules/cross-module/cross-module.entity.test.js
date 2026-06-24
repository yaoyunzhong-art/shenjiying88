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
const cross_module_entity_1 = require("./cross-module.entity");
// ── ChainStatus 枚举 ──
(0, node_test_1.default)('ChainStatus enum has 4 values', () => {
    const values = Object.values(cross_module_entity_1.ChainStatus);
    strict_1.default.equal(values.length, 4);
    strict_1.default.ok(values.includes(cross_module_entity_1.ChainStatus.Defined));
    strict_1.default.ok(values.includes(cross_module_entity_1.ChainStatus.Validating));
    strict_1.default.ok(values.includes(cross_module_entity_1.ChainStatus.Verified));
    strict_1.default.ok(values.includes(cross_module_entity_1.ChainStatus.Broken));
});
// ── toValidationSummary ──
(0, node_test_1.describe)('toValidationSummary', () => {
    (0, node_test_1.default)('empty chains returns all zeros', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)([]);
        strict_1.default.equal(summary.total, 0);
        strict_1.default.equal(summary.defined, 0);
        strict_1.default.equal(summary.validating, 0);
        strict_1.default.equal(summary.verified, 0);
        strict_1.default.equal(summary.broken, 0);
    });
    (0, node_test_1.default)('all defined chains counted correctly', () => {
        const chains = [
            { name: 'c1', description: '', modules: ['a', 'b'], status: cross_module_entity_1.ChainStatus.Defined },
            { name: 'c2', description: '', modules: ['c', 'd'], status: cross_module_entity_1.ChainStatus.Defined }
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.equal(summary.total, 2);
        strict_1.default.equal(summary.defined, 2);
    });
    (0, node_test_1.default)('mixed status chains counted correctly', () => {
        const chains = [
            { name: 'c1', description: '', modules: ['a', 'b'], status: cross_module_entity_1.ChainStatus.Defined },
            { name: 'c2', description: '', modules: ['c', 'd'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'c3', description: '', modules: ['e', 'f'], status: cross_module_entity_1.ChainStatus.Broken },
            { name: 'c4', description: '', modules: ['g', 'h'], status: cross_module_entity_1.ChainStatus.Validating }
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.equal(summary.total, 4);
        strict_1.default.equal(summary.defined, 1);
        strict_1.default.equal(summary.validating, 1);
        strict_1.default.equal(summary.verified, 1);
        strict_1.default.equal(summary.broken, 1);
    });
});
// ── isAllVerified ──
(0, node_test_1.describe)('isAllVerified', () => {
    (0, node_test_1.default)('empty chains is not all verified', () => {
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)([]), false);
    });
    (0, node_test_1.default)('all verified returns true', () => {
        const chains = [
            { name: 'c1', description: '', modules: ['a'], status: cross_module_entity_1.ChainStatus.Verified }
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), true);
    });
    (0, node_test_1.default)('one broken makes it false', () => {
        const chains = [
            { name: 'c1', description: '', modules: ['a'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'c2', description: '', modules: ['b'], status: cross_module_entity_1.ChainStatus.Broken }
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), false);
    });
});
// ── hasBrokenChain ──
(0, node_test_1.describe)('hasBrokenChain', () => {
    (0, node_test_1.default)('empty chains has no broken', () => {
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)([]), false);
    });
    (0, node_test_1.default)('no broken chains returns false', () => {
        const chains = [
            { name: 'c1', description: '', modules: ['a'], status: cross_module_entity_1.ChainStatus.Verified }
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), false);
    });
    (0, node_test_1.default)('one broken chain returns true', () => {
        const chains = [
            { name: 'c1', description: '', modules: ['a'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'c2', description: '', modules: ['b'], status: cross_module_entity_1.ChainStatus.Broken }
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), true);
    });
});
// ── CrossModuleChain 类型使用 ──
(0, node_test_1.describe)('CrossModuleChain type', () => {
    (0, node_test_1.default)('can create chain without optional fields', () => {
        const chain = {
            name: 'test-chain',
            description: 'test',
            modules: ['m1', 'm2'],
            status: cross_module_entity_1.ChainStatus.Defined
        };
        strict_1.default.equal(chain.name, 'test-chain');
        strict_1.default.equal(chain.brokenNodes, undefined);
        strict_1.default.equal(chain.lastVerifiedAt, undefined);
    });
    (0, node_test_1.default)('can create chain with optional fields', () => {
        const chain = {
            name: 'test-chain',
            description: 'test',
            modules: ['m1', 'm2'],
            status: cross_module_entity_1.ChainStatus.Broken,
            lastVerifiedAt: '2025-01-01T00:00:00Z',
            brokenNodes: ['m1 → m2']
        };
        strict_1.default.equal(chain.status, cross_module_entity_1.ChainStatus.Broken);
        strict_1.default.deepEqual(chain.brokenNodes, ['m1 → m2']);
    });
});
//# sourceMappingURL=cross-module.entity.test.js.map