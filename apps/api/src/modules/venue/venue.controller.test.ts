/**
 * venue.controller.test.ts — P-25 + V24 场地管理 & 场地预订 控制器单元测试 (≥10 tests)
 *
 * 测试覆盖:
 *   场地 CRUD: create / findAll / getById / update / delete
 *   场地预订: createBooking / listBookings / getBookingById
 *   预订流转: confirm / start / complete / cancel
 *   可用性查询: getAvailability
 *   场地释放: releaseVenue
 *   边界: 参数缺失 / 资源找不到 / 状态转换非法
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HttpException, HttpStatus } from '@nestjs/common'
import { VenueController } from './venue.controller'
import { VenueBookingStatus, VenueShift, VenueStatus, VenueType } from './venue.entity'
import type { Venue, VenueBooking, CreateBookingInput, ListBookingQuery } from './venue.service'

// ── Mock types ───────────────────────────────────────────────────────────

interface MockVenueService {
  create: (input: any) => Venue
  list: (query?: any) => Venue[]
  getById: (id: string) => Venue
  update: (id: string, input: any) => Venue
  delete: (id: string) => void
  createBooking: (input: CreateBookingInput) => VenueBooking
  listBookings: (query?: ListBookingQuery) => VenueBooking[]
  getBookingById: (id: string) => VenueBooking
  confirmBooking: (id: string) => VenueBooking
  startBooking: (id: string) => VenueBooking
  completeBooking: (id: string) => VenueBooking
  cancelBooking: (id: string, reason?: string) => VenueBooking
  getVenueAvailability: (venueId: string, date: string) => { date: string; venueId: string; shifts: { shift: VenueShift; available: boolean }[] }
  releaseVenue: (venueId: string) => boolean
  getTimeSlotPricing: (id: string) => any[]
  setTimeSlotPricing: (id: string, pricing: any[]) => Venue
  getHolidayPricing: (id: string) => any[]
  setHolidayPricing: (id: string, pricing: any[]) => Venue
  changeStatus: (id: string, status: VenueStatus) => Venue
}

// ── Factories ────────────────────────────────────────────────────────────

function sampleVenue(overrides?: Partial<Venue>): Venue {
  return {
    id: 'venue-001',
    name: '主大厅',
    type: VenueType.HALL,
    capacity: 200,
    status: VenueStatus.IDLE,
    tenantId: 'default-tenant',
    priceCents: 50000,
    timeSlotPricing: [],
    holidayPricing: [],
    tags: ['premium'],
    description: '主活动大厅',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function sampleBooking(overrides?: Partial<VenueBooking>): VenueBooking {
  return {
    id: 'booking-001',
    tenantId: 'default-tenant',
    venueId: 'venue-001',
    venueName: '主大厅',
    userId: 'user-01',
    userName: '张三',
    date: '2026-07-22',
    shift: VenueShift.MORNING,
    startTime: '2026-07-22T08:00:00.000Z',
    endTime: '2026-07-22T12:00:00.000Z',
    status: VenueBookingStatus.PENDING,
    priceCents: 20000,
    depositCents: 5000,
    guestCount: 50,
    remark: '公司年会',
    createdAt: '2026-07-21T10:00:00.000Z',
    updatedAt: '2026-07-21T10:00:00.000Z',
    ...overrides,
  }
}

function makeMockService(overrides?: Partial<MockVenueService>): MockVenueService {
  return {
    create: () => sampleVenue(),
    list: () => [sampleVenue()],
    getById: () => sampleVenue(),
    update: () => sampleVenue({ name: '更新后的名称', capacity: 300 }),
    delete: () => {},
    createBooking: () => sampleBooking(),
    listBookings: () => [sampleBooking()],
    getBookingById: () => sampleBooking(),
    confirmBooking: () => sampleBooking({ status: VenueBookingStatus.CONFIRMED }),
    startBooking: () => sampleBooking({ status: VenueBookingStatus.IN_PROGRESS }),
    completeBooking: () => sampleBooking({ status: VenueBookingStatus.COMPLETED }),
    cancelBooking: () => sampleBooking({ status: VenueBookingStatus.CANCELLED }),
    getVenueAvailability: () => ({
      date: '2026-07-22',
      venueId: 'venue-001',
      shifts: [
        { shift: VenueShift.MORNING, available: true },
        { shift: VenueShift.AFTERNOON, available: true },
        { shift: VenueShift.EVENING, available: true },
        { shift: VenueShift.FULL_DAY, available: true },
      ],
    }),
    releaseVenue: () => true,
    getTimeSlotPricing: () => [],
    setTimeSlotPricing: () => sampleVenue(),
    getHolidayPricing: () => [],
    setHolidayPricing: () => sampleVenue(),
    changeStatus: () => sampleVenue({ status: VenueStatus.OCCUPIED }),
    ...overrides,
  }
}

function makeController(overrides?: Partial<MockVenueService>): VenueController {
  return new VenueController(makeMockService(overrides) as any)
}

// ── Route metadata ───────────────────────────────────────────────────────

describe('VenueController 路由元数据', () => {
  it('controller path 为 venue', () => {
    const path = Reflect.getMetadata('path', VenueController)
    assert.equal(path, 'venue')
  })

  it('create POST /', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.create)
    const path = Reflect.getMetadata('path', VenueController.prototype.create)
    assert.equal(method, 1) // POST
    assert.equal(path, '/')
  })

  it('findAll GET /', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.findAll)
    assert.equal(method, 0) // GET
  })

  it('getById GET /:id', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.getById)
    assert.equal(method, 0) // GET
  })

  it('update PUT /:id', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.update)
    assert.equal(method, 2) // PUT
  })

  it('delete DELETE /:id', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.delete)
    assert.equal(method, 3) // DELETE
  })

  it('createBooking POST /booking', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.createBooking)
    const path = Reflect.getMetadata('path', VenueController.prototype.createBooking)
    assert.equal(method, 1) // POST
    assert.equal(path, 'booking')
  })

  it('confirmBooking POST /booking/:id/confirm', () => {
    const path = Reflect.getMetadata('path', VenueController.prototype.confirmBooking)
    assert.equal(path, 'booking/:id/confirm')
  })

  it('startBooking POST /booking/:id/start', () => {
    const path = Reflect.getMetadata('path', VenueController.prototype.startBooking)
    assert.equal(path, 'booking/:id/start')
  })

  it('completeBooking POST /booking/:id/complete', () => {
    const path = Reflect.getMetadata('path', VenueController.prototype.completeBooking)
    assert.equal(path, 'booking/:id/complete')
  })

  it('cancelBooking POST /booking/:id/cancel', () => {
    const path = Reflect.getMetadata('path', VenueController.prototype.cancelBooking)
    assert.equal(path, 'booking/:id/cancel')
  })

  it('getAvailability GET /booking/:venueId/availability', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.getAvailability)
    assert.equal(method, 0) // GET
    const path = Reflect.getMetadata('path', VenueController.prototype.getAvailability)
    assert.equal(path, 'booking/:venueId/availability')
  })

  it('releaseVenue POST /:id/release', () => {
    const method = Reflect.getMetadata('method', VenueController.prototype.releaseVenue)
    const path = Reflect.getMetadata('path', VenueController.prototype.releaseVenue)
    assert.equal(method, 1) // POST
    assert.equal(path, ':id/release')
  })
})

// ── Controller 方法测试 ──────────────────────────────────────────────────

describe('VenueController 场地管理', () => {
  describe('create', () => {
    it('正常创建场地，返回场地对象', () => {
      const ctrl = makeController()
      const result = ctrl.create({
        name: '测试大厅',
        type: VenueType.HALL,
        capacity: 100,
        priceCents: 30000,
      })
      assert.equal(result.name, '主大厅')
      assert.equal(result.type, VenueType.HALL)
      assert.equal(result.status, VenueStatus.IDLE)
    })

    it('service 抛出异常时包装为 HttpException', () => {
      const ctrl = makeController({
        create: () => { throw new Error('场地名称不能为空') },
      })
      assert.throws(
        () => ctrl.create({
          name: '',
          type: VenueType.INDOOR,
          capacity: 10,
          priceCents: 1000,
        }),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.BAD_REQUEST)
          assert.ok(e.message.includes('场地名称不能为空'))
          return true
        },
      )
    })
  })

  describe('findAll', () => {
    it('正常返回场地列表', () => {
      const ctrl = makeController()
      const result = ctrl.findAll()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
    })

    it('支持 type/status/search 筛选参数', () => {
      const ctrl = makeController()
      const result = ctrl.findAll('indoor', 'idle', '大厅')
      assert.ok(Array.isArray(result))
    })
  })

  describe('getById', () => {
    it('找到场地返回详情', () => {
      const ctrl = makeController()
      const result = ctrl.getById('venue-001')
      assert.equal(result.id, 'venue-001')
    })

    it('找不到场地抛出 HttpException 404', () => {
      const ctrl = makeController({
        getById: () => { throw new Error('场地不存在') },
      })
      assert.throws(
        () => ctrl.getById('nonexistent'),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.NOT_FOUND)
          assert.ok(e.message.includes('场地不存在'))
          return true
        },
      )
    })
  })

  describe('update', () => {
    it('正常更新场地信息', () => {
      const ctrl = makeController()
      const result = ctrl.update('venue-001', { name: '更新后', capacity: 300 })
      assert.equal(result.name, '更新后的名称')
      assert.equal(result.capacity, 300)
    })

    it('无效数据抛出 HttpException 400', () => {
      const ctrl = makeController({
        update: () => { throw new Error('容量不能为负数') },
      })
      assert.throws(
        () => ctrl.update('venue-001', { capacity: -1 }),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.BAD_REQUEST)
          return true
        },
      )
    })
  })

  describe('delete', () => {
    it('正常删除返回 { success: true }', () => {
      const ctrl = makeController()
      const result = ctrl.delete('venue-001')
      assert.deepEqual(result, { success: true })
    })

    it('不存在的场地抛出 HttpException 404', () => {
      const ctrl = makeController({
        delete: () => { throw new Error('场地不存在') },
      })
      assert.throws(
        () => ctrl.delete('nonexistent'),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.NOT_FOUND)
          return true
        },
      )
    })
  })
})

describe('VenueController 场地预订', () => {
  const validBookingBody = {
    venueId: 'venue-001',
    userId: 'user-01',
    userName: '张三',
    date: '2026-07-22',
    shift: VenueShift.MORNING,
    startTime: '2026-07-22T08:00:00.000Z',
    endTime: '2026-07-22T12:00:00.000Z',
    priceCents: 20000,
    depositCents: 5000,
    guestCount: 50,
    remark: '公司年会',
  }

  describe('createBooking', () => {
    it('正常创建预订，返回 booking 对象', () => {
      const ctrl = makeController()
      const result = ctrl.createBooking(validBookingBody)
      assert.equal(result.id, 'booking-001')
      assert.equal(result.status, VenueBookingStatus.PENDING)
    })

    it('service 异常包装为 HttpException 400', () => {
      const ctrl = makeController({
        createBooking: () => { throw new Error('结束时间必须晚于开始时间') },
      })
      assert.throws(
        () => ctrl.createBooking({ ...validBookingBody, endTime: '2026-07-22T06:00:00.000Z' }),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.BAD_REQUEST)
          assert.ok(e.message.includes('结束时间必须晚于开始时间'))
          return true
        },
      )
    })

    it('服务内部异常返回 500', () => {
      const ctrl = makeController({
        createBooking: () => { throw 'unknown error' },
      })
      assert.throws(
        () => ctrl.createBooking(validBookingBody),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.INTERNAL_SERVER_ERROR)
          return true
        },
      )
    })
  })

  describe('listBookings', () => {
    it('正常返回预订列表', () => {
      const ctrl = makeController()
      const result = ctrl.findAllBookings()
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
    })

    it('支持 venueId/userId/date/status/shift 筛选', () => {
      let captured: any
      const ctrl = makeController({
        listBookings: (q: any) => { captured = q; return [sampleBooking()] },
      })
      ctrl.findAllBookings('venue-001', 'user-01', '2026-07-22', 'confirmed', 'morning')
      assert.equal(captured?.venueId, 'venue-001')
      assert.equal(captured?.userId, 'user-01')
    })

    it('空列表', () => {
      const ctrl = makeController({ listBookings: () => [] })
      const result = ctrl.findAllBookings()
      assert.deepEqual(result, [])
    })
  })

  describe('getBookingById', () => {
    it('找到预订返回详情', () => {
      const ctrl = makeController()
      const result = ctrl.getBookingById('booking-001')
      assert.equal(result.id, 'booking-001')
      assert.equal(result.venueName, '主大厅')
    })

    it('找不到预订抛出 HttpException 404', () => {
      const ctrl = makeController({
        getBookingById: () => { throw new Error('预订不存在') },
      })
      assert.throws(
        () => ctrl.getBookingById('nonexistent'),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.NOT_FOUND)
          return true
        },
      )
    })
  })

  describe('confirmBooking', () => {
    it('确认预订', () => {
      const ctrl = makeController()
      const result = ctrl.confirmBooking('booking-001')
      assert.equal(result.status, VenueBookingStatus.CONFIRMED)
    })

    it('无效状态转换抛出 400', () => {
      const ctrl = makeController({
        confirmBooking: () => { throw new Error('预订不能从 completed 转换到 confirmed') },
      })
      assert.throws(
        () => ctrl.confirmBooking('booking-002'),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.BAD_REQUEST)
          return true
        },
      )
    })
  })

  describe('startBooking', () => {
    it('开始使用场地', () => {
      const ctrl = makeController()
      const result = ctrl.startBooking('booking-001')
      assert.equal(result.status, VenueBookingStatus.IN_PROGRESS)
    })
  })

  describe('completeBooking', () => {
    it('完成场地使用', () => {
      const ctrl = makeController()
      const result = ctrl.completeBooking('booking-001')
      assert.equal(result.status, VenueBookingStatus.COMPLETED)
    })
  })

  describe('cancelBooking', () => {
    it('取消预订（带原因）', () => {
      const ctrl = makeController()
      const result = ctrl.cancelBooking('booking-001', '客户取消')
      assert.equal(result.status, VenueBookingStatus.CANCELLED)
    })

    it('取消预订（不带原因）', () => {
      const ctrl = makeController()
      const result = ctrl.cancelBooking('booking-001')
      assert.equal(result.status, VenueBookingStatus.CANCELLED)
    })
  })

  describe('getAvailability', () => {
    it('查询可用时段', () => {
      const ctrl = makeController()
      const result = ctrl.getAvailability('venue-001', '2026-07-22')
      assert.equal(result.date, '2026-07-22')
      assert.ok(Array.isArray(result.shifts))
      assert.equal(result.shifts.length, 4)
    })

    it('缺少 date 参数抛出 HttpException 400', () => {
      const ctrl = makeController()
      assert.throws(
        () => ctrl.getAvailability('venue-001', ''),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.BAD_REQUEST)
          assert.ok(e.message.includes('date'))
          return true
        },
      )
    })

    it('不存在的场地抛出 HttpException 404', () => {
      const ctrl = makeController({
        getVenueAvailability: () => { throw new Error('场地不存在') },
      })
      assert.throws(
        () => ctrl.getAvailability('nonexistent', '2026-07-22'),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.NOT_FOUND)
          return true
        },
      )
    })
  })

  describe('releaseVenue', () => {
    it('释放场地成功', () => {
      const ctrl = makeController()
      const result = ctrl.releaseVenue('venue-001')
      assert.deepEqual(result, { success: true })
    })

    it('释放不存在的场地抛出 404', () => {
      const ctrl = makeController({
        releaseVenue: () => { throw new Error('场地不存在') },
      })
      assert.throws(
        () => ctrl.releaseVenue('nonexistent'),
        (e: HttpException) => {
          assert.equal(e.getStatus(), HttpStatus.NOT_FOUND)
          return true
        },
      )
    })
  })
})
