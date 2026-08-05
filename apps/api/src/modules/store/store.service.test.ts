/**
 * store.service.spec.ts — 门店管理模块 Service 单元测试
 *
 * 覆盖: CRUD / 分页查询 / 多条件筛选 / 统计 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreService } from './store.service'
import { StoreStatus, StoreType } from './store.entity'
import { NotFoundException } from '@nestjs/common'

const mockCtx = { tenantId: 'tenant-001', brandId: 'brand-001' } as any

describe('StoreService — CRUD', () => {
  let svc: StoreService

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
  })

  it('create 创建门店成功', () => {
    const store = svc.create(mockCtx, {
      storeCode: 'NEW-001',
      name: '新门店',
      address: '测试地址',
      phone: '0755-88888888',
      status: StoreStatus.Active,
      type: StoreType.SelfOwned,
      area: 200,
      managerName: '王经理',
      managerPhone: '13800138001',
      openingTime: '09:00',
      closingTime: '22:00',
      description: '新门店描述',
      tags: ['新店'],
      longitude: 113.0,
      latitude: 22.5,
    })
    expect(store.id).toMatch(/^store-/)
    expect(store.name).toBe('新门店')
    expect(store.storeCode).toBe('NEW-001')
    expect(store.status).toBe(StoreStatus.Active)
  })

  it('getById 返回门店', () => {
    const store = svc.create(mockCtx, {
      storeCode: 'GET-001', name: '查询门店', address: '地址',
      status: StoreStatus.Active, type: StoreType.SelfOwned,
      area: 100, managerName: 'Mgr', managerPhone: '138',
      openingTime: '09:00', closingTime: '22:00',
    })
    const found = svc.getById(store.id, mockCtx)
    expect(found.name).toBe('查询门店')
  })

  it('getById 不存在抛 NotFoundException', () => {
    expect(() => svc.getById('nonexistent', mockCtx)).toThrow(NotFoundException)
  })

  it('update 更新门店信息', () => {
    const store = svc.create(mockCtx, {
      storeCode: 'UPD-001', name: '旧名', address: '旧地址',
      status: StoreStatus.Active, type: StoreType.SelfOwned,
      area: 100, managerName: 'Mgr', managerPhone: '138',
      openingTime: '09:00', closingTime: '22:00',
    })
    const updated = svc.update(store.id, mockCtx, {
      name: '新名称',
      address: '新地址',
      status: StoreStatus.Inactive,
    })
    expect(updated.name).toBe('新名称')
    expect(updated.status).toBe(StoreStatus.Inactive)
  })

  it('update 不存在抛 NotFoundException', () => {
    expect(() => svc.update('fake-id', mockCtx, { name: '新名' })).toThrow(NotFoundException)
  })

  it('delete 删除成功', () => {
    const store = svc.create(mockCtx, {
      storeCode: 'DEL-001', name: '删除门店', address: '地址',
      status: StoreStatus.Active, type: StoreType.Franchise,
      area: 80, managerName: 'Mgr', managerPhone: '138',
      openingTime: '10:00', closingTime: '21:00',
    })
    svc.delete(store.id, mockCtx)
    expect(() => svc.getById(store.id, mockCtx)).toThrow(NotFoundException)
  })

  it('delete 不存在抛 NotFoundException', () => {
    expect(() => svc.delete('fake-id', mockCtx)).toThrow(NotFoundException)
  })
})

describe('StoreService — 分页查询', () => {
  let svc: StoreService

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
    // 创建种子门店
    for (let i = 0; i < 5; i++) {
      svc.create(mockCtx, {
        storeCode: `SEED-${i}`, name: `种子门店${i}`, address: `地址${i}`,
        status: StoreStatus.Active, type: StoreType.SelfOwned,
        area: 100 + i * 10, managerName: `Mgr${i}`, managerPhone: `138${i}`,
        openingTime: '09:00', closingTime: '22:00',
      })
    }
  })

  it('list 返回分页结果', () => {
    const result = svc.list(mockCtx, { page: 1, limit: 2 })
    expect(result.items).toHaveLength(2)
    expect(result.total).toBeGreaterThanOrEqual(5)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(2)
  })

  it('list 按关键字搜索', () => {
    const result = svc.list(mockCtx, { keyword: '种子门店1' })
    expect(result.items.length).toBeGreaterThanOrEqual(1)
  })

  it('list 按状态筛选', () => {
    const result = svc.list(mockCtx, { status: StoreStatus.Active })
    result.items.forEach((s) => expect(s.status).toBe(StoreStatus.Active))
  })

  it('list 按类型筛选', () => {
    const result = svc.list(mockCtx, { type: StoreType.SelfOwned })
    result.items.forEach((s) => expect(s.type).toBe(StoreType.SelfOwned))
  })
})

describe('StoreService — 统计', () => {
  let svc: StoreService

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
  })

  it('getStats 返回门店模拟统计数据', () => {
    const store = svc.create(mockCtx, {
      storeCode: 'STAT-001', name: '统计门店', address: '地址',
      status: StoreStatus.Active, type: StoreType.SelfOwned,
      area: 150, managerName: 'Mgr', managerPhone: '138',
      openingTime: '09:00', closingTime: '22:00',
    })
    const stats = svc.getStats(store.id, mockCtx)
    expect(stats.storeId).toBe(store.id)
    expect(stats.storeName).toBe('统计门店')
    expect(stats.totalMembers).toBeGreaterThan(0)
    expect(stats.onlineDevices).toBeGreaterThan(0)
    expect(stats.todayRevenue).toBeGreaterThan(0)
    expect(stats.stockAlerts).toBeGreaterThan(0)
    expect(stats.employeeCount).toBeGreaterThan(0)
  })

  it('getStats 不存在的门店抛 NotFoundException', () => {
    expect(() => svc.getStats('fake-id', mockCtx)).toThrow(NotFoundException)
  })
})
