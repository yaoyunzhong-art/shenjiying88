import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cross-module] [D] controller spec 补全
 *
 * CrossModuleController 综合测试：
 * - 正例：各路由正常委托/返回值
 * - 反例：无效链路、空输入、不存在链路
 * - 边界：空报文、重复验证、租户隔离、链路状态流转闭环
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CrossModuleController } from './cross-module.controller'
import type { CrossModuleChain } from './cross-module.entity'
import { ChainStatus } from './cross-module.entity'

// ── Mock Service ──

class MockCrossModuleService {
  private chains: CrossModuleChain[] = [
    { name: 'admin-to-consumer', description: '', modules: ['tenant', 'bootstrap', 'foundation', 'portal', 'market', 'miniapp'], status: ChainStatus.Defined },
    { name: 'sdk-to-api', description: '', modules: ['sdk', 'api', 'lyt', 'member'], status: ChainStatus.Defined },
    { name: 'governance-chain', description: '', modules: ['configuration-governance', 'identity-access', 'trust-governance', 'runtime-governance', 'resilience-operations'], status: ChainStatus.Defined },
    { name: 'multi-client-consistency', description: '', modules: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'api'], status: ChainStatus.Defined },
  ]

  private lastVerifiedAt?: string
  private callHistory: string[] = []

  _getCallHistory(): string[] {
    return this.callHistory
  }

  _setChainStatus(name: string, status: ChainStatus) {
    const chain = this.chains.find(c => c.name === name)
    if (chain) chain.status = status
  }

  _reset() {
    this.chains.forEach(c => { c.status = ChainStatus.Defined; c.lastVerifiedAt = undefined; c.brokenNodes = undefined })
    this.lastVerifiedAt = undefined
    this.callHistory = []
  }

  listChains() { this.callHistory.push('listChains'); return this.chains }
  getSummary() {
    this.callHistory.push('getSummary')
    const total = this.chains.length
    const defined = this.chains.filter(c => c.status === ChainStatus.Defined).length
    const validating = this.chains.filter(c => c.status === ChainStatus.Validating).length
    const verified = this.chains.filter(c => c.status === ChainStatus.Verified).length
    const broken = this.chains.filter(c => c.status === ChainStatus.Broken).length
    return { total, defined, validating, verified, broken }
  }
  async validate(chainNames?: string[], context?: Record<string, string>) {
    this.callHistory.push('validate')
    const targets = chainNames ? this.chains.filter(c => chainNames.includes(c.name)) : this.chains
    return targets.map(chain => {
      const passed = true
      chain.status = passed ? ChainStatus.Verified : ChainStatus.Broken
      chain.lastVerifiedAt = new Date().toISOString()
      return {
        chainName: chain.name,
        passed,
        stages: chain.modules.slice(0, -1).map((_, i) => ({
          stage: `stage-${i + 1}`,
          from: chain.modules[i],
          to: chain.modules[i + 1],
          passed: true,
          durationMs: 5
        })),
        executedAt: new Date().toISOString(),
        durationMs: chain.modules.length * 5
      }
    })
  }
  checkAllVerified() { this.callHistory.push('checkAllVerified'); return this.chains.length > 0 && this.chains.every(c => c.status === ChainStatus.Verified) }
  checkHasBroken() { this.callHistory.push('checkHasBroken'); return this.chains.some(c => c.status === ChainStatus.Broken) }
  resetAll() {
    this.callHistory.push('resetAll')
    this.chains.forEach(c => { c.status = ChainStatus.Defined; c.lastVerifiedAt = undefined; c.brokenNodes = undefined })
  }
}

// ── Route Metadata ──

describe('cross-module controller 路由元数据', () => {
  it('controller path = "cross-module"', () => {
    const path = Reflect.getMetadata('path', CrossModuleController)
    assert.equal(path, 'cross-module')
  })

  const routes: [string, string, number][] = [
    ['getChainStatus', 'chain-status', 0],   // GET
    ['getSummary', 'summary', 0],            // GET
    ['getAllVerified', 'all-verified', 0],   // GET
    ['getHasBroken', 'has-broken', 0],       // GET
    ['validate', 'validate', 1],             // POST
    ['validateChain', 'validate/:chainName', 1], // POST
    ['resetAll', 'reset', 1],                // POST
  ]

  for (const [method, path, expectedMethod] of routes) {
    it(`${method} -> ${path} (method=${expectedMethod})`, () => {
      const m = Reflect.getMetadata('method', CrossModuleController.prototype[method as keyof CrossModuleController])
      const p = Reflect.getMetadata('path', CrossModuleController.prototype[method as keyof CrossModuleController])
      assert.equal(m, expectedMethod, `${method} method mismatch`)
      assert.equal(p, path, `${method} path mismatch`)
    })
  }
})

// ── 正例 ──

describe('getChainStatus() 正例', () => {
  it('返回 4 条链路', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.getChainStatus()
    assert.equal(result.chains.length, 4)
    assert.equal(result.total, 4)
    assert.equal(result.runtime, 'cross-module-e2e')
  })

  it('每条链包含必填字段', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.getChainStatus()
    for (const chain of result.chains) {
      assert.ok(typeof chain.name === 'string' && chain.name.length > 0)
      assert.ok(Array.isArray(chain.modules) && chain.modules.length > 0)
      assert.ok(typeof chain.status === 'string')
    }
  })

  it('委托给 service.listChains', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    ctrl.getChainStatus()
    assert.ok(svc._getCallHistory().includes('listChains'))
  })
})

describe('getSummary() 正例', () => {
  it('返回全部 defined=4', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const summary = ctrl.getSummary()
    assert.deepEqual(summary, { total: 4, defined: 4, validating: 0, verified: 0, broken: 0 })
  })

  it('委托给 service.getSummary', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    ctrl.getSummary()
    assert.ok(svc._getCallHistory().includes('getSummary'))
  })
})

describe('getAllVerified() 正例', () => {
  it('初始 false（defined 未 verified）', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.getAllVerified()
    assert.equal(result.allVerified, false)
    assert.ok(typeof result.checkedAt === 'string')
  })

  it('验证后 true', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    await ctrl.validate({})
    const result = ctrl.getAllVerified()
    assert.equal(result.allVerified, true)
  })

  it('委托给 service.checkAllVerified', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    ctrl.getAllVerified()
    assert.ok(svc._getCallHistory().includes('checkAllVerified'))
  })
})

describe('getHasBroken() 正例', () => {
  it('初始 false', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.getHasBroken()
    assert.equal(result.hasBroken, false)
  })

  it('将一条链路设为 broken 后 true', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    svc._setChainStatus('sdk-to-api', ChainStatus.Broken)
    const result = ctrl.getHasBroken()
    assert.equal(result.hasBroken, true)
  })

  it('委托给 service.checkHasBroken', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    ctrl.getHasBroken()
    assert.ok(svc._getCallHistory().includes('checkHasBroken'))
  })
})

describe('validate() 正例', () => {
  it('空 body 验证全部 4 链路', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({})
    assert.equal(results.length, 4)
    for (const r of results) {
      assert.equal(r.passed, true)
      assert.ok(r.chainName)
    }
  })

  it('指定单条链路', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({ chainNames: ['sdk-to-api'] })
    assert.equal(results.length, 1)
    assert.equal(results[0].chainName, 'sdk-to-api')
  })

  it('指定多链路', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({ chainNames: ['sdk-to-api', 'governance-chain'] })
    assert.equal(results.length, 2)
  })

  it('带 tenantId/storeId 上下文', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({ chainNames: ['admin-to-consumer'], tenantId: 't-ctx', storeId: 's-ctx', marketCode: 'CN' })
    assert.equal(results.length, 1)
    assert.equal(results[0].passed, true)
  })
})

describe('validateChain() 正例', () => {
  it('指定有效链路名返回单条结果', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = await ctrl.validateChain('admin-to-consumer', {})
    assert.ok(result)
    assert.equal(result!.chainName, 'admin-to-consumer')
    assert.equal(result!.passed, true)
  })

  it('结果包含 stages', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = await ctrl.validateChain('sdk-to-api', {})
    assert.ok(result)
    assert.ok(result!.stages.length >= 1)
    for (const stage of result!.stages) {
      assert.ok(stage.stage)
      assert.ok(stage.from)
      assert.ok(stage.to)
      assert.ok(typeof stage.durationMs === 'number')
    }
  })
})

describe('resetAll() 正例', () => {
  it('返回 reset:true + resetAt', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.resetAll()
    assert.equal(result.reset, true)
    assert.ok(typeof result.resetAt === 'string')
    assert.ok(new Date(result.resetAt).getTime() > 0)
  })

  it('委托给 service.resetAll', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    ctrl.resetAll()
    assert.ok(svc._getCallHistory().includes('resetAll'))
  })
})

// ── 反例 ──

describe('validate() 反例', () => {
  it('不存在的链路名返回空', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({ chainNames: ['ghost-chain', 'phantom'] })
    assert.equal(results.length, 0)
  })

  it('空 chainNames 数组返回空', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({ chainNames: [] })
    assert.equal(results.length, 0)
  })

  it('不存在 + 存在的混合只验证存在的', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const results = await ctrl.validate({ chainNames: ['sdk-to-api', 'nonexistent'] })
    assert.equal(results.length, 1)
    assert.equal(results[0].chainName, 'sdk-to-api')
  })
})

describe('validateChain() 反例', () => {
  it('不存在的链路名返回 null', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = await ctrl.validateChain('nonexistent-chain', {})
    assert.equal(result, null)
  })

  it('空字符串链路名返回 null', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = await ctrl.validateChain('', {})
    assert.equal(result, null)
  })
})

describe('getChainStatus() 反例', () => {
  it('不存在的链路 find 返回 undefined', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.getChainStatus()
    const ghost = result.chains.find(c => c.name === 'ghost')
    assert.equal(ghost, undefined)
  })

  it('链路列表中不应包含未知链路', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = ctrl.getChainStatus()
    const known = ['admin-to-consumer', 'sdk-to-api', 'governance-chain', 'multi-client-consistency']
    for (const chain of result.chains) {
      assert.ok(known.includes(chain.name), `unexpected chain: ${chain.name}`)
    }
  })
})

// ── 边界测试 ──

describe('状态流转边界', () => {
  it('初始 → validate → reset 闭环', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)

    // 初始
    assert.equal(ctrl.getAllVerified().allVerified, false)
    assert.equal(ctrl.getHasBroken().hasBroken, false)
    assert.equal(ctrl.getSummary().defined, 4)

    // validate
    await ctrl.validate({})
    assert.equal(ctrl.getAllVerified().allVerified, true)
    assert.equal(ctrl.getHasBroken().hasBroken, false)
    assert.equal(ctrl.getSummary().verified, 4)

    // reset
    ctrl.resetAll()
    assert.equal(ctrl.getAllVerified().allVerified, false)
    assert.equal(ctrl.getHasBroken().hasBroken, false)
    assert.equal(ctrl.getSummary().defined, 4)
  })

  it('部分验证 -> 其他仍 defined', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)

    await ctrl.validate({ chainNames: ['sdk-to-api'] })
    const summary = ctrl.getSummary()
    assert.equal(summary.verified, 1)
    assert.equal(summary.defined, 3)
  })

  it('单条 broken 影响 getHasBroken', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    svc._setChainStatus('governance-chain', ChainStatus.Broken)
    assert.equal(ctrl.getHasBroken().hasBroken, true)
    assert.equal(ctrl.getAllVerified().allVerified, false)
  })

  it('全部 broken 不影响 getHasBroken=true', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    for (const c of ['admin-to-consumer', 'sdk-to-api', 'governance-chain', 'multi-client-consistency']) {
      svc._setChainStatus(c, ChainStatus.Broken)
    }
    assert.equal(ctrl.getHasBroken().hasBroken, true)
    assert.equal(ctrl.getAllVerified().allVerified, false)
  })

  it('reset 清除 lastVerifiedAt 和 brokenNodes', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    await ctrl.validate({})
    ctrl.resetAll()
    const status = ctrl.getChainStatus()
    for (const chain of status.chains) {
      assert.equal(chain.lastVerifiedAt, undefined)
      assert.equal(chain.brokenNodes, undefined)
      assert.equal(chain.status, 'defined')
    }
  })
})

describe('重复验证幂等', () => {
  it('多次 validate 始终通过', async () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    for (let i = 0; i < 3; i++) {
      const results = await ctrl.validate({})
      assert.equal(results.length, 4)
      for (const r of results) {
        assert.equal(r.passed, true)
      }
    }
  })

  it('多次 reset 幂等', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    ctrl.resetAll()
    ctrl.resetAll()
    ctrl.resetAll()
    const summary = ctrl.getSummary()
    assert.equal(summary.defined, 4)
    assert.equal(summary.verified, 0)
  })
})

describe('validateChain stage 数量边界', () => {
  async function checkStages(chainName: string, expectedStages: number) {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    const result = await ctrl.validateChain(chainName, {})
    assert.ok(result)
    assert.equal(result!.stages.length, expectedStages, `${chainName} should have ${expectedStages} stages`)
  }

  it('admin-to-consumer 有 5 个阶段', () => checkStages('admin-to-consumer', 5))
  it('sdk-to-api 有 3 个阶段', () => checkStages('sdk-to-api', 3))
  it('governance-chain 有 4 个阶段', () => checkStages('governance-chain', 4))
  it('multi-client-consistency 有 4 个阶段', () => checkStages('multi-client-consistency', 4))
})

describe('ensure cross-module has mock coverage for all endpoints', () => {
  it('controller delegates to service and wraps result', () => {
    const svc = new MockCrossModuleService()
    const ctrl = new CrossModuleController(svc as any)
    assert.equal(ctrl.getChainStatus().total, 4)
    assert.ok(ctrl.getSummary().total === 4)
    assert.ok(typeof ctrl.getAllVerified().allVerified === 'boolean')
    assert.ok(typeof ctrl.getHasBroken().hasBroken === 'boolean')
    assert.ok(ctrl.resetAll().reset === true)
  })
})
