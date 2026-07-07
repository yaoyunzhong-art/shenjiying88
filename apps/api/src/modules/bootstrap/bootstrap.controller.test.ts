import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
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

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  BootstrapPhase,
  toBootstrapHealth,
  toBootstrapMetadata,
} from './bootstrap.entity'
import type {
  BootstrapHealth,
  BootstrapMetadata,
  RegionalLoginPolicy,
  BootstrapConsumerDependency,
} from './bootstrap.entity'

// ── BootstrapPhase 枚举 ──
describe('BootstrapPhase 枚举', () => {
  it('包含 scaffold / provision / handoff / ready', () => {
    assert.equal(BootstrapPhase.Scaffold, 'scaffold')
    assert.equal(BootstrapPhase.Provision, 'provision')
    assert.equal(BootstrapPhase.Handoff, 'handoff')
    assert.equal(BootstrapPhase.Ready, 'ready')
  })

  it('共 4 个枚举值', () => {
    assert.equal(Object.values(BootstrapPhase).length, 4)
  })

  it('枚举值均为不同字符串', () => {
    const values = Object.values(BootstrapPhase)
    const unique = new Set(values)
    assert.equal(unique.size, values.length)
  })
})

// ── toBootstrapHealth factory ──
describe('toBootstrapHealth factory', () => {
  it('默认构造：status=ok, phase=Scaffold, uptime≥0, checkedAt 合法 ISO', () => {
    const health = toBootstrapHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.phase, BootstrapPhase.Scaffold)
    assert.equal(typeof health.uptime, 'number')
    assert.ok(health.uptime >= 0)
    assert.ok(typeof health.checkedAt === 'string')
    assert.ok(new Date(health.checkedAt).getTime() > 0)
  })

  it('覆盖 status=degraded', () => {
    const health = toBootstrapHealth({ status: 'degraded' })
    assert.equal(health.status, 'degraded')
    assert.equal(health.phase, BootstrapPhase.Scaffold)
  })

  it('覆盖 status=error', () => {
    const health = toBootstrapHealth({ status: 'error' })
    assert.equal(health.status, 'error')
  })

  it('覆盖 phase=Ready', () => {
    const health = toBootstrapHealth({ phase: BootstrapPhase.Ready })
    assert.equal(health.phase, BootstrapPhase.Ready)
  })

  it('覆盖 uptime', () => {
    assert.equal(toBootstrapHealth({ uptime: 9999 }).uptime, 9999)
  })

  it('覆盖 checkedAt', () => {
    const custom = '2025-01-01T00:00:00.000Z'
    assert.equal(toBootstrapHealth({ checkedAt: custom }).checkedAt, custom)
  })

  it('多次调用返回独立对象', () => {
    const a = toBootstrapHealth()
    const b = toBootstrapHealth({ status: 'degraded' })
    assert.notStrictEqual(a, b)
    assert.notEqual(a.status, b.status)
  })
})

// ── toBootstrapMetadata factory ──
describe('toBootstrapMetadata factory', () => {
  it('默认构造：空依赖、空契约、Scaffold、有 generatedAt', () => {
    const meta = toBootstrapMetadata({ tenantId: 't-meta' })
    assert.equal(meta.tenantContext.tenantId, 't-meta')
    assert.deepStrictEqual(meta.foundationDependencies, [])
    assert.deepStrictEqual(meta.foundationContracts, [])
    assert.equal(meta.phase, BootstrapPhase.Scaffold)
    assert.ok(meta.generatedAt)
  })

  it('覆盖依赖列表', () => {
    const deps = ['identity-access', 'configuration-governance'] as any[]
    const meta = toBootstrapMetadata(
      { tenantId: 't-deps' },
      { foundationDependencies: deps },
    )
    assert.equal(meta.foundationDependencies.length, 2)
    assert.ok(meta.foundationDependencies.includes('identity-access' as any))
  })

  it('覆盖契约列表', () => {
    const contracts = ['identity.contract', 'config.contract']
    const meta = toBootstrapMetadata(
      { tenantId: 't-contracts' },
      { foundationContracts: contracts },
    )
    assert.equal(meta.foundationContracts.length, 2)
    assert.equal(meta.foundationContracts[0], 'identity.contract')
  })

  it('覆盖 phase=Ready', () => {
    const meta = toBootstrapMetadata(
      { tenantId: 't-phase' },
      { phase: BootstrapPhase.Ready },
    )
    assert.equal(meta.phase, BootstrapPhase.Ready)
  })

  it('覆盖 generatedAt', () => {
    const meta = toBootstrapMetadata(
      { tenantId: 't-time' },
      { generatedAt: '2026-06-23T06:00:00.000Z' },
    )
    assert.equal(meta.generatedAt, '2026-06-23T06:00:00.000Z')
  })

  it('完整 tenantContext 透传', () => {
    const fullCtx = {
      tenantId: 't-full',
      brandId: 'b-full',
      storeId: 's-full',
      marketCode: 'jp-east',
    }
    const meta = toBootstrapMetadata(fullCtx)
    assert.equal(meta.tenantContext.tenantId, 't-full')
    assert.equal(meta.tenantContext.brandId, 'b-full')
    assert.equal(meta.tenantContext.storeId, 's-full')
    assert.equal(meta.tenantContext.marketCode, 'jp-east')
  })

  it('最小 tenantContext（仅 tenantId）brandId/storeId 为 undefined', () => {
    const meta = toBootstrapMetadata({ tenantId: 't-min' })
    assert.equal(meta.tenantContext.tenantId, 't-min')
    assert.equal(meta.tenantContext.brandId, undefined)
    assert.equal(meta.tenantContext.storeId, undefined)
  })
})

// ── 实体接口类型验证 ──
describe('Bootstrap 实体接口类型验证', () => {
  it('BootstrapHealth 满足接口契约', () => {
    const health: BootstrapHealth = {
      status: 'ok',
      uptime: 12345.67,
      phase: BootstrapPhase.Scaffold,
      checkedAt: new Date().toISOString(),
    }
    assert.equal(health.status, 'ok')
    assert.equal(health.uptime, 12345.67)
    assert.equal(health.phase, 'scaffold')
    assert.ok(typeof health.checkedAt === 'string')
  })

  it('BootstrapMetadata 满足接口契约', () => {
    const metadata: BootstrapMetadata = {
      tenantContext: {
        tenantId: 't-cn',
        brandId: 'b-cn',
        storeId: 's-cn',
        marketCode: 'cn-mainland',
      },
      foundationDependencies: ['identity-access'] as any[],
      foundationContracts: ['identity.contract'],
      phase: BootstrapPhase.Handoff,
      generatedAt: new Date().toISOString(),
    }
    assert.equal(metadata.tenantContext.marketCode, 'cn-mainland')
    assert.equal(metadata.foundationDependencies[0], 'identity-access')
    assert.equal(metadata.phase, 'handoff')
  })

  it('RegionalLoginPolicy 满足接口契约', () => {
    const policy: RegionalLoginPolicy = {
      defaultLoginPath: '/auth/login',
      ssoEnabled: true,
      supportedMarkets: ['cn-mainland', 'us-default'],
    }
    assert.equal(policy.defaultLoginPath, '/auth/login')
    assert.equal(policy.ssoEnabled, true)
    assert.equal(policy.supportedMarkets.length, 2)
  })

  it('BootstrapConsumerDependency 满足接口契约', () => {
    const dep: BootstrapConsumerDependency = {
      consumerName: 'portal',
      dependsOn: ['identity-access', 'configuration-governance'] as any[],
      contracts: ['identity.contract'],
      responsibility: 'Provide tenant portal routing',
    }
    assert.equal(dep.consumerName, 'portal')
    assert.equal(dep.dependsOn.length, 2)
    assert.equal(dep.contracts.length, 1)
    assert.ok(typeof dep.responsibility === 'string')
  })
})

// ── BootstrapService ──
describe('BootstrapService', () => {
  it('getHealth 返回 ok / scaffold / 数字 uptime', () => {
    const { BootstrapService } = require('./bootstrap.service')
    const service = new BootstrapService()

    const result = service.getHealth()
    assert.equal(result.status, 'ok')
    assert.equal(result.phase, 'scaffold')
    assert.equal(typeof result.uptime, 'number')
  })

  it('getBootstrapMetadata 委托到 entity 逻辑', () => {
    const { BootstrapService } = require('./bootstrap.service')
    const service = new BootstrapService()

    const ctx = { tenantId: 't-svc', brandId: 'b-svc' }
    const result = service.getBootstrapMetadata(ctx)

    assert.equal(result.tenantContext.tenantId, 't-svc')
    assert.equal(result.tenantContext.brandId, 'b-svc')
    assert.equal(result.phase, 'scaffold')
  })

  it('getBootstrapMetadata 缺失字段为 undefined', () => {
    const { BootstrapService } = require('./bootstrap.service')
    const service = new BootstrapService()

    const result = service.getBootstrapMetadata({ tenantId: 't-only' })
    assert.equal(result.tenantContext.tenantId, 't-only')
    assert.equal(result.tenantContext.storeId, undefined)
    assert.equal(result.foundationDependencies.length, 0)
  })

  it('getHealth uptime 递增', () => {
    const { BootstrapService } = require('./bootstrap.service')
    const service = new BootstrapService()

    const first = service.getHealth()
    const second = service.getHealth()
    assert.ok(second.uptime >= first.uptime)
  })
})

// ── bootstrap.contract ──
describe('bootstrap.contract', () => {
  it('toBootstrapFoundationMetadata 空输入返回空数组', () => {
    const { toBootstrapFoundationMetadata } = require('./bootstrap.contract')
    const result = toBootstrapFoundationMetadata(undefined)
    assert.deepStrictEqual(result.foundationDependencies, [])
    assert.deepStrictEqual(result.foundationContracts, [])
  })

  it('toBootstrapFoundationMetadata 传入依赖/契约', () => {
    const { toBootstrapFoundationMetadata } = require('./bootstrap.contract')
    const input = {
      dependsOn: ['identity-access'] as any[],
      handoffContracts: ['identity.contract'],
    }
    const result = toBootstrapFoundationMetadata(input)
    assert.deepStrictEqual(result.foundationDependencies, ['identity-access'])
    assert.deepStrictEqual(result.foundationContracts, ['identity.contract'])
  })

  it('toBootstrapFoundationMetadata 不含 phase 属性', () => {
    const { toBootstrapFoundationMetadata } = require('./bootstrap.contract')
    const result = toBootstrapFoundationMetadata(undefined)
    assert.ok('foundationDependencies' in result)
    assert.ok('foundationContracts' in result)
    assert.ok(!('phase' in result))
  })

  it('toRegionalLoginPolicyContract 正常构造', () => {
    const { toRegionalLoginPolicyContract } = require('./bootstrap.contract')
    const result = toRegionalLoginPolicyContract('/login/sso', true)
    assert.equal(result.defaultLoginPath, '/login/sso')
    assert.equal(result.ssoEnabled, true)
  })

  it('toRegionalLoginPolicyContract ssoDisabled', () => {
    const { toRegionalLoginPolicyContract } = require('./bootstrap.contract')
    const result = toRegionalLoginPolicyContract('/login/basic', false)
    assert.equal(result.defaultLoginPath, '/login/basic')
    assert.equal(result.ssoEnabled, false)
  })
})
