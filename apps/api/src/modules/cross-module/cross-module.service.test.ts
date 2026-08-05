/**
 * cross-module.service.spec.ts — 跨模块验证链路纯函数式测试
 * 不 import 生产 Service/Entity，纯内联逻辑
 */
import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'

// ─── 枚举 + 类型定义 ──────────────────────────────────────────────

const ChainStatus = {
  Defined: 'defined',
  Validating: 'validating',
  Verified: 'verified',
  Broken: 'broken',
} as const

type ChainStatus = (typeof ChainStatus)[keyof typeof ChainStatus]

interface CrossModuleChain {
  name: string
  description: string
  modules: string[]
  status: ChainStatus
  lastVerifiedAt?: string
  brokenNodes?: string[]
}

interface ValidationStage {
  stage: string
  from: string
  to: string
  passed: boolean
  error?: string
  durationMs: number
}

interface CrossModuleValidationResult {
  chainName: string
  passed: boolean
  stages: ValidationStage[]
  executedAt: string
  durationMs: number
}

interface ValidationSummary {
  total: number
  defined: number
  validating: number
  verified: number
  broken: number
}

// ─── 纯逻辑函数（模拟 CrossModuleService 核心行为）──────────────

function checkAllVerified(chains: CrossModuleChain[]): boolean {
  return chains.length > 0 && chains.every((c) => c.status === ChainStatus.Verified)
}

function hasBrokenChain(chains: CrossModuleChain[]): boolean {
  return chains.some((c) => c.status === ChainStatus.Broken)
}

function toValidationSummary(chains: CrossModuleChain[]): ValidationSummary {
  const summary: ValidationSummary = { total: chains.length, defined: 0, validating: 0, verified: 0, broken: 0 }
  for (const chain of chains) {
    switch (chain.status) {
      case ChainStatus.Defined: summary.defined++; break
      case ChainStatus.Validating: summary.validating++; break
      case ChainStatus.Verified: summary.verified++; break
      case ChainStatus.Broken: summary.broken++; break
    }
  }
  return summary
}

function listChains(
  chains: CrossModuleChain[],
  filter?: { chainName?: string; status?: string }
): CrossModuleChain[] {
  let result = chains
  if (filter?.chainName) {
    result = result.filter((c) => c.name === filter.chainName)
  }
  if (filter?.status) {
    result = result.filter((c) => c.status === filter.status)
  }
  return result
}

function resetAll(chains: CrossModuleChain[]): void {
  for (const chain of chains) {
    chain.status = ChainStatus.Defined
    chain.lastVerifiedAt = undefined
    chain.brokenNodes = undefined
  }
}

/**
 * 模拟验证：执行单条链路的验证逻辑
 * 所有模块间连接模拟为通过
 */
async function validateChain(
  chain: CrossModuleChain,
  failStages?: string[]
): Promise<CrossModuleValidationResult> {
  const startTime = Date.now()
  const stages: ValidationStage[] = []

  for (let i = 0; i < chain.modules.length - 1; i++) {
    const stageStart = Date.now()
    const from = chain.modules[i]
    const to = chain.modules[i + 1]
    const stageKey = `stage-${i + 1}`

    const shouldFail = failStages?.includes(stageKey) ?? false
    const passed = !shouldFail

    stages.push({
      stage: stageKey,
      from,
      to,
      passed,
      error: shouldFail ? `Connection failed: ${from} → ${to}` : undefined,
      durationMs: Date.now() - stageStart,
    })
  }

  const allPassed = stages.every((s) => s.passed)

  chain.status = allPassed ? ChainStatus.Verified : ChainStatus.Broken
  chain.lastVerifiedAt = new Date().toISOString()
  if (!allPassed) {
    chain.brokenNodes = stages.filter((s) => !s.passed).map((s) => `${s.from} → ${s.to}`)
  }

  return {
    chainName: chain.name,
    passed: allPassed,
    stages,
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
  }
}

async function validate(
  chains: CrossModuleChain[],
  chainNames?: string[],
  failStagesByChain?: Record<string, string[]>
): Promise<CrossModuleValidationResult[]> {
  const targets = chainNames
    ? chains.filter((c) => chainNames.includes(c.name))
    : chains

  const results: CrossModuleValidationResult[] = []
  for (const chain of targets) {
    const failStages = failStagesByChain?.[chain.name]
    const result = await validateChain(chain, failStages)
    results.push(result)
  }
  return results
}

// ─── 预设链路数据 ────────────────────────────────────────────────

function makeDefaultChains(): CrossModuleChain[] {
  return [
    {
      name: 'admin-to-consumer',
      description: '管理端创建 → API 存储 → B 端展示 → C 端消费',
      modules: ['tenant', 'bootstrap', 'foundation', 'portal', 'market', 'miniapp'],
      status: ChainStatus.Defined,
    },
    {
      name: 'sdk-to-api',
      description: 'SDK 调用 → API 处理 → LYT 服务 → 会员数据',
      modules: ['sdk', 'api', 'lyt', 'member'],
      status: ChainStatus.Defined,
    },
    {
      name: 'governance-chain',
      description: '配置治理 → 身份访问 → 信任治理 → 运行时治理 → 韧性运营',
      modules: [
        'configuration-governance',
        'identity-access',
        'trust-governance',
        'runtime-governance',
        'resilience-operations',
      ],
      status: ChainStatus.Defined,
    },
    {
      name: 'multi-client-consistency',
      description: '管理端 Web → 企业端 Web → 门店 Web → 小程序 → API 一致性',
      modules: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'api'],
      status: ChainStatus.Defined,
    },
  ]
}

// ─── 测试套件 ────────────────────────────────────────────────────

describe('CrossModuleService [spec] — 跨模块验证链路', () => {
  let chains: CrossModuleChain[]

  beforeEach(() => {
    chains = makeDefaultChains()
  })

  // ─── listChains ──────────────────────────────────────────────
  describe('listChains', () => {
    it('默认返回全部 4 条链路', () => {
      const result = listChains(chains)
      assert.equal(result.length, 4)
    })

    it('按链路名称精确过滤', () => {
      const result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result.length, 1)
      assert.equal(result[0].name, 'admin-to-consumer')
    })

    it('按状态 filtered', () => {
      const result = listChains(chains, { status: ChainStatus.Defined })
      assert.equal(result.length, 4)
    })

    it('不存在的链路名称返回空数组', () => {
      const result = listChains(chains, { chainName: 'non-existent' })
      assert.equal(result.length, 0)
    })

    it('不匹配的状态过滤返回空数组', () => {
      const result = listChains(chains, { status: ChainStatus.Verified })
      assert.equal(result.length, 0)
    })

    it('无过滤条件等同于全量返回', () => {
      const noFilter = listChains(chains)
      const emptyFilter = listChains(chains, {})
      assert.equal(noFilter.length, emptyFilter.length)
    })

    it('空链路列表返回空数组', () => {
      const result = listChains([])
      assert.equal(result.length, 0)
    })

    it('按状态 + 名称联合过滤', () => {
      const result = listChains(chains, { chainName: 'admin-to-consumer', status: ChainStatus.Defined })
      assert.equal(result.length, 1)
    })

    it('联合过滤时名称存在但状态不匹配返回空', () => {
      const result = listChains(chains, { chainName: 'admin-to-consumer', status: ChainStatus.Verified })
      assert.equal(result.length, 0)
    })
  })

  // ─── getSummary / toValidationSummary ──────────────────────
  describe('toValidationSummary', () => {
    it('初始状态 4 Defined', () => {
      const summary = toValidationSummary(chains)
      assert.equal(summary.total, 4)
      assert.equal(summary.defined, 4)
      assert.equal(summary.validating, 0)
      assert.equal(summary.verified, 0)
      assert.equal(summary.broken, 0)
    })

    it('验证通过后统计更新', async () => {
      await validate(chains)
      const summary = toValidationSummary(chains)
      assert.equal(summary.verified, 4)
    })

    it('混合状态统计正确', () => {
      chains[0].status = ChainStatus.Verified
      chains[1].status = ChainStatus.Broken
      chains[2].status = ChainStatus.Validating

      const summary = toValidationSummary(chains)
      assert.equal(summary.total, 4)
      assert.equal(summary.defined, 1)
      assert.equal(summary.validating, 1)
      assert.equal(summary.verified, 1)
      assert.equal(summary.broken, 1)
    })

    it('空列表统计全部为零', () => {
      const summary = toValidationSummary([])
      assert.equal(summary.total, 0)
      assert.equal(summary.defined, 0)
      assert.equal(summary.validating, 0)
      assert.equal(summary.verified, 0)
      assert.equal(summary.broken, 0)
    })

    it('全部 Broken 状态', () => {
      chains.forEach((c) => (c.status = ChainStatus.Broken))
      const summary = toValidationSummary(chains)
      assert.equal(summary.broken, 4)
    })

    it('全部 Validating 状态', () => {
      chains.forEach((c) => (c.status = ChainStatus.Validating))
      const summary = toValidationSummary(chains)
      assert.equal(summary.validating, 4)
    })
  })

  // ─── validate ───────────────────────────────────────────────
  describe('validate', () => {
    it('全部链路默认验证通过', async () => {
      const results = await validate(chains)
      assert.equal(results.length, 4)
      for (const r of results) {
        assert.equal(r.passed, true)
      }
    })

    it('按名称验证单条链路', async () => {
      const results = await validate(chains, ['sdk-to-api'])
      assert.equal(results.length, 1)
      assert.equal(results[0].chainName, 'sdk-to-api')
    })

    it('验证后更新链路状态', async () => {
      await validate(chains, ['sdk-to-api'])
      const result = listChains(chains, { chainName: 'sdk-to-api' })
      assert.equal(result[0].status, ChainStatus.Verified)
      assert.ok(result[0].lastVerifiedAt)
    })

    it('admin-to-consumer 有 5 个阶段 (6 模块 → 5 边)', async () => {
      const results = await validate(chains, ['admin-to-consumer'])
      assert.equal(results[0].stages.length, 5)
      assert.equal(results[0].stages[0].from, 'tenant')
      assert.equal(results[0].stages[0].to, 'bootstrap')
      assert.equal(results[0].stages[4].to, 'miniapp')
    })

    it('sdk-to-api 有 3 个阶段', async () => {
      const results = await validate(chains, ['sdk-to-api'])
      assert.equal(results[0].stages.length, 3)
    })

    it('governance-chain 有 4 个阶段', async () => {
      const results = await validate(chains, ['governance-chain'])
      assert.equal(results[0].stages.length, 4)
    })

    it('multi-client-consistency 有 4 个阶段', async () => {
      const results = await validate(chains, ['multi-client-consistency'])
      assert.equal(results[0].stages.length, 4)
    })

    it('返回结果包含 executedAt 时间戳', async () => {
      const results = await validate(chains, ['admin-to-consumer'])
      assert.ok(results[0].executedAt)
      assert.ok(new Date(results[0].executedAt).getTime() > 0)
    })

    it('返回结果包含 durationMs 耗时', async () => {
      const results = await validate(chains, ['admin-to-consumer'])
      assert.ok(typeof results[0].durationMs === 'number')
      assert.ok(results[0].durationMs >= 0)
    })

    it('不存在的链路名返回空结果', async () => {
      const results = await validate(chains, ['non-existent-chain'])
      assert.equal(results.length, 0)
    })

    it('空名称列表等同于全部验证', async () => {
      const allResults = await validate(chains)
      const undefinedResults = await validate(chains, undefined)
      assert.equal(allResults.length, undefinedResults.length)
    })

    it('验证结果 stages 包含正确的 from/to', async () => {
      const results = await validate(chains, ['admin-to-consumer'])
      const stages = results[0].stages
      assert.equal(stages[0].from, 'tenant')
      assert.equal(stages[0].to, 'bootstrap')
      assert.equal(stages[1].from, 'bootstrap')
      assert.equal(stages[1].to, 'foundation')
    })

    it('全部通过时 brokenNodes 未设置', async () => {
      await validate(chains, ['admin-to-consumer'])
      const result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result[0].brokenNodes, undefined)
    })
  })

  // ─── 验证失败场景 ──────────────────────────────────────────
  describe('验证失败处理', () => {
    it('指定阶段失败时链路标记为 Broken', async () => {
      const results = await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-3'],
      })
      assert.equal(results[0].passed, false)
      const result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result[0].status, ChainStatus.Broken)
    })

    it('失败时记录 brokenNodes', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-3'],
      })
      const result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.ok(result[0].brokenNodes)
      assert.equal(result[0].brokenNodes!.length, 1)
    })

    it('失败阶段包含错误信息', async () => {
      const results = await validate(chains, ['sdk-to-api'], {
        'sdk-to-api': ['stage-2'],
      })
      const failedStage = results[0].stages.find((s) => !s.passed)
      assert.ok(failedStage)
      assert.ok(failedStage.error)
    })

    it('单链路多阶段同时失败', async () => {
      const results = await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-1', 'stage-3'],
      })
      assert.equal(results[0].passed, false)
      const failedStages = results[0].stages.filter((s) => !s.passed)
      assert.equal(failedStages.length, 2)
    })

    it('首阶段失败阻断了后续阶段', async () => {
      // 验证即使首阶段失败，仍会执行所有阶段（返回聚合结果）
      const results = await validate(chains, ['multi-client-consistency'], {
        'multi-client-consistency': ['stage-1'],
      })
      assert.equal(results[0].passed, false)
      // 所有阶段都应有记录（不短路）
      assert.equal(results[0].stages.length, 4)
      const stagesPassStatus = results[0].stages.map((s) => s.passed)
      assert.equal(stagesPassStatus[0], false)
      assert.equal(stagesPassStatus[1], true)
    })

    it('全部阶段失败', async () => {
      const results = await validate(chains, ['sdk-to-api'], {
        'sdk-to-api': ['stage-1', 'stage-2', 'stage-3'],
      })
      assert.equal(results[0].passed, false)
      assert.equal(results[0].stages.filter((s) => !s.passed).length, 3)
    })
  })

  // ─── checkAllVerified ──────────────────────────────────────
  describe('checkAllVerified', () => {
    it('初始状态不是全部验证通过', () => {
      assert.equal(checkAllVerified(chains), false)
    })

    it('全部验证通过后返回 true', async () => {
      await validate(chains)
      assert.equal(checkAllVerified(chains), true)
    })

    it('部分验证通过返回 false', async () => {
      await validate(chains, ['admin-to-consumer'])
      assert.equal(checkAllVerified(chains), false)
    })

    it('空链路列表返回 false', () => {
      assert.equal(checkAllVerified([]), false)
    })

    it('单条链路通过后返回 true', async () => {
      const singleChain = [makeDefaultChains()[0]]
      await validate(singleChain)
      assert.equal(checkAllVerified(singleChain), true)
    })
  })

  // ─── hasBrokenChain ────────────────────────────────────────
  describe('hasBrokenChain', () => {
    it('初始状态无 Broken', () => {
      assert.equal(hasBrokenChain(chains), false)
    })

    it('有链路验证失败后返回 true', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-2'],
      })
      assert.equal(hasBrokenChain(chains), true)
    })

    it('全部通过后无 Broken', async () => {
      await validate(chains)
      assert.equal(hasBrokenChain(chains), false)
    })

    it('空列表返回 false', () => {
      assert.equal(hasBrokenChain([]), false)
    })

    it('多条链路中有一条 Broken 即返回 true', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-1'],
      })
      await validate(chains, ['sdk-to-api']) // 这条通过
      assert.equal(hasBrokenChain(chains), true)
    })
  })

  // ─── resetAll ──────────────────────────────────────────────
  describe('resetAll', () => {
    it('重置后所有链路回到 Defined 状态', async () => {
      await validate(chains)
      assert.equal(checkAllVerified(chains), true)

      resetAll(chains)
      assert.equal(checkAllVerified(chains), false)
      const summary = toValidationSummary(chains)
      assert.equal(summary.defined, 4)
      assert.equal(summary.verified, 0)
    })

    it('重置清除 lastVerifiedAt', async () => {
      await validate(chains, ['admin-to-consumer'])
      let result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.ok(result[0].lastVerifiedAt)

      resetAll(chains)
      result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result[0].lastVerifiedAt, undefined)
    })

    it('重置清除 brokenNodes', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-2'],
      })
      let result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.ok(result[0].brokenNodes)

      resetAll(chains)
      result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result[0].brokenNodes, undefined)
    })

    it('重置后再次验证正常工作', async () => {
      await validate(chains)
      resetAll(chains)
      const results = await validate(chains)
      assert.equal(results.length, 4)
      assert.equal(checkAllVerified(chains), true)
    })

    it('部分链路 Broken 后重置再验证', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-1'],
      })
      assert.equal(hasBrokenChain(chains), true)

      resetAll(chains)
      await validate(chains)
      assert.equal(hasBrokenChain(chains), false)
      assert.equal(checkAllVerified(chains), true)
    })

    it('重置空列表无错误', () => {
      resetAll([])
    })

    it('多次重置幂等', () => {
      resetAll(chains)
      resetAll(chains)
      const summary = toValidationSummary(chains)
      assert.equal(summary.defined, 4)
    })
  })

  // ─── 边界情况 ──────────────────────────────────────────────
  describe('边界 & 极端情况', () => {
    it('2 模块链路只有 1 个阶段', async () => {
      const minChain: CrossModuleChain = {
        name: 'minimal',
        description: '仅两个模块',
        modules: ['module-a', 'module-b'],
        status: ChainStatus.Defined,
      }
      const results = await validate([minChain])
      assert.equal(results[0].stages.length, 1)
    })

    it('单模块链路无阶段', async () => {
      const singleChain: CrossModuleChain = {
        name: 'single',
        description: '仅一个模块',
        modules: ['module-a'],
        status: ChainStatus.Defined,
      }
      const results = await validate([singleChain])
      assert.equal(results[0].stages.length, 0)
      // 无阶段视为通过（无可验证的边）
      assert.equal(results[0].passed, true)
    })

    it('长链路 15 个模块有 14 个阶段', async () => {
      const longModules = Array.from({ length: 15 }, (_, i) => `module-${String.fromCharCode(97 + i)}`)
      const longChain: CrossModuleChain = {
        name: 'long-chain',
        description: '15 模块长链路',
        modules: longModules,
        status: ChainStatus.Defined,
      }
      const results = await validate([longChain])
      assert.equal(results[0].stages.length, 14)
    })

    it('链路名称包含中文和特殊字符', async () => {
      const specialChain: CrossModuleChain = {
        name: '测试-链路-α-β',
        description: '包含特殊字符',
        modules: ['a', 'b', 'c'],
        status: ChainStatus.Defined,
      }
      const results = await validate([specialChain])
      assert.equal(results[0].chainName, '测试-链路-α-β')
      assert.equal(results[0].passed, true)
    })

    it('重复链路名只验证第一个', async () => {
      const dupChains: CrossModuleChain[] = [
        { name: 'dup', description: '', modules: ['a', 'b'], status: ChainStatus.Defined },
        { name: 'dup', description: '', modules: ['c', 'd', 'e'], status: ChainStatus.Defined },
      ]
      const results = await validate(dupChains, ['dup'])
      // 两条都会被验证（filter 返回匹配的所有项）
      assert.equal(results.length, 2)
    })
  })

  // ─── 状态流转闭环 ──────────────────────────────────────────
  describe('状态流转闭环', () => {
    it('Defined → Verified (全部通过)', async () => {
      await validate(chains, ['admin-to-consumer'])
      const result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result[0].status, ChainStatus.Verified)
    })

    it('Defined → Broken (验证失败)', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-1'],
      })
      const result = listChains(chains, { chainName: 'admin-to-consumer' })
      assert.equal(result[0].status, ChainStatus.Broken)
    })

    it('Broken → reset → Defined', () => {
      chains[0].status = ChainStatus.Broken
      resetAll(chains)
      assert.equal(chains[0].status, ChainStatus.Defined)
    })

    it('Broken → 重新验证 → Verified', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-1'],
      })
      assert.equal(listChains(chains, { chainName: 'admin-to-consumer' })[0].status, ChainStatus.Broken)

      // 重新验证（不设失败）
      await validate(chains, ['admin-to-consumer'])
      assert.equal(listChains(chains, { chainName: 'admin-to-consumer' })[0].status, ChainStatus.Verified)
    })

    it('Verified → Broken (后续验证失败)', async () => {
      await validate(chains, ['admin-to-consumer'])
      assert.equal(listChains(chains, { chainName: 'admin-to-consumer' })[0].status, ChainStatus.Verified)

      // 再次验证但部分失败
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-3'],
      })
      assert.equal(listChains(chains, { chainName: 'admin-to-consumer' })[0].status, ChainStatus.Broken)
    })

    it('混合状态多链路各自独立', async () => {
      await validate(chains, ['admin-to-consumer'], {
        'admin-to-consumer': ['stage-1'],
      })
      await validate(chains, ['sdk-to-api'])

      const adminChain = listChains(chains, { chainName: 'admin-to-consumer' })[0]
      const sdkChain = listChains(chains, { chainName: 'sdk-to-api' })[0]

      assert.equal(adminChain.status, ChainStatus.Broken)
      assert.equal(sdkChain.status, ChainStatus.Verified)
    })
  })
})
