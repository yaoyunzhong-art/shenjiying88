import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  AppBootstrapWiring,
  FoundationAlertCatalogResponse,
  FoundationAlertMutationResponse,
  FoundationOperationsOverviewResponse,
  RuntimeGovernanceReplayRequest,
  RuntimeGovernanceSubmitRequest,
  RuntimeGovernanceReceipt
} from '@m5/types';
import {
  ApiClient,
  buildActorHeaders,
  buildRuntimeGovernanceReplayRequest,
  buildRuntimeGovernanceSubmitRequest,
  createFoundationBootstrapWiringMeta,
  createFoundationPortalConsumerSnapshotBase,
  createFoundationAlertClient,
  createFoundationAlertPanelClientAccess,
  createFoundationGovernanceReadModelLoader,
  createRuntimeGovernancePanelBindings,
  createRuntimeGovernancePanelClient,
  createWebFoundationAlertPanelClientAccess,
  createFoundationAlertMutationExecutor,
  fallbackPortalConsumerDescriptor,
  getDefaultApiBaseUrl,
  loadFoundationConsumerDescriptor,
  loadFoundationGovernanceReadModel,
  computeBackoffDelay,
  createBusinessClient
} from './index';

test('sdk: builds bootstrap headers from tenant context options', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    requestInit = init;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: { value: 'done' },
        timestamp: '2026-06-12T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({
    baseUrl: 'http://localhost:3001/api/v1/',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    token: 'secret-token'
  });

  const result = await client.getData<{ value: string }>('workbenches/bootstrap');

  assert.equal(result.value, 'done');
  assert.equal(requestUrl, 'http://localhost:3001/api/v1/workbenches/bootstrap');
  assert.equal(requestInit?.method, 'GET');
  assert.deepEqual(requestInit?.headers, {
    'x-tenant-id': 'tenant-demo',
    'x-brand-id': 'brand-demo',
    'x-store-id': 'store-001',
    'x-market-code': 'cn-mainland',
    Authorization: 'Bearer secret-token'
  });
});

test('sdk: builds actor headers with compatibility aliases', () => {
  assert.deepEqual(
    buildActorHeaders({
      actorId: 'actor-001',
      actorType: 'employee-user',
      actorName: 'Actor 001',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      roles: ['OPERATIONS', 'OPERATIONS'],
      permissions: ['foundation.governance.read', 'foundation.governance.read'],
      authenticated: true,
    }),
    {
      'x-actor-id': 'actor-001',
      'x-actor-type': 'employee-user',
      'x-actor-name': 'Actor 001',
      'x-actor-tenant-id': 'tenant-demo',
      'x-actor-brand-id': 'brand-demo',
      'x-actor-store-id': 'store-001',
      'x-actor-roles': 'OPERATIONS',
      'x-roles': 'OPERATIONS',
      'x-actor-permissions': 'foundation.governance.read',
      'x-permissions': 'foundation.governance.read',
      'x-actor-authenticated': 'true',
    },
  );
});

test('sdk: exposes typed bootstrap shortcuts', async () => {
  const requestedPaths: string[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestedPaths.push(String(input));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {},
        timestamp: '2026-06-12T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1' });

  await client.getFoundationBootstrap();
  await client.getMarketBootstrap();
  await client.getPortalBootstrap();
  await client.getPortalDomainGovernanceSummary();
  await client.getWorkbenchBootstrap();
  await client.getFoundationAlertCatalog();
  await client.getFoundationOverview();
  await client.getFoundationAlertDrilldown('observability-degradation');
  await client.getLytStoreCapabilityAccessView('store-001');
  await client.getRuntimeGovernanceReceipt('receipt-001');

  assert.deepEqual(requestedPaths, [
    'http://localhost:3001/api/v1/foundation/bootstrap',
    'http://localhost:3001/api/v1/markets/bootstrap',
    'http://localhost:3001/api/v1/portals/bootstrap',
    'http://localhost:3001/api/v1/portals/domain-governance',
    'http://localhost:3001/api/v1/workbenches/bootstrap',
    'http://localhost:3001/api/v1/foundation/overview/alerts/catalog',
    'http://localhost:3001/api/v1/foundation/overview',
    'http://localhost:3001/api/v1/foundation/overview/alerts/observability-degradation/drilldown',
    'http://localhost:3001/api/v1/lyt/connection/store-001/access-view',
    'http://localhost:3001/api/v1/foundation/runtime-governance/actions/receipt-001'
  ]);
});

test('sdk: exposes runtime governance write shortcuts', async () => {
  const requests: Array<{ url: string; method: string; body?: string | null }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      method: String(init?.method ?? 'GET'),
      body: typeof init?.body === 'string' ? init.body : null
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: { receiptCode: 'receipt-001' },
        timestamp: '2026-06-12T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1' });

  await client.submitRuntimeGovernanceAction({
    app: 'miniapp',
    action: 'coupon-claim',
    nextStep: 'CHALLENGE',
    riskLevel: 'high',
    requestEndpoint: '/api/v1/storefront/coupons/claim',
    payload: { couponTemplateCode: 'NEW_MEMBER_GIFT' },
    payloadSummary: '{"couponTemplateCode":"NEW_MEMBER_GIFT"}',
    recommendedAction: 'COMPLETE_CHALLENGE',
    handlerName: 'miniapp-coupon-claim-handler',
    idempotencyKey: 'miniapp-sync:receipt-001'
  });
  await client.syncRuntimeGovernanceAction('receipt-001', {
    handlerName: 'miniapp-coupon-claim-handler',
    ticketCode: 'receipt-001-CHALLENGE',
    idempotencyKey: 'miniapp-sync:receipt-001'
  });
  await client.recordRuntimeGovernanceCallback('receipt-001', {
    callbackStatus: 'callback-recorded',
    ackToken: 'receipt-001-ACK',
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'handler completed',
    idempotencyKey: 'miniapp-callback:receipt-001'
  });
  await client.replayRuntimeGovernanceAction('receipt-001', {
    ledgerKey: 'runtime-ledger:receipt-001',
    requestedFrom: 'MINIAPP_RUNTIME',
    ticketCode: 'receipt-001-HANDLER',
    idempotencyKey: 'miniapp-replay:receipt-001'
  });
  await client.acknowledgeFoundationAlert('observability-degradation', { note: 'handled' });
  await client.muteFoundationAlert('recovery-drill-attention', {
    note: 'mute for drill',
    mutedUntil: '2026-06-14T00:00:00.000Z'
  });
  await client.unmuteFoundationAlert('recovery-drill-attention', { note: 'restore visibility' });

  assert.deepEqual(
    requests.map((item) => [item.method, item.url]),
    [
      ['POST', 'http://localhost:3001/api/v1/foundation/runtime-governance/actions'],
      ['POST', 'http://localhost:3001/api/v1/foundation/runtime-governance/actions/receipt-001/sync'],
      ['POST', 'http://localhost:3001/api/v1/foundation/runtime-governance/actions/receipt-001/callback'],
      ['POST', 'http://localhost:3001/api/v1/foundation/runtime-governance/actions/receipt-001/replay'],
      ['POST', 'http://localhost:3001/api/v1/foundation/overview/alerts/observability-degradation/ack'],
      ['POST', 'http://localhost:3001/api/v1/foundation/overview/alerts/recovery-drill-attention/mute'],
      ['POST', 'http://localhost:3001/api/v1/foundation/overview/alerts/recovery-drill-attention/unmute']
    ]
  );
  assert.match(requests[0]?.body ?? '', /coupon-claim/);
  assert.match(requests[3]?.body ?? '', /MINIAPP_RUNTIME/);
  assert.match(requests[4]?.body ?? '', /handled/);
  assert.match(requests[5]?.body ?? '', /2026-06-14/);
  assert.match(requests[6]?.body ?? '', /restore visibility/);
});

test('sdk: resolves default api base url from environment or fallback', () => {
  const previousBaseUrl = process.env.M5_API_BASE_URL;
  const previousPublicBaseUrl = process.env.NEXT_PUBLIC_M5_API_BASE_URL;

  process.env.M5_API_BASE_URL = 'http://example.local/api/v1';
  process.env.NEXT_PUBLIC_M5_API_BASE_URL = 'http://public.local/api/v1';
  assert.equal(getDefaultApiBaseUrl(), 'http://example.local/api/v1');

  delete process.env.M5_API_BASE_URL;
  assert.equal(getDefaultApiBaseUrl(), 'http://public.local/api/v1');

  delete process.env.NEXT_PUBLIC_M5_API_BASE_URL;
  assert.equal(getDefaultApiBaseUrl(), 'http://localhost:3001/api/v1');

  if (previousBaseUrl === undefined) {
    delete process.env.M5_API_BASE_URL;
  } else {
    process.env.M5_API_BASE_URL = previousBaseUrl;
  }

  if (previousPublicBaseUrl === undefined) {
    delete process.env.NEXT_PUBLIC_M5_API_BASE_URL;
  } else {
    process.env.NEXT_PUBLIC_M5_API_BASE_URL = previousPublicBaseUrl;
  }
});

test('sdk: creates foundation alert client with default base url', () => {
  const client = createFoundationAlertClient({
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    marketCode: 'cn-mainland'
  });

  assert.ok(client instanceof ApiClient);
});

test('sdk: creates shared foundation alert mutation executor', async () => {
  const calls: Array<{ action: string; code: string; body: Record<string, unknown>; init?: RequestInit }> = [];
  const previousNow = Date.now;
  Date.now = () => new Date('2026-06-13T10:00:00.000Z').valueOf();

  try {
    const executeMutation = createFoundationAlertMutationExecutor(
      {
        acknowledgeFoundationAlert: async (
          code: string,
          body: { note?: string } = {},
          init: RequestInit = {}
        ) => {
          calls.push({ action: 'ACK', code, body, init });
          return { code, acknowledgement: { status: 'ACKED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
        },
        muteFoundationAlert: async (
          code: string,
          body: { note?: string; mutedUntil?: string } = {},
          init: RequestInit = {}
        ) => {
          calls.push({ action: 'MUTE', code, body, init });
          return { code, acknowledgement: { status: 'MUTED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
        },
        unmuteFoundationAlert: async (
          code: string,
          body: { note?: string } = {},
          init: RequestInit = {}
        ) => {
          calls.push({ action: 'UNMUTE', code, body, init });
          return { code, acknowledgement: { status: 'ACKED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
        }
      },
      {
        ackNote: 'acked by shared executor',
        muteNote: 'muted by shared executor',
        unmuteNote: 'unmuted by shared executor',
        muteDurationMs: 30 * 60 * 1000,
        muteInit: { cache: 'no-store' }
      }
    );

    await executeMutation('ACK', 'alert-001');
    await executeMutation('MUTE', 'alert-002');
    await executeMutation('UNMUTE', 'alert-003');
  } finally {
    Date.now = previousNow;
  }

  assert.deepEqual(
    calls.map((item) => ({
      action: item.action,
      code: item.code,
      note: item.body.note,
      mutedUntil: item.body.mutedUntil,
      cache: item.init?.cache
    })),
    [
      {
        action: 'ACK',
        code: 'alert-001',
        note: 'acked by shared executor',
        mutedUntil: undefined,
        cache: undefined
      },
      {
        action: 'MUTE',
        code: 'alert-002',
        note: 'muted by shared executor',
        mutedUntil: '2026-06-13T10:30:00.000Z',
        cache: 'no-store'
      },
      {
        action: 'UNMUTE',
        code: 'alert-003',
        note: 'unmuted by shared executor',
        mutedUntil: undefined,
        cache: undefined
      }
    ]
  );
});

test('sdk: resolves foundation consumer descriptor and swallows mismatches', async () => {
  const client = {
    getFoundationConsumer: async (consumer: string) =>
      consumer === 'portal'
        ? fallbackPortalConsumerDescriptor
        : ({ availableConsumers: ['portal', 'workbench'] } as { availableConsumers: string[] })
  };

  const portalDescriptor = await loadFoundationConsumerDescriptor(client, 'portal');
  const workbenchDescriptor = await loadFoundationConsumerDescriptor(client, 'workbench');

  assert.equal(portalDescriptor?.consumer, 'portal');
  assert.equal(workbenchDescriptor, null);
});

test('sdk: loads governance read model with api and fallback aggregation', async () => {
  const apiClient = {
    getFoundationAlertCatalog: async (): Promise<FoundationAlertCatalogResponse> => ({
      generatedAt: '2026-06-14T00:00:00.000Z',
      alerts: [
        {
          code: 'observability-degradation',
          defaultSummary: 'Observability degraded',
          severityPolicy: 'Escalate to SRE if sustained for 15m',
          sourceModules: ['resilience-operations'],
          drilldownEnabled: true,
          acknowledgementEnabled: true,
          drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
          ackPath: '/foundation/overview/alerts/observability-degradation/ack',
          mutePath: '/foundation/overview/alerts/observability-degradation/mute',
          unmutePath: '/foundation/overview/alerts/observability-degradation/unmute'
        }
      ]
    }),
    getFoundationOverview: async (): Promise<FoundationOperationsOverviewResponse> => ({
      generatedAt: '2026-06-14T00:05:00.000Z',
      summary: {
        approvalsPending: 1,
        approvalsWithFailures: 0,
        highRiskAudits: 0,
        blockedLedgers: 0,
        rotationDueSecrets: 0,
        expiredSecrets: 0,
        expiringCertificates: 0,
        expiredCertificates: 0,
        degradedSignals: 1,
        attentionRecoveryPlans: 0,
        staleDrills: 0,
        runtimeGovernanceBacklog: 2,
        stalledRuntimeCallbacks: 0,
        highRiskRuntimeBacklog: 1,
        runtimeBlockedActions: 0
      },
      alerts: [
        {
          code: 'runtime-governance-backlog',
          severity: 'high',
          count: 2,
          summary: 'Runtime governance backlog requires operator attention'
        }
      ],
      topRisks: [
        {
          code: 'runtime-governance-backlog',
          severity: 'high',
          count: 2,
          summary: 'Runtime governance backlog requires operator attention'
        }
      ]
    })
  };

  const apiReadModel = await loadFoundationGovernanceReadModel(apiClient);
  assert.equal(apiReadModel.deliveryMode, 'api');
  assert.equal(apiReadModel.generatedAt, '2026-06-14T00:05:00.000Z');
  assert.equal(apiReadModel.summary.runtimeGovernanceBacklog, 2);
  assert.equal(apiReadModel.overviewAlerts[0]?.code, 'runtime-governance-backlog');

  const fallbackReadModel = await loadFoundationGovernanceReadModel({
    getFoundationAlertCatalog: async () => {
      throw new Error('catalog offline');
    },
    getFoundationOverview: async () => {
      throw new Error('overview offline');
    }
  });

  assert.equal(fallbackReadModel.deliveryMode, 'fallback');
  assert.match(fallbackReadModel.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(fallbackReadModel.alerts.length > 0);
  assert.equal(fallbackReadModel.overviewAlerts.length, 0);
});

test('sdk: builds shared bootstrap wiring meta snapshot', () => {
  const wiring: AppBootstrapWiring = {
    app: 'tob-web',
    audience: 'MERCHANT',
    bootstrapFile: 'app/bootstrap.ts',
    bootstrapEndpoint: '/api/v1/portals/bootstrap',
    consumes: ['portal', 'governance'],
    cacheableCapabilities: ['portal-shell', 'governance-read'],
    tenantScope: {
      bootstrapRequired: true,
      cacheLayer: 'MEMORY',
      resolver: 'tenant-from-host',
      revalidateOn: ['tenant-change', 'market-change'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'MASKED',
      notes: ['mask pii']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      ttlSeconds: 120,
      fallbackStrategy: 'READONLY_LAST_KNOWN',
      notes: ['use last known']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'NONE',
      enforcement: 'STEP_UP',
      notes: ['challenge before login']
    }
  };

  const meta = createFoundationBootstrapWiringMeta(wiring);

  assert.deepEqual(meta, {
    scope: {
      resolver: 'tenant-from-host',
      revalidateOn: ['tenant-change', 'market-change'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    degradation: {
      featureFlagFallback: 'READONLY_LAST_KNOWN',
      desensitizationMode: 'MASKED',
      cacheableCapabilities: ['portal-shell', 'governance-read']
    },
    challenge: {
      enforcement: 'STEP_UP',
      notes: ['challenge before login']
    }
  });
});

test('sdk: builds shared portal consumer snapshot base', () => {
  const wiring: AppBootstrapWiring = {
    app: 'storefront-web',
    audience: 'CONSUMER',
    bootstrapFile: 'app/market-bootstrap.ts',
    bootstrapEndpoint: '/api/v1/portals/bootstrap',
    consumes: ['portal', 'governance'],
    cacheableCapabilities: ['portal-shell', 'governance-read'],
    tenantScope: {
      bootstrapRequired: true,
      cacheLayer: 'MEMORY',
      resolver: 'tenant-from-host',
      revalidateOn: ['tenant-change', 'store-change'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'MASKED',
      notes: ['mask pii']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      ttlSeconds: 120,
      fallbackStrategy: 'READONLY_LAST_KNOWN',
      notes: ['use last known']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'NONE',
      enforcement: 'STEP_UP',
      notes: ['challenge before checkout']
    }
  };

  const snapshotBase = createFoundationPortalConsumerSnapshotBase({
    wiring,
    bootstrap: {
      foundationDependencies: ['identity-access', 'configuration-governance'],
      foundationContracts: ['portal-contract'],
      regionalOverrides: [{ code: 'holiday-campaign' }]
    },
    consumerDescriptor: null
  });

  assert.equal(snapshotBase.deliveryMode, 'api');
  assert.deepEqual(snapshotBase.foundationDependencies, ['identity-access', 'configuration-governance']);
  assert.deepEqual(snapshotBase.foundationContracts, ['portal-contract']);
  assert.equal(snapshotBase.regionalOverridesCount, 1);
  assert.equal(snapshotBase.consumerDescriptor.consumer, fallbackPortalConsumerDescriptor.consumer);
  assert.deepEqual(snapshotBase.scope, {
    resolver: 'tenant-from-host',
    revalidateOn: ['tenant-change', 'store-change'],
    mismatchStrategy: 'FAIL_CLOSED'
  });
  assert.deepEqual(snapshotBase.degradation, {
    featureFlagFallback: 'READONLY_LAST_KNOWN',
    desensitizationMode: 'MASKED',
    cacheableCapabilities: ['portal-shell', 'governance-read']
  });
  assert.deepEqual(snapshotBase.challenge, {
    enforcement: 'STEP_UP',
    notes: ['challenge before checkout']
  });
});

test('sdk: creates governance read model loader from client factory', async () => {
  const seenArgs: Array<string | undefined> = [];
  const loader = createFoundationGovernanceReadModelLoader((tenantId?: string) => {
    seenArgs.push(tenantId);

    return {
      getFoundationAlertCatalog: async () => ({
        alerts: [],
        generatedAt: '2026-06-14T00:00:00.000Z'
      }) as FoundationAlertCatalogResponse,
      getFoundationOverview: async () => ({
        summary: {
          approvalsPending: 2,
          approvalsWithFailures: 0,
          highRiskAudits: 1,
          blockedLedgers: 0,
          rotationDueSecrets: 0,
          expiredSecrets: 0,
          expiringCertificates: 0,
          expiredCertificates: 0,
          degradedSignals: 1,
          attentionRecoveryPlans: 0,
          staleDrills: 0,
          runtimeGovernanceBacklog: 0,
          stalledRuntimeCallbacks: 0,
          highRiskRuntimeBacklog: 0,
          runtimeBlockedActions: 0
        },
        alerts: [],
        topRisks: [],
        generatedAt: '2026-06-14T00:00:00.000Z'
      }) as FoundationOperationsOverviewResponse
    };
  });

  const result = await loader('tenant-demo');

  assert.deepEqual(seenArgs, ['tenant-demo']);
  assert.equal(result.deliveryMode, 'api');
  assert.equal(result.summary.approvalsPending, 2);
  assert.equal(result.generatedAt, '2026-06-14T00:00:00.000Z');
});

test('sdk: creates runtime governance panel client and bindings', async () => {
  const calls: Array<{ action: string; receiptCode?: string; init?: RequestInit; body?: unknown }> = [];
  const client = createRuntimeGovernancePanelClient({
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
  const createReceipt = (receiptCode: string, action: RuntimeGovernanceReceipt['action'], replayStatus: 'idle' | 'replay-scheduled') =>
    ({
      receiptCode,
      app: 'storefront-web',
      action,
      state: 'submitted',
      nextStep: 'PROCEED',
      riskLevel: 'high',
      recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
      requestEndpoint: '/api/v1/storefront/bookings',
      payloadSummary: '{}',
      ticket: {
        ticketCode: 'ticket-001',
        ticketType: 'HANDLER_CALLBACK',
        status: 'ready-for-handler',
        summary: 'ready'
      },
      sync: {
        handlerName: 'handler',
        syncMode: 'callback-followup',
        syncEndpoint: '/sync',
        callbackEndpoint: '/callback',
        idempotencyKey: `sync:${receiptCode}`,
        ready: true,
        summary: 'ready'
      },
      callback: {
        callbackStatus: 'awaiting-callback',
        ackToken: 'ack-token',
        lastEvent: 'HANDLER_ACCEPTED',
        summary: 'waiting'
      },
      ledger: {
        ledgerKey: 'ledger-001',
        replayEndpoint: '/replay',
        replayable: true,
        summary: 'replay ready'
      },
      retry: {
        replayEndpoint: '/replay',
        retryable: true,
        maxAttempts: 3,
        currentAttempt: replayStatus === 'idle' ? 0 : 1,
        nextBackoffMs: 2000,
        escalationAction: 'WAIT_CALLBACK',
        summary: 'waiting callback'
      },
      rateLimit: {
        allowed: true,
        limit: 10,
        remaining: replayStatus === 'idle' ? 9 : 8,
        retryAfterSeconds: 0,
        scopeKey: 'scope-001'
      },
      events: [],
      generatedAt: '2026-06-14T00:00:00.000Z'
    }) satisfies RuntimeGovernanceReceipt;

  client.submitRuntimeGovernanceAction = async (body: RuntimeGovernanceSubmitRequest, init: RequestInit = {}) => {
    calls.push({ action: 'SUBMIT', body, init });
    return createReceipt('runtime-001', body.action, 'idle');
  };
  client.getRuntimeGovernanceReceipt = async (receiptCode: string, init: RequestInit = {}) => {
    calls.push({ action: 'QUERY', receiptCode, init });
    return createReceipt(receiptCode, 'booking-submit', 'idle');
  };
  client.replayRuntimeGovernanceAction = async (
    receiptCode: string,
    body: RuntimeGovernanceReplayRequest,
    init: RequestInit = {}
  ) => {
    calls.push({ action: 'REPLAY', receiptCode, body, init });
    return createReceipt(receiptCode, 'booking-submit', 'replay-scheduled');
  };

  const bindings = createRuntimeGovernancePanelBindings({
    client,
    buildSubmitRequest: (preset: { action: string }, nonce: string) =>
      ({
        app: 'storefront-web',
        action: preset.action as RuntimeGovernanceReceipt['action'],
        nextStep: 'PROCEED',
        riskLevel: 'high',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { nonce },
        payloadSummary: JSON.stringify({ nonce }),
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'handler',
        idempotencyKey: `submit:${nonce}`,
        actorId: 'ops.storefront-web',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
      }) as RuntimeGovernanceSubmitRequest,
    buildReplayRequest: (receipt: RuntimeGovernanceReceipt, nonce: string) =>
      ({
        ledgerKey: receipt.ledger.ledgerKey,
        requestedFrom: 'STOREFRONT_WEB_RUNTIME',
        ticketCode: receipt.ticket.ticketCode,
        idempotencyKey: `replay:${nonce}`,
        actorId: 'ops.storefront-web',
        tenantId: 'tenant-demo'
      }) as RuntimeGovernanceReplayRequest
  });

  const submitted = await bindings.submitPreset({ action: 'booking-submit' }, '001');
  await bindings.queryReceipt(submitted);
  await bindings.replayReceipt(submitted, '002');

  assert.deepEqual(
    calls.map((item) => ({
      action: item.action,
      receiptCode: item.receiptCode,
      cache: item.init?.cache,
      idempotencyKey:
        (item.body as RuntimeGovernanceSubmitRequest | RuntimeGovernanceReplayRequest | undefined)?.idempotencyKey
    })),
    [
      {
        action: 'SUBMIT',
        receiptCode: undefined,
        cache: undefined,
        idempotencyKey: 'submit:001'
      },
      {
        action: 'QUERY',
        receiptCode: 'runtime-001',
        cache: 'no-store',
        idempotencyKey: undefined
      },
      {
        action: 'REPLAY',
        receiptCode: 'runtime-001',
        cache: undefined,
        idempotencyKey: 'replay:002'
      }
    ]
  );
});

test('sdk: builds shared runtime governance submit and replay requests', () => {
  const submitRequest = buildRuntimeGovernanceSubmitRequest({
    app: 'storefront-web',
    actorId: 'ops.storefront-web',
    nonce: '001',
    preset: {
      action: 'booking-submit',
      nextStep: 'PROCEED',
      riskLevel: 'high',
      requestEndpoint: '/api/v1/storefront/bookings',
      payload: { bookingCode: 'BOOK-001' },
      recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
      handlerName: 'storefront-booking-submit-handler'
    },
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });

  assert.equal(submitRequest.idempotencyKey, 'storefront-web:booking-submit:submit:001');
  assert.equal(submitRequest.actorId, 'ops.storefront-web');
  assert.equal(submitRequest.payloadSummary, '{"bookingCode":"BOOK-001"}');

  const receipt = {
    receiptCode: 'receipt-001',
    app: 'storefront-web',
    action: 'booking-submit',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'high',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    payloadSummary: '{"bookingCode":"BOOK-001"}',
    ticket: {
      ticketCode: 'receipt-001-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: 'ready'
    },
    sync: {
      handlerName: 'storefront-booking-submit-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/callback',
      idempotencyKey: 'storefront-web:booking-submit:submit:001',
      ready: true,
      summary: 'ready'
    },
    callback: {
      callbackStatus: 'awaiting-callback',
      ackToken: 'runtime-ack-handler',
      lastEvent: 'HANDLER_ACCEPTED',
      summary: 'waiting'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:receipt-001',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/replay',
      replayable: true,
      summary: 'replay ready'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: 'waiting callback'
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: 'storefront-web:booking-submit:tenant-demo'
    },
    events: [],
    generatedAt: '2026-06-14T00:00:00.000Z'
  } satisfies RuntimeGovernanceReceipt;

  const replayRequest = buildRuntimeGovernanceReplayRequest({
    app: 'storefront-web',
    actorId: 'ops.storefront-web',
    nonce: '002',
    requestedFrom: 'STOREFRONT_WEB_RUNTIME',
    receipt,
    tenantId: 'tenant-demo'
  });

  assert.equal(replayRequest.idempotencyKey, 'storefront-web:booking-submit:replay:002');
  assert.equal(replayRequest.requestedFrom, 'STOREFRONT_WEB_RUNTIME');
  assert.equal(replayRequest.ticketCode, 'receipt-001-HANDLER');
  assert.equal(replayRequest.tenantId, 'tenant-demo');
});

test('sdk: creates foundation alert panel client access bundle', async () => {
  const calls: Array<{ action: string; code: string; body?: Record<string, unknown>; init?: RequestInit }> = [];
  const previousNow = Date.now;
  Date.now = () => new Date('2026-06-13T10:00:00.000Z').valueOf();

  try {
    const { client, loadDrilldown, executeMutation } = createFoundationAlertPanelClientAccess({
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
      ackNote: 'panel ack',
      muteNote: 'panel mute',
      unmuteNote: 'panel unmute',
      drilldownInit: { cache: 'no-store' },
      muteInit: { cache: 'reload' }
    });

    assert.ok(client instanceof ApiClient);

    client.getFoundationAlertDrilldown = async (code: string, init: RequestInit = {}) => {
      calls.push({ action: 'DRILLDOWN', code, init });
      return {
        alert: { code, summary: 'drilldown' },
        history: [],
        acknowledgement: { status: 'UNACKED' }
      } as never;
    };
    client.acknowledgeFoundationAlert = async (code: string, body: { note?: string } = {}, init: RequestInit = {}) => {
      calls.push({ action: 'ACK', code, body, init });
      return { code, acknowledgement: { status: 'ACKED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };
    client.muteFoundationAlert = async (
      code: string,
      body: { note?: string; mutedUntil?: string } = {},
      init: RequestInit = {}
    ) => {
      calls.push({ action: 'MUTE', code, body, init });
      return { code, acknowledgement: { status: 'MUTED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };

    await loadDrilldown('alert-001');
    await executeMutation('ACK', 'alert-002');
    await executeMutation('MUTE', 'alert-003');
  } finally {
    Date.now = previousNow;
  }

  assert.deepEqual(
    calls.map((item) => ({
      action: item.action,
      code: item.code,
      note: item.body?.note,
      mutedUntil: item.body?.mutedUntil,
      cache: item.init?.cache
    })),
    [
      {
        action: 'DRILLDOWN',
        code: 'alert-001',
        note: undefined,
        mutedUntil: undefined,
        cache: 'no-store'
      },
      {
        action: 'ACK',
        code: 'alert-002',
        note: 'panel ack',
        mutedUntil: undefined,
        cache: undefined
      },
      {
        action: 'MUTE',
        code: 'alert-003',
        note: 'panel mute',
        mutedUntil: '2026-06-13T12:00:00.000Z',
        cache: 'reload'
      }
    ]
  );
});

test('sdk: creates web foundation alert panel access with app presets', async () => {
  const adminCalls: Array<{ action: string; code: string; body?: Record<string, unknown>; init?: RequestInit }> = [];
  const storefrontCalls: Array<{ action: string; code: string; body?: Record<string, unknown>; init?: RequestInit }> = [];
  const previousNow = Date.now;
  Date.now = () => new Date('2026-06-13T10:00:00.000Z').valueOf();

  try {
    const admin = createWebFoundationAlertPanelClientAccess({
      app: 'admin-web',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland'
    });
    const storefront = createWebFoundationAlertPanelClientAccess({
      app: 'storefront-web',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland'
    });

    admin.client.getFoundationAlertDrilldown = async (code: string, init: RequestInit = {}) => {
      adminCalls.push({ action: 'DRILLDOWN', code, init });
      return {
        alert: { code, summary: 'admin drilldown' },
        history: [],
        acknowledgement: { status: 'UNACKED' }
      } as never;
    };
    admin.client.muteFoundationAlert = async (
      code: string,
      body: { note?: string; mutedUntil?: string } = {},
      init: RequestInit = {}
    ) => {
      adminCalls.push({ action: 'MUTE', code, body, init });
      return { code, acknowledgement: { status: 'MUTED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };

    storefront.client.getFoundationAlertDrilldown = async (code: string, init: RequestInit = {}) => {
      storefrontCalls.push({ action: 'DRILLDOWN', code, init });
      return {
        alert: { code, summary: 'storefront drilldown' },
        history: [],
        acknowledgement: { status: 'UNACKED' }
      } as never;
    };
    storefront.client.muteFoundationAlert = async (
      code: string,
      body: { note?: string; mutedUntil?: string } = {},
      init: RequestInit = {}
    ) => {
      storefrontCalls.push({ action: 'MUTE', code, body, init });
      return { code, acknowledgement: { status: 'MUTED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };

    await admin.loadDrilldown('alert-admin');
    await admin.executeMutation('MUTE', 'alert-admin');
    await storefront.loadDrilldown('alert-storefront');
    await storefront.executeMutation('MUTE', 'alert-storefront');
  } finally {
    Date.now = previousNow;
  }

  assert.deepEqual(
    adminCalls.map((item) => ({
      action: item.action,
      code: item.code,
      note: item.body?.note,
      cache: item.init?.cache
    })),
    [
      {
        action: 'DRILLDOWN',
        code: 'alert-admin',
        note: undefined,
        cache: 'no-store'
      },
      {
        action: 'MUTE',
        code: 'alert-admin',
        note: 'admin web temporary mute',
        cache: 'no-store'
      }
    ]
  );
  assert.deepEqual(
    storefrontCalls.map((item) => ({
      action: item.action,
      code: item.code,
      note: item.body?.note,
      cache: item.init?.cache
    })),
    [
      {
        action: 'DRILLDOWN',
        code: 'alert-storefront',
        note: undefined,
        cache: 'no-store'
      },
      {
        action: 'MUTE',
        code: 'alert-storefront',
        note: 'storefront web temporary mute',
        cache: undefined
      }
    ]
  );
});

test('sdk: foundation alert panel access exposes ack/mute/unmute wrappers', async () => {
  const calls: Array<{ action: string; code: string; note?: string; cache?: RequestCache }> = [];
  const previousNow = Date.now;
  Date.now = () => new Date('2026-06-13T10:00:00.000Z').valueOf();

  try {
    const access = createFoundationAlertPanelClientAccess({
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      marketCode: 'cn-mainland',
      ackNote: 'panel ack wrapper',
      muteNote: 'panel mute wrapper',
      unmuteNote: 'panel unmute wrapper',
      muteInit: { cache: 'reload' },
    });

    access.client.acknowledgeFoundationAlert = async (
      code: string,
      body: { note?: string } = {},
      init: RequestInit = {}
    ) => {
      calls.push({ action: 'ACK', code, note: body.note, cache: init.cache });
      return { code, acknowledgement: { status: 'ACKED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };
    access.client.muteFoundationAlert = async (
      code: string,
      body: { note?: string; mutedUntil?: string } = {},
      init: RequestInit = {}
    ) => {
      calls.push({ action: 'MUTE', code, note: body.note, cache: init.cache });
      return { code, acknowledgement: { status: 'MUTED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };
    access.client.unmuteFoundationAlert = async (
      code: string,
      body: { note?: string } = {},
      init: RequestInit = {}
    ) => {
      calls.push({ action: 'UNMUTE', code, note: body.note, cache: init.cache });
      return { code, acknowledgement: { status: 'ACKED', note: String(body.note ?? '') } } as FoundationAlertMutationResponse;
    };

    await access.ackAlert('alert-ack');
    await access.muteAlert('alert-mute');
    await access.unmuteAlert('alert-unmute');
  } finally {
    Date.now = previousNow;
  }

  assert.deepEqual(calls, [
    { action: 'ACK', code: 'alert-ack', note: 'panel ack wrapper', cache: undefined },
    { action: 'MUTE', code: 'alert-mute', note: 'panel mute wrapper', cache: 'reload' },
    { action: 'UNMUTE', code: 'alert-unmute', note: 'panel unmute wrapper', cache: undefined },
  ]);
});

test('sdk: putData sends PUT request with JSON body', async () => {
  const requests: Array<{ url: string; method: string; headers: Record<string, string | undefined>; body?: string }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      method: String(init?.method ?? 'GET'),
      headers: (init?.headers ?? {}) as Record<string, string | undefined>,
      body: typeof init?.body === 'string' ? init.body : undefined
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: { receiptCode: 'updated-001' },
        timestamp: '2026-06-25T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({
    baseUrl: 'http://localhost:3001/api/v1',
    tenantId: 'tenant-demo'
  });

  const result = await client.putData<{ receiptCode: string }>('/runtime-governance/receipts/rc-001', {
    nextStep: 'PROCEED'
  });

  assert.equal(result.receiptCode, 'updated-001');
  assert.equal(requests[0]?.url, 'http://localhost:3001/api/v1/runtime-governance/receipts/rc-001');
  assert.equal(requests[0]?.method, 'PUT');
  assert.match(requests[0]?.body ?? '', /PROCEED/);
  assert.equal(requests[0]?.headers?.['content-type'], 'application/json');
  assert.equal(requests[0]?.headers?.['x-tenant-id'], 'tenant-demo');
});

test('sdk: patchData sends PATCH request with JSON body', async () => {
  const requests: Array<{ url: string; method: string; body?: string }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      method: String(init?.method ?? 'GET'),
      body: typeof init?.body === 'string' ? init.body : undefined
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: { updated: true },
        timestamp: '2026-06-25T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', brandId: 'brand-demo' });

  const result = await client.patchData<{ updated: boolean }>('/configuration-governance/config-entries/ns/key-1', {
    value: 'new-value'
  });

  assert.equal(result.updated, true);
  assert.equal(requests[0]?.url, 'http://localhost:3001/api/v1/configuration-governance/config-entries/ns/key-1');
  assert.equal(requests[0]?.method, 'PATCH');
  assert.match(requests[0]?.body ?? '', /new-value/);
});

test('sdk: deleteData sends DELETE request without body', async () => {
  const requests: Array<{ url: string; method: string; body?: string }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      method: String(init?.method ?? 'GET'),
      body: typeof init?.body === 'string' ? init.body : undefined
    });
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: { deleted: true },
        timestamp: '2026-06-25T00:00:00.000Z'
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', storeId: 'store-001' });

  const result = await client.deleteData<{ deleted: boolean }>('/identity-access/credentials/cred-001');

  assert.equal(result.deleted, true);
  assert.equal(requests[0]?.url, 'http://localhost:3001/api/v1/identity-access/credentials/cred-001');
  assert.equal(requests[0]?.method, 'DELETE');
  assert.equal(requests[0]?.body, undefined);
});

test('sdk: computeBackoffDelay attempt=1 returns initialDelayMs', () => {
  assert.equal(computeBackoffDelay(1, 1000, 2), 1000);
  assert.equal(computeBackoffDelay(1, 500, 3), 500);
});

test('sdk: computeBackoffDelay attempt=2 doubles delay', () => {
  assert.equal(computeBackoffDelay(2, 1000, 2), 2000);
  assert.equal(computeBackoffDelay(2, 500, 3), 1500);
});

test('sdk: computeBackoffDelay attempt=0 treated as attempt=1', () => {
  assert.equal(computeBackoffDelay(0, 1000, 2), 1000);
});

test('sdk: computeBackoffDelay attempt=5 exponential growth', () => {
  assert.equal(computeBackoffDelay(5, 100, 2), 1600); // 100*2^4
});

test('sdk: ApiClient sends tenant config batch via POST /tenant-config/batch', async () => {
  let requestUrl = '';
  let requestBody = '';
  globalThis.fetch = (async (input, init) => {
    requestUrl = String(input);
    requestBody = typeof init?.body === 'string' ? init.body : '';
    return new Response(
      JSON.stringify({ success: true, data: { items: [{ key: 'test-key', value: 'test' }], total: 1 }, timestamp: '2026-07-22T00:00:00.000Z' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', tenantId: 't1' });
  const result = await client.setTenantConfigBatch([
    { key: 'test-key', value: 'test' }
  ]);

  assert.equal(result.total, 1);
  assert.equal(requestUrl, 'http://localhost:3001/api/v1/tenant-config/batch');
  assert.match(requestBody, /test-key/);
});

test('sdk: ApiClient fetches workbench configs by code', async () => {
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ success: true, data: { workbench: 'W-S', items: [{ key: 'theme', value: 'dark' }], total: 1 }, timestamp: '2026-07-22T00:00:00.000Z' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', tenantId: 't1' });
  const result = await client.getTenantWorkbenchConfigs('W-S');
  assert.equal(result.workbench, 'W-S');
  assert.equal(result.total, 1);
});

test('sdk: ApiClient gets tenant config meta definitions', async () => {
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ success: true, data: { items: [{ key: 'theme', type: 'string', description: 'UI theme' }], total: 1 }, timestamp: '2026-07-22T00:00:00.000Z' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', tenantId: 't1' });
  const result = await client.getTenantConfigMeta();
  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.key, 'theme');
});

test('sdk: ApiClient rollbacks tenant config', async () => {
  let requestBody = '';
  globalThis.fetch = (async (_input, init) => {
    requestBody = typeof init?.body === 'string' ? init.body : '';
    return new Response(
      JSON.stringify({ success: true, data: { key: 'theme', value: 'light', version: 2 }, timestamp: '2026-07-22T00:00:00.000Z' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', tenantId: 't1' });
  const result = await client.rollbackTenantConfig(1, 'theme');
  assert.equal(result.version, 2);
  assert.match(requestBody, /targetVersion/);
  assert.match(requestBody, /configId/);
});

test('sdk: ApiClient lists tenant config audit logs', async () => {
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ success: true, data: [{ id: 'log-1', action: 'UPDATE', key: 'theme' }], timestamp: '2026-07-22T00:00:00.000Z' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )) as typeof fetch;

  const client = new ApiClient({ baseUrl: 'http://localhost:3001/api/v1', tenantId: 't1' });
  const logs = await client.listTenantConfigAuditLogs('tenant-demo', 50);
  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.action, 'UPDATE');
});

test('sdk: createBusinessClient returns typed client with checkout/orders/cashier', () => {
  const biz = createBusinessClient('http://localhost:3002/api/v1');
  assert.ok(biz.checkout);
  assert.ok(biz.checkout.start);
  assert.ok(biz.orders);
  assert.ok(biz.orders.list);
  assert.ok(biz.orders.get);
  assert.ok(biz.cashier);
  assert.ok(biz.cashier.lookupMember);
  assert.ok(biz.cashier.lookupProduct);
  assert.ok(biz.cashier.createOrder);
  assert.ok(biz.cashier.createPayment);
  assert.ok(biz.cashier.createRefund);
  assert.ok(biz.refunds);
  assert.ok(biz.finance);
  assert.ok(biz.paymentGateway);
  assert.ok(biz.budget);
  assert.ok(biz.promotions);
  assert.ok(biz.raw);
  assert.equal(typeof biz.checkout.start, 'function');
});

test('sdk: createBusinessClient checkout.start makes POST request', async () => {
  let requestUrl = '';
  let requestMethod = '';
  globalThis.fetch = (async (input, init) => {
    requestUrl = String(input);
    requestMethod = String(init?.method ?? '');
    return new Response(
      JSON.stringify({ success: true, data: { orderId: 'ord-001', transactionId: 'tx-001', totalCents: 2999 }, timestamp: '2026-07-22T00:00:00.000Z' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const biz = createBusinessClient('http://localhost:3002/api/v1');
  const result = await biz.checkout.start({
    memberId: 'mem-001',
    items: [{ productId: 'p1', quantity: 1, unitPriceCents: 2999 }],
    paymentChannel: 'WECHAT',
  });
  assert.equal(result.orderId, 'ord-001');
  assert.equal(result.totalCents, 2999);
  assert.match(requestUrl, /transactions\/checkout/);
  assert.equal(requestMethod, 'POST');
});

test('sdk: createBusinessClient cashier.lookupMember encodes query', async () => {
  let requestUrl = '';
  globalThis.fetch = (async (input) => {
    requestUrl = String(input);
    return new Response(
      JSON.stringify({ success: true, data: { id: 'mem-001', memberNo: 'MEM001', name: '张三', phone: '13800138001', tier: 'gold', points: 1000, discountRate: 0.9 }, timestamp: '2026-07-22T00:00:00.000Z' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const biz = createBusinessClient('http://localhost:3002/api/v1');
  const result = await biz.cashier.lookupMember('13800138001');
  assert.equal(result?.id, 'mem-001');
  assert.match(requestUrl, /13800138001/);
});

test('sdk: createBusinessClient cashier.listProducts builds URL params', async () => {
  let requestUrl = '';
  globalThis.fetch = (async (input) => {
    requestUrl = String(input);
    return new Response(
      JSON.stringify({ success: true, data: { items: [], total: 0 }, timestamp: '2026-07-22T00:00:00.000Z' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const biz = createBusinessClient('http://localhost:3002/api/v1');
  await biz.cashier.listProducts({ limit: 20, offset: 0 });
  assert.match(requestUrl, /limit=20/);
  assert.match(requestUrl, /offset=0/);
});

test('sdk: createBusinessClient orders.listPage returns paginated response', async () => {
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ success: true, data: { items: [{ orderId: 'o1' }], total: 1, page: 1, pageSize: 20 }, timestamp: '2026-07-22T00:00:00.000Z' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )) as typeof fetch;

  const biz = createBusinessClient('http://localhost:3002/api/v1');
  const result = await biz.orders.listPage({ page: 1, pageSize: 20 });
  assert.equal(result.total, 1);
  assert.ok(Array.isArray(result.items));
});

test('sdk: createBusinessClient finance accounts and revenue summary', async () => {
  globalThis.fetch = (async () => new Response(
    JSON.stringify({ success: true, data: [{ id: 'acct-001', tenantId: 'tenant-demo', name: 'Main Account', type: 'CASH', balance: 10000, status: 'ACTIVE', createdAt: '2026-07-22T00:00:00Z', updatedAt: '2026-07-22T00:00:00Z' }], timestamp: '2026-07-22T00:00:00.000Z' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )) as typeof fetch;

  const biz = createBusinessClient('http://localhost:3002/api/v1');
  const accounts = await biz.finance.listAccounts();
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0]?.id, 'acct-001');
});

test('sdk: createBusinessClient paymentGateway.pay sends POST', async () => {
  let requestUrl = '';
  globalThis.fetch = (async (input) => {
    requestUrl = String(input);
    return new Response(
      JSON.stringify({ success: true, data: { transactionId: 'pay-001', status: 'pending' }, timestamp: '2026-07-22T00:00:00.000Z' }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch;

  const biz = createBusinessClient('http://localhost:3002/api/v1');
  const result = (await biz.paymentGateway.pay({
    orderId: 'ord-001', amount: 2999, currency: 'CNY', provider: 'WECHAT',
  })) as { transactionId: string };
  assert.equal(result.transactionId, 'pay-001');
  assert.match(requestUrl, /payment-gateway\/pay/);
});

test('sdk: computeBackoffDelay large number of attempts', () => {
  // 10th attempt: 1000 * 2^9 = 512000
  assert.equal(computeBackoffDelay(10, 1000, 2), 512000);
  // 7th attempt with multiplier 3: 1000 * 3^6 = 729000
  assert.equal(computeBackoffDelay(7, 1000, 3), 729000);
});
