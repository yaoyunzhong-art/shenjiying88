import { Inject, Injectable, Optional } from '@nestjs/common'
import {
  hasCapability,
  getRoleBootstrapConfig,
  canAccessRoleMenu,
  ROLE_BOOTSTRAP_CONFIGS,
  type WorkbenchCapability,
  type RoleBootstrapConfig
} from './workbench.entity'
import { ClientChannel, UserRole, type RoleWorkbench } from '@m5/domain'
import {
  adminRuntimeActionPresetContractMap,
  defaultRoleWorkbenchContracts,
  foundationSupportedClients,
  type RuntimeGovernanceCallbackRequest,
  type RuntimeGovernanceReceipt,
  type RuntimeGovernanceReplayRequest,
  type RuntimeGovernanceSubmitRequest,
  type RuntimeGovernanceSyncRequest,
  type RoleWorkbenchContract,
  type WorkbenchBootstrapResponse
} from '@m5/types'
import {
  toBootstrapFoundationMetadata,
  toRegionalLoginPolicyContract
} from '../bootstrap/bootstrap.contract'
import { FoundationService } from '../foundation/foundation.service'
import { type CurrentActorValue } from '../foundation/identity-access/identity-access.decorator'
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service'
import { MarketService } from '../market/market.service'
import { toMarketProfileContract } from '../market/market.contract'
import { PortalService } from '../portal/portal.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  EVENT_BUS_SERVICE,
  type EventBusService
} from '../../infrastructure/event-bus/event-bus.module'
import {
  type WorkbenchActionReplayDto,
  type WorkbenchApprovalExecuteDto,
  type WorkbenchHandlerCallbackDto,
  type WorkbenchHandlerSyncDto,
  type WorkbenchRuntimeReplaySubmitDto,
  type WorkbenchSecretRotationDto
} from './workbench.dto'
import { toRoleWorkbenchContract, toTenantContextContract } from './workbench.contract'

/** EventBus event:receipt 已生成(供 notification 订阅发通知) */
export const RECEIPT_COMPLETED_EVENT = 'ReceiptCompleted'
export const RECEIPT_FAILED_EVENT = 'ReceiptFailed'

/** Phase-13 task 12:publish receipt event to EventBus if available */
async function publishReceiptEvent(
  bus: EventBusService | undefined,
  receipt: RuntimeGovernanceReceipt,
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue | undefined,
  status: 'completed' | 'failed'
): Promise<void> {
  if (!bus) return
  const eventName = status === 'completed' ? RECEIPT_COMPLETED_EVENT : RECEIPT_FAILED_EVENT
  try {
    await bus.publish(eventName, {
      receiptCode: receipt.receiptCode,
      state: receipt.state,
      tenantId: tenantContext?.tenantId,
      brandId: tenantContext?.brandId,
      storeId: tenantContext?.storeId,
      actorId: actorContext?.actorId
    }, {
      tenantId: tenantContext?.tenantId,
      receiptCode: receipt.receiptCode
    })
  } catch {
    // 不阻断主流程
  }
}

@Injectable()
export class WorkbenchService {
  constructor(
    private readonly marketService: MarketService,
    private readonly portalService: PortalService,
    private readonly foundationService: FoundationService,
    private readonly runtimeGovernanceService: RuntimeGovernanceService,
    @Optional() @Inject(EVENT_BUS_SERVICE) private readonly eventBus?: EventBusService
  ) {}

  getRoleWorkbenches(): RoleWorkbench[] {
    return defaultRoleWorkbenchContracts.map(toRoleWorkbench)
  }

  getBootstrap(context: RequestTenantContext): WorkbenchBootstrapResponse {
    const marketProfile = this.marketService.getMergedProfile(context)
    const portals = this.portalService.getBootstrap(context)
    const foundationDependency = this.foundationService.getDependencySummary('workbench')

    return {
      tenantContext: toTenantContextContract(context),
      workbenches: this.getRoleWorkbenches().map(toRoleWorkbenchContract),
      storePortals: [portals.storePortal],
      tenantPortal: portals.tenantPortal,
      brandPortal: portals.brandPortal,
      marketProfile: toMarketProfileContract(marketProfile),
      regionalLoginPolicies: toRegionalLoginPolicyContract(
        portals.tenantPortal.loginEntry.loginPath,
        portals.tenantPortal.loginEntry.ssoEnabled
      ),
      supportedLocales: marketProfile.locale.supportedLanguages,
      supportedClients: [...foundationSupportedClients],
      ...toBootstrapFoundationMetadata(foundationDependency)
    }
  }

  /**
   * 检查角色是否拥有指定能力
   */
  checkCapability(role: string, capability: string): boolean {
    return hasCapability(role, capability as WorkbenchCapability)
  }

  submitApprovalExecution(
    input: WorkbenchApprovalExecuteDto,
    tenantContext: RequestTenantContext | undefined,
    actorContext: CurrentActorValue
  ): Promise<RuntimeGovernanceReceipt> {
    const preset = adminRuntimeActionPresetContractMap['approval-execution']
    return this.runtimeGovernanceService.submitAction(
      buildWorkbenchSubmitRequest(
        {
          action: preset.action,
          nextStep: preset.nextStep,
          recommendedAction: preset.recommendedAction,
          requestEndpoint: preset.requestEndpoint,
          handlerName: preset.handlerName,
          payload: {
            ...preset.payload,
            approvalCode: input.approvalCode,
            operatorNote: input.operatorNote,
            challengeProfile: input.challengeProfile ?? String(preset.payload.challengeProfile ?? 'step-up'),
            ...(input.payload ?? {})
          },
          idempotencyKey: input.idempotencyKey
        },
        tenantContext,
        actorContext
      )
    ).then(async (receipt) => {
      await publishReceiptEvent(this.eventBus, receipt, tenantContext, actorContext, 'completed')
      return receipt
    })
  }

  submitSecretRotation(
    input: WorkbenchSecretRotationDto,
    tenantContext: RequestTenantContext | undefined,
    actorContext: CurrentActorValue
  ): Promise<RuntimeGovernanceReceipt> {
    const preset = adminRuntimeActionPresetContractMap['secret-rotation']
    return this.runtimeGovernanceService.submitAction(
      buildWorkbenchSubmitRequest(
        {
          action: preset.action,
          nextStep: preset.nextStep,
          recommendedAction: preset.recommendedAction,
          requestEndpoint: preset.requestEndpoint,
          handlerName: preset.handlerName,
          payload: {
            ...preset.payload,
            secretName: input.secretName,
            rotationReason: input.rotationReason,
            targetScope: input.targetScope ?? String(preset.payload.targetScope ?? 'tenant'),
            ...(input.payload ?? {})
          },
          idempotencyKey: input.idempotencyKey
        },
        tenantContext,
        actorContext
      )
    ).then(async (receipt) => {
      await publishReceiptEvent(this.eventBus, receipt, tenantContext, actorContext, 'completed')
      return receipt
    })
  }

  submitRuntimeReplay(
    input: WorkbenchRuntimeReplaySubmitDto,
    tenantContext: RequestTenantContext | undefined,
    actorContext: CurrentActorValue
  ): Promise<RuntimeGovernanceReceipt> {
    const preset = adminRuntimeActionPresetContractMap['runtime-replay']
    return this.runtimeGovernanceService.submitAction(
      buildWorkbenchSubmitRequest(
        {
          action: preset.action,
          nextStep: preset.nextStep,
          recommendedAction: preset.recommendedAction,
          requestEndpoint: preset.requestEndpoint,
          handlerName: preset.handlerName,
          payload: {
            ...preset.payload,
            sourceReceiptCode: input.sourceReceiptCode,
            operatorNote: input.operatorNote,
            ...(input.payload ?? {})
          },
          idempotencyKey: input.idempotencyKey
        },
        tenantContext,
        actorContext
      )
    ).then(async (receipt) => {
      await publishReceiptEvent(this.eventBus, receipt, tenantContext, actorContext, 'completed')
      return receipt
    })
  }

  getActionReceipt(receiptCode: string) {
    return this.runtimeGovernanceService.getActionReceipt(receiptCode)
  }

  syncHandlerReceipt(
    receiptCode: string,
    handlerName: string,
    input: WorkbenchHandlerSyncDto,
    tenantContext: RequestTenantContext | undefined,
    actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.syncAction(
      receiptCode,
      buildWorkbenchSyncRequest(handlerName, input, tenantContext, actorContext)
    )
  }

  recordHandlerCallback(
    receiptCode: string,
    _handlerName: string,
    input: WorkbenchHandlerCallbackDto,
    tenantContext: RequestTenantContext | undefined,
    actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.recordCallback(
      receiptCode,
      buildWorkbenchCallbackRequest(input, tenantContext, actorContext)
    )
  }

  /**
   * 获取角色扩展引导配置
   */
  getRoleBootstrapConfig(role: string): RoleBootstrapConfig | undefined {
    return getRoleBootstrapConfig(role)
  }

  /**
   * 获取所有已定义的引导配置角色列表
   */
  getBootstrappedRoles(): string[] {
    return Object.keys(ROLE_BOOTSTRAP_CONFIGS)
  }

  /**
   * 检查角色是否可访问目标角色的菜单
   */
  checkMenuAccess(actorRole: string, targetMenuRole: string): boolean {
    return canAccessRoleMenu(actorRole, targetMenuRole)
  }

  replayActionReceipt(
    receiptCode: string,
    input: WorkbenchActionReplayDto,
    tenantContext: RequestTenantContext | undefined,
    actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.replayAction(
      receiptCode,
      buildWorkbenchReplayRequest(input, tenantContext, actorContext)
    )
  }
}

function toRoleWorkbench(contract: RoleWorkbenchContract): RoleWorkbench {
  return {
    role: contract.role as UserRole,
    channel: contract.channel as ClientChannel,
    title: contract.title,
    description: contract.description,
    marketCodes: [...contract.marketCodes],
    navItems: contract.navItems.map((item) => ({
      key: item.key,
      label: item.label,
      href: item.href,
      description: item.description
    }))
  }
}

function buildWorkbenchSubmitRequest(
  input: {
    action: RuntimeGovernanceSubmitRequest['action']
    nextStep: RuntimeGovernanceSubmitRequest['nextStep']
    recommendedAction: RuntimeGovernanceSubmitRequest['recommendedAction']
    requestEndpoint: string
    handlerName: string
    payload: Record<string, unknown>
    idempotencyKey: string
  },
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue
): RuntimeGovernanceSubmitRequest {
  return {
    app: 'admin-web',
    action: input.action,
    nextStep: input.nextStep,
    riskLevel: 'high',
    requestEndpoint: input.requestEndpoint,
    payload: input.payload,
    payloadSummary: JSON.stringify(input.payload),
    recommendedAction: input.recommendedAction,
    handlerName: input.handlerName,
    idempotencyKey: input.idempotencyKey,
    actorId: actorContext?.actorId,
    tenantId: tenantContext?.tenantId,
    brandId: tenantContext?.brandId,
    storeId: tenantContext?.storeId,
    marketCode: tenantContext?.marketCode
  }
}

function buildWorkbenchSyncRequest(
  handlerName: string,
  input: WorkbenchHandlerSyncDto,
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue
): RuntimeGovernanceSyncRequest {
  return {
    handlerName,
    ticketCode: input.ticketCode,
    idempotencyKey: input.idempotencyKey,
    actorId: actorContext?.actorId,
    tenantId: tenantContext?.tenantId
  }
}

function buildWorkbenchCallbackRequest(
  input: WorkbenchHandlerCallbackDto,
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue
): RuntimeGovernanceCallbackRequest {
  return {
    callbackStatus: input.callbackStatus,
    ackToken: input.ackToken,
    lastEvent: input.lastEvent,
    summary: input.summary,
    idempotencyKey: input.idempotencyKey,
    actorId: actorContext?.actorId,
    tenantId: tenantContext?.tenantId
  }
}

function buildWorkbenchReplayRequest(
  input: WorkbenchActionReplayDto,
  tenantContext: RequestTenantContext | undefined,
  actorContext: CurrentActorValue
): RuntimeGovernanceReplayRequest {
  return {
    ledgerKey: input.ledgerKey,
    requestedFrom: input.requestedFrom,
    ticketCode: input.ticketCode,
    idempotencyKey: input.idempotencyKey,
    actorId: actorContext?.actorId,
    tenantId: tenantContext?.tenantId
  }
}
