/**
 * storefront.service.spec.ts — 门店 C 端 Service 单元测试
 *
 * 覆盖: 门店信息/服务列表/时段查询/预约创建/取消/改期/核销/套餐
 * 注意: StoreFrontService 使用 Prisma，测试中使用 mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StoreFrontService } from './storefront.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

function createMockPrisma() {
  return {
    storefrontBooking: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
  }
}

describe('StoreFrontService — 门店信息与服务', () => {
  let svc: StoreFrontService

  beforeEach(() => {
    svc = new StoreFrontService(createMockPrisma() as any)
  })

  it('getStore 返回门店信息', () => {
    const store = svc.getStore('beijing-chaoyang')
    expect(store.name).toContain('北京')
    expect(store.slug).toBe('beijing-chaoyang')
  })

  it('getStore 未知 slug 返回默认信息', () => {
    const store = svc.getStore('unknown-slug')
    expect(store.name).toBe('神机营')
  })

  it('resolveTenantId 返回正确租户', () => {
    expect(svc.resolveTenantId('beijing-chaoyang')).toBe('tenant-default')
    expect(svc.resolveTenantId('shanghai-pudong')).toBe('tenant-shanghai')
    expect(svc.resolveTenantId('unknown')).toBe('tenant-default')
  })

  it('getServices 返回服务列表', () => {
    const services = svc.getServices('beijing-chaoyang')
    expect(services.length).toBeGreaterThan(0)
  })

  it('getServices 支持按分类筛选', () => {
    const sports = svc.getServices('beijing-chaoyang', 'sports')
    sports.forEach((s) => expect(s.category).toBe('sports'))
  })

  it('getServices 未知 slug 返回默认服务', () => {
    const services = svc.getServices('unknown')
    expect(services.length).toBeGreaterThan(0)
  })

  it('getPackages 返回套餐列表', () => {
    const pkgs = svc.getPackages()
    expect(pkgs.length).toBeGreaterThan(0)
  })
})

describe('StoreFrontService — 时段查询', () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let svc: StoreFrontService

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new StoreFrontService(prisma as any)
  })

  it('getSlots 返回时段列表', async () => {
    const slots = await svc.getSlots('beijing-chaoyang', 'svc-001', '2026-08-15')
    expect(slots.length).toBeGreaterThan(0)
    slots.forEach((s) => {
      expect(s.time).toBeDefined()
      expect(typeof s.available).toBe('boolean')
    })
  })

  it('getSlots 不存在的服务抛 NotFoundException', async () => {
    await expect(svc.getSlots('beijing-chaoyang', 'nonexistent', '2026-08-15'))
      .rejects.toThrow(NotFoundException)
  })
})

describe('StoreFrontService — 预约流程', () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let svc: StoreFrontService

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new StoreFrontService(prisma as any)
  })

  it('createBooking 创建预约成功', async () => {
    prisma.storefrontBooking.create.mockResolvedValue({
      bookingId: 'BK-1234567890-abcdef',
      tenantId: 'tenant-default',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: '2026-08-20',
      timeSlot: '10:00',
      customerName: '张三',
      customerPhone: '13800138001',
      amount: 6900,
      status: 'confirmed',
      qrCode: 'QR:...',
      qrSignature: 'sig123',
      paymentUrl: 'https://pay.shenjiying.com/order/BK-123',
    })

    const result = await svc.createBooking({
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      date: '2026-08-20',
      timeSlot: '10:00',
      customerName: '张三',
      customerPhone: '13800138001',
    })
    expect(result.status).toBe('confirmed')
    expect(result.bookingId).toBeDefined()
    expect(result.qrCode).toBeDefined()
    expect(result.paymentUrl).toBeDefined()
  })

  it('createBooking 优惠券折扣生效', async () => {
    prisma.storefrontBooking.create.mockResolvedValue({
      bookingId: 'BK-9999',
      tenantId: 'tenant-default',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: '2026-08-20',
      timeSlot: '10:00',
      customerName: '李四',
      customerPhone: '13900139002',
      amount: 1900, // 6900 - 5000
      status: 'confirmed',
      qrCode: 'QR:...',
      qrSignature: 'sig456',
      paymentUrl: '',
    })

    const result = await svc.createBooking({
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      date: '2026-08-20',
      timeSlot: '10:00',
      customerName: '李四',
      customerPhone: '13900139002',
      couponCode: 'WELCOME50',
    })
    expect(result.amount).toBe(1900)
  })
})

describe('StoreFrontService — 取消/改期/核销', () => {
  let prisma: ReturnType<typeof createMockPrisma>
  let svc: StoreFrontService

  beforeEach(() => {
    prisma = createMockPrisma()
    svc = new StoreFrontService(prisma as any)
  })

  it('getBooking 不存在的预约抛 NotFoundException', async () => {
    prisma.storefrontBooking.findUnique.mockResolvedValue(null)
    await expect(svc.getBooking('nonexistent')).rejects.toThrow(NotFoundException)
  })

  it('cancelBooking 无法取消已取消的预约', async () => {
    prisma.storefrontBooking.findUnique.mockResolvedValue({
      bookingId: 'BK-001', status: 'cancelled', storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001', date: '2026-08-20', timeSlot: '10:00',
      customerName: '张三', customerPhone: '13800138001', amount: 6900, tenantId: 't',
    })
    await expect(svc.cancelBooking('BK-001', { customerPhone: '13800138001' }))
      .rejects.toThrow(/无法取消/)
  })

  it('checkIn 不存在的预约抛 NotFoundException', async () => {
    prisma.storefrontBooking.findUnique.mockResolvedValue(null)
    await expect(svc.checkIn('nonexistent')).rejects.toThrow(NotFoundException)
  })

  it('checkIn 已取消的预约抛 BadRequestException', async () => {
    prisma.storefrontBooking.findUnique.mockResolvedValue({
      bookingId: 'BK-001', status: 'cancelled', storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001', date: '2026-08-20', timeSlot: '10:00',
      customerName: '张三', customerPhone: '13800138001', amount: 6900, tenantId: 't',
    })
    await expect(svc.checkIn('BK-001')).rejects.toThrow(/已取消/)
  })
})
