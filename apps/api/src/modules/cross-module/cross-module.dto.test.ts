import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CrossModuleQueryDto, CrossModuleValidateDto, CrossModuleChainStatusDto, CrossModuleValidationResultDto } from './cross-module.dto'

// ── CrossModuleQueryDto ──
describe('CrossModuleQueryDto', () => {
  it('all fields are optional', () => {
    const dto = new CrossModuleQueryDto()
    assert.equal(dto.chainName, undefined)
    assert.equal(dto.verbose, undefined)
    assert.equal(dto.status, undefined)
  })

  it('can set chainName filter', () => {
    const dto = new CrossModuleQueryDto()
    dto.chainName = 'admin-to-consumer'
    assert.equal(dto.chainName, 'admin-to-consumer')
  })

  it('can set verbose flag', () => {
    const dto = new CrossModuleQueryDto()
    dto.verbose = true
    assert.equal(dto.verbose, true)
  })

  it('can set status filter', () => {
    const dto = new CrossModuleQueryDto()
    dto.status = 'verified'
    assert.equal(dto.status, 'verified')
  })
})

// ── CrossModuleValidateDto ──
describe('CrossModuleValidateDto', () => {
  it('all fields are optional', () => {
    const dto = new CrossModuleValidateDto()
    assert.equal(dto.chainNames, undefined)
    assert.equal(dto.tenantId, undefined)
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.marketCode, undefined)
  })

  it('can set chain names for validation', () => {
    const dto = new CrossModuleValidateDto()
    dto.chainNames = ['admin-to-consumer', 'sdk-to-api']
    assert.deepEqual(dto.chainNames, ['admin-to-consumer', 'sdk-to-api'])
  })

  it('can set tenant context', () => {
    const dto = new CrossModuleValidateDto()
    dto.tenantId = 'tenant-001'
    dto.marketCode = 'default'
    assert.equal(dto.tenantId, 'tenant-001')
    assert.equal(dto.marketCode, 'default')
  })
})

// ── CrossModuleChainStatusDto ──
describe('CrossModuleChainStatusDto', () => {
  it('can create chain status DTO', () => {
    const dto: CrossModuleChainStatusDto = {
      chains: [
        { name: 'chain-1', modules: ['m1', 'm2'], status: 'defined' }
      ],
      total: 1,
      runtime: 'cross-module-e2e'
    }
    assert.equal(dto.total, 1)
    assert.equal(dto.runtime, 'cross-module-e2e')
  })

  it('chain status DTO with lastVerifiedAt', () => {
    const dto: CrossModuleChainStatusDto = {
      chains: [
        {
          name: 'chain-1',
          modules: ['m1', 'm2'],
          status: 'verified',
          lastVerifiedAt: '2025-01-01T00:00:00Z'
        }
      ],
      total: 1,
      runtime: 'cross-module-e2e'
    }
    assert.equal(dto.chains[0].lastVerifiedAt, '2025-01-01T00:00:00Z')
  })

  it('chain status DTO with brokenNodes', () => {
    const dto: CrossModuleChainStatusDto = {
      chains: [
        {
          name: 'chain-1',
          modules: ['m1', 'm2'],
          status: 'broken',
          brokenNodes: ['m1 → m2']
        }
      ],
      total: 1,
      runtime: 'cross-module-e2e'
    }
    assert.deepEqual(dto.chains[0].brokenNodes, ['m1 → m2'])
  })
})

// ── CrossModuleValidationResultDto ──
describe('CrossModuleValidationResultDto', () => {
  it('can create validation result DTO', () => {
    const dto: CrossModuleValidationResultDto = {
      chainName: 'admin-to-consumer',
      passed: true,
      stages: [
        { stage: 'stage-1', from: 'tenant', to: 'bootstrap', passed: true, durationMs: 10 }
      ],
      executedAt: '2025-01-01T00:00:00Z',
      durationMs: 100
    }
    assert.equal(dto.chainName, 'admin-to-consumer')
    assert.equal(dto.passed, true)
    assert.equal(dto.stages.length, 1)
  })

  it('failed validation result DTO', () => {
    const dto: CrossModuleValidationResultDto = {
      chainName: 'sdk-to-api',
      passed: false,
      stages: [
        { stage: 'stage-1', from: 'sdk', to: 'api', passed: true, durationMs: 5 },
        { stage: 'stage-2', from: 'api', to: 'lyt', passed: false, error: 'Connection refused', durationMs: 50 }
      ],
      executedAt: '2025-01-01T00:00:00Z',
      durationMs: 200
    }
    assert.equal(dto.passed, false)
    assert.equal(dto.stages[1].error, 'Connection refused')
  })
})
