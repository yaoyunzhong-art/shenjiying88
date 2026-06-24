import type {
  CampaignAction,
  CampaignCondition,
  CampaignDispatch,
  CampaignPlan
} from './campaign.entity'

export interface CampaignPlanContract {
  planId: string
  tenantContext: CampaignPlan['tenantContext']
  code: string
  title: string
  description?: string
  status: CampaignPlan['status']
  triggerEvent: CampaignPlan['triggerEvent']
  conditions: CampaignCondition[]
  actions: CampaignAction[]
  priority: number
  scheduledStart?: string
  scheduledEnd?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignDispatchContract {
  dispatchId: string
  planId: string
  actionIndex: number
  tenantContext: CampaignDispatch['tenantContext']
  memberId?: string
  orderId?: string
  paymentId?: string
  triggerEvent: string
  status: CampaignDispatch['status']
  errorMessage?: string
  resultRef?: string
  createdAt: string
}

export interface CampaignEvaluationResultContract {
  matchedCampaigns: number
  dispatchedActions: number
  skippedActions: number
  failedActions: number
  dispatches: CampaignDispatchContract[]
}

export function toCampaignPlanContract(plan: CampaignPlan): CampaignPlanContract {
  return {
    planId: plan.planId,
    tenantContext: plan.tenantContext,
    code: plan.code,
    title: plan.title,
    description: plan.description,
    status: plan.status,
    triggerEvent: plan.triggerEvent,
    conditions: plan.conditions,
    actions: plan.actions,
    priority: plan.priority,
    scheduledStart: plan.scheduledStart,
    scheduledEnd: plan.scheduledEnd,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt
  }
}

export function toCampaignDispatchContract(dispatch: CampaignDispatch): CampaignDispatchContract {
  return {
    dispatchId: dispatch.dispatchId,
    planId: dispatch.planId,
    actionIndex: dispatch.actionIndex,
    tenantContext: dispatch.tenantContext,
    memberId: dispatch.memberId,
    orderId: dispatch.orderId,
    paymentId: dispatch.paymentId,
    triggerEvent: dispatch.triggerEvent,
    status: dispatch.status,
    errorMessage: dispatch.errorMessage,
    resultRef: dispatch.resultRef,
    createdAt: dispatch.createdAt
  }
}
