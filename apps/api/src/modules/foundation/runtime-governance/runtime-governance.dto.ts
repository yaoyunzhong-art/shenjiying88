import { IsIn, IsObject, IsOptional, IsString } from 'class-validator'
import type {
  RuntimeGovernanceApiActionKey,
  RuntimeGovernanceCallbackEvent,
  RuntimeGovernanceCallbackStatus,
  RuntimeGovernanceClientApp,
  RuntimeGovernanceNextStep,
  RuntimeGovernanceRecommendedAction,
  RuntimeGovernanceReplaySource,
  RuntimeGovernanceRiskLevel
} from '@m5/types'
import {
  runtimeGovernanceApiActionKeys,
  runtimeGovernanceCallbackEvents,
  runtimeGovernanceCallbackStatuses,
  runtimeGovernanceClientApps,
  runtimeGovernanceNextSteps,
  runtimeGovernanceRecommendedActions,
  runtimeGovernanceReplaySources,
  runtimeGovernanceRiskLevels
} from '@m5/types'

export class SubmitRuntimeGovernanceActionDto {
  @IsIn(runtimeGovernanceClientApps)
  app!: RuntimeGovernanceClientApp

  @IsIn(runtimeGovernanceApiActionKeys)
  action!: RuntimeGovernanceApiActionKey

  @IsIn(runtimeGovernanceNextSteps)
  nextStep!: RuntimeGovernanceNextStep

  @IsIn(runtimeGovernanceRiskLevels)
  riskLevel!: RuntimeGovernanceRiskLevel

  @IsString()
  requestEndpoint!: string

  @IsObject()
  payload!: Record<string, unknown>

  @IsString()
  payloadSummary!: string

  @IsIn(runtimeGovernanceRecommendedActions)
  recommendedAction!: RuntimeGovernanceRecommendedAction

  @IsString()
  handlerName!: string

  @IsString()
  idempotencyKey!: string

  @IsOptional()
  @IsString()
  actorId?: string
}

export class SyncRuntimeGovernanceActionDto {
  @IsString()
  handlerName!: string

  @IsString()
  ticketCode!: string

  @IsString()
  idempotencyKey!: string
}

export class RecordRuntimeGovernanceCallbackDto {
  @IsIn(runtimeGovernanceCallbackStatuses)
  callbackStatus!: RuntimeGovernanceCallbackStatus

  @IsString()
  ackToken!: string

  @IsIn(runtimeGovernanceCallbackEvents)
  lastEvent!: RuntimeGovernanceCallbackEvent

  @IsString()
  summary!: string

  @IsString()
  idempotencyKey!: string
}

export class ReplayRuntimeGovernanceActionDto {
  @IsString()
  ledgerKey!: string

  @IsIn(runtimeGovernanceReplaySources)
  requestedFrom!: RuntimeGovernanceReplaySource

  @IsString()
  ticketCode!: string

  @IsString()
  idempotencyKey!: string
}
