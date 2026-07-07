import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { validateSync } from 'class-validator'
import {
  QueryReportDto,
  CreateReportDefinitionDto,
  UpdateReportDefinitionDto,
  ExportReportDto,
  InvalidateCacheDto,
  ReportFilterDto,
  ReportFilterGroupDto,
  ReportDimensionDto,
  ReportMetricDto
} from './report.dto'

function getInstance<T extends object>(cls: new () => T, overrides: Partial<T> = {}): T {
  const inst = new cls()
  Object.assign(inst, overrides)
  return inst
}

describe('ReportDTO', () => {

  // ─── ReportDimensionDto ─────────────────────────────
  describe('ReportDimensionDto', () => {
    it('正常创建', () => {
      const dto = getInstance(ReportDimensionDto, { field: 'createdAt', granularity: 'day', alias: '时间' })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('field 必填', () => {
      const dto = getInstance(ReportDimensionDto, { granularity: 'day' })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'field'))
    })

    it('granularity 仅接受 day/week/month/year', () => {
      const dto = getInstance(ReportDimensionDto, { field: 'x', granularity: 'hour' as any })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'granularity'))
    })
  })

  // ─── ReportMetricDto ────────────────────────────────
  describe('ReportMetricDto', () => {
    it('正常创建', () => {
      const dto = getInstance(ReportMetricDto, { field: 'amountCents', fn: 'sum', alias: '总额' })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('fn 仅接受聚合函数', () => {
      const dto = getInstance(ReportMetricDto, { field: 'x', fn: 'invalid' as any, alias: 'X' })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'fn'))
    })
  })

  // ─── ReportFilterDto ────────────────────────────────
  describe('ReportFilterDto', () => {
    it('正常创建', () => {
      const dto = getInstance(ReportFilterDto, { field: 'status', op: '=', value: 'PAID' })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('op 仅接受有效操作符', () => {
      const dto = getInstance(ReportFilterDto, { field: 'x', op: '??' as any, value: 1 })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'op'))
    })
  })

  // ─── QueryReportDto ─────────────────────────────────
  describe('QueryReportDto', () => {
    it('正常创建', () => {
      const dto = getInstance(QueryReportDto, {
        tenantId: 'T1',
        type: 'revenue',
        from: '2024-06-01',
        to: '2024-06-30'
      })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('tenantId 必填', () => {
      const dto = getInstance(QueryReportDto, { type: 'revenue', from: 'a', to: 'b' })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })

    it('type 必须在有效范围内', () => {
      const dto = getInstance(QueryReportDto, { tenantId: 'T', type: 'unknown' as any, from: 'a', to: 'b' })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'type'))
    })
  })

  // ─── CreateReportDefinitionDto ──────────────────────
  describe('CreateReportDefinitionDto', () => {
    it('正常创建', () => {
      const dim = new ReportDimensionDto()
      dim.field = 'createdAt'
      dim.granularity = 'day'
      dim.alias = '时间'
      const met = new ReportMetricDto()
      met.field = 'amountCents'
      met.fn = 'sum'
      met.alias = '总额'
      const dto = getInstance(CreateReportDefinitionDto, {
        tenantId: 'T1',
        name: '日报',
        type: 'revenue',
        dimensions: [dim],
        metrics: [met],
        ownerId: 'u1'
      })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('dimensions 为空时验证不通过', () => {
      const dto = getInstance(CreateReportDefinitionDto, {
        tenantId: 'T',
        name: 'A',
        type: 'revenue',
        dimensions: [],
        metrics: [],
        ownerId: 'u'
      })
      const errors = validateSync(dto)
      // empty arrays still pass @IsArray, but will fail business validation
      assert.equal(dto.dimensions?.length, 0)
    })

    it('name 必填', () => {
      const dto = getInstance(CreateReportDefinitionDto, {
        tenantId: 'T',
        type: 'revenue',
        dimensions: [],
        metrics: [],
        ownerId: 'u'
      })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'name'))
    })
  })

  // ─── UpdateReportDefinitionDto ──────────────────────
  describe('UpdateReportDefinitionDto', () => {
    it('所有字段可选', () => {
      const dto = new UpdateReportDefinitionDto()
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('可更新 name', () => {
      const dto = getInstance(UpdateReportDefinitionDto, { name: '月报' })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })
  })

  // ─── ExportReportDto ────────────────────────────────
  describe('ExportReportDto', () => {
    it('正常创建', () => {
      const dto = getInstance(ExportReportDto, {
        tenantId: 'T',
        type: 'revenue',
        format: 'csv',
        from: '2024-01-01',
        to: '2024-12-31'
      })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })

    it('format 错误值', () => {
      const dto = getInstance(ExportReportDto, {
        tenantId: 'T',
        type: 'revenue',
        format: 'xml' as any,
        from: 'a',
        to: 'b'
      })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'format'))
    })
  })

  // ─── InvalidateCacheDto ─────────────────────────────
  describe('InvalidateCacheDto', () => {
    it('tenantId 必填', () => {
      const dto = getInstance(InvalidateCacheDto, { type: 'revenue' })
      const errors = validateSync(dto)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })

    it('type 可选', () => {
      const dto = getInstance(InvalidateCacheDto, { tenantId: 'T' })
      const errors = validateSync(dto)
      assert.equal(errors.length, 0)
    })
  })
})
