"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossModuleService = void 0;
const common_1 = require("@nestjs/common");
const cross_module_entity_1 = require("./cross-module.entity");
/**
 * 跨模块验证服务
 *
 * 管理跨模块 E2E 验证链路的生命周期：
 * - 列出所有链路及其状态
 * - 执行验证并对接各个模块
 */
let CrossModuleService = class CrossModuleService {
    /**
     * 内置的 4 条跨模块验证链路
     */
    chains = [
        {
            name: 'admin-to-consumer',
            description: '管理端创建 → API 存储 → B 端展示 → C 端消费',
            modules: ['tenant', 'bootstrap', 'foundation', 'portal', 'market', 'miniapp'],
            status: cross_module_entity_1.ChainStatus.Defined
        },
        {
            name: 'sdk-to-api',
            description: 'SDK 调用 → API 处理 → LYT 服务 → 会员数据',
            modules: ['sdk', 'api', 'lyt', 'member'],
            status: cross_module_entity_1.ChainStatus.Defined
        },
        {
            name: 'governance-chain',
            description: '配置治理 → 身份访问 → 信任治理 → 运行时治理 → 韧性运营',
            modules: [
                'configuration-governance',
                'identity-access',
                'trust-governance',
                'runtime-governance',
                'resilience-operations'
            ],
            status: cross_module_entity_1.ChainStatus.Defined
        },
        {
            name: 'multi-client-consistency',
            description: '管理端 Web → 企业端 Web → 门店 Web → 小程序 → API 一致性',
            modules: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'api'],
            status: cross_module_entity_1.ChainStatus.Defined
        }
    ];
    /**
     * 列出所有跨模块链路
     */
    listChains(filter) {
        let result = this.chains;
        if (filter?.chainName) {
            result = result.filter((c) => c.name === filter.chainName);
        }
        if (filter?.status) {
            result = result.filter((c) => c.status === filter.status);
        }
        return result;
    }
    /**
     * 获取链路状态摘要
     */
    getSummary() {
        return (0, cross_module_entity_1.toValidationSummary)(this.chains);
    }
    /**
     * 执行跨模块验证
     */
    async validate(chainNames, context) {
        const targets = chainNames
            ? this.chains.filter((c) => chainNames.includes(c.name))
            : this.chains;
        const results = [];
        for (const chain of targets) {
            const result = await this.validateChain(chain, context);
            results.push(result);
            // 更新链路状态
            chain.status = result.passed ? cross_module_entity_1.ChainStatus.Verified : cross_module_entity_1.ChainStatus.Broken;
            chain.lastVerifiedAt = new Date().toISOString();
            if (!result.passed) {
                chain.brokenNodes = result.stages
                    .filter((s) => !s.passed)
                    .map((s) => `${s.from} → ${s.to}`);
            }
        }
        return results;
    }
    /**
     * 验证单条链路
     */
    async validateChain(chain, context) {
        const startTime = Date.now();
        const stages = [];
        // 为每个相邻模块对创建验证阶段
        for (let i = 0; i < chain.modules.length - 1; i++) {
            const stageStart = Date.now();
            const from = chain.modules[i];
            const to = chain.modules[i + 1];
            try {
                const passed = await this.simulateModuleConnection(from, to, context);
                stages.push({
                    stage: `stage-${i + 1}`,
                    from,
                    to,
                    passed,
                    durationMs: Date.now() - stageStart
                });
            }
            catch (err) {
                stages.push({
                    stage: `stage-${i + 1}`,
                    from,
                    to,
                    passed: false,
                    error: err instanceof Error ? err.message : 'Unknown validation error',
                    durationMs: Date.now() - stageStart
                });
            }
        }
        const allPassed = stages.every((s) => s.passed);
        return {
            chainName: chain.name,
            passed: allPassed,
            stages,
            executedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime
        };
    }
    /**
     * 模拟模块间连接检查
     */
    async simulateModuleConnection(_from, _to, _context) {
        // 在 mock 环境中所有模块连接都返回 true
        // 生产环境将替换为实际的 E2E 连接检查
        return true;
    }
    /**
     * 检查所有链路是否全部验证通过
     */
    checkAllVerified() {
        return (0, cross_module_entity_1.isAllVerified)(this.chains);
    }
    /**
     * 检查是否存在断开的链路
     */
    checkHasBroken() {
        return (0, cross_module_entity_1.hasBrokenChain)(this.chains);
    }
    /**
     * 重置所有链路状态
     */
    resetAll() {
        for (const chain of this.chains) {
            chain.status = cross_module_entity_1.ChainStatus.Defined;
            chain.lastVerifiedAt = undefined;
            chain.brokenNodes = undefined;
        }
    }
};
exports.CrossModuleService = CrossModuleService;
exports.CrossModuleService = CrossModuleService = __decorate([
    (0, common_1.Injectable)()
], CrossModuleService);
//# sourceMappingURL=cross-module.service.js.map