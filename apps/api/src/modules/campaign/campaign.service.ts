import { randomUUID } from 'node:crypto'
import { Injectable, Optional } from '@nestjs/common'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { MemberService } from '../member/member.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CampaignActionKind,
  CampaignActionStatus,
  CampaignCondition,
  CampaignConditionType,
  CampaignStatus,
  CampaignTrigger,
  type CampaignAction,
  type CampaignDispatch,
  type CampaignPlan
} from './campaign.entity'

const campaignPlanStore = new Map<string, CampaignPlan>()
const campaignDispatchStore = new Map<string, CampaignDispatch>()

export interface CampaignTriggerEvent {
  eventName: CampaignTrigger | string
  tenantContext: RequestTenantContext
  memberId?: string
  orderId?: string
  paymentId?: string
  orderAmount?: number
  memberLevel?: string
  storeId?: string
  brandId?: string
  payload?: Record<string, unknown>
}

export interface CampaignEvaluationResult {
  matchedCampaigns: number
  dispatchedActions: number
  skippedActions: number
  failedActions: number
  dispatches: CampaignDispatch[]
}

@Injectable()
export class CampaignService {
  constructor(
    @Optional() private readonly memberService?: MemberService,
    @Optional() private readonly loyaltyService?: LoyaltyService,
    @Optional() private readonly marketingMetricsService?: MarketingMetricsService
  ) {}

  // ── Plan management ────────────────────────────────────────────────

  registerCampaign(input: {
    tenantContext: RequestTenantContext
    code: string
    title: string
    description?: string
    triggerEvent: CampaignTrigger
    conditions: CampaignCondition[]
    actions: CampaignAction[]
    priority?: number
    scheduledStart?: string
    scheduledEnd?: string
  }): CampaignPlan {
    if (input.actions.length === 0) {
      throw new Error('Campaign must declare at least one action')
    }
    for (const [index, action] of input.actions.entries()) {
      this.validateAction(action, index)
    }
    const now = new Date().toISOString()
    const plan: CampaignPlan = {
      planId: `campaign-${randomUUID()}`,
      tenantContext: input.tenantContext,
      code: input.code,
      title: input.title,
      description: input.description,
      status: CampaignStatus.Draft,
      triggerEvent: input.triggerEvent,
      conditions: input.conditions,
      actions: input.actions,
      priority: input.priority ?? 100,
      scheduledStart: input.scheduledStart,
      scheduledEnd: input.scheduledEnd,
      createdAt: now,
      updatedAt: now
    }
    campaignPlanStore.set(plan.planId, plan)
    return plan
  }

  updateCampaignStatus(planId: string, status: CampaignStatus, tenantId: string): CampaignPlan {
    const plan = campaignPlanStore.get(planId)
    if (!plan || plan.tenantContext.tenantId !== tenantId) {
      throw new Error(`Campaign plan not found: ${planId}`)
    }
    this.assertValidStatusTransition(plan.status, status)
    plan.status = status
    plan.updatedAt = new Date().toISOString()
    campaignPlanStore.set(planId, plan)
    return plan
  }

  listCampaigns(tenantId: string, filter?: { status?: CampaignStatus; triggerEvent?: CampaignTrigger }): CampaignPlan[] {
    return Array.from(campaignPlanStore.values())
      .filter((plan) => plan.tenantContext.tenantId === tenantId)
      .filter((plan) => (filter?.status ? plan.status === filter.status : true))
      .filter((plan) => (filter?.triggerEvent ? plan.triggerEvent === filter.triggerEvent : true))
      .sort((a, b) => a.priority - b.priority)
  }

  getCampaign(planId: string, tenantId: string): CampaignPlan | undefined {
    const plan = campaignPlanStore.get(planId)
    if (!plan || plan.tenantContext.tenantId !== tenantId) return undefined
    return plan
  }

  listDispatches(tenantId: string, filter?: { planId?: string; memberId?: string; status?: CampaignActionStatus }): CampaignDispatch[] {
    return Array.from(campaignDispatchStore.values())
      .filter((dispatch) => dispatch.tenantContext.tenantId === tenantId)
      .filter((dispatch) => (filter?.planId ? dispatch.planId === filter.planId : true))
      .filter((dispatch) => (filter?.memberId ? dispatch.memberId === filter.memberId : true))
      .filter((dispatch) => (filter?.status ? dispatch.status === filter.status : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ── Trigger evaluation & dispatch ──────────────────────────────────

  evaluateTriggers(event: CampaignTriggerEvent): CampaignEvaluationResult {
    const tenantId = event.tenantContext.tenantId
    // Derive scope fields from tenantContext when not explicitly supplied, so
    // BrandScope/StoreScope conditions can match against tenant-scoped events.
    const enrichedEvent: CampaignTriggerEvent = {
      ...event,
      brandId: event.brandId ?? event.tenantContext.brandId,
      storeId: event.storeId ?? event.tenantContext.storeId
    }
    const candidateCampaigns = Array.from(campaignPlanStore.values())
      .filter((plan) => plan.tenantContext.tenantId === tenantId)
      .filter((plan) => plan.status === CampaignStatus.Active)
      .filter((plan) => plan.triggerEvent === enrichedEvent.eventName)
      .filter((plan) => this.isWithinScheduledWindow(plan))
      .filter((plan) => this.matchesConditions(plan.conditions, enrichedEvent))
      .sort((a, b) => b.priority - a.priority)

    const dispatches: CampaignDispatch[] = []
    let dispatchedActions = 0
    let skippedActions = 0
    let failedActions = 0

    for (const campaign of candidateCampaigns) {
      for (const [index, action] of campaign.actions.entries()) {
        const idempotencyKey = `${campaign.planId}:${index}:${event.memberId ?? '-'}:${event.orderId ?? '-'}`
        const existing = Array.from(campaignDispatchStore.values()).find(
          (d) =>
            d.planId === campaign.planId &&
            d.actionIndex === index &&
            d.memberId === event.memberId &&
            d.orderId === event.orderId
        )
        if (existing) {
          skippedActions += 1
          dispatches.push(existing)
          continue
        }

        const dispatch = this.dispatchAction({
          campaign,
          actionIndex: index,
          action,
          event,
          idempotencyKey
        })

        dispatches.push(dispatch)
        if (dispatch.status === CampaignActionStatus.Dispatched) dispatchedActions += 1
        else if (dispatch.status === CampaignActionStatus.Skipped) skippedActions += 1
        else if (dispatch.status === CampaignActionStatus.Failed) failedActions += 1
      }
    }

    this.marketingMetricsService?.incrCampaignTrigger(
      candidateCampaigns.length,
      dispatchedActions,
      tenantId
    )

    return {
      matchedCampaigns: candidateCampaigns.length,
      dispatchedActions,
      skippedActions,
      failedActions,
      dispatches
    }
  }

  // ── Internals ──────────────────────────────────────────────────────

  private validateAction(action: CampaignAction, index: number): void {
    switch (action.kind) {
      case CampaignActionKind.AwardPoints:
        if (!action.params.pointsAmount || action.params.pointsAmount <= 0) {
          throw new Error(`Campaign action[${index}] (AwardPoints) requires positive pointsAmount`)
        }
        break
      case CampaignActionKind.IssueCoupon:
        if (!action.params.couponPlanId) {
          throw new Error(`Campaign action[${index}] (IssueCoupon) requires couponPlanId`)
        }
        break
      case CampaignActionKind.IssueBlindbox:
        if (!action.params.blindboxPlanId) {
          throw new Error(`Campaign action[${index}] (IssueBlindbox) requires blindboxPlanId`)
        }
        break
      case CampaignActionKind.RecommendTag:
        if (!action.params.tagCode) {
          throw new Error(`Campaign action[${index}] (RecommendTag) requires tagCode`)
        }
        break
    }
  }

  private assertValidStatusTransition(from: CampaignStatus, to: CampaignStatus): void {
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.Draft]: [CampaignStatus.Scheduled, CampaignStatus.Active, CampaignStatus.Paused],
      [CampaignStatus.Scheduled]: [CampaignStatus.Active, CampaignStatus.Paused, CampaignStatus.Draft, CampaignStatus.Completed],
      [CampaignStatus.Active]: [CampaignStatus.Paused, CampaignStatus.Completed],
      [CampaignStatus.Paused]: [CampaignStatus.Active, CampaignStatus.Completed, CampaignStatus.Draft],
      [CampaignStatus.Completed]: []
    }
    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid campaign status transition: ${from} → ${to}`)
    }
  }

  private isWithinScheduledWindow(plan: CampaignPlan): boolean {
    const eventTime = new Date().toISOString()
    if (plan.scheduledStart && eventTime < plan.scheduledStart) return false
    if (plan.scheduledEnd && eventTime > plan.scheduledEnd) return false
    return true
  }

  private matchesConditions(conditions: CampaignCondition[], event: CampaignTriggerEvent): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case CampaignConditionType.MinOrderAmount:
          if (typeof event.orderAmount !== 'number' || event.orderAmount < Number(condition.value)) {
            return false
          }
          break
        case CampaignConditionType.MemberLevel:
          if (!event.memberLevel || !this.valueMatchesString(event.memberLevel, condition.value)) {
            return false
          }
          break
        case CampaignConditionType.StoreScope:
          if (!event.storeId || !this.valueMatchesString(event.storeId, condition.value)) {
            return false
          }
          break
        case CampaignConditionType.BrandScope:
          if (!event.brandId || !this.valueMatchesString(event.brandId, condition.value)) {
            return false
          }
          break
      }
    }
    return true
  }

  private valueMatchesString(actual: string, expected: number | string | string[]): boolean {
    if (typeof expected === 'string') return actual === expected
    if (Array.isArray(expected)) return expected.includes(actual)
    return false
  }

  private dispatchAction(input: {
    campaign: CampaignPlan
    actionIndex: number
    action: CampaignAction
    event: CampaignTriggerEvent
    idempotencyKey: string
  }): CampaignDispatch {
    const { campaign, actionIndex, action, event } = input
    const now = new Date().toISOString()
    let status: CampaignActionStatus = CampaignActionStatus.Dispatched
    let errorMessage: string | undefined
    let resultRef: string | undefined

    try {
      switch (action.kind) {
        case CampaignActionKind.AwardPoints:
          if (!event.memberId) {
            status = CampaignActionStatus.Skipped
            errorMessage = 'memberId is required for AwardPoints'
          } else if (!this.memberService) {
            status = CampaignActionStatus.Skipped
            errorMessage = 'MemberService is not configured'
          } else {
            const amount = action.params.pointsAmount ?? 0
            const reason = action.params.pointsReason ?? campaign.code
            this.memberService.awardPoints(event.memberId, amount, event.tenantContext)
            resultRef = `points+${amount}:${reason}`
          }
          break
        case CampaignActionKind.IssueCoupon:
          if (!event.memberId) {
            status = CampaignActionStatus.Skipped
            errorMessage = 'memberId is required for IssueCoupon'
          } else if (!this.loyaltyService) {
            status = CampaignActionStatus.Skipped
            errorMessage = 'LoyaltyService is not configured'
          } else {
            const redemption = this.loyaltyService.issueCouponFromPlan({
              tenantContext: event.tenantContext,
              memberId: event.memberId,
              planId: action.params.couponPlanId!,
              source: `campaign:${campaign.code}`
            })
            resultRef = redemption.redemptionId
          }
          break
        case CampaignActionKind.IssueBlindbox:
          if (!event.memberId) {
            status = CampaignActionStatus.Skipped
            errorMessage = 'memberId is required for IssueBlindbox'
          } else if (!this.loyaltyService) {
            status = CampaignActionStatus.Skipped
            errorMessage = 'LoyaltyService is not configured'
          } else {
            const fulfillment = this.loyaltyService.issueBlindboxFromPlan({
              tenantContext: event.tenantContext,
              memberId: event.memberId,
              planId: action.params.blindboxPlanId!,
              quantity: action.params.blindboxQuantity
            })
            resultRef = fulfillment.fulfillmentId
          }
          break
        case CampaignActionKind.RecommendTag:
          resultRef = `tag:${action.params.tagCode}`
          break
      }
    } catch (error) {
      status = CampaignActionStatus.Failed
      errorMessage = error instanceof Error ? error.message : 'unknown-dispatch-error'
    }

    const dispatch: CampaignDispatch = {
      dispatchId: `dispatch-${randomUUID()}`,
      planId: campaign.planId,
      actionIndex,
      tenantContext: event.tenantContext,
      memberId: event.memberId,
      orderId: event.orderId,
      paymentId: event.paymentId,
      triggerEvent: event.eventName,
      status,
      errorMessage,
      resultRef,
      createdAt: now
    }
    campaignDispatchStore.set(dispatch.dispatchId, dispatch)
    return dispatch
  }

  resetCampaignStoresForTests(): void {
    campaignPlanStore.clear()
    campaignDispatchStore.clear()
  }
}
