/**
 * ═══════════════════════════════════════════════════════════════
 * collab.zz-boost-25.test.ts
 *
 * 圈梁五道箍 — tree2 增强测试
 *
 * 覆盖:
 *  1. Entity / CollabStatus 枚举测试 (4)
 *  2. Service CRUD 核心逻辑 (12)
 *  3. 边界条件: 无效分润比例 / 无效日期 / 无效状态转换 (6)
 *  4. Controller 模拟测试 (4)
 *  5. 多租户隔离测试 (3)
 *  6. countByStatus 统计测试 (3)
 *  ───────────────────────────
 *  合计: ≥ 32 个测试用例
 * ═══════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CollabStatus, type CollabProject } from './collab.entity'
import { CollabService, type CreateCollabInput, type UpdateCollabInput } from './collab.service'
import { CollabController } from './collab.controller'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 辅助工厂 ──────────────────────────────────────────────────────────

function makeCtx(tenantId = 't-zzboost-01'): RequestTenantContext {
  return { tenantId } as RequestTenantContext
}

function makeInput(overrides: Partial<CreateCollabInput> = {}): CreateCollabInput {
  return {
    tenantContext: makeCtx(),
    name: '测试联名',
    brandId: 'brand-test',
    startDate: '2026-07-01T00:00:00Z',
    endDate: '2026-09-30T00:00:00Z',
    revenueShareRate: 30,
    budget: 100000,
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════════
// 1. Entity / CollabStatus 枚举测试 (4)
// ══════════════════════════════════════════════════════════════════════

describe('CollabStatus 枚举测试', () => {
  it('应包含全部 6 个状态值', () => {
    const values = Object.values(CollabStatus)
    expect(values).toContain('DRAFT')
    expect(values).toContain('NEGOTIATING')
    expect(values).toContain('ACTIVE')
    expect(values).toContain('PAUSED')
    expect(values).toContain('COMPLETED')
    expect(values).toContain('CANCELLED')
    expect(values.length).toBe(6)
  })

  it('枚举键值映射正确', () => {
    expect(CollabStatus.Draft).toBe('DRAFT')
    expect(CollabStatus.Negotiating).toBe('NEGOTIATING')
    expect(CollabStatus.Active).toBe('ACTIVE')
    expect(CollabStatus.Paused).toBe('PAUSED')
    expect(CollabStatus.Completed).toBe('COMPLETED')
    expect(CollabStatus.Cancelled).toBe('CANCELLED')
  })

  it('CollabProject 接口应包含必须字段', () => {
    // 类型编译检查（运行时通过对象形状断言）
    const project: CollabProject = {
      projectId: 'collab-test',
      tenantContext: makeCtx(),
      tenantId: 't-zzboost-01',
      name: '测试',
      brandId: 'brand-1',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-08-01T00:00:00Z',
      status: CollabStatus.Draft,
      revenueShareRate: 30,
      budget: 100000,
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    }
    expect(project).toBeDefined()
    expect(project.projectId).toBe('collab-test')
    expect(project.status).toBe(CollabStatus.Draft)
    // 可选字段应可 undefined
    expect(project.brandName).toBeUndefined()
    expect(project.description).toBeUndefined()
  })

  it('所有枚举值应可通过字符串直接比对', () => {
    const statusStr: string = 'ACTIVE'
    expect(statusStr).toBe(CollabStatus.Active)
    const draftStr: string = 'DRAFT'
    expect(draftStr).toBe(CollabStatus.Draft)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 2. Service CRUD 核心逻辑 (12)
// ══════════════════════════════════════════════════════════════════════

describe('CollabService CRUD 核心逻辑', () => {
  let service: CollabService

  beforeEach(() => {
    CollabService._resetStoreForTest()
    service = new CollabService()
  })

  // ── create ──
  it('create: 创建项目含可选字段 brandName 和 description', () => {
    const project = service.create(makeInput({
      brandName: '测试品牌',
      description: '这是一个联名项目描述',
    }))

    expect(project.brandName).toBe('测试品牌')
    expect(project.description).toBe('这是一个联名项目描述')
    expect(project.status).toBe(CollabStatus.Draft)
  })

  it('create: 创建项目自动生成 projectId 含 collab- 前缀', () => {
    const project = service.create(makeInput())
    expect(project.projectId).toMatch(/^collab-/)
    expect(project.projectId.length).toBeGreaterThan('collab-'.length)
  })

  it('create: 创建项目设置正确的租户上下文', () => {
    const ctx = makeCtx('t-special-99')
    const project = service.create(makeInput({ tenantContext: ctx }))
    expect(project.tenantContext.tenantId).toBe('t-special-99')
    expect(project.tenantId).toBe('t-special-99')
  })

  // ── findById ──
  it('findById: 返回已存在项目的完整数据', () => {
    const created = service.create(makeInput())
    const found = service.findById(created.projectId, 't-zzboost-01')
    expect(found).toBeDefined()
    expect(found!.name).toBe(created.name)
    expect(found!.brandId).toBe(created.brandId)
    expect(found!.status).toBe(CollabStatus.Draft)
    expect(found!.revenueShareRate).toBe(30)
    expect(found!.budget).toBe(100000)
  })

  it('findById: 不存在的 projectId 返回 undefined', () => {
    const result = service.findById('collab-does-not-exist', 't-zzboost-01')
    expect(result).toBeUndefined()
  })

  // ── findAll ──
  it('findAll: 单租户下创建多个项目后全部返回，按创建时间降序排列', () => {
    service.create(makeInput({ name: '最早项目' }))
    service.create(makeInput({ name: '最新项目' }))

    const projects = service.findAll('t-zzboost-01')
    expect(projects.length).toBe(2)
    // 验证按创建时间降序（根据 createdAt 字符串比较）
    const createdAts = projects.map((p) => p.createdAt)
    expect(createdAts[0] >= createdAts[1]).toBe(true)
  })

  it('findAll: 同时按状态 + 品牌 + 名称组合过滤', () => {
    service.create(makeInput({
      name: 'Nike 暑期联名',
      brandId: 'brand-nike',
    }))
    service.create(makeInput({
      name: 'Nike 冬季联名',
      brandId: 'brand-nike',
    }))
    service.create(makeInput({
      name: 'Adidas 暑期联名',
      brandId: 'brand-adidas',
    }))

    // 只查 Nike + 名称包含 "暑期"
    const results = service.findAll('t-zzboost-01', {
      brandId: 'brand-nike',
      name: '暑期',
    })
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Nike 暑期联名')
  })

  it('findAll: 无匹配项目返回空数组', () => {
    service.create(makeInput())
    const results = service.findAll('t-zzboost-01', {
      status: CollabStatus.Active,
      name: '不可能存在的名称',
    })
    expect(results).toEqual([])
  })

  // ── update ──
  it('update: 同时更新多个字段', () => {
    const p = service.create(makeInput())

    const updated = service.update(p.projectId, 't-zzboost-01', {
      name: '新名称',
      brandName: '新品牌名',
      budget: 999999,
      description: '新描述内容',
    })

    expect(updated.name).toBe('新名称')
    expect(updated.brandName).toBe('新品牌名')
    expect(updated.budget).toBe(999999)
    expect(updated.description).toBe('新描述内容')
    // 未传字段不变
    expect(updated.revenueShareRate).toBe(30)
    expect(updated.status).toBe(CollabStatus.Draft)
  })

  it('update: 只更新单个字段', () => {
    const p = service.create(makeInput())
    const updated = service.update(p.projectId, 't-zzboost-01', { budget: 500 })
    expect(updated.budget).toBe(500)
    expect(updated.name).toBe('测试联名') // 不变
  })

  // ── delete ──
  it('delete: 成功删除后 findAll 不包含该项目', () => {
    const p = service.create(makeInput({ name: '待删除项目' }))
    expect(service.findAll('t-zzboost-01').length).toBe(1)

    service.delete(p.projectId, 't-zzboost-01')
    const projects = service.findAll('t-zzboost-01')
    expect(projects.length).toBe(0)
  })

  it('delete: 不存在的项目抛出错误消息包含 projectId', () => {
    const fakeId = 'collab-nonexistent-12345'
    expect(() => service.delete(fakeId, 't-zzboost-01')).toThrow(fakeId)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 3. 边界条件: 无效分润比例 / 无效日期 / 无效状态转换 (6)
// ══════════════════════════════════════════════════════════════════════

describe('边界条件测试', () => {
  let service: CollabService

  beforeEach(() => {
    CollabService._resetStoreForTest()
    service = new CollabService()
  })

  it('分润比例 -0.01 抛出异常', () => {
    expect(() =>
      service.create(makeInput({ revenueShareRate: -0.01 })),
    ).toThrow('Revenue share rate must be between 0 and 100')
  })

  it('分润比例 100.01 抛出异常', () => {
    expect(() =>
      service.create(makeInput({ revenueShareRate: 100.01 })),
    ).toThrow('Revenue share rate must be between 0 and 100')
  })

  it('更新时预算设为 -1 抛出异常', () => {
    const p = service.create(makeInput())
    expect(() =>
      service.update(p.projectId, 't-zzboost-01', { budget: -1 }),
    ).toThrow('Budget must be non-negative')
  })

  it('结束日期与开始日期相同（同年同月同日）抛出异常', () => {
    const sameDate = '2026-07-15T00:00:00Z'
    expect(() =>
      service.create(makeInput({
        startDate: sameDate,
        endDate: sameDate,
      })),
    ).toThrow('End date must be after start date')
  })

  it('Negotiating → Cancelled 是合法转换', () => {
    const p = service.create(makeInput())
    service.update(p.projectId, 't-zzboost-01', { status: CollabStatus.Negotiating })

    const cancelled = service.update(p.projectId, 't-zzboost-01', { status: CollabStatus.Cancelled })
    expect(cancelled.status).toBe(CollabStatus.Cancelled)
  })

  it('Cancelled → 任何状态都不合法', () => {
    const p = service.create(makeInput())
    service.update(p.projectId, 't-zzboost-01', { status: CollabStatus.Cancelled })

    expect(() =>
      service.update(p.projectId, 't-zzboost-01', { status: CollabStatus.Draft }),
    ).toThrow('Invalid collab status transition')
    expect(() =>
      service.update(p.projectId, 't-zzboost-01', { status: CollabStatus.Active }),
    ).toThrow('Invalid collab status transition')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 4. Controller 模拟测试 (4)
// ══════════════════════════════════════════════════════════════════════

describe('CollabController 模拟测试', () => {
  it('create 将 DTO 字段正确转发给 service.create', () => {
    let capturedInput: any
    const controller = new CollabController({
      create: (input: any) => {
        capturedInput = input
        return {
          projectId: 'collab-ctrl-test',
          tenantContext: input.tenantContext,
          name: input.name,
          brandId: input.brandId,
          brandName: input.brandName,
          startDate: input.startDate,
          endDate: input.endDate,
          status: CollabStatus.Draft,
          revenueShareRate: input.revenueShareRate,
          budget: input.budget,
          description: input.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
      findAll: () => [],
      findById: () => undefined,
      update: () => ({ projectId: 'x', status: CollabStatus.Active } as any),
      delete: () => undefined,
      countByStatus: () => ({} as any),
    } as any)

    const ctx = makeCtx()
    const result = controller.create(ctx, {
      name: 'Ctrl联名',
      brandId: 'brand-ctrl',
      brandName: 'Ctrl品牌',
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-09-01T00:00:00Z',
      revenueShareRate: 45,
      budget: 250000,
      description: 'Controller测试项目',
    })

    expect(capturedInput.tenantContext).toBe(ctx)
    expect(capturedInput.name).toBe('Ctrl联名')
    expect(capturedInput.brandId).toBe('brand-ctrl')
    expect(capturedInput.brandName).toBe('Ctrl品牌')
    expect(capturedInput.revenueShareRate).toBe(45)
    expect(capturedInput.budget).toBe(250000)
    expect(capturedInput.description).toBe('Controller测试项目')

    expect(result.name).toBe('Ctrl联名')
    expect(result.status).toBe(CollabStatus.Draft)
    expect(result.revenueShareRate).toBe(45)
  })

  it('findById 项目不存在时返回 null 而非 undefined', () => {
    const controller = new CollabController({
      findById: () => undefined,
    } as any)

    const result = controller.findById(makeCtx(), 'nonexistent')
    expect(result).toBeNull()
  })

  it('delete 成功返回 { success: true, projectId }', () => {
    let deletedId: string | undefined
    const controller = new CollabController({
      delete: (projectId: string) => {
        deletedId = projectId
      },
    } as any)

    const result = controller.delete(makeCtx(), 'p-to-delete')
    expect(result).toEqual({ success: true, projectId: 'p-to-delete' })
    expect(deletedId).toBe('p-to-delete')
  })

  it('updateStatus 仅更新状态字段', () => {
    let capturedStatus: CollabStatus | undefined
    const controller = new CollabController({
      update: (_id: string, _tid: string, input: UpdateCollabInput) => {
        capturedStatus = input.status
        return {
          projectId: 'p-status',
          status: input.status ?? CollabStatus.Draft,
        } as any
      },
    } as any)

    const result = controller.updateStatus(makeCtx(), 'p-status', CollabStatus.Active)
    expect(capturedStatus).toBe(CollabStatus.Active)
    expect(result.status).toBe(CollabStatus.Active)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 5. 多租户隔离测试 (3)
// ══════════════════════════════════════════════════════════════════════

describe('多租户隔离测试', () => {
  let service: CollabService

  beforeEach(() => {
    CollabService._resetStoreForTest()
    service = new CollabService()
  })

  it('租户 A 创建的项目不能被租户 B 通过 findById 看到', () => {
    const pA = service.create(makeInput({ tenantContext: makeCtx('tenant-A'), name: 'A项目' }))
    const pB = service.create(makeInput({ tenantContext: makeCtx('tenant-B'), name: 'B项目' }))

    // 租户A不能看到B的项目
    const foundAinB = service.findById(pB.projectId, 'tenant-A')
    expect(foundAinB).toBeUndefined()

    // 租户B不能看到A的项目
    const foundBinA = service.findById(pA.projectId, 'tenant-B')
    expect(foundBinA).toBeUndefined()
  })

  it('租户 A 不能更新租户 B 的项目', () => {
    const pA = service.create(makeInput({ tenantContext: makeCtx('tenant-A'), name: 'A项目' }))

    expect(() =>
      service.update(pA.projectId, 'tenant-B', { name: '被篡改' }),
    ).toThrow('Collab project not found')
  })

  it('租户 A 不能删除租户 B 的项目', () => {
    const pA = service.create(makeInput({ tenantContext: makeCtx('tenant-A'), name: 'A项目' }))

    expect(() =>
      service.delete(pA.projectId, 'tenant-B'),
    ).toThrow('Collab project not found')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 6. countByStatus 统计测试 (3)
// ══════════════════════════════════════════════════════════════════════

describe('countByStatus 统计测试', () => {
  let service: CollabService

  beforeEach(() => {
    CollabService._resetStoreForTest()
    service = new CollabService()
  })

  it('多种状态混合下正确统计', () => {
    // 创建 3 个 Draft
    const d1 = service.create(makeInput({ name: 'D1' }))
    const d2 = service.create(makeInput({ name: 'D2' }))
    const d3 = service.create(makeInput({ name: 'D3' }))

    // D2 → Negotiating
    service.update(d2.projectId, 't-zzboost-01', { status: CollabStatus.Negotiating })
    // D3 → Negotiating → Active
    service.update(d3.projectId, 't-zzboost-01', { status: CollabStatus.Negotiating })
    service.update(d3.projectId, 't-zzboost-01', { status: CollabStatus.Active })

    const counts = service.countByStatus('t-zzboost-01')
    expect(counts[CollabStatus.Draft]).toBe(1) // 只有 D1
    expect(counts[CollabStatus.Negotiating]).toBe(1) // 只有 D2
    expect(counts[CollabStatus.Active]).toBe(1) // 只有 D3
    expect(counts[CollabStatus.Paused]).toBe(0)
    expect(counts[CollabStatus.Completed]).toBe(0)
    expect(counts[CollabStatus.Cancelled]).toBe(0)
  })

  it('不同租户的统计值隔离', () => {
    service.create(makeInput({ tenantContext: makeCtx('t-iso-1'), name: 'I1' }))
    service.create(makeInput({ tenantContext: makeCtx('t-iso-1'), name: 'I2' }))
    service.create(makeInput({ tenantContext: makeCtx('t-iso-2'), name: 'I3' }))

    expect(service.countByStatus('t-iso-1')[CollabStatus.Draft]).toBe(2)
    expect(service.countByStatus('t-iso-2')[CollabStatus.Draft]).toBe(1)
    expect(service.countByStatus('t-iso-3')[CollabStatus.Draft]).toBe(0)
  })

  it('返回对象包含全部 6 种状态键', () => {
    const counts = service.countByStatus('t-zzboost-01')
    const keys = Object.keys(counts)
    expect(keys).toContain('DRAFT')
    expect(keys).toContain('NEGOTIATING')
    expect(keys).toContain('ACTIVE')
    expect(keys).toContain('PAUSED')
    expect(keys).toContain('COMPLETED')
    expect(keys).toContain('CANCELLED')
    expect(keys.length).toBe(6)
  })
})
