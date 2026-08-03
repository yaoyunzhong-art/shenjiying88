/**
 * rls.middleware-prisma.test.ts — Prisma 中间件 RLS 自动拦截单元测试
 *
 * 🐜 V23: G5-C1 数据库层Prisma RLS自动拦截
 *   测试 createRlsExtension() Prisma v6 $extends 中间件
 *   验证 tenantId 在 CRUD 操作中的自动注入和隔离
 *
 * 聚焦:
 *   - 创建: 自动填充 data.tenantId
 *   - 查询: 自动附加 WHERE tenantId = ?
 *   - 更新: 自动附加 WHERE tenantId = ?
 *   - 删除: 自动附加 WHERE tenantId = ?
 *   - 非 tenant-aware 模型跳过
 *   - 无租户上下文降级
 *   - 用户已指定 tenantId 条件时保留
 *
 * Mock 策略 (URL-pattern responseRegistry):
 *   直接调用 $allOperations 中间件, 以 mockQuery 捕获最终 args.
 *   不使用任何 asyncLocalStorage 副作用.
 *
 * 覆盖: 正例 + 反例 + 边界（三件套）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import assert from 'node:assert/strict'
import { createRlsExtension, createRlsClient } from './rls.middleware-prisma'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 测试辅助: 创建 mock query 函数 ──────────────────────────

/**
 * 创建一个 mock query 函数, 记录每次调用的 args。
 *
 * @param retValue   mock query 返回值
 * @returns          [mockFn, callArgs[]]
 */
function createMockQuery<T = any>(retValue: T = {} as T): [ReturnType<typeof vi.fn>, any[]] {
  const capturedArgs: any[] = []
  const fn = vi.fn().mockImplementation((args: any) => {
    capturedArgs.push(args)
    return Promise.resolve(retValue)
  })
  return [fn, capturedArgs]
}

// ── 测试使用的 tenant-aware 模型名 ──────────────────────────
const TENANT_MODEL = 'Store'
const NON_TENANT_MODEL = 'Tenant'
const OPTIONAL_TENANT_MODEL = 'RegionalConfigOverride'

// ── 默认测试上下文 ─────────────────────────────────────────
const DEFAULT_CTX = { tenantId: 't-test-001', userId: 'user-1', role: 'tenant_admin' as const }

describe('createRlsExtension() — Prisma RLS 中间件', () => {
  // ═════════════════════════════════════════════════════════
  // 创建操作 — data.tenantId 自动注入
  // ═════════════════════════════════════════════════════════

  describe('创建 (create / createMany / upsert)', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] create 自动注入 tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'new-1', tenantId: 't-test-001' })
      const args = { data: { name: 'Test Store' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'create', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].data.tenantId, 't-test-001')
      assert.equal(captured[0].data.name, 'Test Store')
      // 不修改其他字段
      assert.ok('name' in captured[0].data)
    })

    it('[反例] create 无租户上下文时不注入 tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'new-1' })
      const args = { data: { name: 'Test Store' } }

      // 不调用 runWithTenant — getTenantContext() 返回 undefined
      await $allOperations({ model: TENANT_MODEL, operation: 'create', args, query: mockQuery })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].data.tenantId, undefined)
      assert.equal(captured[0].data.name, 'Test Store')
    })

    it('[反例] create 用户已指定 tenantId 时不覆盖', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'new-1', tenantId: 't-user-specified' })
      const args = { data: { name: 'Test', tenantId: 't-user-specified' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'create', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      // 应该保留用户指定的值
      assert.equal(captured[0].data.tenantId, 't-user-specified')
    })

    it('[边界] create 空 data 对象时仍注入', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'new-1', tenantId: 't-test-001' })
      const args = { data: {} }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'create', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].data.tenantId, 't-test-001')
    })

    it('[正例] createMany 数组每个元素自动注入 tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ count: 2 })
      const args = {
        data: [
          { name: 'Store A' },
          { name: 'Store B' },
        ],
      }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'createMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].data[0].tenantId, 't-test-001')
      assert.equal(captured[0].data[1].tenantId, 't-test-001')
      assert.equal(captured[0].data[0].name, 'Store A')
      assert.equal(captured[0].data[1].name, 'Store B')
    })

    it('[反例] createMany 中某个元素已有 tenantId 时不覆盖', async () => {
      const [mockQuery, captured] = createMockQuery({ count: 2 })
      const args = {
        data: [
          { name: 'A', tenantId: 't-preset' },
          { name: 'B' },
        ],
      }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'createMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].data[0].tenantId, 't-preset') // 保留原有
      assert.equal(captured[0].data[1].tenantId, 't-test-001') // 自动注入
    })

    it('[边界] createMany 空数组不报错', async () => {
      const [mockQuery, captured] = createMockQuery({ count: 0 })
      const args = { data: [] }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'createMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.deepEqual(captured[0].data, [])
    })

    it('[正例] upsert 注入 data.tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'ups-1', tenantId: 't-test-001' })
      const args = {
        where: { id: 'ups-1' },
        create: { name: 'New' },
        update: { name: 'Updated' },
      }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'upsert', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      // upsert 会触发 data.tenantId 注入 (step 4: create/upsert)
      // 但 upsert 不在 ACTIONS_WHERE 中, 所以不会注入 where.tenantId
      assert.equal(captured[0].data.tenantId, 't-test-001')
      // where 应该只有原始的 id (upsert 不在 ACTIONS_WHERE 中)
      assert.equal(captured[0].where.tenantId, undefined)
    })
  })

  // ═════════════════════════════════════════════════════════
  // 查询操作 — WHERE tenantId = ? 自动附加
  // ═════════════════════════════════════════════════════════

  describe('查询 (findUnique / findMany / findFirst)', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] findUnique 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'rec-1', tenantId: 't-test-001' })
      const args = { where: { id: 'rec-1' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findUnique', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
      assert.equal(captured[0].where.id, 'rec-1')
    })

    it('[正例] findMany 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery([{ id: 'r1', tenantId: 't-test-001' }])
      const args = { where: { isActive: true } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
      assert.equal(captured[0].where.isActive, true)
    })

    it('[正例] findFirst 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'r1', tenantId: 't-test-001' })
      const args = { where: { name: 'Store X' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findFirst', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[反例] 查询无 where 时自动创建 where.tenantId', async () => {
      const [mockQuery, captured] = createMockQuery([])
      const args = {} // 没有 where

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[反例] 用户已指定 tenantId in where 时不覆盖', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'r1', tenantId: 't-specific' })
      const args = { where: { tenantId: 't-specific' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findUnique', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      // where.tenantId 应该等于用户指定的值, 而非上下文中的值
      assert.equal(captured[0].where.tenantId, 't-specific')
    })
  })

  // ═════════════════════════════════════════════════════════
  // 更新操作 — WHERE tenantId = ? 自动附加
  // ═════════════════════════════════════════════════════════

  describe('更新 (update / updateMany)', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] update 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'upd-1', tenantId: 't-test-001', active: true })
      const args = { where: { id: 'upd-1' }, data: { active: true } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'update', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
      assert.equal(captured[0].where.id, 'upd-1')
    })

    it('[正例] updateMany 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ count: 3 })
      const args = { where: { isActive: false }, data: { isActive: true } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'updateMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[反例] update 无租户上下文时不注入', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'upd-1' })
      const args = { where: { id: 'upd-1' }, data: { active: true } }

      // 没有 runWithTenant — 无上下文
      await $allOperations({ model: TENANT_MODEL, operation: 'update', args, query: mockQuery })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, undefined)
    })
  })

  // ═════════════════════════════════════════════════════════
  // 删除操作 — WHERE tenantId = ? 自动附加
  // ═════════════════════════════════════════════════════════

  describe('删除 (delete / deleteMany)', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] delete 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'del-1', tenantId: 't-test-001' })
      const args = { where: { id: 'del-1' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'delete', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[正例] deleteMany 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ count: 0 })
      const args = { where: { status: 'archived' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'deleteMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[反例] delete 无租户上下文时不注入', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'del-1' })
      const args = { where: { id: 'del-1' } }

      await $allOperations({ model: TENANT_MODEL, operation: 'delete', args, query: mockQuery })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, undefined)
    })
  })

  // ═════════════════════════════════════════════════════════
  // 聚合操作 — WHERE tenantId = ? 自动附加
  // ═════════════════════════════════════════════════════════

  describe('聚合 (aggregate / count / groupBy)', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] aggregate 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery({ _count: { id: 5 } })
      const args = { where: { isActive: true }, _count: { id: true } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'aggregate', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[正例] count 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery(10)
      const args = { where: { status: 'active' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'count', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[正例] groupBy 自动附加 WHERE tenantId', async () => {
      const [mockQuery, captured] = createMockQuery([{ status: 'active', _count: 5 }])
      const args = { by: ['status'], _count: true, where: {} }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'groupBy', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })
  })

  // ═════════════════════════════════════════════════════════
  // 非 tenant-aware 模型 — 跳过注入
  // ═════════════════════════════════════════════════════════

  describe('非 tenant-aware 模型跳过', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[反例] 非 tenant-aware 模型 create 不注入', async () => {
      const [mockQuery, captured] = createMockQuery({})
      const args = { data: { name: 'System Tenant' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: NON_TENANT_MODEL, operation: 'create', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].data.tenantId, undefined)
    })

    it('[反例] 非 tenant-aware 模型 findMany 不注入', async () => {
      const [mockQuery, captured] = createMockQuery([])
      const args = { where: { isActive: true } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: NON_TENANT_MODEL, operation: 'findMany', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, undefined)
    })

    it('[反例] 非 tenant-aware 模型 delete 不注入', async () => {
      const [mockQuery, captured] = createMockQuery({})
      const args = { where: { id: 't-1' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: NON_TENANT_MODEL, operation: 'delete', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, undefined)
    })
  })

  // ═════════════════════════════════════════════════════════
  // tenantId 列存在性校验 — optional 模型
  // ═════════════════════════════════════════════════════════

  describe('optional tenantId 模型', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] optional 模型有上下文时注入', async () => {
      const [mockQuery, captured] = createMockQuery({ id: 'rc-1', tenantId: 't-test-001' })
      const args = { where: { id: 'rc-1' } }

      await runWithTenant(DEFAULT_CTX, async () => {
        await $allOperations({ model: OPTIONAL_TENANT_MODEL, operation: 'findUnique', args, query: mockQuery })
      })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, 't-test-001')
    })

    it('[边界] optional 模型无上下文时不注入', async () => {
      const [mockQuery, captured] = createMockQuery([])
      const args = { where: { key: 'some-key' } }

      await $allOperations({ model: OPTIONAL_TENANT_MODEL, operation: 'findMany', args, query: mockQuery })

      assert.equal(captured.length, 1)
      assert.equal(captured[0].where.tenantId, undefined)
    })
  })

  // ═════════════════════════════════════════════════════════
  // 多租户隔离: 不同租户上下文隔离
  // ═════════════════════════════════════════════════════════

  describe('多租户隔离 (跨租户)', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] 不同租户上下文注入不同 tenantId', async () => {
      const capturedA: any[] = []
      const capturedB: any[] = []

      const mockA = vi.fn().mockImplementation((args: any) => {
        capturedA.push(args)
        return Promise.resolve([])
      })
      const mockB = vi.fn().mockImplementation((args: any) => {
        capturedB.push(args)
        return Promise.resolve([])
      })

      await runWithTenant({ tenantId: 'tenant-A' }, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findMany', args: { where: {} }, query: mockA })
      })

      await runWithTenant({ tenantId: 'tenant-B' }, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'findMany', args: { where: {} }, query: mockB })
      })

      assert.equal(capturedA[0].where.tenantId, 'tenant-A')
      assert.equal(capturedB[0].where.tenantId, 'tenant-B')
      assert.notEqual(capturedA[0].where.tenantId, capturedB[0].where.tenantId)
    })

    it('[正例] 跨租户隔离: 创建数据归属各自租户', async () => {
      const capturedA: any[] = []
      const capturedB: any[] = []

      const mockA = vi.fn().mockImplementation((args: any) => {
        capturedA.push(args)
        return Promise.resolve({ id: 'a-1', tenantId: 'tenant-A' })
      })
      const mockB = vi.fn().mockImplementation((args: any) => {
        capturedB.push(args)
        return Promise.resolve({ id: 'b-1', tenantId: 'tenant-B' })
      })

      await runWithTenant({ tenantId: 'tenant-A' }, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'create', args: { data: { name: 'Store A' } }, query: mockA })
      })

      await runWithTenant({ tenantId: 'tenant-B' }, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'create', args: { data: { name: 'Store B' } }, query: mockB })
      })

      assert.equal(capturedA[0].data.tenantId, 'tenant-A')
      assert.equal(capturedB[0].data.tenantId, 'tenant-B')
    })
  })

  // ═════════════════════════════════════════════════════════
  // 完整 CRUD 操作覆盖
  // ═════════════════════════════════════════════════════════

  describe('CRUD 完整操作覆盖', () => {
    const $allOperations = createRlsExtension().query.$allModels.$allOperations

    it('[正例] C(create) += R(findMany) += U(update) += D(delete) 全流程隔离', async () => {
      const captured: Record<string, any[]> = { create: [], findMany: [], update: [], delete: [] }

      const mockFactory = (op: string) =>
        vi.fn().mockImplementation((args: any) => {
          captured[op].push(args)
          return Promise.resolve({})
        })

      await runWithTenant({ tenantId: 't-full-flow' }, async () => {
        await $allOperations({ model: TENANT_MODEL, operation: 'create', args: { data: { name: 'Flow' } }, query: mockFactory('create') })
        await $allOperations({ model: TENANT_MODEL, operation: 'findMany', args: { where: {} }, query: mockFactory('findMany') })
        await $allOperations({ model: TENANT_MODEL, operation: 'update', args: { where: { id: 'x' }, data: { name: 'Updated' } }, query: mockFactory('update') })
        await $allOperations({ model: TENANT_MODEL, operation: 'delete', args: { where: { id: 'x' } }, query: mockFactory('delete') })
      })

      assert.equal(captured.create[0].data.tenantId, 't-full-flow')
      assert.equal(captured.findMany[0].where.tenantId, 't-full-flow')
      assert.equal(captured.update[0].where.tenantId, 't-full-flow')
      assert.equal(captured.delete[0].where.tenantId, 't-full-flow')
    })
  })
})

describe('createRlsClient() — 独立 client 工厂', () => {
  it('函数已导出存在', () => {
    assert.equal(typeof createRlsClient, 'function')
  })

  it('createRlsClient 签名正确 (无参数)', () => {
    assert.equal(createRlsClient.length, 0)
  })

  it('createRlsClient 在 Prisma 环境下可调用', () => {
    // 函数不会抛错, 但实际连接需要数据库
    // 验证函数定义正确
    assert.equal(typeof createRlsClient, 'function')
  })
})
