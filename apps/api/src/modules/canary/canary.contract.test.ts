import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type { CanaryExperiment, CanaryEvaluationResponse, CanaryHealthSnapshot } from './canary.entity'
import {
  toExperimentContract,
  toEvaluationContract,
  toHealthContract,
  aggregateStatus,
  type CanaryExperimentContract,
  type CanaryEvaluationContract,
  type CanaryHealthContract,
  type CanaryStatusContract,
  type CanaryCreateContract,
} from './canary.contract'

// ── 测试夹具 ──

const mockExperiment: CanaryExperiment = {
  id: 'exp-test-001',
  name: '测试灰度实验',
  description: '用于测试的灰色发布实验',
  flagKey: 'feature.test_flag',
  strategy: 'percentage',
  strategyConfig: { type: 'percentage', includeAll: true },
  status: 'active',
  initialPercentage: 10,
  targetPercentage: 100,
  currentPercentage: 25,
  startedAt: '2026-06-01T00:00:00Z',
  createdBy: 'test-user',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-15T00:00:00Z',
}

const mockEvaluationResponse: CanaryEvaluationResponse = {
  flagKey: 'feature.test_flag',
  enabled: true,
  matchedStrategy: 'percentage',
  experimentId: 'exp-test-001',
  percentage: 25,
  reason: 'Matched percentage strategy',
}

const mockHealthSnapshot: CanaryHealthSnapshot = {
  experimentId: 'exp-test-001',
  timestamp: '2026-06-15T12:00:00Z',
  errorRate: 0.005,
  latencyP95: 200,
  latencyAvg: 100,
  totalRequests: 10000,
  isHealthy: true,
}

// ── Contract 转换测试 ──

describe('CanaryContract - 转换函数', () => {
  it('toExperimentContract 应返回正确的契约对象', () => {
    const contract = toExperimentContract(mockExperiment)

    assert.equal(contract.id, 'exp-test-001')
    assert.equal(contract.name, '测试灰度实验')
    assert.equal(contract.flagKey, 'feature.test_flag')
    assert.equal(contract.strategy, 'percentage')
    assert.equal(contract.status, 'active')
    assert.equal(contract.currentPercentage, 25)
    assert.equal(contract.createdBy, 'test-user')

    // 确保不暴露内部字段（仅提取已知公开字段）
    const contractKeys = Object.keys(contract)
    assert.ok(!contractKeys.includes('strategyConfig'))
    assert.ok(!contractKeys.includes('healthThreshold'))
    assert.ok(!contractKeys.includes('autoPromote'))
  })

  it('toExperimentContract 应处理无结束时间的实验', () => {
    const draftExp: CanaryExperiment = {
      ...mockExperiment,
      status: 'draft',
      startedAt: undefined,
      endedAt: undefined,
    }
    const contract = toExperimentContract(draftExp)
    assert.equal(contract.status, 'draft')
    assert.equal(contract.startedAt, undefined)
    assert.equal(contract.endedAt, undefined)
  })

  it('toEvaluationContract 应返回正确的评估契约', () => {
    const contract = toEvaluationContract(mockEvaluationResponse)
    assert.equal(contract.flagKey, 'feature.test_flag')
    assert.equal(contract.enabled, true)
    assert.equal(contract.matchedStrategy, 'percentage')
    assert.equal(contract.experimentId, 'exp-test-001')
    assert.equal(contract.reason, 'Matched percentage strategy')
  })

  it('toEvaluationContract 应正确处理未命中的评估', () => {
    const noMatchResponse: CanaryEvaluationResponse = {
      flagKey: 'feature.nonexistent',
      enabled: false,
      matchedStrategy: null,
      reason: 'No matching experiment',
    }
    const contract = toEvaluationContract(noMatchResponse)
    assert.equal(contract.enabled, false)
    assert.equal(contract.matchedStrategy, null)
    assert.equal(contract.experimentId, undefined)
  })

  it('toHealthContract 应返回正确的健康快照契约', () => {
    const contract = toHealthContract(mockHealthSnapshot)
    assert.equal(contract.experimentId, 'exp-test-001')
    assert.equal(contract.errorRate, 0.005)
    assert.equal(contract.latencyP95, 200)
    assert.equal(contract.isHealthy, true)

    // 确保不暴露内部字段
    const healthKeys = Object.keys(contract)
    assert.ok(!healthKeys.includes('latencyAvg'))
    assert.ok(!healthKeys.includes('totalRequests'))
  })

  it('toHealthContract 应正确处理不健康快照', () => {
    const unhealthySnapshot: CanaryHealthSnapshot = {
      ...mockHealthSnapshot,
      errorRate: 0.05,
      isHealthy: false,
    }
    const contract = toHealthContract(unhealthySnapshot)
    assert.equal(contract.isHealthy, false)
    assert.equal(contract.errorRate, 0.05)
  })
})

// ── 聚合状态测试 ──

describe('CanaryContract - aggregateStatus', () => {
  it('应正确汇总多种状态的实验', () => {
    const experiments: CanaryExperiment[] = [
      { ...mockExperiment, id: 'exp-1', status: 'active' },
      { ...mockExperiment, id: 'exp-2', status: 'active' },
      { ...mockExperiment, id: 'exp-3', status: 'completed' },
      { ...mockExperiment, id: 'exp-4', status: 'completed' },
      { ...mockExperiment, id: 'exp-5', status: 'rolled_back' },
      { ...mockExperiment, id: 'exp-6', status: 'draft' },
    ]

    const status = aggregateStatus(experiments)
    assert.equal(status.totalExperiments, 6)
    assert.equal(status.activeExperiments, 2)
    assert.equal(status.completedExperiments, 2)
    assert.equal(status.rolledBackExperiments, 1)
    assert.equal(status.overallHealth, 'unhealthy')
  })

  it('全健康状态下的 overallHealth 应为 healthy', () => {
    const experiments: CanaryExperiment[] = [
      { ...mockExperiment, id: 'exp-1', status: 'completed' },
      { ...mockExperiment, id: 'exp-2', status: 'completed' },
    ]
    const status = aggregateStatus(experiments)
    assert.equal(status.overallHealth, 'healthy')
  })

  it('部分活跃无回滚时 overallHealth 应为 degraded', () => {
    const experiments: CanaryExperiment[] = [
      { ...mockExperiment, id: 'exp-1', status: 'active' },
      { ...mockExperiment, id: 'exp-2', status: 'draft' },
    ]
    const status = aggregateStatus(experiments)
    assert.equal(status.overallHealth, 'degraded')
  })

  it('空列表应返回全零状态', () => {
    const status = aggregateStatus([])
    assert.equal(status.totalExperiments, 0)
    assert.equal(status.activeExperiments, 0)
    assert.equal(status.completedExperiments, 0)
    assert.equal(status.rolledBackExperiments, 0)
    assert.equal(status.overallHealth, 'healthy')
  })
})

// ── 契约接口结构测试 ──

describe('CanaryContract - 接口结构', () => {
  it('CanaryExperimentContract 应包含所有必要字段', () => {
    const contract: CanaryExperimentContract = {
      id: 'x', name: 'x', description: 'x',
      flagKey: 'x', strategy: 'percentage',
      status: 'active', initialPercentage: 0,
      targetPercentage: 100, currentPercentage: 0,
      createdBy: 'x', createdAt: 'x', updatedAt: 'x',
    }
    // 验证字段存在且类型正确
    assert.equal(typeof contract.id, 'string')
    assert.equal(typeof contract.name, 'string')
    assert.equal(typeof contract.flagKey, 'string')
    assert.equal(typeof contract.initialPercentage, 'number')
    assert.equal(typeof contract.currentPercentage, 'number')
  })

  it('CanaryEvaluationContract 应包含所有必要字段', () => {
    const contract: CanaryEvaluationContract = {
      flagKey: 'x', enabled: false,
      matchedStrategy: null, reason: 'x',
    }
    assert.equal(contract.enabled, false)
    assert.equal(contract.matchedStrategy, null)
  })

  it('CanaryHealthContract 应包含所有必要字段', () => {
    const contract: CanaryHealthContract = {
      experimentId: 'x', timestamp: 'x',
      errorRate: 0, latencyP95: 0, isHealthy: true,
    }
    assert.equal(typeof contract.experimentId, 'string')
    assert.equal(typeof contract.isHealthy, 'boolean')
    assert.equal(typeof contract.errorRate, 'number')
  })
})
