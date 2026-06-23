import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const approval = require('./governance-approval')

describe('governance-approval: isGovernanceApprovalExecuted', () => {
  test('returns false when summary is null', () => {
    assert.equal(approval.isGovernanceApprovalExecuted(null), false)
  })

  test('returns false when execution has no executedAt', () => {
    assert.equal(
      approval.isGovernanceApprovalExecuted({ execution: { attempts: 1 } }),
      false
    )
  })

  test('returns true when execution has an executedAt timestamp', () => {
    assert.equal(
      approval.isGovernanceApprovalExecuted({
        execution: { executedAt: '2026-06-13T11:00:00.000Z', executionStatus: 'SUCCESS' }
      }),
      true
    )
  })

  test('returns false when summary is empty object', () => {
    assert.equal(approval.isGovernanceApprovalExecuted({}), false)
  })

  test('returns false when summary is a string instead of object', () => {
    assert.equal(approval.isGovernanceApprovalExecuted('not-an-object'), false)
  })
})

describe('governance-approval: buildInternalApprovalTicket', () => {
  test('generates ticket with APR prefix and operation slug', () => {
    const ticket = approval.buildInternalApprovalTicket('create-user')
    assert.ok(ticket.startsWith('APR-CREATEUS'), `Expected ticket to start with APR-CREATEUS, got: ${ticket}`)
    assert.ok(ticket.length > 12, `Expected ticket to be longer than 12 chars, got: ${ticket.length}`)
  })

  test('generates ticket with uppercase operation prefix truncated to 8 chars', () => {
    const ticket = approval.buildInternalApprovalTicket('very-long-operation-name-here')
    assert.ok(ticket.startsWith('APR-VERYLONG'), `Expected ticket to start with APR-VERYLONG, got: ${ticket}`)
  })

  test('generates unique tickets for same operation', () => {
    const ticket1 = approval.buildInternalApprovalTicket('test')
    const ticket2 = approval.buildInternalApprovalTicket('test')
    assert.notEqual(ticket1, ticket2)
  })

  test('handles special characters in operation name', () => {
    const ticket = approval.buildInternalApprovalTicket('order/create@store!')
    assert.ok(ticket.startsWith('APR-ORDERCRE'), `Got: ${ticket}`)
    assert.ok(ticket.match(/^APR-[A-Z0-9]+-[A-Z0-9]+$/), `Got malformed ticket: ${ticket}`)
  })

  test('handles entirely non-alphanumeric operation as APR prefix default', () => {
    const ticket = approval.buildInternalApprovalTicket('!@#$%^&*()')
    assert.ok(ticket.startsWith('APR-APR-'), `Expected APR-APR- fallback, got: ${ticket}`)
  })
})

describe('governance-approval: assertExpectedVersion', () => {
  test('does not throw when expectedVersion is undefined', () => {
    assert.doesNotThrow(() => approval.assertExpectedVersion(3, undefined))
  })

  test('does not throw when expectedVersion is null', () => {
    assert.doesNotThrow(() => approval.assertExpectedVersion(3, null))
  })

  test('does not throw when versions match', () => {
    assert.doesNotThrow(() => approval.assertExpectedVersion(5, 5))
  })

  test('throws ConflictException when versions differ', () => {
    assert.throws(
      () => approval.assertExpectedVersion(3, 5),
      (err: Error) => err.message.includes('version mismatch') || err.message.includes('Expected')
    )
  })

  test('throws when current version is newer than expected', () => {
    assert.throws(
      () => approval.assertExpectedVersion(10, 5),
      (err: Error) => err.message.includes('10')
    )
  })
})

describe('governance-approval: normalizeRequestedStatus', () => {
  test('returns NOT_REQUIRED when not required and no status', () => {
    assert.equal(approval.normalizeRequestedStatus(false), 'NOT_REQUIRED')
  })

  test('returns provided status when not required', () => {
    assert.equal(approval.normalizeRequestedStatus(false, 'APPROVED'), 'APPROVED')
  })

  test('returns PENDING when required and no status', () => {
    assert.equal(approval.normalizeRequestedStatus(true), 'PENDING')
  })

  test('returns PENDING when required with APPROVED overridden', () => {
    assert.equal(approval.normalizeRequestedStatus(true, 'APPROVED'), 'PENDING')
  })

  test('returns PENDING when required with REJECTED overridden', () => {
    assert.equal(approval.normalizeRequestedStatus(true, 'REJECTED'), 'PENDING')
  })

  test('returns PENDING when required with CANCELLED overridden', () => {
    assert.equal(approval.normalizeRequestedStatus(true, 'CANCELLED'), 'PENDING')
  })

  test('returns PENDING when required with SUPERSEDED overridden', () => {
    assert.equal(approval.normalizeRequestedStatus(true, 'SUPERSEDED'), 'PENDING')
  })

  test('returns PENDING when required with explicit PENDING', () => {
    assert.equal(approval.normalizeRequestedStatus(true, 'PENDING'), 'PENDING')
  })

  test('returns NOT_REQUIRED when required flag is false and status NOT_REQUIRED', () => {
    assert.equal(approval.normalizeRequestedStatus(false, 'NOT_REQUIRED'), 'NOT_REQUIRED')
  })
})

describe('governance-approval: resolveScopeType', () => {
  test('returns PLATFORM when no scopeType provided', () => {
    assert.equal(approval.resolveScopeType(), 'PLATFORM')
  })

  test('returns PLATFORM when scopeType is undefined', () => {
    assert.equal(approval.resolveScopeType(undefined), 'PLATFORM')
  })

  test('returns the string scopeType directly when provided as enum-like value', () => {
    assert.equal(approval.resolveScopeType('PLATFORM'), 'PLATFORM')
  })
})

describe('governance-approval: toPrismaApprovalStatus', () => {
  test('returns the same status value', () => {
    assert.equal(approval.toPrismaApprovalStatus('PENDING'), 'PENDING')
  })

  test('returns APPROVED as-is', () => {
    assert.equal(approval.toPrismaApprovalStatus('APPROVED'), 'APPROVED')
  })

  test('returns CANCELLED as-is', () => {
    assert.equal(approval.toPrismaApprovalStatus('CANCELLED'), 'CANCELLED')
  })
})

describe('governance-approval: matchesApprovalStatus', () => {
  test('matches when string values are equal', () => {
    assert.equal(approval.matchesApprovalStatus('PENDING', 'PENDING'), true)
  })

  test('does not match when values differ', () => {
    assert.equal(approval.matchesApprovalStatus('APPROVED', 'REJECTED'), false)
  })
})

describe('governance-approval: createApprovalMetrics', () => {
  test('creates metrics with zero totals', () => {
    const metrics = approval.createApprovalMetrics()
    assert.equal(metrics.total, 0)
  })

  test('creates metrics with all statuses zeroed', () => {
    const metrics = approval.createApprovalMetrics()
    assert.equal(metrics.statuses.PENDING, 0)
    assert.equal(metrics.statuses.APPROVED, 0)
    assert.equal(metrics.statuses.REJECTED, 0)
    assert.equal(metrics.statuses.CANCELLED, 0)
    assert.equal(metrics.statuses.SUPERSEDED, 0)
    assert.equal(metrics.statuses.NOT_REQUIRED, 0)
  })

  test('creates metrics with execution counters zeroed', () => {
    const metrics = approval.createApprovalMetrics()
    assert.equal(metrics.execution.executed, 0)
    assert.equal(metrics.execution.pending, 0)
    assert.equal(metrics.execution.withFailures, 0)
    assert.deepStrictEqual(metrics.execution.byExecutionStatus, {})
    assert.deepStrictEqual(metrics.execution.byFailureStatus, {})
  })
})

describe('governance-approval: accumulateApprovalMetrics', () => {
  test('increments total count', () => {
    const metrics = approval.createApprovalMetrics()
    const snap = { status: 'PENDING', execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null } }
    approval.accumulateApprovalMetrics(metrics, snap)
    assert.equal(metrics.total, 1)
  })

  test('increments pending status counter', () => {
    const metrics = approval.createApprovalMetrics()
    const snap = { status: 'PENDING', execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null } }
    approval.accumulateApprovalMetrics(metrics, snap)
    assert.equal(metrics.statuses.PENDING, 1)
  })

  test('increments APPROVED status counter', () => {
    const metrics = approval.createApprovalMetrics()
    const snap = { status: 'APPROVED', execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null } }
    approval.accumulateApprovalMetrics(metrics, snap)
    assert.equal(metrics.statuses.APPROVED, 1)
  })

  test('counts executed flag', () => {
    const metrics = approval.createApprovalMetrics()
    const snap = {
      status: 'APPROVED' as const,
      execution: { attempts: 1, executed: true, executionStatus: 'SUCCESS', executedAt: '2026-01-01T00:00:00Z', executedBy: 'test-user', lastFailure: null }
    }
    approval.accumulateApprovalMetrics(metrics, snap)
    assert.equal(metrics.execution.executed, 1)
  })

  test('counts pending execution', () => {
    const metrics = approval.createApprovalMetrics()
    const snap = {
      status: 'PENDING' as const,
      execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null }
    }
    approval.accumulateApprovalMetrics(metrics, snap)
    assert.equal(metrics.execution.pending, 1)
  })

  test('counts withFailures flag', () => {
    const metrics = approval.createApprovalMetrics()
    const snap = {
      status: 'APPROVED' as const,
      execution: {
        attempts: 2,
        executed: false,
        executionStatus: null,
        executedAt: null,
        executedBy: null,
        lastFailure: { failureStatus: 'NETWORK_ERROR', failureReason: 'timeout', failedAt: '2026-01-01T00:00:00Z', failedBy: 'system' }
      }
    }
    approval.accumulateApprovalMetrics(metrics, snap)
    assert.equal(metrics.execution.withFailures, 1)
    assert.equal(metrics.execution.byFailureStatus['NETWORK_ERROR'], 1)
  })

  test('accumulates multiple approvals correctly', () => {
    const metrics = approval.createApprovalMetrics()
    approval.accumulateApprovalMetrics(metrics, {
      status: 'PENDING',
      execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null }
    })
    approval.accumulateApprovalMetrics(metrics, {
      status: 'APPROVED',
      execution: { attempts: 1, executed: true, executionStatus: 'SUCCESS', executedAt: '2026-01-01T00:00:00Z', executedBy: 'user1', lastFailure: null }
    })
    approval.accumulateApprovalMetrics(metrics, {
      status: 'REJECTED',
      execution: { attempts: 0, executed: false, executionStatus: null, executedAt: null, executedBy: null, lastFailure: null }
    })

    assert.equal(metrics.total, 3)
    assert.equal(metrics.statuses.PENDING, 1)
    assert.equal(metrics.statuses.APPROVED, 1)
    assert.equal(metrics.statuses.REJECTED, 1)
    assert.equal(metrics.execution.executed, 1)
    assert.equal(metrics.execution.pending, 2)
  })
})

describe('governance-approval: toApprovalSnapshot', () => {
  test('maps approval record to snapshot with all fields', () => {
    const record = {
      id: 'approval-001',
      operation: 'create',
      resourceType: 'store',
      resourceKey: 'store-42',
      required: true,
      version: 3,
      requestedBy: 'user-abc',
      approvalTicket: 'APR-CREATE-XZ123ABC',
      status: 'PENDING' as const,
      decidedBy: null,
      decidedAt: null,
      updatedAt: new Date('2026-06-13T12:00:00Z'),
      summary: null
    }

    const snap = approval.toApprovalSnapshot(record)

    assert.equal(snap.approvalId, 'approval-001')
    assert.equal(snap.operation, 'create')
    assert.equal(snap.resourceType, 'store')
    assert.equal(snap.resourceKey, 'store-42')
    assert.equal(snap.required, true)
    assert.equal(snap.version, 3)
    assert.equal(snap.requestedBy, 'user-abc')
    assert.equal(snap.ticket, 'APR-CREATE-XZ123ABC')
    assert.equal(snap.status, 'PENDING')
    assert.equal(snap.decidedBy, null)
    assert.equal(snap.decidedAt, null)
    assert.equal(snap.updatedAt, '2026-06-13T12:00:00.000Z')
    assert.equal(snap.execution.executed, false)
    assert.equal(snap.execution.attempts, 0)
  })

  test('maps execution summary from nested summary object', () => {
    const record = {
      id: 'approval-002',
      operation: 'update',
      resourceType: 'brand',
      resourceKey: 'brand-99',
      required: true,
      version: 1,
      requestedBy: 'user-xyz',
      approvalTicket: 'APR-UPDATE-XX123',
      status: 'APPROVED' as const,
      decidedBy: 'admin',
      decidedAt: new Date('2026-06-13T10:00:00Z'),
      updatedAt: new Date('2026-06-13T11:00:00Z'),
      summary: {
        execution: {
          executedAt: '2026-06-13T11:00:00.000Z',
          executedBy: 'worker',
          executionStatus: 'SUCCESS'
        }
      }
    }

    const snap = approval.toApprovalSnapshot(record)

    assert.equal(snap.execution.executed, true)
    assert.equal(snap.execution.executionStatus, 'SUCCESS')
    assert.equal(snap.execution.executedBy, 'worker')
    assert.equal(snap.execution.executedAt, '2026-06-13T11:00:00.000Z')
    assert.equal(snap.execution.attempts, 0)
  })

  test('maps execution failure from summary', () => {
    const record = {
      id: 'approval-003',
      operation: 'delete',
      resourceType: 'store',
      resourceKey: 'store-7',
      required: true,
      version: 2,
      requestedBy: 'user-xyz',
      approvalTicket: 'APR-DELETE-XX777',
      status: 'APPROVED' as const,
      decidedBy: 'admin',
      decidedAt: new Date('2026-06-13T09:00:00Z'),
      updatedAt: new Date('2026-06-13T10:00:00Z'),
      summary: {
        executionAttempts: 3,
        executionFailure: {
          failedAt: '2026-06-13T10:30:00.000Z',
          failedBy: 'system',
          failureStatus: 'NETWORK_ERROR',
          failureReason: 'Connection timeout'
        }
      }
    }

    const snap = approval.toApprovalSnapshot(record)

    assert.equal(snap.execution.attempts, 3)
    assert.equal(snap.execution.executed, false)
    assert.equal(snap.execution.lastFailure?.failureStatus, 'NETWORK_ERROR')
    assert.equal(snap.execution.lastFailure?.failureReason, 'Connection timeout')
    assert.equal(snap.execution.lastFailure?.failedBy, 'system')
  })

  test('handles null approvalTicket', () => {
    const record = {
      id: 'approval-004',
      operation: 'read',
      resourceType: 'document',
      resourceKey: 'doc-1',
      required: false,
      version: 1,
      requestedBy: null,
      approvalTicket: null,
      status: 'NOT_REQUIRED' as const,
      decidedBy: null,
      decidedAt: null,
      updatedAt: new Date('2026-06-13T08:00:00Z'),
      summary: null
    }

    const snap = approval.toApprovalSnapshot(record)

    assert.equal(snap.ticket, null)
    assert.equal(snap.requestedBy, null)
    assert.equal(snap.status, 'NOT_REQUIRED')
    assert.equal(snap.required, false)
  })
})

describe('governance-approval: toExecutionSummary', () => {
  test('returns empty summary for null input', () => {
    const summary = approval.toExecutionSummary(null)
    assert.equal(summary.attempts, 0)
    assert.equal(summary.executed, false)
    assert.equal(summary.executionStatus, null)
    assert.equal(summary.executedAt, null)
    assert.equal(summary.executedBy, null)
    assert.equal(summary.lastFailure, null)
  })

  test('maps execution details from summary object', () => {
    const summary = approval.toExecutionSummary({
      executionAttempts: 2,
      execution: {
        executedAt: '2026-06-13T12:00:00Z',
        executedBy: 'user1',
        executionStatus: 'SUCCESS'
      }
    })
    assert.equal(summary.attempts, 2)
    assert.equal(summary.executed, true)
    assert.equal(summary.executionStatus, 'SUCCESS')
    assert.equal(summary.executedBy, 'user1')
    assert.equal(summary.executedAt, '2026-06-13T12:00:00Z')
  })
})

describe('governance-approval: normalizeGroupBy', () => {
  test('returns empty array when value is undefined', () => {
    assert.deepStrictEqual(approval.normalizeGroupBy(undefined), [])
  })

  test('returns array as-is', () => {
    assert.deepStrictEqual(approval.normalizeGroupBy(['status', 'operation']), ['status', 'operation'])
  })

  test('parses comma-separated string', () => {
    assert.deepStrictEqual(approval.normalizeGroupBy('status,operation'), ['status', 'operation'])
  })

  test('parses single string value', () => {
    assert.deepStrictEqual(approval.normalizeGroupBy('status'), ['status'])
  })

  test('trims whitespace from string values', () => {
    assert.deepStrictEqual(approval.normalizeGroupBy(' status , operation '), ['status', 'operation'])
  })
})

describe('governance-approval: getApprovalGroupValue', () => {
  const snap: any = {
    approvalId: 'id-1',
    operation: 'create',
    resourceType: 'store',
    resourceKey: 'k1',
    required: true,
    version: 1,
    requestedBy: 'user-1',
    ticket: 'TICKET-1',
    status: 'PENDING',
    decidedBy: null,
    decidedAt: null,
    updatedAt: null,
    submitted: true,
    persisted: true,
    execution: {
      attempts: 0,
      executed: false,
      executionStatus: null,
      executedAt: null,
      executedBy: null,
      lastFailure: null
    },
    summary: null
  }

  test('returns operation value', () => {
    assert.equal(approval.getApprovalGroupValue(snap, 'operation'), 'create')
  })

  test('returns resourceType value', () => {
    assert.equal(approval.getApprovalGroupValue(snap, 'resourceType'), 'store')
  })

  test('returns status value', () => {
    assert.equal(approval.getApprovalGroupValue(snap, 'status'), 'PENDING')
  })

  test('returns requestedBy value', () => {
    assert.equal(approval.getApprovalGroupValue(snap, 'requestedBy'), 'user-1')
  })

  test('returns null for unknown groupBy key', () => {
    assert.equal(approval.getApprovalGroupValue(snap, 'unknown' as any), null)
  })
})

describe('governance-approval: assertApprovalBinding', () => {
  test('does not throw when all fields match', () => {
    const existing = {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 'store-1',
      scopeType: 'PLATFORM' as const,
      tenantId: null,
      brandId: null,
      storeId: null
    }
    const input = { operation: 'create', resourceType: 'store', resourceKey: 'store-1' }
    assert.doesNotThrow(() => approval.assertApprovalBinding(existing, input))
  })

  test('throws when operation differs', () => {
    const existing = {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 'store-1',
      scopeType: 'PLATFORM' as const,
      tenantId: null,
      brandId: null,
      storeId: null
    }
    const input = { operation: 'delete', resourceType: 'store', resourceKey: 'store-1' }
    assert.throws(() => approval.assertApprovalBinding(existing, input))
  })

  test('throws when resourceType differs', () => {
    const existing = {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 'store-1',
      scopeType: 'PLATFORM' as const,
      tenantId: null,
      brandId: null,
      storeId: null
    }
    const input = { operation: 'create', resourceType: 'brand', resourceKey: 'store-1' }
    assert.throws(() => approval.assertApprovalBinding(existing, input))
  })

  test('throws when resourceKey differs', () => {
    const existing = {
      operation: 'create',
      resourceType: 'store',
      resourceKey: 'store-1',
      scopeType: 'PLATFORM' as const,
      tenantId: null,
      brandId: null,
      storeId: null
    }
    const input = { operation: 'create', resourceType: 'store', resourceKey: 'store-other' }
    assert.throws(() => approval.assertApprovalBinding(existing, input))
  })
})

describe('governance-approval: assertRequestDigest', () => {
  test('does not throw when existing digest is null', () => {
    assert.doesNotThrow(() => approval.assertRequestDigest(null, 'abc123'))
  })

  test('does not throw when no requestDigest is provided to compare', () => {
    assert.doesNotThrow(() => approval.assertRequestDigest({ requestDigest: 'existing-digest' }, null))
  })

  test('does not throw when digests match', () => {
    assert.doesNotThrow(() => approval.assertRequestDigest({ requestDigest: 'same-digest' }, 'same-digest'))
  })

  test('throws when digests differ', () => {
    assert.throws(
      () => approval.assertRequestDigest({ requestDigest: 'old-digest' }, 'new-digest'),
      (err: Error) => err.message.includes('request payload') || err.message.includes('digest')
    )
  })
})

describe('governance-approval: stableStringify', () => {
  test('stringifies null', () => {
    assert.equal(approval.stableStringify(null), 'null')
  })

  test('stringifies number', () => {
    assert.equal(approval.stableStringify(42), '42')
  })

  test('stringifies string', () => {
    assert.equal(approval.stableStringify('hello'), '"hello"')
  })

  test('stringifies array', () => {
    assert.equal(approval.stableStringify([1, 2, 3]), '[1,2,3]')
  })

  test('stringifies object with sorted keys', () => {
    const result = approval.stableStringify({ z: 1, a: 2 })
    assert.equal(result, '{"a":2,"z":1}')
  })

  test('stable stringify produces same output for differently-ordered inputs', () => {
    const a = approval.stableStringify({ b: 1, a: 2, c: 3 })
    const b2 = approval.stableStringify({ a: 2, c: 3, b: 1 })
    assert.equal(a, b2)
  })

  test('stable stringify handles nested objects', () => {
    const result = approval.stableStringify({ user: { name: 'test', id: 1 } })
    assert.equal(result, '{"user":{"id":1,"name":"test"}}')
  })

  test('stable stringify handles nested arrays', () => {
    const result = approval.stableStringify({ items: [3, 1, 2] })
    assert.equal(result, '{"items":[3,1,2]}')
  })
})

describe('governance-approval: buildRequestDigest', () => {
  test('returns a hex string', () => {
    const digest = approval.buildRequestDigest({ key: 'value' })
    assert.ok(typeof digest === 'string')
    assert.ok(/^[0-9a-f]{64}$/.test(digest), `Expected 64-char hex, got: ${digest}`)
  })

  test('same input produces same digest', () => {
    const d1 = approval.buildRequestDigest({ a: 1, b: 2 })
    const d2 = approval.buildRequestDigest({ a: 1, b: 2 })
    assert.equal(d1, d2)
  })

  test('different inputs produce different digests', () => {
    const d1 = approval.buildRequestDigest({ a: 1 })
    const d2 = approval.buildRequestDigest({ a: 2 })
    assert.notEqual(d1, d2)
  })
})

describe('governance-approval: parseDate', () => {
  test('returns null for undefined', () => {
    assert.equal(approval.parseDate(undefined), null)
  })

  test('returns null for empty string', () => {
    assert.equal(approval.parseDate(''), null)
  })

  test('returns null for invalid date string', () => {
    assert.equal(approval.parseDate('not-a-date'), null)
  })

  test('parses valid ISO date string', () => {
    const result = approval.parseDate('2026-06-13T12:00:00Z')
    assert.ok(result instanceof Date)
    assert.equal(result.toISOString(), '2026-06-13T12:00:00.000Z')
  })
})

describe('governance-approval: matchesApprovalListFilters', () => {
  const baseSnap = {
    approvalId: 'id-1',
    operation: 'create',
    resourceType: 'store',
    resourceKey: 'k1',
    required: true,
    version: 1,
    requestedBy: 'user-1',
    ticket: 'TICKET-1',
    status: 'PENDING' as const,
    decidedBy: null,
    decidedAt: null,
    updatedAt: null,
    submitted: true,
    persisted: true,
    execution: {
      attempts: 0,
      executed: false,
      executionStatus: null,
      executedAt: null,
      executedBy: null,
      lastFailure: null
    },
    summary: null
  }

  test('returns true with empty filters', () => {
    assert.equal(approval.matchesApprovalListFilters(baseSnap, {}), true)
  })

  test('returns true when operationIn includes approval operation', () => {
    assert.equal(approval.matchesApprovalListFilters(baseSnap, { operationIn: ['create', 'update'] }), true)
  })

  test('returns false when operationIn does not include approval operation', () => {
    assert.equal(approval.matchesApprovalListFilters(baseSnap, { operationIn: ['delete'] }), false)
  })

  test('returns true when resourceTypeIn includes approval resourceType', () => {
    assert.equal(approval.matchesApprovalListFilters(baseSnap, { resourceTypeIn: ['store', 'brand'] }), true)
  })

  test('returns false when resourceTypeIn does not include approval resourceType', () => {
    assert.equal(approval.matchesApprovalListFilters(baseSnap, { resourceTypeIn: ['brand'] }), false)
  })
})

describe('governance-approval: matchesApprovalExecutionFilters', () => {
  const baseSnap = {
    approvalId: 'id-1',
    operation: 'create',
    resourceType: 'store',
    resourceKey: 'k1',
    required: true,
    version: 1,
    requestedBy: 'user-1',
    ticket: 'TICKET-1',
    status: 'PENDING' as const,
    decidedBy: null,
    decidedAt: null,
    updatedAt: null,
    submitted: true,
    persisted: true,
    execution: {
      attempts: 0,
      executed: false,
      executionStatus: null,
      executedAt: null,
      executedBy: null,
      lastFailure: null
    },
    summary: null
  }

  test('returns true with empty execution filters', () => {
    assert.equal(approval.matchesApprovalExecutionFilters(baseSnap, {}), true)
  })

  test('returns true when executed filter matches', () => {
    assert.equal(approval.matchesApprovalExecutionFilters(baseSnap, { executed: false }), true)
  })

  test('returns false when executed filter does not match', () => {
    assert.equal(approval.matchesApprovalExecutionFilters(baseSnap, { executed: true }), false)
  })
})
