import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validateSync } from 'class-validator'
import {
  AuditRecordDto,
  AuditQueryDto,
  ApprovalDecisionDto,
  RateLimitCheckDto,
  UpsertRateLimitPolicyDto,
  MaskPiiDto,
  AiReviewDto
} from './trust-governance.dto'

it('audit record dto validates required fields', () => {
  const valid = Object.assign(new AuditRecordDto(), {
    eventType: 'user.login',
    details: { ip: '127.0.0.1' }
  })
  const missingEventType = Object.assign(new AuditRecordDto(), {
    details: { ip: '127.0.0.1' }
  })
  const missingDetails = Object.assign(new AuditRecordDto(), {
    eventType: 'user.login'
  })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(missingEventType).some((e) => e.property === 'eventType'), true)
  assert.equal(validateSync(missingDetails).some((e) => e.property === 'details'), true)
})

it('audit record dto validates riskLevel enum', () => {
  const valid = Object.assign(new AuditRecordDto(), {
    eventType: 'user.login',
    details: { ip: '127.0.0.1' },
    riskLevel: 'high'
  })
  const invalid = Object.assign(new AuditRecordDto(), {
    eventType: 'user.login',
    details: { ip: '127.0.0.1' },
    riskLevel: 'extreme'
  })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(invalid).some((e) => e.property === 'riskLevel'), true)
})

it('audit query dto validates limit range', () => {
  const valid = Object.assign(new AuditQueryDto(), { limit: 50 })
  const tooLow = Object.assign(new AuditQueryDto(), { limit: 0 })
  const tooHigh = Object.assign(new AuditQueryDto(), { limit: 200 })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(tooLow).some((e) => e.property === 'limit'), true)
  assert.equal(validateSync(tooHigh).some((e) => e.property === 'limit'), true)
})

it('audit query dto validates limit type', () => {
  const valid = Object.assign(new AuditQueryDto(), { limit: 10 })
  const invalid = Object.assign(new AuditQueryDto(), { limit: 'abc' as unknown as number })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(invalid).some((e) => e.property === 'limit'), true)
})

it('audit query dto accepts optional filters bare', () => {
  const dto = new AuditQueryDto()
  assert.equal(validateSync(dto).length, 0)
})

it('approval decision dto validates required fields', () => {
  const valid = Object.assign(new ApprovalDecisionDto(), {
    decidedBy: 'admin-1',
    expectedVersion: 3,
    decisionNote: 'approved'
  })
  const missingDecidedBy = Object.assign(new ApprovalDecisionDto(), {
    expectedVersion: 3
  })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(missingDecidedBy).some((e) => e.property === 'decidedBy'), true)
})

it('rate limit check dto validates required fields', () => {
  const valid = Object.assign(new RateLimitCheckDto(), {
    scopeKey: 'tenant:t-1',
    limit: 100,
    windowSeconds: 60
  })
  const missingScopeKey = Object.assign(new RateLimitCheckDto(), {
    limit: 100,
    windowSeconds: 60
  })
  const zeroLimit = Object.assign(new RateLimitCheckDto(), {
    scopeKey: 'tenant:t-1',
    limit: 0,
    windowSeconds: 60
  })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(missingScopeKey).some((e) => e.property === 'scopeKey'), true)
  assert.equal(validateSync(zeroLimit).some((e) => e.property === 'limit'), true)
})

it('upsert rate limit policy dto validates required fields and enum', () => {
  const valid = Object.assign(new UpsertRateLimitPolicyDto(), {
    code: 'rl-default',
    scopeType: 'TENANT',
    period: 'MINUTE',
    limit: 60,
    burstLimit: 120
  })
  const invalidScopeType = Object.assign(new UpsertRateLimitPolicyDto(), {
    code: 'rl-default',
    scopeType: 'INVALID',
    period: 'MINUTE',
    limit: 60
  })
  const invalidPeriod = Object.assign(new UpsertRateLimitPolicyDto(), {
    code: 'rl-default',
    scopeType: 'TENANT',
    period: 'SECOND',
    limit: 60
  })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(invalidScopeType).some((e) => e.property === 'scopeType'), true)
  assert.equal(validateSync(invalidPeriod).some((e) => e.property === 'period'), true)
})

it('mask pii dto validates required payload', () => {
  const valid = Object.assign(new MaskPiiDto(), {
    payload: { name: 'John Doe', ssn: '123-45-6789' }
  })
  const missingPayload = new MaskPiiDto()

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(missingPayload).some((e) => e.property === 'payload'), true)
})

it('ai review dto validates required fields', () => {
  const valid = Object.assign(new AiReviewDto(), {
    modelCode: 'gpt-review',
    tenantId: 't-1',
    purpose: 'content-moderation',
    estimatedTokens: 500
  })
  const missingModelCode = Object.assign(new AiReviewDto(), {
    tenantId: 't-1',
    purpose: 'content-moderation'
  })
  const missingPurpose = Object.assign(new AiReviewDto(), {
    modelCode: 'gpt-review',
    tenantId: 't-1'
  })

  assert.equal(validateSync(valid).length, 0)
  assert.equal(validateSync(missingModelCode).some((e) => e.property === 'modelCode'), true)
  assert.equal(validateSync(missingPurpose).some((e) => e.property === 'purpose'), true)
})
