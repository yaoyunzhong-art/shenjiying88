import { Injectable } from '@nestjs/common'
import type {
  FoundationAlertAcknowledgement,
  FoundationAlertAcknowledgementStatus,
  FoundationAlertCatalogItem,
  FoundationAlertCode,
  FoundationAlertTimelineEntry,
  FoundationOperationsAlert,
  FoundationOperationsAlertTriageState,
  RuntimeGovernanceCallbackStallDetail
} from '@m5/types'
import { foundationBootstrapContract, runtimeGovernanceCallbackTimeoutThresholds } from '@m5/types'
import { PrismaService } from '../../prisma/prisma.service'
import type { RequestActorContext, RequestTenantContext } from '../tenant/tenant.types'
import { ConfigurationGovernanceService } from './configuration-governance/configuration-governance.service'
import { IdentityAccessService } from './identity-access/identity-access.service'
import { IntegrationOrchestrationService } from './integration-orchestration/integration-orchestration.service'
import { ResilienceOperationsService } from './resilience-operations/resilience-operations.service'
import { RuntimeGovernanceService } from './runtime-governance/runtime-governance.service'
import { TrustGovernanceService } from './trust-governance/trust-governance.service'
import type {
  FoundationBlueprint,
  FoundationConsumerDescriptor,
  FoundationConsumerKey,
  FoundationGovernanceBaseline,
  FoundationModuleDescriptor
} from './foundation.types'

const supportedOperationsAlertCodes = [
  'approvals-pending',
  'approval-execution-failures',
  'high-risk-audits',
  'blocked-rate-limit-ledgers',
  'secret-rotation-attention',
  'observability-degradation',
  'recovery-drill-attention',
  'runtime-governance-backlog',
  'runtime-callback-stalled'
] as const satisfies readonly FoundationAlertCode[]

type OperationsAlertCode = (typeof supportedOperationsAlertCodes)[number]
type AlertMutationAction = 'ACK' | 'MUTE' | 'UNMUTE'

const operationsAlertCatalog = [
  {
    code: 'approvals-pending',
    defaultSummary: '存在待处理审批单',
    severityPolicy: '待处理审批单数量 >= 5 时为 high，否则为 medium',
    sourceModules: ['trust-governance', 'configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'approval-execution-failures',
    defaultSummary: '存在执行失败且待人工确认的审批单',
    severityPolicy: '只要存在即为 high',
    sourceModules: ['trust-governance', 'configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'high-risk-audits',
    defaultSummary: '存在高风险治理审计事件',
    severityPolicy: '高风险审计数量 >= 5 时为 high，否则为 medium',
    sourceModules: ['trust-governance', 'configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'blocked-rate-limit-ledgers',
    defaultSummary: '存在被封禁中的配额账本',
    severityPolicy: '只要存在即为 medium',
    sourceModules: ['trust-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'secret-rotation-attention',
    defaultSummary: '存在需要轮换或已过期的密钥',
    severityPolicy: '存在 expired secret 时为 high，否则为 medium',
    sourceModules: ['configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'observability-degradation',
    defaultSummary: '存在异常的 metrics/logs/traces 信号',
    severityPolicy: 'critical 信号存在时为 high，否则为 medium',
    sourceModules: ['resilience-operations'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'recovery-drill-attention',
    defaultSummary: '存在待补演练或恢复预案关注项',
    severityPolicy: 'attention 或 staleDrills > 0 时为 medium',
    sourceModules: ['resilience-operations'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'runtime-governance-backlog',
    defaultSummary: '存在待持续跟进的 runtime governance receipt',
    severityPolicy: '存在 high risk backlog 或 backlog >= 5 时为 high，否则为 medium',
    sourceModules: ['runtime-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  },
  {
    code: 'runtime-callback-stalled',
    defaultSummary: '存在等待 callback 回写的 runtime receipt',
    severityPolicy: '只要存在等待 callback 的 receipt 即为 high',
    sourceModules: ['runtime-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true
  }
] as const satisfies readonly Omit<FoundationAlertCatalogItem, 'drilldownPath' | 'ackPath' | 'mutePath' | 'unmutePath'>[]

@Injectable()
export class FoundationService {
  constructor(
    private readonly identityAccessService: IdentityAccessService,
    private readonly configurationGovernanceService: ConfigurationGovernanceService,
    private readonly integrationOrchestrationService: IntegrationOrchestrationService,
    private readonly trustGovernanceService: TrustGovernanceService,
    private readonly resilienceOperationsService: ResilienceOperationsService,
    private readonly runtimeGovernanceService: RuntimeGovernanceService,
    private readonly prisma: PrismaService
  ) {}

  getModuleCatalog(): FoundationModuleDescriptor[] {
    return [
      this.identityAccessService.getDescriptor(),
      this.configurationGovernanceService.getDescriptor(),
      this.integrationOrchestrationService.getDescriptor(),
      this.trustGovernanceService.getDescriptor(),
      this.resilienceOperationsService.getDescriptor(),
      this.runtimeGovernanceService.getDescriptor()
    ]
  }

  getConsumerCatalog(): FoundationConsumerDescriptor[] {
    return [
      {
        consumer: 'market',
        modulePath: 'src/modules/market',
        dependsOn: ['identity-access', 'configuration-governance', 'trust-governance', 'resilience-operations'],
        responsibility: '输出多市场默认值、覆盖链和区域配置快照。',
        handoffContracts: [
          '从 identity-access 读取租户作用域',
          '从 configuration-governance 读取市场配置、登录策略和 feature flags',
          '将核心配置变化接入 trust-governance 审计',
          '遵循 resilience-operations 的灾备恢复基线'
        ],
        recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/markets/bootstrap'],
        governanceTouchpoints: ['/api/v1/foundation/bootstrap', '/api/v1/markets/bootstrap'],
        highRiskEntrypoints: [],
        actionGovernanceExamples: [
          {
            surface: 'admin-web',
            action: 'market-profile-resolve',
            scenario: '运营台读取多市场基线时，在 foundation bootstrap 已就绪的前提下直接拉取 market bootstrap 与覆盖链快照。',
            riskLevel: 'low',
            bootstrapState: 'ready',
            nextStep: 'PROCEED',
            submitState: 'submitted',
            requestEndpoint: '/api/v1/markets/bootstrap'
          },
          {
            surface: 'admin-web',
            action: 'regional-override-preview',
            scenario: '区域覆盖预览若落在只读 fallback 快照上，必须先刷新 foundation bootstrap，避免基于旧 market profile 继续编排。',
            riskLevel: 'medium',
            bootstrapState: 'readonly-fallback',
            nextStep: 'REFRESH',
            submitState: 'blocked',
            requestEndpoint: '/api/v1/markets/bootstrap'
          }
        ],
        runtimeHandoffExamples: [],
        runtimeReceiptExamples: [],
        governanceAlertLifecycleExamples: [
          {
            surface: 'admin-web',
            alertCode: 'observability-degradation',
            stage: 'drilldown',
            scenario: '市场配置异常时，运营台会先从 observability drilldown 查看 callbackBaseUrl、apiBaseUrl 与市场网络摘要。',
            endpoint: '/foundation/overview/alerts/observability-degradation/drilldown',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: null,
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'observability-degradation',
            stage: 'ack',
            scenario: '运营台确认 observability market 告警后，会回写 ACKED 状态，但继续保留在 overview 跟踪。',
            endpoint: '/foundation/overview/alerts/observability-degradation/ack',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'observability-degradation',
            stage: 'mute',
            scenario: '运营台静默 observability market 告警后，会临时从 overview 隐藏，但 drilldown 仍保留市场网络上下文。',
            endpoint: '/foundation/overview/alerts/observability-degradation/mute',
            latestHistoryAction: 'MUTE',
            acknowledgementStatus: 'MUTED',
            visibleInOverview: false,
            availableActions: ['DRILLDOWN', 'ACK', 'UNMUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'observability-degradation',
            stage: 'unmute',
            scenario: '取消静默后，市场 observability 告警重新进入 overview，并恢复 ACK/MUTE 动作。',
            endpoint: '/foundation/overview/alerts/observability-degradation/unmute',
            latestHistoryAction: 'UNMUTE',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          }
        ]
      },
      {
        consumer: 'portal',
        modulePath: 'src/modules/portal',
        dependsOn: [
          'identity-access',
          'configuration-governance',
          'integration-orchestration',
          'trust-governance',
          'resilience-operations'
        ],
        responsibility: '装配 ToB/ToC 门户解析、域名策略、登录入口和通知策略。',
        handoffContracts: [
          '从 identity-access 解析门户身份与组织归属',
          '从 configuration-governance 装配域名/模板/灰度配置',
          '通过 integration-orchestration 接入通知和开放平台网关',
          '由 trust-governance 处理限流、隐私和 AI 治理',
          '遵循 resilience-operations 的恢复预案'
        ],
        recommendedSequence: ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'],
        governanceTouchpoints: [
          '/api/v1/foundation/bootstrap',
          '/api/v1/portals/bootstrap',
          'feature-flags',
          'risk-challenge'
        ],
        highRiskEntrypoints: ['member-login'],
        actionGovernanceExamples: [
          {
            surface: 'miniapp',
            action: 'member-login',
            scenario: '游客态登录先拉起微信登录挑战，再进入会员会话刷新。',
            riskLevel: 'medium',
            bootstrapState: 'challenge-required',
            nextStep: 'CHALLENGE',
            submitState: 'challenge-issued',
            requestEndpoint: '/api/v1/members/session/challenge'
          },
          {
            surface: 'miniapp',
            action: 'booking-submit',
            scenario: '游客态预约提交先收口为登录前置，不允许只靠本地快照放行。',
            riskLevel: 'high',
            bootstrapState: 'scope-mismatch',
            nextStep: 'LOGIN',
            submitState: 'blocked',
            requestEndpoint: '/api/v1/storefront/bookings'
          },
          {
            surface: 'miniapp',
            action: 'coupon-claim',
            scenario: '已登录领券命中高风险时必须先完成微信生态挑战。',
            riskLevel: 'high',
            bootstrapState: 'challenge-required',
            nextStep: 'CHALLENGE',
            submitState: 'challenge-issued',
            requestEndpoint: '/api/v1/storefront/coupons/claim'
          },
          {
            surface: 'app',
            action: 'member-login',
            scenario: '游客态 App 登录先发起原生登录挑战，再刷新会员与设备链路。',
            riskLevel: 'medium',
            bootstrapState: 'challenge-required',
            nextStep: 'CHALLENGE',
            submitState: 'challenge-issued',
            requestEndpoint: '/api/v1/members/session/challenge/native'
          },
          {
            surface: 'app',
            action: 'device-bind',
            scenario: '已登录设备绑定仍需阶梯式挑战，不能由本地快照直接放行。',
            riskLevel: 'high',
            bootstrapState: 'challenge-required',
            nextStep: 'CHALLENGE',
            submitState: 'challenge-issued',
            requestEndpoint: '/api/v1/app/devices/bind'
          },
          {
            surface: 'app',
            action: 'payment-submit',
            scenario: 'fallback 快照上的支付提交必须先刷新实时 bootstrap，默认阻断提交。',
            riskLevel: 'high',
            bootstrapState: 'readonly-fallback',
            nextStep: 'REFRESH',
            submitState: 'blocked',
            requestEndpoint: '/api/v1/app/payments/submit'
          }
        ],
        runtimeHandoffExamples: [
          {
            surface: 'miniapp',
            action: 'booking-submit',
            scenario: '预约提交已进入 handler follow-up，后续通过 callback receipt 与 replay 继续闭环。',
            ticketType: 'HANDLER_CALLBACK',
            ticketStatus: 'ready-for-handler',
            handlerName: 'miniapp-booking-submit-handler',
            syncMode: 'callback-followup',
            syncEndpoint: '/api/v1/storefront/handlers/miniapp-booking-submit-handler/sync',
            callbackStatus: 'awaiting-callback',
            callbackEndpoint: '/api/v1/storefront/handlers/miniapp-booking-submit-handler/callbacks/MINIAPP-BOOKING-SUBMIT-PROCEED',
            replayStatus: 'replay-scheduled',
            replayEndpoint: '/api/v1/storefront/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay',
            retryEscalationAction: 'WAIT_CALLBACK'
          },
          {
            surface: 'miniapp',
            action: 'coupon-claim',
            scenario: '领券挑战未完成时只签发 challenge ticket，callback 维持阻断，重放前先刷新票据。',
            ticketType: 'CHALLENGE_GATE',
            ticketStatus: 'pending-challenge',
            handlerName: 'miniapp-coupon-claim-handler',
            syncMode: 'challenge-gated',
            syncEndpoint: '/api/v1/storefront/handlers/miniapp-coupon-claim-handler/sync',
            callbackStatus: 'callback-blocked',
            callbackEndpoint: '/api/v1/storefront/handlers/miniapp-coupon-claim-handler/callbacks/MINIAPP-COUPON-CLAIM-CHALLENGE',
            replayStatus: 'replay-blocked',
            replayEndpoint: '/api/v1/storefront/actions/MINIAPP-COUPON-CLAIM-CHALLENGE/replay',
            retryEscalationAction: 'REFRESH_TICKET'
          },
          {
            surface: 'app',
            action: 'member-login',
            scenario: 'App 登录提交后进入 native handler callback 跟进，等待服务端回写最终 receipt。',
            ticketType: 'HANDLER_CALLBACK',
            ticketStatus: 'ready-for-handler',
            handlerName: 'native-member-session-handler',
            syncMode: 'callback-followup',
            syncEndpoint: '/api/v1/app/handlers/native-member-session-handler/sync',
            callbackStatus: 'awaiting-callback',
            callbackEndpoint: '/api/v1/app/handlers/native-member-session-handler/callbacks/APP-MEMBER-LOGIN-PROCEED',
            replayStatus: 'replay-scheduled',
            replayEndpoint: '/api/v1/app/actions/APP-MEMBER-LOGIN-PROCEED/replay',
            retryEscalationAction: 'WAIT_CALLBACK'
          },
          {
            surface: 'app',
            action: 'payment-submit',
            scenario: '支付挑战未完成时保留 challenge gate，callback 不落最终结果，重放前必须刷新 ticket。',
            ticketType: 'CHALLENGE_GATE',
            ticketStatus: 'pending-challenge',
            handlerName: 'native-payment-submit-handler',
            syncMode: 'challenge-gated',
            syncEndpoint: '/api/v1/app/handlers/native-payment-submit-handler/sync',
            callbackStatus: 'callback-blocked',
            callbackEndpoint: '/api/v1/app/handlers/native-payment-submit-handler/callbacks/APP-PAYMENT-SUBMIT-CHALLENGE',
            replayStatus: 'replay-blocked',
            replayEndpoint: '/api/v1/app/actions/APP-PAYMENT-SUBMIT-CHALLENGE/replay',
            retryEscalationAction: 'REFRESH_TICKET'
          }
        ],
        runtimeReceiptExamples: [
          {
            surface: 'miniapp',
            action: 'booking-submit',
            scenario: '小程序 booking-submit 优先走 runtime governance submit API，成功后直接拿到可回放 receipt。',
            mode: 'api-first-submit',
            receiptState: 'submitted',
            generatedAtSource: 'api',
            requestEndpoint: '/api/v1/storefront/bookings',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'miniapp:booking-submit:tenant-demo',
            latestEventType: 'runtime-governance.action.submitted'
          },
          {
            surface: 'miniapp',
            action: 'booking-submit',
            scenario: '小程序离线 fallback 下 replay receipt 会转成本地 replay-scheduled，并把 generatedAt 收口为 local-fallback。',
            mode: 'fallback-replay',
            receiptState: 'replay-scheduled',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/storefront/bookings',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/replay',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'miniapp:booking-submit:tenant-demo',
            latestEventType: 'runtime-governance.receipt.replay.scheduled'
          },
          {
            surface: 'miniapp',
            action: 'booking-submit',
            scenario: '小程序离线 fallback 下 sync + callback 会把 receipt 推进到 callback-recorded，并落 callback recorded 事件。',
            mode: 'fallback-callback',
            receiptState: 'callback-recorded',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/storefront/bookings',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-002/callback',
            callbackStatus: 'callback-recorded',
            replayable: true,
            rateLimitScopeKey: 'miniapp:booking-submit:tenant-demo',
            latestEventType: 'runtime-governance.handler.callback.recorded'
          },
          {
            surface: 'app',
            action: 'member-login',
            scenario: 'App member-login 优先走 runtime governance submit API，返回 submitted receipt 与回放能力。',
            mode: 'api-first-submit',
            receiptState: 'submitted',
            generatedAtSource: 'api',
            requestEndpoint: '/api/v1/app/member/session',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'app:member-login:tenant-demo',
            latestEventType: 'runtime-governance.action.submitted'
          },
          {
            surface: 'app',
            action: 'member-login',
            scenario: 'App 离线 fallback 下 replay receipt 会进入 replay-scheduled，继续等待服务端 callback。',
            mode: 'fallback-replay',
            receiptState: 'replay-scheduled',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/app/member/session',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-001/replay',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'app:member-login:tenant-demo',
            latestEventType: 'runtime-governance.receipt.replay.scheduled'
          },
          {
            surface: 'app',
            action: 'member-login',
            scenario: 'App 离线 fallback 下 sync + callback 会把 receipt 推进到 callback-recorded，并记录最终 callback 事件。',
            mode: 'fallback-callback',
            receiptState: 'callback-recorded',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/app/member/session',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/APP-FALLBACK-002/callback',
            callbackStatus: 'callback-recorded',
            replayable: true,
            rateLimitScopeKey: 'app:member-login:tenant-demo',
            latestEventType: 'runtime-governance.handler.callback.recorded'
          }
        ],
        governanceAlertLifecycleExamples: [
          {
            surface: 'miniapp',
            alertCode: 'observability-degradation',
            stage: 'drilldown',
            scenario: '小程序会先进入 observability 告警 drilldown，读取最新 history 与 detail 摘要。',
            endpoint: '/foundation/overview/alerts/observability-degradation/drilldown',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: null,
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'miniapp',
            alertCode: 'observability-degradation',
            stage: 'ack',
            scenario: '小程序对 observability 告警执行 ACK 后，会写回 ACKED 状态与 ACK history。',
            endpoint: '/foundation/overview/alerts/observability-degradation/ack',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'miniapp',
            alertCode: 'observability-degradation',
            stage: 'mute',
            scenario: '小程序静默 observability 告警后，会把 visibleInOverview 切为 false，并返回 MUTED 状态。',
            endpoint: '/foundation/overview/alerts/observability-degradation/mute',
            latestHistoryAction: 'MUTE',
            acknowledgementStatus: 'MUTED',
            visibleInOverview: false,
            availableActions: ['DRILLDOWN', 'ACK', 'UNMUTE']
          },
          {
            surface: 'miniapp',
            alertCode: 'observability-degradation',
            stage: 'unmute',
            scenario: '小程序取消静默后，告警重新回到 overview，并恢复 ACK/MUTE 动作。',
            endpoint: '/foundation/overview/alerts/observability-degradation/unmute',
            latestHistoryAction: 'UNMUTE',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'app',
            alertCode: 'observability-degradation',
            stage: 'drilldown',
            scenario: 'App 会先进入 observability 告警 drilldown，读取最新 history 与 detail 摘要。',
            endpoint: '/foundation/overview/alerts/observability-degradation/drilldown',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: null,
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'app',
            alertCode: 'observability-degradation',
            stage: 'ack',
            scenario: 'App 对 observability 告警执行 ACK 后，会写回 ACKED 状态与 ACK history。',
            endpoint: '/foundation/overview/alerts/observability-degradation/ack',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'app',
            alertCode: 'observability-degradation',
            stage: 'mute',
            scenario: 'App 静默 observability 告警后，会把 visibleInOverview 切为 false，并返回 MUTED 状态。',
            endpoint: '/foundation/overview/alerts/observability-degradation/mute',
            latestHistoryAction: 'MUTE',
            acknowledgementStatus: 'MUTED',
            visibleInOverview: false,
            availableActions: ['DRILLDOWN', 'ACK', 'UNMUTE']
          },
          {
            surface: 'app',
            alertCode: 'observability-degradation',
            stage: 'unmute',
            scenario: 'App 取消静默后，告警重新回到 overview，并恢复 ACK/MUTE 动作。',
            endpoint: '/foundation/overview/alerts/observability-degradation/unmute',
            latestHistoryAction: 'UNMUTE',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          }
        ]
      },
      {
        consumer: 'workbench',
        modulePath: 'src/modules/workbench',
        dependsOn: [
          'identity-access',
          'configuration-governance',
          'integration-orchestration',
          'trust-governance',
          'resilience-operations'
        ],
        responsibility: '装配 PC/PAD 工作台导航、权限边界、离线场景和运营治理入口。',
        handoffContracts: [
          '由 identity-access 输出角色、策略和租户范围',
          '由 configuration-governance 下发渠道能力、灰度和规则配置',
          '通过 integration-orchestration 串联通知、事件和开放平台',
          '由 trust-governance 落审计、风控、PII 与 AI 安全',
          '由 resilience-operations 提供边缘同步和恢复基线'
        ],
        recommendedSequence: [
          '/api/v1/foundation/bootstrap',
          '/api/v1/workbenches/bootstrap',
          '/api/v1/foundation/overview/alerts/catalog'
        ],
        governanceTouchpoints: [
          '/api/v1/foundation/bootstrap',
          '/api/v1/workbenches/bootstrap',
          '/api/v1/foundation/overview/alerts/catalog',
          '/api/v1/foundation/overview/alerts/:code/drilldown'
        ],
        highRiskEntrypoints: ['approval-execution', 'secret-rotation', 'runtime-replay'],
        actionGovernanceExamples: [
          {
            surface: 'admin-web',
            action: 'approval-execution',
            scenario: '总部总控台执行高风险审批前必须完成 step-up challenge，禁止前端直接跳过挑战放行动作。',
            riskLevel: 'high',
            bootstrapState: 'challenge-required',
            nextStep: 'CHALLENGE',
            submitState: 'challenge-issued',
            requestEndpoint: '/api/v1/workbenches/approvals/execute'
          },
          {
            surface: 'admin-web',
            action: 'secret-rotation',
            scenario: '治理读面处于 fallback 时，密钥轮换必须先刷新 foundation bootstrap，避免用旧配置直接轮换。',
            riskLevel: 'high',
            bootstrapState: 'readonly-fallback',
            nextStep: 'REFRESH',
            submitState: 'blocked',
            requestEndpoint: '/api/v1/foundation/configuration-governance/secrets/rotate'
          },
          {
            surface: 'admin-web',
            action: 'runtime-replay',
            scenario: '运营台从 runtime backlog drilldown 发起 replay 时，tenant scope 已就绪即可直接提交统一 replay 请求。',
            riskLevel: 'high',
            bootstrapState: 'ready',
            nextStep: 'PROCEED',
            submitState: 'submitted',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions'
          }
        ],
        runtimeHandoffExamples: [
          {
            surface: 'admin-web',
            action: 'approval-execution',
            scenario: '审批执行命中高风险时保留 challenge gate，必须等待人工完成挑战后再继续执行。',
            ticketType: 'CHALLENGE_GATE',
            ticketStatus: 'pending-challenge',
            handlerName: 'admin-approval-execution-handler',
            syncMode: 'challenge-gated',
            syncEndpoint: '/api/v1/workbenches/handlers/admin-approval-execution-handler/sync',
            callbackStatus: 'callback-blocked',
            callbackEndpoint: '/api/v1/workbenches/handlers/admin-approval-execution-handler/callbacks/ADMIN-APPROVAL-EXECUTION-CHALLENGE',
            replayStatus: 'replay-blocked',
            replayEndpoint: '/api/v1/workbenches/actions/ADMIN-APPROVAL-EXECUTION-CHALLENGE/replay',
            retryEscalationAction: 'REFRESH_TICKET'
          },
          {
            surface: 'admin-web',
            action: 'secret-rotation',
            scenario: '密钥轮换处于只读 fallback 时先保留 block guard，不进入 handler callback，转运维人工复核。',
            ticketType: 'BLOCK_GUARD',
            ticketStatus: 'waiting-prerequisite',
            handlerName: 'admin-secret-rotation-handler',
            syncMode: 'deferred',
            syncEndpoint: '/api/v1/workbenches/handlers/admin-secret-rotation-handler/sync',
            callbackStatus: 'callback-blocked',
            callbackEndpoint: '/api/v1/workbenches/handlers/admin-secret-rotation-handler/callbacks/ADMIN-SECRET-ROTATION-BLOCKED',
            replayStatus: 'replay-skipped',
            replayEndpoint: '/api/v1/workbenches/actions/ADMIN-SECRET-ROTATION-BLOCKED/replay',
            retryEscalationAction: 'OPEN_MANUAL_REVIEW'
          },
          {
            surface: 'admin-web',
            action: 'runtime-replay',
            scenario: '运营台从 backlog 发起统一 replay 后进入 handler follow-up，继续等待 callback 与后续人工确认。',
            ticketType: 'HANDLER_CALLBACK',
            ticketStatus: 'ready-for-handler',
            handlerName: 'admin-runtime-replay-handler',
            syncMode: 'callback-followup',
            syncEndpoint: '/api/v1/workbenches/handlers/admin-runtime-replay-handler/sync',
            callbackStatus: 'awaiting-callback',
            callbackEndpoint: '/api/v1/workbenches/handlers/admin-runtime-replay-handler/callbacks/ADMIN-RUNTIME-REPLAY-PROCEED',
            replayStatus: 'replay-scheduled',
            replayEndpoint: '/api/v1/workbenches/actions/ADMIN-RUNTIME-REPLAY-PROCEED/replay',
            retryEscalationAction: 'WAIT_CALLBACK'
          }
        ],
        runtimeReceiptExamples: [
          {
            surface: 'admin-web',
            action: 'approval-execution',
            scenario: '审批执行会优先走 runtime governance submit API，并返回 challenge-issued receipt 供运营台继续追踪。',
            mode: 'api-first-submit',
            receiptState: 'challenge-issued',
            generatedAtSource: 'api',
            requestEndpoint: '/api/v1/workbenches/approvals/execute',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
            callbackStatus: 'callback-blocked',
            replayable: true,
            rateLimitScopeKey: 'admin-web:approval-execution:tenant-demo',
            latestEventType: 'runtime-governance.action.submitted'
          },
          {
            surface: 'admin-web',
            action: 'runtime-replay',
            scenario: '运营台 runtime replay 优先提交到统一 runtime API，并立即生成 submitted receipt。',
            mode: 'api-first-submit',
            receiptState: 'submitted',
            generatedAtSource: 'api',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'admin-web:runtime-replay:tenant-demo',
            latestEventType: 'runtime-governance.action.submitted'
          },
          {
            surface: 'admin-web',
            action: 'runtime-replay',
            scenario: '运营台 fallback 下重放 receipt 会先标记为 replay-scheduled，并等待统一 callback 回写。',
            mode: 'fallback-replay',
            receiptState: 'replay-scheduled',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WORKBENCH-RUNTIME-REPLAY-001/replay',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'admin-web:runtime-replay:tenant-demo',
            latestEventType: 'runtime-governance.receipt.replay.scheduled'
          },
          {
            surface: 'admin-web',
            action: 'approval-execution',
            scenario: '审批执行在 fallback challenge 回写后，会把 receipt 推进到 callback-recorded 以保留运营留痕。',
            mode: 'fallback-callback',
            receiptState: 'callback-recorded',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/workbenches/approvals/execute',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WORKBENCH-APPROVAL-001/callback',
            callbackStatus: 'callback-recorded',
            replayable: true,
            rateLimitScopeKey: 'admin-web:approval-execution:tenant-demo',
            latestEventType: 'runtime-governance.handler.callback.recorded'
          }
        ],
        governanceAlertLifecycleExamples: [
          {
            surface: 'admin-web',
            alertCode: 'approvals-pending',
            stage: 'drilldown',
            scenario: '工作台会先从 approvals-pending drilldown 读取待处理审批摘要与最近 ACK history。',
            endpoint: '/foundation/overview/alerts/approvals-pending/drilldown',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: null,
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'approvals-pending',
            stage: 'ack',
            scenario: '工作台确认 approvals-pending 后，会回写 ACKED 状态，但仍保留在 overview 里继续跟踪。',
            endpoint: '/foundation/overview/alerts/approvals-pending/ack',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'approvals-pending',
            stage: 'mute',
            scenario: '工作台静默 approvals-pending 后，会暂时从 overview 隐藏，但 drilldown 仍可继续查看。',
            endpoint: '/foundation/overview/alerts/approvals-pending/mute',
            latestHistoryAction: 'MUTE',
            acknowledgementStatus: 'MUTED',
            visibleInOverview: false,
            availableActions: ['DRILLDOWN', 'ACK', 'UNMUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'approvals-pending',
            stage: 'unmute',
            scenario: '工作台取消静默 approvals-pending 后，告警重新进入 overview，并恢复 ACK/MUTE 动作。',
            endpoint: '/foundation/overview/alerts/approvals-pending/unmute',
            latestHistoryAction: 'UNMUTE',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          }
        ]
      },
      {
        consumer: 'lyt-adapter',
        modulePath: 'src/modules/lyt',
        dependsOn: [
          'identity-access',
          'configuration-governance',
          'integration-orchestration',
          'trust-governance',
          'resilience-operations'
        ],
        responsibility: '承接 LYT 凭证、Webhook、门店边缘同步与审计约束。',
        handoffContracts: [
          '从 identity-access 获取门店和设备作用域',
          '从 configuration-governance 获取 LYT secrets、证书和 feature flags',
          '通过 integration-orchestration 接入 webhook gateway、事件总线和开放平台边界',
          '由 trust-governance 处理审计与限流防滥用',
          '通过 resilience-operations 预留弱网回放与容灾基线'
        ],
        recommendedSequence: [
          '/api/v1/foundation/bootstrap',
          '/api/v1/foundation/consumers/lyt-adapter',
          '/api/v1/foundation/overview/alerts/catalog'
        ],
        governanceTouchpoints: [
          '/api/v1/foundation/bootstrap',
          '/api/v1/foundation/consumers/lyt-adapter',
          'webhook-gateway',
          'rate-limit-abuse-control'
        ],
        highRiskEntrypoints: ['webhook-callback', 'edge-replay', 'secret-rotation'],
        actionGovernanceExamples: [
          {
            surface: 'admin-web',
            action: 'webhook-callback',
            scenario: 'LYT webhook 回调进入网关后，只要 foundation scope 已就绪即可直接进入统一治理 submit 链路。',
            riskLevel: 'high',
            bootstrapState: 'ready',
            nextStep: 'PROCEED',
            submitState: 'submitted',
            requestEndpoint: '/api/v1/lyt/webhooks/callback'
          },
          {
            surface: 'admin-web',
            action: 'edge-replay',
            scenario: '门店边缘重放在运营台发起前必须确认实时 foundation bootstrap，避免弱网 fallback 直接驱动重放。',
            riskLevel: 'high',
            bootstrapState: 'readonly-fallback',
            nextStep: 'REFRESH',
            submitState: 'blocked',
            requestEndpoint: '/api/v1/lyt/edge/replay'
          },
          {
            surface: 'admin-web',
            action: 'secret-rotation',
            scenario: 'LYT 密钥轮换属于高风险治理动作，若当前是 fallback snapshot 必须先刷新 secrets posture。',
            riskLevel: 'high',
            bootstrapState: 'readonly-fallback',
            nextStep: 'REFRESH',
            submitState: 'blocked',
            requestEndpoint: '/api/v1/foundation/configuration-governance/secrets/rotate'
          }
        ],
        runtimeHandoffExamples: [
          {
            surface: 'admin-web',
            action: 'webhook-callback',
            scenario: 'LYT webhook callback 会进入 webhook gateway follow-up，继续等待 handler callback 与后续回放判断。',
            ticketType: 'HANDLER_CALLBACK',
            ticketStatus: 'ready-for-handler',
            handlerName: 'lyt-webhook-gateway-handler',
            syncMode: 'callback-followup',
            syncEndpoint: '/api/v1/lyt/handlers/webhook-gateway/sync',
            callbackStatus: 'awaiting-callback',
            callbackEndpoint: '/api/v1/lyt/handlers/webhook-gateway/callbacks/LYT-WEBHOOK-CALLBACK-PROCEED',
            replayStatus: 'replay-scheduled',
            replayEndpoint: '/api/v1/lyt/actions/LYT-WEBHOOK-CALLBACK-PROCEED/replay',
            retryEscalationAction: 'WAIT_CALLBACK'
          },
          {
            surface: 'admin-web',
            action: 'edge-replay',
            scenario: '门店边缘重放进入 edge replay handler 后，先保留 callback follow-up，再决定是否落最终重放结果。',
            ticketType: 'HANDLER_CALLBACK',
            ticketStatus: 'ready-for-handler',
            handlerName: 'lyt-edge-replay-handler',
            syncMode: 'callback-followup',
            syncEndpoint: '/api/v1/lyt/handlers/edge-replay-handler/sync',
            callbackStatus: 'awaiting-callback',
            callbackEndpoint: '/api/v1/lyt/handlers/edge-replay-handler/callbacks/LYT-EDGE-REPLAY-PROCEED',
            replayStatus: 'replay-scheduled',
            replayEndpoint: '/api/v1/lyt/actions/LYT-EDGE-REPLAY-PROCEED/replay',
            retryEscalationAction: 'WAIT_CALLBACK'
          },
          {
            surface: 'admin-web',
            action: 'secret-rotation',
            scenario: 'LYT 密钥轮换处于只读 fallback 时先保留 block guard，不进入最终 callback，转人工复核。',
            ticketType: 'BLOCK_GUARD',
            ticketStatus: 'waiting-prerequisite',
            handlerName: 'lyt-secret-rotation-handler',
            syncMode: 'deferred',
            syncEndpoint: '/api/v1/lyt/handlers/lyt-secret-rotation-handler/sync',
            callbackStatus: 'callback-blocked',
            callbackEndpoint: '/api/v1/lyt/handlers/lyt-secret-rotation-handler/callbacks/LYT-SECRET-ROTATION-BLOCKED',
            replayStatus: 'replay-skipped',
            replayEndpoint: '/api/v1/lyt/actions/LYT-SECRET-ROTATION-BLOCKED/replay',
            retryEscalationAction: 'OPEN_MANUAL_REVIEW'
          }
        ],
        runtimeReceiptExamples: [
          {
            surface: 'admin-web',
            action: 'webhook-callback',
            scenario: 'LYT webhook callback 优先走统一 runtime governance submit API，并生成可追踪 receipt。',
            mode: 'api-first-submit',
            receiptState: 'submitted',
            generatedAtSource: 'api',
            requestEndpoint: '/api/v1/lyt/webhooks/callback',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'admin-web:webhook-callback:tenant-demo',
            latestEventType: 'runtime-governance.action.submitted'
          },
          {
            surface: 'admin-web',
            action: 'edge-replay',
            scenario: '运营台 edge replay 会先向统一 runtime API 提交 replay receipt，再等待后续 callback 回写。',
            mode: 'api-first-submit',
            receiptState: 'submitted',
            generatedAtSource: 'api',
            requestEndpoint: '/api/v1/lyt/edge/replay',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'admin-web:edge-replay:tenant-demo',
            latestEventType: 'runtime-governance.action.submitted'
          },
          {
            surface: 'admin-web',
            action: 'edge-replay',
            scenario: '弱网 fallback 下的 edge replay 会先把 receipt 标记为 replay-scheduled，再等待统一 handler 回放。',
            mode: 'fallback-replay',
            receiptState: 'replay-scheduled',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/lyt/edge/replay',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/LYT-EDGE-REPLAY-001/replay',
            callbackStatus: 'awaiting-callback',
            replayable: true,
            rateLimitScopeKey: 'admin-web:edge-replay:tenant-demo',
            latestEventType: 'runtime-governance.receipt.replay.scheduled'
          },
          {
            surface: 'admin-web',
            action: 'webhook-callback',
            scenario: 'LYT webhook fallback callback 会把 receipt 推进到 callback-recorded，并保留最终 handler 事件。',
            mode: 'fallback-callback',
            receiptState: 'callback-recorded',
            generatedAtSource: 'local-fallback',
            requestEndpoint: '/api/v1/lyt/webhooks/callback',
            runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/LYT-WEBHOOK-CALLBACK-001/callback',
            callbackStatus: 'callback-recorded',
            replayable: true,
            rateLimitScopeKey: 'admin-web:webhook-callback:tenant-demo',
            latestEventType: 'runtime-governance.handler.callback.recorded'
          }
        ],
        governanceAlertLifecycleExamples: [
          {
            surface: 'admin-web',
            alertCode: 'runtime-callback-stalled',
            stage: 'drilldown',
            scenario: 'LYT callback 堵塞时，运营台会先进入 runtime-callback-stalled drilldown 查看 callback backlog 与 handler 摘要。',
            endpoint: '/foundation/overview/alerts/runtime-callback-stalled/drilldown',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: null,
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'runtime-callback-stalled',
            stage: 'ack',
            scenario: '运营台确认 runtime-callback-stalled 后，会回写 ACKED 状态并继续追踪 callback backlog。',
            endpoint: '/foundation/overview/alerts/runtime-callback-stalled/ack',
            latestHistoryAction: 'ACK',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'runtime-callback-stalled',
            stage: 'mute',
            scenario: '运营台静默 runtime-callback-stalled 后，会先从 overview 隐藏，但 drilldown 仍保留 stalled callback 明细。',
            endpoint: '/foundation/overview/alerts/runtime-callback-stalled/mute',
            latestHistoryAction: 'MUTE',
            acknowledgementStatus: 'MUTED',
            visibleInOverview: false,
            availableActions: ['DRILLDOWN', 'ACK', 'UNMUTE']
          },
          {
            surface: 'admin-web',
            alertCode: 'runtime-callback-stalled',
            stage: 'unmute',
            scenario: '取消静默后，runtime-callback-stalled 告警重新回到 overview，并恢复 ACK/MUTE 动作。',
            endpoint: '/foundation/overview/alerts/runtime-callback-stalled/unmute',
            latestHistoryAction: 'UNMUTE',
            acknowledgementStatus: 'ACKED',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
          }
        ]
      }
    ]
  }

  getGovernanceBaselines(): FoundationGovernanceBaseline[] {
    return [
      ...this.configurationGovernanceService.getGovernanceBaselines(),
      ...this.trustGovernanceService.getGovernanceBaselines(),
      ...this.resilienceOperationsService.getGovernanceBaselines()
    ]
  }

  getBlueprint(): FoundationBlueprint {
    return {
      generatedAt: new Date().toISOString(),
      docs: [
        'src/modules/foundation/foundation-architecture.md',
        'docs/foundation-bootstrap-wiring.md',
        'docs/operations-governance-baseline.md',
        'docs/operations-runbook-template.md'
      ],
      guardrails: [
        '业务模块不得绕过底座直接接外部系统。',
        '跨租户访问必须通过统一身份与租户隔离入口。',
        '市场策略、通知模板和灰度开关必须从配置治理层读取。',
        'Webhook、公开 API、AI 调用必须接入统一审计与防滥用链路。',
        '边缘离线、备份恢复、告警演练必须通过统一 runbook 与演练记录落地。'
      ],
      frontendBootstrap: foundationBootstrapContract,
      modules: this.getModuleCatalog(),
      consumers: this.getConsumerCatalog(),
      governanceBaselines: this.getGovernanceBaselines()
    }
  }

  getConsumerDependency(consumer: string) {
    return (
      this.getConsumerCatalog().find((item) => item.consumer === consumer) ?? {
        availableConsumers: this.getConsumerCatalog().map((item) => item.consumer)
      }
    )
  }

  getDependencySummary(consumer: FoundationConsumerKey) {
    return this.getConsumerCatalog().find((item) => item.consumer === consumer)
  }

  async getOperationsAlertsCatalog(tenantContext?: RequestTenantContext) {
    const tenantId = tenantContext?.tenantId ?? 'platform'
    const overview = await this.getOperationsOverview(tenantContext)
    const visibleAlertCodes = new Set(overview.alerts.map((item) => item.code))
    const codes = operationsAlertCatalog.map((item) => item.code)
    const acknowledgementMap = await this.getAlertAcknowledgementMap(codes, tenantId)
    const recentOperationMap = await this.getLatestAlertActivityMap(codes, tenantId)

    return {
      generatedAt: overview.generatedAt,
      alerts: operationsAlertCatalog.map((item) => {
        const acknowledgement = acknowledgementMap.get(item.code) ?? null
        const visibleInOverview = visibleAlertCodes.has(item.code)
        const recentOperation = recentOperationMap.get(item.code) ?? null

        return {
          ...item,
          drilldownPath: `/foundation/overview/alerts/${item.code}/drilldown`,
          ackPath: `/foundation/overview/alerts/${item.code}/ack`,
          mutePath: `/foundation/overview/alerts/${item.code}/mute`,
          unmutePath: `/foundation/overview/alerts/${item.code}/unmute`,
          ...buildAlertReadModelState(item.code, acknowledgement, recentOperation, visibleInOverview)
        }
      }) satisfies FoundationAlertCatalogItem[]
    }
  }

  async getOperationsOverview(tenantContext?: RequestTenantContext) {
    const [trustOverviewRaw, configurationOverviewRaw, resilienceOverviewRaw, runtimeOverviewRaw] = await Promise.all([
      this.trustGovernanceService.getOperationsOverview().catch(() => ({
        generatedAt: new Date().toISOString(),
        approvals: {
          groups: [],
          total: 0,
          statuses: {
            NOT_REQUIRED: 0,
            PENDING: 0,
            APPROVED: 0,
            REJECTED: 0,
            CANCELLED: 0,
            SUPERSEDED: 0
          },
          byOperation: {},
          execution: {
            executed: 0,
            pending: 0,
            withFailures: 0,
            byExecutionStatus: {},
            byFailureStatus: {}
          },
          failures: {}
        },
        audits: {
          total: 0,
          byAction: {},
          bySource: {},
          byRiskLevel: {
            low: 0,
            medium: 0,
            high: 0
          }
        },
        rateLimit: {
          policies: {
            total: 0,
            tenantScoped: 0,
            runtimeManaged: 0
          },
          ledgers: {
            total: 0,
            blocked: 0,
            exhausted: 0
          }
        }
      })),
      this.configurationGovernanceService.getOperationsOverview(),
      this.resilienceOperationsService.getOperationsOverview(),
      this.runtimeGovernanceService.getOperationsOverview(tenantContext?.tenantId)
    ])
    const trustOverview = toRecord(trustOverviewRaw)
    const configurationOverview = toRecord(configurationOverviewRaw)
    const resilienceOverview = toRecord(resilienceOverviewRaw)
    const runtimeOverview = toRecord(runtimeOverviewRaw)
    const runtimeSummary = toRecord(runtimeOverview.summary)

    const approvalsPending =
      Number(toRecord(toRecord(trustOverview.approvals).statuses).PENDING ?? 0) +
      Number(toRecord(toRecord(configurationOverview.approvals).statuses).PENDING ?? 0)
    const approvalsWithFailures =
      Number(toRecord(toRecord(trustOverview.approvals).execution).withFailures ?? 0) +
      Number(toRecord(toRecord(configurationOverview.approvals).execution).withFailures ?? 0)
    const highRiskAudits =
      Number(toRecord(toRecord(trustOverview.audits).byRiskLevel).high ?? 0) +
      Number(toRecord(toRecord(configurationOverview.audits).byRiskLevel).high ?? 0)
    const blockedLedgers = Number(toRecord(toRecord(trustOverview.rateLimit).ledgers).blocked ?? 0)
    const rotationDueSecrets = Number(toRecord(toRecord(configurationOverview.configuration).secrets).rotationDue ?? 0)
    const expiredSecrets = Number(toRecord(toRecord(configurationOverview.configuration).secrets).expired ?? 0)
    const expiringCertificates = Number(toRecord(toRecord(configurationOverview.configuration).certificates).expiringSoon ?? 0)
    const expiredCertificates = Number(toRecord(toRecord(configurationOverview.configuration).certificates).expired ?? 0)
    const degradedSignals = Number(toRecord(resilienceOverview.observability).degradedSignals ?? 0)
    const criticalSignals = Number(toRecord(toRecord(resilienceOverview.observability).byStatus).critical ?? 0)
    const attentionRecoveryPlans = Number(toRecord(resilienceOverview.recovery).attentionRequired ?? 0)
    const staleDrills = Number(toRecord(resilienceOverview.recovery).staleDrills ?? 0)
    const runtimeGovernanceBacklog = Number(runtimeSummary.backlog ?? 0)
    const stalledRuntimeCallbacks = Number(runtimeSummary.stalledCallbacks ?? 0)
    const highRiskRuntimeBacklog = Number(runtimeSummary.highRiskBacklog ?? 0)
    const runtimeBlockedActions = Number(runtimeSummary.blockedActions ?? 0)

    const alerts = (
      [
        approvalsPending > 0
          ? {
              severity: approvalsPending >= 5 ? 'high' : 'medium',
              code: 'approvals-pending',
              count: approvalsPending,
              summary: '存在待处理审批单'
            }
          : null,
        approvalsWithFailures > 0
          ? {
              severity: 'high',
              code: 'approval-execution-failures',
              count: approvalsWithFailures,
              summary: '存在执行失败且待人工确认的审批单'
            }
          : null,
        highRiskAudits > 0
          ? {
              severity: highRiskAudits >= 5 ? 'high' : 'medium',
              code: 'high-risk-audits',
              count: highRiskAudits,
              summary: '存在高风险治理审计事件'
            }
          : null,
        blockedLedgers > 0
          ? {
              severity: 'medium',
              code: 'blocked-rate-limit-ledgers',
              count: blockedLedgers,
              summary: '存在被封禁中的配额账本'
            }
          : null,
        rotationDueSecrets > 0 || expiredSecrets > 0
          ? {
              severity: expiredSecrets > 0 || expiredCertificates > 0 ? 'high' : 'medium',
              code: 'secret-rotation-attention',
              count: rotationDueSecrets + expiredSecrets + expiringCertificates + expiredCertificates,
              summary: '存在需要轮换或已过期的密钥/证书'
            }
          : null,
        degradedSignals > 0
          ? {
              severity: criticalSignals > 0 ? 'high' : 'medium',
              code: 'observability-degradation',
              count: degradedSignals,
              summary: '存在异常的 metrics/logs/traces 信号'
            }
          : null,
        attentionRecoveryPlans > 0 || staleDrills > 0
          ? {
              severity: 'medium',
              code: 'recovery-drill-attention',
              count: attentionRecoveryPlans + staleDrills,
              summary: '存在待补演练或恢复预案关注项'
            }
          : null,
        runtimeGovernanceBacklog > 0
          ? {
              severity: highRiskRuntimeBacklog > 0 || runtimeGovernanceBacklog >= 5 ? 'high' : 'medium',
              code: 'runtime-governance-backlog',
              count: runtimeGovernanceBacklog,
              summary: '存在待持续跟进的 runtime governance receipt'
            }
          : null,
        stalledRuntimeCallbacks > 0
          ? {
              severity: 'high',
              code: 'runtime-callback-stalled',
              count: stalledRuntimeCallbacks,
              summary: '存在等待 callback 回写的 runtime receipt'
            }
          : null
      ] satisfies Array<FoundationOperationsAlert | null>
    )
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity) || right.count - left.count)

    const tenantId = tenantContext?.tenantId ?? 'platform'
    const alertsWithReadModel = await this.buildOperationsAlertReadModels(alerts, tenantId)
    const visibleAlerts = alertsWithReadModel.filter((item) => item.visibleInOverview !== false)

    const trustFailures = toCountEntries(toRecord(toRecord(toRecord(trustOverview.approvals).execution).byFailureStatus), 'trust-governance')
    const configurationFailures = toCountEntries(
      toRecord(toRecord(toRecord(configurationOverview.approvals).execution).byFailureStatus),
      'configuration-governance'
    )
    const topFailures = [...trustFailures, ...configurationFailures].sort((left, right) => right.count - left.count).slice(0, 5)

    const moduleHealth = {
      trustGovernance: buildModuleHealth('trust-governance', {
        highRiskAudits: Number(toRecord(toRecord(trustOverview.audits).byRiskLevel).high ?? 0),
        pendingApprovals: Number(toRecord(toRecord(trustOverview.approvals).statuses).PENDING ?? 0),
        executionFailures: Number(toRecord(toRecord(trustOverview.approvals).execution).withFailures ?? 0),
        blockedCount: blockedLedgers
      }),
      configurationGovernance: buildModuleHealth('configuration-governance', {
        highRiskAudits: Number(toRecord(toRecord(configurationOverview.audits).byRiskLevel).high ?? 0),
        pendingApprovals: Number(toRecord(toRecord(configurationOverview.approvals).statuses).PENDING ?? 0),
        executionFailures: Number(toRecord(toRecord(configurationOverview.approvals).execution).withFailures ?? 0),
        blockedCount: rotationDueSecrets + expiredSecrets + expiringCertificates + expiredCertificates
      }),
      resilienceOperations: buildModuleHealth('resilience-operations', {
        highRiskAudits: criticalSignals,
        pendingApprovals: staleDrills,
        executionFailures: attentionRecoveryPlans,
        blockedCount: degradedSignals
      }),
      runtimeGovernance: buildModuleHealth('runtime-governance', {
        highRiskAudits: highRiskRuntimeBacklog,
        pendingApprovals: runtimeGovernanceBacklog,
        executionFailures: stalledRuntimeCallbacks,
        blockedCount: runtimeBlockedActions
      })
    }

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        approvalsPending,
        approvalsWithFailures,
        highRiskAudits,
        blockedLedgers,
        rotationDueSecrets,
        expiredSecrets,
        expiringCertificates,
        expiredCertificates,
        degradedSignals,
        attentionRecoveryPlans,
        staleDrills,
        runtimeGovernanceBacklog,
        stalledRuntimeCallbacks,
        highRiskRuntimeBacklog,
        runtimeBlockedActions
      },
      alerts: visibleAlerts,
      topFailures,
      topRisks: visibleAlerts.slice(0, 5),
      moduleHealth,
      modules: {
        trustGovernance: trustOverview,
        configurationGovernance: configurationOverview,
        resilienceOperations: resilienceOverview,
        runtimeGovernance: runtimeOverviewRaw
      }
    }
  }

  async getOperationsAlerts(tenantContext?: RequestTenantContext) {
    const overview = await this.getOperationsOverview(tenantContext)
    return {
      generatedAt: overview.generatedAt,
      alerts: overview.alerts,
      topRisks: overview.topRisks
    }
  }

  async getOperationsModuleDetail(moduleKey: string, tenantContext?: RequestTenantContext) {
    const supportedModuleKeys = ['trust-governance', 'configuration-governance', 'resilience-operations', 'runtime-governance'] as const
    const moduleKeyCandidate = moduleKey as (typeof supportedModuleKeys)[number]
    if (!supportedModuleKeys.includes(moduleKeyCandidate)) {
      return {
        generatedAt: new Date().toISOString(),
        moduleKey,
        availableModuleKeys: supportedModuleKeys
      }
    }
    const resolvedModuleKey = moduleKeyCandidate

    const overview = await this.getOperationsOverview(tenantContext)
    const moduleMap = {
      'trust-governance': overview.modules.trustGovernance,
      'configuration-governance': overview.modules.configurationGovernance,
      'resilience-operations': overview.modules.resilienceOperations,
      'runtime-governance': overview.modules.runtimeGovernance
    }

    return {
      generatedAt: overview.generatedAt,
      moduleKey: resolvedModuleKey,
      health:
        resolvedModuleKey === 'trust-governance'
          ? overview.moduleHealth.trustGovernance
          : resolvedModuleKey === 'configuration-governance'
            ? overview.moduleHealth.configurationGovernance
            : resolvedModuleKey === 'resilience-operations'
              ? overview.moduleHealth.resilienceOperations
              : overview.moduleHealth.runtimeGovernance,
      detail: moduleMap[resolvedModuleKey]
    }
  }

  async acknowledgeOperationsAlert(
    code: string,
    tenantContext: RequestTenantContext | undefined,
    actorContext: RequestActorContext | undefined,
    note?: string
  ) {
    if (!supportedOperationsAlertCodes.includes(code as OperationsAlertCode)) {
      return {
        generatedAt: new Date().toISOString(),
        code,
        availableAlertCodes: supportedOperationsAlertCodes
      }
    }

    const tenantId = tenantContext?.tenantId ?? 'platform'
    const now = new Date()
    const record = await this.prisma.foundationAlertAcknowledgement.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code
        }
      },
      create: {
        tenantId,
        code,
        status: 'ACKED',
        note: note ?? null,
        actorId: actorContext?.actorId ?? null,
        acknowledgedAt: now,
        mutedUntil: null
      },
      update: {
        status: 'ACKED',
        note: note ?? null,
        actorId: actorContext?.actorId ?? null,
        acknowledgedAt: now,
        mutedUntil: null
      }
    })
    const acknowledgement = toFoundationAlertAcknowledgement(record)
    await this.recordAlertMutationHistory('ACK', code, tenantId, acknowledgement, true, actorContext)
    const history = await this.getAlertHistory(code, tenantId)

    return {
      generatedAt: now.toISOString(),
      code,
      catalog: getOperationsAlertCatalogItem(code),
      acknowledgement,
      visibleInOverview: true,
      availableActions: getAvailableAlertActions(code, acknowledgement),
      history
    }
  }

  async muteOperationsAlert(
    code: string,
    tenantContext: RequestTenantContext | undefined,
    actorContext: RequestActorContext | undefined,
    input: { mutedUntil?: string; note?: string } = {}
  ) {
    if (!supportedOperationsAlertCodes.includes(code as OperationsAlertCode)) {
      return {
        generatedAt: new Date().toISOString(),
        code,
        availableAlertCodes: supportedOperationsAlertCodes
      }
    }

    const tenantId = tenantContext?.tenantId ?? 'platform'
    const now = new Date()
    const mutedUntil = input.mutedUntil ? new Date(input.mutedUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000)
    const record = await this.prisma.foundationAlertAcknowledgement.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code
        }
      },
      create: {
        tenantId,
        code,
        status: 'MUTED',
        note: input.note ?? null,
        actorId: actorContext?.actorId ?? null,
        acknowledgedAt: now,
        mutedUntil
      },
      update: {
        status: 'MUTED',
        note: input.note ?? null,
        actorId: actorContext?.actorId ?? null,
        acknowledgedAt: now,
        mutedUntil
      }
    })
    const acknowledgement = toFoundationAlertAcknowledgement(record)
    await this.recordAlertMutationHistory('MUTE', code, tenantId, acknowledgement, false, actorContext)
    const history = await this.getAlertHistory(code, tenantId)

    return {
      generatedAt: now.toISOString(),
      code,
      catalog: getOperationsAlertCatalogItem(code),
      acknowledgement,
      visibleInOverview: false,
      availableActions: getAvailableAlertActions(code, acknowledgement),
      history
    }
  }

  async unmuteOperationsAlert(
    code: string,
    tenantContext: RequestTenantContext | undefined,
    actorContext: RequestActorContext | undefined,
    note?: string
  ) {
    if (!supportedOperationsAlertCodes.includes(code as OperationsAlertCode)) {
      return {
        generatedAt: new Date().toISOString(),
        code,
        availableAlertCodes: supportedOperationsAlertCodes
      }
    }

    const tenantId = tenantContext?.tenantId ?? 'platform'
    const now = new Date()
    const record = await this.prisma.foundationAlertAcknowledgement.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code
        }
      },
      create: {
        tenantId,
        code,
        status: 'ACKED',
        note: note ?? 'unmuted',
        actorId: actorContext?.actorId ?? null,
        acknowledgedAt: now,
        mutedUntil: null
      },
      update: {
        status: 'ACKED',
        note: note ?? 'unmuted',
        actorId: actorContext?.actorId ?? null,
        acknowledgedAt: now,
        mutedUntil: null
      }
    })
    const acknowledgement = toFoundationAlertAcknowledgement(record)
    await this.recordAlertMutationHistory('UNMUTE', code, tenantId, acknowledgement, true, actorContext)
    const history = await this.getAlertHistory(code, tenantId)

    return {
      generatedAt: now.toISOString(),
      code,
      catalog: getOperationsAlertCatalogItem(code),
      acknowledgement,
      visibleInOverview: true,
      availableActions: getAvailableAlertActions(code, acknowledgement),
      history
    }
  }

  async getOperationsAlertDrilldown(code: string, tenantContext?: RequestTenantContext) {
    if (!supportedOperationsAlertCodes.includes(code as OperationsAlertCode)) {
      return {
        generatedAt: new Date().toISOString(),
        code,
        availableAlertCodes: supportedOperationsAlertCodes
      }
    }

    const overview = await this.getOperationsOverview(tenantContext)
    const alert = buildOperationsAlertFromOverview(code as OperationsAlertCode, overview)
    const visibleInOverview = overview.alerts.some((item) => item.code === code)
    const acknowledgement = await this.getAlertAcknowledgement(code, tenantContext)
    const catalog = getOperationsAlertCatalogItem(code)
    const history = await this.getAlertHistory(code, tenantContext?.tenantId ?? 'platform')

    switch (code as OperationsAlertCode) {
      case 'approvals-pending': {
        const limit = 20
        const [trustApprovals, configurationApprovals] = await Promise.all([
          this.trustGovernanceService.listGovernanceApprovals({ status: 'PENDING', limit }),
          this.configurationGovernanceService.listGovernanceApprovals({ status: 'PENDING', limit })
        ])

        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            limit,
            approvals: [
              ...trustApprovals.map((approval) => ({ module: 'trust-governance', approval })),
              ...configurationApprovals.map((approval) => ({ module: 'configuration-governance', approval }))
            ]
          }
        }
      }
      case 'approval-execution-failures': {
        const limit = 20
        const [trustApprovals, configurationApprovals] = await Promise.all([
          this.trustGovernanceService.listGovernanceApprovals({ executed: true, hasFailures: true, limit }),
          this.configurationGovernanceService.listGovernanceApprovals({ executed: true, hasFailures: true, limit })
        ])

        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            limit,
            topFailures: overview.topFailures,
            approvals: [
              ...trustApprovals.map((approval) => ({ module: 'trust-governance', approval })),
              ...configurationApprovals.map((approval) => ({ module: 'configuration-governance', approval }))
            ]
          }
        }
      }
      case 'high-risk-audits': {
        const limit = 20
        const [trustAudits, configurationAudits] = await Promise.all([
          this.trustGovernanceService.getAuditRecords({ riskLevel: 'high', limit }),
          this.configurationGovernanceService.getAuditRecords({ riskLevel: 'high', limit })
        ])

        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            limit,
            audits: [
              ...(trustAudits as unknown[]).map((audit) => ({ module: 'trust-governance', audit })),
              ...(configurationAudits as unknown[]).map((audit) => ({ module: 'configuration-governance', audit }))
            ]
          }
        }
      }
      case 'blocked-rate-limit-ledgers': {
        const limit = 200
        const ledgers = await this.trustGovernanceService.listQuotaLedgers({ limit })
        const now = Date.now()
        const blocked = (ledgers as Array<{ metadata?: Record<string, unknown> }>).filter((ledger) => {
          const metadata = typeof ledger.metadata === 'object' && ledger.metadata ? ledger.metadata : {}
          const blockedUntil =
            typeof (metadata as Record<string, unknown>).blockedUntil === 'string'
              ? Date.parse(String((metadata as Record<string, unknown>).blockedUntil))
              : Number.NaN
          return Number.isFinite(blockedUntil) && blockedUntil > now
        })

        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            sampled: blocked.slice(0, 50)
          }
        }
      }
      case 'secret-rotation-attention': {
        const [secrets, certificates] = await Promise.all([
          this.configurationGovernanceService.getSecretMetadata(),
          this.configurationGovernanceService.getCertificateMetadata()
        ])
        const now = Date.now()
        const attention = (secrets as Array<{ status?: string; expiresAt?: string | null }>).filter((secret) => {
          const expiresAt = typeof secret.expiresAt === 'string' ? Date.parse(secret.expiresAt) : Number.NaN
          const expired = Number.isFinite(expiresAt) ? expiresAt < now : false
          return secret.status === 'rotation-due' || expired
        })
        const certificateAttention = (certificates as Array<{ status?: string; expiresAt?: string | null }>).filter(
          (certificate) => certificate.status === 'expiring-soon' || certificate.status === 'expired'
        )

        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            secrets: attention,
            certificates: certificateAttention
          }
        }
      }
      case 'observability-degradation': {
        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            observability: toRecord(overview.modules.resilienceOperations).observability
          }
        }
      }
      case 'recovery-drill-attention': {
        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            recovery: toRecord(overview.modules.resilienceOperations).recovery
          }
        }
      }
      case 'runtime-governance-backlog': {
        const receipts = Array.isArray(toRecord(overview.modules.runtimeGovernance).receipts)
          ? (toRecord(overview.modules.runtimeGovernance).receipts as unknown[])
          : []
        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            receipts: receipts.slice(0, 20)
          }
        }
      }
      case 'runtime-callback-stalled': {
        const stalledReceipts = Array.isArray(toRecord(overview.modules.runtimeGovernance).stalledReceipts)
          ? (toRecord(overview.modules.runtimeGovernance).stalledReceipts as RuntimeGovernanceCallbackStallDetail[])
          : []
        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: {
            total: alert?.count ?? 0,
            timeoutThresholds: runtimeGovernanceCallbackTimeoutThresholds,
            escalationSummary: {
              waitCallback: stalledReceipts.filter((item) => item.escalationAction === 'WAIT_CALLBACK').length,
              scheduleReplay: stalledReceipts.filter((item) => item.escalationAction === 'SCHEDULE_REPLAY').length,
              openManualReview: stalledReceipts.filter((item) => item.escalationAction === 'OPEN_MANUAL_REVIEW').length
            },
            receipts: stalledReceipts.slice(0, 20)
          }
        }
      }
      default: {
        return {
          generatedAt: overview.generatedAt,
          code,
          catalog,
          alert,
          acknowledgement,
          visibleInOverview,
          availableActions: getAvailableAlertActions(code, acknowledgement),
          history,
          detail: null
        }
      }
    }
  }

  private async recordAlertMutationHistory(
    action: AlertMutationAction,
    code: string,
    tenantId: string,
    acknowledgement: FoundationAlertAcknowledgement,
    visibleInOverview: boolean,
    actorContext?: RequestActorContext
  ) {
    if (typeof this.prisma.auditLog?.create !== 'function') {
      return
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: `foundation.operations.alerts.${action.toLowerCase()}`,
        operatorId: actorContext?.actorId ?? 'foundation-system',
        resourceType: 'foundation-alert',
        resourceId: code,
        sourceChannel: 'foundation-alerts',
        purpose: `foundation-alert-${action.toLowerCase()}`,
        payload: {
          code,
          note: acknowledgement.note,
          status: acknowledgement.status,
          mutedUntil: acknowledgement.mutedUntil,
          visibleInOverview
        },
        metadata: {
          availableActions: getAvailableAlertActions(code, acknowledgement)
        }
      }
    })
  }

  private async getAlertHistory(code: string, tenantId: string, limit = 10): Promise<FoundationAlertTimelineEntry[]> {
    if (typeof this.prisma.auditLog?.findMany !== 'function') {
      return []
    }

    const records = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        resourceType: 'foundation-alert',
        resourceId: code,
        action: {
          in: [
            'foundation.operations.alerts.ack',
            'foundation.operations.alerts.mute',
            'foundation.operations.alerts.unmute'
          ]
        }
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit
    })

    return (records as Array<{
      action: string
      resourceId: string | null
      operatorId: string | null
      sourceChannel: string | null
      payload: unknown
      createdAt: Date
    }>).map((record) => toFoundationAlertTimelineEntry(record))
  }

  private async getLatestAlertActivityMap(codes: string[], tenantId: string) {
    if (codes.length === 0 || typeof this.prisma.auditLog?.findMany !== 'function') {
      return new Map<string, FoundationAlertTimelineEntry>()
    }

    const records = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        resourceType: 'foundation-alert',
        resourceId: { in: codes },
        action: {
          in: [
            'foundation.operations.alerts.ack',
            'foundation.operations.alerts.mute',
            'foundation.operations.alerts.unmute'
          ]
        }
      },
      orderBy: [{ createdAt: 'desc' }]
    })

    const latestMap = new Map<string, FoundationAlertTimelineEntry>()
    for (const record of records as Array<{
      action: string
      resourceId: string | null
      operatorId: string | null
      sourceChannel: string | null
      payload: unknown
      createdAt: Date
    }>) {
      if (!record.resourceId || latestMap.has(record.resourceId)) {
        continue
      }
      latestMap.set(record.resourceId, toFoundationAlertTimelineEntry(record))
    }

    return latestMap
  }

  private async getAlertAcknowledgementMap(codes: string[], tenantId: string) {
    if (codes.length === 0 || typeof this.prisma.foundationAlertAcknowledgement?.findMany !== 'function') {
      return new Map<string, FoundationAlertAcknowledgement>()
    }

    let acknowledgementRecords: Awaited<ReturnType<PrismaService['foundationAlertAcknowledgement']['findMany']>>
    try {
      acknowledgementRecords = await this.prisma.foundationAlertAcknowledgement.findMany({
        where: {
          tenantId,
          code: { in: codes }
        }
      })
    } catch (error) {
      if (!this.shouldUseFoundationReadFallback(error)) {
        throw error
      }
      acknowledgementRecords = []
    }

    return new Map<string, FoundationAlertAcknowledgement>(
      (acknowledgementRecords as Array<{
        code: string
        status: FoundationAlertAcknowledgementStatus
        note: string | null
        actorId: string | null
        acknowledgedAt: Date | null
        mutedUntil: Date | null
        updatedAt: Date
      }>).map((record) => [record.code, toFoundationAlertAcknowledgement(record)])
    )
  }

  private async buildOperationsAlertReadModels(alerts: FoundationOperationsAlert[], tenantId: string) {
    const codes = alerts.map((item) => item.code)
    const [acknowledgementMap, recentOperationMap] = await Promise.all([
      this.getAlertAcknowledgementMap(codes, tenantId),
      this.getLatestAlertActivityMap(codes, tenantId)
    ])

    return alerts.map((item) => {
      const acknowledgement = acknowledgementMap.get(item.code) ?? null
      const visibleInOverview = isAlertVisibleInOverview(acknowledgement)
      const recentOperation = recentOperationMap.get(item.code) ?? null

      return {
        ...item,
        ...buildAlertReadModelState(item.code, acknowledgement, recentOperation, visibleInOverview)
      }
    })
  }

  private async getAlertAcknowledgement(code: string, tenantContext?: RequestTenantContext) {
    const tenantId = tenantContext?.tenantId ?? 'platform'
    let records: Awaited<ReturnType<PrismaService['foundationAlertAcknowledgement']['findMany']>>
    try {
      records = await this.prisma.foundationAlertAcknowledgement.findMany({
        where: {
          tenantId,
          code: { in: [code] }
        }
      })
    } catch (error) {
      if (!this.shouldUseFoundationReadFallback(error)) {
        throw error
      }
      records = []
    }
    const record = (records as Array<{
      status: FoundationAlertAcknowledgementStatus
      note: string | null
      actorId: string | null
      acknowledgedAt: Date | null
      mutedUntil: Date | null
      updatedAt: Date
    }>)[0]

    return record ? toFoundationAlertAcknowledgement(record) : null
  }

  private shouldUseFoundationReadFallback(error: unknown) {
    const code =
      typeof error === 'object' && error && 'code' in error
        ? (error as { code?: unknown }).code
        : undefined
    return code === 'P2021' || code === 'P1010' || code === 'P1001'
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function severityWeight(severity: string) {
  switch (severity) {
    case 'high':
      return 3
    case 'medium':
      return 2
    default:
      return 1
  }
}

function toCountEntries(source: Record<string, unknown>, module: string) {
  return Object.entries(source)
    .map(([code, count]) => ({
      module,
      code,
      count: Number(count ?? 0)
    }))
    .filter((item) => item.count > 0)
}

function toFoundationAlertAcknowledgement(record: {
  status: FoundationAlertAcknowledgementStatus
  note: string | null
  actorId: string | null
  acknowledgedAt: Date | null
  mutedUntil: Date | null
  updatedAt: Date
}): FoundationAlertAcknowledgement {
  return {
    status: record.status,
    note: record.note ?? null,
    actorId: record.actorId ?? null,
    acknowledgedAt: record.acknowledgedAt ? record.acknowledgedAt.toISOString() : null,
    mutedUntil: record.mutedUntil ? record.mutedUntil.toISOString() : null,
    updatedAt: record.updatedAt.toISOString()
  }
}

function toFoundationAlertTimelineEntry(record: {
  action: string
  operatorId: string | null
  sourceChannel: string | null
  payload: unknown
  createdAt: Date
}): FoundationAlertTimelineEntry {
  const payload = toRecord(record.payload)
  const action = record.action.endsWith('.mute')
    ? 'MUTE'
    : record.action.endsWith('.unmute')
      ? 'UNMUTE'
      : 'ACK'

  return {
    action,
    note: typeof payload.note === 'string' ? payload.note : null,
    actorId: record.operatorId ?? null,
    mutedUntil: typeof payload.mutedUntil === 'string' ? payload.mutedUntil : null,
    visibleInOverview: payload.visibleInOverview === false ? false : true,
    createdAt: record.createdAt.toISOString(),
    source: record.sourceChannel ?? null
  }
}

function getOperationsAlertCatalogItem(code: string): FoundationAlertCatalogItem | null {
  const item = operationsAlertCatalog.find((entry) => entry.code === code)
  if (!item) {
    return null
  }

  return {
    ...item,
    drilldownPath: `/foundation/overview/alerts/${item.code}/drilldown`,
    ackPath: `/foundation/overview/alerts/${item.code}/ack`,
    mutePath: `/foundation/overview/alerts/${item.code}/mute`,
    unmutePath: `/foundation/overview/alerts/${item.code}/unmute`
  }
}

function getAvailableAlertActions(code: string, acknowledgement?: FoundationAlertAcknowledgement | null) {
  const catalog = getOperationsAlertCatalogItem(code)
  if (!catalog) {
    return []
  }

  return [
    ...(catalog.drilldownEnabled ? (['DRILLDOWN'] as const) : []),
    ...(catalog.acknowledgementEnabled
      ? acknowledgement?.status === 'MUTED'
        ? (['ACK', 'UNMUTE'] as const)
        : (['ACK', 'MUTE'] as const)
      : [])
  ]
}

function isAlertVisibleInOverview(acknowledgement?: FoundationAlertAcknowledgement | null) {
  if (acknowledgement?.status !== 'MUTED') {
    return true
  }

  if (!acknowledgement.mutedUntil) {
    return false
  }

  return Date.parse(acknowledgement.mutedUntil) <= Date.now()
}

function getAlertTriageState(
  acknowledgement: FoundationAlertAcknowledgement | null | undefined,
  visibleInOverview: boolean
): FoundationOperationsAlertTriageState {
  if (acknowledgement?.status === 'MUTED') {
    const mutedUntilTs = acknowledgement.mutedUntil ? Date.parse(acknowledgement.mutedUntil) : Number.NaN
    return Number.isFinite(mutedUntilTs) && mutedUntilTs <= Date.now() ? 'expired-mute' : 'muted'
  }

  if (acknowledgement?.status === 'ACKED') {
    return 'acknowledged'
  }

  return visibleInOverview ? 'needs-triage' : 'acknowledged'
}

function getAlertTriageSummary(
  triageState: FoundationOperationsAlertTriageState,
  acknowledgement: FoundationAlertAcknowledgement | null | undefined,
  recentOperation: FoundationAlertTimelineEntry | null,
  visibleInOverview: boolean
) {
  const actor = recentOperation?.actorId ?? acknowledgement?.actorId ?? '系统'
  switch (triageState) {
    case 'muted':
      return `已静默，截止 ${acknowledgement?.mutedUntil ?? 'unknown'} / ${actor}`
    case 'expired-mute':
      return `静默已到期，${visibleInOverview ? '重新进入概览待复核' : '等待重新拉起'}`
    case 'acknowledged':
      return recentOperation?.action === 'UNMUTE'
        ? `已取消静默并恢复关注 / ${actor}`
        : `已确认，持续观察 / ${actor}`
    case 'needs-triage':
    default:
      return recentOperation ? `待处理，最近动作 ${recentOperation.action} / ${actor}` : '待处理，尚无最近运维动作'
  }
}

function buildAlertReadModelState(
  code: string,
  acknowledgement: FoundationAlertAcknowledgement | null,
  recentOperation: FoundationAlertTimelineEntry | null,
  visibleInOverview: boolean
) {
  const triageState = getAlertTriageState(acknowledgement, visibleInOverview)

  return {
    acknowledgement,
    visibleInOverview,
    availableActions: getAvailableAlertActions(code, acknowledgement),
    recentOperation,
    triageState,
    triageSummary: getAlertTriageSummary(triageState, acknowledgement, recentOperation, visibleInOverview)
  }
}

function buildOperationsAlertFromOverview(
  code: OperationsAlertCode,
  overview: Awaited<ReturnType<FoundationService['getOperationsOverview']>>
) {
  switch (code) {
    case 'approvals-pending': {
      return overview.summary.approvalsPending > 0
        ? {
            severity: overview.summary.approvalsPending >= 5 ? 'high' : 'medium',
            code,
            count: overview.summary.approvalsPending,
            summary: '存在待处理审批单',
            acknowledgement: null
          }
        : null
    }
    case 'approval-execution-failures': {
      return overview.summary.approvalsWithFailures > 0
        ? {
            severity: 'high',
            code,
            count: overview.summary.approvalsWithFailures,
            summary: '存在执行失败且待人工确认的审批单',
            acknowledgement: null
          }
        : null
    }
    case 'high-risk-audits': {
      return overview.summary.highRiskAudits > 0
        ? {
            severity: overview.summary.highRiskAudits >= 5 ? 'high' : 'medium',
            code,
            count: overview.summary.highRiskAudits,
            summary: '存在高风险治理审计事件',
            acknowledgement: null
          }
        : null
    }
    case 'blocked-rate-limit-ledgers': {
      return overview.summary.blockedLedgers > 0
        ? {
            severity: 'medium',
            code,
            count: overview.summary.blockedLedgers,
            summary: '存在被封禁中的配额账本',
            acknowledgement: null
          }
        : null
    }
    case 'secret-rotation-attention': {
      const count =
        overview.summary.rotationDueSecrets +
        overview.summary.expiredSecrets +
        overview.summary.expiringCertificates +
        overview.summary.expiredCertificates
      return count > 0
        ? {
            severity: overview.summary.expiredSecrets > 0 || overview.summary.expiredCertificates > 0 ? 'high' : 'medium',
            code,
            count,
            summary: '存在需要轮换或已过期的密钥/证书',
            acknowledgement: null
          }
        : null
    }
    case 'observability-degradation': {
      const criticalSignals = Number(
        toRecord(toRecord(overview.modules.resilienceOperations).observability).byStatus
          ? toRecord(toRecord(toRecord(overview.modules.resilienceOperations).observability).byStatus).critical ?? 0
          : 0
      )
      return overview.summary.degradedSignals > 0
        ? {
            severity: criticalSignals > 0 ? 'high' : 'medium',
            code,
            count: overview.summary.degradedSignals,
            summary: '存在异常的 metrics/logs/traces 信号',
            acknowledgement: null
          }
        : null
    }
    case 'recovery-drill-attention': {
      const count = overview.summary.attentionRecoveryPlans + overview.summary.staleDrills
      return count > 0
        ? {
            severity: 'medium',
            code,
            count,
            summary: '存在待补演练或恢复预案关注项',
            acknowledgement: null
          }
        : null
    }
    case 'runtime-governance-backlog': {
      return overview.summary.runtimeGovernanceBacklog > 0
        ? {
            severity:
              overview.summary.highRiskRuntimeBacklog > 0 || overview.summary.runtimeGovernanceBacklog >= 5
                ? 'high'
                : 'medium',
            code,
            count: overview.summary.runtimeGovernanceBacklog,
            summary: '存在待持续跟进的 runtime governance receipt',
            acknowledgement: null
          }
        : null
    }
    case 'runtime-callback-stalled': {
      return overview.summary.stalledRuntimeCallbacks > 0
        ? {
            severity: 'high',
            code,
            count: overview.summary.stalledRuntimeCallbacks,
            summary: '存在等待 callback 回写的 runtime receipt',
            acknowledgement: null
          }
        : null
    }
  }
}

function buildModuleHealth(
  module: string,
  input: { highRiskAudits: number; pendingApprovals: number; executionFailures: number; blockedCount: number }
) {
  const score = Math.max(
    0,
    100 - input.highRiskAudits * 10 - input.pendingApprovals * 5 - input.executionFailures * 15 - input.blockedCount * 8
  )

  return {
    module,
    score,
    status: score >= 85 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    indicators: input
  }
}
