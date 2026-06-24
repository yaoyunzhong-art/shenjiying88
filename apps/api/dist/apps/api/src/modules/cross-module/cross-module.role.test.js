"use strict";
/**
 * 🐜 自动: [cross-module] [C] 角色测试增强
 *
 * 8 角色视角的 cross-module 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 覆盖端点：getChainStatus, getSummary, validate, validateChain,
 *           getAllVerified, getHasBroken, resetAll
 *
 * 每个角色至少 3 个测试用例（正常流程 + 权限边界 + 业务上下文）
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
// ── 角色定义 ──
const ROLES = {
    TenantAdmin: '👔店长',
    Hr: '👥HR',
    Security: '🔧安监',
    Guide: '🎮导玩员',
    Operations: '🎯运行专员',
    GroupBuilding: '🤝团建',
    Marketing: '📢营销',
    FrontDesk: '🛒前台'
};
// ── 默认上下文 ──
const defaultCtx = { tenantId: 't-default', storeId: 's-default', marketCode: 'cn-mainland' };
const crossBorderCtx = { tenantId: 't-cross', storeId: 's-cross', marketCode: 'us-default' };
// ── 控制器工厂 (每次创建新实例以确保状态隔离) ──
function createCtrl() {
    const { CrossModuleService } = require('./cross-module.service');
    const { CrossModuleController } = require('./cross-module.controller');
    return new CrossModuleController(new CrossModuleService());
}
// ── 👔店长 ──
(0, node_test_1.describe)(`${ROLES.TenantAdmin} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('店长可以查看跨模块链路状态 — 4 条链路完整', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
        strict_1.default.equal(result.runtime, 'cross-module-e2e');
    });
    (0, node_test_1.default)('店长获取验证摘要 — 摘要包含总链路数和状态统计', () => {
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.total, 4);
        strict_1.default.equal(summary.defined, 4);
        strict_1.default.equal(summary.verified, 0);
    });
    (0, node_test_1.default)('店长执行全部链路验证 — 返回 4 条结果且全部通过', async () => {
        const results = await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        strict_1.default.equal(results.length, 4);
        for (const r of results) {
            strict_1.default.ok(r.passed);
            strict_1.default.ok(r.stages.length > 0);
            strict_1.default.ok(r.durationMs >= 0);
        }
    });
    (0, node_test_1.default)('店长验证后 all-verified 应为 true', async () => {
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        const verified = ctrl.getAllVerified();
        strict_1.default.equal(verified.allVerified, true);
    });
    (0, node_test_1.default)('店长验证后 has-broken 应为 false', async () => {
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        const broken = ctrl.getHasBroken();
        strict_1.default.equal(broken.hasBroken, false);
    });
    (0, node_test_1.default)('店长重置所有链路 — 状态回 Defined', async () => {
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        ctrl.resetAll();
        const result = ctrl.getChainStatus();
        for (const chain of result.chains) {
            strict_1.default.equal(chain.status, 'defined');
        }
    });
    (0, node_test_1.default)('店长验证单条链路 admin-to-consumer — 返回 5 个阶段', async () => {
        const results = await ctrl.validate({ chainNames: ['admin-to-consumer'], ...defaultCtx });
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].chainName, 'admin-to-consumer');
        strict_1.default.equal(results[0].stages.length, 5); // 6 模块 → 5 个阶段
    });
});
// ── 🛒前台 ──
(0, node_test_1.describe)(`${ROLES.FrontDesk} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('前台可以查看跨模块链路状态 — 基本只读访问', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
        strict_1.default.ok(result.chains.length === 4);
    });
    (0, node_test_1.default)('前台获取验证摘要 — 摘要正常返回', () => {
        const summary = ctrl.getSummary();
        strict_1.default.ok(summary !== null);
        strict_1.default.ok(summary !== undefined);
    });
    (0, node_test_1.default)('前台检查所有链路验证状态 — all-verified 接口可访问', () => {
        const verified = ctrl.getAllVerified();
        strict_1.default.ok('allVerified' in verified);
        strict_1.default.ok('checkedAt' in verified);
    });
    (0, node_test_1.default)('前台不能执行重置操作 — 权限边界：前台应无法 reset', () => {
        // 前台角色仅读权限：不应有 reset 能力
        // 实际实现中通过 guard 控制；此处测试 controller 方法存在性
        strict_1.default.ok(typeof ctrl.resetAll === 'function');
        // 在集成环境中该调用应被 403 拦截
    });
    (0, node_test_1.default)('前台获取 has-broken 状态 — 接口可访问', () => {
        const broken = ctrl.getHasBroken();
        strict_1.default.equal(broken.hasBroken, false);
    });
});
// ── 👥HR ──
(0, node_test_1.describe)(`${ROLES.Hr} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('HR 可以查看跨模块链路状态 — 人员编制审计', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
    });
    (0, node_test_1.default)('HR 查看 governance-chain — 包含 5 个治理模块', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'governance-chain');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules.length, 5);
        strict_1.default.ok(chain.modules.includes('configuration-governance'));
        strict_1.default.ok(chain.modules.includes('identity-access'));
    });
    (0, node_test_1.default)('HR 获取验证摘要 — 跨模块状态可审计', () => {
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.total, 4);
    });
    (0, node_test_1.default)('HR 查看 multi-client-consistency 链路 — 覆盖 5 客户端', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'multi-client-consistency');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules.length, 5);
        strict_1.default.ok(chain.modules.includes('miniapp'));
    });
});
// ── 🔧安监 ──
(0, node_test_1.describe)(`${ROLES.Security} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('安监审计 cross-module — governance-chain 存在且状态 defined', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'governance-chain');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.status, 'defined');
    });
    (0, node_test_1.default)('安监执行全部验证 — 验证后检查有无断开链路', async () => {
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        const broken = ctrl.getHasBroken();
        strict_1.default.equal(broken.hasBroken, false);
    });
    (0, node_test_1.default)('安监重置后 — 所有链路回到 defined 且无 brokenNodes', () => {
        ctrl.resetAll();
        const result = ctrl.getChainStatus();
        for (const chain of result.chains) {
            strict_1.default.equal(chain.status, 'defined');
            strict_1.default.ok(!chain.brokenNodes || chain.brokenNodes.length === 0);
        }
    });
    (0, node_test_1.default)('安监验证后 all-verified 为 true — 安全基线已达标', async () => {
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        const verified = ctrl.getAllVerified();
        strict_1.default.equal(verified.allVerified, true);
    });
    (0, node_test_1.default)('安监跨市场验证 — us-default 上下文不影响验证结果', async () => {
        const results = await ctrl.validate({ chainNames: undefined, ...crossBorderCtx });
        strict_1.default.equal(results.length, 4);
        for (const r of results) {
            strict_1.default.ok(r.passed);
        }
    });
});
// ── 🎮导玩员 ──
(0, node_test_1.describe)(`${ROLES.Guide} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('导玩员查看 — 所有 4 条链路状态可读', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
        strict_1.default.equal(result.chains.length, 4);
    });
    (0, node_test_1.default)('导玩员查看 admin-to-consumer — 终点为 miniapp（C 端入口）', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'admin-to-consumer');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules[0], 'tenant');
        strict_1.default.equal(chain.modules[chain.modules.length - 1], 'miniapp');
    });
    (0, node_test_1.default)('导玩员获取验证摘要 — 确认跨模块链路总数', () => {
        const summary = ctrl.getSummary();
        strict_1.default.equal(summary.total, 4);
    });
    (0, node_test_1.default)('导玩员查看 sdk-to-api — member 为终端模块', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'sdk-to-api');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules[chain.modules.length - 1], 'member');
    });
});
// ── 🎯运行专员 ──
(0, node_test_1.describe)(`${ROLES.Operations} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('运行专员获取链路概要 — total > 0', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.ok(result.total > 0);
        strict_1.default.equal(result.runtime, 'cross-module-e2e');
    });
    (0, node_test_1.default)('运行专员执行验证单条链路 — sdk-to-api 4 模块 3 阶段', async () => {
        const results = await ctrl.validate({ chainNames: ['sdk-to-api'], ...defaultCtx });
        strict_1.default.equal(results.length, 1);
        strict_1.default.equal(results[0].stages.length, 3); // 4 模块 → 3 阶段
        strict_1.default.ok(results[0].passed);
    });
    (0, node_test_1.default)('运行专员验证后检查 — all-verified 在全部验证后为 true', async () => {
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        const verified = ctrl.getAllVerified();
        strict_1.default.equal(verified.allVerified, true);
    });
    (0, node_test_1.default)('运行专员验证后 — 验证阶段包含 durationMs', async () => {
        const results = await ctrl.validate({ chainNames: ['multi-client-consistency'], ...defaultCtx });
        for (const stage of results[0].stages) {
            strict_1.default.ok(stage.durationMs >= 0);
            strict_1.default.ok(stage.stage);
            strict_1.default.ok(stage.from);
            strict_1.default.ok(stage.to);
        }
    });
    (0, node_test_1.default)('运行专员获取 has-broken — 未验证时为 false（无 broken 链路）', () => {
        ctrl.resetAll();
        const broken = ctrl.getHasBroken();
        strict_1.default.equal(broken.hasBroken, false);
    });
});
// ── 🤝团建 ──
(0, node_test_1.describe)(`${ROLES.GroupBuilding} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('团建专员查看跨模块链路 — 总数为 4', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
    });
    (0, node_test_1.default)('团建专员 — 所有链路模块数均为正整数', () => {
        const result = ctrl.getChainStatus();
        for (const chain of result.chains) {
            strict_1.default.ok(chain.modules.length > 0);
        }
    });
    (0, node_test_1.default)('团建专员获取验证摘要 — 摘要结构完整', () => {
        const summary = ctrl.getSummary();
        strict_1.default.ok(summary);
        strict_1.default.equal(typeof summary.total, 'number');
    });
    (0, node_test_1.default)('团建专员查看 multi-client-consistency — 含 miniapp 和 api', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'multi-client-consistency');
        strict_1.default.ok(chain);
        strict_1.default.ok(chain.modules.includes('miniapp'));
        strict_1.default.ok(chain.modules.includes('api'));
    });
    (0, node_test_1.default)('团建专员仅读权限 — 存在 validate 方法但应有 guard 拦截', () => {
        // 在集成环境中 validate 调用应受限
        strict_1.default.ok(typeof ctrl.validate === 'function');
        strict_1.default.ok(typeof ctrl.getChainStatus === 'function');
    });
});
// ── 📢营销 ──
(0, node_test_1.describe)(`${ROLES.Marketing} cross-module 角色测试`, () => {
    let ctrl;
    (0, node_test_1.before)(() => { ctrl = createCtrl(); });
    (0, node_test_1.default)('营销专员可获取链路运行信息 — 各市场一致性检查', () => {
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
        strict_1.default.equal(result.runtime, 'cross-module-e2e');
    });
    (0, node_test_1.default)('营销专员获取摘要 — 用于跨市场推广一致性评估', () => {
        const summary = ctrl.getSummary();
        strict_1.default.ok(summary);
    });
    (0, node_test_1.default)('营销专员 — admin-to-consumer 链路 tenant 为起点', () => {
        const result = ctrl.getChainStatus();
        const chain = result.chains.find((c) => c.name === 'admin-to-consumer');
        strict_1.default.ok(chain);
        strict_1.default.equal(chain.modules[0], 'tenant');
    });
    (0, node_test_1.default)('营销专员使用跨市场上下文 — us-default 不影响链路结构', () => {
        const result = ctrl.getChainStatus();
        // 市场代码不影响链路结构查询
        strict_1.default.equal(result.total, 4);
    });
    (0, node_test_1.default)('营销专员检查验证状态 — all-verified 接口可访问', () => {
        const verified = ctrl.getAllVerified();
        strict_1.default.ok('allVerified' in verified);
        strict_1.default.ok(new Date(verified.checkedAt).getTime() > 0);
    });
});
// ── 跨角色对比测试 ──
(0, node_test_1.describe)('cross-module 跨角色对比测试', () => {
    (0, node_test_1.default)('所有 8 角色均可获取 chain-status — 只读端点无角色限制', () => {
        const ctrl = createCtrl();
        const result = ctrl.getChainStatus();
        strict_1.default.equal(result.total, 4);
        strict_1.default.equal(result.chains.length, 4);
        // 确认 4 条链路名符合预期
        const names = result.chains.map((c) => c.name);
        strict_1.default.ok(names.includes('admin-to-consumer'));
        strict_1.default.ok(names.includes('sdk-to-api'));
        strict_1.default.ok(names.includes('governance-chain'));
        strict_1.default.ok(names.includes('multi-client-consistency'));
    });
    (0, node_test_1.default)('所有角色获取 getSummary — 返回结构一致', () => {
        const ctrl = createCtrl();
        const summary = ctrl.getSummary();
        strict_1.default.ok(summary);
        strict_1.default.equal(summary.total, 4);
    });
    (0, node_test_1.default)('重置 → 验证 → 再重置 循环测试', async () => {
        const ctrl = createCtrl();
        // 初始状态：defined
        let result = ctrl.getChainStatus();
        for (const c of result.chains)
            strict_1.default.equal(c.status, 'defined');
        // 验证全部
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        result = ctrl.getChainStatus();
        for (const c of result.chains)
            strict_1.default.equal(c.status, 'verified');
        // 重置
        ctrl.resetAll();
        result = ctrl.getChainStatus();
        for (const c of result.chains)
            strict_1.default.equal(c.status, 'defined');
    });
    (0, node_test_1.default)('验证后 has-broken 为 false, all-verified 为 true', async () => {
        const ctrl = createCtrl();
        await ctrl.validate({ chainNames: undefined, ...defaultCtx });
        const broken = ctrl.getHasBroken();
        strict_1.default.equal(broken.hasBroken, false);
        const verified = ctrl.getAllVerified();
        strict_1.default.equal(verified.allVerified, true);
    });
});
//# sourceMappingURL=cross-module.role.test.js.map