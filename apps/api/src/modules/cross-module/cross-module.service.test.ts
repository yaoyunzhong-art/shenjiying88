import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CrossModuleService } from './cross-module.service'
import { ChainStatus } from './cross-module.entity'

describe('CrossModuleService', () => {
  let service: CrossModuleService

  beforeEach(() => {
    service = new CrossModuleService()
    service.resetAll()
  })

  // ── listChains ──
  describe('listChains', () => {
    it('lists all 4 chains by default', () => {
      const chains = service.listChains()
      assert.equal(chains.length, 4)
    })

    it('filters by chain name', () => {
      const chains = service.listChains({ chainName: 'admin-to-consumer' })
      assert.equal(chains.length, 1)
      assert.equal(chains[0].name, 'admin-to-consumer')
    })

    it('filters by status', () => {
      const chains = service.listChains({ status: ChainStatus.Defined })
      assert.equal(chains.length, 4) // all start as Defined
    })

    it('non-existent chain name returns empty', () => {
      const chains = service.listChains({ chainName: 'non-existent' })
      assert.equal(chains.length, 0)
    })

    it('non-matching status returns empty', () => {
      const chains = service.listChains({ status: ChainStatus.Verified })
      assert.equal(chains.length, 0) // none start as Verified
    })
  })

  // ── getSummary ──
  describe('getSummary', () => {
    it('initial summary has 4 defined', () => {
      const summary = service.getSummary()
      assert.equal(summary.total, 4)
      assert.equal(summary.defined, 4)
      assert.equal(summary.verified, 0)
      assert.equal(summary.broken, 0)
    })

    it('summary after validation reflects results', async () => {
      await service.validate(undefined)
      const summary = service.getSummary()
      assert.equal(summary.verified, 4) // all pass in mock
    })
  })

  // ── validate ──
  describe('validate', () => {
    it('validates all chains when no names given', async () => {
      const results = await service.validate(undefined)
      assert.equal(results.length, 4)
      for (const result of results) {
        assert.equal(result.passed, true)
      }
    })

    it('validates specific chain by name', async () => {
      const results = await service.validate(['admin-to-consumer'])
      assert.equal(results.length, 1)
      assert.equal(results[0].chainName, 'admin-to-consumer')
      assert.equal(results[0].passed, true)
    })

    it('validation updates chain status to verified', async () => {
      await service.validate(['sdk-to-api'])
      const chains = service.listChains({ chainName: 'sdk-to-api' })
      assert.equal(chains[0].status, ChainStatus.Verified)
      assert.ok(chains[0].lastVerifiedAt)
    })

    it('validation result includes stages', async () => {
      const results = await service.validate(['admin-to-consumer'])
      const chain = results[0]
      // admin-to-consumer has 6 modules, so 5 edges (stages)
      assert.equal(chain.stages.length, 5)
      assert.equal(chain.stages[0].from, 'tenant')
      assert.equal(chain.stages[0].to, 'bootstrap')
      assert.equal(chain.stages[chain.stages.length - 1].to, 'miniapp')
    })

    it('sdk-to-api validation has 3 stages', async () => {
      const results = await service.validate(['sdk-to-api'])
      assert.equal(results[0].stages.length, 3)
    })

    it('governance-chain validation has 4 stages', async () => {
      const results = await service.validate(['governance-chain'])
      assert.equal(results[0].stages.length, 4)
    })

    it('multi-client-consistency validation has 4 stages', async () => {
      const results = await service.validate(['multi-client-consistency'])
      assert.equal(results[0].stages.length, 4)
    })

    it('validation uses provided context', async () => {
      const results = await service.validate(['admin-to-consumer'], {
        tenantId: 'tenant-001',
        marketCode: 'default'
      })
      assert.equal(results[0].passed, true)
    })

    it('results have executedAt timestamp', async () => {
      const results = await service.validate(['admin-to-consumer'])
      assert.ok(results[0].executedAt)
    })

    it('results have durationMs', async () => {
      const results = await service.validate(['admin-to-consumer'])
      assert.ok(typeof results[0].durationMs === 'number')
      assert.ok(results[0].durationMs >= 0)
    })
  })

  // ── checkAllVerified ──
  describe('checkAllVerified', () => {
    it('initially not all verified', () => {
      assert.equal(service.checkAllVerified(), false)
    })

    it('after full validation, all verified', async () => {
      await service.validate(undefined)
      assert.equal(service.checkAllVerified(), true)
    })
  })

  // ── checkHasBroken ──
  describe('checkHasBroken', () => {
    it('initially no broken chains', () => {
      assert.equal(service.checkHasBroken(), false)
    })
  })

  // ── resetAll ──
  describe('resetAll', () => {
    it('resets verified chains back to defined', async () => {
      await service.validate(undefined)
      assert.equal(service.checkAllVerified(), true)

      service.resetAll()
      assert.equal(service.checkAllVerified(), false)
      const summary = service.getSummary()
      assert.equal(summary.defined, 4)
      assert.equal(summary.verified, 0)
    })

    it('reset clears lastVerifiedAt', async () => {
      await service.validate(['admin-to-consumer'])
      let chains = service.listChains({ chainName: 'admin-to-consumer' })
      assert.ok(chains[0].lastVerifiedAt)

      service.resetAll()
      chains = service.listChains({ chainName: 'admin-to-consumer' })
      assert.equal(chains[0].lastVerifiedAt, undefined)
    })
  })
})
