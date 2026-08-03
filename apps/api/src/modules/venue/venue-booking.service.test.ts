/**
 * venue-booking.service.test.ts — V24 场地预订服务完整单元测试
 *
 * 覆盖：createBooking / listBookings / listBookings / getBookingById
 *       confirmBooking / startBooking / completeBooking / cancelBooking
 *       getVenueAvailability / releaseVenue / 冲突检测 / 状态转换验证
 *
 * 测试风格：使用真实 VenueService 实例，先创建场地再预订
 */
import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { VenueService } from './venue.service'
import {
  VenueBookingStatus,
  VenueShift,
  VenueStatus,
  VenueType,
  type Venue,
  type VenueBooking,
} from './venue.entity'

describe('VenueBookingService', () => {
  let svc: VenueService
  let venue: Venue

  const createVenueInput = () => ({
    name: 'Booking Test Hall',
    type: VenueType.HALL,
    capacity: 200,
    priceCents: 50000,
    tags: ['test'],
    description: 'For booking tests',
  })

  const createBookingInput = (overrides?: Partial<{
    venueId: string
    userId: string
    userName: string
    date: string
    shift: VenueShift
    startTime: string
    endTime: string
    priceCents: number
    depositCents: number
    guestCount: number
    remark: string
  }>) => ({
    venueId: venue.id,
    userId: 'user-001',
    userName: 'TestUser',
    date: '2026-07-25',
    shift: VenueShift.MORNING,
    startTime: '2026-07-25T08:00:00.000Z',
    endTime: '2026-07-25T12:00:00.000Z',
    priceCents: 20000,
    depositCents: 5000,
    guestCount: 50,
    remark: 'Unit test booking',
    ...overrides,
  })

  beforeEach(() => {
    svc = new VenueService()
    venue = svc.create(createVenueInput())
  })

  // ── 正例 ─────────────────────────────────────────────────────────

  it('创建预订 —— 返回 pending 状态的完整 Booking', () => {
    const booking = svc.createBooking(createBookingInput())
    assert.ok(booking.id.startsWith('booking-'))
    assert.equal(booking.venueId, venue.id)
    assert.equal(booking.venueName, venue.name)
    assert.equal(booking.userName, 'TestUser')
    assert.equal(booking.status, VenueBookingStatus.PENDING)
    assert.equal(booking.guestCount, 50)
    assert.equal(booking.shift, VenueShift.MORNING)
  })

  it('查询预订列表 —— 返回所有预订', () => {
    svc.createBooking(createBookingInput())
    svc.createBooking(createBookingInput({ shift: VenueShift.AFTERNOON, startTime: '2026-07-25T12:00:00.000Z', endTime: '2026-07-25T18:00:00.000Z' }))
    assert.equal(svc.listBookings().length, 2)
  })

  it('查询预订 —— 按 venueId/userId/date/status/shift 筛选', () => {
    svc.createBooking(createBookingInput())
    assert.equal(svc.listBookings({ venueId: venue.id }).length, 1)
    assert.equal(svc.listBookings({ userId: 'user-001' }).length, 1)
    assert.equal(svc.listBookings({ date: '2026-07-25' }).length, 1)
    assert.equal(svc.listBookings({ status: VenueBookingStatus.PENDING }).length, 1)
    assert.equal(svc.listBookings({ shift: VenueShift.MORNING }).length, 1)
    assert.equal(svc.listBookings({ shift: VenueShift.EVENING }).length, 0)
  })

  it('获取预订详情 —— 按 ID 返回', () => {
    const booking = svc.createBooking(createBookingInput())
    const found = svc.getBookingById(booking.id)
    assert.equal(found.id, booking.id)
    assert.equal(found.userName, 'TestUser')
  })

  it('确认预订 —— pending → confirmed，场地自动设为 BOOKED', () => {
    const booking = svc.createBooking(createBookingInput())
    const confirmed = svc.confirmBooking(booking.id)
    assert.equal(confirmed.status, VenueBookingStatus.CONFIRMED)

    const updatedVenue = svc.getById(venue.id)
    assert.equal(updatedVenue.status, VenueStatus.BOOKED)
  })

  it('开始使用 —— confirmed → in_progress，场地自动设为 OCCUPIED', () => {
    const booking = svc.createBooking(createBookingInput())
    svc.confirmBooking(booking.id)
    const started = svc.startBooking(booking.id)
    assert.equal(started.status, VenueBookingStatus.IN_PROGRESS)

    const updatedVenue = svc.getById(venue.id)
    assert.equal(updatedVenue.status, VenueStatus.OCCUPIED)
  })

  it('完成使用 —— in_progress → completed，场地自动释放为 IDLE', () => {
    const booking = svc.createBooking(createBookingInput())
    svc.confirmBooking(booking.id)
    svc.startBooking(booking.id)
    const completed = svc.completeBooking(booking.id)
    assert.equal(completed.status, VenueBookingStatus.COMPLETED)

    const updatedVenue = svc.getById(venue.id)
    assert.equal(updatedVenue.status, VenueStatus.IDLE)
  })

  it('取消预订 —— 任意状态 → cancelled，场地释放', () => {
    const booking = svc.createBooking(createBookingInput())
    const cancelled = svc.cancelBooking(booking.id, '测试取消')
    assert.equal(cancelled.status, VenueBookingStatus.CANCELLED)
    assert.equal(cancelled.cancelledReason, '测试取消')
    assert.ok(cancelled.cancelledAt)

    const updatedVenue = svc.getById(venue.id)
    assert.equal(updatedVenue.status, VenueStatus.IDLE)
  })

  it('查询可用时段 —— 预订后对应时段不可用', () => {
    svc.createBooking(createBookingInput())
    const availability = svc.getVenueAvailability(venue.id, '2026-07-25')
    const morningSlot = availability.shifts.find((s) => s.shift === VenueShift.MORNING)
    assert.equal(morningSlot?.available, false)
    const afternoonSlot = availability.shifts.find((s) => s.shift === VenueShift.AFTERNOON)
    assert.equal(afternoonSlot?.available, true)
  })

  it('释放场地 —— 无活跃预订时释放成功', () => {
    const booking = svc.createBooking(createBookingInput())
    svc.cancelBooking(booking.id)
    // Already released by cancelBooking — booking is cancelled
    // releaseVenue finds 0 active bookings so returns true
    const result = svc.releaseVenue(venue.id)
    assert.equal(result, true)
  })

  it('预订完整生命周期流转：create → confirm → start → complete', () => {
    const booking = svc.createBooking(createBookingInput())
    assert.equal(booking.status, VenueBookingStatus.PENDING)

    const confirmed = svc.confirmBooking(booking.id)
    assert.equal(confirmed.status, VenueBookingStatus.CONFIRMED)

    const started = svc.startBooking(booking.id)
    assert.equal(started.status, VenueBookingStatus.IN_PROGRESS)

    const completed = svc.completeBooking(booking.id)
    assert.equal(completed.status, VenueBookingStatus.COMPLETED)
  })

  // ── 反例 ─────────────────────────────────────────────────────────

  it('不存在的场地 —— 创建预订失败', () => {
    assert.throws(
      () => svc.createBooking(createBookingInput({ venueId: 'nonexistent' })),
      /不存在/,
    )
  })

  it('结束时间早于开始时间 —— 创建预订失败', () => {
    assert.throws(
      () => svc.createBooking(createBookingInput({
        startTime: '2026-07-25T12:00:00.000Z',
        endTime: '2026-07-25T08:00:00.000Z',
      })),
      /结束时间必须晚于开始时间/,
    )
  })

  it('人数超出容量 —— 创建预订失败', () => {
    assert.throws(
      () => svc.createBooking(createBookingInput({ guestCount: 999 })),
      /人数超出场地容量/,
    )
  })

  it('重复时间段预订 —— 冲突检测', () => {
    svc.createBooking(createBookingInput())
    assert.throws(
      () => svc.createBooking(createBookingInput({ userId: 'user-002', userName: 'Another' })),
      /已有预订/,
    )
  })

  it('不存在的预订 ID —— 获取详情失败', () => {
    assert.throws(
      () => svc.getBookingById('nonexistent'),
      /不存在/,
    )
  })

  it('预订已完成后不能再次完成 —— 状态转换验证', () => {
    const booking = svc.createBooking(createBookingInput())
    svc.confirmBooking(booking.id)
    svc.startBooking(booking.id)
    svc.completeBooking(booking.id)
    assert.throws(
      () => svc.completeBooking(booking.id),
      /预订不能从/,
    )
  })

  it('预订已取消后不能开始 —— 状态转换验证', () => {
    const booking = svc.createBooking(createBookingInput())
    svc.cancelBooking(booking.id)
    assert.throws(
      () => svc.startBooking(booking.id),
      /预订不能从/,
    )
  })

  it('价格为负数 —— 创建预订失败', () => {
    assert.throws(
      () => svc.createBooking(createBookingInput({ priceCents: -1 })),
      /价格和押金不能为负数/,
    )
  })

  it('用户名为空 —— 创建预订失败', () => {
    assert.throws(
      () => svc.createBooking(createBookingInput({ userName: '' })),
      /用户名称不能为空/,
    )
  })

  it('人数为零 —— 创建预订失败', () => {
    assert.throws(
      () => svc.createBooking(createBookingInput({ guestCount: 0 })),
      /人数必须大于 0/,
    )
  })
})
