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
  })
})
