import 'reflect-metadata'
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

// 用 require 动态加载绕过 esbuild decorator 运行时问题
const { AnalyticsScope } = require('./analytics.entity')
const {
  GetOperationSnapshotDto,
  GetDiagnosticsDto,
  GetRecommendationsDto
} = require('./analytics.dto')

describe('Analytics DTOs', () => {
  // ─── GetOperationSnapshotDto ───
  describe('GetOperationSnapshotDto', () => {
    it('should accept valid scope TENANT', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        scope: AnalyticsScope.Tenant
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept valid scope BRAND with brandId', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        scope: AnalyticsScope.Brand,
        brandId: 'brand-abc'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept valid scope STORE with brandId and storeId', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        scope: AnalyticsScope.Store,
        brandId: 'brand-xyz',
        storeId: 'store-123'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept empty body (all fields optional)', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {})
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid scope value', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        scope: 'INVALID_SCOPE'
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e: any) => e.property === 'scope'))
    })

    it('should reject non-string brandId', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        brandId: 12345
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e: any) => e.property === 'brandId'))
    })

    it('should reject non-string storeId', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        storeId: true as any
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e: any) => e.property === 'storeId'))
    })

    it('should accept STORE scope with only storeId (brandId optional)', async () => {
      const dto = plainToInstance(GetOperationSnapshotDto, {
        scope: AnalyticsScope.Store,
        storeId: 'store-alone'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })
  })

  // ─── GetDiagnosticsDto ───
  describe('GetDiagnosticsDto', () => {
    it('should accept valid scope TENANT', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {
        scope: AnalyticsScope.Tenant
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept valid scope BRAND with brandId', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {
        scope: AnalyticsScope.Brand,
        brandId: 'brand-diag'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept valid scope STORE with both ids', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {
        scope: AnalyticsScope.Store,
        brandId: 'b-diag',
        storeId: 's-diag'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept empty body (all fields optional)', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {})
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid scope value', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {
        scope: 'BOGUS'
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e: any) => e.property === 'scope'))
    })

    it('should reject non-string brandId', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {
        brandId: ['array-not-allowed'] as any
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
    })

    it('should reject non-string storeId', async () => {
      const dto = plainToInstance(GetDiagnosticsDto, {
        storeId: { obj: true } as any
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
    })
  })

  // ─── GetRecommendationsDto ───
  describe('GetRecommendationsDto', () => {
    it('should accept valid scope TENANT', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {
        scope: AnalyticsScope.Tenant
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept valid scope BRAND with brandId', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {
        scope: AnalyticsScope.Brand,
        brandId: 'brand-rec'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept valid scope STORE with both ids', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {
        scope: AnalyticsScope.Store,
        brandId: 'b-rec',
        storeId: 's-rec'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should accept empty body (all fields optional)', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {})
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid scope value', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {
        scope: 'NOT_A_SCOPE'
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e: any) => e.property === 'scope'))
    })

    it('should accept scope undefined with valid brandId and storeId', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {
        brandId: 'b-only',
        storeId: 's-only'
      })
      const errors = await validate(dto as object)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid types on optional fields', async () => {
      const dto = plainToInstance(GetRecommendationsDto, {
        scope: AnalyticsScope.Tenant,
        brandId: 42 as any
      })
      const errors = await validate(dto as object)
      assert.ok(errors.length > 0)
    })
  })

  // ─── Cross-cutting: DTO 实例属性检查 ───
  describe('DTO instance properties', () => {
    it('GetOperationSnapshotDto should have expected properties', () => {
      const dto = new GetOperationSnapshotDto()
      dto.scope = AnalyticsScope.Tenant
      dto.brandId = 'b'
      dto.storeId = 's'
      assert.strictEqual(dto.scope, AnalyticsScope.Tenant)
      assert.strictEqual(dto.brandId, 'b')
      assert.strictEqual(dto.storeId, 's')
    })

    it('GetDiagnosticsDto should have expected properties', () => {
      const dto = new GetDiagnosticsDto()
      dto.scope = AnalyticsScope.Brand
      dto.brandId = 'b-diag'
      assert.strictEqual(dto.scope, AnalyticsScope.Brand)
      assert.strictEqual(dto.brandId, 'b-diag')
      assert.strictEqual(dto.storeId, undefined)
    })

    it('GetRecommendationsDto should have expected properties', () => {
      const dto = new GetRecommendationsDto()
      dto.scope = AnalyticsScope.Store
      dto.brandId = 'b-rec'
      dto.storeId = 's-rec'
      assert.strictEqual(dto.scope, AnalyticsScope.Store)
      assert.strictEqual(dto.brandId, 'b-rec')
      assert.strictEqual(dto.storeId, 's-rec')
    })
  })
})
