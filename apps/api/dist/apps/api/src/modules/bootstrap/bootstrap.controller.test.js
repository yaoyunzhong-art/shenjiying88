"use strict";
/**
 * 🐜 自动: [bootstrap] [D] controller spec 补全
 *
 * 测试覆盖：
 * - entity factory 函数（toBootstrapHealth, toBootstrapMetadata）
 * - BootstrapPhase 枚举
 * - BootstrapHealth / BootstrapMetadata / RegionalLoginPolicy / BootstrapConsumerDependency 接口
 * - BootstrapService 端点
 * - bootstrap.contract 边界
 *
 * 注意：controller 引入 @TenantContext 装饰器需要完整 NestJS 编译链，
 * controller 路由/端点测试在模块 e2e 测试中覆盖。
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
const bootstrap_entity_1 = require("./bootstrap.entity");
// ── BootstrapPhase 枚举 ──
(0, node_test_1.describe)('BootstrapPhase 枚举', () => {
    (0, node_test_1.default)('包含 scaffold / provision / handoff / ready', () => {
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Scaffold, 'scaffold');
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Provision, 'provision');
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Handoff, 'handoff');
        strict_1.default.equal(bootstrap_entity_1.BootstrapPhase.Ready, 'ready');
    });
    (0, node_test_1.default)('共 4 个枚举值', () => {
        strict_1.default.equal(Object.values(bootstrap_entity_1.BootstrapPhase).length, 4);
    });
    (0, node_test_1.default)('枚举值均为不同字符串', () => {
        const values = Object.values(bootstrap_entity_1.BootstrapPhase);
        const unique = new Set(values);
        strict_1.default.equal(unique.size, values.length);
    });
});
// ── toBootstrapHealth factory ──
(0, node_test_1.describe)('toBootstrapHealth factory', () => {
    (0, node_test_1.default)('默认构造：status=ok, phase=Scaffold, uptime≥0, checkedAt 合法 ISO', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)();
        strict_1.default.equal(health.status, 'ok');
        strict_1.default.equal(health.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
        strict_1.default.equal(typeof health.uptime, 'number');
        strict_1.default.ok(health.uptime >= 0);
        strict_1.default.ok(typeof health.checkedAt === 'string');
        strict_1.default.ok(new Date(health.checkedAt).getTime() > 0);
    });
    (0, node_test_1.default)('覆盖 status=degraded', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)({ status: 'degraded' });
        strict_1.default.equal(health.status, 'degraded');
        strict_1.default.equal(health.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
    });
    (0, node_test_1.default)('覆盖 status=error', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)({ status: 'error' });
        strict_1.default.equal(health.status, 'error');
    });
    (0, node_test_1.default)('覆盖 phase=Ready', () => {
        const health = (0, bootstrap_entity_1.toBootstrapHealth)({ phase: bootstrap_entity_1.BootstrapPhase.Ready });
        strict_1.default.equal(health.phase, bootstrap_entity_1.BootstrapPhase.Ready);
    });
    (0, node_test_1.default)('覆盖 uptime', () => {
        strict_1.default.equal((0, bootstrap_entity_1.toBootstrapHealth)({ uptime: 9999 }).uptime, 9999);
    });
    (0, node_test_1.default)('覆盖 checkedAt', () => {
        const custom = '2025-01-01T00:00:00.000Z';
        strict_1.default.equal((0, bootstrap_entity_1.toBootstrapHealth)({ checkedAt: custom }).checkedAt, custom);
    });
    (0, node_test_1.default)('多次调用返回独立对象', () => {
        const a = (0, bootstrap_entity_1.toBootstrapHealth)();
        const b = (0, bootstrap_entity_1.toBootstrapHealth)({ status: 'degraded' });
        strict_1.default.notStrictEqual(a, b);
        strict_1.default.notEqual(a.status, b.status);
    });
});
// ── toBootstrapMetadata factory ──
(0, node_test_1.describe)('toBootstrapMetadata factory', () => {
    (0, node_test_1.default)('默认构造：空依赖、空契约、Scaffold、有 generatedAt', () => {
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)({ tenantId: 't-meta' });
        strict_1.default.equal(meta.tenantContext.tenantId, 't-meta');
        strict_1.default.deepStrictEqual(meta.foundationDependencies, []);
        strict_1.default.deepStrictEqual(meta.foundationContracts, []);
        strict_1.default.equal(meta.phase, bootstrap_entity_1.BootstrapPhase.Scaffold);
        strict_1.default.ok(meta.generatedAt);
    });
    (0, node_test_1.default)('覆盖依赖列表', () => {
        const deps = ['identity-access', 'configuration-governance'];
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)({ tenantId: 't-deps' }, { foundationDependencies: deps });
        strict_1.default.equal(meta.foundationDependencies.length, 2);
        strict_1.default.ok(meta.foundationDependencies.includes('identity-access'));
    });
    (0, node_test_1.default)('覆盖契约列表', () => {
        const contracts = ['identity.contract', 'config.contract'];
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)({ tenantId: 't-contracts' }, { foundationContracts: contracts });
        strict_1.default.equal(meta.foundationContracts.length, 2);
        strict_1.default.equal(meta.foundationContracts[0], 'identity.contract');
    });
    (0, node_test_1.default)('覆盖 phase=Ready', () => {
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)({ tenantId: 't-phase' }, { phase: bootstrap_entity_1.BootstrapPhase.Ready });
        strict_1.default.equal(meta.phase, bootstrap_entity_1.BootstrapPhase.Ready);
    });
    (0, node_test_1.default)('覆盖 generatedAt', () => {
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)({ tenantId: 't-time' }, { generatedAt: '2026-06-23T06:00:00.000Z' });
        strict_1.default.equal(meta.generatedAt, '2026-06-23T06:00:00.000Z');
    });
    (0, node_test_1.default)('完整 tenantContext 透传', () => {
        const fullCtx = {
            tenantId: 't-full',
            brandId: 'b-full',
            storeId: 's-full',
            marketCode: 'jp-east',
        };
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)(fullCtx);
        strict_1.default.equal(meta.tenantContext.tenantId, 't-full');
        strict_1.default.equal(meta.tenantContext.brandId, 'b-full');
        strict_1.default.equal(meta.tenantContext.storeId, 's-full');
        strict_1.default.equal(meta.tenantContext.marketCode, 'jp-east');
    });
    (0, node_test_1.default)('最小 tenantContext（仅 tenantId）brandId/storeId 为 undefined', () => {
        const meta = (0, bootstrap_entity_1.toBootstrapMetadata)({ tenantId: 't-min' });
        strict_1.default.equal(meta.tenantContext.tenantId, 't-min');
        strict_1.default.equal(meta.tenantContext.brandId, undefined);
        strict_1.default.equal(meta.tenantContext.storeId, undefined);
    });
});
// ── 实体接口类型验证 ──
(0, node_test_1.describe)('Bootstrap 实体接口类型验证', () => {
    (0, node_test_1.default)('BootstrapHealth 满足接口契约', () => {
        const health = {
            status: 'ok',
            uptime: 12345.67,
            phase: bootstrap_entity_1.BootstrapPhase.Scaffold,
            checkedAt: new Date().toISOString(),
        };
        strict_1.default.equal(health.status, 'ok');
        strict_1.default.equal(health.uptime, 12345.67);
        strict_1.default.equal(health.phase, 'scaffold');
        strict_1.default.ok(typeof health.checkedAt === 'string');
    });
    (0, node_test_1.default)('BootstrapMetadata 满足接口契约', () => {
        const metadata = {
            tenantContext: {
                tenantId: 't-cn',
                brandId: 'b-cn',
                storeId: 's-cn',
                marketCode: 'cn-mainland',
            },
            foundationDependencies: ['identity-access'],
            foundationContracts: ['identity.contract'],
            phase: bootstrap_entity_1.BootstrapPhase.Handoff,
            generatedAt: new Date().toISOString(),
        };
        strict_1.default.equal(metadata.tenantContext.marketCode, 'cn-mainland');
        strict_1.default.equal(metadata.foundationDependencies[0], 'identity-access');
        strict_1.default.equal(metadata.phase, 'handoff');
    });
    (0, node_test_1.default)('RegionalLoginPolicy 满足接口契约', () => {
        const policy = {
            defaultLoginPath: '/auth/login',
            ssoEnabled: true,
            supportedMarkets: ['cn-mainland', 'us-default'],
        };
        strict_1.default.equal(policy.defaultLoginPath, '/auth/login');
        strict_1.default.equal(policy.ssoEnabled, true);
        strict_1.default.equal(policy.supportedMarkets.length, 2);
    });
    (0, node_test_1.default)('BootstrapConsumerDependency 满足接口契约', () => {
        const dep = {
            consumerName: 'portal',
            dependsOn: ['identity-access', 'configuration-governance'],
            contracts: ['identity.contract'],
            responsibility: 'Provide tenant portal routing',
        };
        strict_1.default.equal(dep.consumerName, 'portal');
        strict_1.default.equal(dep.dependsOn.length, 2);
        strict_1.default.equal(dep.contracts.length, 1);
        strict_1.default.ok(typeof dep.responsibility === 'string');
    });
});
// ── BootstrapService ──
(0, node_test_1.describe)('BootstrapService', () => {
    (0, node_test_1.default)('getHealth 返回 ok / scaffold / 数字 uptime', () => {
        const { BootstrapService } = require('./bootstrap.service');
        const service = new BootstrapService();
        const result = service.getHealth();
        strict_1.default.equal(result.status, 'ok');
        strict_1.default.equal(result.phase, 'scaffold');
        strict_1.default.equal(typeof result.uptime, 'number');
    });
    (0, node_test_1.default)('getBootstrapMetadata 委托到 entity 逻辑', () => {
        const { BootstrapService } = require('./bootstrap.service');
        const service = new BootstrapService();
        const ctx = { tenantId: 't-svc', brandId: 'b-svc' };
        const result = service.getBootstrapMetadata(ctx);
        strict_1.default.equal(result.tenantContext.tenantId, 't-svc');
        strict_1.default.equal(result.tenantContext.brandId, 'b-svc');
        strict_1.default.equal(result.phase, 'scaffold');
    });
    (0, node_test_1.default)('getBootstrapMetadata 缺失字段为 undefined', () => {
        const { BootstrapService } = require('./bootstrap.service');
        const service = new BootstrapService();
        const result = service.getBootstrapMetadata({ tenantId: 't-only' });
        strict_1.default.equal(result.tenantContext.tenantId, 't-only');
        strict_1.default.equal(result.tenantContext.storeId, undefined);
        strict_1.default.equal(result.foundationDependencies.length, 0);
    });
    (0, node_test_1.default)('getHealth uptime 递增', () => {
        const { BootstrapService } = require('./bootstrap.service');
        const service = new BootstrapService();
        const first = service.getHealth();
        const second = service.getHealth();
        strict_1.default.ok(second.uptime >= first.uptime);
    });
});
// ── bootstrap.contract ──
(0, node_test_1.describe)('bootstrap.contract', () => {
    (0, node_test_1.default)('toBootstrapFoundationMetadata 空输入返回空数组', () => {
        const { toBootstrapFoundationMetadata } = require('./bootstrap.contract');
        const result = toBootstrapFoundationMetadata(undefined);
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
        strict_1.default.deepStrictEqual(result.foundationContracts, []);
    });
    (0, node_test_1.default)('toBootstrapFoundationMetadata 传入依赖/契约', () => {
        const { toBootstrapFoundationMetadata } = require('./bootstrap.contract');
        const input = {
            dependsOn: ['identity-access'],
            handoffContracts: ['identity.contract'],
        };
        const result = toBootstrapFoundationMetadata(input);
        strict_1.default.deepStrictEqual(result.foundationDependencies, ['identity-access']);
        strict_1.default.deepStrictEqual(result.foundationContracts, ['identity.contract']);
    });
    (0, node_test_1.default)('toBootstrapFoundationMetadata 不含 phase 属性', () => {
        const { toBootstrapFoundationMetadata } = require('./bootstrap.contract');
        const result = toBootstrapFoundationMetadata(undefined);
        strict_1.default.ok('foundationDependencies' in result);
        strict_1.default.ok('foundationContracts' in result);
        strict_1.default.ok(!('phase' in result));
    });
    (0, node_test_1.default)('toRegionalLoginPolicyContract 正常构造', () => {
        const { toRegionalLoginPolicyContract } = require('./bootstrap.contract');
        const result = toRegionalLoginPolicyContract('/login/sso', true);
        strict_1.default.equal(result.defaultLoginPath, '/login/sso');
        strict_1.default.equal(result.ssoEnabled, true);
    });
    (0, node_test_1.default)('toRegionalLoginPolicyContract ssoDisabled', () => {
        const { toRegionalLoginPolicyContract } = require('./bootstrap.contract');
        const result = toRegionalLoginPolicyContract('/login/basic', false);
        strict_1.default.equal(result.defaultLoginPath, '/login/basic');
        strict_1.default.equal(result.ssoEnabled, false);
    });
});
//# sourceMappingURL=bootstrap.controller.test.js.map