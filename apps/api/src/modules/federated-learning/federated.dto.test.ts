import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * FederatedLearning DTO Tests
 *
 * 覆盖:
 * - CreateFederatedTaskDto: 必填 + 所有可选字段
 * - StartRoundDto: 默认 + 自定义超时
 * - SubmitGradientDto: 完整 + 最小字段
 * - 响应类型: FederatedTaskResponse / RoundResponse / AggregationResponse
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  CreateFederatedTaskDto,
  StartRoundDto,
  SubmitGradientDto,
  FederatedTaskResponse,
  RoundResponse,
  AggregationResponse,
} from './federated.dto'

// ────────────────────────────────────────────────────────────────
// 1. CreateFederatedTaskDto
// ────────────────────────────────────────────────────────────────
describe('1. CreateFederatedTaskDto', () => {
  it('最小必填字段', () => {
    const dto: CreateFederatedTaskDto = {
      name: 'test-task',
      modelArch: 'lstm',
      participantTenantIds: ['tenant-A', 'tenant-B'],
    }
    assert.equal(dto.name, 'test-task')
    assert.equal(dto.modelArch, 'lstm')
    assert.equal(dto.participantTenantIds.length, 2)
    // 可选字段应为 undefined
    assert.equal(dto.aggregationMethod, undefined)
    assert.equal(dto.totalRounds, undefined)
    assert.equal(dto.privacyBudgetEpsilon, undefined)
    assert.equal(dto.privacyBudgetDelta, undefined)
    assert.equal(dto.minParticipants, undefined)
    assert.equal(dto.noiseMultiplier, undefined)
    assert.equal(dto.maxGradientNorm, undefined)
  })

  it('全部可选字段', () => {
    const dto: CreateFederatedTaskDto = {
      name: 'full-task',
      modelArch: 'resnet50',
      participantTenantIds: ['tenant-A', 'tenant-B', 'tenant-C'],
      aggregationMethod: 'fedprox',
      totalRounds: 20,
      privacyBudgetEpsilon: 2.0,
      privacyBudgetDelta: 1e-6,
      minParticipants: 3,
      noiseMultiplier: 1.5,
      maxGradientNorm: 2.0,
    }
    assert.equal(dto.aggregationMethod, 'fedprox')
    assert.equal(dto.totalRounds, 20)
    assert.equal(dto.privacyBudgetEpsilon, 2.0)
    assert.equal(dto.privacyBudgetDelta, 1e-6)
    assert.equal(dto.minParticipants, 3)
    assert.equal(dto.noiseMultiplier, 1.5)
    assert.equal(dto.maxGradientNorm, 2.0)
  })

  it('participantTenantIds 可包含协调者自身', () => {
    const dto: CreateFederatedTaskDto = {
      name: 'self-participate',
      modelArch: 'x',
      participantTenantIds: ['tenant-A'],
    }
    assert.equal(dto.participantTenantIds.length, 1)
    assert.ok(dto.participantTenantIds.includes('tenant-A'))
  })

  it('空参与者列表类型允许但业务层校验', () => {
    const dto: CreateFederatedTaskDto = {
      name: 'empty-ok-type',
      modelArch: 'x',
      participantTenantIds: [],
    }
    // 类型层面允许, 业务层抛出 BadRequest
    assert.deepEqual(dto.participantTenantIds, [])
  })

  it('aggregationMethod 接受 fedavg / fedprox / scaffold', () => {
    const d1: CreateFederatedTaskDto = { name: 'a', modelArch: 'x', participantTenantIds: ['t1'], aggregationMethod: 'fedavg' }
    const d2: CreateFederatedTaskDto = { name: 'b', modelArch: 'x', participantTenantIds: ['t1'], aggregationMethod: 'fedprox' }
    const d3: CreateFederatedTaskDto = { name: 'c', modelArch: 'x', participantTenantIds: ['t1'], aggregationMethod: 'scaffold' }
    assert.equal(d1.aggregationMethod, 'fedavg')
    assert.equal(d2.aggregationMethod, 'fedprox')
    assert.equal(d3.aggregationMethod, 'scaffold')
  })

  it('可选数值字段默认 undefined 而非 0', () => {
    const dto: CreateFederatedTaskDto = {
      name: 'default-values',
      modelArch: 'x',
      participantTenantIds: ['t1'],
    }
    // 确保 undefined 而非 0 (区分未传与显式 0)
    assert.equal(dto.totalRounds, undefined)
    assert.equal(dto.minParticipants, undefined)
    assert.equal(dto.noiseMultiplier, undefined)
  })
})

// ────────────────────────────────────────────────────────────────
// 2. StartRoundDto
// ────────────────────────────────────────────────────────────────
describe('2. StartRoundDto', () => {
  it('默认无参 (空对象)', () => {
    const dto: StartRoundDto = {}
    assert.equal(dto.collectionDeadlineMs, undefined)
  })

  it('指定收集截止时间', () => {
    const dto: StartRoundDto = { collectionDeadlineMs: 5000 }
    assert.equal(dto.collectionDeadlineMs, 5000)
  })

  it('大数值毫秒时间', () => {
    const dto: StartRoundDto = { collectionDeadlineMs: 86400000 } // 24h
    assert.equal(dto.collectionDeadlineMs, 86400000)
  })

  it('0 毫秒', () => {
    const dto: StartRoundDto = { collectionDeadlineMs: 0 }
    assert.equal(dto.collectionDeadlineMs, 0)
  })
})

// ────────────────────────────────────────────────────────────────
// 3. SubmitGradientDto
// ────────────────────────────────────────────────────────────────
describe('3. SubmitGradientDto', () => {
  it('最小必填字段', () => {
    const dto: SubmitGradientDto = {
      roundId: 'rnd-001',
      encryptedGradients: 'aGVsbG8=',
      sampleCount: 100,
    }
    assert.equal(dto.roundId, 'rnd-001')
    assert.equal(dto.encryptedGradients, 'aGVsbG8=')
    assert.equal(dto.sampleCount, 100)
    // loss 可选
    assert.equal(dto.loss, undefined)
  })

  it('全部字段 (含 loss)', () => {
    const dto: SubmitGradientDto = {
      roundId: 'rnd-001',
      encryptedGradients: 'base64data',
      sampleCount: 500,
      loss: 0.123,
    }
    assert.equal(dto.loss, 0.123)
  })

  it('encryptedGradients 可为空字符串', () => {
    const dto: SubmitGradientDto = {
      roundId: 'rnd-001',
      encryptedGradients: '',
      sampleCount: 0,
    }
    assert.equal(dto.encryptedGradients, '')
  })

  it('sampleCount 为 0 的情况', () => {
    const dto: SubmitGradientDto = {
      roundId: 'rnd-001',
      encryptedGradients: 'data',
      sampleCount: 0,
    }
    assert.equal(dto.sampleCount, 0)
  })
})

// ────────────────────────────────────────────────────────────────
// 4. FederatedTaskResponse
// ────────────────────────────────────────────────────────────────
describe('4. FederatedTaskResponse', () => {
  it('完整响应结构', () => {
    const resp: FederatedTaskResponse = {
      id: 'fed-task-001',
      name: 'sales-forecast',
      modelArch: 'lstm-v2',
      coordinatorTenantId: 'tenant-A',
      participantTenantIds: ['tenant-A', 'tenant-B'],
      aggregationMethod: 'fedavg',
      totalRounds: 10,
      currentRound: 1,
      status: 'active',
      privacyBudgetEpsilon: 1.0,
      privacyBudgetDelta: 1e-5,
      consumedEpsilon: 0.05,
      consumedDelta: 1e-6,
      minParticipants: 2,
      noiseMultiplier: 1.1,
      maxGradientNorm: 1.0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T01:00:00Z',
    }
    assert.equal(resp.id, 'fed-task-001')
    assert.equal(resp.coordinatorTenantId, 'tenant-A')
    assert.equal(resp.participantTenantIds.length, 2)
    assert.equal(resp.currentRound, 1)
    assert.ok(resp.consumedEpsilon >= 0)
  })

  it('completed 状态', () => {
    const resp: FederatedTaskResponse = {
      id: 'fed-task-002',
      name: 'fraud-detection',
      modelArch: 'xgboost',
      coordinatorTenantId: 'tenant-A',
      participantTenantIds: ['tenant-B'],
      aggregationMethod: 'fedavg',
      totalRounds: 5,
      currentRound: 5,
      status: 'completed',
      privacyBudgetEpsilon: 2.0,
      privacyBudgetDelta: 1e-5,
      consumedEpsilon: 1.5,
      consumedDelta: 5e-6,
      minParticipants: 1,
      noiseMultiplier: 1.0,
      maxGradientNorm: 1.0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T05:00:00Z',
    }
    assert.equal(resp.status, 'completed')
    assert.equal(resp.currentRound, resp.totalRounds)
    assert.ok(resp.consumedEpsilon <= resp.privacyBudgetEpsilon)
  })
})

// ────────────────────────────────────────────────────────────────
// 5. RoundResponse
// ────────────────────────────────────────────────────────────────
describe('5. RoundResponse', () => {
  it('collecting 阶段', () => {
    const resp: RoundResponse = {
      id: 'rnd-001',
      taskId: 'fed-task-001',
      roundNumber: 1,
      status: 'collecting',
      globalModelVersion: 0,
      expectedParticipants: 3,
      actualParticipants: 0,
      collectionStartedAt: '2026-01-01T00:00:00Z',
      collectionDeadlineAt: '2026-01-01T01:00:00Z',
      epsilonConsumed: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    assert.equal(resp.status, 'collecting')
    assert.equal(resp.roundNumber, 1)
    assert.equal(resp.nextModelVersion, undefined)
    assert.equal(resp.aggregatedAt, undefined)
    assert.equal(resp.aggregatedLoss, undefined)
    assert.equal(resp.failureReason, undefined)
  })

  it('completed 阶段', () => {
    const resp: RoundResponse = {
      id: 'rnd-002',
      taskId: 'fed-task-001',
      roundNumber: 2,
      status: 'completed',
      globalModelVersion: 1,
      nextModelVersion: 2,
      expectedParticipants: 3,
      actualParticipants: 3,
      collectionStartedAt: '2026-01-01T01:00:00Z',
      collectionDeadlineAt: '2026-01-01T02:00:00Z',
      aggregatedAt: '2026-01-01T02:05:00Z',
      epsilonConsumed: 0.05,
      aggregatedLoss: 0.25,
      createdAt: '2026-01-01T01:00:00Z',
      updatedAt: '2026-01-01T02:05:00Z',
    }
    assert.equal(resp.nextModelVersion, 2)
    assert.ok(resp.aggregatedAt)
    assert.equal(resp.aggregatedLoss, 0.25)
    assert.equal(resp.epsilonConsumed, 0.05)
  })

  it('failed 阶段', () => {
    const resp: RoundResponse = {
      id: 'rnd-003',
      taskId: 'fed-task-001',
      roundNumber: 3,
      status: 'failed',
      globalModelVersion: 2,
      expectedParticipants: 3,
      actualParticipants: 1,
      epsilonConsumed: 0,
      failureReason: '客户端不足 (1/3)',
      createdAt: '2026-01-01T03:00:00Z',
      updatedAt: '2026-01-01T03:10:00Z',
    }
    assert.equal(resp.status, 'failed')
    assert.equal(resp.failureReason, '客户端不足 (1/3)')
    assert.equal(resp.actualParticipants, 1)
  })
})

// ────────────────────────────────────────────────────────────────
// 6. AggregationResponse
// ────────────────────────────────────────────────────────────────
describe('6. AggregationResponse', () => {
  it('完整聚合结果', () => {
    const resp: AggregationResponse = {
      roundId: 'rnd-001',
      globalModelVersion: 1,
      participantCount: 3,
      totalSamples: 1500,
      averageLoss: 0.15,
      epsilonConsumed: 0.08,
      deltaConsumed: 3.33e-6,
      method: 'fedavg',
      durationMs: 456,
    }
    assert.equal(resp.roundId, 'rnd-001')
    assert.equal(resp.participantCount, 3)
    assert.equal(resp.totalSamples, 1500)
    assert.equal(resp.method, 'fedavg')
    assert.ok(resp.durationMs > 0)
  })

  it('不同的聚合方法', () => {
    const r1: AggregationResponse = {
      roundId: 'rnd-002', globalModelVersion: 2,
      participantCount: 2, totalSamples: 500, averageLoss: 0.2,
      epsilonConsumed: 0.05, deltaConsumed: 1e-6,
      method: 'fedprox', durationMs: 300,
    }
    const r2: AggregationResponse = {
      roundId: 'rnd-003', globalModelVersion: 3,
      participantCount: 4, totalSamples: 2000, averageLoss: 0.1,
      epsilonConsumed: 0.1, deltaConsumed: 2.5e-6,
      method: 'scaffold', durationMs: 890,
    }
    assert.equal(r1.method, 'fedprox')
    assert.equal(r2.method, 'scaffold')
  })

  it('durationMs 为 0 (极快聚合)', () => {
    const resp: AggregationResponse = {
      roundId: 'rnd-004', globalModelVersion: 1,
      participantCount: 1, totalSamples: 10, averageLoss: 0,
      epsilonConsumed: 0.01, deltaConsumed: 1e-7,
      method: 'fedavg', durationMs: 0,
    }
    assert.equal(resp.durationMs, 0)
  })
})
