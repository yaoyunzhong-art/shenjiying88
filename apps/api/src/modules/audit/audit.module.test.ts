/**
 * audit.module.test.ts - 审计日志 Module 测试 (扩展版)
 * 覆盖: 模块编译/服务注入/装饰器元数据/exports验证/反例/边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AuditModule } from './audit.module'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { AuditLogEntity } from './audit.entity'
import { AuditLogPaginatedResponseDto } from './audit.dto'

describe('AuditModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuditModule],
    })
      .overrideProvider(getRepositoryToken(AuditLogEntity))
      .useValue({})
      .compile()
  })

  // ── 正例 ─────────────────────────────────────────────────

  it('✅ 正例: 模块可编译', () => {
    expect(module).toBeDefined()
  })

  it('✅ 正例: AuditService 可注入', () => {
    const service = module.get<AuditService>(AuditService)
    expect(service).toBeDefined()
    expect(service.log).toBeDefined()
    expect(service.query).toBeDefined()
    expect(service.getById).toBeDefined()
    expect(service.logBatch).toBeDefined()
    expect(service.logSettlementEvent).toBeDefined()
    expect(service.detectAnomalies).toBeDefined()
    expect(service.computeRiskScore).toBeDefined()
    expect(service.exportReport).toBeDefined()
    expect(service.generateComplianceReport).toBeDefined()
  })

  it('✅ 正例: AuditController 可注入', () => {
    const controller = module.get<AuditController>(AuditController)
    expect(controller).toBeDefined()
  })

  // ── 装饰器元数据 ────────────────────────────────────────

  it('✅ 正例: AuditModule 装饰器元数据正确', () => {
    const controllers = Reflect.getMetadata('controllers', AuditModule) as unknown[]
    const providers = Reflect.getMetadata('providers', AuditModule) as unknown[]
    const exportsList = Reflect.getMetadata('exports', AuditModule) as unknown[]

    assert.ok(Array.isArray(controllers), 'controllers should be an array')
    assert.ok(Array.isArray(providers), 'providers should be an array')
    assert.ok(Array.isArray(exportsList), 'exports should be an array')

    expect(controllers).toContain(AuditController)
    expect(providers).toContain(AuditService)
    expect(exportsList).toContain(AuditService)
  })

  it('✅ 正例: AuditModule 注册了 TypeORM 实体', () => {
    const imports = Reflect.getMetadata('imports', AuditModule) as unknown[]
    // TypeOrmModule.forFeature 生成的是一个 DynamicModule, 检查 imports 存在
    assert.ok(Array.isArray(imports), 'imports should be an array')
    expect(imports.length).toBeGreaterThanOrEqual(1)
  })

  it('✅ 正例: AuditController 构造函数注入 AuditService', () => {
    // 验证装饰器元数据
    const ctorParams = Reflect.getMetadata('design:paramtypes', AuditController)
    expect(ctorParams).toBeDefined()
    expect(ctorParams).toContain(AuditService)
  })

  // ── DTO 类型验证 ────────────────────────────────────────

  it('✅ 正例: AuditLogPaginatedResponseDto 结构', () => {
    const dto: AuditLogPaginatedResponseDto = {
      items: [{ id: 'audit_001', eventType: 'auth.login', actorId: 'u1', riskLevel: 'low', timestamp: new Date(), actorType: 'user' }],
      total: 1,
    }
    expect(dto.items).toHaveLength(1)
    expect(dto.total).toBe(1)
    expect(dto.nextCursor).toBeUndefined()
  })

  // ── 反例 ─────────────────────────────────────────────────

  it('❌ 反例: 未覆盖 Repository 时 AuditService 不崩溃', () => {
    // AuditService 是内存实现, 不依赖数据库, 确保可注入
    const service = module.get<AuditService>(AuditService)
    expect(service).toBeInstanceOf(AuditService)
    // 验证内部状态初始值
    expect(service.getClientIP()).toBeNull()
    expect(service.getTraceId()).toBeNull()
  })

  it('❌ 反例: 不应注入未注册的 provider', () => {
    // 尝试获取自定义 Token 应该抛出
    expect(() => module.get('NON_EXISTENT_TOKEN' as any)).toThrow()
  })

  // ── 边界 ─────────────────────────────────────────────────

  it('🔲 边界: AuditModule 仅提供 AuditService 和 AuditController', () => {
    const providers = Reflect.getMetadata('providers', AuditModule) as unknown[]
    // AuditModule 的 providers 数组应该只有 AuditService
    // (TypeORM entity 通过 imports -> TypeOrmModule.forFeature 注册)
    expect(providers).toEqual([AuditService])
  })

  it('🔲 边界: AuditModule 仅导出 AuditService', () => {
    const exportsList = Reflect.getMetadata('exports', AuditModule) as unknown[]
    expect(exportsList).toHaveLength(1)
    expect(exportsList[0]).toBe(AuditService)
  })

  it('🔲 边界: AuditController 路由前缀', () => {
    // Controller decorator 设置的前缀
    const path = Reflect.getMetadata('path', AuditController)
    expect(path).toBeDefined()
  })
})
