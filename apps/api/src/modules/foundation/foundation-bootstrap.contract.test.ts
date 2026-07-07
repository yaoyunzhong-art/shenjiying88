import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'

function createModuleDescriptor(
  key:
    | 'identity-access'
    | 'configuration-governance'
    | 'integration-orchestration'
    | 'trust-governance'
    | 'resilience-operations'
    | 'runtime-governance'
) {
  return {
    key,
    name: key,
    purpose: `${key} purpose`,
    inboundContracts: [`${key}.input`],
    outboundContracts: [`${key}.output`],
    capabilities: [
      {
        key: `${key}.capability`,
        name: `${key} capability`,
        responsibilities: [`${key} responsibility`],
        entrypoints: [`/${key}`],
        consumers: ['market', 'portal'],
        status: 'active' as const
      }
    ]
  }
}

it('contract: foundation bootstrap shape stays aligned with shared source of truth', () => {
  const service = new FoundationService(
    {
      getDescriptor: () => createModuleDescriptor('identity-access')
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('configuration-governance'),
      getGovernanceBaselines: () => [
        {
          key: 'configuration.secrets',
          name: 'Secrets baseline',
          ownerModule: 'configuration-governance',
          summary: 'secret governance baseline',
          controls: ['rotation'],
          evidence: ['docs/governance-observability.md']
        }
      ],
      getOperationsOverview: async () => ({
        approvals: { statuses: {}, execution: {} },
        audits: { byRiskLevel: {} },
        configuration: { secrets: {} }
      })
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('integration-orchestration')
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('trust-governance'),
      getGovernanceBaselines: () => [
        {
          key: 'trust.audit',
          name: 'Trust audit baseline',
          ownerModule: 'trust-governance',
          summary: 'trust governance audit baseline',
          controls: ['audit'],
          evidence: ['docs/governance-observability.md']
        }
      ],
      getOperationsOverview: async () => ({
        approvals: { statuses: {}, execution: {} },
        audits: { byRiskLevel: {} },
        rateLimit: { ledgers: {} }
      })
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('resilience-operations'),
      getGovernanceBaselines: () => [
        {
          key: 'resilience.runbook',
          name: 'Resilience baseline',
          ownerModule: 'resilience-operations',
          summary: 'resilience runbook baseline',
          controls: ['recovery'],
          evidence: ['docs/operations-runbook-template.md']
        }
      ]
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('runtime-governance')
    } as never,
    {} as never
  )

  const controller = new FoundationController(service)
  const bootstrap = controller.getBootstrap({
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  })

  assert.deepEqual(Object.keys(bootstrap), [
    'tenantContext',
    'generatedAt',
    'docs',
    'guardrails',
    'frontendBootstrap',
    'modules',
    'consumers',
    'governanceBaselines'
  ])
  assert.deepEqual(bootstrap.tenantContext, {
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  })
  assert.equal(bootstrap.frontendBootstrap.bootstrapEndpoint, '/api/v1/foundation/bootstrap')
  assert.equal(bootstrap.modules.length, 6)
  assert.deepEqual(
    bootstrap.modules.map((module) => module.key),
    [
      'identity-access',
      'configuration-governance',
      'integration-orchestration',
      'trust-governance',
      'resilience-operations',
      'runtime-governance'
    ]
  )
  assert.deepEqual(
    bootstrap.consumers.map((consumer) => consumer.consumer),
    ['market', 'portal', 'workbench', 'lyt-adapter']
  )
  assert.equal(bootstrap.governanceBaselines.length, 3)
  assert.equal(bootstrap.docs.includes('docs/foundation-bootstrap-wiring.md'), true)
  assert.equal(bootstrap.guardrails.length > 0, true)
  assert.equal(bootstrap.modules.every((module) => module.capabilities.every((capability) => capability.status === 'active')), true)
})

it('contract: foundation modules endpoint exposes ordered active module catalog', () => {
  const service = new FoundationService(
    {
      getDescriptor: () => createModuleDescriptor('identity-access')
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('configuration-governance'),
      getGovernanceBaselines: () => [],
      getOperationsOverview: async () => ({})
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('integration-orchestration')
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('trust-governance'),
      getGovernanceBaselines: () => [],
      getOperationsOverview: async () => ({})
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('resilience-operations'),
      getGovernanceBaselines: () => []
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('runtime-governance')
    } as never,
    {} as never
  )

  const controller = new FoundationController(service)
  const modules = controller.getModules()

  assert.deepEqual(
    modules.map((module) => module.key),
    [
      'identity-access',
      'configuration-governance',
      'integration-orchestration',
      'trust-governance',
      'resilience-operations',
      'runtime-governance'
    ]
  )
  assert.equal(modules.every((module) => module.capabilities.every((capability) => capability.status === 'active')), true)
})

it('contract: foundation consumers endpoints expose catalog and unknown fallback', () => {
  const service = new FoundationService(
    {
      getDescriptor: () => createModuleDescriptor('identity-access')
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('configuration-governance'),
      getGovernanceBaselines: () => [],
      getOperationsOverview: async () => ({})
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('integration-orchestration')
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('trust-governance'),
      getGovernanceBaselines: () => [],
      getOperationsOverview: async () => ({})
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('resilience-operations'),
      getGovernanceBaselines: () => []
    } as never,
    {
      getDescriptor: () => createModuleDescriptor('runtime-governance')
    } as never,
    {} as never
  )

  const controller = new FoundationController(service)
  const consumers = controller.getConsumers()
  const portal = controller.getConsumer('portal') as {
    consumer: string
    dependsOn: string[]
    handoffContracts: string[]
    recommendedSequence: string[]
    governanceTouchpoints: string[]
    highRiskEntrypoints: string[]
    actionGovernanceExamples: Array<{
      surface: string
      action: string
      scenario: string
      riskLevel: string
      bootstrapState: string
      nextStep: string
      submitState: string
      requestEndpoint: string
    }>
    runtimeHandoffExamples: Array<{
      surface: string
      action: string
      scenario: string
      ticketType: string
      ticketStatus: string
      handlerName: string
      syncMode: string
      syncEndpoint: string
      callbackStatus: string
      callbackEndpoint: string
      replayStatus: string
      replayEndpoint: string
      retryEscalationAction: string
    }>
    runtimeReceiptExamples: Array<{
      surface: string
      action: string
      scenario: string
      mode: string
      receiptState: string
      generatedAtSource: string
      requestEndpoint: string
      runtimeEndpoint: string
      callbackStatus: string
      replayable: boolean
      rateLimitScopeKey: string
      latestEventType: string
    }>
    governanceAlertLifecycleExamples: Array<{
      surface: string
      alertCode: string
      stage: string
      scenario: string
      endpoint: string
      latestHistoryAction: string
      acknowledgementStatus: string | null
      visibleInOverview: boolean
      availableActions: string[]
    }>
  }
  const market = controller.getConsumer('market') as typeof portal
  const workbench = controller.getConsumer('workbench') as {
    consumer: string
    dependsOn: string[]
    handoffContracts: string[]
    recommendedSequence: string[]
    governanceTouchpoints: string[]
    highRiskEntrypoints: string[]
    actionGovernanceExamples: Array<{
      surface: string
      action: string
      scenario: string
      riskLevel: string
      bootstrapState: string
      nextStep: string
      submitState: string
      requestEndpoint: string
    }>
    runtimeHandoffExamples: Array<{
      surface: string
      action: string
      scenario: string
      ticketType: string
      ticketStatus: string
      handlerName: string
      syncMode: string
      syncEndpoint: string
      callbackStatus: string
      callbackEndpoint: string
      replayStatus: string
      replayEndpoint: string
      retryEscalationAction: string
    }>
    runtimeReceiptExamples: Array<{
      surface: string
      action: string
      scenario: string
      mode: string
      receiptState: string
      generatedAtSource: string
      requestEndpoint: string
      runtimeEndpoint: string
      callbackStatus: string
      replayable: boolean
      rateLimitScopeKey: string
      latestEventType: string
    }>
    governanceAlertLifecycleExamples: Array<{
      surface: string
      alertCode: string
      stage: string
      scenario: string
      endpoint: string
      latestHistoryAction: string
      acknowledgementStatus: string | null
      visibleInOverview: boolean
      availableActions: string[]
    }>
  }
  const lytAdapter = controller.getConsumer('lyt-adapter') as typeof portal
  const fallback = controller.getConsumer('unknown') as { availableConsumers: string[] }

  assert.deepEqual(
    consumers.map((consumer) => consumer.consumer),
    ['market', 'portal', 'workbench', 'lyt-adapter']
  )
  assert.equal(portal.consumer, 'portal')
  assert.equal(portal.dependsOn.includes('integration-orchestration'), true)
  assert.equal(portal.handoffContracts.length > 0, true)
  assert.deepEqual(portal.recommendedSequence, ['/api/v1/foundation/bootstrap', '/api/v1/portals/bootstrap'])
  assert.equal(portal.governanceTouchpoints.includes('risk-challenge'), true)
  assert.deepEqual(portal.highRiskEntrypoints, ['member-login'])
  assert.equal(portal.actionGovernanceExamples.length >= 6, true)
  assert.deepEqual(
    portal.actionGovernanceExamples.find((example) => example.surface === 'miniapp' && example.action === 'coupon-claim'),
    {
      surface: 'miniapp',
      action: 'coupon-claim',
      scenario: '已登录领券命中高风险时必须先完成微信生态挑战。',
      riskLevel: 'high',
      bootstrapState: 'challenge-required',
      nextStep: 'CHALLENGE',
      submitState: 'challenge-issued',
      requestEndpoint: '/api/v1/storefront/coupons/claim'
    }
  )
  assert.deepEqual(
    portal.actionGovernanceExamples.find((example) => example.surface === 'app' && example.action === 'payment-submit'),
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
  )
  assert.equal(portal.runtimeHandoffExamples.length >= 4, true)
  assert.deepEqual(
    portal.runtimeHandoffExamples.find((example) => example.surface === 'miniapp' && example.action === 'booking-submit'),
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
    }
  )
  assert.deepEqual(
    portal.runtimeHandoffExamples.find((example) => example.surface === 'app' && example.action === 'payment-submit'),
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
  )
  assert.equal(portal.runtimeReceiptExamples.length >= 6, true)
  assert.deepEqual(
    portal.runtimeReceiptExamples.find((example) => example.surface === 'miniapp' && example.mode === 'api-first-submit'),
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
    }
  )
  assert.deepEqual(
    portal.runtimeReceiptExamples.find((example) => example.surface === 'app' && example.mode === 'fallback-callback'),
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
  )
  assert.equal(portal.governanceAlertLifecycleExamples.length >= 8, true)
  assert.deepEqual(
    portal.governanceAlertLifecycleExamples.find((example) => example.surface === 'miniapp' && example.stage === 'mute'),
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
    }
  )
  assert.deepEqual(
    portal.governanceAlertLifecycleExamples.find((example) => example.surface === 'app' && example.stage === 'unmute'),
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
  )
  assert.equal(market.consumer, 'market')
  assert.equal(market.actionGovernanceExamples.length >= 2, true)
  assert.deepEqual(
    market.actionGovernanceExamples.find((example) => example.surface === 'admin-web' && example.action === 'market-profile-resolve'),
    {
      surface: 'admin-web',
      action: 'market-profile-resolve',
      scenario: '运营台读取多市场基线时，在 foundation bootstrap 已就绪的前提下直接拉取 market bootstrap 与覆盖链快照。',
      riskLevel: 'low',
      bootstrapState: 'ready',
      nextStep: 'PROCEED',
      submitState: 'submitted',
      requestEndpoint: '/api/v1/markets/bootstrap'
    }
  )
  assert.equal(market.runtimeHandoffExamples.length, 0)
  assert.equal(market.runtimeReceiptExamples.length, 0)
  assert.equal(market.governanceAlertLifecycleExamples.length >= 4, true)
  assert.deepEqual(
    market.governanceAlertLifecycleExamples.find((example) => example.surface === 'admin-web' && example.stage === 'mute'),
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
    }
  )
  assert.equal(workbench.consumer, 'workbench')
  assert.equal(workbench.highRiskEntrypoints.includes('runtime-replay'), true)
  assert.equal(workbench.actionGovernanceExamples.length >= 3, true)
  assert.deepEqual(
    workbench.actionGovernanceExamples.find((example) => example.surface === 'admin-web' && example.action === 'secret-rotation'),
    {
      surface: 'admin-web',
      action: 'secret-rotation',
      scenario: '治理读面处于 fallback 时，密钥轮换必须先刷新 foundation bootstrap，避免用旧配置直接轮换。',
      riskLevel: 'high',
      bootstrapState: 'readonly-fallback',
      nextStep: 'REFRESH',
      submitState: 'blocked',
      requestEndpoint: '/api/v1/foundation/configuration-governance/secrets/rotate'
    }
  )
  assert.equal(workbench.runtimeHandoffExamples.length >= 3, true)
  assert.deepEqual(
    workbench.runtimeHandoffExamples.find((example) => example.surface === 'admin-web' && example.action === 'runtime-replay'),
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
  )
  assert.equal(workbench.runtimeReceiptExamples.length >= 4, true)
  assert.deepEqual(
    workbench.runtimeReceiptExamples.find((example) => example.surface === 'admin-web' && example.mode === 'fallback-replay'),
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
    }
  )
  assert.equal(workbench.governanceAlertLifecycleExamples.length >= 4, true)
  assert.deepEqual(
    workbench.governanceAlertLifecycleExamples.find((example) => example.surface === 'admin-web' && example.stage === 'mute'),
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
    }
  )
  assert.equal(lytAdapter.consumer, 'lyt-adapter')
  assert.equal(lytAdapter.highRiskEntrypoints.includes('webhook-callback'), true)
  assert.equal(lytAdapter.actionGovernanceExamples.length >= 3, true)
  assert.deepEqual(
    lytAdapter.actionGovernanceExamples.find((example) => example.surface === 'admin-web' && example.action === 'edge-replay'),
    {
      surface: 'admin-web',
      action: 'edge-replay',
      scenario: '门店边缘重放在运营台发起前必须确认实时 foundation bootstrap，避免弱网 fallback 直接驱动重放。',
      riskLevel: 'high',
      bootstrapState: 'readonly-fallback',
      nextStep: 'REFRESH',
      submitState: 'blocked',
      requestEndpoint: '/api/v1/lyt/edge/replay'
    }
  )
  assert.equal(lytAdapter.runtimeHandoffExamples.length >= 3, true)
  assert.deepEqual(
    lytAdapter.runtimeHandoffExamples.find((example) => example.surface === 'admin-web' && example.action === 'webhook-callback'),
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
    }
  )
  assert.equal(lytAdapter.runtimeReceiptExamples.length >= 4, true)
  assert.deepEqual(
    lytAdapter.runtimeReceiptExamples.find((example) => example.surface === 'admin-web' && example.mode === 'fallback-callback'),
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
  )
  assert.equal(lytAdapter.governanceAlertLifecycleExamples.length >= 4, true)
  assert.deepEqual(
    lytAdapter.governanceAlertLifecycleExamples.find((example) => example.surface === 'admin-web' && example.stage === 'unmute'),
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
  )
  assert.deepEqual(fallback.availableConsumers, ['market', 'portal', 'workbench', 'lyt-adapter'])
})
