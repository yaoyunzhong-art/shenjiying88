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

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { CrossModuleController } from './cross-module.controller'
import { CrossModuleService } from './cross-module.service'
import {
  ChainStatus,
  toValidationSummary,
  isAllVerified,
  hasBrokenChain,
  type CrossModuleChain
} from './cross-module.entity'

function createController(overrides?: Partial<CrossModuleService>) {
  const service = overrides as CrossModuleService
  return new CrossModuleController(service ?? new CrossModuleService())
}

// ── 元数据测试 ──
test('cross-module controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', CrossModuleController)
  assert.equal(path, 'cross-module')
})

test('getChainStatus route has GET metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.getChainStatus)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.getChainStatus)
  assert.equal(method, 0) // GET = 0
  assert.equal(path, 'chain-status')
})

test('getSummary route has GET metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.getSummary)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.getSummary)
  assert.equal(method, 0) // GET = 0
  assert.equal(path, 'summary')
})

test('validate route has POST metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.validate)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.validate)
  assert.equal(method, 1) // POST = 1
  assert.equal(path, 'validate')
})

test('reset route has POST metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.resetAll)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.resetAll)
  assert.equal(method, 1) // POST = 1
  assert.equal(path, 'reset')
})

test('all-verified route has GET metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.getAllVerified)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.getAllVerified)
  assert.equal(method, 0) // GET = 0
  assert.equal(path, 'all-verified')
})

test('has-broken route has GET metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.getHasBroken)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.getHasBroken)
  assert.equal(method, 0) // GET = 0
  assert.equal(path, 'has-broken')
})

test('validate/:chainName route has POST metadata', () => {
  const method = Reflect.getMetadata('method', CrossModuleController.prototype.validateChain)
  const path = Reflect.getMetadata('path', CrossModuleController.prototype.validateChain)
  assert.equal(method, 1) // POST = 1
  assert.equal(path, 'validate/:chainName')
})

// ── 正例: getChainStatus() ──
describe('getChainStatus() 正例', () => {
  test('returns 4 chains', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    assert.equal(result.chains.length, 4)
  })

  test('returns total = 4', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    assert.equal(result.total, 4)
  })

  test('runtime is cross-module-e2e', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    assert.equal(result.runtime, 'cross-module-e2e')
  })

  test('each chain has status "defined"', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    for (const chain of result.chains) {
      assert.equal(chain.status, 'defined')
    }
  })

  test('admin-to-consumer chain covers 6 modules', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const chain = result.chains.find(c => c.name === 'admin-to-consumer')
    assert.ok(chain)
    assert.equal(chain!.modules.length, 6)
  })

  test('admin-to-consumer 包含 tenant, portal, market', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const chain = result.chains.find(c => c.name === 'admin-to-consumer')
    assert.ok(chain)
    assert.ok(chain!.modules.includes('tenant'))
    assert.ok(chain!.modules.includes('portal'))
    assert.ok(chain!.modules.includes('market'))
  })

  test('sdk-to-api chain covers 4 modules', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const chain = result.chains.find(c => c.name === 'sdk-to-api')
    assert.ok(chain)
    assert.equal(chain!.modules.length, 4)
  })

  test('governance-chain covers 5 modules', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const chain = result.chains.find(c => c.name === 'governance-chain')
    assert.ok(chain)
    assert.equal(chain!.modules.length, 5)
  })

  test('multi-client-consistency chain covers 5 modules', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const chain = result.chains.find(c => c.name === 'multi-client-consistency')
    assert.ok(chain)
    assert.equal(chain!.modules.length, 5)
  })

  test('每次调用返回结果是幂等的', () => {
    const ctrl = createController()
    const r1 = ctrl.getChainStatus()
    const r2 = ctrl.getChainStatus()
    assert.deepEqual(r1, r2)
  })

  test('每个 chain 的 modules 数组非空', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    for (const chain of result.chains) {
      assert.ok(chain.modules.length > 0, `chain ${chain.name} should have modules`)
    }
  })
})

// ── 反例: getChainStatus() ──
describe('getChainStatus() 反例', () => {
  test('不存在的链路名 find 返回 undefined', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const notExist = result.chains.find(c => c.name === 'ghost-chain')
    assert.equal(notExist, undefined)
  })

  test('链路列表只包含 known 链路', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    const knownNames = ['admin-to-consumer', 'sdk-to-api', 'governance-chain', 'multi-client-consistency']
    for (const chain of result.chains) {
      assert.ok(knownNames.includes(chain.name), `unexpected chain: ${chain.name}`)
    }
  })

  test('channels 总数始终等于 total', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    assert.equal(result.chains.length, result.total)
  })

  test('runtime 不是其他值', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    assert.notEqual(result.runtime, 'production')
    assert.equal(result.runtime, 'cross-module-e2e')
  })
})

// ── 边界测试: getChainStatus() ──
describe('getChainStatus() 边界', () => {
  test('Chains 数量始终等于 4', () => {
    const ctrl = createController()
    for (let i = 0; i < 100; i++) {
      const result = ctrl.getChainStatus()
      assert.equal(result.chains.length, 4)
    }
  })

  test('每个链路模块名称都是字符串', () => {
    const ctrl = createController()
    const result = ctrl.getChainStatus()
    for (const chain of result.chains) {
      for (const mod of chain.modules) {
        assert.equal(typeof mod, 'string')
        assert.ok(mod.length > 0)
      }
    }
  })
})

// ── Entity 纯函数正例 ──
describe('toValidationSummary() 正例', () => {
  const sampleChains: CrossModuleChain[] = [
    { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Defined },
    { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Validating },
    { name: 'c', description: '', modules: ['m3'], status: ChainStatus.Verified },
    { name: 'd', description: '', modules: ['m4'], status: ChainStatus.Broken },
  ]

  test('返回正确的 total', () => {
    const summary = toValidationSummary(sampleChains)
    assert.equal(summary.total, 4)
  })

  test('返回正确的 defined 计数', () => {
    const summary = toValidationSummary(sampleChains)
    assert.equal(summary.defined, 1)
  })

  test('返回正确的 validating 计数', () => {
    const summary = toValidationSummary(sampleChains)
    assert.equal(summary.validating, 1)
  })

  test('返回正确的 verified 计数', () => {
    const summary = toValidationSummary(sampleChains)
    assert.equal(summary.verified, 1)
  })

  test('返回正确的 broken 计数', () => {
    const summary = toValidationSummary(sampleChains)
    assert.equal(summary.broken, 1)
  })

  test('全部 defined 场景', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Defined },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Defined },
    ]
    const summary = toValidationSummary(chains)
    assert.deepEqual(summary, { total: 2, defined: 2, validating: 0, verified: 0, broken: 0 })
  })

  test('全部 verified 场景', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Verified },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Verified },
    ]
    const summary = toValidationSummary(chains)
    assert.deepEqual(summary, { total: 2, defined: 0, validating: 0, verified: 2, broken: 0 })
  })

  test('混合状态场景', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Broken },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Broken },
      { name: 'c', description: '', modules: ['m3'], status: ChainStatus.Validating },
    ]
    const summary = toValidationSummary(chains)
    assert.deepEqual(summary, { total: 3, defined: 0, validating: 1, verified: 0, broken: 2 })
  })
})

// ── Entity 纯函数边界 ──
describe('toValidationSummary() 边界', () => {
  test('空数组返回全零', () => {
    const summary = toValidationSummary([])
    assert.deepEqual(summary, { total: 0, defined: 0, validating: 0, verified: 0, broken: 0 })
  })

  test('单项 defined', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Defined },
    ]
    const summary = toValidationSummary(chains)
    assert.deepEqual(summary, { total: 1, defined: 1, validating: 0, verified: 0, broken: 0 })
  })

  test('单项 broken', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Broken },
    ]
    const summary = toValidationSummary(chains)
    assert.deepEqual(summary, { total: 1, defined: 0, validating: 0, verified: 0, broken: 1 })
  })

  test('多项同一状态', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Validating },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Validating },
      { name: 'c', description: '', modules: ['m3'], status: ChainStatus.Validating },
    ]
    const summary = toValidationSummary(chains)
    assert.deepEqual(summary, { total: 3, defined: 0, validating: 3, verified: 0, broken: 0 })
  })
})

// ── isAllVerified() ──
describe('isAllVerified() 正例', () => {
  test('全部 verified 返回 true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Verified },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Verified },
    ]
    assert.equal(isAllVerified(chains), true)
  })

  test('有一个 broken 返回 false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Verified },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Broken },
    ]
    assert.equal(isAllVerified(chains), false)
  })

  test('有一个 defined 返回 false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Verified },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Defined },
    ]
    assert.equal(isAllVerified(chains), false)
  })
})

// ── isAllVerified() 边界 ──
describe('isAllVerified() 边界', () => {
  test('空数组返回 false', () => {
    assert.equal(isAllVerified([]), false)
  })

  test('单项 verified 返回 true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Verified },
    ]
    assert.equal(isAllVerified(chains), true)
  })

  test('全部 broken 返回 false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Broken },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Broken },
    ]
    assert.equal(isAllVerified(chains), false)
  })
})

// ── hasBrokenChain() ──
describe('hasBrokenChain() 正例', () => {
  test('有 broken 时返回 true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Verified },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Broken },
    ]
    assert.equal(hasBrokenChain(chains), true)
  })

  test('全部 broken 返回 true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Broken },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Broken },
    ]
    assert.equal(hasBrokenChain(chains), true)
  })

  test('无 broken 返回 false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Defined },
      { name: 'b', description: '', modules: ['m2'], status: ChainStatus.Verified },
    ]
    assert.equal(hasBrokenChain(chains), false)
  })
})

// ── hasBrokenChain() 边界 ──
describe('hasBrokenChain() 边界', () => {
  test('空数组返回 false', () => {
    assert.equal(hasBrokenChain([]), false)
  })

  test('单项 broken 返回 true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Broken },
    ]
    assert.equal(hasBrokenChain(chains), true)
  })

  test('单项 defined 返回 false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'a', description: '', modules: ['m1'], status: ChainStatus.Defined },
    ]
    assert.equal(hasBrokenChain(chains), false)
  })
})

// ── ChainStatus 枚举 ──
describe('ChainStatus 枚举', () => {
  test('包含四种状态', () => {
    assert.deepEqual(Object.values(ChainStatus), ['defined', 'validating', 'verified', 'broken'])
  })

  test('Defined 值为 "defined"', () => {
    assert.equal(ChainStatus.Defined, 'defined')
  })

  test('Broken 值为 "broken"', () => {
    assert.equal(ChainStatus.Broken, 'broken')
  })
})

// ── CrossModuleChain 类型构造 ──
describe('CrossModuleChain 构造', () => {
  test('完整的链路对象构造成功', () => {
    const chain: CrossModuleChain = {
      name: 'test-chain',
      description: '测试链路',
      modules: ['mod-a', 'mod-b'],
      status: ChainStatus.Defined,
      lastVerifiedAt: '2026-06-23T06:00:00Z',
      brokenNodes: ['mod-a'],
    }
    assert.equal(chain.name, 'test-chain')
    assert.equal(chain.modules.length, 2)
    assert.equal(chain.status, ChainStatus.Defined)
    assert.equal(chain.lastVerifiedAt, '2026-06-23T06:00:00Z')
    assert.ok(chain.brokenNodes?.includes('mod-a'))
  })

  test('最小的链路对象（无可选字段）构造成功', () => {
    const chain: CrossModuleChain = {
      name: 'minimal',
      description: '',
      modules: ['only'],
      status: ChainStatus.Defined,
    }
    assert.equal(chain.name, 'minimal')
    assert.equal(chain.lastVerifiedAt, undefined)
    assert.equal(chain.brokenNodes, undefined)
  })
})

// ── 新增 endpoint 测试 ──

describe('getSummary() 正例', () => {
  test('返回 summary 对象含 total/defined/verified/broken', () => {
    const ctrl = createController()
    const summary = ctrl.getSummary()
    assert.equal(summary.total, 4)
    assert.equal(summary.defined, 4)
    assert.equal(summary.validating, 0)
    assert.equal(summary.verified, 0)
    assert.equal(summary.broken, 0)
  })
})

describe('validate() 正例', () => {
  test('validate 全部链路返回 4 条结果', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({})
    assert.equal(results.length, 4)
    for (const r of results) {
      assert.equal(r.passed, true)
      assert.ok(r.stages.length > 0)
      assert.ok(r.chainName)
      assert.ok(r.executedAt)
      assert.ok(r.durationMs >= 0)
    }
  })

  test('validate 指定链路名只验证该链路', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['sdk-to-api'] })
    assert.equal(results.length, 1)
    assert.equal(results[0].chainName, 'sdk-to-api')
  })

  test('validate 指定多链路', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['sdk-to-api', 'governance-chain'] })
    assert.equal(results.length, 2)
  })
})

describe('validateChain() 正例', () => {
  test('validate 单条链路返回结果', async () => {
    const ctrl = createController()
    const result = await ctrl.validateChain('admin-to-consumer', {})
    assert.ok(result)
    assert.equal(result!.chainName, 'admin-to-consumer')
    assert.equal(result!.passed, true)
  })

  test('validate 不存在的链路返回 null', async () => {
    const ctrl = createController()
    const result = await ctrl.validateChain('nonexistent', {})
    assert.equal(result, null)
  })
})

describe('getAllVerified() 测试', () => {
  test('初始状态返回 false（链路由 defined 非 verified）', () => {
    const ctrl = createController()
    const result = ctrl.getAllVerified()
    assert.equal(result.allVerified, false)
    assert.ok(result.checkedAt)
  })

  test('验证后返回 true（simulate 全部通过，链路由变为 verified）', async () => {
    const ctrl = createController()
    await ctrl.validate({})
    const result = ctrl.getAllVerified()
    assert.equal(result.allVerified, true)
  })
})

describe('getHasBroken() 测试', () => {
  test('初始状态无 broken', () => {
    const ctrl = createController()
    const result = ctrl.getHasBroken()
    assert.equal(result.hasBroken, false)
  })

  test('验证后仍无 broken（simulate 全通过）', async () => {
    const ctrl = createController()
    await ctrl.validate({})
    const result = ctrl.getHasBroken()
    assert.equal(result.hasBroken, false)
  })
})

describe('resetAll() 测试', () => {
  test('reset 后返回 reset:true', () => {
    const ctrl = createController()
    const result = ctrl.resetAll()
    assert.equal(result.reset, true)
    assert.ok(result.resetAt)
  })

  test('reset 后链路回到 defined 状态', async () => {
    const ctrl = createController()
    await ctrl.validate({})
    ctrl.resetAll()
    const summary = ctrl.getSummary()
    assert.equal(summary.defined, 4)
    assert.equal(summary.verified, 0)
    assert.equal(summary.broken, 0)
  })

  test('多次 reset 幂等', () => {
    const ctrl = createController()
    const r1 = ctrl.resetAll()
    const r2 = ctrl.resetAll()
    // 两次 reset 结果一致
    assert.equal(r1.reset, true)
    assert.equal(r2.reset, true)
    const summary = ctrl.getSummary()
    assert.equal(summary.defined, 4)
  })
})

// ── validate 反例测试 ──
describe('validate() 反例', () => {
  test('validate 不存在的链路名返回空结果', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['ghost-chain', 'phantom-link'] })
    assert.equal(results.length, 0)
  })

  test('validate 空 chainNames 数组返回空（与 undefined 不同）', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: [] })
    // 空数组表示不匹配任何链路，返回空结果
    assert.equal(results.length, 0)
  })

  test('validate 不存在和存在混合只验证存在的', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['sdk-to-api', 'nonexistent'] })
    assert.equal(results.length, 1)
    assert.equal(results[0].chainName, 'sdk-to-api')
  })

  test('validate 带 tenantId/storeId 上下文', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({
      chainNames: ['admin-to-consumer'],
      tenantId: 't-context',
      storeId: 's-context',
      marketCode: 'JP'
    })
    assert.equal(results.length, 1)
    assert.equal(results[0].chainName, 'admin-to-consumer')
    assert.equal(results[0].passed, true)
  })

  test('validate 后 summary 全部为 verified', async () => {
    const ctrl = createController()
    await ctrl.validate({})
    const summary = ctrl.getSummary()
    assert.equal(summary.verified, 4)
    assert.equal(summary.defined, 0)
    assert.equal(summary.broken, 0)
  })
})

// ── validate 边界测试 ──
describe('validate() 边界', () => {
  test('验证结果 stages 数量 = modules.length - 1', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['sdk-to-api'] })
    // sdk-to-api 有 4 个模块 → 3 stages
    assert.equal(results[0].stages.length, 3)
  })

  test('governance-chain stages 数量 = 4', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['governance-chain'] })
    // governance-chain 有 5 个模块 → 4 stages
    assert.equal(results[0].stages.length, 4)
  })

  test('multi-client-consistency stages 数量 = 4', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['multi-client-consistency'] })
    assert.equal(results[0].stages.length, 4)
  })

  test('admin-to-consumer stages 数量 = 5', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['admin-to-consumer'] })
    assert.equal(results[0].stages.length, 5)
  })

  test('验证后链路 lastVerifiedAt 已设置', async () => {
    const ctrl = createController()
    const before = ctrl.getChainStatus()
    for (const c of before.chains) {
      assert.equal(c.lastVerifiedAt, undefined)
    }

    await ctrl.validate({})

    const after = ctrl.getChainStatus()
    for (const c of after.chains) {
      assert.ok(c.lastVerifiedAt)
      assert.ok(new Date(c.lastVerifiedAt!).getTime() > 0)
    }
  })

  test('验证后 brokenNodes 为 undefined（全通过）', async () => {
    const ctrl = createController()
    await ctrl.validate({})
    const status = ctrl.getChainStatus()
    for (const c of status.chains) {
      assert.equal(c.brokenNodes, undefined)
    }
  })

  test('validate 全部链路由当前返回 passed=true', async () => {
    const ctrl = createController()
    const results = await ctrl.validate({ chainNames: ['admin-to-consumer', 'sdk-to-api', 'governance-chain', 'multi-client-consistency'] })
    assert.equal(results.length, 4)
    for (const r of results) {
      assert.equal(r.passed, true)
    }
  })
})

// ── validateChain 反例和边界 ──
describe('validateChain() 反例与边界', () => {
  test('空字符串链路名返回 null', async () => {
    const ctrl = createController()
    const result = await ctrl.validateChain('', {})
    assert.equal(result, null)
  })

  test('带上下文传参不影响空结果', async () => {
    const ctrl = createController()
    const result = await ctrl.validateChain('ghost', { tenantId: 't-x', storeId: 's-x' })
    assert.equal(result, null)
  })

  test('validateChain 成功时返回 stage 详情', async () => {
    const ctrl = createController()
    const result = await ctrl.validateChain('sdk-to-api', {})
    assert.ok(result)
    assert.equal(result!.chainName, 'sdk-to-api')
    assert.ok(result!.stages.length >= 1)
    // 每个 stage 含必要字段
    for (const stage of result!.stages) {
      assert.ok(stage.stage)
      assert.ok(stage.from)
      assert.ok(stage.to)
      assert.equal(stage.passed, true)
      assert.ok(typeof stage.durationMs === 'number')
    }
  })
})

// ── summary/getAllVerified/getHasBroken 组合 ──
describe('状态流转组合校验', () => {
  test('初始 → validate → reset 闭环', async () => {
    const ctrl = createController()

    // 初始
    assert.equal(ctrl.getAllVerified().allVerified, false)
    assert.equal(ctrl.getHasBroken().hasBroken, false)

    // validate
    await ctrl.validate({})
    assert.equal(ctrl.getAllVerified().allVerified, true)
    assert.equal(ctrl.getHasBroken().hasBroken, false)

    // reset
    ctrl.resetAll()
    assert.equal(ctrl.getAllVerified().allVerified, false)
    assert.equal(ctrl.getHasBroken().hasBroken, false)
  })

  test('多次验证后单链路验证其他保持状态', async () => {
    const ctrl = createController()

    // 先验证 sdk-to-api
    await ctrl.validate({ chainNames: ['sdk-to-api'] })
    let chains = ctrl.getChainStatus().chains
    const sdk = chains.find(c => c.name === 'sdk-to-api')
    const gov = chains.find(c => c.name === 'governance-chain')
    assert.equal(sdk!.status, 'verified')
    assert.equal(gov!.status, 'defined')

    // 再验证全部
    await ctrl.validate({})
    chains = ctrl.getChainStatus().chains
    for (const c of chains) {
      assert.equal(c.status, 'verified')
    }
  })

  test('reset 清除 brokenNodes 和 lastVerifiedAt', async () => {
    const ctrl = createController()
    await ctrl.validate({})
    ctrl.resetAll()

    const chains = ctrl.getChainStatus().chains
    for (const c of chains) {
      assert.equal(c.lastVerifiedAt, undefined)
      assert.equal(c.brokenNodes, undefined)
      assert.equal(c.status, 'defined')
    }
  })
})
