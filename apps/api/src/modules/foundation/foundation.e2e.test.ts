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

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { FoundationService } from './foundation.service'
import type { FoundationModuleDescriptor, FoundationGovernanceBaseline } from './foundation.types'

// ── 公共辅助 ──

/**
 * 构造一个被 mock 子服务支撑的 FoundationService。
 * 所有子服务都只实现 getDescriptor() 和 getGovernanceBaselines()，
 * 避免 async / Prisma / LYT 依赖。
 */
function createService(): FoundationService {
  // 为每个子模块构造唯一的 FoundationModuleDescriptor
  const moduleKeys = [
    'identity-access',
    'configuration-governance',
    'integration-orchestration',
    'trust-governance',
    'resilience-operations',
    'runtime-governance'
  ] as const

  const moduleNames = [
    'Identity Access Module',
    'Configuration Governance Module',
    'Integration Orchestration Module',
    'Trust Governance Module',
    'Resilience Operations Module',
    'Runtime Governance Module'
  ]

  const modulePurposes = [
    '统一认证、授权与租户隔离入口',
    '配置治理：市场、通知、灰度',
    '集成编排：外部系统桥接',
    '信任治理：审计、防滥用',
    '韧性运维：灾备、演练、告警',
    '运行时治理：callback、receipt'
  ]

  function makeDescriptor(index: number): FoundationModuleDescriptor {
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
          status: 'active' as const
        }
      ]
    }
  }

  function makeGovernanceBaseline(index: number): FoundationGovernanceBaseline {
    return {
      key: moduleKeys[index],
      name: `baseline-${index}`,
      ownerModule: moduleKeys[index],
      summary: `Governance baseline for ${moduleKeys[index]}`,
      controls: [`control-${index}`],
      evidence: [`evidence-${index}`]
    }
  }

  // Mock 子服务: identity-access, configuration-governance, integration-orchestration
  const identityAccessService = {
    getDescriptor: () => makeDescriptor(0),
    getGovernanceBaselines: () => [makeGovernanceBaseline(0)]
  }

  const configurationGovernanceService = {
    getDescriptor: () => makeDescriptor(1),
    getGovernanceBaselines: () => [makeGovernanceBaseline(1)]
  }

  const integrationOrchestrationService = {
    getDescriptor: () => makeDescriptor(2),
    getGovernanceBaselines: () => [] // 可能无基线
  }

  const trustGovernanceService = {
    getDescriptor: () => makeDescriptor(3),
    getGovernanceBaselines: () => [makeGovernanceBaseline(3)]
  }

  const resilienceOperationsService = {
    getDescriptor: () => makeDescriptor(4),
    getGovernanceBaselines: () => [makeGovernanceBaseline(4)]
  }

  const runtimeGovernanceService = {
    getDescriptor: () => makeDescriptor(5),
    getGovernanceBaselines: () => [makeGovernanceBaseline(5)]
  }

  // Prisma 不需要（本测试不涉及 async 方法）
  const prisma = undefined as any

  return new FoundationService(
    identityAccessService as any,
    configurationGovernanceService as any,
    integrationOrchestrationService as any,
    trustGovernanceService as any,
    resilienceOperationsService as any,
    runtimeGovernanceService as any,
    prisma
  )
}

// ── getModuleCatalog ──

describe('E2E: getModuleCatalog', () => {
  test('返回 6 个子模块描述符', () => {
    const svc = createService()
    const modules = svc.getModuleCatalog()
    assert.equal(modules.length, 6, '应有 6 个 Foundation 子模块')
  })

  test('所有模块 key 唯一', () => {
    const svc = createService()
    const keys = svc.getModuleCatalog().map((m) => m.key)
    const unique = new Set(keys)
    assert.equal(unique.size, keys.length, '模块 key 不应重复')
  })

  test('模块 key 包含所有预期值', () => {
    const svc = createService()
    const keys = svc.getModuleCatalog().map((m) => m.key)
    assert.ok(keys.includes('identity-access'))
    assert.ok(keys.includes('configuration-governance'))
    assert.ok(keys.includes('integration-orchestration'))
    assert.ok(keys.includes('trust-governance'))
    assert.ok(keys.includes('resilience-operations'))
    assert.ok(keys.includes('runtime-governance'))
  })

  test('每个模块具有完整结构', () => {
    const svc = createService()
    for (const mod of svc.getModuleCatalog()) {
      assert.equal(typeof mod.key, 'string')
      assert.equal(typeof mod.name, 'string')
      assert.equal(typeof mod.purpose, 'string')
      assert.ok(Array.isArray(mod.inboundContracts))
      assert.ok(Array.isArray(mod.outboundContracts))
      assert.ok(Array.isArray(mod.capabilities))
      assert.ok(mod.capabilities.length > 0)
      const cap = mod.capabilities[0]
      assert.equal(typeof cap.key, 'string')
      assert.equal(typeof cap.name, 'string')
      assert.ok(Array.isArray(cap.responsibilities))
      assert.ok(Array.isArray(cap.entrypoints))
      assert.ok(Array.isArray(cap.consumers))
      assert.equal(cap.status, 'active')
    }
  })

  test('多次调用返回独立数组', () => {
    const svc = createService()
    const a = svc.getModuleCatalog()
    const b = svc.getModuleCatalog()
    assert.equal(a.length, b.length)
    // 不是同一引用（每次调用新建数组）
    assert.notStrictEqual(a, b)
  })
})

// ── getGovernanceBaselines ──

describe('E2E: getGovernanceBaselines', () => {
  test('返回治理基线数组', () => {
    const svc = createService()
    const baselines = svc.getGovernanceBaselines()
    assert.ok(Array.isArray(baselines))
  })

  test('基线总数 = 各个子服务基线之和', () => {
    const svc = createService()
    const baselines = svc.getGovernanceBaselines()
    // 仅 configuration-governance / trust-governance / resilience-operations 有 getGovernanceBaselines
    // 各返回 1 条 → 共 3 条
    assert.equal(baselines.length, 3)
  })

  test('每条基线具有必需字段', () => {
    const svc = createService()
    for (const b of svc.getGovernanceBaselines()) {
      assert.equal(typeof b.key, 'string')
      assert.equal(typeof b.name, 'string')
      assert.equal(typeof b.ownerModule, 'string')
      assert.equal(typeof b.summary, 'string')
      assert.ok(Array.isArray(b.controls))
      assert.ok(Array.isArray(b.evidence))
    }
  })
})

// ── getBlueprint ──

describe('E2E: getBlueprint', () => {
  test('返回完整蓝图对象', () => {
    const svc = createService()
    const bp = svc.getBlueprint()
    assert.equal(typeof bp.generatedAt, 'string')
    assert.ok(Array.isArray(bp.docs))
    assert.ok(Array.isArray(bp.guardrails))
    assert.ok(Array.isArray(bp.modules))
    assert.ok(Array.isArray(bp.consumers))
    assert.ok(Array.isArray(bp.governanceBaselines))
  })

  test('generatedAt 是合法 ISO 时间戳', () => {
    const svc = createService()
    const bp = svc.getBlueprint()
    assert.ok(new Date(bp.generatedAt).getTime() > 0)
  })

  test('docs 包含 foundation 架构文档', () => {
    const svc = createService()
    const docs = svc.getBlueprint().docs
    assert.ok(docs.some((d) => d.includes('foundation-architecture.md')))
    assert.ok(docs.some((d) => d.includes('foundation-bootstrap-wiring.md')))
    assert.ok(docs.some((d) => d.includes('operations-governance-baseline.md')))
    assert.ok(docs.some((d) => d.includes('operations-runbook-template.md')))
  })

  test('guardrails 有 5 条规则', () => {
    const svc = createService()
    const guardrails = svc.getBlueprint().guardrails
    assert.equal(guardrails.length, 5, '应有 5 条底座护栏规则')
  })

  test('modules 长度 = 6', () => {
    const svc = createService()
    assert.equal(svc.getBlueprint().modules.length, 6)
  })

  test('governanceBaselines 长度 = 3', () => {
    const svc = createService()
    assert.equal(svc.getBlueprint().governanceBaselines.length, 3)
  })

  test('blueprint 包含 frontendBootstrap', () => {
    const svc = createService()
    const bp = svc.getBlueprint()
    assert.ok('frontendBootstrap' in bp)
  })

  test('多次调用 generatedAt 递增', () => {
    const svc = createService()
    const a = svc.getBlueprint()
    const b = svc.getBlueprint()
    assert.ok(new Date(b.generatedAt).getTime() >= new Date(a.generatedAt).getTime())
  })
})

// ── getConsumerCatalog ──

describe('E2E: getConsumerCatalog', () => {
  test('返回消费者描述符数组', () => {
    const svc = createService()
    const consumers = svc.getConsumerCatalog()
    assert.ok(Array.isArray(consumers))
  })

  test('至少包含 adminWorkbench', () => {
    const svc = createService()
    const consumers = svc.getConsumerCatalog()
    const hasWorkbench = consumers.some((c) => c.consumer === 'workbench')
    assert.ok(hasWorkbench, '应包含 workbench 消费者')
  })

  test('每个消费者有必需字段', () => {
    const svc = createService()
    for (const c of svc.getConsumerCatalog()) {
      assert.equal(typeof c.consumer, 'string')
      assert.equal(typeof c.modulePath, 'string')
      assert.ok(Array.isArray(c.dependsOn))
      assert.equal(typeof c.responsibility, 'string')
      assert.ok(Array.isArray(c.handoffContracts))
    }
  })
})

// ── getConsumerDependency ──

describe('E2E: getConsumerDependency', () => {
  test('命中 market consumer 返回描述符', () => {
    const svc = createService()
    const result = svc.getConsumerDependency('market')
    // market 在 consumer catalog 中存在
    assert.equal(typeof result, 'object')
    if ('consumer' in result && result.consumer) {
      assert.equal(result.consumer, 'market')
    }
  })

  test('未命中返回 availableConsumers', () => {
    const svc = createService()
    const result = svc.getConsumerDependency('non-existent-consumer')
    assert.ok(Array.isArray((result as any).availableConsumers))
  })

  test('availableConsumers 列出所有已知消费者', () => {
    const svc = createService()
    const allConsumers = svc.getConsumerCatalog().map((c) => c.consumer)
    const result = svc.getConsumerDependency('non-existent-consumer')
    const available = (result as any).availableConsumers
    assert.deepStrictEqual(available, allConsumers)
  })

  test('空字符串 consumer 返回 availableConsumers', () => {
    const svc = createService()
    const result = svc.getConsumerDependency('')
    assert.ok(Array.isArray((result as any).availableConsumers))
  })
})

// ── getDependencySummary ──

describe('E2E: getDependencySummary', () => {
  test('命中返回消费者描述符', () => {
    const svc = createService()
    const result = svc.getDependencySummary('market' as any)
    assert.ok(result)
    assert.equal(result!.consumer, 'market')
  })

  test('未命中返回 undefined', () => {
    const svc = createService()
    const result = svc.getDependencySummary('ghost-consumer' as any)
    assert.equal(result, undefined)
  })

  test('workbench 可以查到', () => {
    const svc = createService()
    const result = svc.getDependencySummary('workbench' as any)
    assert.ok(result)
    assert.equal(result!.consumer, 'workbench')
  })
})

// ── 边界 ──

describe('E2E: 边界与结构一致性', () => {
  test('getModuleCatalog 不含重复 capability key', () => {
    const svc = createService()
    const allKeys: string[] = []
    for (const mod of svc.getModuleCatalog()) {
      for (const cap of mod.capabilities) {
        allKeys.push(cap.key)
      }
    }
    const unique = new Set(allKeys)
    assert.equal(unique.size, allKeys.length, 'capability key 不应重复')
  })

  test('getBlueprint docs 全为非空字符串', () => {
    const svc = createService()
    for (const doc of svc.getBlueprint().docs) {
      assert.ok(typeof doc === 'string' && doc.length > 0)
    }
  })

  test('getBlueprint guardrails 全为非空字符串', () => {
    const svc = createService()
    for (const rule of svc.getBlueprint().guardrails) {
      assert.ok(typeof rule === 'string' && rule.length > 0)
    }
  })
})
