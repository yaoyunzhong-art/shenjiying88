/**
 * 🐜 自动: [chaos-engineering] [A] dto 测试补全
 *
 * 覆盖:
 * - CreateExperimentDto (正例/反例/边界)
 * - UpdateExperimentDto (正例/反例)
 * - InjectFaultDto (正例/反例)
 * - HealthMetricDto (正例/边界/反例)
 * - ExperimentIdParam (正例/反例)
 */

import { describe, it, expect } from 'vitest'
import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  CreateExperimentDto,
  UpdateExperimentDto,
  InjectFaultDto,
  HealthMetricDto,
  ExperimentIdParam,
} from './chaos-engineering.dto'

// ─── CreateExperimentDto ─────────────────────────────────────────

describe('CreateExperimentDto', () => {
  it('✅ 正例: 创建实验完整参数', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: '延迟注入测试',
      target: 'api-gateway',
      faultType: 'LATENCY',
      faultTarget: 'orders-service',
      faultParams: { delayMs: 500 },
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('✅ 正例: 支持所有故障类型', async () => {
    const types = ['LATENCY', 'ERROR', 'TIMEOUT', 'CPU_BURN'] as const
    for (const faultType of types) {
      const dto = plainToInstance(CreateExperimentDto, {
        name: `${faultType}-test`,
        target: 'svc',
        faultType,
        faultTarget: 'svc',
        faultParams: { value: 100 },
      })
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    }
  })

  it('❌ 反例: 空名称', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: '',
      target: 'svc',
      faultType: 'LATENCY',
      faultTarget: 'svc',
      faultParams: {},
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'name')).toBe(true)
  })

  it('❌ 反例: 无效的故障类型', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: 'test',
      target: 'svc',
      faultType: 'INVALID_TYPE',
      faultTarget: 'svc',
      faultParams: {},
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'faultType')).toBe(true)
  })

  it('❌ 反例: 缺少必填字段目标', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: 'test',
      faultType: 'LATENCY',
      faultTarget: 'svc',
      faultParams: {},
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'target')).toBe(true)
  })

  it('🔲 边界: 名称最短长度 2', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: 'a',
      target: 'svc',
      faultType: 'ERROR',
      faultTarget: 'svc',
      faultParams: {},
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'name')).toBe(true)
  })

  it('🔲 边界: 名称最大长度 100', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: 'x'.repeat(101),
      target: 'svc',
      faultType: 'TIMEOUT',
      faultTarget: 'svc',
      faultParams: {},
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'name')).toBe(true)
  })

  it('🔲 边界: 带空格的故障参数', async () => {
    const dto = plainToInstance(CreateExperimentDto, {
      name: '边界测试',
      target: 'my service',
      faultType: 'CPU_BURN',
      faultTarget: 'worker node 1',
      faultParams: { percentage: 80, durationSecs: 30 },
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

// ─── UpdateExperimentDto ─────────────────────────────────────────

describe('UpdateExperimentDto', () => {
  it('✅ 正例: 部分更新（只传名称）', async () => {
    const dto = plainToInstance(UpdateExperimentDto, {
      name: '更新后的实验名',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('✅ 正例: 全部字段更新', async () => {
    const dto = plainToInstance(UpdateExperimentDto, {
      name: '新实验',
      target: 'new-svc',
      faultType: 'TIMEOUT',
      faultTarget: 'new-target',
      faultParams: { timeoutMs: 5000 },
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('✅ 正例: 空对象（所有字段可选）', async () => {
    const dto = plainToInstance(UpdateExperimentDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('❌ 反例: 无效的故障类型', async () => {
    const dto = plainToInstance(UpdateExperimentDto, {
      faultType: 'RANDOM_TYPE',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'faultType')).toBe(true)
  })
})

// ─── InjectFaultDto ──────────────────────────────────────────────

describe('InjectFaultDto', () => {
  it('✅ 正例: 完整参数', async () => {
    const dto = plainToInstance(InjectFaultDto, {
      target: 'api-gateway',
      paramValue: 500,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('❌ 反例: 空目标', async () => {
    const dto = plainToInstance(InjectFaultDto, {
      target: '',
      paramValue: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'target')).toBe(true)
  })

  it('❌ 反例: 参数值为负数', async () => {
    const dto = plainToInstance(InjectFaultDto, {
      target: 'svc',
      paramValue: -1,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'paramValue')).toBe(true)
  })

  it('🔲 边界: 参数值为 0', async () => {
    const dto = plainToInstance(InjectFaultDto, {
      target: 'svc',
      paramValue: 0,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('🔲 边界: 参数值为大数', async () => {
    const dto = plainToInstance(InjectFaultDto, {
      target: 'svc',
      paramValue: 999999,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

// ─── HealthMetricDto ────────────────────────────────────────────

describe('HealthMetricDto', () => {
  it('✅ 正例: 健康指标完整参数', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 45,
      memoryUsage: 60,
      errorRate: 0.01,
      latencyAvg: 100,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('✅ 正例: 含可选 healthy 字段', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 30,
      memoryUsage: 50,
      errorRate: 0.001,
      latencyAvg: 50,
      healthy: false,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('❌ 反例: CPU 使用率超过 100', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 150,
      memoryUsage: 50,
      errorRate: 0.01,
      latencyAvg: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'cpuUsage')).toBe(true)
  })

  it('❌ 反例: 错误率超过 1.0', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 50,
      memoryUsage: 50,
      errorRate: 1.5,
      latencyAvg: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'errorRate')).toBe(true)
  })

  it('❌ 反例: 延迟为负数', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 50,
      memoryUsage: 50,
      errorRate: 0.01,
      latencyAvg: -10,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'latencyAvg')).toBe(true)
  })

  it('❌ 反例: 缺少必填 cpuUsage', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      memoryUsage: 50,
      errorRate: 0.01,
      latencyAvg: 100,
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'cpuUsage')).toBe(true)
  })

  it('🔲 边界: CPU 使用率满值 100', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 100,
      memoryUsage: 0,
      errorRate: 0,
      latencyAvg: 0,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('🔲 边界: 错误率为 0', async () => {
    const dto = plainToInstance(HealthMetricDto, {
      cpuUsage: 50,
      memoryUsage: 50,
      errorRate: 0,
      latencyAvg: 10,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

// ─── ExperimentIdParam ──────────────────────────────────────────

describe('ExperimentIdParam', () => {
  it('✅ 正例: 有效实验 ID', async () => {
    const dto = plainToInstance(ExperimentIdParam, {
      id: 'exp-001',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('❌ 反例: 空 ID', async () => {
    const dto = plainToInstance(ExperimentIdParam, {
      id: '',
    })
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'id')).toBe(true)
  })

  it('❌ 反例: 缺少 ID', async () => {
    const dto = plainToInstance(ExperimentIdParam, {})
    const errors = await validate(dto)
    expect(errors.some(e => e.property === 'id')).toBe(true)
  })
})
