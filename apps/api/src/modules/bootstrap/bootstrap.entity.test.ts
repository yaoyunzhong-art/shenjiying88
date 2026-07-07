import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  BootstrapPhase,
  toBootstrapHealth,
  toBootstrapMetadata,
  type BootstrapHealth,
  type BootstrapMetadata,
  type RegionalLoginPolicy,
  type BootstrapConsumerDependency
} from './bootstrap.entity'

describe('BootstrapPhase enum', () => {
  it('has four phases', () => {
    assert.equal(BootstrapPhase.Scaffold, 'scaffold')
    assert.equal(BootstrapPhase.Provision, 'provision')
    assert.equal(BootstrapPhase.Handoff, 'handoff')
    assert.equal(BootstrapPhase.Ready, 'ready')
  })
})

describe('toBootstrapHealth', () => {
  it('returns default healthy scaffold state', () => {
    const health = toBootstrapHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.phase, BootstrapPhase.Scaffold)
    assert.equal(typeof health.uptime, 'number')
    assert.ok(health.uptime >= 0)
    assert.ok(new Date(health.checkedAt).getTime() > 0)
  })

  it('accepts overrides', () => {
    const health = toBootstrapHealth({ status: 'error', phase: BootstrapPhase.Ready })
    assert.equal(health.status, 'error')
    assert.equal(health.phase, BootstrapPhase.Ready)
  })

  it('preserves uptime when not overridden', () => {
    const health = toBootstrapHealth({ status: 'degraded' })
    assert.equal(health.status, 'degraded')
    assert.equal(health.phase, BootstrapPhase.Scaffold)
    assert.ok(health.uptime >= 0)
  })

  it('satisfies BootstrapHealth interface', () => {
    const health: BootstrapHealth = toBootstrapHealth()
    assert.equal(typeof health.checkedAt, 'string')
    assert.equal(health.status, 'ok')
  })
})

describe('toBootstrapMetadata', () => {
  it('returns metadata with given tenant context', () => {
    const ctx = { tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'cn' }
    const meta = toBootstrapMetadata(ctx)
    assert.deepStrictEqual(meta.tenantContext, ctx)
    assert.deepStrictEqual(meta.foundationDependencies, [])
    assert.deepStrictEqual(meta.foundationContracts, [])
    assert.equal(meta.phase, BootstrapPhase.Scaffold)
    assert.ok(new Date(meta.generatedAt).getTime() > 0)
  })

  it('accepts overrides for dependencies', () => {
    const ctx = { tenantId: 't-2' }
    const meta = toBootstrapMetadata(ctx, {
      foundationDependencies: ['foundation' as any],
      foundationContracts: ['handoff-v1'],
      phase: BootstrapPhase.Ready
    })
    assert.deepStrictEqual(meta.foundationDependencies, ['foundation'])
    assert.deepStrictEqual(meta.foundationContracts, ['handoff-v1'])
    assert.equal(meta.phase, BootstrapPhase.Ready)
  })

  it('satisfies BootstrapMetadata interface', () => {
    const ctx = { tenantId: 't-3' }
    const meta: BootstrapMetadata = toBootstrapMetadata(ctx)
    assert.equal(typeof meta.generatedAt, 'string')
    assert.equal(meta.phase, BootstrapPhase.Scaffold)
  })

  it('handles minimal tenant context', () => {
    const ctx = { tenantId: 'min-t' } as any
    const meta = toBootstrapMetadata(ctx)
    assert.equal(meta.tenantContext.tenantId, 'min-t')
    assert.equal(meta.tenantContext.brandId, undefined)
  })
})

describe('RegionalLoginPolicy type', () => {
  it('constructs valid policy object', () => {
    const policy: RegionalLoginPolicy = {
      defaultLoginPath: '/login',
      ssoEnabled: true,
      supportedMarkets: ['cn-mainland', 'en-global']
    }
    assert.equal(policy.defaultLoginPath, '/login')
    assert.ok(policy.ssoEnabled)
    assert.deepStrictEqual(policy.supportedMarkets, ['cn-mainland', 'en-global'])
  })

  it('allows empty supported markets', () => {
    const policy: RegionalLoginPolicy = {
      defaultLoginPath: '/sso',
      ssoEnabled: false,
      supportedMarkets: []
    }
    assert.equal(policy.defaultLoginPath, '/sso')
    assert.ok(!policy.ssoEnabled)
    assert.deepStrictEqual(policy.supportedMarkets, [])
  })
})

describe('BootstrapConsumerDependency type', () => {
  it('constructs valid dependency object', () => {
    const dep: BootstrapConsumerDependency = {
      consumerName: 'market',
      dependsOn: ['foundation' as any],
      contracts: ['market-data-contract'],
      responsibility: '输出多市场默认值'
    }
    assert.equal(dep.consumerName, 'market')
    assert.deepStrictEqual(dep.dependsOn, ['foundation'])
    assert.deepStrictEqual(dep.contracts, ['market-data-contract'])
    assert.equal(dep.responsibility, '输出多市场默认值')
  })
})
