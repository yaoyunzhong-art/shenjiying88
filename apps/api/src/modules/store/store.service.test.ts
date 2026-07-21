/**
 * store.service.test.ts - 门店管理服务单元测试
 *
 * 原则:
 * - vitest (globals) + node:assert/strict
 * - 正例 + 反例 + 边界（三件套）
 * - test 自包含，隔离 storeMap 通过 resetStoreForTests()
 *
 * 覆盖:
 * - list: 分页、筛选、排序
 * - getById: 存在/不存在/跨租户隔离
 * - create: 创建门店
 * - update: 更新字段
 * - delete: 删除
 * - getStats: 统计
 */

import { describe, it, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { StoreService } from './store.service'
import { StoreStatus, StoreType } from './store.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

/* ── Helpers ─────────────────────────────────────────────── */

const defaultTenant: RequestTenantContext = { tenantId: 'tenant-001' }
const otherTenant: RequestTenantContext = { tenantId: 'tenant-other' }

/* ── Tests ──────────────────────────────────────────────── */

describe('StoreService', () => {
  let service: StoreService

  beforeEach(() => {
    service = new StoreService()
    service.resetStoreForTests()
  })

  // ─── list ────────────────────────────────────────────────

  describe('list', () => {
    it('返回该租户全量门店', () => {
      const result = service.list(defaultTenant)
      assert.equal(result.total, 6) // 6 家 mock 门店
      assert.ok(result.items.length <= result.limit)
      assert.equal(result.page, 1)
    })

    it('支持分页', () => {
      const page1 = service.list(defaultTenant, { page: 1, limit: 2 })
      assert.equal(page1.items.length, 2)
      assert.equal(page1.total, 6)

      const page2 = service.list(defaultTenant, { page: 2, limit: 2 })
      assert.equal(page2.items.length, 2)
      assert.ok(page1.items[0]?.id !== page2.items[0]?.id)
    })

    it('按关键词搜索 (名称/编码/地址)', () => {
      const result = service.list(defaultTenant, { keyword: '万象城' })
      assert.equal(result.total, 1)
      assert.equal(result.items[0]?.name, '深圳万象城店')
    })

    it('按关键词搜索店名部分匹配', () => {
      const result = service.list(defaultTenant, { keyword: '北京' })
      assert.equal(result.total, 1)
      assert.equal(result.items[0]?.name, '北京国贸店')
    })

    it('按状态筛选', () => {
      const result = service.list(defaultTenant, { status: StoreStatus.Active })
      // 所有 mock 门店都是 Active
      assert.equal(result.total, 6)
    })

    it('按类型筛选', () => {
      const franchise = service.list(defaultTenant, { type: StoreType.Franchise })
      assert.equal(franchise.total, 1)
      assert.equal(franchise.items[0]?.id, 'store-004')
    })

    it('跨租户隔离: 其他租户无门店', () => {
      const result = service.list(otherTenant)
      assert.equal(result.total, 0)
    })

    it('支持按名称升序排列', () => {
      const result = service.list(defaultTenant, { sortBy: 'name', sortOrder: 'asc' })
      assert.equal(result.items[0]?.name, '北京国贸店')
      assert.equal(result.items[result.items.length - 1]?.name, '深圳万象城店')
    })

    it('不匹配关键词返回空列表', () => {
      const result = service.list(defaultTenant, { keyword: '不存在的门店' })
      assert.equal(result.total, 0)
    })
  })

  // ─── getById ─────────────────────────────────────────────

  describe('getById', () => {
    it('获取存在的门店', () => {
      const store = service.getById('store-001', defaultTenant)
      assert.equal(store.id, 'store-001')
      assert.equal(store.name, '深圳万象城店')
    })

    it('不存在的门店抛 NotFoundException', () => {
      assert.throws(
        () => service.getById('store-999', defaultTenant),
        /门店不存在/,
      )
    })

    it('跨租户隔离: 其他租户不可访问', () => {
      assert.throws(
        () => service.getById('store-001', otherTenant),
        /门店不存在/,
      )
    })
  })

  // ─── create & update ─────────────────────────────────────

  describe('create', () => {
    it('创建门店返回新门店对象', () => {
      const store = service.create(defaultTenant, {
        storeCode: 'TEST-001',
        name: '测试门店',
        address: '测试地址',
        type: StoreType.SelfOwned,
      })
      assert.match(store.id, /^store-/)
      assert.equal(store.name, '测试门店')
      assert.equal(store.tenantId, 'tenant-001')
      assert.ok(store.createdAt)
      assert.ok(store.updatedAt)
    })

    it('创建后可以通过 list 查到', () => {
      service.create(defaultTenant, {
        storeCode: 'TEST-002',
        name: '新门店',
        address: '新地址',
      })
      const result = service.list(defaultTenant, { keyword: '新门店' })
      assert.equal(result.total, 1)
    })
  })

  describe('update', () => {
    it('更新门店名称和地址', () => {
      const updated = service.update('store-001', defaultTenant, {
        name: '深圳万象城旗舰店',
        address: '深圳市南山区深南大道9668号B1-01',
      })
      assert.equal(updated.name, '深圳万象城旗舰店')
      assert.equal(updated.address, '深圳市南山区深南大道9668号B1-01')

      // 验证持久化
      const fetched = service.getById('store-001', defaultTenant)
      assert.equal(fetched.name, '深圳万象城旗舰店')
    })

    it('更新门店状态', () => {
      const updated = service.update('store-001', defaultTenant, {
        status: StoreStatus.Inactive,
      })
      assert.equal(updated.status, StoreStatus.Inactive)
    })

    it('不更新未提供的字段', () => {
      const original = service.getById('store-001', defaultTenant)
      const updated = service.update('store-001', defaultTenant, { name: '仅改名称' })
      assert.equal(updated.name, '仅改名称')
      assert.equal(updated.address, original.address)
      assert.equal(updated.phone, original.phone)
    })
  })

  // ─── delete ─────────────────────────────────────────────

  describe('delete', () => {
    it('删除门店后 list 不再包含', () => {
      service.delete('store-001', defaultTenant)
      const result = service.list(defaultTenant, { keyword: '万象城' })
      assert.equal(result.total, 0)
    })

    it('删除后 getById 抛出异常', () => {
      service.delete('store-001', defaultTenant)
      assert.throws(
        () => service.getById('store-001', defaultTenant),
        /门店不存在/,
      )
    })

    it('删除不存在的门店抛异常', () => {
      assert.throws(
        () => service.delete('store-999', defaultTenant),
        /门店不存在/,
      )
    })
  })

  // ─── getStats ───────────────────────────────────────────

  describe('getStats', () => {
    it('获取门店统计数据', () => {
      const stats = service.getStats('store-001', defaultTenant)
      assert.equal(stats.storeId, 'store-001')
      assert.equal(stats.storeName, '深圳万象城店')
      assert.equal(typeof stats.totalMembers, 'number')
      assert.equal(typeof stats.todayRevenue, 'number')
      assert.equal(typeof stats.todayOrders, 'number')
      assert.ok(stats.totalMembers > 0)
    })

    it('不存在的门店抛异常', () => {
      assert.throws(
        () => service.getStats('store-999', defaultTenant),
        /门店不存在/,
      )
    })
  })
})
