"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiClient: () => ApiClient,
  buildRuntimeGovernanceReplayRequest: () => buildRuntimeGovernanceReplayRequest,
  buildRuntimeGovernanceSubmitRequest: () => buildRuntimeGovernanceSubmitRequest,
  createFoundationAlertClient: () => createFoundationAlertClient,
  createFoundationAlertMutationExecutor: () => createFoundationAlertMutationExecutor,
  createFoundationAlertPanelClientAccess: () => createFoundationAlertPanelClientAccess,
  createFoundationBootstrapWiringMeta: () => createFoundationBootstrapWiringMeta,
  createFoundationGovernanceReadModelLoader: () => createFoundationGovernanceReadModelLoader,
  createFoundationPortalConsumerSnapshotBase: () => createFoundationPortalConsumerSnapshotBase,
  createRuntimeGovernancePanelBindings: () => createRuntimeGovernancePanelBindings,
  createRuntimeGovernancePanelClient: () => createRuntimeGovernancePanelClient,
  createWebFoundationAlertPanelClientAccess: () => createWebFoundationAlertPanelClientAccess,
  emptyFoundationGovernanceOverviewSummary: () => emptyFoundationGovernanceOverviewSummary,
  fallbackPortalConsumerDescriptor: () => fallbackPortalConsumerDescriptor,
  getDefaultApiBaseUrl: () => getDefaultApiBaseUrl,
  loadFoundationConsumerDescriptor: () => loadFoundationConsumerDescriptor,
  loadFoundationGovernanceReadModel: () => loadFoundationGovernanceReadModel
});
module.exports = __toCommonJS(index_exports);
var import_types = require("@m5/types");
var emptyFoundationGovernanceOverviewSummary = {
  approvalsPending: 0,
  approvalsWithFailures: 0,
  highRiskAudits: 0,
  blockedLedgers: 0,
  rotationDueSecrets: 0,
  expiredSecrets: 0,
  expiringCertificates: 0,
  expiredCertificates: 0,
  degradedSignals: 0,
  attentionRecoveryPlans: 0,
  staleDrills: 0,
  runtimeGovernanceBacklog: 0,
  stalledRuntimeCallbacks: 0,
  highRiskRuntimeBacklog: 0,
  runtimeBlockedActions: 0
};
function createFoundationBootstrapWiringMeta(wiring) {
  return {
    scope: {
      resolver: wiring.tenantScope.resolver,
      revalidateOn: [...wiring.tenantScope.revalidateOn],
      mismatchStrategy: wiring.tenantScope.mismatchStrategy
    },
    degradation: {
      featureFlagFallback: wiring.featureFlags.fallbackStrategy,
      desensitizationMode: wiring.desensitization.defaultMode,
      cacheableCapabilities: [...wiring.cacheableCapabilities]
    },
    challenge: {
      enforcement: wiring.riskChallenge.enforcement,
      notes: [...wiring.riskChallenge.notes]
    }
  };
}
function createFoundationGovernanceReadModelLoader(clientFactory, init) {
  return (...args) => loadFoundationGovernanceReadModel(clientFactory(...args), init);
}
function createRuntimeGovernancePanelClient(options) {
  return new ApiClient({
    ...options,
    baseUrl: options.baseUrl ?? getDefaultApiBaseUrl()
  });
}
function createRuntimeGovernancePanelBindings({
  client,
  buildSubmitRequest,
  buildReplayRequest,
  submitInit,
  queryInit = { cache: "no-store" },
  replayInit
}) {
  return {
    submitPreset: (preset, nonce) => client.submitRuntimeGovernanceAction(buildSubmitRequest(preset, nonce), submitInit),
    queryReceipt: (receipt) => client.getRuntimeGovernanceReceipt(receipt.receiptCode, queryInit),
    replayReceipt: (receipt, nonce) => client.replayRuntimeGovernanceAction(receipt.receiptCode, buildReplayRequest(receipt, nonce), replayInit)
  };
}
function createFoundationPortalConsumerSnapshotBase({
  wiring,
  bootstrap,
  consumerDescriptor
}) {
  const wiringMeta = createFoundationBootstrapWiringMeta(wiring);
  return {
    deliveryMode: bootstrap ? "api" : "fallback",
    wiring,
    consumerDescriptor: consumerDescriptor ?? fallbackPortalConsumerDescriptor,
    foundationDependencies: bootstrap?.foundationDependencies ?? [],
    foundationContracts: bootstrap?.foundationContracts ?? [],
    regionalOverridesCount: bootstrap?.regionalOverrides?.length ?? 0,
    scope: wiringMeta.scope,
    degradation: wiringMeta.degradation,
    challenge: wiringMeta.challenge
  };
}
function buildRuntimeGovernanceSubmitRequest({
  app,
  actorId,
  nonce,
  preset,
  tenantId,
  brandId,
  storeId,
  marketCode
}) {
  return {
    app,
    action: preset.action,
    nextStep: preset.nextStep,
    riskLevel: preset.riskLevel,
    requestEndpoint: preset.requestEndpoint,
    payload: preset.payload,
    payloadSummary: JSON.stringify(preset.payload),
    recommendedAction: preset.recommendedAction,
    handlerName: preset.handlerName,
    idempotencyKey: `${app}:${preset.action}:submit:${nonce}`,
    actorId,
    tenantId,
    brandId,
    storeId,
    marketCode
  };
}
function buildRuntimeGovernanceReplayRequest({
  app,
  actorId,
  nonce,
  requestedFrom,
  receipt,
  tenantId
}) {
  return {
    ledgerKey: receipt.ledger.ledgerKey,
    requestedFrom,
    ticketCode: receipt.ticket.ticketCode,
    idempotencyKey: `${app}:${receipt.action}:replay:${nonce}`,
    actorId,
    tenantId
  };
}
var fallbackPortalConsumerDescriptor = {
  consumer: "portal",
  modulePath: "src/modules/portal",
  dependsOn: [
    "identity-access",
    "configuration-governance",
    "integration-orchestration",
    "trust-governance",
    "resilience-operations"
  ],
  responsibility: "\u88C5\u914D ToB/ToC \u95E8\u6237\u89E3\u6790\u3001\u57DF\u540D\u7B56\u7565\u3001\u767B\u5F55\u5165\u53E3\u548C\u901A\u77E5\u7B56\u7565\u3002",
  handoffContracts: [
    "\u4ECE identity-access \u89E3\u6790\u95E8\u6237\u8EAB\u4EFD\u4E0E\u7EC4\u7EC7\u5F52\u5C5E",
    "\u4ECE configuration-governance \u88C5\u914D\u57DF\u540D/\u6A21\u677F/\u7070\u5EA6\u914D\u7F6E",
    "\u901A\u8FC7 integration-orchestration \u63A5\u5165\u901A\u77E5\u548C\u5F00\u653E\u5E73\u53F0\u7F51\u5173",
    "\u7531 trust-governance \u5904\u7406\u9650\u6D41\u3001\u9690\u79C1\u548C AI \u6CBB\u7406",
    "\u9075\u5FAA resilience-operations \u7684\u6062\u590D\u9884\u6848"
  ],
  recommendedSequence: ["/api/v1/foundation/bootstrap", "/api/v1/portals/bootstrap"],
  governanceTouchpoints: ["/api/v1/foundation/bootstrap", "/api/v1/portals/bootstrap", "feature-flags", "risk-challenge"],
  highRiskEntrypoints: ["member-login"],
  actionGovernanceExamples: [
    {
      surface: "miniapp",
      action: "member-login",
      scenario: "\u6E38\u5BA2\u6001\u767B\u5F55\u5148\u62C9\u8D77\u5FAE\u4FE1\u767B\u5F55\u6311\u6218\uFF0C\u518D\u8FDB\u5165\u4F1A\u5458\u4F1A\u8BDD\u5237\u65B0\u3002",
      riskLevel: "medium",
      bootstrapState: "challenge-required",
      nextStep: "CHALLENGE",
      submitState: "challenge-issued",
      requestEndpoint: "/api/v1/members/session/challenge"
    },
    {
      surface: "miniapp",
      action: "booking-submit",
      scenario: "\u6E38\u5BA2\u6001\u9884\u7EA6\u63D0\u4EA4\u5148\u6536\u53E3\u4E3A\u767B\u5F55\u524D\u7F6E\uFF0C\u4E0D\u5141\u8BB8\u53EA\u9760\u672C\u5730\u5FEB\u7167\u653E\u884C\u3002",
      riskLevel: "high",
      bootstrapState: "scope-mismatch",
      nextStep: "LOGIN",
      submitState: "blocked",
      requestEndpoint: "/api/v1/storefront/bookings"
    },
    {
      surface: "app",
      action: "payment-submit",
      scenario: "fallback \u5FEB\u7167\u4E0A\u7684\u652F\u4ED8\u63D0\u4EA4\u5FC5\u987B\u5148\u5237\u65B0\u5B9E\u65F6 bootstrap\uFF0C\u9ED8\u8BA4\u963B\u65AD\u63D0\u4EA4\u3002",
      riskLevel: "high",
      bootstrapState: "readonly-fallback",
      nextStep: "REFRESH",
      submitState: "blocked",
      requestEndpoint: "/api/v1/app/payments/submit"
    }
  ],
  runtimeHandoffExamples: [
    {
      surface: "miniapp",
      action: "booking-submit",
      scenario: "\u9884\u7EA6\u63D0\u4EA4\u5DF2\u8FDB\u5165 handler follow-up\uFF0C\u540E\u7EED\u901A\u8FC7 callback receipt \u4E0E replay \u7EE7\u7EED\u95ED\u73AF\u3002",
      ticketType: "HANDLER_CALLBACK",
      ticketStatus: "ready-for-handler",
      handlerName: "miniapp-booking-submit-handler",
      syncMode: "callback-followup",
      syncEndpoint: "/api/v1/storefront/handlers/miniapp-booking-submit-handler/sync",
      callbackStatus: "awaiting-callback",
      callbackEndpoint: "/api/v1/storefront/handlers/miniapp-booking-submit-handler/callbacks/MINIAPP-BOOKING-SUBMIT-PROCEED",
      replayStatus: "replay-scheduled",
      replayEndpoint: "/api/v1/storefront/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay",
      retryEscalationAction: "WAIT_CALLBACK"
    },
    {
      surface: "app",
      action: "payment-submit",
      scenario: "\u652F\u4ED8\u6311\u6218\u672A\u5B8C\u6210\u65F6\u4FDD\u7559 challenge gate\uFF0Ccallback \u4E0D\u843D\u6700\u7EC8\u7ED3\u679C\uFF0C\u91CD\u653E\u524D\u5FC5\u987B\u5237\u65B0 ticket\u3002",
      ticketType: "CHALLENGE_GATE",
      ticketStatus: "pending-challenge",
      handlerName: "native-payment-submit-handler",
      syncMode: "challenge-gated",
      syncEndpoint: "/api/v1/app/handlers/native-payment-submit-handler/sync",
      callbackStatus: "callback-blocked",
      callbackEndpoint: "/api/v1/app/handlers/native-payment-submit-handler/callbacks/APP-PAYMENT-SUBMIT-CHALLENGE",
      replayStatus: "replay-blocked",
      replayEndpoint: "/api/v1/app/actions/APP-PAYMENT-SUBMIT-CHALLENGE/replay",
      retryEscalationAction: "REFRESH_TICKET"
    }
  ],
  runtimeReceiptExamples: [
    {
      surface: "miniapp",
      action: "booking-submit",
      scenario: "\u5C0F\u7A0B\u5E8F booking-submit \u4F18\u5148\u8D70 runtime governance submit API\uFF0C\u6210\u529F\u540E\u76F4\u63A5\u62FF\u5230\u53EF\u56DE\u653E receipt\u3002",
      mode: "api-first-submit",
      receiptState: "submitted",
      generatedAtSource: "api",
      requestEndpoint: "/api/v1/storefront/bookings",
      runtimeEndpoint: "/api/v1/foundation/runtime-governance/actions",
      callbackStatus: "awaiting-callback",
      replayable: true,
      rateLimitScopeKey: "miniapp:booking-submit:tenant-demo",
      latestEventType: "runtime-governance.action.submitted"
    },
    {
      surface: "miniapp",
      action: "booking-submit",
      scenario: "\u5C0F\u7A0B\u5E8F\u79BB\u7EBF fallback \u4E0B replay receipt \u4F1A\u8F6C\u6210\u672C\u5730 replay-scheduled\uFF0C\u5E76\u628A generatedAt \u6536\u53E3\u4E3A local-fallback\u3002",
      mode: "fallback-replay",
      receiptState: "replay-scheduled",
      generatedAtSource: "local-fallback",
      requestEndpoint: "/api/v1/storefront/bookings",
      runtimeEndpoint: "/api/v1/foundation/runtime-governance/actions/MINIAPP-FALLBACK-001/replay",
      callbackStatus: "awaiting-callback",
      replayable: true,
      rateLimitScopeKey: "miniapp:booking-submit:tenant-demo",
      latestEventType: "runtime-governance.receipt.replay.scheduled"
    },
    {
      surface: "app",
      action: "member-login",
      scenario: "App member-login \u4F18\u5148\u8D70 runtime governance submit API\uFF0C\u8FD4\u56DE submitted receipt \u4E0E\u56DE\u653E\u80FD\u529B\u3002",
      mode: "api-first-submit",
      receiptState: "submitted",
      generatedAtSource: "api",
      requestEndpoint: "/api/v1/app/member/session",
      runtimeEndpoint: "/api/v1/foundation/runtime-governance/actions",
      callbackStatus: "awaiting-callback",
      replayable: true,
      rateLimitScopeKey: "app:member-login:tenant-demo",
      latestEventType: "runtime-governance.action.submitted"
    }
  ],
  governanceAlertLifecycleExamples: [
    {
      surface: "miniapp",
      alertCode: "observability-degradation",
      stage: "drilldown",
      scenario: "\u95E8\u6237 observability \u544A\u8B66\u4F1A\u5148\u8FDB\u5165 drilldown \u67E5\u770B callbackBaseUrl\u3001apiBaseUrl \u4E0E\u5F53\u524D\u7F51\u7EDC\u6458\u8981\u3002",
      endpoint: "/foundation/overview/alerts/observability-degradation/drilldown",
      latestHistoryAction: "ACK",
      acknowledgementStatus: null,
      visibleInOverview: true,
      availableActions: ["DRILLDOWN", "ACK", "MUTE"]
    },
    {
      surface: "miniapp",
      alertCode: "observability-degradation",
      stage: "ack",
      scenario: "\u79FB\u52A8\u7AEF\u8FD0\u8425\u786E\u8BA4\u544A\u8B66\u540E\u4F1A\u56DE\u5199 ACKED \u72B6\u6001\uFF0C\u4F46\u4ECD\u4FDD\u7559 overview \u53EF\u89C1\u6027\u3002",
      endpoint: "/foundation/overview/alerts/observability-degradation/ack",
      latestHistoryAction: "ACK",
      acknowledgementStatus: "ACKED",
      visibleInOverview: true,
      availableActions: ["DRILLDOWN", "MUTE"]
    },
    {
      surface: "miniapp",
      alertCode: "observability-degradation",
      stage: "mute",
      scenario: "\u786E\u8BA4\u77ED\u65F6\u7F51\u7EDC\u6CE2\u52A8\u540E\u53EF\u9759\u9ED8 observability \u544A\u8B66\uFF0C\u5E76\u4ECE overview \u4E34\u65F6\u9690\u85CF\u3002",
      endpoint: "/foundation/overview/alerts/observability-degradation/mute",
      latestHistoryAction: "MUTE",
      acknowledgementStatus: "MUTED",
      visibleInOverview: false,
      availableActions: ["UNMUTE"]
    },
    {
      surface: "miniapp",
      alertCode: "observability-degradation",
      stage: "unmute",
      scenario: "\u7F51\u7EDC\u6062\u590D\u540E\u53D6\u6D88\u9759\u9ED8\uFF0C\u6062\u590D drilldown\u3001ack\u3001mute \u64CD\u4F5C\u3002",
      endpoint: "/foundation/overview/alerts/observability-degradation/unmute",
      latestHistoryAction: "UNMUTE",
      acknowledgementStatus: null,
      visibleInOverview: true,
      availableActions: ["DRILLDOWN", "ACK", "MUTE"]
    }
  ]
};
function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}
function buildHeaders(options, headers) {
  return {
    ...options.tenantId ? { "x-tenant-id": options.tenantId } : {},
    ...options.brandId ? { "x-brand-id": options.brandId } : {},
    ...options.storeId ? { "x-store-id": options.storeId } : {},
    ...options.marketCode ? { "x-market-code": options.marketCode } : {},
    ...options.token ? { Authorization: `Bearer ${options.token}` } : {},
    ...options.headers ?? {},
    ...headers ?? {}
  };
}
function getDefaultApiBaseUrl() {
  return process.env.M5_API_BASE_URL ?? process.env.NEXT_PUBLIC_M5_API_BASE_URL ?? "http://localhost:3001/api/v1";
}
function createFoundationAlertClient(options) {
  return new ApiClient({
    ...options,
    baseUrl: options.baseUrl ?? getDefaultApiBaseUrl()
  });
}
function createFoundationAlertMutationExecutor(client, options) {
  return async (action, code) => {
    if (action === "ACK") {
      return client.acknowledgeFoundationAlert(code, { note: options.ackNote }, options.acknowledgeInit);
    }
    if (action === "MUTE") {
      return client.muteFoundationAlert(
        code,
        {
          note: options.muteNote,
          mutedUntil: new Date(Date.now() + (options.muteDurationMs ?? 2 * 60 * 60 * 1e3)).toISOString()
        },
        options.muteInit
      );
    }
    return client.unmuteFoundationAlert(code, { note: options.unmuteNote }, options.unmuteInit);
  };
}
function createFoundationAlertPanelClientAccess(options) {
  const {
    drilldownInit,
    ackNote,
    muteNote,
    unmuteNote,
    muteDurationMs,
    acknowledgeInit,
    muteInit,
    unmuteInit,
    ...clientOptions
  } = options;
  const client = createFoundationAlertClient(clientOptions);
  const executeMutation = createFoundationAlertMutationExecutor(client, {
    ackNote,
    muteNote,
    unmuteNote,
    muteDurationMs,
    acknowledgeInit,
    muteInit,
    unmuteInit
  });
  return {
    client,
    loadDrilldown: (code) => client.getFoundationAlertDrilldown(code, drilldownInit),
    executeMutation,
    ackAlert: async (code) => {
      await executeMutation("ACK", code);
    },
    muteAlert: async (code) => {
      await executeMutation("MUTE", code);
    },
    unmuteAlert: async (code) => {
      await executeMutation("UNMUTE", code);
    }
  };
}
var webFoundationAlertPanelMutationPresets = {
  "admin-web": {
    ackNote: "admin web auto triage",
    muteNote: "admin web temporary mute",
    unmuteNote: "admin web restore visibility",
    muteInit: { cache: "no-store" }
  },
  "tob-web": {
    ackNote: "tob web auto triage",
    muteNote: "tob web temporary mute",
    unmuteNote: "tob web restore visibility"
  },
  "storefront-web": {
    ackNote: "storefront web auto triage",
    muteNote: "storefront web temporary mute",
    unmuteNote: "storefront web restore visibility"
  }
};
function createWebFoundationAlertPanelClientAccess({
  app,
  drilldownInit,
  muteInit,
  ...options
}) {
  const preset = webFoundationAlertPanelMutationPresets[app];
  return createFoundationAlertPanelClientAccess({
    ...options,
    ackNote: preset.ackNote,
    muteNote: preset.muteNote,
    unmuteNote: preset.unmuteNote,
    drilldownInit: drilldownInit ?? { cache: "no-store" },
    muteInit: muteInit ?? preset.muteInit
  });
}
async function loadFoundationConsumerDescriptor(client, consumer, init = { cache: "no-store" }) {
  try {
    const descriptor = await client.getFoundationConsumer(consumer, init);
    return "consumer" in descriptor && descriptor.consumer === consumer ? descriptor : null;
  } catch {
    return null;
  }
}
async function loadFoundationGovernanceReadModel(client, init = { cache: "no-store" }) {
  const fallbackGeneratedAt = (/* @__PURE__ */ new Date()).toISOString();
  const [governanceCatalog, governanceOverview] = await Promise.all([
    client.getFoundationAlertCatalog(init).catch(() => null),
    client.getFoundationOverview(init).catch(() => null)
  ]);
  if (!governanceCatalog && !governanceOverview) {
    return {
      deliveryMode: "fallback",
      generatedAt: fallbackGeneratedAt,
      alerts: import_types.foundationAlertCatalogFallback,
      summary: emptyFoundationGovernanceOverviewSummary,
      overviewAlerts: [],
      topRisks: []
    };
  }
  return {
    deliveryMode: governanceCatalog && governanceOverview ? "api" : "fallback",
    generatedAt: governanceOverview?.generatedAt ?? governanceCatalog?.generatedAt ?? fallbackGeneratedAt,
    alerts: governanceCatalog?.alerts ?? import_types.foundationAlertCatalogFallback,
    summary: governanceOverview?.summary ?? emptyFoundationGovernanceOverviewSummary,
    overviewAlerts: governanceOverview?.alerts ?? [],
    topRisks: governanceOverview?.topRisks ?? []
  };
}
var ApiClient = class {
  constructor(options) {
    this.options = options;
  }
  options;
  buildPathWithQuery(path, query) {
    if (!query) {
      return path;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    }
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }
  async request(path, init = {}) {
    const response = await fetch(`${normalizeBaseUrl(this.options.baseUrl)}${normalizePath(path)}`, {
      ...init,
      headers: buildHeaders(this.options, init.headers)
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  }
  async get(path, init = {}) {
    return this.request(path, {
      ...init,
      method: "GET"
    });
  }
  async getData(path, init = {}) {
    const result = await this.get(path, init);
    return result.data;
  }
  async postData(path, body, init = {}) {
    const result = await this.request(path, {
      ...init,
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...init.headers ?? {}
      },
      body: JSON.stringify(body)
    });
    return result.data;
  }
  async getMarketBootstrap(init = {}) {
    return this.getData("/markets/bootstrap", init);
  }
  async getFoundationBootstrap(init = {}) {
    return this.getData("/foundation/bootstrap", init);
  }
  async getPortalBootstrap(init = {}) {
    return this.getData("/portals/bootstrap", init);
  }
  async getWorkbenchBootstrap(init = {}) {
    return this.getData("/workbenches/bootstrap", init);
  }
  async listAuditRecords(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/trust-governance/audit", {
      tenantId: query.tenantId,
      action: query.action,
      source: query.source,
      requestId: query.requestId,
      actorId: query.actorId,
      approvalTicket: query.approvalTicket,
      purpose: query.purpose,
      riskLevel: query.riskLevel,
      from: query.from,
      to: query.to
    });
    return this.getData(path, init);
  }
  async summarizeAuditRecords(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/trust-governance/audit/summary", {
      tenantId: query.tenantId,
      action: query.action,
      source: query.source,
      requestId: query.requestId,
      actorId: query.actorId,
      approvalTicket: query.approvalTicket,
      riskLevel: query.riskLevel,
      from: query.from,
      to: query.to
    });
    return this.getData(path, init);
  }
  async getAuditTrail(query = {}, init = {}) {
    const [records, summary] = await Promise.all([
      this.listAuditRecords(query, init),
      this.summarizeAuditRecords(query, init).catch(() => void 0)
    ]);
    const trail = {
      records: records ?? [],
      total: records?.length ?? 0,
      query
    };
    return {
      ...trail,
      summary
    };
  }
  async getConfigurationGovernanceOverview(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/configuration-governance/overview", {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async listConfigurationFeatureFlags(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/configuration-governance/feature-flag-records", {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async listConfigurationConfigEntries(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/configuration-governance/config-entries", {
      namespace: query.namespace,
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId
    });
    return this.getData(path, init);
  }
  async listConfigurationSecrets(init = {}) {
    return this.getData("/foundation/configuration-governance/secrets", init);
  }
  async listConfigurationCertificates(init = {}) {
    return this.getData("/foundation/configuration-governance/certificates", init);
  }
  async getConfigurationManagementMetadata(init = {}) {
    return this.getData(
      "/foundation/configuration-governance/management-metadata",
      init
    );
  }
  async getConfigurationGovernanceSnapshot(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/configuration-governance/snapshot", {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async getResilienceOperationsOverview(init = {}) {
    return this.getData("/foundation/resilience-operations/overview", init);
  }
  async listObservabilitySignals(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/resilience-operations/observability", {
      status: query.status
    });
    return this.getData(path, init);
  }
  async listResilienceRetryPolicies(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/resilience-operations/retry-policies", {
      capability: query.capability
    });
    return this.getData(path, init);
  }
  async listResilienceRecoveryPlans(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/resilience-operations/recovery-plans", {
      status: query.status
    });
    return this.getData(path, init);
  }
  async describeResilienceRecoveryPlan(resource, init = {}) {
    return this.getData(`/foundation/resilience-operations/recovery-plans/${encodeURIComponent(resource)}`, init);
  }
  async stageResilienceEdgeReplay(body, init = {}) {
    return this.postData(
      "/foundation/resilience-operations/edge-replay/stage",
      body,
      init
    );
  }
  async listRateLimitPolicies(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/trust-governance/rate-limit/policies", {
      tenantId: query.tenantId,
      code: query.policyCode
    });
    return this.getData(path, init);
  }
  async listQuotaLedgers(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/trust-governance/rate-limit/ledgers", {
      tenantId: query.tenantId,
      policyCode: query.policyCode,
      subjectKey: query.subjectKey
    });
    return this.getData(path, init);
  }
  async getRateLimitWorkspace(query = {}, init = {}) {
    const [policies, ledgers] = await Promise.all([
      this.listRateLimitPolicies(query, init),
      this.listQuotaLedgers(query, init).catch(() => [])
    ]);
    const totals = {
      policies: policies?.length ?? 0,
      activePolicies: policies?.filter((policy) => (policy.limit ?? 0) > 0).length ?? 0,
      ledgers: ledgers?.length ?? 0,
      blockedLedgers: 0,
      highConsumptionLedgers: 0
    };
    const byPeriod = {};
    const byScope = {};
    for (const policy of policies ?? []) {
      const period = String(policy.period ?? "unknown");
      byPeriod[period] = (byPeriod[period] ?? 0) + 1;
      const scope = String(policy.scopeType ?? "unknown");
      byScope[scope] = (byScope[scope] ?? 0) + 1;
    }
    for (const ledger of ledgers ?? []) {
      const remaining = ledger.remaining ?? 0;
      if (ledger.metadata?.blockedUntil && Date.parse(String(ledger.metadata.blockedUntil)) > Date.now()) {
        totals.blockedLedgers += 1;
      }
      if (ledger.policy.limit > 0 && remaining > 0 && remaining / ledger.policy.limit < 0.2) {
        totals.highConsumptionLedgers += 1;
      }
    }
    const workspace = {
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totals,
      policies: policies ?? [],
      ledgers: ledgers ?? [],
      byPeriod,
      byScope
    };
    return workspace;
  }
  async getIdentityAccessContext(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/identity-access/context", {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async validateIdentityRole(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/identity-access/validate/role", {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async validateIdentityPermission(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/identity-access/validate/permission", {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async validateIdentityTenantScope(targetTenantId, query = {}, init = {}) {
    const path = this.buildPathWithQuery(`/identity-access/validate/tenant/${encodeURIComponent(targetTenantId)}`, {
      tenantId: query.tenantId,
      brandId: query.brandId,
      storeId: query.storeId,
      marketCode: query.marketCode
    });
    return this.getData(path, init);
  }
  async listIntegrationWebhookSources(init = {}) {
    return this.getData(
      "/foundation/integration-orchestration/webhooks/sources",
      init
    );
  }
  async listIntegrationEventEnvelopes(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/integration-orchestration/events", {
      source: query.source
    });
    return this.getData(path, init);
  }
  async listIntegrationIdempotencyRecords(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/foundation/integration-orchestration/idempotency-records", {
      source: query.source
    });
    return this.getData(path, init);
  }
  async publishIntegrationEvent(body, init = {}) {
    return this.postData(
      "/foundation/integration-orchestration/events",
      body,
      init
    );
  }
  async ingestIntegrationWebhook(source, body, init = {}) {
    return this.postData(
      `/foundation/integration-orchestration/webhooks/${encodeURIComponent(source)}/ingest`,
      body,
      init
    );
  }
  async getIntegrationOrchestrationWorkspace(query = {}, init = {}) {
    const [sources, events, idempotencyRecords] = await Promise.all([
      this.listIntegrationWebhookSources(init),
      this.listIntegrationEventEnvelopes(query, init),
      this.listIntegrationIdempotencyRecords(query, init)
    ]);
    const uniqueEventSources = new Set(events.map((item) => item.source)).size;
    const duplicateSensitiveRecords = idempotencyRecords.filter(
      (item) => item.key.startsWith("lyt:") || item.key.startsWith("payment:")
    ).length;
    const workspace = {
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sources,
      events,
      idempotencyRecords,
      summary: {
        sources: sources.length,
        events: events.length,
        idempotencyRecords: idempotencyRecords.length,
        uniqueEventSources,
        duplicateSensitiveRecords
      }
    };
    return workspace;
  }
  async getFoundationConsumer(consumer, init = {}) {
    return this.getData(
      `/foundation/consumers/${consumer}`,
      init
    );
  }
  async getFoundationModuleDetail(moduleKey, init = {}) {
    return this.getData(`/foundation/overview/modules/${encodeURIComponent(moduleKey)}`, init);
  }
  async getFoundationAlertCatalog(init = {}) {
    return this.getData("/foundation/overview/alerts/catalog", init);
  }
  async getFoundationOverview(init = {}, runtimeFilter) {
    return this.getData(
      this.buildPathWithQuery("/foundation/overview", {
        runtimeFocus: runtimeFilter?.focus,
        runtimeState: runtimeFilter?.state,
        runtimeCallbackStatus: runtimeFilter?.callbackStatus,
        runtimeRiskLevel: runtimeFilter?.riskLevel,
        runtimeReplayable: typeof runtimeFilter?.replayable === "boolean" ? String(runtimeFilter.replayable) : void 0,
        runtimeStalledOnly: typeof runtimeFilter?.stalledOnly === "boolean" ? String(runtimeFilter.stalledOnly) : void 0
      }),
      init
    );
  }
  async getFoundationAlertDrilldown(code, init = {}) {
    return this.getData(`/foundation/overview/alerts/${code}/drilldown`, init);
  }
  async getLytStoreCapabilityAccessView(storeId, init = {}) {
    return this.getData(`/lyt/connection/${storeId}/access-view`, init);
  }
  async acknowledgeFoundationAlert(code, body = {}, init = {}) {
    return this.postData(`/foundation/overview/alerts/${code}/ack`, body, init);
  }
  async muteFoundationAlert(code, body = {}, init = {}) {
    return this.postData(`/foundation/overview/alerts/${code}/mute`, body, init);
  }
  async unmuteFoundationAlert(code, body = {}, init = {}) {
    return this.postData(`/foundation/overview/alerts/${code}/unmute`, body, init);
  }
  async submitRuntimeGovernanceAction(body, init = {}) {
    return this.postData("/foundation/runtime-governance/actions", body, init);
  }
  async getRuntimeGovernanceReceipt(receiptCode, init = {}) {
    return this.getData(`/foundation/runtime-governance/actions/${receiptCode}`, init);
  }
  async syncRuntimeGovernanceAction(receiptCode, body, init = {}) {
    return this.postData(`/foundation/runtime-governance/actions/${receiptCode}/sync`, body, init);
  }
  async recordRuntimeGovernanceCallback(receiptCode, body, init = {}) {
    return this.postData(`/foundation/runtime-governance/actions/${receiptCode}/callback`, body, init);
  }
  async replayRuntimeGovernanceAction(receiptCode, body, init = {}) {
    return this.postData(`/foundation/runtime-governance/actions/${receiptCode}/replay`, body, init);
  }
  async batchReplayRuntimeGovernanceActions(body, init = {}) {
    return this.postData(
      "/foundation/runtime-governance/actions/batch-replay",
      body,
      init
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiClient,
  buildRuntimeGovernanceReplayRequest,
  buildRuntimeGovernanceSubmitRequest,
  createFoundationAlertClient,
  createFoundationAlertMutationExecutor,
  createFoundationAlertPanelClientAccess,
  createFoundationBootstrapWiringMeta,
  createFoundationGovernanceReadModelLoader,
  createFoundationPortalConsumerSnapshotBase,
  createRuntimeGovernancePanelBindings,
  createRuntimeGovernancePanelClient,
  createWebFoundationAlertPanelClientAccess,
  emptyFoundationGovernanceOverviewSummary,
  fallbackPortalConsumerDescriptor,
  getDefaultApiBaseUrl,
  loadFoundationConsumerDescriptor,
  loadFoundationGovernanceReadModel
});
