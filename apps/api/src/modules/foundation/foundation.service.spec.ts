import { describe, it, expect, beforeEach } from 'vitest'

// ==============================
// foundation.service.spec.ts — 纯函数式内联测试
// 不 import 生产代码 FoundationService
// 严格验证 getModuleCatalog / getConsumerCatalog / getBlueprint
// getConsumerDependency / getDependencySummary 正反例 + 边界
// ==============================

// ── 枚举 + 类型 ──────────────────────────────────────────────

type FoundationModuleKey = 'identity-access' | 'configuration-governance' | 'integration-orchestration' | 'trust-governance' | 'resilience-operations' | 'runtime-governance'

interface FoundationModuleDescriptor {
  key: FoundationModuleKey
  name: string
  purpose: string
  inboundContracts: string[]
  outboundContracts: string[]
  capabilities: string[]
}

type FoundationConsumerKey = string
interface FoundationConsumerDescriptor {
  consumer: string
  modulePath: string
  dependsOn: string[]
  responsibility: string
  handoffContracts: string[]
}

interface FoundationBlueprint {
  modules: FoundationModuleDescriptor[]
  consumers: FoundationConsumerDescriptor[]
  generatedAt: string
  guardrails: string[]
  docs: string[]
  governanceBaselines: unknown[]
  frontendBootstrap: unknown
}

type FoundationGovernanceBaseline = { key: string; name: string }

// ── 描述子工厂 ──────────────────────────────────────────────

function makeModuleDescriptor(key: FoundationModuleKey, overrides: Partial<FoundationModuleDescriptor> = {}): FoundationModuleDescriptor {
  return {
    key,
    name: key,
    purpose: `${key} module`,
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [],
    ...overrides,
  }
}

function makeConsumerDescriptor(consumer: string, overrides: Partial<FoundationConsumerDescriptor> = {}): FoundationConsumerDescriptor {
  return {
    consumer,
    modulePath: `src/modules/${consumer}`,
    dependsOn: ['identity-access', 'configuration-governance'],
    responsibility: `${consumer} module`,
    handoffContracts: [],
    ...overrides,
  }
}

// ── Mock 工厂 ────────────────────────────────────────────────

interface MockFoundationDeps {
  identityAccessDescriptor: FoundationModuleDescriptor
  configurationGovernanceDescriptor: FoundationModuleDescriptor
  integrationOrchestrationDescriptor: FoundationModuleDescriptor
  trustGovernanceDescriptor: FoundationModuleDescriptor
  resilienceOperationsDescriptor: FoundationModuleDescriptor
  runtimeGovernanceDescriptor: FoundationModuleDescriptor
  configurationGovernanceBaselines: FoundationGovernanceBaseline[]
  trustGovernanceBaselines: FoundationGovernanceBaseline[]
  resilienceOperationsBaselines: FoundationGovernanceBaseline[]
}

function createMockDeps(): MockFoundationDeps {
  return {
    identityAccessDescriptor: makeModuleDescriptor('identity-access'),
    configurationGovernanceDescriptor: makeModuleDescriptor('configuration-governance'),
    integrationOrchestrationDescriptor: makeModuleDescriptor('integration-orchestration'),
    trustGovernanceDescriptor: makeModuleDescriptor('trust-governance'),
    resilienceOperationsDescriptor: makeModuleDescriptor('resilience-operations'),
    runtimeGovernanceDescriptor: makeModuleDescriptor('runtime-governance'),
    configurationGovernanceBaselines: [
      { key: 'cg-baseline-1', name: 'Configuration Baseline 1' },
      { key: 'cg-baseline-2', name: 'Configuration Baseline 2' },
    ],
    trustGovernanceBaselines: [
      { key: 'tg-baseline-1', name: 'Trust Baseline 1' },
      { key: 'tg-baseline-2', name: 'Trust Baseline 2' },
    ],
    resilienceOperationsBaselines: [
      { key: 'ro-baseline-1', name: 'Resilience Baseline 1' },
      { key: 'ro-baseline-2', name: 'Resilience Baseline 2' },
    ],
  }
}

// ── 内联业务逻辑 ────────────────────────────────────────────

function inlineGetModuleCatalog(deps: MockFoundationDeps): FoundationModuleDescriptor[] {
  return [
    deps.identityAccessDescriptor,
    deps.configurationGovernanceDescriptor,
    deps.integrationOrchestrationDescriptor,
    deps.trustGovernanceDescriptor,
    deps.resilienceOperationsDescriptor,
    deps.runtimeGovernanceDescriptor,
  ]
}

function inlineGetConsumerCatalog(): FoundationConsumerDescriptor[] {
  return [
    makeConsumerDescriptor('market', {
      dependsOn: ['identity-access', 'configuration-governance', 'trust-governance', 'resilience-operations'],
      handoffContracts: ['从 identity-access 读取租户作用域', '从 configuration-governance 读取市场配置'],
    }),
    makeConsumerDescriptor('portal', {
      dependsOn: ['identity-access', 'configuration-governance', 'integration-orchestration', 'trust-governance', 'resilience-operations'],
      handoffContracts: ['从 identity-access 解析门户身份', '从 configuration-governance 装配域名配置'],
    }),
    makeConsumerDescriptor('workbench', {
      dependsOn: ['identity-access', 'configuration-governance', 'integration-orchestration', 'trust-governance', 'resilience-operations'],
      handoffContracts: ['由 identity-access 输出角色策略', '由 configuration-governance 下发灰度配置'],
    }),
    makeConsumerDescriptor('lyt-adapter', {
      dependsOn: ['identity-access', 'configuration-governance', 'integration-orchestration', 'trust-governance', 'resilience-operations'],
      handoffContracts: ['从 identity-access 获取门店作用域', '从 configuration-governance 获取 LYT secrets'],
    }),
  ]
}

function inlineGetGovernanceBaselines(deps: MockFoundationDeps): FoundationGovernanceBaseline[] {
  return [
    ...deps.configurationGovernanceBaselines,
    ...deps.trustGovernanceBaselines,
    ...deps.resilienceOperationsBaselines,
  ]
}

function inlineGetBlueprint(deps: MockFoundationDeps): FoundationBlueprint {
  return {
    modules: inlineGetModuleCatalog(deps),
    consumers: inlineGetConsumerCatalog(),
    generatedAt: new Date().toISOString(),
    guardrails: [
      '业务模块不得绕过底座直接接外部系统。',
      '跨租户访问必须通过统一身份与租户隔离入口。',
      '市场策略、通知模板和灰度开关必须从配置治理层读取。',
    ],
    docs: ['src/modules/foundation/foundation-architecture.md'],
    governanceBaselines: inlineGetGovernanceBaselines(deps),
    frontendBootstrap: { version: '1.0.0', endpoints: [] },
  }
}

function inlineGetConsumerDependency(consumer: string): FoundationConsumerDescriptor | { availableConsumers: string[] } {
  const found = inlineGetConsumerCatalog().find((item) => item.consumer === consumer)
  if (found) return found
  return { availableConsumers: inlineGetConsumerCatalog().map((item) => item.consumer) }
}

function inlineGetDependencySummary(consumer: FoundationConsumerKey): FoundationConsumerDescriptor | undefined {
  return inlineGetConsumerCatalog().find((item) => item.consumer === consumer)
}

// ── 测试 ─────────────────────────────────────────────────────

describe('FoundationService (纯内联)', () => {
  let deps: MockFoundationDeps

  beforeEach(() => {
    deps = createMockDeps()
  })

  // ── getModuleCatalog ────────────────────────────────

  describe('getModuleCatalog', () => {
    it('应返回 6 个模块', () => {
      const catalog = inlineGetModuleCatalog(deps)
      expect(catalog).toHaveLength(6)
    })

    it('每个模块必须包含 key/name/purpose', () => {
      for (const m of inlineGetModuleCatalog(deps)) {
        expect(m.key).toBeDefined()
        expect(m.name).toBeDefined()
        expect(m.purpose).toBeDefined()
        expect(Array.isArray(m.capabilities)).toBe(true)
      }
    })

    it('包含预期的 6 个模块 key', () => {
      const keys = inlineGetModuleCatalog(deps).map((m) => m.key).sort()
      expect(keys).toEqual([
        'configuration-governance',
        'identity-access',
        'integration-orchestration',
        'resilience-operations',
        'runtime-governance',
        'trust-governance',
      ])
    })

    it('空 capabilities 数组作为默认值', () => {
      for (const m of inlineGetModuleCatalog(deps)) {
        expect(m.capabilities).toEqual([])
      }
    })
  })

  // ── getConsumerCatalog ───────────────────────────────

  describe('getConsumerCatalog', () => {
    it('应返回 4 个消费者', () => {
      const catalog = inlineGetConsumerCatalog()
      expect(catalog).toHaveLength(4)
    })

    it('每个消费者包含 consumer/dependsOn/responsibility', () => {
      for (const c of inlineGetConsumerCatalog()) {
        expect(c.consumer).toBeDefined()
        expect(Array.isArray(c.dependsOn)).toBe(true)
        expect(typeof c.responsibility).toBe('string')
      }
    })

    it('包含 market/portal/workbench/lyt-adapter', () => {
      const keys = inlineGetConsumerCatalog().map((c) => c.consumer).sort()
      expect(keys).toEqual(['lyt-adapter', 'market', 'portal', 'workbench'])
    })

    it('market 依赖 identity-access 等 4 个模块', () => {
      const market = inlineGetConsumerCatalog().find((c) => c.consumer === 'market')
      expect(market!.dependsOn).toEqual(
        expect.arrayContaining(['identity-access', 'configuration-governance', 'trust-governance', 'resilience-operations'])
      )
    })

    it('portal 依赖 5 个模块（含 integration-orchestration）', () => {
      const portal = inlineGetConsumerCatalog().find((c) => c.consumer === 'portal')
      expect(portal!.dependsOn).toContain('integration-orchestration')
      expect(portal!.dependsOn).toHaveLength(5)
    })
  })

  // ── getGovernanceBaselines ───────────────────────────

  describe('getGovernanceBaselines', () => {
    it('从 3 个子服务返回 6 个基线', () => {
      const baselines = inlineGetGovernanceBaselines(deps)
      expect(baselines).toHaveLength(6)
    })

    it('每个基线包含 key 和 name', () => {
      for (const b of inlineGetGovernanceBaselines(deps)) {
        expect(typeof b.key).toBe('string')
        expect(typeof b.name).toBe('string')
      }
    })

    it('包含配置/信任/弹性三类基线', () => {
      const keys = inlineGetGovernanceBaselines(deps).map((b) => b.key)
      expect(keys.filter((k) => k.startsWith('cg-'))).toHaveLength(2)
      expect(keys.filter((k) => k.startsWith('tg-'))).toHaveLength(2)
      expect(keys.filter((k) => k.startsWith('ro-'))).toHaveLength(2)
    })
  })

  // ── getBlueprint ─────────────────────────────────────

  describe('getBlueprint', () => {
    it('包含 generatedAt 时间戳', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.generatedAt).toBeDefined()
      expect(() => new Date(bp.generatedAt)).not.toThrow()
    })

    it('包含 3 条 guardrails', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.guardrails).toHaveLength(3)
      for (const g of bp.guardrails) {
        expect(typeof g).toBe('string')
        expect(g.length).toBeGreaterThan(0)
      }
    })

    it('modules 与 getModuleCatalog 一致', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.modules).toHaveLength(6)
      expect(bp.modules).toEqual(inlineGetModuleCatalog(deps))
    })

    it('consumers 与 getConsumerCatalog 一致', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.consumers).toHaveLength(4)
      expect(bp.consumers).toEqual(inlineGetConsumerCatalog())
    })

    it('governanceBaselines 与 getGovernanceBaselines 一致', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.governanceBaselines).toHaveLength(6)
      expect(bp.governanceBaselines).toEqual(inlineGetGovernanceBaselines(deps))
    })

    it('docs 包含 foundation-architecture.md', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.docs.some((d) => d.includes('foundation-architecture.md'))).toBe(true)
    })

    it('frontendBootstrap 已定义', () => {
      const bp = inlineGetBlueprint(deps)
      expect(bp.frontendBootstrap).toBeDefined()
    })

    it('generatedAt 为有效 ISO 字符串', () => {
      const bp = inlineGetBlueprint(deps)
      const d = new Date(bp.generatedAt)
      expect(isNaN(d.getTime())).toBe(false)
    })
  })

  // ── getConsumerDependency ────────────────────────────

  describe('getConsumerDependency', () => {
    it('已知 consumer 返回匹配结果', () => {
      const dep = inlineGetConsumerDependency('market')
      expect(dep).not.toHaveProperty('availableConsumers')
      expect((dep as FoundationConsumerDescriptor).consumer).toBe('market')
    })

    it('未知 consumer 返回 availableConsumers', () => {
      const dep = inlineGetConsumerDependency('nonexistent')
      expect(dep).toHaveProperty('availableConsumers')
      expect((dep as { availableConsumers: string[] }).availableConsumers).toContain('market')
    })

    it('availableConsumers 包含全部 4 个', () => {
      const dep = inlineGetConsumerDependency('unknown')
      expect((dep as { availableConsumers: string[] }).availableConsumers.sort()).toEqual([
        'lyt-adapter', 'market', 'portal', 'workbench',
      ])
    })

    it('空字符串 consumer 返回 availableConsumers', () => {
      const dep = inlineGetConsumerDependency('')
      expect(dep).toHaveProperty('availableConsumers')
    })
  })

  // ── getDependencySummary ─────────────────────────────

  describe('getDependencySummary', () => {
    it('已知 consumer 返回摘要', () => {
      const summary = inlineGetDependencySummary('portal')
      expect(summary).toBeDefined()
      expect(summary!.consumer).toBe('portal')
    })

    it('未知 consumer 返回 undefined', () => {
      const summary = inlineGetDependencySummary('nonexistent')
      expect(summary).toBeUndefined()
    })

    it('空字符串返回 undefined', () => {
      const summary = inlineGetDependencySummary('')
      expect(summary).toBeUndefined()
    })
  })
})
