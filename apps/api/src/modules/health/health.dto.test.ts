import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { HealthQueryDto, HealthResponseDto } from './health.dto'
import { HealthStatus } from './health.entity'

describe('health.dto: HealthQueryDto', () => {
  test('default properties are undefined', () => {
    const dto = new HealthQueryDto()
    assert.equal(dto.verbose, undefined)
    assert.equal(dto.scope, undefined)
  })

  test('can set verbose=true', () => {
    const dto = new HealthQueryDto()
    dto.verbose = true
    assert.equal(dto.verbose, true)
  })

  test('can set verbose=false', () => {
    const dto = new HealthQueryDto()
    dto.verbose = false
    assert.equal(dto.verbose, false)
  })

  test('can set scope string', () => {
    const dto = new HealthQueryDto()
    dto.scope = 'platform'
    assert.equal(dto.scope, 'platform')
  })

  test('can set both verbose and scope', () => {
    const dto = new HealthQueryDto()
    dto.verbose = true
    dto.scope = 'tenant'
    assert.equal(dto.verbose, true)
    assert.equal(dto.scope, 'tenant')
  })

  test('instanceof check', () => {
    const dto = new HealthQueryDto()
    assert.ok(dto instanceof HealthQueryDto)
  })
})

describe('health.dto: HealthResponseDto', () => {
  test('default properties are undefined', () => {
    const dto = new HealthResponseDto()
    assert.equal(dto.status, undefined)
    assert.equal(dto.checkedAt, undefined)
    assert.equal(dto.version, undefined)
    assert.equal(dto.lytMode, undefined)
    assert.equal(dto.sampleMember, undefined)
  })

  test('can construct complete response', () => {
    const dto = new HealthResponseDto()
    dto.status = HealthStatus.Ok
    dto.checkedAt = new Date().toISOString()
    dto.version = '1.0.0'

    assert.equal(dto.status, 'OK')
    assert.ok(dto.checkedAt)
    assert.ok(!isNaN(Date.parse(dto.checkedAt)))
    assert.equal(dto.version, '1.0.0')
  })

  test('accepts all valid status values', () => {
    const statuses = [HealthStatus.Ok, HealthStatus.Degraded, HealthStatus.Unavailable]
    for (const status of statuses) {
      const dto = new HealthResponseDto()
      dto.status = status
      dto.checkedAt = new Date().toISOString()
      dto.version = '1.0.0'
      assert.equal(dto.status, status)
    }
  })

  test('accepts response with sampleMember', () => {
    const dto = new HealthResponseDto()
    dto.status = HealthStatus.Ok
    dto.checkedAt = new Date().toISOString()
    dto.version = '1.0.0'
    dto.sampleMember = { memberId: 'm-001', name: 'test' }

    assert.deepEqual(dto.sampleMember, { memberId: 'm-001', name: 'test' })
  })

  test('accepts response with lytMode', () => {
    const dto = new HealthResponseDto()
    dto.status = HealthStatus.Ok
    dto.checkedAt = new Date().toISOString()
    dto.version = '1.0.0'
    dto.lytMode = 'mock'

    assert.equal(dto.lytMode, 'mock')
  })

  test('instanceof check', () => {
    const dto = new HealthResponseDto()
    assert.ok(dto instanceof HealthResponseDto)
  })
})
