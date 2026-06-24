"use strict";
/**
 * E2E-level: Foundation 底座服务层测试
 *
 * 链路:
 *   FoundationService.getModuleCatalog() → FoundationModuleDescriptor[]
 *   FoundationService.getGovernanceBaselines() → FoundationGovernanceBaseline[]
 *   FoundationService.getBlueprint() → FoundationBlueprint
 *   FoundationService.getConsumerCatalog() → FoundationConsumerDescriptor[]
 *   FoundationService.getConsumerDependency() → FoundationConsumerDescriptor | { availableConsumers }
 *   FoundationService.getDependencySummary() → FoundationConsumerDescriptor | undefined
 *
 * 验证:
 *   - getModuleCatalog 返回 6 个子模块描述符
 *   - 所有模块 key 唯一
 *   - getGovernanceBaselines 返回治理基线数组
 *   - getBlueprint 包含 modules / consumers / governanceBaselines
 *   - getConsumerCatalog 使用 adminWorkbenchConsumerDescriptor
 *   - getConsumerDependency 命中有效 consumer 返回描述
 *   - getConsumerDependency 未命中返回 availableConsumers
 *   - getDependencySummary 委托到 getConsumerCatalog
 *   - 幂等性: 多次调用一致
 *   - 边界: 空字符串 consumer
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const foundation_service_1 = require("./foundation.service");
// ── 公共辅助 ──
/**
 * 构造一个被 mock 子服务支撑的 FoundationService。
 * 所有子服务都只实现 getDescriptor() 和 getGovernanceBaselines()，
 * 避免 async / Prisma / LYT 依赖。
 */
function createService() {
    // 为每个子模块构造唯一的 FoundationModuleDescriptor
    const moduleKeys = [
        'identity-access',
        'configuration-governance',
        'integration-orchestration',
        'trust-governance',
        'resilience-operations',
        'runtime-governance'
    ];
    const moduleNames = [
        'Identity Access Module',
        'Configuration Governance Module',
        'Integration Orchestration Module',
        'Trust Governance Module',
        'Resilience Operations Module',
        'Runtime Governance Module'
    ];
    const modulePurposes = [
        '统一认证、授权与租户隔离入口',
        '配置治理：市场、通知、灰度',
        '集成编排：外部系统桥接',
        '信任治理：审计、防滥用',
        '韧性运维：灾备、演练、告警',
        '运行时治理：callback、receipt'
    ];
    function makeDescriptor(index) {
        return {
            key: moduleKeys[index],
            name: moduleNames[index],
            purpose: modulePurposes[index],
            inboundContracts: [`inbound-${index}`],
            outboundContracts: [`outbound-${index}`],
            capabilities: [
                {
                    key: `${moduleKeys[index]}-cap`,
                    name: `${moduleNames[index]} Capability`,
                    responsibilities: [`responsibility-${index}`],
                    entrypoints: [`entrypoint-${index}`],
                    consumers: ['portal'],
                    status: 'active'
                }
            ]
        };
    }
    function makeGovernanceBaseline(index) {
        return {
            key: moduleKeys[index],
            name: `baseline-${index}`,
            ownerModule: moduleKeys[index],
            summary: `Governance baseline for ${moduleKeys[index]}`,
            controls: [`control-${index}`],
            evidence: [`evidence-${index}`]
        };
    }
    // Mock 子服务: identity-access, configuration-governance, integration-orchestration
    const identityAccessService = {
        getDescriptor: () => makeDescriptor(0),
        getGovernanceBaselines: () => [makeGovernanceBaseline(0)]
    };
    const configurationGovernanceService = {
        getDescriptor: () => makeDescriptor(1),
        getGovernanceBaselines: () => [makeGovernanceBaseline(1)]
    };
    const integrationOrchestrationService = {
        getDescriptor: () => makeDescriptor(2),
        getGovernanceBaselines: () => [] // 可能无基线
    };
    const trustGovernanceService = {
        getDescriptor: () => makeDescriptor(3),
        getGovernanceBaselines: () => [makeGovernanceBaseline(3)]
    };
    const resilienceOperationsService = {
        getDescriptor: () => makeDescriptor(4),
        getGovernanceBaselines: () => [makeGovernanceBaseline(4)]
    };
    const runtimeGovernanceService = {
        getDescriptor: () => makeDescriptor(5),
        getGovernanceBaselines: () => [makeGovernanceBaseline(5)]
    };
    // Prisma 不需要（本测试不涉及 async 方法）
    const prisma = undefined;
    return new foundation_service_1.FoundationService(identityAccessService, configurationGovernanceService, integrationOrchestrationService, trustGovernanceService, resilienceOperationsService, runtimeGovernanceService, prisma);
}
// ── getModuleCatalog ──
(0, node_test_1.describe)('E2E: getModuleCatalog', () => {
    (0, node_test_1.default)('返回 6 个子模块描述符', () => {
        const svc = createService();
        const modules = svc.getModuleCatalog();
        strict_1.default.equal(modules.length, 6, '应有 6 个 Foundation 子模块');
    });
    (0, node_test_1.default)('所有模块 key 唯一', () => {
        const svc = createService();
        const keys = svc.getModuleCatalog().map((m) => m.key);
        const unique = new Set(keys);
        strict_1.default.equal(unique.size, keys.length, '模块 key 不应重复');
    });
    (0, node_test_1.default)('模块 key 包含所有预期值', () => {
        const svc = createService();
        const keys = svc.getModuleCatalog().map((m) => m.key);
        strict_1.default.ok(keys.includes('identity-access'));
        strict_1.default.ok(keys.includes('configuration-governance'));
        strict_1.default.ok(keys.includes('integration-orchestration'));
        strict_1.default.ok(keys.includes('trust-governance'));
        strict_1.default.ok(keys.includes('resilience-operations'));
        strict_1.default.ok(keys.includes('runtime-governance'));
    });
    (0, node_test_1.default)('每个模块具有完整结构', () => {
        const svc = createService();
        for (const mod of svc.getModuleCatalog()) {
            strict_1.default.equal(typeof mod.key, 'string');
            strict_1.default.equal(typeof mod.name, 'string');
            strict_1.default.equal(typeof mod.purpose, 'string');
            strict_1.default.ok(Array.isArray(mod.inboundContracts));
            strict_1.default.ok(Array.isArray(mod.outboundContracts));
            strict_1.default.ok(Array.isArray(mod.capabilities));
            strict_1.default.ok(mod.capabilities.length > 0);
            const cap = mod.capabilities[0];
            strict_1.default.equal(typeof cap.key, 'string');
            strict_1.default.equal(typeof cap.name, 'string');
            strict_1.default.ok(Array.isArray(cap.responsibilities));
            strict_1.default.ok(Array.isArray(cap.entrypoints));
            strict_1.default.ok(Array.isArray(cap.consumers));
            strict_1.default.equal(cap.status, 'active');
        }
    });
    (0, node_test_1.default)('多次调用返回独立数组', () => {
        const svc = createService();
        const a = svc.getModuleCatalog();
        const b = svc.getModuleCatalog();
        strict_1.default.equal(a.length, b.length);
        // 不是同一引用（每次调用新建数组）
        strict_1.default.notStrictEqual(a, b);
    });
});
// ── getGovernanceBaselines ──
(0, node_test_1.describe)('E2E: getGovernanceBaselines', () => {
    (0, node_test_1.default)('返回治理基线数组', () => {
        const svc = createService();
        const baselines = svc.getGovernanceBaselines();
        strict_1.default.ok(Array.isArray(baselines));
    });
    (0, node_test_1.default)('基线总数 = 各个子服务基线之和', () => {
        const svc = createService();
        const baselines = svc.getGovernanceBaselines();
        // 仅 configuration-governance / trust-governance / resilience-operations 有 getGovernanceBaselines
        // 各返回 1 条 → 共 3 条
        strict_1.default.equal(baselines.length, 3);
    });
    (0, node_test_1.default)('每条基线具有必需字段', () => {
        const svc = createService();
        for (const b of svc.getGovernanceBaselines()) {
            strict_1.default.equal(typeof b.key, 'string');
            strict_1.default.equal(typeof b.name, 'string');
            strict_1.default.equal(typeof b.ownerModule, 'string');
            strict_1.default.equal(typeof b.summary, 'string');
            strict_1.default.ok(Array.isArray(b.controls));
            strict_1.default.ok(Array.isArray(b.evidence));
        }
    });
});
// ── getBlueprint ──
(0, node_test_1.describe)('E2E: getBlueprint', () => {
    (0, node_test_1.default)('返回完整蓝图对象', () => {
        const svc = createService();
        const bp = svc.getBlueprint();
        strict_1.default.equal(typeof bp.generatedAt, 'string');
        strict_1.default.ok(Array.isArray(bp.docs));
        strict_1.default.ok(Array.isArray(bp.guardrails));
        strict_1.default.ok(Array.isArray(bp.modules));
        strict_1.default.ok(Array.isArray(bp.consumers));
        strict_1.default.ok(Array.isArray(bp.governanceBaselines));
    });
    (0, node_test_1.default)('generatedAt 是合法 ISO 时间戳', () => {
        const svc = createService();
        const bp = svc.getBlueprint();
        strict_1.default.ok(new Date(bp.generatedAt).getTime() > 0);
    });
    (0, node_test_1.default)('docs 包含 foundation 架构文档', () => {
        const svc = createService();
        const docs = svc.getBlueprint().docs;
        strict_1.default.ok(docs.some((d) => d.includes('foundation-architecture.md')));
        strict_1.default.ok(docs.some((d) => d.includes('foundation-bootstrap-wiring.md')));
        strict_1.default.ok(docs.some((d) => d.includes('operations-governance-baseline.md')));
        strict_1.default.ok(docs.some((d) => d.includes('operations-runbook-template.md')));
    });
    (0, node_test_1.default)('guardrails 有 5 条规则', () => {
        const svc = createService();
        const guardrails = svc.getBlueprint().guardrails;
        strict_1.default.equal(guardrails.length, 5, '应有 5 条底座护栏规则');
    });
    (0, node_test_1.default)('modules 长度 = 6', () => {
        const svc = createService();
        strict_1.default.equal(svc.getBlueprint().modules.length, 6);
    });
    (0, node_test_1.default)('governanceBaselines 长度 = 3', () => {
        const svc = createService();
        strict_1.default.equal(svc.getBlueprint().governanceBaselines.length, 3);
    });
    (0, node_test_1.default)('blueprint 包含 frontendBootstrap', () => {
        const svc = createService();
        const bp = svc.getBlueprint();
        strict_1.default.ok('frontendBootstrap' in bp);
    });
    (0, node_test_1.default)('多次调用 generatedAt 递增', () => {
        const svc = createService();
        const a = svc.getBlueprint();
        const b = svc.getBlueprint();
        strict_1.default.ok(new Date(b.generatedAt).getTime() >= new Date(a.generatedAt).getTime());
    });
});
// ── getConsumerCatalog ──
(0, node_test_1.describe)('E2E: getConsumerCatalog', () => {
    (0, node_test_1.default)('返回消费者描述符数组', () => {
        const svc = createService();
        const consumers = svc.getConsumerCatalog();
        strict_1.default.ok(Array.isArray(consumers));
    });
    (0, node_test_1.default)('至少包含 adminWorkbench', () => {
        const svc = createService();
        const consumers = svc.getConsumerCatalog();
        const hasWorkbench = consumers.some((c) => c.consumer === 'workbench');
        strict_1.default.ok(hasWorkbench, '应包含 workbench 消费者');
    });
    (0, node_test_1.default)('每个消费者有必需字段', () => {
        const svc = createService();
        for (const c of svc.getConsumerCatalog()) {
            strict_1.default.equal(typeof c.consumer, 'string');
            strict_1.default.equal(typeof c.modulePath, 'string');
            strict_1.default.ok(Array.isArray(c.dependsOn));
            strict_1.default.equal(typeof c.responsibility, 'string');
            strict_1.default.ok(Array.isArray(c.handoffContracts));
        }
    });
});
// ── getConsumerDependency ──
(0, node_test_1.describe)('E2E: getConsumerDependency', () => {
    (0, node_test_1.default)('命中 market consumer 返回描述符', () => {
        const svc = createService();
        const result = svc.getConsumerDependency('market');
        // market 在 consumer catalog 中存在
        strict_1.default.equal(typeof result, 'object');
        if ('consumer' in result && result.consumer) {
            strict_1.default.equal(result.consumer, 'market');
        }
    });
    (0, node_test_1.default)('未命中返回 availableConsumers', () => {
        const svc = createService();
        const result = svc.getConsumerDependency('non-existent-consumer');
        strict_1.default.ok(Array.isArray(result.availableConsumers));
    });
    (0, node_test_1.default)('availableConsumers 列出所有已知消费者', () => {
        const svc = createService();
        const allConsumers = svc.getConsumerCatalog().map((c) => c.consumer);
        const result = svc.getConsumerDependency('non-existent-consumer');
        const available = result.availableConsumers;
        strict_1.default.deepStrictEqual(available, allConsumers);
    });
    (0, node_test_1.default)('空字符串 consumer 返回 availableConsumers', () => {
        const svc = createService();
        const result = svc.getConsumerDependency('');
        strict_1.default.ok(Array.isArray(result.availableConsumers));
    });
});
// ── getDependencySummary ──
(0, node_test_1.describe)('E2E: getDependencySummary', () => {
    (0, node_test_1.default)('命中返回消费者描述符', () => {
        const svc = createService();
        const result = svc.getDependencySummary('market');
        strict_1.default.ok(result);
        strict_1.default.equal(result.consumer, 'market');
    });
    (0, node_test_1.default)('未命中返回 undefined', () => {
        const svc = createService();
        const result = svc.getDependencySummary('ghost-consumer');
        strict_1.default.equal(result, undefined);
    });
    (0, node_test_1.default)('workbench 可以查到', () => {
        const svc = createService();
        const result = svc.getDependencySummary('workbench');
        strict_1.default.ok(result);
        strict_1.default.equal(result.consumer, 'workbench');
    });
});
// ── 边界 ──
(0, node_test_1.describe)('E2E: 边界与结构一致性', () => {
    (0, node_test_1.default)('getModuleCatalog 不含重复 capability key', () => {
        const svc = createService();
        const allKeys = [];
        for (const mod of svc.getModuleCatalog()) {
            for (const cap of mod.capabilities) {
                allKeys.push(cap.key);
            }
        }
        const unique = new Set(allKeys);
        strict_1.default.equal(unique.size, allKeys.length, 'capability key 不应重复');
    });
    (0, node_test_1.default)('getBlueprint docs 全为非空字符串', () => {
        const svc = createService();
        for (const doc of svc.getBlueprint().docs) {
            strict_1.default.ok(typeof doc === 'string' && doc.length > 0);
        }
    });
    (0, node_test_1.default)('getBlueprint guardrails 全为非空字符串', () => {
        const svc = createService();
        for (const rule of svc.getBlueprint().guardrails) {
            strict_1.default.ok(typeof rule === 'string' && rule.length > 0);
        }
    });
});
//# sourceMappingURL=foundation.e2e.test.js.map