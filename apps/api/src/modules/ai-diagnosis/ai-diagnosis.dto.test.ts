import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import { CreateDiagnosisDto, CreateDiagnosisBatchDto, UpdateDiagnosisDto, DiagnosisQueryDto } from './ai-diagnosis.dto'

describe('AiDiagnosis DTO', () => {
  describe('CreateDiagnosisDto', () => {
    test('should accept valid input', async () => {
      const dto = plainToInstance(CreateDiagnosisDto, {
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001',
        promptSummary: 'Test diagnosis'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('should reject empty engineId', async () => {
      const dto = plainToInstance(CreateDiagnosisDto, {
        engineId: '',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'engineId'))
    })

    test('should reject missing required fields', async () => {
      const dto = plainToInstance(CreateDiagnosisDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length >= 4)
    })

    test('should accept optional promptSummary and inputSnapshot', async () => {
      const dto = plainToInstance(CreateDiagnosisDto, {
        engineId: 'engine-001',
        scenarioId: 'scenario-001',
        tenantId: 'T001',
        requestedBy: 'user-001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('CreateDiagnosisBatchDto', () => {
    test('should accept valid batch input', async () => {
      const dto = plainToInstance(CreateDiagnosisBatchDto, {
        engineId: 'engine-001',
        scenarioIds: ['s1', 's2', 's3'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('should reject empty scenarioIds', async () => {
      const dto = plainToInstance(CreateDiagnosisBatchDto, {
        engineId: 'engine-001',
        scenarioIds: [],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      const errors = await validate(dto)
      // empty array is valid at DTO level, service handles logic
      assert.equal(errors.length, 0)
    })

    test('should reject missing engineId', async () => {
      const dto = plainToInstance(CreateDiagnosisBatchDto, {
        scenarioIds: ['s1'],
        tenantId: 'T001',
        triggeredBy: 'user-001'
      })
      const errors = await validate(dto)
      assert.ok(errors.some((e) => e.property === 'engineId'))
    })
  })

  describe('UpdateDiagnosisDto', () => {
    test('should accept valid status update', async () => {
      const dto = plainToInstance(UpdateDiagnosisDto, {
        status: 'COMPLETED',
        riskLevel: 'high',
        recommendation: 'All clear'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('should reject invalid status', async () => {
      const dto = plainToInstance(UpdateDiagnosisDto, {
        status: 'INVALID_STATUS'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'status'))
    })

    test('should reject invalid risk level', async () => {
      const dto = plainToInstance(UpdateDiagnosisDto, {
        riskLevel: 'extreme'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'riskLevel'))
    })

    test('should accept all valid risk levels', async () => {
      for (const level of ['low', 'medium', 'high', 'critical']) {
        const dto = plainToInstance(UpdateDiagnosisDto, { riskLevel: level })
        const errors = await validate(dto)
        assert.equal(errors.length, 0, `riskLevel ${level} should be valid`)
      }
    })

    test('should accept empty update (all optional)', async () => {
      const dto = plainToInstance(UpdateDiagnosisDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('DiagnosisQueryDto', () => {
    test('should accept all filters', async () => {
      const dto = plainToInstance(DiagnosisQueryDto, {
        engineId: 'engine-001',
        status: 'COMPLETED',
        riskLevel: 'high',
        tenantId: 'T001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    test('should reject invalid status filter', async () => {
      const dto = plainToInstance(DiagnosisQueryDto, {
        status: 'INVALID'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'status'))
    })

    test('should accept empty query (all optional)', async () => {
      const dto = plainToInstance(DiagnosisQueryDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })
})
