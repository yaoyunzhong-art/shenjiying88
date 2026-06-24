import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  MemberQueryDto,
  MemberCreateDto,
  MemberUpdateDto,
  MemberBootstrapResponseDto,
  MemberPersistentRegisterDto,
  MemberLoginDto,
  MemberPointsAdjustDto,
  MemberPaymentActivityDto,
  MemberStatusAdjustDto,
  MemberLevelAdjustDto,
  MemberPersistentProfileUpdateDto
} from './member.dto'
import { MemberLevel, MemberStatus } from './member.entity'

// ── MemberQueryDto ─────────────────────────────────────────────
describe('member.dto: MemberQueryDto', () => {
  test('default properties are undefined', () => {
    const dto = new MemberQueryDto()
    assert.equal(dto.level, undefined)
    assert.equal(dto.status, undefined)
    assert.equal(dto.keyword, undefined)
    assert.equal(dto.page, undefined)
    assert.equal(dto.pageSize, undefined)
  })

  test('can set level filter', () => {
    const dto = new MemberQueryDto()
    dto.level = MemberLevel.Gold
    assert.equal(dto.level, 'GOLD')
  })

  test('can set status filter', () => {
    const dto = new MemberQueryDto()
    dto.status = MemberStatus.Active
    assert.equal(dto.status, 'ACTIVE')
  })

  test('can set keyword search', () => {
    const dto = new MemberQueryDto()
    dto.keyword = 'test-user'
    assert.equal(dto.keyword, 'test-user')
  })

  test('can set pagination', () => {
    const dto = new MemberQueryDto()
    dto.page = 1
    dto.pageSize = 20
    assert.equal(dto.page, 1)
    assert.equal(dto.pageSize, 20)
  })

  test('can set all properties', () => {
    const dto = new MemberQueryDto()
    dto.level = MemberLevel.Silver
    dto.status = MemberStatus.Frozen
    dto.keyword = 'vip'
    dto.page = 2
    dto.pageSize = 50

    assert.equal(dto.level, 'SILVER')
    assert.equal(dto.status, 'FROZEN')
    assert.equal(dto.keyword, 'vip')
    assert.equal(dto.page, 2)
    assert.equal(dto.pageSize, 50)
  })

  test('instanceof check', () => {
    const dto = new MemberQueryDto()
    assert.ok(dto instanceof MemberQueryDto)
  })
})

// ── MemberCreateDto ────────────────────────────────────────────
describe('member.dto: MemberCreateDto', () => {
  test('requires nickname property', () => {
    const dto = new MemberCreateDto()
    dto.nickname = 'NewUser'
    assert.equal(dto.nickname, 'NewUser')
  })

  test('points defaults to undefined', () => {
    const dto = new MemberCreateDto()
    dto.nickname = 'Test'
    assert.equal(dto.points, undefined)
  })

  test('can set initial points', () => {
    const dto = new MemberCreateDto()
    dto.nickname = 'VIP'
    dto.points = 100
    assert.equal(dto.points, 100)
  })

  test('can set initial level', () => {
    const dto = new MemberCreateDto()
    dto.nickname = 'GoldUser'
    dto.level = MemberLevel.Gold
    assert.equal(dto.level, 'GOLD')
  })

  test('can set all create properties', () => {
    const dto = new MemberCreateDto()
    dto.nickname = 'FullUser'
    dto.points = 5000
    dto.level = MemberLevel.Platinum

    assert.equal(dto.nickname, 'FullUser')
    assert.equal(dto.points, 5000)
    assert.equal(dto.level, 'PLATINUM')
  })

  test('instanceof check', () => {
    const dto = new MemberCreateDto()
    assert.ok(dto instanceof MemberCreateDto)
  })
})

// ── MemberUpdateDto ────────────────────────────────────────────
describe('member.dto: MemberUpdateDto', () => {
  test('all properties default to undefined', () => {
    const dto = new MemberUpdateDto()
    assert.equal(dto.nickname, undefined)
    assert.equal(dto.level, undefined)
    assert.equal(dto.status, undefined)
    assert.equal(dto.pointsDelta, undefined)
  })

  test('can update nickname', () => {
    const dto = new MemberUpdateDto()
    dto.nickname = 'UpdatedName'
    assert.equal(dto.nickname, 'UpdatedName')
  })

  test('can update level', () => {
    const dto = new MemberUpdateDto()
    dto.level = MemberLevel.Diamond
    assert.equal(dto.level, 'DIAMOND')
  })

  test('can update status', () => {
    const dto = new MemberUpdateDto()
    dto.status = MemberStatus.Blacklisted
    assert.equal(dto.status, 'BLACKLISTED')
  })

  test('can apply positive pointsDelta', () => {
    const dto = new MemberUpdateDto()
    dto.pointsDelta = 200
    assert.equal(dto.pointsDelta, 200)
  })

  test('can apply negative pointsDelta (deduction)', () => {
    const dto = new MemberUpdateDto()
    dto.pointsDelta = -50
    assert.equal(dto.pointsDelta, -50)
  })

  test('can apply zero pointsDelta', () => {
    const dto = new MemberUpdateDto()
    dto.pointsDelta = 0
    assert.equal(dto.pointsDelta, 0)
  })

  test('can set multiple update fields', () => {
    const dto = new MemberUpdateDto()
    dto.nickname = 'MultiUpdate'
    dto.level = MemberLevel.Silver
    dto.status = MemberStatus.Frozen
    dto.pointsDelta = -100

    assert.equal(dto.nickname, 'MultiUpdate')
    assert.equal(dto.level, 'SILVER')
    assert.equal(dto.status, 'FROZEN')
    assert.equal(dto.pointsDelta, -100)
  })

  test('instanceof check', () => {
    const dto = new MemberUpdateDto()
    assert.ok(dto instanceof MemberUpdateDto)
  })
})

// ── MemberBootstrapResponseDto ─────────────────────────────────
describe('member.dto: MemberBootstrapResponseDto', () => {
  test('can set tenant context', () => {
    const dto = new MemberBootstrapResponseDto()
    dto.tenantContext = { tenantId: 't-1', brandId: 'b-1' }
    assert.deepEqual(dto.tenantContext, { tenantId: 't-1', brandId: 'b-1' })
  })

  test('can set capabilities array', () => {
    const dto = new MemberBootstrapResponseDto()
    dto.capabilities = ['member-center', 'points']
    assert.deepEqual(dto.capabilities, ['member-center', 'points'])
  })

  test('can set phase', () => {
    const dto = new MemberBootstrapResponseDto()
    dto.phase = 'scaffold'
    assert.equal(dto.phase, 'scaffold')
  })

  test('can set all fields', () => {
    const dto = new MemberBootstrapResponseDto()
    dto.tenantContext = { tenantId: 't-full' }
    dto.capabilities = ['member-center', 'points', 'svip', 'blind-box']
    dto.phase = 'scaffold'

    assert.equal(dto.phase, 'scaffold')
    assert.equal(dto.capabilities.length, 4)
    assert.equal(dto.tenantContext.tenantId, 't-full')
  })

  test('instanceof check', () => {
    const dto = new MemberBootstrapResponseDto()
    assert.ok(dto instanceof MemberBootstrapResponseDto)
  })
})

describe('member.dto: MemberPersistentRegisterDto', () => {
  test('can assign persistent register fields', () => {
    const dto = new MemberPersistentRegisterDto()
    dto.mobile = '13800000000'
    dto.nickname = 'Persistent User'
    dto.initialPoints = 200

    assert.equal(dto.mobile, '13800000000')
    assert.equal(dto.nickname, 'Persistent User')
    assert.equal(dto.initialPoints, 200)
  })
})

describe('member.dto: MemberLoginDto', () => {
  test('can assign login mobile', () => {
    const dto = new MemberLoginDto()
    dto.mobile = '13900000000'

    assert.equal(dto.mobile, '13900000000')
  })
})

describe('member.dto: MemberPointsAdjustDto', () => {
  test('can assign points delta for controller actions', () => {
    const dto = new MemberPointsAdjustDto()
    dto.points = 300
    dto.approvalTicket = 'APR-POINTS-001'

    assert.equal(dto.points, 300)
    assert.equal(dto.approvalTicket, 'APR-POINTS-001')
  })
})

describe('member.dto: MemberPaymentActivityDto', () => {
  test('can assign payment activity fields', () => {
    const dto = new MemberPaymentActivityDto()
    dto.orderId = 'order-001'
    dto.amount = 88
    dto.paidAt = '2026-06-18T10:00:00.000Z'
    dto.channel = 'wechat-pay'
    dto.source = 'cashier'

    assert.equal(dto.orderId, 'order-001')
    assert.equal(dto.amount, 88)
    assert.equal(dto.paidAt, '2026-06-18T10:00:00.000Z')
    assert.equal(dto.channel, 'wechat-pay')
    assert.equal(dto.source, 'cashier')
  })
})

describe('member.dto: MemberStatusAdjustDto', () => {
  test('can assign target member status', () => {
    const dto = new MemberStatusAdjustDto()
    dto.status = MemberStatus.Blacklisted
    dto.approvalTicket = 'APR-STATUS-001'

    assert.equal(dto.status, 'BLACKLISTED')
    assert.equal(dto.approvalTicket, 'APR-STATUS-001')
  })
})

describe('member.dto: MemberLevelAdjustDto', () => {
  test('can assign target member level', () => {
    const dto = new MemberLevelAdjustDto()
    dto.level = MemberLevel.Platinum
    dto.approvalTicket = 'APR-LEVEL-001'

    assert.equal(dto.level, 'PLATINUM')
    assert.equal(dto.approvalTicket, 'APR-LEVEL-001')
  })
})

describe('member.dto: MemberPersistentProfileUpdateDto', () => {
  test('can assign persisted profile edit fields', () => {
    const dto = new MemberPersistentProfileUpdateDto()
    dto.nickname = '资料更新用户'
    dto.mobile = '13800138000'
    dto.email = 'member@example.com'
    dto.address = '深圳市南山区科技园'
    dto.notes = '重点跟进会员'

    assert.equal(dto.nickname, '资料更新用户')
    assert.equal(dto.mobile, '13800138000')
    assert.equal(dto.email, 'member@example.com')
    assert.equal(dto.address, '深圳市南山区科技园')
    assert.equal(dto.notes, '重点跟进会员')
  })
})
