import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  CampaignConditionDto,
  CampaignActionDto,
  RegisterCampaignDto,
  UpdateCampaignStatusDto
} from './campaign.dto'
import {
  CampaignActionKind,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger
} from './campaign.entity'

// ── CampaignConditionDto ──
describe('campaign.dto: CampaignConditionDto', () => {
  test('default properties are undefined', () => {
    const dto = new CampaignConditionDto()
    assert.equal(dto.type, undefined)
    assert.equal(dto.value, undefined)
  })

  test('can set MIN_ORDER_AMOUNT condition (正例)', () => {
    const dto = new CampaignConditionDto()
    dto.type = CampaignConditionType.MinOrderAmount
    dto.value = 100
    assert.equal(dto.type, CampaignConditionType.MinOrderAmount)
    assert.equal(dto.value, 100)
  })

  test('can set MEMBER_LEVEL condition with string value (正例)', () => {
    const dto = new CampaignConditionDto()
    dto.type = CampaignConditionType.MemberLevel
    dto.value = 'GOLD'
    assert.equal(dto.type, CampaignConditionType.MemberLevel)
    assert.equal(dto.value, 'GOLD')
  })

  test('can set STORE_SCOPE condition with string array value (正例)', () => {
    const dto = new CampaignConditionDto()
    dto.type = CampaignConditionType.StoreScope
    dto.value = ['store-001', 'store-002']
    assert.equal(dto.type, CampaignConditionType.StoreScope)
    assert.deepStrictEqual(dto.value, ['store-001', 'store-002'])
  })

  test('can set BRAND_SCOPE condition (正例)', () => {
    const dto = new CampaignConditionDto()
    dto.type = CampaignConditionType.BrandScope
    dto.value = 'brand-xyz'
    assert.equal(dto.type, CampaignConditionType.BrandScope)
    assert.equal(dto.value, 'brand-xyz')
  })

  test('value supports number, string, and string[] (联合类型)', () => {
    const dto1 = new CampaignConditionDto()
    dto1.value = 50
    assert.equal(typeof dto1.value, 'number')

    const dto2 = new CampaignConditionDto()
    dto2.value = 'VIP'
    assert.equal(typeof dto2.value, 'string')

    const dto3 = new CampaignConditionDto()
    dto3.value = ['s1', 's2']
    assert.ok(Array.isArray(dto3.value))
  })

  test('instanceof check', () => {
    const dto = new CampaignConditionDto()
    assert.ok(dto instanceof CampaignConditionDto)
  })
})

// ── CampaignActionDto ──
describe('campaign.dto: CampaignActionDto', () => {
  test('default properties are undefined', () => {
    const dto = new CampaignActionDto()
    assert.equal(dto.kind, undefined)
    assert.equal(dto.params, undefined)
  })

  test('can set AWARD_POINTS action (正例)', () => {
    const dto = new CampaignActionDto()
    dto.kind = CampaignActionKind.AwardPoints
    dto.params = { points: 100 }
    assert.equal(dto.kind, CampaignActionKind.AwardPoints)
    assert.deepStrictEqual(dto.params, { points: 100 })
  })

  test('can set ISSUE_COUPON action (正例)', () => {
    const dto = new CampaignActionDto()
    dto.kind = CampaignActionKind.IssueCoupon
    dto.params = { couponTemplateId: 'ct-001', discountType: 'PERCENTAGE', discountValue: 20 }
    assert.equal(dto.kind, CampaignActionKind.IssueCoupon)
    assert.equal(dto.params.couponTemplateId, 'ct-001')
    assert.equal(dto.params.discountValue, 20)
  })

  test('can set ISSUE_BLINDBOX action (正例)', () => {
    const dto = new CampaignActionDto()
    dto.kind = CampaignActionKind.IssueBlindbox
    dto.params = { blindboxPoolId: 'bp-001' }
    assert.equal(dto.kind, CampaignActionKind.IssueBlindbox)
    assert.equal(dto.params.blindboxPoolId, 'bp-001')
  })

  test('can set RECOMMEND_TAG action (正例)', () => {
    const dto = new CampaignActionDto()
    dto.kind = CampaignActionKind.RecommendTag
    dto.params = { tag: 'high_value' }
    assert.equal(dto.kind, CampaignActionKind.RecommendTag)
    assert.equal(dto.params.tag, 'high_value')
  })

  test('params supports any object shape', () => {
    const dto = new CampaignActionDto()
    dto.kind = CampaignActionKind.AwardPoints
    dto.params = { points: 50, expiresAt: '2026-12-31T23:59:59Z', reason: 'signup' }
    assert.equal(dto.params.points, 50)
    assert.equal(dto.params.reason, 'signup')
  })

  test('instanceof check', () => {
    const dto = new CampaignActionDto()
    assert.ok(dto instanceof CampaignActionDto)
  })
})

// ── RegisterCampaignDto ──
describe('campaign.dto: RegisterCampaignDto', () => {
  test('default properties are undefined', () => {
    const dto = new RegisterCampaignDto()
    assert.equal(dto.code, undefined)
    assert.equal(dto.title, undefined)
    assert.equal(dto.description, undefined)
    assert.equal(dto.triggerEvent, undefined)
    assert.equal(dto.conditions, undefined)
    assert.equal(dto.actions, undefined)
    assert.equal(dto.priority, undefined)
    assert.equal(dto.scheduledStart, undefined)
    assert.equal(dto.scheduledEnd, undefined)
  })

  test('can register a complete campaign DTO (正例)', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'WELCOME_BONUS'
    dto.title = '新会员欢迎奖励'
    dto.triggerEvent = CampaignTrigger.PaymentSuccess

    const cond = new CampaignConditionDto()
    cond.type = CampaignConditionType.MinOrderAmount
    cond.value = 100
    dto.conditions = [cond]

    const action = new CampaignActionDto()
    action.kind = CampaignActionKind.AwardPoints
    action.params = { points: 200 }
    dto.actions = [action]

    assert.equal(dto.code, 'WELCOME_BONUS')
    assert.equal(dto.title, '新会员欢迎奖励')
    assert.equal(dto.triggerEvent, CampaignTrigger.PaymentSuccess)
    assert.equal(dto.conditions.length, 1)
    assert.equal(dto.actions.length, 1)
  })

  test('can register campaign with optional description (边界)', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'TEST_CAMPAIGN'
    dto.title = 'Test'
    dto.description = '测试描述'
    dto.triggerEvent = CampaignTrigger.MemberProfileSynced
    dto.conditions = []
    dto.actions = []
    assert.equal(dto.description, '测试描述')
  })

  test('description is optional - undefined is valid', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'NO_DESC'
    dto.title = 'No Description'
    dto.triggerEvent = CampaignTrigger.OrderCreated
    dto.conditions = []
    dto.actions = []
    assert.equal(dto.description, undefined)
  })

  test('can register with multiple conditions and actions (正例)', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'MULTI'
    dto.title = 'Multi conditions'

    const cond1 = new CampaignConditionDto()
    cond1.type = CampaignConditionType.MemberLevel
    cond1.value = 'PLATINUM'
    const cond2 = new CampaignConditionDto()
    cond2.type = CampaignConditionType.MinOrderAmount
    cond2.value = 500
    dto.conditions = [cond1, cond2]

    const action1 = new CampaignActionDto()
    action1.kind = CampaignActionKind.AwardPoints
    action1.params = { points: 300 }
    const action2 = new CampaignActionDto()
    action2.kind = CampaignActionKind.IssueCoupon
    action2.params = { couponTemplateId: 'ct-002' }
    dto.actions = [action1, action2]

    dto.triggerEvent = CampaignTrigger.MemberActivityRecurring

    assert.equal(dto.conditions.length, 2)
    assert.equal(dto.actions.length, 2)
  })

  test('can set scheduled time range (正例)', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'SCHEDULED_CAMPAIGN'
    dto.title = 'Scheduled'
    dto.triggerEvent = CampaignTrigger.PaymentSuccess
    dto.conditions = []
    dto.actions = []
    dto.scheduledStart = '2026-07-01T00:00:00Z'
    dto.scheduledEnd = '2026-07-31T23:59:59Z'
    dto.priority = 10
    assert.equal(dto.scheduledStart, '2026-07-01T00:00:00Z')
    assert.equal(dto.scheduledEnd, '2026-07-31T23:59:59Z')
    assert.equal(dto.priority, 10)
  })

  test('scheduledStart and scheduledEnd are optional (边界)', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'NO_SCHEDULE'
    dto.title = 'No Schedule'
    dto.triggerEvent = CampaignTrigger.PaymentSuccess
    dto.conditions = []
    dto.actions = []
    assert.equal(dto.scheduledStart, undefined)
    assert.equal(dto.scheduledEnd, undefined)
  })

  test('priority defaults to undefined (边界)', () => {
    const dto = new RegisterCampaignDto()
    dto.code = 'NO_PRIORITY'
    dto.title = 'No Priority'
    dto.triggerEvent = CampaignTrigger.PaymentSuccess
    dto.conditions = []
    dto.actions = []
    assert.equal(dto.priority, undefined)
  })

  test('instanceof check', () => {
    const dto = new RegisterCampaignDto()
    assert.ok(dto instanceof RegisterCampaignDto)
  })
})

// ── UpdateCampaignStatusDto ──
describe('campaign.dto: UpdateCampaignStatusDto', () => {
  test('default status is undefined', () => {
    const dto = new UpdateCampaignStatusDto()
    assert.equal(dto.status, undefined)
  })

  test('can set DRAFT status (正例)', () => {
    const dto = new UpdateCampaignStatusDto()
    dto.status = CampaignStatus.Draft
    assert.equal(dto.status, CampaignStatus.Draft)
  })

  test('can set ACTIVE status (正例)', () => {
    const dto = new UpdateCampaignStatusDto()
    dto.status = CampaignStatus.Active
    assert.equal(dto.status, CampaignStatus.Active)
  })

  test('can set PAUSED status (正例)', () => {
    const dto = new UpdateCampaignStatusDto()
    dto.status = CampaignStatus.Paused
    assert.equal(dto.status, CampaignStatus.Paused)
  })

  test('can set COMPLETED status (正例)', () => {
    const dto = new UpdateCampaignStatusDto()
    dto.status = CampaignStatus.Completed
    assert.equal(dto.status, CampaignStatus.Completed)
  })

  test('can set SCHEDULED status (正例)', () => {
    const dto = new UpdateCampaignStatusDto()
    dto.status = CampaignStatus.Scheduled
    assert.equal(dto.status, CampaignStatus.Scheduled)
  })

  test('status is a required field in DTO (反例 - 未设置时 undefined)', () => {
    const dto = new UpdateCampaignStatusDto()
    assert.equal(dto.status, undefined)
    // 验证 DTO 构造，设置后才有效
    dto.status = CampaignStatus.Draft
    assert.notEqual(dto.status, undefined)
  })

  test('instanceof check', () => {
    const dto = new UpdateCampaignStatusDto()
    assert.ok(dto instanceof UpdateCampaignStatusDto)
  })
})
