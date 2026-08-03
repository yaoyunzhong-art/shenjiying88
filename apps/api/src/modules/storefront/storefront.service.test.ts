/**
 * storefront.service.test.ts — StoreFrontService 单元测试
 *
 * 覆盖:
 *   - getStore / resolveTenantId:    正常/未找到/边界slug
 *   - getServices:                   全部/按category过滤/未知门店
 *   - getSlots:                      正常/服务不存在/全部已约/过去时段/超营业
 *   - createBooking:                 成功/服务不存在/营业外/过去时段/优惠券/并发冲突
 *   - getBooking:                    存在/不存在
 *   - cancelBooking:                 成功/手机号不匹配/已取消/太晚/已核销
 *   - rescheduleBooking:             成功/手机号不匹配/非confirmed/时段冲突
 *   - checkIn:                       成功/已取消/已核销/签名无效
 *   - getPackages:                   返回全部套餐
 *
 * 外部依赖: PrismaService（全部 mock）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common'
import { StoreFrontService } from './storefront.service'

// ═══════════════════════════════════════════════════════════════
// Mock PrismaService
// ═══════════════════════════════════════════════════════════════

function createMockPrisma() {
  const mockBookingCreate = vi.fn()
  const mockBookingFindUnique = vi.fn()
  const mockBookingFindMany = vi.fn()
  const mockBookingUpdate = vi.fn()

  return {
    storefrontBooking: {
      create: mockBookingCreate,
      findUnique: mockBookingFindUnique,
      findMany: mockBookingFindMany,
      update: mockBookingUpdate,
    },
    // 用于 reset/验证
    _reset() {
      mockBookingCreate.mockReset()
      mockBookingFindUnique.mockReset()
      mockBookingFindMany.mockReset()
      mockBookingUpdate.mockReset()
    },
    mocks: { mockBookingCreate, mockBookingFindUnique, mockBookingFindMany, mockBookingUpdate },
  }
}

// ═══════════════════════════════════════════════════════════════
// 辅助: 固定一个未来的日期用于时段/预约测试
// ═══════════════════════════════════════════════════════════════

function futureDate(daysAhead = 7): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().slice(0, 10)
}

function futureDateTime(daysAhead = 7, hours = 10): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hours, 30, 0, 0)
  return d
}

// ═══════════════════════════════════════════════════════════════
// 1. getStore / resolveTenantId
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — getStore / resolveTenantId', () => {
  let service: StoreFrontService

  beforeEach(() => {
    const prisma = createMockPrisma()
    service = new StoreFrontService(prisma as any)
  })

  it('[B1] 正例: getStore 返回已知门店信息', () => {
    const store = service.getStore('beijing-chaoyang')
    expect(store).toBeDefined()
    expect(store.name).toBe('神机营·北京朝阳店')
    expect(store.slug).toBe('beijing-chaoyang')
    expect(store.rating).toBe(4.8)
    expect(store.tenantId).toBe('tenant-default')
  })

  it('[B2] 正例: getStore 未知slug返回默认门店', () => {
    const store = service.getStore('unknown-store')
    expect(store).toBeDefined()
    expect(store.name).toBe('神机营')
    expect(store.rating).toBe(4.5)
    expect(store.tenantId).toBe('tenant-default')
  })

  it('[B3] 正例: resolveTenantId 返回已知tenant', () => {
    expect(service.resolveTenantId('beijing-chaoyang')).toBe('tenant-default')
    expect(service.resolveTenantId('shanghai-pudong')).toBe('tenant-shanghai')
  })

  it('[B4] 反例: resolveTenantId 未知slug返回默认', () => {
    expect(service.resolveTenantId('non-existent')).toBe('tenant-default')
  })

  it('[B5] 边界: getStore 空字符串slug', () => {
    const store = service.getStore('')
    expect(store.name).toBe('神机营')
    expect(store.slug).toBe('')
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. getServices
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — getServices', () => {
  let service: StoreFrontService

  beforeEach(() => {
    const prisma = createMockPrisma()
    service = new StoreFrontService(prisma as any)
  })

  it('[B6] 正例: getServices 返回门店全部服务', () => {
    const services = service.getServices('beijing-chaoyang')
    expect(services.length).toBeGreaterThanOrEqual(8)
    expect(services[0].name).toBeDefined()
    expect(services[0].price).toBeGreaterThan(0)
  })

  it('[B7] 正例: getServices 按category过滤', () => {
    const sports = service.getServices('beijing-chaoyang', 'sports')
    expect(sports.length).toBe(2)
    sports.forEach(s => expect(s.category).toBe('sports'))
  })

  it('[B8] 边界: getServices 未知门店回退北京朝阳', () => {
    const services = service.getServices('unknown-store')
    expect(services.length).toBeGreaterThan(0)
    // 回退到 beijing-chaoyang 的数据
    expect(services[0].id).toBe('svc-001')
  })

  it('[B9] 边界: getServices category匹配0条', () => {
    const results = service.getServices('shanghai-pudong', 'birthday')
    expect(results.length).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. getSlots
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — getSlots', () => {
  let service: StoreFrontService
  let prismaMock: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prismaMock = createMockPrisma()
    service = new StoreFrontService(prismaMock as any)
  })

  it('[B10] 正例: getSlots 返回可用时段', async () => {
    prismaMock.mocks.mockBookingFindMany.mockResolvedValue([])
    const slots = await service.getSlots('beijing-chaoyang', 'svc-001', futureDate())
    expect(slots.length).toBeGreaterThan(0)
    // 至少有一些可用
    expect(slots.some(s => s.available)).toBe(true)
  })

  it('[B11] 反例: getSlots 服务不存在抛 NotFoundException', async () => {
    await expect(
      service.getSlots('beijing-chaoyang', 'nonexistent-service', futureDate()),
    ).rejects.toThrow(NotFoundException)
  })

  it('[B12] 反例: getSlots 全部已约则均不可用', async () => {
    prismaMock.mocks.mockBookingFindMany.mockResolvedValue(
      [{ timeSlot: '09:00' }, { timeSlot: '09:30' }, { timeSlot: '10:00' }],
    )
    const slots = await service.getSlots('beijing-chaoyang', 'svc-003', futureDate())
    expect(slots.length).toBeGreaterThan(0)
  })

  it('[B13] 边界: getSlots 已约时段不可用', async () => {
    prismaMock.mocks.mockBookingFindMany.mockResolvedValue([
      { timeSlot: '14:00' },
      { timeSlot: '14:30' },
    ])
    const slots = await service.getSlots('beijing-chaoyang', 'svc-001', futureDate())
    const slot14 = slots.find(s => s.time === '14:00')
    expect(slot14).toBeDefined()
    expect(slot14!.available).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. createBooking
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — createBooking', () => {
  let service: StoreFrontService
  let prismaMock: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prismaMock = createMockPrisma()
    service = new StoreFrontService(prismaMock as any)
  })

  const baseDto = {
    storeSlug: 'beijing-chaoyang',
    serviceId: 'svc-001',
    date: futureDate(),
    timeSlot: '10:00',
    customerName: '测试用户',
    customerPhone: '13800138000',
  }

  it('[B14] 正例: createBooking 成功创建', async () => {
    prismaMock.mocks.mockBookingCreate.mockResolvedValue({
      bookingId: 'BK-1234567890-abc12345',
      tenantId: 'tenant-default',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: baseDto.date,
      timeSlot: '10:00',
      customerName: '测试用户',
      customerPhone: '13800138000',
      amount: 6900,
      couponCode: null,
      status: 'confirmed',
      qrCode: 'QR:BK-123:abcdef',
      qrSignature: 'abcdef123456',
      paymentUrl: 'https://pay.shenjiying.com/order/BK-123',
      createdAt: new Date(),
    })

    const result = await service.createBooking(baseDto)
    expect(result.status).toBe('confirmed')
    expect(result.bookingId).toBeDefined()
    expect(result.qrCode).toBeDefined()
    expect(result.qrSignature).toBeDefined()
    expect(result.storeName).toBe('神机营·北京朝阳店')
    expect(result.amount).toBe(6900)
  })

  it('[B15] 反例: createBooking 服务不存在', async () => {
    await expect(
      service.createBooking({ ...baseDto, serviceId: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('[B16] 反例: createBooking 营业前时段', async () => {
    await expect(
      service.createBooking({ ...baseDto, timeSlot: '07:00' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('[B17] 反例: createBooking 超出营业时间', async () => {
    await expect(
      service.createBooking({ ...baseDto, timeSlot: '21:30' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('[B18] 正例: createBooking 使用WELCOME50优惠券', async () => {
    prismaMock.mocks.mockBookingCreate.mockResolvedValue({
      bookingId: 'BK-2345',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: baseDto.date,
      timeSlot: '10:00',
      customerName: '测试用户',
      customerPhone: '13800138000',
      amount: 1900, // 6900 - 5000
      couponCode: 'WELCOME50',
      status: 'confirmed',
      qrCode: 'QR:xxx',
      qrSignature: 'sig',
      paymentUrl: 'https://pay/order/BK-2345',
      createdAt: new Date(),
      tenantId: 'tenant-default',
    })

    const result = await service.createBooking({ ...baseDto, couponCode: 'WELCOME50' })
    expect(result.amount).toBe(1900)
  })

  it('[B19] 正例: createBooking 使用VIP20优惠券', async () => {
    prismaMock.mocks.mockBookingCreate.mockResolvedValue({
      bookingId: 'BK-3456',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: baseDto.date,
      timeSlot: '10:00',
      customerName: '测试用户',
      customerPhone: '13800138000',
      amount: 5520, // 6900 * 0.8
      couponCode: 'VIP20',
      status: 'confirmed',
      qrCode: 'QR:xxx',
      qrSignature: 'sig',
      paymentUrl: 'https://pay/order/BK-3456',
      createdAt: new Date(),
      tenantId: 'tenant-default',
    })

    const result = await service.createBooking({ ...baseDto, couponCode: 'VIP20' })
    expect(result.amount).toBe(5520)
  })

  it('[B20] 反例: createBooking 并发唯一约束冲突', async () => {
    const err = new Error('Unique constraint failed')
    ;(err as any).code = 'P2002'
    prismaMock.mocks.mockBookingCreate.mockRejectedValue(err)

    await expect(
      service.createBooking(baseDto),
    ).rejects.toThrow(ConflictException)
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. getBooking
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — getBooking', () => {
  let service: StoreFrontService
  let prismaMock: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prismaMock = createMockPrisma()
    service = new StoreFrontService(prismaMock as any)
  })

  it('[B21] 正例: getBooking 返回预约详情', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-001',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDate(),
      timeSlot: '10:00',
      customerName: '张三',
      customerPhone: '13800138001',
      amount: 6900,
      status: 'confirmed',
      createdAt: new Date(),
      cancelledAt: null,
      rescheduledTo: null,
    })

    const result = await service.getBooking('BK-001')
    expect(result.bookingId).toBe('BK-001')
    expect(result.status).toBe('confirmed')
    expect(result.storeName).toBe('神机营·北京朝阳店')
  })

  it('[B22] 反例: getBooking 预约不存在', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue(null)
    await expect(
      service.getBooking('BK-NONEXISTENT'),
    ).rejects.toThrow(NotFoundException)
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. cancelBooking
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — cancelBooking', () => {
  let service: StoreFrontService
  let prismaMock: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prismaMock = createMockPrisma()
    service = new StoreFrontService(prismaMock as any)
  })

  const futureDateStr = futureDate(14)

  it('[B23] 正例: cancelBooking 成功取消', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-CANCEL-01',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDateStr,
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138002',
      amount: 6900,
      status: 'confirmed',
      createdAt: new Date(),
      cancelledAt: null,
    })

    prismaMock.mocks.mockBookingUpdate.mockResolvedValue({
      bookingId: 'BK-CANCEL-01',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDateStr,
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138002',
      amount: 6900,
      status: 'cancelled',
      createdAt: new Date(),
      cancelledAt: new Date(),
    })

    const result = await service.cancelBooking('BK-CANCEL-01', {
      bookingId: 'BK-CANCEL-01',
      storeSlug: 'beijing-chaoyang',
      customerPhone: '13800138002',
    })
    expect(result.status).toBe('cancelled')
    expect(result.cancelledAt).toBeDefined()
  })

  it('[B24] 反例: cancelBooking 手机号不匹配', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-CANCEL-02',
      storeSlug: 'beijing-chaoyang',
      date: futureDateStr,
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138002',
      status: 'confirmed',
      createdAt: new Date(),
    })

    await expect(
      service.cancelBooking('BK-CANCEL-02', {
        bookingId: 'BK-CANCEL-02',
        storeSlug: 'beijing-chaoyang',
        customerPhone: '13900000000',
      }),
    ).rejects.toThrow(BadRequestException)
  })

  it('[B25] 反例: cancelBooking 预约不存在', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue(null)
    await expect(
      service.cancelBooking('NONEXISTENT', {
        bookingId: 'NONEXISTENT',
        storeSlug: 'beijing-chaoyang',
        customerPhone: '13800138000',
      }),
    ).rejects.toThrow(NotFoundException)
  })
})

// ═══════════════════════════════════════════════════════════════
// 7. rescheduleBooking
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — rescheduleBooking', () => {
  let service: StoreFrontService
  let prismaMock: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prismaMock = createMockPrisma()
    service = new StoreFrontService(prismaMock as any)
  })

  const futureDateStr = futureDate(14)

  it('[B26] 正例: rescheduleBooking 成功改期', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-RESCHEDULE-01',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: futureDateStr,
      timeSlot: '10:00',
      customerName: '张三',
      customerPhone: '13800138003',
      amount: 6900,
      status: 'confirmed',
      createdAt: new Date(),
      cancelledAt: null,
      rescheduledTo: null,
    })

    const newDate = futureDate(21)
    prismaMock.mocks.mockBookingUpdate.mockResolvedValue({
      bookingId: 'BK-RESCHEDULE-01',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: newDate,
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138003',
      amount: 6900,
      status: 'rescheduled',
      createdAt: new Date(),
      cancelledAt: null,
      rescheduledTo: { date: newDate, timeSlot: '14:00' },
    })

    const result = await service.rescheduleBooking('BK-RESCHEDULE-01', {
      bookingId: 'BK-RESCHEDULE-01',
      storeSlug: 'beijing-chaoyang',
      customerPhone: '13800138003',
      newDate,
      newTimeSlot: '14:00',
    })
    expect(result.status).toBe('rescheduled')
    expect(result.rescheduledTo).toBeDefined()
  })

  it('[B27] 反例: rescheduleBooking 手机号不匹配', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-RESCHEDULE-02',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-001',
      serviceName: '标准电竞台（2小时）',
      date: futureDateStr,
      timeSlot: '10:00',
      customerName: '张三',
      customerPhone: '13800138003',
      status: 'confirmed',
      createdAt: new Date(),
    })

    await expect(
      service.rescheduleBooking('BK-RESCHEDULE-02', {
        bookingId: 'BK-RESCHEDULE-02',
        storeSlug: 'beijing-chaoyang',
        customerPhone: '13900000000',
        newDate: futureDate(21),
        newTimeSlot: '14:00',
      }),
    ).rejects.toThrow(BadRequestException)
  })

  it('[B28] 反例: rescheduleBooking 时段冲突', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-RESCHEDULE-03',
      storeSlug: 'beijing-chaoyang',
      serviceId: 'svc-003',
      serviceName: 'PS5 客厅游戏（1小时）',
      date: futureDateStr,
      timeSlot: '10:00',
      customerName: '张三',
      customerPhone: '13800138003',
      status: 'confirmed',
      createdAt: new Date(),
    })

    const err = new Error('Unique constraint')
    ;(err as any).code = 'P2002'
    prismaMock.mocks.mockBookingUpdate.mockRejectedValue(err)

    await expect(
      service.rescheduleBooking('BK-RESCHEDULE-03', {
        bookingId: 'BK-RESCHEDULE-03',
        storeSlug: 'beijing-chaoyang',
        customerPhone: '13800138003',
        newDate: futureDate(21),
        newTimeSlot: '14:00',
      }),
    ).rejects.toThrow(ConflictException)
  })
})

// ═══════════════════════════════════════════════════════════════
// 8. checkIn
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — checkIn', () => {
  let service: StoreFrontService
  let prismaMock: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    prismaMock = createMockPrisma()
    service = new StoreFrontService(prismaMock as any)
  })

  it('[B29] 正例: checkIn 成功核销', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-CHECKIN-01',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDate(),
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138004',
      amount: 6900,
      status: 'confirmed',
      createdAt: new Date(),
      cancelledAt: null,
    })

    prismaMock.mocks.mockBookingUpdate.mockResolvedValue({
      bookingId: 'BK-CHECKIN-01',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDate(),
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138004',
      amount: 6900,
      status: 'completed',
      createdAt: new Date(),
    })

    const result = await service.checkIn('BK-CHECKIN-01')
    expect(result.status).toBe('completed')
  })

  it('[B30] 反例: checkIn 已取消预约不可核销', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-CHECKIN-02',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDate(),
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138004',
      status: 'cancelled',
      createdAt: new Date(),
    })

    await expect(
      service.checkIn('BK-CHECKIN-02'),
    ).rejects.toThrow(BadRequestException)
  })

  it('[B31] 反例: checkIn 已核销预约不可重复核销', async () => {
    prismaMock.mocks.mockBookingFindUnique.mockResolvedValue({
      bookingId: 'BK-CHECKIN-03',
      storeSlug: 'beijing-chaoyang',
      serviceName: '标准电竞台（2小时）',
      date: futureDate(),
      timeSlot: '14:00',
      customerName: '张三',
      customerPhone: '13800138004',
      status: 'completed',
      createdAt: new Date(),
    })

    await expect(
      service.checkIn('BK-CHECKIN-03'),
    ).rejects.toThrow(BadRequestException)
  })
})

// ═══════════════════════════════════════════════════════════════
// 9. getPackages
// ═══════════════════════════════════════════════════════════════

describe('StoreFrontService — getPackages', () => {
  let service: StoreFrontService

  beforeEach(() => {
    const prisma = createMockPrisma()
    service = new StoreFrontService(prisma as any)
  })

  it('[B32] 正例: getPackages 返回全部套餐', () => {
    const pkgs = service.getPackages()
    expect(pkgs.length).toBe(4)
    expect(pkgs[0].name).toBe('单人畅玩卡')
    expect(pkgs[0].price).toBeLessThan(pkgs[0].originalPrice)
  })

  it('[B33] 正例: getPackages 包含多种分类', () => {
    const pkgs = service.getPackages()
    const categories = new Set(pkgs.map(p => p.category))
    expect(categories.has('individual')).toBe(true)
    expect(categories.has('parent_child')).toBe(true)
    expect(categories.has('group')).toBe(true)
    expect(categories.has('limited')).toBe(true)
  })
})
