import { describe, it, expect, beforeEach, afterEach, assert } from 'vitest'
import 'reflect-metadata'
import { CollabController } from './collab.controller'
import { CollabStatus } from './collab.entity'
import { CollabService } from './collab.service'

// ── 辅助工厂 ──
function createContext(tenantId = 't-collab-01', brandId = 'b-collab-01', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

type AnyFn = (...args: any[]) => any

interface MockServiceOverrides {
  create?: AnyFn
  findAll?: AnyFn
  findById?: AnyFn
  update?: AnyFn
  delete?: AnyFn
  countByStatus?: AnyFn
}

function makeController(overrides: MockServiceOverrides = {}) {
  const service = {
    create: overrides.create ?? ((input: any) => ({
      projectId: 'collab-default',
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
    })),
    findAll: overrides.findAll ?? (() => []),
    findById: overrides.findById ?? (() => undefined),
    update: overrides.update ?? (() => ({ projectId: 'collab-updated', status: CollabStatus.Active })),
    delete: overrides.delete ?? (() => undefined),
    countByStatus: overrides.countByStatus ?? (() => {
      const counts: Record<string, number> = {}
      for (const s of Object.values(CollabStatus)) counts[s] = 0
      return counts
    }),
  }
  return new CollabController(service as any)
}

const testStartDate = '2026-08-01T00:00:00.000Z'
const testEndDate = '2026-12-31T23:59:59.000Z'

// ── 正例测试 ──
describe('CollabController 正例', () => {
  beforeEach(() => {
    CollabService._resetStoreForTest()
  })

  it('create 返回创建成功的联名项目', () => {
    const controller = makeController()
    const result = controller.create(createContext(), {
      name: '夏日联名活动',
      brandId: 'b-nike',
      startDate: testStartDate,
      endDate: testEndDate,
      revenueShareRate: 30,
      budget: 500000,
    })

    assert.equal(result.name, '夏日联名活动')
    assert.equal(result.brandId, 'b-nike')
    assert.equal(result.status, CollabStatus.Draft)
    assert.equal(result.revenueShareRate, 30)
    assert.equal(result.budget, 500000)
  })

  it('create 携带所有可选字段返回完整结构', () => {
    const controller = makeController()
    const result = controller.create(createContext(), {
      name: '完整联名项目',
      brandId: 'b-adidas',
      brandName: '阿迪达斯',
      startDate: testStartDate,
      endDate: testEndDate,
      revenueShareRate: 40,
      budget: 1000000,
      description: '本项目为年度战略联名',
    })

    assert.equal(result.name, '完整联名项目')
    assert.equal(result.brandName, '阿迪达斯')
    assert.equal(result.description, '本项目为年度战略联名')
    assert.equal(result.budget, 1000000)
  })

  it('findAll 返回项目列表', () => {
    const mockProjects = [
      { projectId: 'p-1', name: '项目A', brandId: 'b-1', status: CollabStatus.Active, revenueShareRate: 20, budget: 100000, startDate: testStartDate, endDate: testEndDate, tenantContext: createContext(), createdAt: '2026-07-21T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' },
      { projectId: 'p-2', name: '项目B', brandId: 'b-2', status: CollabStatus.Draft, revenueShareRate: 15, budget: 200000, startDate: testStartDate, endDate: testEndDate, tenantContext: createContext(), createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z' },
    ]
    const controller = makeController({ findAll: () => mockProjects })

    const result = controller.findAll(createContext())

    assert.equal(result.length, 2)
    assert.equal(result[0].projectId, 'p-1')
    assert.equal(result[1].projectId, 'p-2')
  })

  it('findAll 支持状态过滤', () => {
    const allProjects = [
      { projectId: 'p-1', name: '活跃项目', brandId: 'b-1', status: CollabStatus.Active, revenueShareRate: 20, budget: 100000, startDate: testStartDate, endDate: testEndDate, tenantContext: createContext(), createdAt: '2026-07-21T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' },
      { projectId: 'p-2', name: '草稿项目', brandId: 'b-2', status: CollabStatus.Draft, revenueShareRate: 15, budget: 200000, startDate: testStartDate, endDate: testEndDate, tenantContext: createContext(), createdAt: '2026-07-20T00:00:00.000Z', updatedAt: '2026-07-20T00:00:00.000Z' },
    ]
    let capturedFilter: any
    const controller = makeController({
      findAll: (_tenantId: string, filter: any) => {
        capturedFilter = filter
        return allProjects.filter((p) => !filter?.status || p.status === filter.status)
      },
    })

    const result = controller.findAll(createContext(), { status: CollabStatus.Draft } as any)

    assert.equal(result.length, 1)
    assert.equal(result[0].status, CollabStatus.Draft)
    assert.deepEqual(capturedFilter.status, CollabStatus.Draft)
  })

  it('findById 找到有效项目返回详情', () => {
    const mockProject = {
      projectId: 'p-find',
      name: '查找项目',
      brandId: 'b-3',
      status: CollabStatus.Negotiating,
      revenueShareRate: 25,
      budget: 300000,
      startDate: testStartDate,
      endDate: testEndDate,
      tenantContext: createContext(),
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    }
    const controller = makeController({ findById: () => mockProject })

    const result = controller.findById(createContext(), 'p-find')

    assert.ok(result)
    assert.equal(result.projectId, 'p-find')
    assert.equal(result.name, '查找项目')
    assert.equal(result.status, CollabStatus.Negotiating)
  })

  it('update 更新字段返回更新后项目', () => {
    const updatedProject = {
      projectId: 'p-update',
      name: '已更新项目',
      brandId: 'b-3',
      status: CollabStatus.Active,
      revenueShareRate: 35,
      budget: 500000,
      description: '更新后的描述',
      startDate: testStartDate,
      endDate: testEndDate,
      tenantContext: createContext(),
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }
    let capturedInput: any
    const controller = makeController({
      update: (_id: string, _tid: string, input: any) => {
        capturedInput = input
        return updatedProject
      },
    })

    const result = controller.update(createContext(), 'p-update', {
      name: '已更新项目',
      revenueShareRate: 35,
      description: '更新后的描述',
    })

    assert.equal(result.name, '已更新项目')
    assert.equal(result.revenueShareRate, 35)
    assert.equal(capturedInput.name, '已更新项目')
    assert.equal(capturedInput.revenueShareRate, 35)
    assert.equal(capturedInput.description, '更新后的描述')
  })

  it('updateStatus 更新状态', () => {
    const updatedProject = {
      projectId: 'p-status',
      name: '状态变更项目',
      brandId: 'b-3',
      status: CollabStatus.Active,
      revenueShareRate: 20,
      budget: 200000,
      startDate: testStartDate,
      endDate: testEndDate,
      tenantContext: createContext(),
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }
    let capturedStatus: any
    const controller = makeController({
      update: (_id: string, _tid: string, input: any) => {
        capturedStatus = input.status
        return updatedProject
      },
    })

    const result = controller.updateStatus(createContext(), 'p-status', CollabStatus.Active)

    assert.equal(result.status, CollabStatus.Active)
    assert.equal(capturedStatus, CollabStatus.Active)
  })

  it('delete 删除成功', () => {
    let deletedId: string | undefined
    const controller = makeController({
      delete: (projectId: string) => {
        deletedId = projectId
      },
    })

    const result = controller.delete(createContext(), 'p-delete')

    assert.ok(result.success)
    assert.equal(result.projectId, 'p-delete')
    assert.equal(deletedId, 'p-delete')
  })

  it('countByStatus 返回各状态统计', () => {
    const mockCounts: Record<string, number> = {
      [CollabStatus.Draft]: 3,
      [CollabStatus.Negotiating]: 2,
      [CollabStatus.Active]: 5,
      [CollabStatus.Paused]: 1,
      [CollabStatus.Completed]: 4,
      [CollabStatus.Cancelled]: 0,
    }
    const controller = makeController({ countByStatus: () => mockCounts })

    const result = controller.countByStatus(createContext())

    assert.equal(result[CollabStatus.Active], 5)
    assert.equal(result[CollabStatus.Draft], 3)
    assert.equal(result[CollabStatus.Cancelled], 0)
  })
})

// ── 反例测试 ──
describe('CollabController 反例', () => {
  it('create 拒绝分润比例超过100', () => {
    const controller = makeController({
      create: () => {
        throw new Error('Revenue share rate must be between 0 and 100')
      },
    })

    assert.throws(
      () => controller.create(createContext(), {
        name: '无效分润',
        brandId: 'b-1',
        startDate: testStartDate,
        endDate: testEndDate,
        revenueShareRate: 150,
        budget: 100000,
      }),
      /between 0 and 100/,
    )
  })

  it('create 拒绝负数预算', () => {
    const controller = makeController({
      create: () => {
        throw new Error('Budget must be non-negative')
      },
    })

    assert.throws(
      () => controller.create(createContext(), {
        name: '负数预算',
        brandId: 'b-1',
        startDate: testStartDate,
        endDate: testEndDate,
        revenueShareRate: 30,
        budget: -100,
      }),
      /non-negative/,
    )
  })

  it('update 拒绝不合法的状态转换', () => {
    const controller = makeController({
      update: () => {
        throw new Error('Invalid collab status transition: COMPLETED → ACTIVE')
      },
    })

    assert.throws(
      () => controller.update(createContext(), 'p-completed', { status: CollabStatus.Active }),
      /Invalid collab status transition/,
    )
  })

  it('findById 找不到返回 null', () => {
    const controller = makeController({ findById: () => undefined })

    const result = controller.findById(createContext(), 'nonexistent')

    assert.equal(result, null)
  })

  it('delete 删除不存在的项目抛出异常', () => {
    const controller = makeController({
      delete: () => {
        throw new Error('Collab project not found: nonexistent')
      },
    })

    assert.throws(
      () => controller.delete(createContext(), 'nonexistent'),
      /not found/,
    )
  })
})

// ── 边界值测试 ──
describe('CollabController 边界值', () => {
  it('findAll 空列表返回空数组', () => {
    const controller = makeController({ findAll: () => [] })

    const result = controller.findAll(createContext())

    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it('create 分润比例 0 和 100 为合法边界值', () => {
    const controller = makeController()
    const r0 = controller.create(createContext(), {
      name: '零分润',
      brandId: 'b-0',
      startDate: testStartDate,
      endDate: testEndDate,
      revenueShareRate: 0,
      budget: 100000,
    })
    const r100 = controller.create(createContext('t-2'), {
      name: '满分润',
      brandId: 'b-100',
      startDate: testStartDate,
      endDate: testEndDate,
      revenueShareRate: 100,
      budget: 200000,
    })

    assert.equal(r0.revenueShareRate, 0)
    assert.equal(r100.revenueShareRate, 100)
  })

  it('create 预算为 0 是合法边界值', () => {
    const controller = makeController()
    const result = controller.create(createContext('t-border'), {
      name: '零预算项目',
      brandId: 'b-zero',
      startDate: testStartDate,
      endDate: testEndDate,
      revenueShareRate: 10,
      budget: 0,
    })

    assert.equal(result.budget, 0)
  })
})

// ── 状态流转组合测试 ──
describe('CollabController 状态流转组合', () => {
  it('Draft → Negotiating → Active → Completed 完整生命周期', () => {
    const statuses: string[] = []
    const controller = makeController({
      update: (_id: string, _tid: string, input: any) => {
        statuses.push(input.status)
        return {
          projectId: 'p-lifecycle',
          name: '生命周期',
          brandId: 'b-lc',
          status: input.status,
          revenueShareRate: 20,
          budget: 100000,
          startDate: testStartDate,
          endDate: testEndDate,
          tenantContext: createContext(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
    })

    controller.update(createContext(), 'p-lifecycle', { status: CollabStatus.Negotiating })
    controller.update(createContext(), 'p-lifecycle', { status: CollabStatus.Active })
    controller.update(createContext(), 'p-lifecycle', { status: CollabStatus.Completed })

    assert.deepEqual(statuses, [
      CollabStatus.Negotiating,
      CollabStatus.Active,
      CollabStatus.Completed,
    ])
  })

  it('Active → Paused → Active → Cancelled 暂停恢复后取消', () => {
    const statuses: string[] = []
    const controller = makeController({
      update: (_id: string, _tid: string, input: any) => {
        statuses.push(input.status)
        return {
          projectId: 'p-pause',
          name: '暂停恢复',
          brandId: 'b-pp',
          status: input.status,
          revenueShareRate: 20,
          budget: 100000,
          startDate: testStartDate,
          endDate: testEndDate,
          tenantContext: createContext(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
    })

    controller.update(createContext(), 'p-pause', { status: CollabStatus.Paused })
    controller.update(createContext(), 'p-pause', { status: CollabStatus.Active })
    controller.update(createContext(), 'p-pause', { status: CollabStatus.Cancelled })

    assert.deepEqual(statuses, [
      CollabStatus.Paused,
      CollabStatus.Active,
      CollabStatus.Cancelled,
    ])
  })
})
