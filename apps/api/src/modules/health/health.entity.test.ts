import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LytMemberProfile } from '@m5/domain'
import {
  HealthStatus,
  toHealthCheckResult,
  isHealthy,
  isDegraded,
  type ComponentHealth,
  type HealthCheckResult
} from './health.entity'

function makeComponent(
  overrides: Partial<ComponentHealth> = {}
): ComponentHealth {
  return {
    name: 'test-component',
    status: HealthStatus.Ok,
    latencyMs: 10,
    ...overrides
  }
}

describe('health.entity: HealthStatus enum', () => {
  it('has three status values', () => {
    assert.equal(HealthStatus.Ok, 'OK')
    assert.equal(HealthStatus.Degraded, 'DEGRADED')
    assert.equal(HealthStatus.Unavailable, 'UNAVAILABLE')
  })
})

describe('health.entity: toHealthCheckResult', () => {
  it('aggregates all-OK components as OK', () => {
    const components: ComponentHealth[] = [
      makeComponent({ name: 'db' }),
      makeComponent({ name: 'redis' }),
      makeComponent({ name: 'lyt' })
    ]
    const result = toHealthCheckResult(components, {
      uptimeSeconds: 3600,
      version: '1.0.0'
    })

    assert.equal(result.status, HealthStatus.Ok)
    assert.equal(result.components.length, 3)
    assert.ok(result.checkedAt)
    assert.equal(result.uptimeSeconds, 3600)
    assert.equal(result.version, '1.0.0')
  })

  it('aggregates with DEGRADED when one component is degraded', () => {
    const components: ComponentHealth[] = [
      makeComponent({ name: 'db', status: HealthStatus.Ok }),
      makeComponent({ name: 'redis', status: HealthStatus.Degraded, latencyMs: 500 }),
      makeComponent({ name: 'lyt', status: HealthStatus.Ok })
    ]
    const result = toHealthCheckResult(components, {
      uptimeSeconds: 100,
      version: '2.0.0'
    })

    assert.equal(result.status, HealthStatus.Degraded)
  })

  it('aggregates with UNAVAILABLE when one component is unavailable', () => {
    const components: ComponentHealth[] = [
      makeComponent({ name: 'db', status: HealthStatus.Ok }),
      makeComponent({ name: 'redis', status: HealthStatus.Unavailable }),
      makeComponent({ name: 'lyt', status: HealthStatus.Ok })
    ]
    const result = toHealthCheckResult(components, {
      uptimeSeconds: 50,
      version: '3.0.0'
    })

    assert.equal(result.status, HealthStatus.Unavailable)
  })

  it('UNAVAILABLE takes priority over DEGRADED', () => {
    const components: ComponentHealth[] = [
      makeComponent({ name: 'db', status: HealthStatus.Unavailable }),
      makeComponent({ name: 'redis', status: HealthStatus.Degraded })
    ]
    const result = toHealthCheckResult(components, {
      uptimeSeconds: 10,
      version: '4.0.0'
    })

    assert.equal(result.status, HealthStatus.Unavailable)
  })

  it('sets lytMode and sampleMember when provided', () => {
    const components: ComponentHealth[] = [makeComponent()]
    const member: LytMemberProfile = {
      memberId: 'm-001',
      nickname: 'TestUser',
      levelName: 'VIP'
    }
    const result = toHealthCheckResult(components, {
      uptimeSeconds: 100,
      version: '1.0.0',
      lytMode: 'mock',
      sampleMember: member
    })

    assert.equal(result.lytMode, 'mock')
    assert.ok(result.sampleMember)
    assert.equal(result.sampleMember!.memberId, 'm-001')
    assert.equal(result.sampleMember!.nickname, 'TestUser')
    assert.equal(result.sampleMember!.levelName, 'VIP')
  })

  it('checkedAt is ISO date string', () => {
    const result = toHealthCheckResult([makeComponent()], {
      uptimeSeconds: 1,
      version: '1.0.0'
    })

    assert.ok(!isNaN(Date.parse(result.checkedAt)))
  })

  it('empty components list yields OK', () => {
    const result = toHealthCheckResult([], {
      uptimeSeconds: 0,
      version: '0.0.0'
    })

    assert.equal(result.status, HealthStatus.Ok)
    assert.equal(result.components.length, 0)
  })
})

describe('health.entity: isHealthy', () => {
  it('returns true for OK status', () => {
    const result: HealthCheckResult = {
      status: HealthStatus.Ok,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      components: [],
      version: '1.0.0'
    }
    assert.equal(isHealthy(result), true)
  })

  it('returns false for DEGRADED status', () => {
    const result: HealthCheckResult = {
      status: HealthStatus.Degraded,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      components: [],
      version: '1.0.0'
    }
    assert.equal(isHealthy(result), false)
  })

  it('returns false for UNAVAILABLE status', () => {
    const result: HealthCheckResult = {
      status: HealthStatus.Unavailable,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      components: [],
      version: '1.0.0'
    }
    assert.equal(isHealthy(result), false)
  })
})

describe('health.entity: isDegraded', () => {
  it('returns true for DEGRADED status', () => {
    const result: HealthCheckResult = {
      status: HealthStatus.Degraded,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      components: [],
      version: '1.0.0'
    }
    assert.equal(isDegraded(result), true)
  })

  it('returns false for OK status', () => {
    const result: HealthCheckResult = {
      status: HealthStatus.Ok,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      components: [],
      version: '1.0.0'
    }
    assert.equal(isDegraded(result), false)
  })

  it('returns false for UNAVAILABLE status', () => {
    const result: HealthCheckResult = {
      status: HealthStatus.Unavailable,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 1,
      components: [],
      version: '1.0.0'
    }
    assert.equal(isDegraded(result), false)
  })
})
