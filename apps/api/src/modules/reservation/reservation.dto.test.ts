import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ReservationType, ReservationStatus } from './reservation.entity'
import {
  CreateReservationDto,
  UpdateReservationDto,
  ReservationQueryDto
} from './reservation.dto'

describe('CreateReservationDto', () => {
  test('标准预约 DTO：必填 type + resourceId + userId + startTime + endTime + duration + price + deposit', () => {
    const dto = Object.assign(new CreateReservationDto(), {
      type: ReservationType.Venue,
      resourceId: 'table-1',
      resourceName: '台球桌 1 号',
      userId: 'user-1',
      userName: '张三',
      startTime: '2026-06-23T12:00:00.000Z',
      endTime: '2026-06-23T14:00:00.000Z',
      duration: 120,
      price: 60,
      deposit: 30
    })

    assert.equal(dto.type, ReservationType.Venue)
    assert.equal(dto.resourceId, 'table-1')
    assert.equal(dto.resourceName, '台球桌 1 号')
    assert.equal(dto.userId, 'user-1')
    assert.equal(dto.userName, '张三')
    assert.equal(dto.startTime, '2026-06-23T12:00:00.000Z')
    assert.equal(dto.endTime, '2026-06-23T14:00:00.000Z')
    assert.equal(dto.duration, 120)
    assert.equal(dto.price, 60)
    assert.equal(dto.deposit, 30)
  })

  test('设备预约 DTO', () => {
    const dto = Object.assign(new CreateReservationDto(), {
      type: ReservationType.Equipment,
      resourceId: 'glove-1',
      resourceName: '保龄球手套',
      userId: 'user-2',
      userName: '李四',
      startTime: '2026-06-23T10:00:00.000Z',
      endTime: '2026-06-23T12:00:00.000Z',
      duration: 120,
      price: 30,
      deposit: 15,
      remark: '需要大号'
    })

    assert.equal(dto.type, ReservationType.Equipment)
    assert.equal(dto.remark, '需要大号')
  })

  test('服务预约 DTO', () => {
    const dto = Object.assign(new CreateReservationDto(), {
      type: ReservationType.Service,
      resourceId: 'coach-1',
      resourceName: '张教练',
      userId: 'user-3',
      userName: '王五',
      startTime: '2026-06-23T15:00:00.000Z',
      endTime: '2026-06-23T16:00:00.000Z',
      duration: 60,
      price: 200,
      deposit: 100
    })

    assert.equal(dto.type, ReservationType.Service)
    assert.equal(dto.resourceName, '张教练')
  })

  test('课程预约 DTO', () => {
    const dto = Object.assign(new CreateReservationDto(), {
      type: ReservationType.Class,
      resourceId: 'class-yoga',
      resourceName: '瑜伽课',
      userId: 'user-4',
      userName: '赵六',
      startTime: '2026-06-24T09:00:00.000Z',
      endTime: '2026-06-24T10:00:00.000Z',
      duration: 60,
      price: 80,
      deposit: 40
    })

    assert.equal(dto.type, ReservationType.Class)
  })
})

describe('UpdateReservationDto', () => {
  test('全部字段可选', () => {
    const dto = Object.assign(new UpdateReservationDto(), {
      startTime: '2026-06-23T13:00:00.000Z',
      endTime: '2026-06-23T15:00:00.000Z',
      duration: 120,
      price: 80,
      deposit: 40,
      remark: '已改时间',
      resourceName: '台球桌 2 号'
    })

    assert.equal(dto.startTime, '2026-06-23T13:00:00.000Z')
    assert.equal(dto.endTime, '2026-06-23T15:00:00.000Z')
    assert.equal(dto.duration, 120)
    assert.equal(dto.price, 80)
    assert.equal(dto.deposit, 40)
    assert.equal(dto.remark, '已改时间')
    assert.equal(dto.resourceName, '台球桌 2 号')
  })

  test('状态更新 DTO', () => {
    const dto = Object.assign(new UpdateReservationDto(), {
      status: ReservationStatus.Cancelled,
      remark: '客户取消'
    })

    assert.equal(dto.status, ReservationStatus.Cancelled)
    assert.equal(dto.remark, '客户取消')
  })

  test('空 DTO：不传任何字段', () => {
    const dto = new UpdateReservationDto()
    assert.equal(dto.status, undefined)
    assert.equal(dto.startTime, undefined)
    assert.equal(dto.endTime, undefined)
    assert.equal(dto.duration, undefined)
    assert.equal(dto.price, undefined)
    assert.equal(dto.deposit, undefined)
    assert.equal(dto.remark, undefined)
    assert.equal(dto.resourceName, undefined)
  })
})

describe('ReservationQueryDto', () => {
  test('全部查询字段可选', () => {
    const dto = Object.assign(new ReservationQueryDto(), {
      type: ReservationType.Venue,
      resourceId: 'table-1',
      userId: 'user-1',
      status: ReservationStatus.Confirmed,
      startDate: '2026-06-23T00:00:00.000Z',
      endDate: '2026-06-23T23:59:59.999Z'
    })

    assert.equal(dto.type, ReservationType.Venue)
    assert.equal(dto.resourceId, 'table-1')
    assert.equal(dto.userId, 'user-1')
    assert.equal(dto.status, ReservationStatus.Confirmed)
    assert.equal(dto.startDate, '2026-06-23T00:00:00.000Z')
    assert.equal(dto.endDate, '2026-06-23T23:59:59.999Z')
  })

  test('部分字段查询', () => {
    const dto = Object.assign(new ReservationQueryDto(), {
      userId: 'user-2',
      status: ReservationStatus.Pending
    })

    assert.equal(dto.userId, 'user-2')
    assert.equal(dto.status, ReservationStatus.Pending)
    assert.equal(dto.type, undefined)
    assert.equal(dto.resourceId, undefined)
  })

  test('空查询 DTO', () => {
    const dto = new ReservationQueryDto()
    assert.equal(dto.type, undefined)
    assert.equal(dto.resourceId, undefined)
    assert.equal(dto.userId, undefined)
    assert.equal(dto.status, undefined)
    assert.equal(dto.startDate, undefined)
    assert.equal(dto.endDate, undefined)
  })
})
