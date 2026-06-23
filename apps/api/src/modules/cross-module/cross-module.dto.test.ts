import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { CrossModuleQueryDto, CrossModuleValidateDto, CrossModuleChainStatusDto, CrossModuleValidationResultDto } from './cross-module.dto'

// ── CrossModuleQueryDto ──
describe('CrossModuleQueryDto', () => {
  test('all fields are optional', () => {
    const dto = new CrossModuleQueryDto()
    assert.equal(dto.chainName, undefined)
    assert.equal(dto.verbose, undefined)
    assert.equal(dto.status, undefined)
  })

  test('can set chainName filter', () => {
    const dto = new CrossModuleQueryDto()
    dto.chainName = 'admin-to-consumer'
    assert.equal(dto.chainName, 'admin-to-consumer')
  })

  test('can set verbose flag', () => {
    const dto = new CrossModuleQueryDto()
    dto.verbose = true
    assert.equal(dto.verbose, true)
  })

  test('can set status filter', () => {
    const dto = new CrossModuleQueryDto()
    dto.status = 'verified'
    assert.equal(dto.status, 'verified')
  })
})

// ── CrossModuleValidateDto ──
describe('CrossModuleValidateDto', () => {
  test('all fields are optional', () => {
    const dto = new CrossModuleValidateDto()
    assert.equal(dto.chainNames, undefined)
    assert.equal(dto.tenantId, undefined)
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.marketCode, undefined)
  })

  test('can set chain names for validation', () => {
    const dto = new CrossModuleValidateDto()
    dto.chainNames = ['admin-to-consumer', 'sdk-to-api']
    assert.deepEqual(dto.chainNames, ['admin-to-consumer', 'sdk-to-api'])
  })

  test('can set tenant context', () => {
    const dto = new CrossModuleValidateDto()
    dto.tenantId = 'tenant-001'
    dto.marketCode = 'default'
    assert.equal(dto.tenantId, 'tenant-001')
    assert.equal(dto.marketCode, 'default')
  })
})

// ── CrossModuleChainStatusDto ──
describe('CrossModuleChainStatusDto', () => {
  test('can create chain status DTO', () => {
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

  test('chain status DTO with lastVerifiedAt', () => {
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

  test('chain status DTO with brokenNodes', () => {
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
  test('can create validation result DTO', () => {
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

  test('failed validation result DTO', () => {
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
