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
  ApiError: () => ApiError,
  buildActorHeaders: () => buildActorHeaders,
  buildRuntimeGovernanceReplayRequest: () => buildRuntimeGovernanceReplayRequest,
  buildRuntimeGovernanceSubmitRequest: () => buildRuntimeGovernanceSubmitRequest,
  computeBackoffDelay: () => computeBackoffDelay,
  createBusinessClient: () => createBusinessClient,
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
  loadFoundationGovernanceReadModel: () => loadFoundationGovernanceReadModel,
  subscribeStream: () => subscribeStream
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
function buildActorHeaders(options) {
  const roles = Array.from(new Set((options.roles ?? []).map((item) => item.trim()).filter(Boolean)));
  const permissions = Array.from(
    new Set((options.permissions ?? []).map((item) => item.trim()).filter(Boolean))
  );
  return {
    "x-actor-id": options.actorId,
    ...options.actorType ? { "x-actor-type": options.actorType } : {},
    ...options.actorName ? { "x-actor-name": options.actorName } : {},
    ...options.tenantId ? { "x-actor-tenant-id": options.tenantId } : {},
    ...options.brandId ? { "x-actor-brand-id": options.brandId } : {},
    ...options.storeId ? { "x-actor-store-id": options.storeId } : {},
    ...roles.length > 0 ? {
      "x-actor-roles": roles.join(","),
      "x-roles": roles.join(",")
    } : {},
    ...permissions.length > 0 ? {
      "x-actor-permissions": permissions.join(","),
      "x-permissions": permissions.join(",")
    } : {},
    ...options.authenticated !== void 0 ? { "x-actor-authenticated": String(options.authenticated) } : {}
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
var ApiError = class extends Error {
  constructor(status, message, code, i18nKey) {
    super(message);
    this.status = status;
    this.name = "ApiError";
    this.code = code;
    this.i18nKey = i18nKey;
  }
  status;
  code;
  i18nKey;
};
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
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.message ?? `Request failed with status ${response.status}`,
        errorBody.code,
        errorBody.i18nKey
      );
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
  async putData(path, body, init = {}) {
    const result = await this.request(path, {
      ...init,
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...init.headers ?? {}
      },
      body: JSON.stringify(body)
    });
    return result.data;
  }
  async patchData(path, body, init = {}) {
    const result = await this.request(path, {
      ...init,
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        ...init.headers ?? {}
      },
      body: JSON.stringify(body)
    });
    return result.data;
  }
  async deleteData(path, init = {}) {
    const result = await this.request(path, {
      ...init,
      method: "DELETE"
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
  async getPortalDomainGovernanceSummary(init = {}) {
    return this.getData("/portals/domain-governance", init);
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
  // ── Agent & Knowledge V2 (Phase-23/24 — 后端 entity 镜像) ──
  /** 列出所有 Agent 配置 */
  async listAgentConfigs(init = {}) {
    return this.getData("/agent/configs", init);
  }
  /** 获取单个 Agent 配置 */
  async getAgentConfig(id, init = {}) {
    return this.getData(`/agent/configs/${id}`, init);
  }
  /** 创建 Agent 配置 */
  async createAgentConfig(body, init = {}) {
    return this.postData("/agent/configs", body, init);
  }
  /** 更新 Agent 配置 */
  async updateAgentConfig(id, body, init = {}) {
    return this.putData(`/agent/configs/${id}`, body, init);
  }
  /** 删除 Agent 配置 */
  async deleteAgentConfig(id, init = {}) {
    return this.deleteData(`/agent/configs/${id}`, init);
  }
  /** 创建并运行 Agent 会话 */
  async runAgentSession(body, init = {}) {
    return this.postData("/agent/sessions/run", body, init);
  }
  /**
   * 运行 Agent 会话并订阅实时事件流 (Phase-27 SSE)
   *
   * 后端 SSE 端点: POST /agent/sessions/run-stream
   * 返回: text/event-stream,每个事件格式 `data: {AgentSessionEvent JSON}\n\n`
   *
   * 用法:
   * ```ts
   * for await (const ev of client.runAgentSessionStream({ configId, userInput, ... })) {
   *   switch (ev.type) {
   *     case 'step_progress': console.log(`Step ${ev.step}/${ev.maxSteps}`); break;
   *     case 'message_added': appendMessage(ev.message); break;
   *     case 'session_completed': finalize(ev.session, ev.execution); break;
   *   }
   * }
   * ```
   */
  async *runAgentSessionStream(body, init = {}) {
    const url = `${normalizeBaseUrl(this.options.baseUrl)}${normalizePath("/agent/sessions/run-stream")}`;
    const response = await fetch(url, {
      ...init,
      method: "POST",
      headers: buildHeaders(this.options, init.headers),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`Stream request failed with status ${response.status}`);
    }
    if (!response.body) {
      throw new Error("Stream response has no body");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIdx = buffer.indexOf("\n\n");
        while (sepIdx !== -1) {
          const block = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          const dataLine = block.split("\n").find((line) => line.startsWith("data: "));
          if (dataLine) {
            const json = dataLine.slice("data: ".length).trim();
            if (json && json !== "[DONE]") {
              try {
                const event = JSON.parse(json);
                yield event;
              } catch {
              }
            }
          }
          sepIdx = buffer.indexOf("\n\n");
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  /** 批量运行 Agent */
  async batchRunAgent(body, init = {}) {
    return this.postData("/agent/sessions/batch", body, init);
  }
  /** 列出所有 Agent 会话 */
  async listAgentSessions(init = {}) {
    return this.getData("/agent/sessions", init);
  }
  /** 获取单个 Agent 会话 */
  async getAgentSession(id, init = {}) {
    return this.getData(`/agent/sessions/${id}`, init);
  }
  /** 获取会话执行记录 */
  async getAgentExecution(id, init = {}) {
    return this.getData(`/agent/sessions/${id}/execution`, init);
  }
  /** 获取会话质量评估 */
  async getSessionEvaluation(id, init = {}) {
    return this.getData(`/agent/sessions/${id}/evaluation`, init);
  }
  /** 列出所有质量评估 */
  async listQualityEvaluations(init = {}) {
    return this.getData("/agent/evaluations", init);
  }
  /** 获取 Agent 统计 */
  async getAgentStats(init = {}) {
    return this.getData("/agent/stats", init);
  }
  /** 列出可用工具(后端返回 unknown,前端按 ToolDefinition 解读) */
  async listAgentTools(init = {}) {
    return this.getData("/agent/tools", init);
  }
  // ── Tenant-Config (三级独立配置 · Phase-FP P0 集成) ──
  /**
   * GET /tenant-config
   * 按 level / category / keys 过滤当前级别配置项
   */
  async getTenantConfigs(query = {}, init = {}) {
    const path = this.buildPathWithQuery("/tenant-config", {
      level: query.level,
      category: query.category,
      keys: query.keys && query.keys.length > 0 ? query.keys.join(",") : void 0
    });
    return this.getData(path, init);
  }
  /**
   * GET /tenant-config/:key
   * 查询单个配置 (已脱敏)
   */
  async getTenantConfig(key, init = {}) {
    return this.getData(`/tenant-config/${encodeURIComponent(key)}`, init);
  }
  /**
   * GET /tenant-config/workbench/:code
   * 工作台视角 (W-S / W-T / W-B),返回考虑继承的生效配置
   */
  async getTenantWorkbenchConfigs(code, category, init = {}) {
    const path = this.buildPathWithQuery(`/tenant-config/workbench/${encodeURIComponent(code)}`, {
      category
    });
    return this.getData(path, init);
  }
  /**
   * GET /tenant-config/meta/definitions
   * 获取所有配置项静态定义 (前端 UI 用)
   */
  async getTenantConfigMeta(init = {}) {
    return this.getData(
      "/tenant-config/meta/definitions",
      init
    );
  }
  /**
   * POST /tenant-config/batch
   * 批量设置配置 (返回值会带回最新 version)
   */
  async setTenantConfigBatch(items, init = {}) {
    return this.postData(
      "/tenant-config/batch",
      { items },
      init
    );
  }
  /**
   * POST /tenant-config/rollback
   * 回滚配置到指定版本
   */
  async rollbackTenantConfig(targetVersion, configId, init = {}) {
    return this.postData(
      "/tenant-config/rollback",
      { targetVersion, configId },
      init
    );
  }
  /**
   * 列出租户级配置变更审计日志
   *
   * 端点约定: GET /tenant-config/audit-logs?tenantId=...&limit=...
   * (当前后端 service.listAuditLogs 已存在,本方法为前端 SDK 入口;若后端尚未暴露
   * 该 endpoint,会收到 404 并由调用方 try/catch 处理空态。)
   */
  async listTenantConfigAuditLogs(tenantId, limit = 100, init = {}) {
    const path = this.buildPathWithQuery("/tenant-config/audit-logs", {
      tenantId,
      limit: String(limit)
    });
    return this.getData(path, init);
  }
};
function subscribeStream(client, opts) {
  const reconnectConfig = {
    enabled: opts.reconnect?.enabled ?? true,
    maxRetries: opts.reconnect?.maxRetries ?? 3,
    initialDelayMs: opts.reconnect?.initialDelayMs ?? 1e3,
    backoffMultiplier: opts.reconnect?.backoffMultiplier ?? 2
  };
  let status = "connecting";
  let lastEventId = opts.initialLastEventId;
  let cancelled = false;
  let attempt = 0;
  let currentAbort = null;
  function setStatus(next) {
    if (status === next) return;
    status = next;
    opts.onStatusChange?.(next);
  }
  function computeDelay(attemptNum) {
    return reconnectConfig.initialDelayMs * Math.pow(reconnectConfig.backoffMultiplier, attemptNum - 1);
  }
  async function runOnce(signal) {
    const headers = {};
    if (lastEventId) {
      headers["Last-Event-ID"] = lastEventId;
    }
    const generator = client.runAgentSessionStream(opts.body, { signal, headers });
    for await (const event of generator) {
      const evAny = event;
      if (typeof evAny.id === "number") {
        lastEventId = String(evAny.id);
      }
      opts.onEvent(event, {
        id: typeof evAny.id === "number" ? evAny.id : -1,
        raw: JSON.stringify(event)
      });
    }
  }
  async function loop() {
    while (!cancelled) {
      if (attempt > reconnectConfig.maxRetries) {
        setStatus("closed");
        const err = new Error(`SSE reconnect exhausted after ${reconnectConfig.maxRetries} attempts`);
        opts.onError?.(err, { attempts: attempt, willRetry: false });
        return;
      }
      if (attempt > 0) {
        if (!reconnectConfig.enabled) {
          setStatus("closed");
          return;
        }
        setStatus("reconnecting");
        const delay = computeDelay(attempt);
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, delay);
          if (currentAbort) {
            currentAbort.signal.addEventListener("abort", () => {
              clearTimeout(timer);
              resolve();
            });
          }
        });
        if (cancelled) return;
      }
      attempt += 1;
      currentAbort = new AbortController();
      try {
        setStatus(attempt === 1 ? "connecting" : "reconnecting");
        await runOnce(currentAbort.signal);
        setStatus("closed");
        return;
      } catch (err) {
        if (cancelled) return;
        const error = err instanceof Error ? err : new Error(String(err));
        const isHttp410 = error.message.includes("410");
        const isAbort = error.name === "AbortError";
        if (isAbort) {
          setStatus("closed");
          return;
        }
        if (isHttp410) {
          setStatus("closed");
          opts.onError?.(error, { attempts: attempt, willRetry: false });
          return;
        }
        const willRetry = attempt <= reconnectConfig.maxRetries && reconnectConfig.enabled;
        opts.onError?.(error, { attempts: attempt, willRetry });
        if (!willRetry) {
          setStatus("closed");
          return;
        }
      }
    }
  }
  void loop();
  return {
    unsubscribe: () => {
      cancelled = true;
      currentAbort?.abort();
      setStatus("closed");
    },
    getStatus: () => status,
    getLastEventId: () => lastEventId
  };
}
function buildBusinessOrderListPath(query) {
  if (!query) {
    return "/transactions/orders";
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== void 0 && value !== null && String(value).length > 0) {
      params.set(key, String(value));
    }
  });
  const search = params.toString();
  return search ? `/transactions/orders?${search}` : "/transactions/orders";
}
function normalizeBusinessOrderListResponse(payload) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: 1,
      pageSize: payload.length
    };
  }
  return payload;
}
function createBusinessClient(baseUrl) {
  const api = new ApiClient({ baseUrl: baseUrl ?? getDefaultApiBaseUrl() });
  return {
    // ── Checkout (POST /api/v1/transactions/checkout) ──
    checkout: {
      /** 发起结账 */
      start: (body, init) => api.postData("/transactions/checkout", body, init)
    },
    // ── Orders (GET/POST /api/v1/transactions/orders) ──
    orders: {
      /** 订单列表 */
      list: (query, init) => api.getData(
        buildBusinessOrderListPath(query),
        init
      ).then((payload) => normalizeBusinessOrderListResponse(payload).items),
      /** 订单分页列表 */
      listPage: (query, init) => api.getData(
        buildBusinessOrderListPath(query),
        init
      ).then((payload) => normalizeBusinessOrderListResponse(payload)),
      /** 订单详情 */
      get: (orderId, init) => api.getData(`/transactions/orders/${orderId}`, init),
      /** 订单退款记录 */
      listRefunds: (orderId, init) => api.getData(`/transactions/orders/${orderId}/refunds`, init)
    },
    // ── Cashier (GET/POST /api/v1/cashier/*) ──
    cashier: {
      /** 会员查找 (手机号/卡号) */
      lookupMember: (query, init) => api.getData(
        `/cashier/members/lookup?q=${encodeURIComponent(query)}`,
        init
      ),
      /** 会员消费记录 (走 transactions 模块) */
      listMemberTransactions: (memberId, init) => api.getData(`/transactions/members/${memberId}`, init),
      /** 商品扫码查询 */
      lookupProduct: (sku, init) => api.getData(
        `/cashier/products/${encodeURIComponent(sku)}`,
        init
      ),
      /** 商品目录列表 */
      listProducts: (query, init) => {
        const params = new URLSearchParams();
        if (query?.limit !== void 0) params.set("limit", String(query.limit));
        if (query?.offset !== void 0) params.set("offset", String(query.offset));
        const search = params.toString();
        return api.getData(
          search ? `/cashier/products?${search}` : "/cashier/products",
          init
        );
      },
      /** 支付渠道统计 */
      getChannelStats: (init) => api.getData("/cashier/stats/channels", init),
      /** 创建订单 (POS) */
      createOrder: (body, init) => api.postData("/cashier/orders", body, init),
      /** 提交订单 (DRAFT → PENDING) */
      submitOrder: (orderId, init) => api.postData(`/cashier/orders/${orderId}/submit`, {}, init),
      /** 创建支付 */
      createPayment: (orderId, body, init) => api.postData(`/cashier/orders/${orderId}/payments`, body, init),
      /** 创建退款 */
      createRefund: (orderId, body, init) => api.postData(`/cashier/orders/${orderId}/refunds`, body, init)
    },
    // ── Refunds (GET/POST /api/v1/transactions/refunds) ──
    refunds: {
      /** 退款列表 */
      list: (query, init) => api.getData("/transactions/refunds", {
        ...init,
        headers: {
          "content-type": "application/json",
          ...init?.headers ?? {}
        },
        ...query ? { body: JSON.stringify(query) } : {}
      }),
      /** 待处理退款 */
      listPending: (query, init) => api.getData("/transactions/refunds/pending", {
        ...init,
        headers: {
          "content-type": "application/json",
          ...init?.headers ?? {}
        }
      }),
      /** 退款 dashboard */
      getDashboard: (init) => api.getData("/transactions/refunds/dashboard", init),
      /** 退款详情 */
      get: (refundId, init) => api.getData(`/transactions/refunds/${refundId}`, init),
      /** 审批退款 */
      approve: (refundId, body, init) => api.postData(`/transactions/refunds/${refundId}/approve`, body, init),
      /** 拒绝退款 */
      reject: (refundId, body, init) => api.postData(`/transactions/refunds/${refundId}/reject`, body, init)
    },
    // ── Payment Gateway (GET/POST /api/v1/payment-gateway) ──
    paymentGateway: {
      /** 发起支付 */
      pay: (body, init) => api.postData("/payment-gateway/pay", body, init),
      /** 查询支付结果 */
      queryPayment: (transactionId, init) => api.getData(`/payment-gateway/pay/${transactionId}`, init),
      /** 发起退款 */
      refund: (body, init) => api.postData("/payment-gateway/refund", body, init),
      /** 查询退款状态 */
      queryRefund: (refundId, init) => api.getData(`/payment-gateway/refund/${refundId}`, init)
    },
    // ── Budget (GET/POST /api/v1/finance/budgets) ──
    budget: {
      /** 预算列表 */
      list: (query, init) => api.getData("/finance/budgets", { ...init, headers: { ...query ? {
        "x-tenant-id": query.tenantId ?? "",
        "x-status": query.status ?? "",
        "x-category": query.category ?? ""
      } : {}, ...init?.headers ?? {} } }),
      /** 创建预算 */
      create: (body, init) => api.postData("/finance/budgets", body, init),
      /** 提交审批 */
      submitForApproval: (id, body, init) => api.postData(`/finance/budgets/${id}/submit`, body, init),
      /** 关闭预算 */
      close: (id, body, init) => api.postData(`/finance/budgets/${id}/close`, body, init),
      /** 审批请求列表 */
      listApprovals: (query, init) => api.getData("/finance/budgets/approvals", { ...init, headers: { ...query ? {
        "x-budget-id": query.budgetId ?? "",
        "x-status": query.status ?? ""
      } : {}, ...init?.headers ?? {} } }),
      /** 批准审批请求 */
      approveApproval: (approvalId, body, init) => api.postData(`/finance/budgets/approvals/${approvalId}/approve`, body, init),
      /** 驳回审批请求 */
      rejectApproval: (approvalId, body, init) => api.postData(`/finance/budgets/approvals/${approvalId}/reject`, body, init)
    },
    // ── Promotions (GET/POST /api/v1/marketing/promotions) ──
    promotions: {
      /** 促销列表 */
      list: (query, init) => api.getData("/marketing/promotions", { ...init, headers: { ...query ? {
        "x-tenant-id": query.tenantId ?? "",
        "x-store-id": query.storeId ?? "",
        "x-status": query.status ?? ""
      } : {}, ...init?.headers ?? {} } }),
      /** 创建促销 */
      create: (body, init) => api.postData("/marketing/promotions", body, init),
      /** 发布草稿促销 */
      publish: (id, body, init) => api.postData(`/marketing/promotions/${id}/publish`, body, init),
      /** 结束促销 */
      end: (id, body, init) => api.postData(`/marketing/promotions/${id}/end`, body, init)
    },
    // ── Convenience: 原始 ApiClient 实例 (用于自定义请求) ──
    raw: api
  };
}
function computeBackoffDelay(attemptNum, initialDelayMs = 1e3, backoffMultiplier = 2) {
  const safeAttempt = Math.max(0, attemptNum - 1);
  return initialDelayMs * Math.pow(backoffMultiplier, safeAttempt);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiClient,
  ApiError,
  buildActorHeaders,
  buildRuntimeGovernanceReplayRequest,
  buildRuntimeGovernanceSubmitRequest,
  computeBackoffDelay,
  createBusinessClient,
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
  loadFoundationGovernanceReadModel,
  subscribeStream
});
