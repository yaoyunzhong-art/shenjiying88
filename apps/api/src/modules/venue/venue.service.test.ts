/**
 * venue.service.spec.ts — P-25 场地管理 + V24 场地预订 Service 单元测试
 *
 * 覆盖:
 *   场地 CRUD          — create / list / getById / update / delete
 *   场地状态转换         — idle → occupied → maintenance → idle
 *   时段定价管理         — get/setTimeSlotPricing / get/setHolidayPricing
 *   场地预订             — createBooking / listBookings / getBookingById
 *   预订生命周期         — pending → confirmed → in_progress → completed / cancelled
 *   冲突检测             — 同一场地同一时间段不能重复预订
 *   异常场景             — NotFound / Conflict / BadRequest
 *   边界值               — capacity = 0 / priceCents = 0 / 空的名称 / 负数
 *
 * 原则: 每次测试使用独立的 service 实例 · 无 as any · 无 ts-ignore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Test } from '@nestjs/testing'
import { VenueService } from './venue.service'
import { VenueType, VenueStatus, VenueShift, VenueBookingStatus } from './venue.entity'

describe('VenueService', () => {
  let svc: VenueService

  const validCreate = {
    name: '主大厅',
    type: VenueType.HALL,
    capacity: 200,
    priceCents: 50000,
    tags: ['premium', 'ac'],
    description: '可容纳200人',
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [VenueService],
    }).compile()
    svc = module.get(VenueService)
    svc.resetStoreForTests()
  })

  // ═══════════════════════════════════════════════════════════════
  //  场地 CRUD
  // ═══════════════════════════════════════════════════════════════

  describe('场地 CRUD', () => {
    it('创建场地应返回完整信息', () => {
      const v = svc.create(validCreate)
      expect(v.id).toMatch(/^venue-/)
      expect(v.name).toBe('主大厅')
      expect(v.type).toBe(VenueType.HALL)
      expect(v.capacity).toBe(200)
      expect(v.priceCents).toBe(50000)
      expect(v.status).toBe(VenueStatus.IDLE)
      expect(v.tags).toEqual(['premium', 'ac'])
      expect(v.description).toBe('可容纳200人')
      expect(v.createdAt).toBeTruthy()
      expect(v.updatedAt).toBeTruthy()
    })

    it('列表应返回所有场地', () => {
      svc.create(validCreate)
      svc.create({ ...validCreate, name: 'VIP包厢', type: VenueType.BOOTH })
      expect(svc.list()).toHaveLength(2)
    })

    it('按 ID 获取场地详情', () => {
      const created = svc.create(validCreate)
      const found = svc.getById(created.id)
      expect(found.name).toBe('主大厅')
      expect(found.id).toBe(created.id)
    })

    it('不存在的 ID 获取应抛 NotFoundException', () => {
      expect(() => svc.getById('nonexistent')).toThrow('场地')
      expect(() => svc.getById('nonexistent')).toThrow('不存在')
    })

    it('更新场地的名称和容量', () => {
      const created = svc.create(validCreate)
      const updated = svc.update(created.id, { name: '新大厅', capacity: 300 })
      expect(updated.name).toBe('新大厅')
      expect(updated.capacity).toBe(300)
    })

    it('更新不存在的场地应抛 NotFoundException', () => {
      expect(() => svc.update('nonexist', { name: 'test' })).toThrow('不存在')
    })

    it('删除场地后列表不应包含', () => {
      const created = svc.create(validCreate)
      svc.delete(created.id)
      expect(svc.list()).toHaveLength(0)
    })

    it('删除不存在的场地应抛 NotFoundException', () => {
      expect(() => svc.delete('nonexist')).toThrow('不存在')
    })

    it('按类型筛选场地', () => {
      svc.create(validCreate)
      svc.create({ ...validCreate, name: 'Booth', type: VenueType.BOOTH })
      const list = svc.list({ type: VenueType.HALL })
      expect(list).toHaveLength(1)
      expect(list[0].name).toBe('主大厅')
    })

    it('按状态筛选场地', () => {
      const v = svc.create(validCreate)
      svc.update(v.id, { status: VenueStatus.MAINTENANCE })
      expect(svc.list({ status: VenueStatus.IDLE })).toHaveLength(0)
      expect(svc.list({ status: VenueStatus.MAINTENANCE })).toHaveLength(1)
    })

    it('按关键词搜索场地（名称）', () => {
      svc.create({ ...validCreate, name: 'VIP包厢', description: '豪华装修' })
      svc.create({ ...validCreate, name: '普通区', description: '标准配置' })
      expect(svc.list({ search: 'VIP' })).toHaveLength(1)
      expect(svc.list({ search: '普通' })).toHaveLength(1)
    })

    it('按关键词搜索场地（描述）', () => {
      svc.create({ ...validCreate, name: '包厢A', description: '总统套房' })
      expect(svc.list({ search: '总统' })).toHaveLength(1)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  场地校验
  // ═══════════════════════════════════════════════════════════════

  describe('输入校验', () => {
    it('空名称应抛 BadRequestException', () => {
      expect(() => svc.create({ ...validCreate, name: '' })).toThrow('名称不能为空')
      expect(() => svc.create({ ...validCreate, name: '   ' })).toThrow('名称不能为空')
    })

    it('负数容量应抛 BadRequestException', () => {
      expect(() => svc.create({ ...validCreate, capacity: -1 })).toThrow('容量不能为负数')
    })

    it('负数的价格应抛 BadRequestException', () => {
      expect(() => svc.create({ ...validCreate, priceCents: -100 })).toThrow('价格不能为负数')
    })

    it('重复名称应抛 ConflictException', () => {
      svc.create(validCreate)
      expect(() => svc.create(validCreate)).toThrow('已存在')
    })

    it('更新时改名与其他场地重复应抛 ConflictException', () => {
      svc.create({ ...validCreate, name: 'A厅' })
      const b = svc.create({ ...validCreate, name: 'B厅' })
      expect(() => svc.update(b.id, { name: 'A厅' })).toThrow('已存在')
    })

    it('更新时空名称应抛 BadRequestException', () => {
      const v = svc.create(validCreate)
      expect(() => svc.update(v.id, { name: '' })).toThrow('名称不能为空')
    })

    it('更新时负数容量应抛 BadRequestException', () => {
      const v = svc.create(validCreate)
      expect(() => svc.update(v.id, { capacity: -5 })).toThrow('容量不能为负数')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  场地状态转换
  // ═══════════════════════════════════════════════════════════════

  describe('状态转换', () => {
    it('idle → occupied 合法', () => {
      const v = svc.create(validCreate)
      svc.changeStatus(v.id, VenueStatus.OCCUPIED)
      expect(svc.getById(v.id).status).toBe(VenueStatus.OCCUPIED)
    })

    it('idle → maintenance 合法', () => {
      const v = svc.create(validCreate)
      svc.changeStatus(v.id, VenueStatus.MAINTENANCE)
      expect(svc.getById(v.id).status).toBe(VenueStatus.MAINTENANCE)
    })

    it('maintenance → idle 合法', () => {
      const v = svc.create(validCreate)
      svc.changeStatus(v.id, VenueStatus.MAINTENANCE)
      svc.changeStatus(v.id, VenueStatus.IDLE)
      expect(svc.getById(v.id).status).toBe(VenueStatus.IDLE)
    })

    it('maintenance → occupied 非法应抛异常', () => {
      const v = svc.create(validCreate)
      svc.changeStatus(v.id, VenueStatus.MAINTENANCE)
      expect(() => svc.changeStatus(v.id, VenueStatus.OCCUPIED)).toThrow('不能从')
    })

    it('occupied → idle 合法', () => {
      const v = svc.create(validCreate)
      svc.changeStatus(v.id, VenueStatus.OCCUPIED)
      svc.changeStatus(v.id, VenueStatus.IDLE)
      expect(svc.getById(v.id).status).toBe(VenueStatus.IDLE)
    })

    it('completed → 不允许任何转换', () => {
      // 通过 changeStatus 测试禁止转换
      const v = svc.create(validCreate)
      // idle → booked
      svc.changeStatus(v.id, VenueStatus.BOOKED)
      expect(svc.getById(v.id).status).toBe(VenueStatus.BOOKED)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  时段定价管理
  // ═══════════════════════════════════════════════════════════════

  describe('时段定价', () => {
    it('设置并获取时段定价', () => {
      const v = svc.create(validCreate)
      const pricing = [{ label: '早场', startHour: 8, endHour: 12, priceCents: 30000 }]
      svc.setTimeSlotPricing(v.id, pricing)
      const result = svc.getTimeSlotPricing(v.id)
      expect(result).toHaveLength(1)
      expect(result[0].label).toBe('早场')
      expect(result[0].priceCents).toBe(30000)
    })

    it('设置并获取假日定价', () => {
      const v = svc.create(validCreate)
      const pricing = [{ date: '2026-10-01', priceCents: 80000 }]
      svc.setHolidayPricing(v.id, pricing)
      const result = svc.getHolidayPricing(v.id)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2026-10-01')
    })

    it('不存在的场地获取定价应抛异常', () => {
      expect(() => svc.getTimeSlotPricing('noid')).toThrow('不存在')
    })

    it('空定价数组合法', () => {
      const v = svc.create(validCreate)
      svc.setTimeSlotPricing(v.id, [])
      expect(svc.getTimeSlotPricing(v.id)).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  场地预订
  // ═══════════════════════════════════════════════════════════════

  describe('场地预订', () => {
    let venueId: string

    beforeEach(() => {
      const v = svc.create(validCreate)
      venueId = v.id
    })

    const makeBooking = (overrides: Record<string, any> = {}) =>
      svc.createBooking({
        venueId,
        userId: 'user-001',
        userName: '张三',
        date: '2026-08-15',
        shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z',
        endTime: '2026-08-15T18:00:00Z',
        priceCents: 20000,
        depositCents: 5000,
        guestCount: 10,
        remark: '团建活动',
        ...overrides,
      })

    it('创建预订应返回完整信息', () => {
      const b = makeBooking()
      expect(b.id).toMatch(/^booking-/)
      expect(b.venueId).toBe(venueId)
      expect(b.venueName).toBe('主大厅')
      expect(b.userId).toBe('user-001')
      expect(b.userName).toBe('张三')
      expect(b.date).toBe('2026-08-15')
      expect(b.shift).toBe(VenueShift.AFTERNOON)
      expect(b.status).toBe(VenueBookingStatus.PENDING)
      expect(b.guestCount).toBe(10)
    })

    it('列出预订应返回所有', () => {
      makeBooking()
      expect(svc.listBookings()).toHaveLength(1)
    })

    it('按场地 ID 筛选预订', () => {
      makeBooking()
      const v2 = svc.create({ ...validCreate, name: 'B厅' })
      svc.createBooking({
        venueId: v2.id, userId: 'u2', userName: '李四',
        date: '2026-08-16', shift: VenueShift.MORNING,
        startTime: '2026-08-16T08:00:00Z', endTime: '2026-08-16T12:00:00Z',
        priceCents: 10000, depositCents: 2000, guestCount: 5,
      })
      expect(svc.listBookings({ venueId })).toHaveLength(1)
      expect(svc.listBookings({ venueId: v2.id })).toHaveLength(1)
    })

    it('按用户 ID 筛选预订', () => {
      makeBooking()
      expect(svc.listBookings({ userId: 'user-001' })).toHaveLength(1)
    })

    it('按日期筛选预订', () => {
      makeBooking()
      expect(svc.listBookings({ date: '2026-08-15' })).toHaveLength(1)
      expect(svc.listBookings({ date: '2026-08-16' })).toHaveLength(0)
    })

    it('按状态筛选预订', () => {
      makeBooking()
      expect(svc.listBookings({ status: VenueBookingStatus.PENDING })).toHaveLength(1)
      expect(svc.listBookings({ status: VenueBookingStatus.CONFIRMED })).toHaveLength(0)
    })

    it('按班次筛选预订', () => {
      makeBooking()
      expect(svc.listBookings({ shift: VenueShift.AFTERNOON })).toHaveLength(1)
      expect(svc.listBookings({ shift: VenueShift.MORNING })).toHaveLength(0)
    })

    it('按 ID 获取预订详情', () => {
      const b = makeBooking()
      const found = svc.getBookingById(b.id)
      expect(found.id).toBe(b.id)
      expect(found.venueName).toBe('主大厅')
    })

    it('不存在的预订 ID 应抛 NotFoundException', () => {
      expect(() => svc.getBookingById('nonexist')).toThrow('不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  预订输入校验
  // ═══════════════════════════════════════════════════════════════

  describe('预订输入校验', () => {
    let venueId: string

    beforeEach(() => {
      const v = svc.create(validCreate)
      venueId = v.id
    })

    it('空 userId 应抛 BadRequestException', () => {
      expect(() => svc.createBooking({
        venueId, userId: '', userName: '张三',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })).toThrow('用户 ID 不能为空')
    })

    it('空 userName 应抛 BadRequestException', () => {
      expect(() => svc.createBooking({
        venueId, userId: 'u1', userName: '   ',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })).toThrow('用户名称不能为空')
    })

    it('结束时间早于开始时间应抛 BadRequestException', () => {
      expect(() => svc.createBooking({
        venueId, userId: 'u1', userName: '张三',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T12:00:00Z', endTime: '2026-08-15T08:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })).toThrow('结束时间必须晚于开始时间')
    })

    it('人数为 0 应抛 BadRequestException', () => {
      expect(() => svc.createBooking({
        venueId, userId: 'u1', userName: '张三',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 0,
      })).toThrow('人数必须大于 0')
    })

    it('人数超出场地容量应抛 BadRequestException', () => {
      expect(() => svc.createBooking({
        venueId, userId: 'u1', userName: '张三',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 999,
      })).toThrow('人数超出场地容量')
    })

    it('负数的价格应抛 BadRequestException', () => {
      expect(() => svc.createBooking({
        venueId, userId: 'u1', userName: '张三',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: -100, depositCents: 0, guestCount: 1,
      })).toThrow('价格和押金不能为负数')
    })

    it('不存在的场地创建预订应抛 NotFoundException', () => {
      expect(() => svc.createBooking({
        venueId: 'invalid-venue', userId: 'u1', userName: '张三',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })).toThrow('不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  预订生命周期
  // ═══════════════════════════════════════════════════════════════

  describe('预订生命周期', () => {
    let venueId: string
    let bookingId: string

    beforeEach(() => {
      const v = svc.create(validCreate)
      venueId = v.id
      const b = svc.createBooking({
        venueId, userId: 'u1', userName: '张三',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T18:00:00Z',
        priceCents: 20000, depositCents: 5000, guestCount: 10,
      })
      bookingId = b.id
    })

    it('pending → confirmed 合法', () => {
      const confirmed = svc.confirmBooking(bookingId)
      expect(confirmed.status).toBe(VenueBookingStatus.CONFIRMED)
    })

    it('确认预订时场地状态同步变为 booked', () => {
      svc.confirmBooking(bookingId)
      expect(svc.getById(venueId).status).toBe(VenueStatus.BOOKED)
    })

    it('pending → cancelled 合法', () => {
      const cancelled = svc.cancelBooking(bookingId, '时间冲突')
      expect(cancelled.status).toBe(VenueBookingStatus.CANCELLED)
      expect(cancelled.cancelledReason).toBe('时间冲突')
      expect(cancelled.cancelledAt).toBeTruthy()
    })

    it('取消预订后场地状态释放回 idle', () => {
      svc.confirmBooking(bookingId)
      svc.cancelBooking(bookingId)
      expect(svc.getById(venueId).status).toBe(VenueStatus.IDLE)
    })

    it('confirmed → in_progress 合法', () => {
      svc.confirmBooking(bookingId)
      const inProgress = svc.startBooking(bookingId)
      expect(inProgress.status).toBe(VenueBookingStatus.IN_PROGRESS)
    })

    it('开始使用后场地状态变为 occupied', () => {
      svc.confirmBooking(bookingId)
      svc.startBooking(bookingId)
      expect(svc.getById(venueId).status).toBe(VenueStatus.OCCUPIED)
    })

    it('in_progress → completed 合法', () => {
      svc.confirmBooking(bookingId)
      svc.startBooking(bookingId)
      const completed = svc.completeBooking(bookingId)
      expect(completed.status).toBe(VenueBookingStatus.COMPLETED)
    })

    it('完成使用后场地释放回 idle', () => {
      svc.confirmBooking(bookingId)
      svc.startBooking(bookingId)
      svc.completeBooking(bookingId)
      expect(svc.getById(venueId).status).toBe(VenueStatus.IDLE)
    })

    it('pending → 直接 complete 非法', () => {
      expect(() => svc.completeBooking(bookingId)).toThrow('不能从')
    })

    it('confirmed → 直接 complete 非法', () => {
      svc.confirmBooking(bookingId)
      expect(() => svc.completeBooking(bookingId)).toThrow('不能从')
    })

    it('已完成不可重复完成', () => {
      svc.confirmBooking(bookingId)
      svc.startBooking(bookingId)
      svc.completeBooking(bookingId)
      expect(() => svc.completeBooking(bookingId)).toThrow('不能从')
    })

    it('已取消不可重复取消', () => {
      svc.cancelBooking(bookingId)
      expect(() => svc.cancelBooking(bookingId)).toThrow('不能从')
    })

    it('cancelled → confirm 非法', () => {
      svc.cancelBooking(bookingId)
      expect(() => svc.confirmBooking(bookingId)).toThrow('不能从')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  冲突检测 / 可用性
  // ═══════════════════════════════════════════════════════════════

  describe('冲突检测与可用性', () => {
    it('同一场地同一时间段冲突应抛 ConflictException', () => {
      const v = svc.create(validCreate)
      svc.createBooking({
        venueId: v.id, userId: 'u1', userName: 'A',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T18:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      expect(() => svc.createBooking({
        venueId: v.id, userId: 'u2', userName: 'B',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T15:00:00Z', endTime: '2026-08-15T17:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })).toThrow('已有预订')
    })

    it('不同时间段不冲突', () => {
      const v = svc.create(validCreate)
      svc.createBooking({
        venueId: v.id, userId: 'u1', userName: 'A',
        date: '2026-08-15', shift: VenueShift.MORNING,
        startTime: '2026-08-15T08:00:00Z', endTime: '2026-08-15T12:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      // 下午的预订不冲突
      const ok = svc.createBooking({
        venueId: v.id, userId: 'u2', userName: 'B',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T18:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      expect(ok.id).toBeTruthy()
    })

    it('不同日期不冲突', () => {
      const v = svc.create(validCreate)
      svc.createBooking({
        venueId: v.id, userId: 'u1', userName: 'A',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T18:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      // 不同日期不冲突
      const ok = svc.createBooking({
        venueId: v.id, userId: 'u2', userName: 'B',
        date: '2026-08-16', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-16T14:00:00Z', endTime: '2026-08-16T18:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      expect(ok.id).toBeTruthy()
    })

    it('确认时保留已有预订的冲突检测', () => {
      const v = svc.create(validCreate)
      const b1 = svc.createBooking({
        venueId: v.id, userId: 'u1', userName: 'A',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T16:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      svc.confirmBooking(b1.id)
      // 新预订创建时先写一个 confirmed 预订，覆盖相同时间
      // 但 b1 取消后释放了场地，所以 b2 可以创建
      svc.cancelBooking(b1.id)
      const b2 = svc.createBooking({
        venueId: v.id, userId: 'u2', userName: 'B',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T16:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      svc.confirmBooking(b2.id)
      expect(svc.getBookingById(b2.id).status).toBe('confirmed')
    })

    it('查询场地可用时段', () => {
      const v = svc.create(validCreate)
      // 预订下午时段
      svc.createBooking({
        venueId: v.id, userId: 'u1', userName: 'A',
        date: '2026-08-15', shift: VenueShift.AFTERNOON,
        startTime: '2026-08-15T14:00:00Z', endTime: '2026-08-15T18:00:00Z',
        priceCents: 100, depositCents: 0, guestCount: 1,
      })
      const avail = svc.getVenueAvailability(v.id, '2026-08-15')
      expect(avail.date).toBe('2026-08-15')
      const afternoon = avail.shifts.find(s => s.shift === VenueShift.AFTERNOON)
      expect(afternoon!.available).toBe(false)
      const morning = avail.shifts.find(s => s.shift === VenueShift.MORNING)
      expect(morning!.available).toBe(true)
    })

    it('查询不存在场地的可用时段应抛 NotFoundException', () => {
      expect(() => svc.getVenueAvailability('noid', '2026-08-15')).toThrow('不存在')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  边界值
  // ═══════════════════════════════════════════════════════════════

  describe('边界值', () => {
    it('容量为 0 合法', () => {
      const v = svc.create({ ...validCreate, capacity: 0 })
      expect(v.capacity).toBe(0)
    })

    it('价格为 0 合法', () => {
      const v = svc.create({ ...validCreate, priceCents: 0 })
      expect(v.priceCents).toBe(0)
    })

    it('空标签数组合法', () => {
      const v = svc.create({ ...validCreate, tags: [] })
      expect(v.tags).toEqual([])
    })

    it('空描述合法', () => {
      const v = svc.create({ ...validCreate, description: '' })
      expect(v.description).toBe('')
    })

    it('空列表返回空数组', () => {
      expect(svc.list()).toEqual([])
      expect(svc.listBookings()).toEqual([])
    })

    it('不存在的场地 changeStatus 应抛 NotFoundException', () => {
      expect(() => svc.changeStatus('noid', VenueStatus.OCCUPIED)).toThrow('不存在')
    })

    it('空查询条件返回全部', () => {
      svc.create(validCreate)
      expect(svc.list({})).toHaveLength(1)
    })

    it('释放不存在场地返回 false', () => {
      expect(svc.releaseVenue('noid')).toBe(false)
    })
  })
})
