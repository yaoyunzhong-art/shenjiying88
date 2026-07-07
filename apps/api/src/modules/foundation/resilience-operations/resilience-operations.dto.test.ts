import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validateSync } from 'class-validator'
import {
  ObservabilityQueryDto,
  RecoveryPlanQueryDto,
  RetryPolicyQueryDto,
  StageEdgeReplayDto
} from './resilience-operations.dto'

it('ObservabilityQueryDto accepts optional status filter', () => {
  // empty query should be valid (no required fields)
  const empty = new ObservabilityQueryDto()
  assert.equal(validateSync(empty).length, 0)

  // with valid status string
  const withStatus = Object.assign(new ObservabilityQueryDto(), { status: 'warning' })
  assert.equal(validateSync(withStatus).length, 0)

  // non-string status should fail
  const invalidStatus = Object.assign(new ObservabilityQueryDto(), { status: 123 })
  assert.equal(validateSync(invalidStatus).length > 0, true)
})

it('RetryPolicyQueryDto accepts optional capability filter', () => {
  const empty = new RetryPolicyQueryDto()
  assert.equal(validateSync(empty).length, 0)

  const withCapability = Object.assign(new RetryPolicyQueryDto(), { capability: 'edge-sync' })
  assert.equal(validateSync(withCapability).length, 0)

  // non-string capability should fail
  const invalidCapability = Object.assign(new RetryPolicyQueryDto(), { capability: 456 })
  assert.equal(validateSync(invalidCapability).length > 0, true)
})

it('RecoveryPlanQueryDto accepts optional status filter', () => {
  const empty = new RecoveryPlanQueryDto()
  assert.equal(validateSync(empty).length, 0)

  const withStatus = Object.assign(new RecoveryPlanQueryDto(), { status: 'ready' })
  assert.equal(validateSync(withStatus).length, 0)
})

it('StageEdgeReplayDto validates required fields and bounds', () => {
  // valid payload
  const valid = Object.assign(new StageEdgeReplayDto(), {
    storeId: 'store-001',
    operationCount: 100
  })
  assert.equal(validateSync(valid).length, 0)

  // missing required storeId
  const missingStoreId = Object.assign(new StageEdgeReplayDto(), {
    operationCount: 100
  })
  const storeIdErrors = validateSync(missingStoreId)
  assert.equal(storeIdErrors.length > 0, true)
  assert.equal(storeIdErrors.some((e) => e.property === 'storeId'), true)

  // missing required operationCount
  const missingCount = Object.assign(new StageEdgeReplayDto(), {
    storeId: 'store-001'
  })
  const countErrors = validateSync(missingCount)
  assert.equal(countErrors.length > 0, true)
  assert.equal(countErrors.some((e) => e.property === 'operationCount'), true)

  // operationCount below min (1)
  const belowMin = Object.assign(new StageEdgeReplayDto(), {
    storeId: 'store-001',
    operationCount: 0
  })
  const belowMinErrors = validateSync(belowMin)
  assert.equal(belowMinErrors.length > 0, true)
  assert.equal(belowMinErrors.some((e) => e.property === 'operationCount'), true)

  // operationCount above max (5000)
  const aboveMax = Object.assign(new StageEdgeReplayDto(), {
    storeId: 'store-001',
    operationCount: 5001
  })
  const aboveMaxErrors = validateSync(aboveMax)
  assert.equal(aboveMaxErrors.length > 0, true)
  assert.equal(aboveMaxErrors.some((e) => e.property === 'operationCount'), true)

  // operationCount at boundary min=1
  const atMin = Object.assign(new StageEdgeReplayDto(), {
    storeId: 'store-001',
    operationCount: 1
  })
  assert.equal(validateSync(atMin).length, 0)

  // operationCount at boundary max=5000
  const atMax = Object.assign(new StageEdgeReplayDto(), {
    storeId: 'store-001',
    operationCount: 5000
  })
  assert.equal(validateSync(atMax).length, 0)
})
