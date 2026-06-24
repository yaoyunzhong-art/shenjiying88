import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  CampaignActionKind,
  CampaignActionStatus,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
  type CampaignCondition,
  type CampaignAction
} from './campaign.entity'

describe('CampaignEntity', () => {
  test('campaign trigger and status enums are stable', () => {
    assert.equal(CampaignTrigger.PaymentSuccess, 'payment.success')
    assert.equal(CampaignTrigger.MemberProfileSynced, 'member.profile-synced')
    assert.equal(CampaignStatus.Draft, 'DRAFT')
    assert.equal(CampaignStatus.Scheduled, 'SCHEDULED')
    assert.equal(CampaignStatus.Active, 'ACTIVE')
    assert.equal(CampaignStatus.Paused, 'PAUSED')
    assert.equal(CampaignStatus.Completed, 'COMPLETED')
    assert.equal(CampaignActionStatus.Dispatched, 'DISPATCHED')
    assert.equal(CampaignActionStatus.Failed, 'FAILED')
    assert.equal(CampaignActionStatus.Skipped, 'SKIPPED')
    assert.equal(CampaignActionStatus.Pending, 'PENDING')
  })

  test('campaign action and condition enums cover full matrix', () => {
    const actionKinds = Object.values(CampaignActionKind)
    assert.deepEqual(actionKinds.sort(), ['AWARD_POINTS', 'ISSUE_BLINDBOX', 'ISSUE_COUPON', 'RECOMMEND_TAG'])
    const conditionTypes = Object.values(CampaignConditionType)
    assert.deepEqual(conditionTypes.sort(), ['BRAND_SCOPE', 'MEMBER_LEVEL', 'MIN_ORDER_AMOUNT', 'STORE_SCOPE'])
  })

  test('campaign condition and action types can be expressed structurally', () => {
    const condition: CampaignCondition = {
      type: CampaignConditionType.MinOrderAmount,
      value: 100
    }
    const action: CampaignAction = {
      kind: CampaignActionKind.AwardPoints,
      params: { pointsAmount: 50, pointsReason: 'test' }
    }
    assert.equal(condition.type, 'MIN_ORDER_AMOUNT')
    assert.equal(condition.value, 100)
    assert.equal(action.kind, 'AWARD_POINTS')
    assert.equal(action.params.pointsAmount, 50)
  })
})
