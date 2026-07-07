import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  BootstrapHealthQueryDto,
  BootstrapMetadataQueryDto,
  BootstrapHealthResponseDto,
  BootstrapMetadataResponseDto
} from './bootstrap.dto'

describe('BootstrapHealthQueryDto', () => {
  it('verbose defaults to undefined', () => {
    const dto = new BootstrapHealthQueryDto()
    assert.equal(dto.verbose, undefined)
  })

  it('accepts verbose=true', () => {
    const dto = new BootstrapHealthQueryDto()
    dto.verbose = true
    assert.equal(dto.verbose, true)
  })

  it('accepts verbose=false', () => {
    const dto = new BootstrapHealthQueryDto()
    dto.verbose = false
    assert.equal(dto.verbose, false)
  })
})

describe('BootstrapMetadataQueryDto', () => {
  it('moduleKey defaults to undefined', () => {
    const dto = new BootstrapMetadataQueryDto()
    assert.equal(dto.moduleKey, undefined)
  })

  it('accepts moduleKey filter', () => {
    const dto = new BootstrapMetadataQueryDto()
    dto.moduleKey = 'foundation'
    assert.equal(dto.moduleKey, 'foundation')
  })

  it('includeContracts defaults to undefined', () => {
    const dto = new BootstrapMetadataQueryDto()
    assert.equal(dto.includeContracts, undefined)
  })

  it('accepts includeContracts=true', () => {
    const dto = new BootstrapMetadataQueryDto()
    dto.includeContracts = true
    assert.equal(dto.includeContracts, true)
  })
})

describe('BootstrapHealthResponseDto', () => {
  it('constructs valid response', () => {
    const dto = new BootstrapHealthResponseDto()
    dto.status = 'ok'
    dto.uptime = 123.45
    dto.phase = 'scaffold'
    dto.checkedAt = '2026-01-15T00:00:00.000Z'

    assert.equal(dto.status, 'ok')
    assert.equal(dto.uptime, 123.45)
    assert.equal(dto.phase, 'scaffold')
    assert.equal(dto.checkedAt, '2026-01-15T00:00:00.000Z')
  })

  it('accepts degraded status', () => {
    const dto = new BootstrapHealthResponseDto()
    dto.status = 'degraded'
    dto.uptime = 0
    dto.phase = 'scaffold'
    dto.checkedAt = new Date().toISOString()

    assert.equal(dto.status, 'degraded')
  })
})

describe('BootstrapMetadataResponseDto', () => {
  it('constructs valid metadata response', () => {
    const dto = new BootstrapMetadataResponseDto()
    dto.tenantContext = { tenantId: 't-1', brandId: 'b-1' }
    dto.foundationDependencies = ['foundation']
    dto.foundationContracts = ['test-contract']
    dto.phase = 'scaffold'
    dto.generatedAt = '2026-01-15T00:00:00.000Z'

    assert.deepStrictEqual(dto.tenantContext, { tenantId: 't-1', brandId: 'b-1' })
    assert.deepStrictEqual(dto.foundationDependencies, ['foundation'])
    assert.deepStrictEqual(dto.foundationContracts, ['test-contract'])
    assert.equal(dto.phase, 'scaffold')
    assert.equal(dto.generatedAt, '2026-01-15T00:00:00.000Z')
  })

  it('accepts empty dependencies', () => {
    const dto = new BootstrapMetadataResponseDto()
    dto.tenantContext = {}
    dto.foundationDependencies = []
    dto.foundationContracts = []
    dto.phase = 'ready'
    dto.generatedAt = new Date().toISOString()

    assert.deepStrictEqual(dto.foundationDependencies, [])
    assert.deepStrictEqual(dto.foundationContracts, [])
    assert.equal(dto.phase, 'ready')
  })
})
