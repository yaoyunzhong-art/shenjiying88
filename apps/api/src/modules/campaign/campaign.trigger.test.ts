import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InMemoryEventBus } from '../../infrastructure/event-bus/event-bus.module'
import {
  CampaignActionKind,
  CampaignStatus,
  CampaignTrigger
} from './campaign.entity'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { CampaignService } from './campaign.service'
import { CampaignTriggerService } from './trigger.service'

const tenantContext = {
  tenantId: 'tenant-campaign-trigger',
  brandId: 'brand-campaign-trigger',
  storeId: 'store-campaign-trigger'
}

describe('CampaignTriggerService', () => {
  let eventBus: InMemoryEventBus
  let campaignService: CampaignService
  let marketingMetricsService: MarketingMetricsService
  let triggerService: CampaignTriggerService

  beforeEach(() => {
    eventBus = new InMemoryEventBus()
    marketingMetricsService = new MarketingMetricsService()
    campaignService = new CampaignService(undefined, undefined, marketingMetricsService)
    campaignService.resetCampaignStoresForTests()
    triggerService = new CampaignTriggerService(eventBus, campaignService)
  })

  it('onModuleInit subscribes all built-in trigger events', () => {
    triggerService.onModuleInit()

    assert.equal(triggerService.subscribedEventCount(), 5)
    assert.equal(eventBus.listenerCount('member.registered'), 1)
    assert.equal(eventBus.listenerCount('order.completed'), 1)
    assert.equal(eventBus.listenerCount('share.clicked'), 1)
    assert.equal(eventBus.listenerCount('payment.success'), 1)
    assert.equal(eventBus.listenerCount('member.profile-synced'), 1)
  })

  it('fire dispatches active campaigns through campaign service', async () => {
    const plan = campaignService.registerCampaign({
      tenantContext,
      code: 'PAYMENT-TAG',
      title: 'Payment tag campaign',
      triggerEvent: CampaignTrigger.PaymentSuccess,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'returning' } }]
    })
    campaignService.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const result = await triggerService.fire('payment.success', {
      tenantContext,
      memberId: 'member-1',
      paymentId: 'payment-1'
    })

    assert.ok(result)
    assert.equal(result.matchedCampaigns, 1)
    assert.equal(result.dispatchedActions, 1)

    const metrics = marketingMetricsService.snapshot(tenantContext.tenantId)
    assert.equal(metrics.campaignTriggerTotal, 1)
    assert.equal(metrics.campaignDispatchedTotal, 1)
  })

  it('same member and trigger are throttled to once per day', async () => {
    const plan = campaignService.registerCampaign({
      tenantContext,
      code: 'WELCOME-COUPON',
      title: 'Welcome coupon',
      triggerEvent: 'member.registered' as CampaignTrigger,
      conditions: [],
      actions: [{ kind: CampaignActionKind.RecommendTag, params: { tagCode: 'welcome' } }]
    })
    campaignService.updateCampaignStatus(plan.planId, CampaignStatus.Active, tenantContext.tenantId)

    const first = await triggerService.fire('member.registered', {
      tenantContext,
      memberId: 'member-2'
    })
    const second = await triggerService.fire('member.registered', {
      tenantContext,
      memberId: 'member-2'
    })

    assert.ok(first)
    assert.equal(first.dispatchedActions, 1)
    assert.equal(second, null)
  })
})
