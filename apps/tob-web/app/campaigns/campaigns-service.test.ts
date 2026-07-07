import assert from 'node:assert/strict'
import { afterEach, describe, test } from 'node:test'
import { MOCK_CAMPAIGNS } from '../campaigns-data'
import {
  loadCampaignDispatches,
  loadGlobalCampaignDispatches,
  inferCampaignChannel,
  inferCampaignType,
  loadCampaignDetail,
  loadCampaigns,
  mapDispatchStatusLabel,
  mapLiveCampaignToItem,
  mapLiveDispatchToItem,
  mapLiveStatus,
  mapUiStatusToLive,
  transitionCampaignStatus,
  type LiveCampaignDispatch,
  type LiveCampaignPlan
} from './campaigns-service'

const originalFetch = globalThis.fetch

function makeLiveCampaign(overrides: Partial<LiveCampaignPlan> = {}): LiveCampaignPlan {
  return {
    planId: 'plan-001',
    tenantContext: {
      tenantId: 'tenant-demo',
      brandId: 'brand-001',
      storeId: 'store-001'
    },
    code: 'LIVE-001',
    title: 'Live Campaign',
    status: 'ACTIVE',
    triggerEvent: 'payment.success',
    conditions: [],
    actions: [{ kind: 'ISSUE_COUPON', params: { couponPlanId: 'coupon-001' } }],
    priority: 100,
    scheduledStart: '2026-07-01T00:00:00.000Z',
    scheduledEnd: '2026-07-31T00:00:00.000Z',
    createdAt: '2026-06-30T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    ...overrides
  }
}

function makeLiveDispatch(overrides: Partial<LiveCampaignDispatch> = {}): LiveCampaignDispatch {
  return {
    dispatchId: 'dispatch-001',
    planId: 'plan-001',
    actionIndex: 0,
    tenantContext: {
      tenantId: 'tenant-demo',
      brandId: 'brand-001',
      storeId: 'store-001'
    },
    memberId: 'member-001',
    triggerEvent: 'payment.success',
    status: 'DISPATCHED',
    resultRef: 'coupon-001',
    createdAt: '2026-07-02T10:00:00.000Z',
    ...overrides
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('campaigns-service mapping', () => {
  test('mapLiveStatus converts API enum to UI status', () => {
    assert.equal(mapLiveStatus('DRAFT'), 'draft')
    assert.equal(mapLiveStatus('SCHEDULED'), 'scheduled')
    assert.equal(mapLiveStatus('ACTIVE'), 'active')
    assert.equal(mapLiveStatus('PAUSED'), 'paused')
    assert.equal(mapLiveStatus('COMPLETED'), 'ended')
  })

  test('mapUiStatusToLive converts UI status to API enum', () => {
    assert.equal(mapUiStatusToLive('draft'), 'DRAFT')
    assert.equal(mapUiStatusToLive('scheduled'), 'SCHEDULED')
    assert.equal(mapUiStatusToLive('active'), 'ACTIVE')
    assert.equal(mapUiStatusToLive('paused'), 'PAUSED')
    assert.equal(mapUiStatusToLive('ended'), 'COMPLETED')
    assert.equal(mapUiStatusToLive('archived'), 'COMPLETED')
  })

  test('inferCampaignType and inferCampaignChannel derive fallback view attributes', () => {
    assert.equal(
      inferCampaignType(makeLiveCampaign({ actions: [{ kind: 'RECOMMEND_TAG' }] })),
      'cross_sell'
    )
    assert.equal(
      inferCampaignChannel(makeLiveCampaign({ conditions: [{ type: 'STORE_SCOPE', value: ['store-001'] }] })),
      'offline'
    )
  })

  test('mapLiveCampaignToItem projects rule campaign into existing dashboard shape', () => {
    const item = mapLiveCampaignToItem(
      makeLiveCampaign({
        status: 'SCHEDULED',
        triggerEvent: 'member.activity-recurring',
        actions: [{ kind: 'AWARD_POINTS' }]
      })
    )

    assert.equal(item.id, 'plan-001')
    assert.equal(item.name, 'Live Campaign')
    assert.equal(item.status, 'scheduled')
    assert.equal(item.type, 'retention')
    assert.equal(item.channel, 'online')
    assert.equal(item.startDate, '2026-07-01')
    assert.equal(item.endDate, '2026-07-31')
    assert.equal(item.createdBy, 'store-001')
    assert.equal(item.source, 'live')
    assert.equal(item.deletionDisabled, true)
  })

  test('mapDispatchStatusLabel and mapLiveDispatchToItem project dispatch records into read model', () => {
    assert.equal(mapDispatchStatusLabel('PENDING'), '待执行')
    assert.equal(mapDispatchStatusLabel('FAILED'), '失败')

    const item = mapLiveDispatchToItem(
      makeLiveDispatch({
        status: 'FAILED',
        errorMessage: 'coupon exhausted'
      })
    )

    assert.equal(item.dispatchId, 'dispatch-001')
    assert.equal(item.planId, 'plan-001')
    assert.equal(item.actionIndex, 0)
    assert.equal(item.actionLabel, '动作 #1')
    assert.equal(item.status, 'FAILED')
    assert.equal(item.statusLabel, '失败')
    assert.equal(item.memberLabel, 'member-001')
    assert.equal(item.resultLabel, 'coupon exhausted')
    assert.equal(item.scopeLabel, 'store-001')
    assert.equal(item.resultKind, 'unknown')
    assert.equal(item.resultTypeLabel, '执行失败')
    assert.equal(item.resultDetailLabel, 'coupon exhausted')
    assert.equal(item.errorMessage, 'coupon exhausted')
  })

  test('mapLiveDispatchToItem parses points and tag result refs into readable labels', () => {
    const pointsItem = mapLiveDispatchToItem(
      makeLiveDispatch({
        resultRef: 'points+100:welcome',
        errorMessage: undefined
      })
    )
    const tagItem = mapLiveDispatchToItem(
      makeLiveDispatch({
        resultRef: 'tag:new-vip',
        errorMessage: undefined
      })
    )

    assert.equal(pointsItem.resultKind, 'points')
    assert.equal(pointsItem.resultTypeLabel, '积分发放')
    assert.equal(pointsItem.resultDetailLabel, '+100 积分 / welcome')
    assert.equal(tagItem.resultKind, 'tag')
    assert.equal(tagItem.resultTypeLabel, '标签推荐')
    assert.equal(tagItem.resultDetailLabel, 'new-vip')
  })

  test('mapLiveDispatchToItem parses coupon, blindbox, and unknown result refs with correct kind', () => {
    const couponItem = mapLiveDispatchToItem(
      makeLiveDispatch({ resultRef: 'redemption=coupon-001', errorMessage: undefined })
    )
    const blindboxItem = mapLiveDispatchToItem(
      makeLiveDispatch({ resultRef: 'fulfillment=blindbox-xyz', errorMessage: undefined })
    )
    const unknownItem = mapLiveDispatchToItem(
      makeLiveDispatch({ resultRef: 'custom:anything', errorMessage: undefined })
    )
    const noneItem = mapLiveDispatchToItem(
      makeLiveDispatch({ resultRef: undefined, errorMessage: undefined })
    )

    assert.equal(couponItem.resultKind, 'coupon')
    assert.equal(couponItem.resultTypeLabel, '优惠券发放')
    assert.equal(blindboxItem.resultKind, 'blindbox')
    assert.equal(blindboxItem.resultTypeLabel, '盲盒发放')
    assert.equal(unknownItem.resultKind, 'unknown')
    assert.equal(unknownItem.resultTypeLabel, '执行回执')
    assert.equal(noneItem.resultKind, 'none')
    assert.equal(noneItem.resultTypeLabel, '无回执')
  })
})

describe('campaigns-service loading', () => {
  test('loadCampaigns returns mapped live items when proxy succeeds', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify([makeLiveCampaign(), makeLiveCampaign({ planId: 'plan-002', code: 'LIVE-002' })]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch

    const items = await loadCampaigns()

    assert.equal(items.length, 2)
    assert.equal(items[0]?.id, 'plan-001')
    assert.equal(items[0]?.status, 'active')
  })

  test('loadCampaigns falls back to mock campaigns when proxy fails', async () => {
    globalThis.fetch = (async () => {
      throw new Error('offline')
    }) as typeof fetch

    const items = await loadCampaigns()

    assert.equal(items.length, MOCK_CAMPAIGNS.length)
    assert.equal(items[0]?.source, undefined)
  })

  test('loadCampaignDetail returns mapped live item and transitionCampaignStatus patches live status', async () => {
    const calls: string[] = []

    globalThis.fetch = (async (input, init) => {
      calls.push(`${init?.method ?? 'GET'} ${String(input)}`)
      if ((init?.method ?? 'GET') === 'PATCH') {
        return new Response(JSON.stringify(makeLiveCampaign({ status: 'PAUSED' })), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
      return new Response(JSON.stringify(makeLiveCampaign()), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const detail = await loadCampaignDetail('plan-001')
    const updated = await transitionCampaignStatus('plan-001', 'paused')

    assert.equal(detail?.id, 'plan-001')
    assert.equal(updated?.status, 'paused')
    assert.deepEqual(calls, ['GET /api/campaigns/plan-001', 'PATCH /api/campaigns/plan-001'])
  })

  test('loadCampaignDispatches returns mapped dispatch records and falls back to empty array', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify([makeLiveDispatch()]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch

    const liveItems = await loadCampaignDispatches('plan-001')

    assert.equal(liveItems.length, 1)
    assert.equal(liveItems[0]?.dispatchId, 'dispatch-001')
    assert.equal(liveItems[0]?.statusLabel, '已下发')
    assert.equal(liveItems[0]?.resultRef, 'coupon-001')
    assert.equal(liveItems[0]?.resultTypeLabel, '优惠券发放')

    globalThis.fetch = (async () => {
      throw new Error('offline')
    }) as typeof fetch

    const fallbackItems = await loadCampaignDispatches('plan-001')
    assert.deepEqual(fallbackItems, [])
  })

  test('loadGlobalCampaignDispatches returns mapped dispatch records and forwards query state', async () => {
    const calls: string[] = []

    globalThis.fetch = (async (input) => {
      calls.push(String(input))
      return new Response(JSON.stringify([makeLiveDispatch({ planId: 'plan-global' })]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }) as typeof fetch

    const items = await loadGlobalCampaignDispatches({ status: 'DISPATCHED' })

    assert.equal(calls[0], '/api/campaigns/dispatches/list?status=DISPATCHED')
    assert.equal(items.length, 1)
    assert.equal(items[0]?.planId, 'plan-global')
  })
})
