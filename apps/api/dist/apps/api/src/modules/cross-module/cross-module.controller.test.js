"use strict";
/**
 * 🐜 自动: [cross-module] [D] controller spec 补全
 *
 * 补全内容：
 * - 正例（保留原测试）
 * - 反例（不存在链路的查询、无效状态）
 * - 边界测试（空链路、全 verified、全 broken 状态、entity 纯函数）
 *
 * 覆盖 entity 函数：
 * - toValidationSummary: 各种状态组合
 * - isAllVerified: 边界情况
 * - hasBrokenChain: 正反例
 */
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
const cross_module_controller_1 = require("./cross-module.controller");
const cross_module_service_1 = require("./cross-module.service");
const cross_module_entity_1 = require("./cross-module.entity");
function createController(overrides) {
    const service = overrides;
    return new cross_module_controller_1.CrossModuleController(service ?? new cross_module_service_1.CrossModuleService());
}
// ── 元数据测试 ──
(0, node_test_1.default)('cross-module controller path metadata is set', () => {
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController);
    strict_1.default.equal(path, 'cross-module');
});
(0, node_test_1.default)('getChainStatus route has GET metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.getChainStatus);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.getChainStatus);
    strict_1.default.equal(method, 0); // GET = 0
    strict_1.default.equal(path, 'chain-status');
});
(0, node_test_1.default)('getSummary route has GET metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.getSummary);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.getSummary);
    strict_1.default.equal(method, 0); // GET = 0
    strict_1.default.equal(path, 'summary');
});
(0, node_test_1.default)('validate route has POST metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.validate);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.validate);
    strict_1.default.equal(method, 1); // POST = 1
    strict_1.default.equal(path, 'validate');
});
(0, node_test_1.default)('reset route has POST metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.resetAll);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.resetAll);
    strict_1.default.equal(method, 1); // POST = 1
    strict_1.default.equal(path, 'reset');
});
(0, node_test_1.default)('all-verified route has GET metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.getAllVerified);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.getAllVerified);
    strict_1.default.equal(method, 0); // GET = 0
    strict_1.default.equal(path, 'all-verified');
});
(0, node_test_1.default)('has-broken route has GET metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.getHasBroken);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.getHasBroken);
    strict_1.default.equal(method, 0); // GET = 0
    strict_1.default.equal(path, 'has-broken');
});
(0, node_test_1.default)('validate/:chainName route has POST metadata', () => {
    const method = Reflect.getMetadata('method', cross_module_controller_1.CrossModuleController.prototype.validateChain);
    const path = Reflect.getMetadata('path', cross_module_controller_1.CrossModuleController.prototype.validateChain);
    strict_1.default.equal(method, 1); // POST = 1
    strict_1.default.equal(path, 'validate/:chainName');
});
// ── 正例: getChainStatus() ──
(0, node_test_1.describe)('getChainStatus() 正例', () => {
    (0, node_test_1.default)('returns 4 chains', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.chains.length, 4);
    });
    (0, node_test_1.default)('returns total = 4', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
    });
    (0, node_test_1.default)('runtime is cross-module-e2e', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.runtime, 'cross-module-e2e');
    });
    (0, node_test_1.default)('each chain has status "defined"', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        for (const chain of result.chains) {
            strict_1.default.equal(chain.status, 'defined');
        }
    });
    (0, node_test_1.default)('admin-to-consumer chain covers 6 modules', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const chain = result.chains.find(c => c.name === 'admin-to-consumer');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules.length, 6);
    });
    (0, node_test_1.default)('admin-to-consumer 包含 tenant, portal, market', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const chain = result.chains.find(c => c.name === 'admin-to-consumer');
        strict_1.default.ok(chain);
        strict_1.default.ok(chain.modules.includes('tenant'));
        strict_1.default.ok(chain.modules.includes('portal'));
        strict_1.default.ok(chain.modules.includes('market'));
    });
    (0, node_test_1.default)('sdk-to-api chain covers 4 modules', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const chain = result.chains.find(c => c.name === 'sdk-to-api');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules.length, 4);
    });
    (0, node_test_1.default)('governance-chain covers 5 modules', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const chain = result.chains.find(c => c.name === 'governance-chain');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules.length, 5);
    });
    (0, node_test_1.default)('multi-client-consistency chain covers 5 modules', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const chain = result.chains.find(c => c.name === 'multi-client-consistency');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules.length, 5);
    });
    (0, node_test_1.default)('每次调用返回结果是幂等的', () => {
        const ctrl = createController();
        const r1 = ctrl.getChainStatus();
        const r2 = ctrl.getChainStatus();
        strict_1.default.deepEqual(r1, r2);
    });
    (0, node_test_1.default)('每个 chain 的 modules 数组非空', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        for (const chain of result.chains) {
            strict_1.default.ok(chain.modules.length > 0, `chain ${chain.name} should have modules`);
        }
    });
});
// ── 反例: getChainStatus() ──
(0, node_test_1.describe)('getChainStatus() 反例', () => {
    (0, node_test_1.default)('不存在的链路名 find 返回 undefined', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const notExist = result.chains.find(c => c.name === 'ghost-chain');
        strict_1.default.equal(notExist, undefined);
    });
    (0, node_test_1.default)('链路列表只包含 known 链路', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        const knownNames = ['admin-to-consumer', 'sdk-to-api', 'governance-chain', 'multi-client-consistency'];
        for (const chain of result.chains) {
            strict_1.default.ok(knownNames.includes(chain.name), `unexpected chain: ${chain.name}`);
        }
    });
    (0, node_test_1.default)('channels 总数始终等于 total', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.chains.length, result.total);
    });
    (0, node_test_1.default)('runtime 不是其他值', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        strict_1.default.notEqual(result.runtime, 'production');
        strict_1.default.equal(result.runtime, 'cross-module-e2e');
    });
});
// ── 边界测试: getChainStatus() ──
(0, node_test_1.describe)('getChainStatus() 边界', () => {
    (0, node_test_1.default)('Chains 数量始终等于 4', () => {
        const ctrl = createController();
        for (let i = 0; i < 100; i++) {
            const result = ctrl.getChainStatus();
            strict_1.default.equal(result.chains.length, 4);
        }
    });
    (0, node_test_1.default)('每个链路模块名称都是字符串', () => {
        const ctrl = createController();
        const result = ctrl.getChainStatus();
        for (const chain of result.chains) {
            for (const mod of chain.modules) {
                strict_1.default.equal(typeof mod, 'string');
                strict_1.default.ok(mod.length > 0);
            }
        }
    });
});
// ── Entity 纯函数正例 ──
(0, node_test_1.describe)('toValidationSummary() 正例', () => {
    const sampleChains = [
        { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Defined },
        { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Validating },
        { name: 'c', description: '', modules: ['m3'], status: cross_module_entity_1.ChainStatus.Verified },
        { name: 'd', description: '', modules: ['m4'], status: cross_module_entity_1.ChainStatus.Broken },
    ];
    (0, node_test_1.default)('返回正确的 total', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)(sampleChains);
        strict_1.default.equal(summary.total, 4);
    });
    (0, node_test_1.default)('返回正确的 defined 计数', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)(sampleChains);
        strict_1.default.equal(summary.defined, 1);
    });
    (0, node_test_1.default)('返回正确的 validating 计数', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)(sampleChains);
        strict_1.default.equal(summary.validating, 1);
    });
    (0, node_test_1.default)('返回正确的 verified 计数', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)(sampleChains);
        strict_1.default.equal(summary.verified, 1);
    });
    (0, node_test_1.default)('返回正确的 broken 计数', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)(sampleChains);
        strict_1.default.equal(summary.broken, 1);
    });
    (0, node_test_1.default)('全部 defined 场景', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Defined },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Defined },
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.deepEqual(summary, { total: 2, defined: 2, validating: 0, verified: 0, broken: 0 });
    });
    (0, node_test_1.default)('全部 verified 场景', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Verified },
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.deepEqual(summary, { total: 2, defined: 0, validating: 0, verified: 2, broken: 0 });
    });
    (0, node_test_1.default)('混合状态场景', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Broken },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Broken },
            { name: 'c', description: '', modules: ['m3'], status: cross_module_entity_1.ChainStatus.Validating },
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.deepEqual(summary, { total: 3, defined: 0, validating: 1, verified: 0, broken: 2 });
    });
});
// ── Entity 纯函数边界 ──
(0, node_test_1.describe)('toValidationSummary() 边界', () => {
    (0, node_test_1.default)('空数组返回全零', () => {
        const summary = (0, cross_module_entity_1.toValidationSummary)([]);
        strict_1.default.deepEqual(summary, { total: 0, defined: 0, validating: 0, verified: 0, broken: 0 });
    });
    (0, node_test_1.default)('单项 defined', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Defined },
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.deepEqual(summary, { total: 1, defined: 1, validating: 0, verified: 0, broken: 0 });
    });
    (0, node_test_1.default)('单项 broken', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Broken },
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.deepEqual(summary, { total: 1, defined: 0, validating: 0, verified: 0, broken: 1 });
    });
    (0, node_test_1.default)('多项同一状态', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Validating },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Validating },
            { name: 'c', description: '', modules: ['m3'], status: cross_module_entity_1.ChainStatus.Validating },
        ];
        const summary = (0, cross_module_entity_1.toValidationSummary)(chains);
        strict_1.default.deepEqual(summary, { total: 3, defined: 0, validating: 3, verified: 0, broken: 0 });
    });
});
// ── isAllVerified() ──
(0, node_test_1.describe)('isAllVerified() 正例', () => {
    (0, node_test_1.default)('全部 verified 返回 true', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Verified },
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), true);
    });
    (0, node_test_1.default)('有一个 broken 返回 false', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Broken },
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), false);
    });
    (0, node_test_1.default)('有一个 defined 返回 false', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Defined },
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), false);
    });
});
// ── isAllVerified() 边界 ──
(0, node_test_1.describe)('isAllVerified() 边界', () => {
    (0, node_test_1.default)('空数组返回 false', () => {
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)([]), false);
    });
    (0, node_test_1.default)('单项 verified 返回 true', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Verified },
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), true);
    });
    (0, node_test_1.default)('全部 broken 返回 false', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Broken },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Broken },
        ];
        strict_1.default.equal((0, cross_module_entity_1.isAllVerified)(chains), false);
    });
});
// ── hasBrokenChain() ──
(0, node_test_1.describe)('hasBrokenChain() 正例', () => {
    (0, node_test_1.default)('有 broken 时返回 true', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Verified },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Broken },
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), true);
    });
    (0, node_test_1.default)('全部 broken 返回 true', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Broken },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Broken },
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), true);
    });
    (0, node_test_1.default)('无 broken 返回 false', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Defined },
            { name: 'b', description: '', modules: ['m2'], status: cross_module_entity_1.ChainStatus.Verified },
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), false);
    });
});
// ── hasBrokenChain() 边界 ──
(0, node_test_1.describe)('hasBrokenChain() 边界', () => {
    (0, node_test_1.default)('空数组返回 false', () => {
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)([]), false);
    });
    (0, node_test_1.default)('单项 broken 返回 true', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Broken },
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), true);
    });
    (0, node_test_1.default)('单项 defined 返回 false', () => {
        const chains = [
            { name: 'a', description: '', modules: ['m1'], status: cross_module_entity_1.ChainStatus.Defined },
        ];
        strict_1.default.equal((0, cross_module_entity_1.hasBrokenChain)(chains), false);
    });
});
// ── ChainStatus 枚举 ──
(0, node_test_1.describe)('ChainStatus 枚举', () => {
    (0, node_test_1.default)('包含四种状态', () => {
        strict_1.default.deepEqual(Object.values(cross_module_entity_1.ChainStatus), ['defined', 'validating', 'verified', 'broken']);
    });
    (0, node_test_1.default)('Defined 值为 "defined"', () => {
        strict_1.default.equal(cross_module_entity_1.ChainStatus.Defined, 'defined');
    });
    (0, node_test_1.default)('Broken 值为 "broken"', () => {
        strict_1.default.equal(cross_module_entity_1.ChainStatus.Broken, 'broken');
    });
});
// ── CrossModuleChain 类型构造 ──
(0, node_test_1.describe)('CrossModuleChain 构造', () => {
    (0, node_test_1.default)('完整的链路对象构造成功', () => {
        const chain = {
            name: 'test-chain',
            description: '测试链路',
            modules: ['mod-a', 'mod-b'],
            status: cross_module_entity_1.ChainStatus.Defined,
            lastVerifiedAt: '2026-06-23T06:00:00Z',
            brokenNodes: ['mod-a'],
        };
        strict_1.default.equal(chain.name, 'test-chain');
        strict_1.default.equal(chain.modules.length, 2);
        strict_1.default.equal(chain.status, cross_module_entity_1.ChainStatus.Defined);
        strict_1.default.equal(chain.lastVerifiedAt, '2026-06-23T06:00:00Z');
        strict_1.default.ok(chain.brokenNodes?.includes('mod-a'));
    });
    (0, node_test_1.default)('最小的链路对象（无可选字段）构造成功', () => {
        const chain = {
            name: 'minimal',
            description: '',
            modules: ['only'],
            status: cross_module_entity_1.ChainStatus.Defined,
        };
        strict_1.default.equal(chain.name, 'minimal');
        strict_1.default.equal(chain.lastVerifiedAt, undefined);
        strict_1.default.equal(chain.brokenNodes, undefined);
    });
});
// ── 新增 endpoint 测试 ──
(0, node_test_1.describe)('getSummary() 正例', () => {
    (0, node_test_1.default)('返回 summary 对象含 total/defined/verified/broken', () => {
        const ctrl = createController();
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.total, 4);
        strict_1.default.equal(summary.defined, 4);
        strict_1.default.equal(summary.validating, 0);
        strict_1.default.equal(summary.verified, 0);
        strict_1.default.equal(summary.broken, 0);
    });
});
(0, node_test_1.describe)('validate() 正例', () => {
    (0, node_test_1.default)('validate 全部链路返回 4 条结果', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({});
        strict_1.default.equal(results.length, 4);
        for (const r of results) {
            strict_1.default.equal(r.passed, true);
            strict_1.default.ok(r.stages.length > 0);
            strict_1.default.ok(r.chainName);
            strict_1.default.ok(r.executedAt);
            strict_1.default.ok(r.durationMs >= 0);
        }
    });
    (0, node_test_1.default)('validate 指定链路名只验证该链路', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['sdk-to-api'] });
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].chainName, 'sdk-to-api');
    });
    (0, node_test_1.default)('validate 指定多链路', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['sdk-to-api', 'governance-chain'] });
        strict_1.default.equal(results.length, 2);
    });
});
(0, node_test_1.describe)('validateChain() 正例', () => {
    (0, node_test_1.default)('validate 单条链路返回结果', async () => {
        const ctrl = createController();
        const result = await ctrl.validateChain('admin-to-consumer', {});
        strict_1.default.ok(result);
        strict_1.default.equal(result.chainName, 'admin-to-consumer');
        strict_1.default.equal(result.passed, true);
    });
    (0, node_test_1.default)('validate 不存在的链路返回 null', async () => {
        const ctrl = createController();
        const result = await ctrl.validateChain('nonexistent', {});
        strict_1.default.equal(result, null);
    });
});
(0, node_test_1.describe)('getAllVerified() 测试', () => {
    (0, node_test_1.default)('初始状态返回 false（链路由 defined 非 verified）', () => {
        const ctrl = createController();
        const result = ctrl.getAllVerified();
        strict_1.default.equal(result.allVerified, false);
        strict_1.default.ok(result.checkedAt);
    });
    (0, node_test_1.default)('验证后返回 true（simulate 全部通过，链路由变为 verified）', async () => {
        const ctrl = createController();
        await ctrl.validate({});
        const result = ctrl.getAllVerified();
        strict_1.default.equal(result.allVerified, true);
    });
});
(0, node_test_1.describe)('getHasBroken() 测试', () => {
    (0, node_test_1.default)('初始状态无 broken', () => {
        const ctrl = createController();
        const result = ctrl.getHasBroken();
        strict_1.default.equal(result.hasBroken, false);
    });
    (0, node_test_1.default)('验证后仍无 broken（simulate 全通过）', async () => {
        const ctrl = createController();
        await ctrl.validate({});
        const result = ctrl.getHasBroken();
        strict_1.default.equal(result.hasBroken, false);
    });
});
(0, node_test_1.describe)('resetAll() 测试', () => {
    (0, node_test_1.default)('reset 后返回 reset:true', () => {
        const ctrl = createController();
        const result = ctrl.resetAll();
        strict_1.default.equal(result.reset, true);
        strict_1.default.ok(result.resetAt);
    });
    (0, node_test_1.default)('reset 后链路回到 defined 状态', async () => {
        const ctrl = createController();
        await ctrl.validate({});
        ctrl.resetAll();
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.defined, 4);
        strict_1.default.equal(summary.verified, 0);
        strict_1.default.equal(summary.broken, 0);
    });
    (0, node_test_1.default)('多次 reset 幂等', () => {
        const ctrl = createController();
        const r1 = ctrl.resetAll();
        const r2 = ctrl.resetAll();
        // 两次 reset 结果一致
        strict_1.default.equal(r1.reset, true);
        strict_1.default.equal(r2.reset, true);
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.defined, 4);
    });
});
// ── validate 反例测试 ──
(0, node_test_1.describe)('validate() 反例', () => {
    (0, node_test_1.default)('validate 不存在的链路名返回空结果', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['ghost-chain', 'phantom-link'] });
        strict_1.default.equal(results.length, 0);
    });
    (0, node_test_1.default)('validate 空 chainNames 数组返回空（与 undefined 不同）', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: [] });
        // 空数组表示不匹配任何链路，返回空结果
        strict_1.default.equal(results.length, 0);
    });
    (0, node_test_1.default)('validate 不存在和存在混合只验证存在的', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['sdk-to-api', 'nonexistent'] });
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].chainName, 'sdk-to-api');
    });
    (0, node_test_1.default)('validate 带 tenantId/storeId 上下文', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({
            chainNames: ['admin-to-consumer'],
            tenantId: 't-context',
            storeId: 's-context',
            marketCode: 'JP'
        });
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].chainName, 'admin-to-consumer');
        strict_1.default.equal(results[0].passed, true);
    });
    (0, node_test_1.default)('validate 后 summary 全部为 verified', async () => {
        const ctrl = createController();
        await ctrl.validate({});
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.verified, 4);
        strict_1.default.equal(summary.defined, 0);
        strict_1.default.equal(summary.broken, 0);
    });
});
// ── validate 边界测试 ──
(0, node_test_1.describe)('validate() 边界', () => {
    (0, node_test_1.default)('验证结果 stages 数量 = modules.length - 1', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['sdk-to-api'] });
        // sdk-to-api 有 4 个模块 → 3 stages
        strict_1.default.equal(results[0].stages.length, 3);
    });
    (0, node_test_1.default)('governance-chain stages 数量 = 4', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['governance-chain'] });
        // governance-chain 有 5 个模块 → 4 stages
        strict_1.default.equal(results[0].stages.length, 4);
    });
    (0, node_test_1.default)('multi-client-consistency stages 数量 = 4', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['multi-client-consistency'] });
        strict_1.default.equal(results[0].stages.length, 4);
    });
    (0, node_test_1.default)('admin-to-consumer stages 数量 = 5', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['admin-to-consumer'] });
        strict_1.default.equal(results[0].stages.length, 5);
    });
    (0, node_test_1.default)('验证后链路 lastVerifiedAt 已设置', async () => {
        const ctrl = createController();
        const before = ctrl.getChainStatus();
        for (const c of before.chains) {
            strict_1.default.equal(c.lastVerifiedAt, undefined);
        }
        await ctrl.validate({});
        const after = ctrl.getChainStatus();
        for (const c of after.chains) {
            strict_1.default.ok(c.lastVerifiedAt);
            strict_1.default.ok(new Date(c.lastVerifiedAt).getTime() > 0);
        }
    });
    (0, node_test_1.default)('验证后 brokenNodes 为 undefined（全通过）', async () => {
        const ctrl = createController();
        await ctrl.validate({});
        const status = ctrl.getChainStatus();
        for (const c of status.chains) {
            strict_1.default.equal(c.brokenNodes, undefined);
        }
    });
    (0, node_test_1.default)('validate 全部链路由当前返回 passed=true', async () => {
        const ctrl = createController();
        const results = await ctrl.validate({ chainNames: ['admin-to-consumer', 'sdk-to-api', 'governance-chain', 'multi-client-consistency'] });
        strict_1.default.equal(results.length, 4);
        for (const r of results) {
            strict_1.default.equal(r.passed, true);
        }
    });
});
// ── validateChain 反例和边界 ──
(0, node_test_1.describe)('validateChain() 反例与边界', () => {
    (0, node_test_1.default)('空字符串链路名返回 null', async () => {
        const ctrl = createController();
        const result = await ctrl.validateChain('', {});
        strict_1.default.equal(result, null);
    });
    (0, node_test_1.default)('带上下文传参不影响空结果', async () => {
        const ctrl = createController();
        const result = await ctrl.validateChain('ghost', { tenantId: 't-x', storeId: 's-x' });
        strict_1.default.equal(result, null);
    });
    (0, node_test_1.default)('validateChain 成功时返回 stage 详情', async () => {
        const ctrl = createController();
        const result = await ctrl.validateChain('sdk-to-api', {});
        strict_1.default.ok(result);
        strict_1.default.equal(result.chainName, 'sdk-to-api');
        strict_1.default.ok(result.stages.length >= 1);
        // 每个 stage 含必要字段
        for (const stage of result.stages) {
            strict_1.default.ok(stage.stage);
            strict_1.default.ok(stage.from);
            strict_1.default.ok(stage.to);
            strict_1.default.equal(stage.passed, true);
            strict_1.default.ok(typeof stage.durationMs === 'number');
        }
    });
});
// ── summary/getAllVerified/getHasBroken 组合 ──
(0, node_test_1.describe)('状态流转组合校验', () => {
    (0, node_test_1.default)('初始 → validate → reset 闭环', async () => {
        const ctrl = createController();
        // 初始
        strict_1.default.equal(ctrl.getAllVerified().allVerified, false);
        strict_1.default.equal(ctrl.getHasBroken().hasBroken, false);
        // validate
        await ctrl.validate({});
        strict_1.default.equal(ctrl.getAllVerified().allVerified, true);
        strict_1.default.equal(ctrl.getHasBroken().hasBroken, false);
        // reset
        ctrl.resetAll();
        strict_1.default.equal(ctrl.getAllVerified().allVerified, false);
        strict_1.default.equal(ctrl.getHasBroken().hasBroken, false);
    });
    (0, node_test_1.default)('多次验证后单链路验证其他保持状态', async () => {
        const ctrl = createController();
        // 先验证 sdk-to-api
        await ctrl.validate({ chainNames: ['sdk-to-api'] });
        let chains = ctrl.getChainStatus().chains;
        const sdk = chains.find(c => c.name === 'sdk-to-api');
        const gov = chains.find(c => c.name === 'governance-chain');
        strict_1.default.equal(sdk.status, 'verified');
        strict_1.default.equal(gov.status, 'defined');
        // 再验证全部
        await ctrl.validate({});
        chains = ctrl.getChainStatus().chains;
        for (const c of chains) {
            strict_1.default.equal(c.status, 'verified');
        }
    });
    (0, node_test_1.default)('reset 清除 brokenNodes 和 lastVerifiedAt', async () => {
        const ctrl = createController();
        await ctrl.validate({});
        ctrl.resetAll();
        const chains = ctrl.getChainStatus().chains;
        for (const c of chains) {
            strict_1.default.equal(c.lastVerifiedAt, undefined);
            strict_1.default.equal(c.brokenNodes, undefined);
            strict_1.default.equal(c.status, 'defined');
        }
    });
});
//# sourceMappingURL=cross-module.controller.test.js.map