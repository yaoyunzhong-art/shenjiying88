import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  TriggerRollbackRequestDto,
  ConfirmRollbackRequestDto,
  CancelRollbackRequestDto,
  ListRecordsQueryDto,
  ConfigureRequestDto,
  RollbackRecordDto,
  SnapshotDto,
  EngineStatusDto,
  toRollbackRecordDto,
  toSnapshotDto,
  toEngineStatusDto,
} from './auto-rollback.dto'

describe('AutoRollback DTOs', () => {
  describe('TriggerRollbackRequestDto', () => {
    it('should validate a valid trigger request', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'P95 spike',
        severity: 'WARNING',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject missing reason', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        severity: 'WARNING',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid severity', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'test',
        severity: 'INVALID',
        metricKey: '/api/coupons',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept optional snapshotKind', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 999,
        baselineValue: 100,
        snapshotKind: 'REDIS',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
      expect(dto.snapshotKind).toBe('REDIS')
    })

    it('should accept optional trigger', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
        trigger: 'anomaly-detector-v2',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
      expect(dto.trigger).toBe('anomaly-detector-v2')
    })

    it('should reject empty string reason', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: '',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing metricKey', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'test',
        severity: 'WARNING',
        anomalyValue: 110,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing anomalyValue', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept CRITICAL severity', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'critical issue',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 500,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
      expect(dto.severity).toBe('CRITICAL')
    })

    it('should reject non-numeric anomalyValue', async () => {
      const dto = plainToInstance(TriggerRollbackRequestDto, {
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 'abc' as unknown as number,
        baselineValue: 100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('ConfirmRollbackRequestDto', () => {
    it('should validate a confirm request', async () => {
      const dto = plainToInstance(ConfirmRollbackRequestDto, { id: 'rollback-1' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty id', async () => {
      const dto = plainToInstance(ConfirmRollbackRequestDto, { id: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing id', async () => {
      const dto = plainToInstance(ConfirmRollbackRequestDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('CancelRollbackRequestDto', () => {
    it('should validate a cancel request with reason', async () => {
      const dto = plainToInstance(CancelRollbackRequestDto, {
        id: 'rollback-1',
        reason: 'False alarm',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate a cancel request without reason', async () => {
      const dto = plainToInstance(CancelRollbackRequestDto, { id: 'rollback-1' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty cancel id', async () => {
      const dto = plainToInstance(CancelRollbackRequestDto, { id: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('ListRecordsQueryDto', () => {
    it('should accept valid filter params', async () => {
      const dto = plainToInstance(ListRecordsQueryDto, {
        status: 'COMPLETED',
        metricKey: '/api/coupons',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept empty params', async () => {
      const dto = plainToInstance(ListRecordsQueryDto, {})
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept status filter only', async () => {
      const dto = plainToInstance(ListRecordsQueryDto, { status: 'FAILED' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
      expect(dto.status).toBe('FAILED')
    })

    it('should accept metricKey filter only', async () => {
      const dto = plainToInstance(ListRecordsQueryDto, { metricKey: '/api/orders' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
      expect(dto.metricKey).toBe('/api/orders')
    })
  })

  describe('ConfigureRequestDto', () => {
    it('should validate a valid config', async () => {
      const dto = plainToInstance(ConfigureRequestDto, {
        criticalRequiresConfirm: false,
        confirmationDelayMs: 60000,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject confirmationDelayMs too low', async () => {
      const dto = plainToInstance(ConfigureRequestDto, { confirmationDelayMs: 100 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept empty config', async () => {
      const dto = plainToInstance(ConfigureRequestDto, {})
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject confirmationDelayMs exceeding max', async () => {
      const dto = plainToInstance(ConfigureRequestDto, { confirmationDelayMs: 999999 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject autoTimeoutMs below min', async () => {
      const dto = plainToInstance(ConfigureRequestDto, { autoTimeoutMs: 100 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject maxConcurrent exceeding max', async () => {
      const dto = plainToInstance(ConfigureRequestDto, { maxConcurrent: 100 })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept boolean criticalRequiresConfirm', async () => {
      const dto = plainToInstance(ConfigureRequestDto, { criticalRequiresConfirm: false })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
      expect(dto.criticalRequiresConfirm).toBe(false)
    })
  })

  describe('toRollbackRecordDto helper', () => {
    it('should convert a record to DTO', () => {
      const dto = toRollbackRecordDto({
        id: 'rollback-1',
        reason: 'test',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
        status: 'PENDING',
        requiresConfirmation: false,
        confirmationDelayMs: 30000,
        history: [{ status: 'PENDING', timestamp: '2026-06-25T10:00:00Z' }],
        createdAt: '2026-06-25T10:00:00Z',
      })
      expect(dto.id).toBe('rollback-1')
      expect(dto.severity).toBe('WARNING')
      expect(dto.history).toHaveLength(1)
    })

    it('should preserve completedAt when present', () => {
      const dto = toRollbackRecordDto({
        id: 'rollback-2',
        reason: 'test',
        severity: 'CRITICAL',
        metricKey: 'm',
        anomalyValue: 500,
        baselineValue: 100,
        status: 'COMPLETED',
        snapshotId: 'snap-1',
        requiresConfirmation: true,
        confirmationDelayMs: 30000,
        history: [{ status: 'COMPLETED', timestamp: '2026-06-25T10:01:00Z' }],
        createdAt: '2026-06-25T10:00:00Z',
        completedAt: '2026-06-25T10:01:00Z',
      })
      expect(dto.completedAt).toBe('2026-06-25T10:01:00Z')
      expect(dto.snapshotId).toBe('snap-1')
    })

    it('should preserve all history entries', () => {
      const history = [
        { status: 'PENDING' as const, timestamp: 't1', note: 'triggered' },
        { status: 'COMPLETED' as const, timestamp: 't2', note: 'done' },
      ]
      const dto = toRollbackRecordDto({
        id: 'rollback-3',
        reason: 'multi-history',
        severity: 'WARNING',
        metricKey: 'm',
        anomalyValue: 110,
        baselineValue: 100,
        status: 'COMPLETED',
        requiresConfirmation: false,
        confirmationDelayMs: 30000,
        history,
        createdAt: 't0',
        completedAt: 't2',
      })
      expect(dto.history).toHaveLength(2)
      expect(dto.history[0].note).toBe('triggered')
      expect(dto.history[1].note).toBe('done')
    })
  })

  describe('toSnapshotDto helper', () => {
    it('should convert a snapshot to DTO', () => {
      const dto = toSnapshotDto({
        id: 'snap-1',
        kind: 'FULL',
        size: 512,
        createdAt: '2026-06-25T10:00:00Z',
        trigger: 'P95 spike',
      })
      expect(dto.id).toBe('snap-1')
      expect(dto.kind).toBe('FULL')
      expect(dto.size).toBe(512)
    })

    it('should convert REDIS snapshot', () => {
      const dto = toSnapshotDto({
        id: 'snap-2',
        kind: 'REDIS',
        size: 256,
        createdAt: '2026-06-25T10:00:00Z',
        trigger: 'redis rollback',
      })
      expect(dto.kind).toBe('REDIS')
    })
  })

  describe('toEngineStatusDto helper', () => {
    it('should convert status to DTO', () => {
      const dto = toEngineStatusDto({
        engineName: 'AutoRollback',
        activeRecords: 2,
        status: 'ACTIVE',
        lastEvaluationAt: '2026-06-25T10:00:00Z',
      })
      expect(dto.engineName).toBe('AutoRollback')
      expect(dto.activeRecords).toBe(2)
      expect(dto.status).toBe('ACTIVE')
    })

    it('should handle DEGRADED status without lastEvaluation', () => {
      const dto = toEngineStatusDto({
        engineName: 'AutoRollback',
        activeRecords: 3,
        status: 'DEGRADED',
      })
      expect(dto.status).toBe('DEGRADED')
      expect(dto.lastEvaluationAt).toBeUndefined()
    })

    it('should handle STOPPED status', () => {
      const dto = toEngineStatusDto({
        engineName: 'AutoRollback',
        activeRecords: 0,
        status: 'STOPPED',
      })
      expect(dto.status).toBe('STOPPED')
      expect(dto.activeRecords).toBe(0)
    })
  })
})
