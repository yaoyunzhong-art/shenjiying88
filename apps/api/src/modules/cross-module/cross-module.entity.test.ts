import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  ChainStatus,
  type CrossModuleChain,
  toValidationSummary,
  isAllVerified,
  hasBrokenChain
} from './cross-module.entity'

// ── ChainStatus 枚举 ──
test('ChainStatus enum has 4 values', () => {
  const values = Object.values(ChainStatus)
  assert.equal(values.length, 4)
  assert.ok(values.includes(ChainStatus.Defined))
  assert.ok(values.includes(ChainStatus.Validating))
  assert.ok(values.includes(ChainStatus.Verified))
  assert.ok(values.includes(ChainStatus.Broken))
})

// ── toValidationSummary ──
describe('toValidationSummary', () => {
  test('empty chains returns all zeros', () => {
    const summary = toValidationSummary([])
    assert.equal(summary.total, 0)
    assert.equal(summary.defined, 0)
    assert.equal(summary.validating, 0)
    assert.equal(summary.verified, 0)
    assert.equal(summary.broken, 0)
  })

  test('all defined chains counted correctly', () => {
    const chains: CrossModuleChain[] = [
      { name: 'c1', description: '', modules: ['a', 'b'], status: ChainStatus.Defined },
      { name: 'c2', description: '', modules: ['c', 'd'], status: ChainStatus.Defined }
    ]
    const summary = toValidationSummary(chains)
    assert.equal(summary.total, 2)
    assert.equal(summary.defined, 2)
  })

  test('mixed status chains counted correctly', () => {
    const chains: CrossModuleChain[] = [
      { name: 'c1', description: '', modules: ['a', 'b'], status: ChainStatus.Defined },
      { name: 'c2', description: '', modules: ['c', 'd'], status: ChainStatus.Verified },
      { name: 'c3', description: '', modules: ['e', 'f'], status: ChainStatus.Broken },
      { name: 'c4', description: '', modules: ['g', 'h'], status: ChainStatus.Validating }
    ]
    const summary = toValidationSummary(chains)
    assert.equal(summary.total, 4)
    assert.equal(summary.defined, 1)
    assert.equal(summary.validating, 1)
    assert.equal(summary.verified, 1)
    assert.equal(summary.broken, 1)
  })
})

// ── isAllVerified ──
describe('isAllVerified', () => {
  test('empty chains is not all verified', () => {
    assert.equal(isAllVerified([]), false)
  })

  test('all verified returns true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'c1', description: '', modules: ['a'], status: ChainStatus.Verified }
    ]
    assert.equal(isAllVerified(chains), true)
  })

  test('one broken makes it false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'c1', description: '', modules: ['a'], status: ChainStatus.Verified },
      { name: 'c2', description: '', modules: ['b'], status: ChainStatus.Broken }
    ]
    assert.equal(isAllVerified(chains), false)
  })
})

// ── hasBrokenChain ──
describe('hasBrokenChain', () => {
  test('empty chains has no broken', () => {
    assert.equal(hasBrokenChain([]), false)
  })

  test('no broken chains returns false', () => {
    const chains: CrossModuleChain[] = [
      { name: 'c1', description: '', modules: ['a'], status: ChainStatus.Verified }
    ]
    assert.equal(hasBrokenChain(chains), false)
  })

  test('one broken chain returns true', () => {
    const chains: CrossModuleChain[] = [
      { name: 'c1', description: '', modules: ['a'], status: ChainStatus.Verified },
      { name: 'c2', description: '', modules: ['b'], status: ChainStatus.Broken }
    ]
    assert.equal(hasBrokenChain(chains), true)
  })
})

// ── CrossModuleChain 类型使用 ──
describe('CrossModuleChain type', () => {
  test('can create chain without optional fields', () => {
    const chain: CrossModuleChain = {
      name: 'test-chain',
      description: 'test',
      modules: ['m1', 'm2'],
      status: ChainStatus.Defined
    }
    assert.equal(chain.name, 'test-chain')
    assert.equal(chain.brokenNodes, undefined)
    assert.equal(chain.lastVerifiedAt, undefined)
  })

  test('can create chain with optional fields', () => {
    const chain: CrossModuleChain = {
      name: 'test-chain',
      description: 'test',
      modules: ['m1', 'm2'],
      status: ChainStatus.Broken,
      lastVerifiedAt: '2025-01-01T00:00:00Z',
      brokenNodes: ['m1 → m2']
    }
    assert.equal(chain.status, ChainStatus.Broken)
    assert.deepEqual(chain.brokenNodes, ['m1 → m2'])
  })
})
