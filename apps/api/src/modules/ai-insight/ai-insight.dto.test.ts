/**
 * 🐜 自动: [ai-insight] [D] DTO 测试
 * 验证 class-validator 装饰器的约束和 DTO 转换
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  GenerateReportDto,
  InsightReportQueryDto,
  KPIQueryDto,
  AnomalyQueryDto,
  ResolveAnomalyDto,
  GenerateForecastDto,
  DashboardQueryDto
} from './ai-insight.dto'

// ── GenerateReportDto ──
describe('ai-insight.dto: GenerateReportDto', () => {
  test('validates correct report generation input', async () => {
    const dto = plainToInstance(GenerateReportDto, {
      type: 'revenue',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('accepts optional storeId', async () => {
    const dto = plainToInstance(GenerateReportDto, {
      type: 'member',
      storeId: 'store-01',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects missing type', async () => {
    const dto = plainToInstance(GenerateReportDto, {
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'type'))
  })

  test('rejects invalid type', async () => {
    const dto = plainToInstance(GenerateReportDto, {
      type: 'invalid',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-07'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'type'))
  })

  test('rejects missing periodStart', async () => {
    const dto = plainToInstance(GenerateReportDto, {
      type: 'revenue',
      periodEnd: '2026-06-07'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'periodStart'))
  })

  test('rejects missing periodEnd', async () => {
    const dto = plainToInstance(GenerateReportDto, {
      type: 'revenue',
      periodStart: '2026-06-01'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'periodEnd'))
  })

  test('supports all 5 valid types', async () => {
    const types = ['revenue', 'member', 'attendance', 'game', 'kpi']
    for (const type of types) {
      const dto = plainToInstance(GenerateReportDto, {
        type,
        periodStart: '2026-06-01',
        periodEnd: '2026-06-07'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `type=${type} should be valid`)
    }
  })
})

// ── InsightReportQueryDto ──
describe('ai-insight.dto: InsightReportQueryDto', () => {
  test('validates empty query (all optional)', async () => {
    const dto = plainToInstance(InsightReportQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('validates with all optional fields', async () => {
    const dto = plainToInstance(InsightReportQueryDto, {
      storeId: 'store-01',
      type: 'revenue',
      limit: 10
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects invalid type', async () => {
    const dto = plainToInstance(InsightReportQueryDto, {
      type: 'bad-type'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'type'))
  })

  test('rejects limit < 1', async () => {
    const dto = plainToInstance(InsightReportQueryDto, {
      limit: 0
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'limit'))
  })

  test('rejects limit > 100', async () => {
    const dto = plainToInstance(InsightReportQueryDto, {
      limit: 101
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'limit'))
  })

  test('accepts limit at boundaries', async () => {
    // min: 1
    let dto = plainToInstance(InsightReportQueryDto, { limit: 1 })
    let errors = await validate(dto)
    assert.equal(errors.length, 0)

    // max: 100
    dto = plainToInstance(InsightReportQueryDto, { limit: 100 })
    errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})

// ── KPIQueryDto ──
describe('ai-insight.dto: KPIQueryDto', () => {
  test('validates empty query', async () => {
    const dto = plainToInstance(KPIQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('validates with storeId and category', async () => {
    const dto = plainToInstance(KPIQueryDto, {
      storeId: 'store-01',
      category: 'revenue'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects invalid category', async () => {
    const dto = plainToInstance(KPIQueryDto, {
      category: 'unknown'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'category'))
  })

  test('supports all 5 valid categories', async () => {
    const categories = ['revenue', 'member', 'attendance', 'game', 'operation']
    for (const category of categories) {
      const dto = plainToInstance(KPIQueryDto, { category })
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `category=${category} should be valid`)
    }
  })
})

// ── AnomalyQueryDto ──
describe('ai-insight.dto: AnomalyQueryDto', () => {
  test('validates empty query', async () => {
    const dto = plainToInstance(AnomalyQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('validates with all fields', async () => {
    const dto = plainToInstance(AnomalyQueryDto, {
      storeId: 'store-01',
      metric: '日营收',
      status: 'open',
      severity: 'high',
      limit: 20
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects invalid status', async () => {
    const dto = plainToInstance(AnomalyQueryDto, {
      status: 'deleted'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'status'))
  })

  test('rejects invalid severity', async () => {
    const dto = plainToInstance(AnomalyQueryDto, {
      severity: 'extreme'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'severity'))
  })

  test('supports all 3 status values', async () => {
    const statuses = ['open', 'acknowledged', 'resolved']
    for (const status of statuses) {
      const dto = plainToInstance(AnomalyQueryDto, { status })
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `status=${status} should be valid`)
    }
  })

  test('supports all 4 severity values', async () => {
    const severities = ['low', 'medium', 'high', 'critical']
    for (const severity of severities) {
      const dto = plainToInstance(AnomalyQueryDto, { severity })
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `severity=${severity} should be valid`)
    }
  })

  test('rejects limit < 1', async () => {
    const dto = plainToInstance(AnomalyQueryDto, { limit: 0 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  test('rejects limit > 100', async () => {
    const dto = plainToInstance(AnomalyQueryDto, { limit: 200 })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── ResolveAnomalyDto ──
describe('ai-insight.dto: ResolveAnomalyDto', () => {
  test('validates correct input', async () => {
    const dto = plainToInstance(ResolveAnomalyDto, {
      anomalyId: 'anomaly-001'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects empty anomalyId', async () => {
    const dto = plainToInstance(ResolveAnomalyDto, {
      anomalyId: ''
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'anomalyId'))
  })

  test('rejects missing anomalyId', async () => {
    const dto = plainToInstance(ResolveAnomalyDto, {})
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'anomalyId'))
  })
})

// ── GenerateForecastDto ──
describe('ai-insight.dto: GenerateForecastDto', () => {
  test('validates correct input', async () => {
    const dto = plainToInstance(GenerateForecastDto, {
      metric: '日营收',
      period: 'week'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('rejects missing metric', async () => {
    const dto = plainToInstance(GenerateForecastDto, {
      period: 'week'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'metric'))
  })

  test('rejects missing period', async () => {
    const dto = plainToInstance(GenerateForecastDto, {
      metric: '日营收'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
    assert.ok(errors.some(e => e.property === 'period'))
  })

  test('rejects empty metric', async () => {
    const dto = plainToInstance(GenerateForecastDto, {
      metric: '',
      period: 'week'
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ── DashboardQueryDto ──
describe('ai-insight.dto: DashboardQueryDto', () => {
  test('validates empty query', async () => {
    const dto = plainToInstance(DashboardQueryDto, {})
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('validates with optional storeId', async () => {
    const dto = plainToInstance(DashboardQueryDto, {
      storeId: 'store-01'
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  test('storeId is truly optional (undefined)', async () => {
    const dto = plainToInstance(DashboardQueryDto, {
      storeId: undefined
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })
})
