import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  DeviceMetricsDto,
  MemberLevelInputDto,
  DeviceAnomalyInputDto,
  EvaluateRequestDto,
  RiskMetricsDto,
  RiskScoreInputDto
} from './ai-rule-engine.dto'

describe('AiRuleEngine DTOs', () => {
  describe('DeviceMetricsDto', () => {
    it('should validate valid device metrics', async () => {
      const dto = plainToInstance(DeviceMetricsDto, {
        cpuUsage: 75,
        memoryUsage: 60,
        diskUsage: 45,
        networkLatencyMs: 50,
        errorRate: 1.5,
        uptimeHours: 720
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject cpuUsage over 100', async () => {
      const dto = plainToInstance(DeviceMetricsDto, {
        cpuUsage: 150,
        memoryUsage: 60,
        diskUsage: 45,
        networkLatencyMs: 50,
        errorRate: 1.5,
        uptimeHours: 720
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'cpuUsage'))
    })

    it('should reject negative values', async () => {
      const dto = plainToInstance(DeviceMetricsDto, {
        cpuUsage: -5,
        memoryUsage: 60,
        diskUsage: 45,
        networkLatencyMs: 50,
        errorRate: 1.5,
        uptimeHours: 720
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept boundary values (0 and 100)', async () => {
      const dto = plainToInstance(DeviceMetricsDto, {
        cpuUsage: 100,
        memoryUsage: 0,
        diskUsage: 100,
        networkLatencyMs: 0,
        errorRate: 0,
        uptimeHours: 0
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('MemberLevelInputDto', () => {
    it('should validate valid member level input', async () => {
      const dto = plainToInstance(MemberLevelInputDto, {
        memberId: 'mem-001',
        totalPoints: 6000,
        totalSpend: 12000,
        visitCount: 25,
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty memberId', async () => {
      const dto = plainToInstance(MemberLevelInputDto, {
        memberId: '',
        totalPoints: 100,
        totalSpend: 500,
        visitCount: 5,
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject negative totalPoints', async () => {
      const dto = plainToInstance(MemberLevelInputDto, {
        memberId: 'mem-001',
        totalPoints: -100,
        totalSpend: 500,
        visitCount: 5,
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept zero values for new members', async () => {
      const dto = plainToInstance(MemberLevelInputDto, {
        memberId: 'new-member',
        totalPoints: 0,
        totalSpend: 0,
        visitCount: 0,
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  describe('DeviceAnomalyInputDto', () => {
    it('should validate valid device anomaly input', async () => {
      const dto = plainToInstance(DeviceAnomalyInputDto, {
        deviceId: 'dev-001',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 95,
          memoryUsage: 88,
          diskUsage: 92,
          networkLatencyMs: 600,
          errorRate: 7,
          uptimeHours: 100
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing deviceId', async () => {
      const dto = plainToInstance(DeviceAnomalyInputDto, {
        storeId: 'store-1',
        metrics: {
          cpuUsage: 50,
          memoryUsage: 50,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 200
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'deviceId'))
    })

    it('should reject invalid metrics nested object', async () => {
      const dto = plainToInstance(DeviceAnomalyInputDto, {
        deviceId: 'dev-001',
        storeId: 'store-1',
        metrics: {
          cpuUsage: 250, // invalid
          memoryUsage: 50,
          diskUsage: 50,
          networkLatencyMs: 100,
          errorRate: 1,
          uptimeHours: 200
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      // The nested validation error may appear on metrics or its children
      assert.ok(errors.length > 0)
    })
  })

  describe('EvaluateRequestDto', () => {
    it('should validate member-level evaluate request', async () => {
      const dto = plainToInstance(EvaluateRequestDto, {
        type: 'member-level',
        data: {
          memberId: 'mem-001',
          totalPoints: 6000,
          totalSpend: 12000,
          visitCount: 25,
          tenantId: 'tenant-1'
        }
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate device-anomaly evaluate request', async () => {
      const dto = plainToInstance(EvaluateRequestDto, {
        type: 'device-anomaly',
        data: {
          deviceId: 'dev-001',
          storeId: 'store-1',
          metrics: { cpuUsage: 95 }
        }
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid type', async () => {
      const dto = plainToInstance(EvaluateRequestDto, {
        type: 'invalid-type',
        data: {}
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'type'))
    })

    it('should reject missing type', async () => {
      const dto = plainToInstance(EvaluateRequestDto, {
        data: { memberId: 'mem-001' }
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  describe('RiskMetricsDto', () => {
    it('should validate valid risk metrics (all fields present)', async () => {
      const dto = plainToInstance(RiskMetricsDto, {
        refundCount: 2,
        abnormalPaymentCount: 1,
        deviceAnomalyCount: 3,
        complaintCount: 0,
        voidRefundAmount: 200,
        activeDays: 30,
        recentTransactionAmount: 5000
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate risk metrics with optional fields omitted', async () => {
      const dto = plainToInstance(RiskMetricsDto, {
        refundCount: 1,
        complaintCount: 0
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate empty risk metrics (all optional)', async () => {
      const dto = plainToInstance(RiskMetricsDto, {})
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject negative refundCount', async () => {
      const dto = plainToInstance(RiskMetricsDto, {
        refundCount: -1
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'refundCount'))
    })

    it('should reject negative voidRefundAmount', async () => {
      const dto = plainToInstance(RiskMetricsDto, {
        voidRefundAmount: -500
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'voidRefundAmount'))
    })
  })

  describe('RiskScoreInputDto', () => {
    it('should validate valid risk score input (member)', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: 'mem-001',
        subjectType: 'member',
        metrics: {
          refundCount: 5,
          abnormalPaymentCount: 3,
          complaintCount: 2,
          voidRefundAmount: 800
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate valid risk score input (device)', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: 'dev-001',
        subjectType: 'device',
        metrics: {
          deviceAnomalyCount: 3
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate valid risk score input (store)', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: 'store-1',
        subjectType: 'store',
        metrics: {
          refundCount: 2,
          complaintCount: 1
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty subjectId', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: '',
        subjectType: 'member',
        metrics: {},
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'subjectId'))
    })

    it('should reject invalid subjectType', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: 'mem-001',
        subjectType: 'invalid-type',
        metrics: {},
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'subjectType'))
    })

    it('should reject missing tenantId', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: 'mem-001',
        subjectType: 'member',
        metrics: {}
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })

    it('should reject negative metric in nested RiskMetricsDto', async () => {
      const dto = plainToInstance(RiskScoreInputDto, {
        subjectId: 'mem-001',
        subjectType: 'member',
        metrics: {
          refundCount: -3
        },
        tenantId: 'tenant-1'
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })
})
