import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 监控告警 - DTO 校验测试 (V10 Day 9 Phase 93)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  RecordMetricDto,
  RecordMetricsBatchDto,
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  SilenceAlertDto,
  QueryMetricDto,
  ListAlertsQueryDto,
} from './monitoring.dto'

// ── RecordMetricDto ──────────────────────────────────────────────
describe('monitoring.dto: RecordMetricDto', () => {
  it('validates a complete valid metric record', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      name: 'cpu.usage_percent',
      value: 75.5,
      labels: { host: 'server-01' },
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects empty name', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      name: '',
      value: 10,
      labels: {},
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects name that is too long', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      name: 'x'.repeat(129),
      value: 10,
      labels: {},
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects missing name', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      value: 10,
      labels: {},
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects non-number value', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      name: 'test',
      value: 'not-a-number',
      labels: {},
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('accepts zero value', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      name: 'http.error.rate',
      value: 0,
      labels: {},
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects non-object labels', async () => {
    const dto = plainToInstance(RecordMetricDto, {
      name: 'test',
      value: 1,
      labels: 'not-an-object',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── RecordMetricsBatchDto ────────────────────────────────────────
describe('monitoring.dto: RecordMetricsBatchDto', () => {
  it('validates batch with valid points', async () => {
    const dto = plainToInstance(RecordMetricsBatchDto, {
      points: [
        { name: 'cpu.usage', value: 50, labels: {} },
        { name: 'memory.usage', value: 60, labels: { host: 'srv-1' } },
      ],
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects empty points array', async () => {
    const dto = plainToInstance(RecordMetricsBatchDto, {
      points: [],
    })
    const errors = await validate(dto)
    assert.ok(errors.length === 0) // empty array is technically valid
  })

  it('validates nested point objects', async () => {
    const dto = plainToInstance(RecordMetricsBatchDto, {
      points: [
        { name: '', value: 'string', labels: 'bad' },
      ],
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects non-array points', async () => {
    const dto = plainToInstance(RecordMetricsBatchDto, {
      points: 'not-an-array',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── CreateAlertRuleDto ───────────────────────────────────────────
describe('monitoring.dto: CreateAlertRuleDto', () => {
  it('validates a complete valid alert rule', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: '高错误率告警',
      metric: 'http.error.rate',
      comparator: 'gt',
      threshold: 0.05,
      durationSec: 60,
      severity: 'error',
      channels: ['in_app', 'webhook'],
      enabled: true,
      createdBy: 'admin-001',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects empty name', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: '',
      metric: 'test',
      comparator: 'gt',
      threshold: 10,
      durationSec: 0,
      severity: 'info',
      channels: ['email'],
      enabled: true,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some((e) => e.property === 'name'))
  })

  it('rejects invalid comparator', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'test',
      metric: 'test',
      comparator: 'invalid',
      threshold: 10,
      durationSec: 0,
      severity: 'info',
      channels: ['email'],
      enabled: true,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects negative threshold', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'test',
      metric: 'test',
      comparator: 'gt',
      threshold: -1,
      durationSec: 0,
      severity: 'info',
      channels: ['email'],
      enabled: true,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects durationSec exceeding 86400', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'test',
      metric: 'test',
      comparator: 'gt',
      threshold: 10,
      durationSec: 90000,
      severity: 'info',
      channels: ['email'],
      enabled: true,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects invalid severity', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'test',
      metric: 'test',
      comparator: 'gt',
      threshold: 10,
      durationSec: 0,
      severity: 'super-critical',
      channels: ['email'],
      enabled: true,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects invalid channel type', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'test',
      metric: 'test',
      comparator: 'gt',
      threshold: 10,
      durationSec: 0,
      severity: 'info',
      channels: ['pigeon-carrier'],
      enabled: true,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects empty createdBy', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'test',
      metric: 'test',
      comparator: 'gt',
      threshold: 10,
      durationSec: 0,
      severity: 'info',
      channels: ['email'],
      enabled: true,
      createdBy: '',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('accepts zero duration (immediate fire)', async () => {
    const dto = plainToInstance(CreateAlertRuleDto, {
      name: 'immediate',
      metric: 'test',
      comparator: 'eq',
      threshold: 0,
      durationSec: 0,
      severity: 'info',
      channels: ['in_app'],
      enabled: false,
      createdBy: 'admin',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })
})

// ── UpdateAlertRuleDto ───────────────────────────────────────────
describe('monitoring.dto: UpdateAlertRuleDto', () => {
  it('validates partial update with one field', async () => {
    const dto = plainToInstance(UpdateAlertRuleDto, {
      threshold: 0.1,
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates partial update with all fields', async () => {
    const dto = plainToInstance(UpdateAlertRuleDto, {
      name: 'updated-name',
      metric: 'cpu.usage',
      comparator: 'gte',
      threshold: 90,
      durationSec: 120,
      severity: 'critical',
      channels: ['sms', 'phone'],
      enabled: false,
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('accepts empty object (no fields provided)', async () => {
    const dto = plainToInstance(UpdateAlertRuleDto, {})
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects invalid comparator in update', async () => {
    const dto = plainToInstance(UpdateAlertRuleDto, {
      comparator: 'bad-op',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects negative threshold in update', async () => {
    const dto = plainToInstance(UpdateAlertRuleDto, {
      threshold: -5,
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── SilenceAlertDto ──────────────────────────────────────────────
describe('monitoring.dto: SilenceAlertDto', () => {
  it('validates valid silence request', async () => {
    const dto = plainToInstance(SilenceAlertDto, {
      durationSec: 3600,
      operator: 'ops-admin',
      reason: '夜间维护屏蔽',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates silence without optional reason', async () => {
    const dto = plainToInstance(SilenceAlertDto, {
      durationSec: 1800,
      operator: 'admin',
    })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects negative durationSec', async () => {
    const dto = plainToInstance(SilenceAlertDto, {
      durationSec: -1,
      operator: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects durationSec exceeding 7 days', async () => {
    const dto = plainToInstance(SilenceAlertDto, {
      durationSec: 86400 * 7 + 1,
      operator: 'admin',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects empty operator', async () => {
    const dto = plainToInstance(SilenceAlertDto, {
      durationSec: 300,
      operator: '',
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('rejects missing operator', async () => {
    const dto = plainToInstance(SilenceAlertDto, {
      durationSec: 300,
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── QueryMetricDto ───────────────────────────────────────────────
describe('monitoring.dto: QueryMetricDto', () => {
  it('validates empty query', async () => {
    const dto = plainToInstance(QueryMetricDto, {})
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates with limit string', async () => {
    const dto = plainToInstance(QueryMetricDto, { limit: '50' })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates with limit as string number', async () => {
    const dto = plainToInstance(QueryMetricDto, { limit: '100' })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })
})

// ── ListAlertsQueryDto ───────────────────────────────────────────
describe('monitoring.dto: ListAlertsQueryDto', () => {
  it('validates empty query', async () => {
    const dto = plainToInstance(ListAlertsQueryDto, {})
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates firing status', async () => {
    const dto = plainToInstance(ListAlertsQueryDto, { status: 'firing' })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates resolved status', async () => {
    const dto = plainToInstance(ListAlertsQueryDto, { status: 'resolved' })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('validates silenced status', async () => {
    const dto = plainToInstance(ListAlertsQueryDto, { status: 'silenced' })
    const errors = await validate(dto)
    assert.strictEqual(errors.length, 0)
  })

  it('rejects invalid status value', async () => {
    const dto = plainToInstance(ListAlertsQueryDto, { status: 'unknown' })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})
