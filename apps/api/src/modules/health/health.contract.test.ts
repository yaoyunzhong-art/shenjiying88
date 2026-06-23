import assert from 'node:assert/strict'
import test from 'node:test'
import { HealthStatus } from './health.entity'
import {
  toHealthCheckContract,
  toComponentHealthContract,
  toHealthPingContract,
} from './health.contract'

/* ------------------------------------------------------------------ */
/*  toHealthCheckContract                                              */
/* ------------------------------------------------------------------ */

test('toHealthCheckContract maps healthy result with all components ok', () => {
  const result = {
    status: HealthStatus.Ok,
    checkedAt: '2026-06-23T08:00:00.000Z',
    uptimeSeconds: 3600,
    version: '1.2.3',
    components: [
      { name: 'database', status: HealthStatus.Ok, latencyMs: 5 },
      { name: 'redis', status: HealthStatus.Ok, latencyMs: 2 },
      { name: 'lyt-adapter', status: HealthStatus.Ok, latencyMs: 10 },
    ],
    lytMode: 'mock',
  }

  const contract = toHealthCheckContract(result)

  assert.equal(contract.status, HealthStatus.Ok)
  assert.equal(contract.checkedAt, '2026-06-23T08:00:00.000Z')
  assert.equal(contract.uptimeSeconds, 3600)
  assert.equal(contract.version, '1.2.3')
  assert.equal(contract.componentCount, 3)
  assert.deepStrictEqual(contract.componentNames, ['database', 'redis', 'lyt-adapter'])
  assert.deepStrictEqual(contract.degradedComponents, [])
  assert.deepStrictEqual(contract.unavailableComponents, [])
  assert.equal(contract.lytMode, 'mock')
})

test('toHealthCheckContract maps degraded result with mixed statuses', () => {
  const result = {
    status: HealthStatus.Degraded,
    checkedAt: '2026-06-23T08:05:00.000Z',
    uptimeSeconds: 3900,
    version: '1.2.3',
    components: [
      { name: 'database', status: HealthStatus.Ok, latencyMs: 5 },
      { name: 'redis', status: HealthStatus.Degraded, latencyMs: 800 },
      { name: 'lyt-adapter', status: HealthStatus.Unavailable, latencyMs: 0, detail: { error: 'timeout' } },
      { name: 'memory', status: HealthStatus.Ok, latencyMs: 1 },
      { name: 'disk', status: HealthStatus.Ok, latencyMs: 3 },
    ],
    lytMode: 'platform-mock',
  }

  const contract = toHealthCheckContract(result)

  assert.equal(contract.status, HealthStatus.Degraded)
  assert.equal(contract.componentCount, 5)
  assert.deepStrictEqual(contract.degradedComponents, ['redis'])
  assert.deepStrictEqual(contract.unavailableComponents, ['lyt-adapter'])
  assert.equal(contract.lytMode, 'platform-mock')
})

test('toHealthCheckContract maps unavailable result with all components down', () => {
  const result = {
    status: HealthStatus.Unavailable,
    checkedAt: '2026-06-23T08:10:00.000Z',
    uptimeSeconds: 4200,
    version: '1.2.3',
    components: [
      { name: 'database', status: HealthStatus.Unavailable, latencyMs: 0, detail: { error: 'connection refused' } },
      { name: 'lyt-adapter', status: HealthStatus.Unavailable, latencyMs: 0, detail: { error: 'timeout' } },
    ],
  }

  const contract = toHealthCheckContract(result)

  assert.equal(contract.status, HealthStatus.Unavailable)
  assert.equal(contract.componentCount, 2)
  assert.deepStrictEqual(contract.degradedComponents, [])
  assert.deepStrictEqual(contract.unavailableComponents, ['database', 'lyt-adapter'])
  assert.equal(contract.lytMode, undefined)
})

test('toHealthCheckContract handles empty component list', () => {
  const result = {
    status: HealthStatus.Ok,
    checkedAt: '2026-06-23T08:00:00.000Z',
    uptimeSeconds: 0,
    version: '0.0.1',
    components: [],
  }

  const contract = toHealthCheckContract(result)

  assert.equal(contract.status, HealthStatus.Ok)
  assert.equal(contract.componentCount, 0)
  assert.deepStrictEqual(contract.componentNames, [])
  assert.deepStrictEqual(contract.degradedComponents, [])
  assert.deepStrictEqual(contract.unavailableComponents, [])
})

test('toHealthCheckContract preserves lytMode when set', () => {
  const result = {
    status: HealthStatus.Ok,
    checkedAt: '2026-06-23T09:00:00.000Z',
    uptimeSeconds: 100,
    version: '0.0.0',
    components: [{ name: 'database', status: HealthStatus.Ok, latencyMs: 3 }],
    lytMode: 'custom-adapter',
  }

  const contract = toHealthCheckContract(result)

  assert.equal(contract.lytMode, 'custom-adapter')
})

/* ------------------------------------------------------------------ */
/*  toComponentHealthContract                                          */
/* ------------------------------------------------------------------ */

test('toComponentHealthContract maps component without detail', () => {
  const component = {
    name: 'database',
    status: HealthStatus.Ok,
    latencyMs: 5,
  }

  const contract = toComponentHealthContract(component)

  assert.equal(contract.name, 'database')
  assert.equal(contract.status, HealthStatus.Ok)
  assert.equal(contract.latencyMs, 5)
  assert.equal(contract.hasDetail, false)
})

test('toComponentHealthContract maps component with detail', () => {
  const component = {
    name: 'redis',
    status: HealthStatus.Degraded,
    latencyMs: 800,
    detail: { host: 'localhost', port: 6379 },
  }

  const contract = toComponentHealthContract(component)

  assert.equal(contract.name, 'redis')
  assert.equal(contract.status, HealthStatus.Degraded)
  assert.equal(contract.latencyMs, 800)
  assert.equal(contract.hasDetail, true)
})

test('toComponentHealthContract maps unavailable component with error detail', () => {
  const component = {
    name: 'lyt-adapter',
    status: HealthStatus.Unavailable,
    latencyMs: 0,
    detail: { error: 'timeout after 5000ms' },
  }

  const contract = toComponentHealthContract(component)

  assert.equal(contract.name, 'lyt-adapter')
  assert.equal(contract.status, HealthStatus.Unavailable)
  assert.equal(contract.latencyMs, 0)
  assert.equal(contract.hasDetail, true)
})

/* ------------------------------------------------------------------ */
/*  toHealthPingContract                                               */
/* ------------------------------------------------------------------ */

test('toHealthPingContract maps alive ping', () => {
  const result = { alive: true, timestamp: '2026-06-23T08:00:00.000Z' }

  const contract = toHealthPingContract(result)

  assert.equal(contract.alive, true)
  assert.equal(contract.timestamp, '2026-06-23T08:00:00.000Z')
})

test('toHealthPingContract maps dead ping (edge case — should not happen in practice)', () => {
  const result = { alive: false, timestamp: '2026-06-23T08:00:00.000Z' }

  const contract = toHealthPingContract(result)

  assert.equal(contract.alive, false)
  assert.equal(contract.timestamp, '2026-06-23T08:00:00.000Z')
})

test('toHealthPingContract round-trips identity', () => {
  const input = { alive: true, timestamp: new Date().toISOString() }
  const contract = toHealthPingContract(input)

  assert.equal(contract.alive, input.alive)
  assert.equal(contract.timestamp, input.timestamp)
})

/* ------------------------------------------------------------------ */
/*  Contract type structural conformance                               */
/* ------------------------------------------------------------------ */

test('HealthCheckContract fields match expected shape', () => {
  const result = {
    status: HealthStatus.Ok,
    checkedAt: '2026-06-23T08:00:00.000Z',
    uptimeSeconds: 100,
    version: '1.0.0',
    components: [
      { name: 'db', status: HealthStatus.Ok, latencyMs: 1 },
      { name: 'redis', status: HealthStatus.Ok, latencyMs: 2 },
    ],
  }

  const contract = toHealthCheckContract(result)

  // Structural check: all expected keys are present
  const keys = Object.keys(contract).sort()
  assert.deepStrictEqual(keys, [
    'checkedAt',
    'componentCount',
    'componentNames',
    'degradedComponents',
    'lytMode',
    'status',
    'unavailableComponents',
    'uptimeSeconds',
    'version',
  ])
})

test('ComponentHealthContract fields match expected shape', () => {
  const component = { name: 'disk', status: HealthStatus.Ok, latencyMs: 3 }
  const contract = toComponentHealthContract(component)

  const keys = Object.keys(contract).sort()
  assert.deepStrictEqual(keys, ['hasDetail', 'latencyMs', 'name', 'status'])
})

test('toHealthCheckContract degrades do not duplicate names', () => {
  const result = {
    status: HealthStatus.Degraded,
    checkedAt: '2026-06-23T08:00:00.000Z',
    uptimeSeconds: 0,
    version: '0',
    components: [
      { name: 'redis', status: HealthStatus.Degraded, latencyMs: 500 },
      { name: 'redis', status: HealthStatus.Degraded, latencyMs: 600 }, // duplicate name (edge)
    ],
  }

  const contract = toHealthCheckContract(result)

  // Both entries are preserved — no dedup logic
  assert.deepStrictEqual(contract.degradedComponents, ['redis', 'redis'])
})
