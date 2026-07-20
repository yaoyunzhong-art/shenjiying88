/**
 * store.service.ts · 门店管理服务
 *
 * Phase 1 商店管理模块 CRUD + 统计
 * 使用 in-memory 存储，方便 Phase 1 验证
 */

import { randomUUID } from 'node:crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  Store,
  StoreStatus,
  StoreType,
  StoreStats,
} from './store.entity'
import type { CreateStoreDto, UpdateStoreDto, StoreQueryDto } from './store.dto'

// ═══════════════════════════════════════════════════════════════════════
// In-memory store
// ═══════════════════════════════════════════════════════════════════════

const storeMap = new Map<string, Store>()

// ═══════════════════════════════════════════════════════════════════════
// Mock data — 6 家门店覆盖不同状态和类型
// ═══════════════════════════════════════════════════════════════════════

let seeded = false

function seedMockStores(): void {
  if (seeded) return
  seeded = true

  const tenantId = 'tenant-001'
  const now = new Date().toISOString()

  const mockStores: Array<{
    id: string
    storeCode: string
    name: string
    address: string
    phone: string
    status: StoreStatus
    type: StoreType
    area: number
    managerName: string
    managerPhone: string
    openingTime: string
    closingTime: string
    description: string
    tags: string[]
    longitude: number
    latitude: number
  }> = [
    {
      id: 'store-001',
      storeCode: 'SZ-WXC-001',
      name: '深圳万象城店',
      address: '深圳市南山区深南大道9668号万象城B1-01',
      phone: '0755-88886666',
      status: StoreStatus.Active,
      type: StoreType.SelfOwned,
      area: 380,
      managerName: '王建国',
      managerPhone: '13800138001',
      openingTime: '09:00',
      closingTime: '22:00',
      description: '深圳旗舰店，位于万象城负一层，占地面积380平方米',
      tags: ['旗舰店', 'VR体验', '直播区'],
      longitude: 113.9423,
      latitude: 22.5332,
    },
    {
      id: 'store-002',
      storeCode: 'BJ-GM-002',
      name: '北京国贸店',
      address: '北京市朝阳区建国门外大街1号国贸大厦B2-12',
      phone: '010-65002222',
      status: StoreStatus.Active,
      type: StoreType.SelfOwned,
      area: 280,
      managerName: '李明',
      managerPhone: '13900139001',
      openingTime: '10:00',
      closingTime: '21:30',
      description: '北京CBD核心商圈',
      tags: ['商圈店', '亲子专区'],
      longitude: 116.4585,
      latitude: 39.9092,
    },
    {
      id: 'store-003',
      storeCode: 'SH-NJL-003',
      name: '上海南京路店',
      address: '上海市黄浦区南京东路100号第一百货6F-01',
      phone: '021-63288888',
      status: StoreStatus.Active,
      type: StoreType.SelfOwned,
      area: 520,
      managerName: '张伟',
      managerPhone: '13700137001',
      openingTime: '09:30',
      closingTime: '22:30',
      description: '上海最大门店，五层楼的综合性娱乐空间',
      tags: ['旗舰店', '餐饮', 'VR体验', 'KTV'],
      longitude: 121.4737,
      latitude: 31.2314,
    },
    {
      id: 'store-004',
      storeCode: 'GZ-THC-004',
      name: '广州天河城店',
      address: '广州市天河区天河路208号天河城3F-10',
      phone: '020-85590000',
      status: StoreStatus.Active,
      type: StoreType.Franchise,
      area: 200,
      managerName: '刘芳',
      managerPhone: '13600136001',
      openingTime: '10:00',
      closingTime: '22:00',
      description: '天河商圈加盟店',
      tags: ['商圈店'],
      longitude: 113.3290,
      latitude: 23.1368,
    },
    {
      id: 'store-005',
      storeCode: 'HZ-XH-005',
      name: '杭州西湖店',
      address: '杭州市上城区延安路98号西湖银泰B1-05',
      phone: '0571-87009999',
      status: StoreStatus.Active,
      type: StoreType.SelfOwned,
      area: 310,
      managerName: '陈伟强',
      managerPhone: '13500135001',
      openingTime: '09:30',
      closingTime: '21:30',
      description: '西湖景区附近主力店',
      tags: ['旅游区', '潮玩'],
      longitude: 120.1640,
      latitude: 30.2505,
    },
    {
      id: 'store-006',
      storeCode: 'CD-CX-006',
      name: '成都春熙路店',
      address: '成都市锦江区春熙路伊藤洋华堂5F-03',
      phone: '028-86660000',
      status: StoreStatus.Active,
      type: StoreType.Partner,
      area: 150,
      managerName: '周杰',
      managerPhone: '13400134001',
      openingTime: '10:00',
      closingTime: '22:00',
      description: '合作门店，位于春熙路核心商圈',
      tags: ['商圈店', '合作店'],
      longitude: 104.0803,
      latitude: 30.6569,
    },
  ]

  for (const m of mockStores) {
    const store: Store = {
      id: m.id,
      tenantId,
      storeCode: m.storeCode,
      name: m.name,
      address: m.address,
      phone: m.phone,
      status: m.status,
      type: m.type,
      area: m.area,
      managerName: m.managerName,
      managerPhone: m.managerPhone,
      openingTime: m.openingTime,
      closingTime: m.closingTime,
      description: m.description,
      tags: m.tags,
      longitude: m.longitude,
      latitude: m.latitude,
      createdAt: now,
      updatedAt: now,
    }
    storeMap.set(store.id, store)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════

@Injectable()
export class StoreService {
  /**
   * 分页查询门店列表
   */
  list(
    ctx: RequestTenantContext,
    query: StoreQueryDto = {} as StoreQueryDto,
  ): { items: Store[]; total: number; page: number; limit: number } {
    seedMockStores()

    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const offset = (page - 1) * limit

    let items = Array.from(storeMap.values())
      .filter((s) => s.tenantId === ctx.tenantId)

    // ── Filters ──
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      items = items.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.storeCode.toLowerCase().includes(kw) ||
          s.address.toLowerCase().includes(kw) ||
          (s.phone && s.phone.includes(kw)) ||
          (s.managerName && s.managerName.toLowerCase().includes(kw)),
      )
    }
    if (query.status) {
      items = items.filter((s) => s.status === query.status)
    }
    if (query.type) {
      items = items.filter((s) => s.type === query.type)
    }

    // ── Sort ──
    const sortBy = query.sortBy ?? 'createdAt'
    const sortOrder = query.sortOrder ?? 'desc'
    items.sort((a, b) => {
      const aVal = (a as any)[sortBy]
      const bVal = (b as any)[sortBy]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc'
        ? Number(aVal ?? 0) - Number(bVal ?? 0)
        : Number(bVal ?? 0) - Number(aVal ?? 0)
    })

    const total = items.length
    items = items.slice(offset, offset + limit)

    return { items, total, page, limit }
  }

  /**
   * 获取单个门店
   */
  getById(id: string, ctx: RequestTenantContext): Store {
    seedMockStores()

    const store = storeMap.get(id)
    if (!store || store.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`门店不存在: ${id}`)
    }
    return { ...store }
  }

  /**
   * 创建门店
   */
  create(ctx: RequestTenantContext, dto: CreateStoreDto): Store {
    seedMockStores()

    const id = `store-${randomUUID().slice(0, 8)}`
    const now = new Date().toISOString()

    const store: Store = {
      id,
      tenantId: ctx.tenantId,
      brandId: ctx.brandId,
      storeCode: dto.storeCode,
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      status: dto.status ?? StoreStatus.Active,
      type: dto.type ?? StoreType.SelfOwned,
      area: dto.area,
      managerName: dto.managerName,
      managerPhone: dto.managerPhone,
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
      description: dto.description,
      tags: dto.tags,
      imageUrl: dto.imageUrl,
      longitude: dto.longitude,
      latitude: dto.latitude,
      createdAt: now,
      updatedAt: now,
    }

    storeMap.set(id, store)
    return { ...store }
  }

  /**
   * 更新门店
   */
  update(id: string, ctx: RequestTenantContext, dto: UpdateStoreDto): Store {
    const existing = this.getById(id, ctx)

    const updated: Store = {
      ...existing,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.address !== undefined ? { address: dto.address } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.area !== undefined ? { area: dto.area } : {}),
      ...(dto.managerName !== undefined ? { managerName: dto.managerName } : {}),
      ...(dto.managerPhone !== undefined ? { managerPhone: dto.managerPhone } : {}),
      ...(dto.openingTime !== undefined ? { openingTime: dto.openingTime } : {}),
      ...(dto.closingTime !== undefined ? { closingTime: dto.closingTime } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
      ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
      updatedAt: new Date().toISOString(),
    }

    storeMap.set(id, updated)
    return { ...updated }
  }

  /**
   * 删除门店（硬删除）
   */
  delete(id: string, ctx: RequestTenantContext): void {
    this.getById(id, ctx) // 确保存在且属于当前 tenant
    storeMap.delete(id)
  }

  /**
   * 获取门店统计数据
   */
  getStats(id: string, ctx: RequestTenantContext): StoreStats {
    const store = this.getById(id, ctx)
    const now = new Date().toISOString()

    // 模拟统计 — Phase 1 返回静态模拟数据
    return {
      storeId: store.id,
      storeName: store.name,
      totalMembers: 1520,
      newMembersToday: 12,
      activeMembers: 578,
      totalDevices: 15,
      onlineDevices: 12,
      todayRevenue: 1823000,   // 分 → 18230 元
      yesterdayRevenue: 1560000,
      revenueMoM: 0.168,
      monthlyRevenue: 28500000,
      todayOrders: 86,
      stockAlerts: 3,
      employeeCount: 18,
      updatedAt: now,
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetStoreForTests(): void {
    storeMap.clear()
    seeded = false
  }
}
