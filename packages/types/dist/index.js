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
  FRONTEND_TO_BACKEND_ROLE: () => FRONTEND_TO_BACKEND_ROLE,
  adminRuntimeActionKeys: () => adminRuntimeActionKeys,
  adminRuntimeActionPresetContractMap: () => adminRuntimeActionPresetContractMap,
  adminRuntimeActionPresetContracts: () => adminRuntimeActionPresetContracts,
  adminWorkbenchConsumerDescriptor: () => adminWorkbenchConsumerDescriptor,
  advanceRuntimeGovernanceReplayPolicy: () => advanceRuntimeGovernanceReplayPolicy,
  buildAuditTrailHref: () => buildAuditTrailHref,
  buildAuditTrailRecordDetailHref: () => buildAuditTrailRecordDetailHref,
  buildConfigurationCertificateDetailHref: () => buildConfigurationCertificateDetailHref,
  buildConfigurationConfigEntryDetailHref: () => buildConfigurationConfigEntryDetailHref,
  buildConfigurationFeatureFlagDetailHref: () => buildConfigurationFeatureFlagDetailHref,
  buildConfigurationHref: () => buildConfigurationHref,
  buildConfigurationOperationDetailHref: () => buildConfigurationOperationDetailHref,
  buildConfigurationSecretDetailHref: () => buildConfigurationSecretDetailHref,
  buildDomainGovernanceHref: () => buildDomainGovernanceHref,
  buildFoundationAlertLinkedFocusContext: () => buildFoundationAlertLinkedFocusContext,
  buildFoundationAlertLinkedFocusSearchParams: () => buildFoundationAlertLinkedFocusSearchParams,
  buildFoundationAlertOptimisticReadState: () => buildFoundationAlertOptimisticReadState,
  buildFoundationAlertPanelDerivedState: () => buildFoundationAlertPanelDerivedState,
  buildFoundationAlertPanelReadState: () => buildFoundationAlertPanelReadState,
  buildFoundationAlertQuickSwitchItems: () => buildFoundationAlertQuickSwitchItems,
  buildFoundationAlertRecentOperationFilterState: () => buildFoundationAlertRecentOperationFilterState,
  buildFoundationAlertTimelineEmptyState: () => buildFoundationAlertTimelineEmptyState,
  buildFoundationAlertTimelineFilterQueryPreview: () => buildFoundationAlertTimelineFilterQueryPreview,
  buildFoundationAlertTimelineFilterReadState: () => buildFoundationAlertTimelineFilterReadState,
  buildFoundationAlertTimelineFilterSearchParams: () => buildFoundationAlertTimelineFilterSearchParams,
  buildFoundationAlertTimelineFilterStateFromQuery: () => buildFoundationAlertTimelineFilterStateFromQuery,
  buildFoundationAlertTimelineShortcutPresets: () => buildFoundationAlertTimelineShortcutPresets,
  buildFoundationModuleDetailHref: () => buildFoundationModuleDetailHref,
  buildFoundationWorkspaceHref: () => buildFoundationWorkspaceHref,
  buildIdentityAccessHref: () => buildIdentityAccessHref,
  buildIdentityAccessPermissionDetailHref: () => buildIdentityAccessPermissionDetailHref,
  buildIdentityAccessRoleDetailHref: () => buildIdentityAccessRoleDetailHref,
  buildIdentityAccessSessionDetailHref: () => buildIdentityAccessSessionDetailHref,
  buildIntegrationOrchestrationEventDetailHref: () => buildIntegrationOrchestrationEventDetailHref,
  buildIntegrationOrchestrationHref: () => buildIntegrationOrchestrationHref,
  buildIntegrationOrchestrationIdempotencyDetailHref: () => buildIntegrationOrchestrationIdempotencyDetailHref,
  buildIntegrationOrchestrationSourceDetailHref: () => buildIntegrationOrchestrationSourceDetailHref,
  buildRateLimitsHref: () => buildRateLimitsHref,
  buildRateLimitsLedgerDetailHref: () => buildRateLimitsLedgerDetailHref,
  buildRateLimitsPolicyDetailHref: () => buildRateLimitsPolicyDetailHref,
  buildResilienceHref: () => buildResilienceHref,
  buildResilienceRecoveryPlanDetailHref: () => buildResilienceRecoveryPlanDetailHref,
  buildResilienceRetryPolicyDetailHref: () => buildResilienceRetryPolicyDetailHref,
  buildResilienceSignalDetailHref: () => buildResilienceSignalDetailHref,
  buildRuntimeGovernanceCallbackStallDetail: () => buildRuntimeGovernanceCallbackStallDetail,
  buildRuntimeGovernanceReplayEndpoint: () => buildRuntimeGovernanceReplayEndpoint,
  createRuntimeGovernanceReplayPolicy: () => createRuntimeGovernanceReplayPolicy,
  defaultRoleWorkbenchContractMap: () => defaultRoleWorkbenchContractMap,
  defaultRoleWorkbenchContracts: () => defaultRoleWorkbenchContracts,
  evaluateRuntimeGovernanceCallbackStall: () => evaluateRuntimeGovernanceCallbackStall,
  filterFoundationAlertTimeline: () => filterFoundationAlertTimeline,
  filterFoundationAlertTimelineByOwner: () => filterFoundationAlertTimelineByOwner,
  filterFoundationAlertTimelineBySource: () => filterFoundationAlertTimelineBySource,
  findLatestFoundationAlertTimelineEntry: () => findLatestFoundationAlertTimelineEntry,
  foundationAlertCatalogFallback: () => foundationAlertCatalogFallback,
  foundationAppBootstrapProfiles: () => foundationAppBootstrapProfiles,
  foundationBootstrapCapabilityRules: () => foundationBootstrapCapabilityRules,
  foundationBootstrapContract: () => foundationBootstrapContract,
  foundationSupportedClients: () => foundationSupportedClients,
  getFoundationAlertLytConnectionGovernanceRiskDetail: () => getFoundationAlertLytConnectionGovernanceRiskDetail,
  getFoundationAlertRuntimeCallbackStalledDetail: () => getFoundationAlertRuntimeCallbackStalledDetail,
  getFoundationAppBootstrapWiring: () => getFoundationAppBootstrapWiring,
  isFoundationAlertLytConnectionGovernanceRiskDetail: () => isFoundationAlertLytConnectionGovernanceRiskDetail,
  isFoundationAlertRuntimeCallbackStalledDetail: () => isFoundationAlertRuntimeCallbackStalledDetail,
  isFoundationAlertTimelineFilterStateEqual: () => isFoundationAlertTimelineFilterStateEqual,
  listFoundationAlertTimelineActiveFilters: () => listFoundationAlertTimelineActiveFilters,
  mapToBackendRole: () => mapToBackendRole,
  memberAutomationTriggerCodeContracts: () => memberAutomationTriggerCodeContracts,
  memberAutomationTriggerSourceContracts: () => memberAutomationTriggerSourceContracts,
  memberAutomationTriggerStatusContracts: () => memberAutomationTriggerStatusContracts,
  memberDataSourceContracts: () => memberDataSourceContracts,
  memberLevelContracts: () => memberLevelContracts,
  memberLifecycleStageContracts: () => memberLifecycleStageContracts,
  memberOperationsActionChannelContracts: () => memberOperationsActionChannelContracts,
  memberOperationsActionCodeContracts: () => memberOperationsActionCodeContracts,
  memberOperationsExecutionLaneContracts: () => memberOperationsExecutionLaneContracts,
  memberOperationsPriorityContracts: () => memberOperationsPriorityContracts,
  memberOperationsReceiptStatusContracts: () => memberOperationsReceiptStatusContracts,
  memberOperationsReceiptTargetTypeContracts: () => memberOperationsReceiptTargetTypeContracts,
  memberOperationsRuntimeStateContracts: () => memberOperationsRuntimeStateContracts,
  memberOperationsTaskSourceContracts: () => memberOperationsTaskSourceContracts,
  memberOperationsTaskStatusContracts: () => memberOperationsTaskStatusContracts,
  memberStatusContracts: () => memberStatusContracts,
  normalizeFoundationAlertTimelineFilterState: () => normalizeFoundationAlertTimelineFilterState,
  readAuditTrailRecordDetailParam: () => readAuditTrailRecordDetailParam,
  readConfigurationCertificateDetailParam: () => readConfigurationCertificateDetailParam,
  readConfigurationConfigEntryDetailParam: () => readConfigurationConfigEntryDetailParam,
  readConfigurationFeatureFlagDetailParam: () => readConfigurationFeatureFlagDetailParam,
  readConfigurationOperationDetailParam: () => readConfigurationOperationDetailParam,
  readConfigurationSecretDetailParam: () => readConfigurationSecretDetailParam,
  readFoundationModuleDetailParam: () => readFoundationModuleDetailParam,
  readIdentityAccessPermissionDetailParam: () => readIdentityAccessPermissionDetailParam,
  readIdentityAccessRoleDetailParam: () => readIdentityAccessRoleDetailParam,
  readIdentityAccessSessionDetailParam: () => readIdentityAccessSessionDetailParam,
  readIntegrationOrchestrationEventDetailParam: () => readIntegrationOrchestrationEventDetailParam,
  readIntegrationOrchestrationIdempotencyDetailParam: () => readIntegrationOrchestrationIdempotencyDetailParam,
  readIntegrationOrchestrationSourceDetailParam: () => readIntegrationOrchestrationSourceDetailParam,
  readRateLimitsLedgerDetailParam: () => readRateLimitsLedgerDetailParam,
  readRateLimitsPolicyDetailParam: () => readRateLimitsPolicyDetailParam,
  readResilienceRecoveryPlanDetailParam: () => readResilienceRecoveryPlanDetailParam,
  readResilienceRetryPolicyDetailParam: () => readResilienceRetryPolicyDetailParam,
  readResilienceSignalDetailParam: () => readResilienceSignalDetailParam,
  resolveFoundationAlertFocusCode: () => resolveFoundationAlertFocusCode,
  resolveFoundationAlertSelectedCode: () => resolveFoundationAlertSelectedCode,
  runtimeGovernanceActionKeys: () => runtimeGovernanceActionKeys,
  runtimeGovernanceApiActionKeys: () => runtimeGovernanceApiActionKeys,
  runtimeGovernanceCallbackEvents: () => runtimeGovernanceCallbackEvents,
  runtimeGovernanceCallbackReceiptStatuses: () => runtimeGovernanceCallbackReceiptStatuses,
  runtimeGovernanceCallbackStallEscalationActions: () => runtimeGovernanceCallbackStallEscalationActions,
  runtimeGovernanceCallbackStatuses: () => runtimeGovernanceCallbackStatuses,
  runtimeGovernanceCallbackTimeoutThresholds: () => runtimeGovernanceCallbackTimeoutThresholds,
  runtimeGovernanceClientApps: () => runtimeGovernanceClientApps,
  runtimeGovernanceNextSteps: () => runtimeGovernanceNextSteps,
  runtimeGovernanceRecommendedActions: () => runtimeGovernanceRecommendedActions,
  runtimeGovernanceReplayEscalationActions: () => runtimeGovernanceReplayEscalationActions,
  runtimeGovernanceReplaySources: () => runtimeGovernanceReplaySources,
  runtimeGovernanceRiskLevels: () => runtimeGovernanceRiskLevels,
  summarizeFoundationAlertOwners: () => summarizeFoundationAlertOwners,
  summarizeFoundationAlertTimelineDigest: () => summarizeFoundationAlertTimelineDigest,
  summarizeFoundationAlertTimelineFilters: () => summarizeFoundationAlertTimelineFilters,
  summarizeFoundationAlertTimelineMetrics: () => summarizeFoundationAlertTimelineMetrics,
  summarizeFoundationAlertTimelineSources: () => summarizeFoundationAlertTimelineSources
});
module.exports = __toCommonJS(index_exports);
function buildFoundationAlertRecentOperationFilterState(entry) {
  if (!entry) {
    return {
      action: "ALL",
      source: "ALL",
      owner: "ALL"
    };
  }
  return {
    action: entry.action,
    source: entry.source ?? "ALL",
    owner: entry.actorId ?? "ALL"
  };
}
function buildFoundationAlertTimelineFilterStateFromQuery(query) {
  return {
    action: query.action === "ACK" || query.action === "MUTE" || query.action === "UNMUTE" ? query.action : "ALL",
    source: query.source || "ALL",
    owner: query.owner || "ALL"
  };
}
function normalizeFoundationAlertTimelineFilterState(filters, options) {
  const availableOwners = new Set(
    (options.availableOwners ?? []).map((item) => item || "ALL").filter((item) => item !== "ALL")
  );
  const availableSources = new Set(
    (options.availableSources ?? []).map((item) => item || "ALL").filter((item) => item !== "ALL")
  );
  return {
    action: filters.action,
    owner: filters.owner !== "ALL" && !availableOwners.has(filters.owner) ? "ALL" : filters.owner,
    source: filters.source !== "ALL" && !availableSources.has(filters.source) ? "ALL" : filters.source
  };
}
function buildFoundationAlertTimelineFilterSearchParams(options) {
  const params = options.search instanceof URLSearchParams ? new URLSearchParams(options.search.toString()) : new URLSearchParams(options.search ?? "");
  if (!options.filters.action || options.filters.action === "ALL") {
    params.delete(options.queryKeys.action);
  } else {
    params.set(options.queryKeys.action, options.filters.action);
  }
  if (!options.filters.source || options.filters.source === "ALL") {
    params.delete(options.queryKeys.source);
  } else {
    params.set(options.queryKeys.source, options.filters.source);
  }
  if (!options.filters.owner || options.filters.owner === "ALL") {
    params.delete(options.queryKeys.owner);
  } else {
    params.set(options.queryKeys.owner, options.filters.owner);
  }
  return params;
}
function buildFoundationAlertTimelineFilterQueryPreview(queryKeys, filters) {
  const query = buildFoundationAlertTimelineFilterSearchParams({
    queryKeys,
    filters
  }).toString();
  return query ? `?${query}` : "(default)";
}
function resolveFoundationAlertFocusCode(queryFocusCode, candidateGroups) {
  if (!queryFocusCode) {
    return null;
  }
  for (const group of candidateGroups) {
    const matched = group?.find((item) => item.code === queryFocusCode);
    if (matched) {
      return matched.code;
    }
  }
  return null;
}
function buildFoundationAlertLinkedFocusContext(context, filters) {
  if (!filters) {
    return context;
  }
  const summary = summarizeFoundationAlertTimelineFilters(filters);
  return summary === "\u5168\u90E8 timeline" ? context : `${context} / ${summary}`;
}
function buildFoundationAlertLinkedFocusSearchParams(options) {
  const params = buildFoundationAlertTimelineFilterSearchParams({
    search: options.search,
    queryKeys: options.queryKeys.timeline,
    filters: options.filters ?? {
      action: "ALL",
      source: "ALL",
      owner: "ALL"
    }
  });
  if (options.focusCode) {
    params.set(options.queryKeys.focus, options.focusCode);
  } else {
    params.delete(options.queryKeys.focus);
  }
  return params;
}
function filterFoundationAlertTimeline(history, filter = "ALL") {
  if (!history?.length) {
    return [];
  }
  if (filter === "ALL") {
    return history;
  }
  return history.filter((item) => item.action === filter);
}
function summarizeFoundationAlertOwners(history) {
  if (!history?.length) {
    return [];
  }
  const ownerMap = /* @__PURE__ */ new Map();
  for (const item of history) {
    const actorId = item.actorId ?? "\u7CFB\u7EDF";
    const current = ownerMap.get(actorId);
    if (!current) {
      ownerMap.set(actorId, {
        actorId,
        count: 1,
        lastAction: item.action,
        lastSeenAt: item.createdAt
      });
      continue;
    }
    current.count += 1;
    if (Date.parse(item.createdAt) >= Date.parse(current.lastSeenAt)) {
      current.lastAction = item.action;
      current.lastSeenAt = item.createdAt;
    }
  }
  return [...ownerMap.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return Date.parse(right.lastSeenAt) - Date.parse(left.lastSeenAt);
  });
}
function filterFoundationAlertTimelineByOwner(history, ownerFilter = "ALL") {
  if (!history?.length) {
    return [];
  }
  if (ownerFilter === "ALL") {
    return history;
  }
  return history.filter((item) => (item.actorId ?? "\u7CFB\u7EDF") === ownerFilter);
}
function filterFoundationAlertTimelineBySource(history, sourceFilter = "ALL") {
  if (!history?.length) {
    return [];
  }
  if (sourceFilter === "ALL") {
    return history;
  }
  return history.filter((item) => (item.source ?? "unknown") === sourceFilter);
}
function summarizeFoundationAlertTimelineSources(history) {
  if (!history?.length) {
    return [];
  }
  const sourceMap = /* @__PURE__ */ new Map();
  for (const item of history) {
    const source = item.source ?? "unknown";
    const current = sourceMap.get(source);
    if (!current) {
      sourceMap.set(source, {
        source,
        count: 1,
        latestAt: item.createdAt
      });
      continue;
    }
    current.count += 1;
    if (Date.parse(item.createdAt) >= Date.parse(current.latestAt ?? "1970-01-01T00:00:00.000Z")) {
      current.latestAt = item.createdAt;
    }
  }
  return [...sourceMap.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return Date.parse(right.latestAt ?? "1970-01-01T00:00:00.000Z") - Date.parse(left.latestAt ?? "1970-01-01T00:00:00.000Z");
  });
}
function findLatestFoundationAlertTimelineEntry(history) {
  if (!history?.length) {
    return null;
  }
  return history.reduce((latest, item) => {
    if (!latest) {
      return item;
    }
    return Date.parse(item.createdAt) >= Date.parse(latest.createdAt) ? item : latest;
  }, null);
}
function summarizeFoundationAlertTimelineMetrics(history) {
  const entries = history ?? [];
  const latest = findLatestFoundationAlertTimelineEntry(entries);
  return {
    total: entries.length,
    visibleInOverview: entries.filter((item) => item.visibleInOverview).length,
    hiddenFromOverview: entries.filter((item) => !item.visibleInOverview).length,
    latestMatchedAt: latest?.createdAt ?? null
  };
}
function summarizeFoundationAlertTimelineDigest(history) {
  const entries = history ?? [];
  const latest = findLatestFoundationAlertTimelineEntry(entries);
  const latestVisible = findLatestFoundationAlertTimelineEntry(entries.filter((item) => item.visibleInOverview));
  const latestHidden = findLatestFoundationAlertTimelineEntry(entries.filter((item) => !item.visibleInOverview));
  const owners = new Set(entries.map((item) => item.actorId ?? "\u7CFB\u7EDF"));
  const sources = summarizeFoundationAlertTimelineSources(entries);
  const actions = ["ACK", "MUTE", "UNMUTE"].map((action) => {
    const matched = entries.filter((item) => item.action === action);
    const latestMatched = findLatestFoundationAlertTimelineEntry(matched);
    return {
      action,
      count: matched.length,
      latestAt: latestMatched?.createdAt ?? null
    };
  });
  const dominantAction = actions.slice().sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return Date.parse(right.latestAt ?? "1970-01-01T00:00:00.000Z") - Date.parse(left.latestAt ?? "1970-01-01T00:00:00.000Z");
  })[0]?.count ? actions.slice().sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return Date.parse(right.latestAt ?? "1970-01-01T00:00:00.000Z") - Date.parse(left.latestAt ?? "1970-01-01T00:00:00.000Z");
  })[0]?.action ?? null : null;
  return {
    actions,
    uniqueOwnerCount: owners.size,
    latestActorId: latest?.actorId ?? null,
    dominantAction,
    latestVisibleAction: latestVisible?.action ?? null,
    latestHiddenAction: latestHidden?.action ?? null,
    dominantSource: sources[0]?.count ? sources[0].source : null,
    latestSource: latest?.source ?? "unknown",
    latestVisibleSource: latestVisible?.source ?? (latestVisible ? "unknown" : null),
    latestHiddenSource: latestHidden?.source ?? (latestHidden ? "unknown" : null)
  };
}
function listFoundationAlertTimelineActiveFilters(filters) {
  const chips = [];
  if (filters.action !== "ALL") {
    chips.push({
      kind: "action",
      label: `\u52A8\u4F5C ${filters.action}`,
      value: filters.action
    });
  }
  if (filters.source !== "ALL") {
    chips.push({
      kind: "source",
      label: `\u6765\u6E90 ${filters.source}`,
      value: filters.source
    });
  }
  if (filters.owner !== "ALL") {
    chips.push({
      kind: "owner",
      label: `\u8D23\u4EFB\u4EBA ${filters.owner}`,
      value: filters.owner
    });
  }
  return chips;
}
function summarizeFoundationAlertTimelineFilters(filters) {
  const chips = listFoundationAlertTimelineActiveFilters(filters);
  if (chips.length === 0) {
    return "\u5168\u90E8 timeline";
  }
  return chips.map((item) => item.label).join(" / ");
}
function isFoundationAlertTimelineFilterStateEqual(left, right) {
  return left.action === right.action && left.source === right.source && left.owner === right.owner;
}
function buildFoundationAlertTimelineEmptyState(filters) {
  const summary = summarizeFoundationAlertTimelineFilters(filters);
  if (summary === "\u5168\u90E8 timeline") {
    return "\u5F53\u524D\u7B5B\u9009\u4E0B\u6CA1\u6709\u5339\u914D\u7684 timeline \u52A8\u4F5C\u3002\u53EF\u5207\u6362\u52A8\u4F5C\u3001\u6765\u6E90\u6216\u8D23\u4EFB\u4EBA\u7EE7\u7EED\u6392\u67E5\u3002";
  }
  return `\u5F53\u524D\u7B5B\u9009\u4E0B\u6CA1\u6709\u5339\u914D\u7684 timeline \u52A8\u4F5C\u3002\u53EF\u6E05\u9664 ${summary} \u540E\u7EE7\u7EED\u6392\u67E5\u3002`;
}
function buildFoundationAlertTimelineShortcutPresets(history) {
  const entries = history ?? [];
  if (entries.length === 0) {
    return [];
  }
  const latest = findLatestFoundationAlertTimelineEntry(entries);
  const digest = summarizeFoundationAlertTimelineDigest(entries);
  const presets = [];
  const seenSummaries = /* @__PURE__ */ new Set();
  function pushPreset(preset) {
    const summary = summarizeFoundationAlertTimelineFilters(preset.filters);
    if (summary === "\u5168\u90E8 timeline" || seenSummaries.has(summary)) {
      return;
    }
    seenSummaries.add(summary);
    presets.push(preset);
  }
  if (latest) {
    pushPreset({
      key: "latest-owner",
      label: `\u6700\u8FD1\u8D23\u4EFB\u4EBA ${latest.actorId ?? "\u7CFB\u7EDF"}`,
      helper: "\u805A\u7126\u6700\u8FD1\u4E00\u6B21\u63A5\u624B\u8FD9\u6761\u544A\u8B66\u7684\u8D23\u4EFB\u4EBA\u8F68\u8FF9\u3002",
      filters: {
        action: "ALL",
        source: "ALL",
        owner: latest.actorId ?? "\u7CFB\u7EDF"
      }
    });
    pushPreset({
      key: "latest-source",
      label: `\u6700\u8FD1\u6765\u6E90 ${latest.source ?? "unknown"}`,
      helper: "\u5FEB\u901F\u56DE\u770B\u6700\u8FD1\u4E00\u6B21\u547D\u4E2D\u7684 timeline \u6765\u6E90\u3002",
      filters: {
        action: "ALL",
        source: latest.source ?? "unknown",
        owner: "ALL"
      }
    });
  }
  if (digest.dominantAction) {
    pushPreset({
      key: "dominant-action",
      label: `\u4E3B\u52A8\u4F5C ${digest.dominantAction}`,
      helper: "\u805A\u7126\u5F53\u524D timeline \u4E2D\u6700\u5BC6\u96C6\u7684\u52A8\u4F5C\u7C7B\u578B\u3002",
      filters: {
        action: digest.dominantAction,
        source: "ALL",
        owner: "ALL"
      }
    });
  }
  if (digest.latestHiddenAction || digest.latestHiddenSource) {
    pushPreset({
      key: "recent-hidden-flow",
      label: "\u6700\u8FD1\u9690\u85CF\u6D41\u8F6C",
      helper: "\u5B9A\u4F4D\u6700\u8FD1\u4E00\u6B21\u628A\u544A\u8B66\u79FB\u51FA overview \u7684\u52A8\u4F5C\u8F68\u8FF9\u3002",
      filters: {
        action: digest.latestHiddenAction ?? "ALL",
        source: digest.latestHiddenSource ?? "ALL",
        owner: "ALL"
      }
    });
  }
  if (digest.latestVisibleAction || digest.latestVisibleSource) {
    pushPreset({
      key: "recent-visible-flow",
      label: "\u6700\u8FD1\u6062\u590D\u6D41\u8F6C",
      helper: "\u5B9A\u4F4D\u6700\u8FD1\u4E00\u6B21\u628A\u544A\u8B66\u91CD\u65B0\u5E26\u56DE overview \u7684\u52A8\u4F5C\u8F68\u8FF9\u3002",
      filters: {
        action: digest.latestVisibleAction ?? "ALL",
        source: digest.latestVisibleSource ?? "ALL",
        owner: "ALL"
      }
    });
  }
  return presets;
}
function isFoundationAlertRuntimeCallbackStalledDetail(code, detail) {
  if (code !== "runtime-callback-stalled" || !detail || typeof detail !== "object") {
    return false;
  }
  const detailRecord = detail;
  const escalationSummary = detailRecord.escalationSummary;
  const timeoutThresholds = detailRecord.timeoutThresholds;
  return typeof detailRecord.total === "number" && Array.isArray(detailRecord.receipts) && Boolean(timeoutThresholds) && typeof timeoutThresholds === "object" && typeof timeoutThresholds.low === "number" && typeof timeoutThresholds.medium === "number" && typeof timeoutThresholds.high === "number" && Boolean(escalationSummary) && typeof escalationSummary === "object" && typeof escalationSummary.waitCallback === "number" && typeof escalationSummary.scheduleReplay === "number" && typeof escalationSummary.openManualReview === "number";
}
function getFoundationAlertRuntimeCallbackStalledDetail(drilldown, code) {
  if (!drilldown) {
    return null;
  }
  const resolvedCode = code ?? drilldown.code;
  return isFoundationAlertRuntimeCallbackStalledDetail(resolvedCode, drilldown.detail) ? drilldown.detail : null;
}
function isFoundationAlertLytConnectionGovernanceRiskDetail(code, detail) {
  if (code !== "lyt-connection-governance-risk" || !detail || typeof detail !== "object") {
    return false;
  }
  const detailRecord = detail;
  const scope = detailRecord.scope;
  return typeof detailRecord.total === "number" && Boolean(scope) && typeof scope === "object" && Array.isArray(detailRecord.alerts) && Array.isArray(detailRecord.topAlertCodes) && Array.isArray(detailRecord.affectedStoreIds) && Array.isArray(detailRecord.affectedCapabilities) && Array.isArray(detailRecord.recommendedNextActions);
}
function getFoundationAlertLytConnectionGovernanceRiskDetail(drilldown, code) {
  if (!drilldown) {
    return null;
  }
  const resolvedCode = code ?? drilldown.code;
  return isFoundationAlertLytConnectionGovernanceRiskDetail(resolvedCode, drilldown.detail) ? drilldown.detail : null;
}
function resolveFoundationAlertSelectedCode(alerts, options) {
  const resolvedCode = alerts.find((item) => item.code === options?.preferredCode)?.code ?? alerts.find((item) => item.code === options?.currentCode)?.code;
  return resolvedCode ?? alerts[0]?.code ?? "";
}
function buildFoundationAlertPanelReadState(options) {
  const activeMutation = options.mutation?.code === options.selectedAlert?.code ? options.mutation ?? null : null;
  const recentTimeline = activeMutation?.history ?? options.drilldown?.history ?? [];
  return {
    activeMutation,
    recentTimeline,
    currentOwner: recentTimeline[0]?.actorId ?? options.selectedAlert?.recentOperation?.actorId ?? options.selectedAlert?.acknowledgement?.actorId ?? options.drilldown?.acknowledgement?.actorId ?? "\u7CFB\u7EDF",
    currentNote: recentTimeline[0]?.note ?? options.selectedAlert?.recentOperation?.note ?? options.drilldown?.acknowledgement?.note ?? "\u6682\u65E0\u5907\u6CE8"
  };
}
function buildFoundationAlertPanelDerivedState(options) {
  const resolvedSelectedAlertCode = resolveFoundationAlertSelectedCode(options.alerts, {
    preferredCode: options.selectedAlertCode
  });
  const selectedAlert = options.alerts.find((item) => item.code === resolvedSelectedAlertCode) ?? options.alerts[0] ?? null;
  const panelReadState = buildFoundationAlertPanelReadState({
    selectedAlert,
    drilldown: options.drilldown,
    mutation: options.mutation
  });
  const actionFilteredTimeline = filterFoundationAlertTimeline(panelReadState.recentTimeline, options.filters.action);
  const runtimeCallbackDrilldown = getFoundationAlertRuntimeCallbackStalledDetail(options.drilldown, selectedAlert?.code);
  const sourceSummary = summarizeFoundationAlertTimelineSources(actionFilteredTimeline).slice(0, 4);
  const sourceFilteredTimeline = filterFoundationAlertTimelineBySource(actionFilteredTimeline, options.filters.source);
  const ownerSummary = summarizeFoundationAlertOwners(sourceFilteredTimeline).slice(0, 4);
  const filteredTimeline = filterFoundationAlertTimelineByOwner(sourceFilteredTimeline, options.filters.owner);
  return {
    selectedAlert,
    ...panelReadState,
    actionFilteredTimeline,
    runtimeCallbackDrilldown,
    sourceSummary,
    sourceFilteredTimeline,
    ownerSummary,
    filteredTimeline,
    latestMatchedTimeline: findLatestFoundationAlertTimelineEntry(filteredTimeline),
    timelineMetrics: summarizeFoundationAlertTimelineMetrics(filteredTimeline),
    timelineDigest: summarizeFoundationAlertTimelineDigest(filteredTimeline)
  };
}
function buildFoundationAlertTimelineFilterReadState(options) {
  const filterState = {
    action: options.action,
    source: options.source,
    owner: options.owner
  };
  return {
    filterState,
    activeFilterChips: listFoundationAlertTimelineActiveFilters(filterState),
    filterSummary: summarizeFoundationAlertTimelineFilters(filterState),
    filterEmptyState: buildFoundationAlertTimelineEmptyState(filterState),
    shortcutPresets: buildFoundationAlertTimelineShortcutPresets(options.history),
    hasActiveFilters: filterState.action !== "ALL" || filterState.source !== "ALL" || filterState.owner !== "ALL"
  };
}
function buildFoundationAlertQuickSwitchItems(topRisks, alerts, limit = 5) {
  const picked = /* @__PURE__ */ new Set();
  const quickSwitchItems = [];
  for (const item of [...topRisks, ...alerts]) {
    if (picked.has(item.code)) {
      continue;
    }
    picked.add(item.code);
    quickSwitchItems.push({ code: item.code });
  }
  return quickSwitchItems.slice(0, limit);
}
function buildFoundationAlertOptimisticReadState(options) {
  const pendingMutationAction = options.pendingMutationAction ?? null;
  return {
    overviewVisibility: pendingMutationAction === "MUTE" ? "hidden (optimistic)" : pendingMutationAction === "UNMUTE" ? "visible (optimistic)" : options.visibleInOverview === false ? "hidden" : "visible",
    feedback: pendingMutationAction ? {
      title: `${pendingMutationAction} \u6B63\u5728\u63D0\u4EA4`,
      description: pendingMutationAction === "MUTE" ? "\u9884\u671F\u8BE5\u544A\u8B66\u4F1A\u5148\u4ECE overview \u9690\u85CF\uFF0C\u7B49\u5F85\u771F\u5B9E\u56DE\u5305\u548C\u56DE\u5237\u7ED3\u679C\u786E\u8BA4\u3002" : pendingMutationAction === "UNMUTE" ? "\u9884\u671F\u8BE5\u544A\u8B66\u4F1A\u91CD\u65B0\u56DE\u5230 overview\uFF0C\u7B49\u5F85\u771F\u5B9E\u56DE\u5305\u548C\u56DE\u5237\u7ED3\u679C\u786E\u8BA4\u3002" : "\u9884\u671F triage \u4F1A\u5148\u8F6C\u4E3A\u5DF2\u786E\u8BA4\u72B6\u6001\uFF0C\u7B49\u5F85\u771F\u5B9E\u56DE\u5305\u548C\u56DE\u5237\u7ED3\u679C\u786E\u8BA4\u3002"
    } : null
  };
}
var runtimeGovernanceClientApps = ["admin-web", "tob-web", "storefront-web", "miniapp", "app", "lyt"];
var runtimeGovernanceActionKeys = [
  "approval-execution",
  "market-profile-resolve",
  "regional-override-preview",
  "secret-rotation",
  "runtime-replay",
  "webhook-callback",
  "edge-replay",
  "member-login",
  "coupon-claim",
  "booking-submit",
  "device-bind",
  "payment-submit"
];
var runtimeGovernanceApiActionKeys = [
  "approval-execution",
  "secret-rotation",
  "runtime-replay",
  "member-login",
  "coupon-claim",
  "booking-submit",
  "device-bind",
  "payment-submit"
];
var adminRuntimeActionKeys = ["approval-execution", "secret-rotation", "runtime-replay"];
var runtimeGovernanceNextSteps = ["PROCEED", "LOGIN", "CHALLENGE", "REFRESH"];
var runtimeGovernanceRiskLevels = ["low", "medium", "high"];
var runtimeGovernanceRecommendedActions = [
  "REFRESH_BOOTSTRAP",
  "COMPLETE_LOGIN",
  "COMPLETE_CHALLENGE",
  "FOLLOW_SUBMIT_CALLBACK"
];
var runtimeGovernanceCallbackStatuses = ["callback-blocked", "callback-recorded"];
var runtimeGovernanceCallbackReceiptStatuses = [
  "callback-blocked",
  "awaiting-callback",
  "callback-recorded"
];
var runtimeGovernanceCallbackEvents = [
  "PREREQUISITE_PENDING",
  "CHALLENGE_PENDING",
  "HANDLER_ACCEPTED",
  "HANDLER_COMPLETED"
];
var runtimeGovernanceCallbackTimeoutThresholds = {
  low: 15 * 60 * 1e3,
  medium: 10 * 60 * 1e3,
  high: 5 * 60 * 1e3
};
var runtimeGovernanceCallbackStallEscalationActions = [
  "WAIT_CALLBACK",
  "SCHEDULE_REPLAY",
  "OPEN_MANUAL_REVIEW"
];
var runtimeGovernanceReplaySources = [
  "ADMIN_WEB_RUNTIME",
  "TOB_WEB_RUNTIME",
  "STOREFRONT_WEB_RUNTIME",
  "MINIAPP_RUNTIME",
  "APP_RUNTIME"
];
var adminRuntimeActionPresetContracts = [
  {
    action: "runtime-replay",
    label: "Runtime Replay",
    scenario: "\u8FD0\u8425\u53F0\u4ECE runtime backlog \u53D1\u8D77\u7EDF\u4E00 replay\uFF0C\u5E76\u7ACB\u5373\u62FF\u5230\u53EF\u67E5\u8BE2\u7684\u771F\u5B9E receipt\u3002",
    riskLevel: "high",
    nextStep: "PROCEED",
    recommendedAction: "FOLLOW_SUBMIT_CALLBACK",
    requestEndpoint: "/api/v1/foundation/runtime-governance/actions",
    handlerName: "admin-runtime-replay-handler",
    replaySource: "ADMIN_WEB_RUNTIME",
    payload: {
      sourceReceiptCode: "ADMIN-WORKBENCH-RUNTIME-REPLAY-001",
      operatorNote: "manual-runtime-follow-up"
    }
  },
  {
    action: "approval-execution",
    label: "Approval Execution",
    scenario: "\u603B\u90E8\u603B\u63A7\u53F0\u6267\u884C\u9AD8\u98CE\u9669\u5BA1\u6279\u524D\uFF0C\u5148\u8D70\u7EDF\u4E00 runtime submit\uFF0C\u89C2\u5BDF challenge-issued \u56DE\u6267\u3002",
    riskLevel: "high",
    nextStep: "CHALLENGE",
    recommendedAction: "COMPLETE_CHALLENGE",
    requestEndpoint: "/api/v1/workbenches/approvals/execute",
    handlerName: "admin-approval-execution-handler",
    replaySource: "ADMIN_WEB_RUNTIME",
    payload: {
      approvalCode: "APPROVAL-CODE-001",
      challengeProfile: "step-up"
    }
  },
  {
    action: "secret-rotation",
    label: "Secret Rotation",
    scenario: "\u5BC6\u94A5\u8F6E\u6362\u5728 fallback \u573A\u666F\u5148\u8D70\u771F\u5B9E runtime submit\uFF0C\u4FDD\u7559 blocked \u56DE\u6267\u4E0E\u5237\u65B0\u5EFA\u8BAE\u3002",
    riskLevel: "high",
    nextStep: "REFRESH",
    recommendedAction: "REFRESH_BOOTSTRAP",
    requestEndpoint: "/api/v1/foundation/configuration-governance/secrets/rotate",
    handlerName: "admin-secret-rotation-handler",
    replaySource: "ADMIN_WEB_RUNTIME",
    payload: {
      secretName: "tenant-demo-openapi-secret",
      targetScope: "tenant",
      rotationReason: "manual-governance-rotation"
    }
  }
];
var adminRuntimeActionPresetContractMap = adminRuntimeActionPresetContracts.reduce(
  (accumulator, item) => {
    accumulator[item.action] = item;
    return accumulator;
  },
  {}
);
var runtimeGovernanceReplayEscalationActions = [
  "REFRESH_TICKET",
  "WAIT_CALLBACK",
  "OPEN_MANUAL_REVIEW"
];
function buildRuntimeGovernanceReplayEndpoint(receiptCode) {
  return `/api/v1/foundation/runtime-governance/actions/${receiptCode}/replay`;
}
function createRuntimeGovernanceReplayPolicy(receiptCode, state) {
  if (state === "submitted") {
    return {
      replayEndpoint: buildRuntimeGovernanceReplayEndpoint(receiptCode),
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2e3,
      escalationAction: "WAIT_CALLBACK",
      summary: "\u7B49\u5F85 callback \u56DE\u5199\uFF0C\u5982\u5931\u8D25\u5219\u8FDB\u5165\u7EDF\u4E00 replay\u3002"
    };
  }
  if (state === "challenge-issued") {
    return {
      replayEndpoint: buildRuntimeGovernanceReplayEndpoint(receiptCode),
      retryable: true,
      maxAttempts: 2,
      currentAttempt: 0,
      nextBackoffMs: 5e3,
      escalationAction: "REFRESH_TICKET",
      summary: "\u9700\u5148\u5237\u65B0 challenge ticket\uFF0C\u518D\u51B3\u5B9A\u662F\u5426 replay\u3002"
    };
  }
  return {
    replayEndpoint: buildRuntimeGovernanceReplayEndpoint(receiptCode),
    retryable: false,
    maxAttempts: 1,
    currentAttempt: 0,
    nextBackoffMs: 0,
    escalationAction: "OPEN_MANUAL_REVIEW",
    summary: "\u5F53\u524D\u52A8\u4F5C\u4ECD\u88AB\u963B\u65AD\uFF0C\u5E94\u8F6C\u4EBA\u5DE5\u590D\u6838\u3002"
  };
}
function advanceRuntimeGovernanceReplayPolicy(policy) {
  const currentAttempt = Math.min(policy.currentAttempt + 1, policy.maxAttempts);
  const retryable = currentAttempt < policy.maxAttempts;
  return {
    currentAttempt,
    retryable,
    nextBackoffMs: retryable ? Math.max(policy.nextBackoffMs, 2e3) + 2e3 : 0,
    escalationAction: retryable ? "WAIT_CALLBACK" : "OPEN_MANUAL_REVIEW"
  };
}
function evaluateRuntimeGovernanceCallbackStall(receipt, options) {
  const timeoutMs = runtimeGovernanceCallbackTimeoutThresholds[receipt.riskLevel];
  if (receipt.callback.callbackStatus !== "awaiting-callback") {
    return {
      stalled: false,
      timeoutMs,
      elapsedMs: 0,
      exceededMs: 0,
      escalationAction: "WAIT_CALLBACK",
      summary: "callback \u672A\u5904\u4E8E\u7B49\u5F85\u72B6\u6001\u3002"
    };
  }
  const waitingEvent = [...receipt.events].reverse().find(
    (event) => event.status === "accepted" && (event.eventType === "runtime-governance.handler.sync.requested" || event.eventType === "runtime-governance.action.submitted")
  );
  const startedAt = options?.startedAt ?? waitingEvent?.occurredAt ?? receipt.events[receipt.events.length - 1]?.occurredAt;
  const nowMs = options?.now ? new Date(options.now).getTime() : Date.now();
  const startedMs = startedAt ? new Date(startedAt).getTime() : nowMs;
  const elapsedMs = Math.max(0, nowMs - startedMs);
  const stalled = elapsedMs >= timeoutMs;
  const exceededMs = stalled ? elapsedMs - timeoutMs : 0;
  const escalationAction = stalled ? receipt.retry.retryable ? "SCHEDULE_REPLAY" : "OPEN_MANUAL_REVIEW" : "WAIT_CALLBACK";
  return {
    stalled,
    timeoutMs,
    elapsedMs,
    exceededMs,
    escalationAction,
    summary: stalled ? escalationAction === "SCHEDULE_REPLAY" ? "callback \u8D85\u65F6\u672A\u56DE\u5199\uFF0C\u5EFA\u8BAE\u8FDB\u5165 replay \u8865\u507F\u3002" : "callback \u8D85\u65F6\u4E14\u5DF2\u65E0\u81EA\u52A8\u91CD\u8BD5\u7A7A\u95F4\uFF0C\u5EFA\u8BAE\u8F6C\u4EBA\u5DE5\u590D\u6838\u3002" : "callback \u4ECD\u5728\u7B49\u5F85\u7A97\u53E3\u5185\u3002"
  };
}
function buildRuntimeGovernanceCallbackStallDetail(receipt, options) {
  const status = evaluateRuntimeGovernanceCallbackStall(receipt, options);
  const latestEvent = receipt.events[receipt.events.length - 1];
  return {
    receiptCode: receipt.receiptCode,
    app: receipt.app,
    action: receipt.action,
    riskLevel: receipt.riskLevel,
    handlerName: receipt.sync.handlerName,
    callbackStatus: receipt.callback.callbackStatus,
    replayable: receipt.ledger.replayable,
    scopeKey: receipt.rateLimit.scopeKey,
    latestEventType: latestEvent?.eventType ?? null,
    ...status
  };
}
var adminApprovalExecutionPreset = adminRuntimeActionPresetContractMap["approval-execution"];
var adminSecretRotationPreset = adminRuntimeActionPresetContractMap["secret-rotation"];
var adminRuntimeReplayPreset = adminRuntimeActionPresetContractMap["runtime-replay"];
var adminWorkbenchConsumerDescriptor = {
  consumer: "workbench",
  modulePath: "src/modules/workbench",
  dependsOn: [
    "identity-access",
    "configuration-governance",
    "integration-orchestration",
    "trust-governance",
    "resilience-operations"
  ],
  responsibility: "\u88C5\u914D PC/PAD \u5DE5\u4F5C\u53F0\u5BFC\u822A\u3001\u6743\u9650\u8FB9\u754C\u3001\u79BB\u7EBF\u573A\u666F\u548C\u8FD0\u8425\u6CBB\u7406\u5165\u53E3\u3002",
  handoffContracts: [
    "\u7531 identity-access \u8F93\u51FA\u89D2\u8272\u3001\u7B56\u7565\u548C\u79DF\u6237\u8303\u56F4",
    "\u7531 configuration-governance \u4E0B\u53D1\u6E20\u9053\u80FD\u529B\u3001\u7070\u5EA6\u548C\u89C4\u5219\u914D\u7F6E",
    "\u901A\u8FC7 integration-orchestration \u4E32\u8054\u901A\u77E5\u3001\u4E8B\u4EF6\u548C\u5F00\u653E\u5E73\u53F0",
    "\u7531 trust-governance \u843D\u5BA1\u8BA1\u3001\u98CE\u63A7\u3001PII \u4E0E AI \u5B89\u5168",
    "\u7531 resilience-operations \u63D0\u4F9B\u8FB9\u7F18\u540C\u6B65\u548C\u6062\u590D\u57FA\u7EBF"
  ],
  recommendedSequence: [
    "/api/v1/foundation/bootstrap",
    "/api/v1/workbenches/bootstrap",
    "/api/v1/foundation/overview/alerts/catalog"
  ],
  governanceTouchpoints: [
    "/api/v1/foundation/bootstrap",
    "/api/v1/workbenches/bootstrap",
    "/api/v1/foundation/overview/alerts/catalog",
    "/api/v1/foundation/overview/alerts/:code/drilldown"
  ],
  highRiskEntrypoints: [...adminRuntimeActionKeys],
  actionGovernanceExamples: [
    {
      surface: "admin-web",
      action: adminApprovalExecutionPreset.action,
      scenario: "\u603B\u90E8\u603B\u63A7\u53F0\u6267\u884C\u9AD8\u98CE\u9669\u5BA1\u6279\u524D\u5FC5\u987B\u5B8C\u6210 step-up challenge\uFF0C\u7981\u6B62\u524D\u7AEF\u76F4\u63A5\u8DF3\u8FC7\u6311\u6218\u653E\u884C\u52A8\u4F5C\u3002",
      riskLevel: adminApprovalExecutionPreset.riskLevel,
      bootstrapState: "challenge-required",
      nextStep: adminApprovalExecutionPreset.nextStep,
      submitState: "challenge-issued",
      requestEndpoint: adminApprovalExecutionPreset.requestEndpoint
    },
    {
      surface: "admin-web",
      action: adminSecretRotationPreset.action,
      scenario: "\u6CBB\u7406\u8BFB\u9762\u5904\u4E8E fallback \u65F6\uFF0C\u5BC6\u94A5\u8F6E\u6362\u5FC5\u987B\u5148\u5237\u65B0 foundation bootstrap\uFF0C\u907F\u514D\u7528\u65E7\u914D\u7F6E\u76F4\u63A5\u8F6E\u6362\u3002",
      riskLevel: adminSecretRotationPreset.riskLevel,
      bootstrapState: "readonly-fallback",
      nextStep: adminSecretRotationPreset.nextStep,
      submitState: "blocked",
      requestEndpoint: adminSecretRotationPreset.requestEndpoint
    },
    {
      surface: "admin-web",
      action: adminRuntimeReplayPreset.action,
      scenario: "\u8FD0\u8425\u53F0\u4ECE runtime backlog drilldown \u53D1\u8D77 replay \u65F6\uFF0Ctenant scope \u5DF2\u5C31\u7EEA\u5373\u53EF\u76F4\u63A5\u63D0\u4EA4\u7EDF\u4E00 replay \u8BF7\u6C42\u3002",
      riskLevel: adminRuntimeReplayPreset.riskLevel,
      bootstrapState: "ready",
      nextStep: adminRuntimeReplayPreset.nextStep,
      submitState: "submitted",
      requestEndpoint: adminRuntimeReplayPreset.requestEndpoint
    }
  ],
  runtimeHandoffExamples: [
    {
      surface: "admin-web",
      action: adminApprovalExecutionPreset.action,
      scenario: "\u5BA1\u6279\u6267\u884C\u547D\u4E2D\u9AD8\u98CE\u9669\u65F6\u4FDD\u7559 challenge gate\uFF0C\u5FC5\u987B\u7B49\u5F85\u4EBA\u5DE5\u5B8C\u6210\u6311\u6218\u540E\u518D\u7EE7\u7EED\u6267\u884C\u3002",
      ticketType: "CHALLENGE_GATE",
      ticketStatus: "pending-challenge",
      handlerName: adminApprovalExecutionPreset.handlerName,
      syncMode: "challenge-gated",
      syncEndpoint: `/api/v1/workbenches/handlers/${adminApprovalExecutionPreset.handlerName}/sync`,
      callbackStatus: "callback-blocked",
      callbackEndpoint: "/api/v1/workbenches/handlers/admin-approval-execution-handler/callbacks/ADMIN-APPROVAL-EXECUTION-CHALLENGE",
      replayStatus: "replay-blocked",
      replayEndpoint: "/api/v1/workbenches/actions/ADMIN-APPROVAL-EXECUTION-CHALLENGE/replay",
      retryEscalationAction: "REFRESH_TICKET"
    },
    {
      surface: "admin-web",
      action: adminSecretRotationPreset.action,
      scenario: "\u5BC6\u94A5\u8F6E\u6362\u5904\u4E8E\u53EA\u8BFB fallback \u65F6\u5148\u4FDD\u7559 block guard\uFF0C\u4E0D\u8FDB\u5165 handler callback\uFF0C\u8F6C\u8FD0\u7EF4\u4EBA\u5DE5\u590D\u6838\u3002",
      ticketType: "BLOCK_GUARD",
      ticketStatus: "waiting-prerequisite",
      handlerName: adminSecretRotationPreset.handlerName,
      syncMode: "deferred",
      syncEndpoint: `/api/v1/workbenches/handlers/${adminSecretRotationPreset.handlerName}/sync`,
      callbackStatus: "callback-blocked",
      callbackEndpoint: "/api/v1/workbenches/handlers/admin-secret-rotation-handler/callbacks/ADMIN-SECRET-ROTATION-BLOCKED",
      replayStatus: "replay-skipped",
      replayEndpoint: "/api/v1/workbenches/actions/ADMIN-SECRET-ROTATION-BLOCKED/replay",
      retryEscalationAction: "OPEN_MANUAL_REVIEW"
    },
    {
      surface: "admin-web",
      action: adminRuntimeReplayPreset.action,
      scenario: "\u8FD0\u8425\u53F0\u4ECE backlog \u53D1\u8D77\u7EDF\u4E00 replay \u540E\u8FDB\u5165 handler follow-up\uFF0C\u7EE7\u7EED\u7B49\u5F85 callback \u4E0E\u540E\u7EED\u4EBA\u5DE5\u786E\u8BA4\u3002",
      ticketType: "HANDLER_CALLBACK",
      ticketStatus: "ready-for-handler",
      handlerName: adminRuntimeReplayPreset.handlerName,
      syncMode: "callback-followup",
      syncEndpoint: `/api/v1/workbenches/handlers/${adminRuntimeReplayPreset.handlerName}/sync`,
      callbackStatus: "awaiting-callback",
      callbackEndpoint: "/api/v1/workbenches/handlers/admin-runtime-replay-handler/callbacks/ADMIN-RUNTIME-REPLAY-PROCEED",
      replayStatus: "replay-scheduled",
      replayEndpoint: "/api/v1/workbenches/actions/ADMIN-RUNTIME-REPLAY-PROCEED/replay",
      retryEscalationAction: "WAIT_CALLBACK"
    }
  ],
  runtimeReceiptExamples: [
    {
      surface: "admin-web",
      action: adminApprovalExecutionPreset.action,
      scenario: "\u5BA1\u6279\u6267\u884C\u4F1A\u4F18\u5148\u8D70 runtime governance submit API\uFF0C\u5E76\u8FD4\u56DE challenge-issued receipt \u4F9B\u8FD0\u8425\u53F0\u7EE7\u7EED\u8FFD\u8E2A\u3002",
      mode: "api-first-submit",
      receiptState: "challenge-issued",
      generatedAtSource: "api",
      requestEndpoint: adminApprovalExecutionPreset.requestEndpoint,
      runtimeEndpoint: "/api/v1/foundation/runtime-governance/actions",
      callbackStatus: "callback-blocked",
      replayable: true,
      rateLimitScopeKey: "admin-web:approval-execution:tenant-demo",
      latestEventType: "runtime-governance.action.submitted"
    },
    {
      surface: "admin-web",
      action: adminRuntimeReplayPreset.action,
      scenario: "\u8FD0\u8425\u53F0 runtime replay \u4F18\u5148\u63D0\u4EA4\u5230\u7EDF\u4E00 runtime API\uFF0C\u5E76\u7ACB\u5373\u751F\u6210 submitted receipt\u3002",
      mode: "api-first-submit",
      receiptState: "submitted",
      generatedAtSource: "api",
      requestEndpoint: adminRuntimeReplayPreset.requestEndpoint,
      runtimeEndpoint: adminRuntimeReplayPreset.requestEndpoint,
      callbackStatus: "awaiting-callback",
      replayable: true,
      rateLimitScopeKey: "admin-web:runtime-replay:tenant-demo",
      latestEventType: "runtime-governance.action.submitted"
    },
    {
      surface: "admin-web",
      action: adminRuntimeReplayPreset.action,
      scenario: "\u8FD0\u8425\u53F0 fallback \u4E0B\u91CD\u653E receipt \u4F1A\u5148\u6807\u8BB0\u4E3A replay-scheduled\uFF0C\u5E76\u7B49\u5F85\u7EDF\u4E00 callback \u56DE\u5199\u3002",
      mode: "fallback-replay",
      receiptState: "replay-scheduled",
      generatedAtSource: "local-fallback",
      requestEndpoint: adminRuntimeReplayPreset.requestEndpoint,
      runtimeEndpoint: "/api/v1/foundation/runtime-governance/actions/ADMIN-WORKBENCH-RUNTIME-REPLAY-001/replay",
      callbackStatus: "awaiting-callback",
      replayable: true,
      rateLimitScopeKey: "admin-web:runtime-replay:tenant-demo",
      latestEventType: "runtime-governance.receipt.replay.scheduled"
    },
    {
      surface: "admin-web",
      action: adminApprovalExecutionPreset.action,
      scenario: "\u5BA1\u6279\u6267\u884C\u5728 fallback challenge \u56DE\u5199\u540E\uFF0C\u4F1A\u628A receipt \u63A8\u8FDB\u5230 callback-recorded \u4EE5\u4FDD\u7559\u8FD0\u8425\u7559\u75D5\u3002",
      mode: "fallback-callback",
      receiptState: "callback-recorded",
      generatedAtSource: "local-fallback",
      requestEndpoint: adminApprovalExecutionPreset.requestEndpoint,
      runtimeEndpoint: "/api/v1/foundation/runtime-governance/actions/ADMIN-WORKBENCH-APPROVAL-001/callback",
      callbackStatus: "callback-recorded",
      replayable: true,
      rateLimitScopeKey: "admin-web:approval-execution:tenant-demo",
      latestEventType: "runtime-governance.handler.callback.recorded"
    }
  ],
  governanceAlertLifecycleExamples: [
    {
      surface: "admin-web",
      alertCode: "approvals-pending",
      stage: "drilldown",
      scenario: "\u5DE5\u4F5C\u53F0\u4F1A\u5148\u4ECE approvals-pending drilldown \u8BFB\u53D6\u5F85\u5904\u7406\u5BA1\u6279\u6458\u8981\u4E0E\u6700\u8FD1 ACK history\u3002",
      endpoint: "/foundation/overview/alerts/approvals-pending/drilldown",
      latestHistoryAction: "ACK",
      acknowledgementStatus: null,
      visibleInOverview: true,
      availableActions: ["DRILLDOWN", "ACK", "MUTE"]
    },
    {
      surface: "admin-web",
      alertCode: "approvals-pending",
      stage: "ack",
      scenario: "\u5DE5\u4F5C\u53F0\u786E\u8BA4 approvals-pending \u540E\uFF0C\u4F1A\u56DE\u5199 ACKED \u72B6\u6001\uFF0C\u4F46\u4ECD\u4FDD\u7559\u5728 overview \u91CC\u7EE7\u7EED\u8DDF\u8E2A\u3002",
      endpoint: "/foundation/overview/alerts/approvals-pending/ack",
      latestHistoryAction: "ACK",
      acknowledgementStatus: "ACKED",
      visibleInOverview: true,
      availableActions: ["DRILLDOWN", "ACK", "MUTE"]
    },
    {
      surface: "admin-web",
      alertCode: "approvals-pending",
      stage: "mute",
      scenario: "\u5DE5\u4F5C\u53F0\u9759\u9ED8 approvals-pending \u540E\uFF0C\u4F1A\u6682\u65F6\u4ECE overview \u9690\u85CF\uFF0C\u4F46 drilldown \u4ECD\u53EF\u7EE7\u7EED\u67E5\u770B\u3002",
      endpoint: "/foundation/overview/alerts/approvals-pending/mute",
      latestHistoryAction: "MUTE",
      acknowledgementStatus: "MUTED",
      visibleInOverview: false,
      availableActions: ["DRILLDOWN", "ACK", "UNMUTE"]
    },
    {
      surface: "admin-web",
      alertCode: "approvals-pending",
      stage: "unmute",
      scenario: "\u5DE5\u4F5C\u53F0\u53D6\u6D88\u9759\u9ED8 approvals-pending \u540E\uFF0C\u544A\u8B66\u91CD\u65B0\u8FDB\u5165 overview\uFF0C\u5E76\u6062\u590D ACK/MUTE \u52A8\u4F5C\u3002",
      endpoint: "/foundation/overview/alerts/approvals-pending/unmute",
      latestHistoryAction: "UNMUTE",
      acknowledgementStatus: "ACKED",
      visibleInOverview: true,
      availableActions: ["DRILLDOWN", "ACK", "MUTE"]
    }
  ]
};
var foundationSupportedClients = ["PC", "PAD", "H5", "MINIAPP", "APP"];
var foundationAlertCatalogFallback = [
  {
    code: "approvals-pending",
    defaultSummary: "\u5B58\u5728\u5F85\u5904\u7406\u5BA1\u6279\u5355",
    severityPolicy: "\u5F85\u5904\u7406\u5BA1\u6279\u5355\u6570\u91CF >= 5 \u65F6\u4E3A high\uFF0C\u5426\u5219\u4E3A medium",
    sourceModules: ["trust-governance", "configuration-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/approvals-pending/drilldown",
    ackPath: "/foundation/overview/alerts/approvals-pending/ack",
    mutePath: "/foundation/overview/alerts/approvals-pending/mute",
    unmutePath: "/foundation/overview/alerts/approvals-pending/unmute"
  },
  {
    code: "approval-execution-failures",
    defaultSummary: "\u5B58\u5728\u6267\u884C\u5931\u8D25\u4E14\u5F85\u4EBA\u5DE5\u786E\u8BA4\u7684\u5BA1\u6279\u5355",
    severityPolicy: "\u53EA\u8981\u5B58\u5728\u5373\u4E3A high",
    sourceModules: ["trust-governance", "configuration-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/approval-execution-failures/drilldown",
    ackPath: "/foundation/overview/alerts/approval-execution-failures/ack",
    mutePath: "/foundation/overview/alerts/approval-execution-failures/mute",
    unmutePath: "/foundation/overview/alerts/approval-execution-failures/unmute"
  },
  {
    code: "high-risk-audits",
    defaultSummary: "\u5B58\u5728\u9AD8\u98CE\u9669\u6CBB\u7406\u5BA1\u8BA1\u4E8B\u4EF6",
    severityPolicy: "\u9AD8\u98CE\u9669\u5BA1\u8BA1\u6570\u91CF >= 5 \u65F6\u4E3A high\uFF0C\u5426\u5219\u4E3A medium",
    sourceModules: ["trust-governance", "configuration-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/high-risk-audits/drilldown",
    ackPath: "/foundation/overview/alerts/high-risk-audits/ack",
    mutePath: "/foundation/overview/alerts/high-risk-audits/mute",
    unmutePath: "/foundation/overview/alerts/high-risk-audits/unmute"
  },
  {
    code: "blocked-rate-limit-ledgers",
    defaultSummary: "\u5B58\u5728\u88AB\u5C01\u7981\u4E2D\u7684\u914D\u989D\u8D26\u672C",
    severityPolicy: "\u53EA\u8981\u5B58\u5728\u5373\u4E3A medium",
    sourceModules: ["trust-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/blocked-rate-limit-ledgers/drilldown",
    ackPath: "/foundation/overview/alerts/blocked-rate-limit-ledgers/ack",
    mutePath: "/foundation/overview/alerts/blocked-rate-limit-ledgers/mute",
    unmutePath: "/foundation/overview/alerts/blocked-rate-limit-ledgers/unmute"
  },
  {
    code: "secret-rotation-attention",
    defaultSummary: "\u5B58\u5728\u9700\u8981\u8F6E\u6362\u6216\u5DF2\u8FC7\u671F\u7684\u5BC6\u94A5",
    severityPolicy: "\u5B58\u5728 expired secret \u65F6\u4E3A high\uFF0C\u5426\u5219\u4E3A medium",
    sourceModules: ["configuration-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/secret-rotation-attention/drilldown",
    ackPath: "/foundation/overview/alerts/secret-rotation-attention/ack",
    mutePath: "/foundation/overview/alerts/secret-rotation-attention/mute",
    unmutePath: "/foundation/overview/alerts/secret-rotation-attention/unmute"
  },
  {
    code: "observability-degradation",
    defaultSummary: "\u5B58\u5728\u5F02\u5E38\u7684 metrics/logs/traces \u4FE1\u53F7",
    severityPolicy: "critical \u4FE1\u53F7\u5B58\u5728\u65F6\u4E3A high\uFF0C\u5426\u5219\u4E3A medium",
    sourceModules: ["resilience-operations"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/observability-degradation/drilldown",
    ackPath: "/foundation/overview/alerts/observability-degradation/ack",
    mutePath: "/foundation/overview/alerts/observability-degradation/mute",
    unmutePath: "/foundation/overview/alerts/observability-degradation/unmute"
  },
  {
    code: "recovery-drill-attention",
    defaultSummary: "\u5B58\u5728\u5F85\u8865\u6F14\u7EC3\u6216\u6062\u590D\u9884\u6848\u5173\u6CE8\u9879",
    severityPolicy: "attention \u6216 staleDrills > 0 \u65F6\u4E3A medium",
    sourceModules: ["resilience-operations"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/recovery-drill-attention/drilldown",
    ackPath: "/foundation/overview/alerts/recovery-drill-attention/ack",
    mutePath: "/foundation/overview/alerts/recovery-drill-attention/mute",
    unmutePath: "/foundation/overview/alerts/recovery-drill-attention/unmute"
  },
  {
    code: "runtime-governance-backlog",
    defaultSummary: "\u5B58\u5728\u5F85\u6301\u7EED\u8DDF\u8FDB\u7684 runtime governance receipt",
    severityPolicy: "\u5B58\u5728 high risk backlog \u6216 backlog >= 5 \u65F6\u4E3A high\uFF0C\u5426\u5219\u4E3A medium",
    sourceModules: ["runtime-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/runtime-governance-backlog/drilldown",
    ackPath: "/foundation/overview/alerts/runtime-governance-backlog/ack",
    mutePath: "/foundation/overview/alerts/runtime-governance-backlog/mute",
    unmutePath: "/foundation/overview/alerts/runtime-governance-backlog/unmute"
  },
  {
    code: "runtime-callback-stalled",
    defaultSummary: "\u5B58\u5728\u7B49\u5F85 callback \u56DE\u5199\u7684 runtime receipt",
    severityPolicy: "\u53EA\u8981\u5B58\u5728\u7B49\u5F85 callback \u7684 receipt \u5373\u4E3A high",
    sourceModules: ["runtime-governance"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/runtime-callback-stalled/drilldown",
    ackPath: "/foundation/overview/alerts/runtime-callback-stalled/ack",
    mutePath: "/foundation/overview/alerts/runtime-callback-stalled/mute",
    unmutePath: "/foundation/overview/alerts/runtime-callback-stalled/unmute"
  },
  {
    code: "lyt-connection-governance-risk",
    defaultSummary: "\u5B58\u5728 LYT \u95E8\u5E97\u8FDE\u63A5\u6CBB\u7406\u98CE\u9669",
    severityPolicy: "\u5B58\u5728 high severity LYT \u6CBB\u7406\u544A\u8B66\u65F6\u4E3A high\uFF0C\u5426\u5219\u4E3A medium",
    sourceModules: ["integration-orchestration"],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: "/foundation/overview/alerts/lyt-connection-governance-risk/drilldown",
    ackPath: "/foundation/overview/alerts/lyt-connection-governance-risk/ack",
    mutePath: "/foundation/overview/alerts/lyt-connection-governance-risk/mute",
    unmutePath: "/foundation/overview/alerts/lyt-connection-governance-risk/unmute"
  }
];
function buildDomainGovernanceHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/saas/domains?${queryString}` : "/saas/domains";
}
var defaultRoleWorkbenchContracts = [
  {
    role: "SUPER_ADMIN",
    channel: "PC",
    title: "\u603B\u90E8\u603B\u63A7\u53F0",
    description: "\u5E73\u53F0\u7EA7\u79DF\u6237\u3001\u5BA1\u8BA1\u3001\u5B89\u5168\u548C\u5168\u5C40\u57FA\u7840\u8BBE\u65BD\u5165\u53E3\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "tenants", label: "\u79DF\u6237\u7BA1\u7406", href: "/workbench/super_admin", description: "\u79DF\u6237\u5F00\u901A\u3001\u5173\u505C\u548C\u80FD\u529B\u6388\u6743" },
      { key: "foundation", label: "Foundation \u603B\u89C8", href: "/foundation", description: "\u6A21\u5757\u76EE\u5F55\u3001\u6CBB\u7406\u57FA\u7EBF\u4E0E\u6D88\u8D39\u8005\u4F9D\u8D56\u603B\u89C8" },
      { key: "identity-access", label: "\u8EAB\u4EFD\u4E0E\u6388\u6743", href: "/identity-access", description: "Actor \u4E0A\u4E0B\u6587\u3001\u89D2\u8272\u3001\u6743\u9650\u4E0E\u79DF\u6237\u8FB9\u754C\u6821\u9A8C" },
      { key: "configuration", label: "\u914D\u7F6E\u6CBB\u7406", href: "/configuration", description: "\u529F\u80FD\u5F00\u5173\u3001\u914D\u7F6E\u9879\u3001\u5BC6\u94A5\u3001\u8BC1\u4E66\u4E0E\u5BA1\u6279" },
      { key: "resilience", label: "\u5F3A\u97E7\u6027\u4F5C\u6218\u53F0", href: "/resilience", description: "\u53EF\u89C2\u6D4B\u4FE1\u53F7\u3001\u91CD\u8BD5\u7B56\u7565\u4E0E\u6062\u590D\u8BA1\u5212" },
      { key: "rate-limits", label: "\u9650\u6D41\u4E0E\u914D\u989D", href: "/rate-limits", description: "\u79DF\u6237\u7EA7\u4E0E\u5E73\u53F0\u7EA7\u9650\u6D41\u7B56\u7565\u3001\u914D\u989D\u8D26\u672C" },
      { key: "integration-orchestration", label: "\u96C6\u6210\u7F16\u6392", href: "/integration-orchestration", description: "Webhook \u6765\u6E90\u3001\u4E8B\u4EF6\u4FE1\u5C01\u4E0E\u5E42\u7B49\u7F16\u6392\u603B\u89C8" },
      { key: "audit", label: "\u5BA1\u8BA1\u4E2D\u5FC3", href: "/audit-trail", description: "\u5168\u5C40\u65E5\u5FD7\u3001\u98CE\u63A7\u4E0E\u53EF\u7591\u884C\u4E3A" },
      { key: "markets", label: "\u56FD\u9645\u5316\u6CBB\u7406", href: "/workbench/super_admin", description: "\u5E02\u573A\u9ED8\u8BA4\u503C\u3001\u7F51\u7EDC\u533A\u3001\u90AE\u7BB1\u4E0E\u7A0E\u52A1\u7B56\u7565" }
    ]
  },
  {
    role: "TENANT_ADMIN",
    channel: "PC",
    title: "\u79DF\u6237\u7ECF\u8425\u53F0",
    description: "\u54C1\u724C\u77E9\u9635\u3001\u95E8\u5E97\u7F51\u7EDC\u3001\u6E20\u9053\u7F16\u6392\u548C\u76EE\u6807\u7BA1\u7406\u5165\u53E3\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "brands", label: "\u54C1\u724C\u77E9\u9635", href: "/workbench/tenant_admin", description: "\u54C1\u724C\u5F00\u901A\u4E0E\u4F1A\u5458\u4E92\u901A\u914D\u7F6E" },
      { key: "channels", label: "\u6E20\u9053\u7F16\u6392", href: "/workbench/tenant_admin", description: "\u5B98\u7F51\u3001H5\u3001\u5C0F\u7A0B\u5E8F\u3001App\u3001Pad \u80FD\u529B\u5F00\u5173" },
      { key: "foundation", label: "Foundation \u603B\u89C8", href: "/foundation", description: "\u6A21\u5757\u76EE\u5F55\u3001\u6CBB\u7406\u57FA\u7EBF\u4E0E\u6D88\u8D39\u8005\u4F9D\u8D56\u603B\u89C8" },
      { key: "identity-access", label: "\u8EAB\u4EFD\u4E0E\u6388\u6743", href: "/identity-access", description: "\u79DF\u6237\u7EA7\u89D2\u8272\u3001\u6743\u9650\u4E0E\u79DF\u6237\u9694\u79BB\u6821\u9A8C" },
      { key: "configuration", label: "\u914D\u7F6E\u6CBB\u7406", href: "/configuration", description: "\u79DF\u6237\u7EA7\u529F\u80FD\u5F00\u5173\u3001\u914D\u7F6E\u9879\u3001\u5BC6\u94A5\u4E0E\u5BA1\u6279" },
      { key: "resilience", label: "\u5F3A\u97E7\u6027\u4F5C\u6218\u53F0", href: "/resilience", description: "\u79DF\u6237\u7EA7\u53EF\u89C2\u6D4B\u4FE1\u53F7\u3001\u91CD\u8BD5\u4E0E\u6062\u590D" },
      { key: "rate-limits", label: "\u9650\u6D41\u4E0E\u914D\u989D", href: "/rate-limits", description: "\u79DF\u6237\u7EA7\u9650\u6D41\u7B56\u7565\u3001\u914D\u989D\u8D26\u672C" },
      { key: "integration-orchestration", label: "\u96C6\u6210\u7F16\u6392", href: "/integration-orchestration", description: "Webhook\u3001\u4E8B\u4EF6\u51FA\u5E93\u4E0E\u5E42\u7B49\u7F16\u6392" },
      { key: "tob", label: "\u79DF\u6237 ToB \u5B98\u7F51", href: "/workbench/tenant_admin", description: "\u79DF\u6237\u8425\u9500\u5B98\u7F51\u3001\u767B\u5F55\u5165\u53E3\u548C\u57DF\u540D\u7B56\u7565" },
      { key: "regional", label: "\u56FD\u9645\u5316\u914D\u7F6E", href: "/workbench/tenant_admin", description: "\u56FD\u5BB6\u3001\u8BED\u8A00\u3001\u65F6\u533A\u3001\u7A0E\u52A1\u3001\u7F51\u7EDC\u548C\u793E\u5A92\u8986\u76D6\u7B56\u7565" }
    ]
  },
  {
    role: "BRAND_MANAGER",
    channel: "PC",
    title: "\u54C1\u724C\u7ECF\u8425\u53F0",
    description: "\u54C1\u724C\u6D3B\u52A8\u3001\u4F1A\u5458\u5206\u5C42\u3001\u5546\u54C1\u670D\u52A1\u3001\u54C1\u724C ToB \u5B98\u7F51\u4E0E\u533A\u57DF\u5316\u6295\u653E\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "members", label: "\u4F1A\u5458\u8FD0\u8425", href: "/workbench/brand_manager", description: "\u7B49\u7EA7\u3001\u79EF\u5206\u3001SVIP \u548C\u5238\u7B56\u7565" },
      { key: "campaigns", label: "\u8425\u9500\u6295\u653E", href: "/workbench/brand_manager", description: "\u5B98\u7F51 / H5 / \u5C0F\u7A0B\u5E8F / App \u8054\u52A8" },
      { key: "brandPortal", label: "\u54C1\u724C ToB \u5B98\u7F51", href: "/workbench/brand_manager", description: "\u54C1\u724C\u62DB\u5546\u3001\u52A0\u76DF\u5408\u4F5C\u548C\u54C1\u724C\u767B\u5F55\u5165\u53E3" },
      { key: "marketPolicy", label: "\u5E02\u573A\u4E0E\u672C\u5730\u5316", href: "/workbench/brand_manager", description: "\u54C1\u724C\u7EA7\u56FD\u5BB6\u3001\u8BED\u8A00\u3001\u7A0E\u52A1\u548C\u793E\u5A92\u8986\u76D6\u914D\u7F6E" }
    ]
  },
  {
    role: "STORE_MANAGER",
    channel: "PC",
    title: "\u5E97\u957F\u7ECF\u8425\u53F0",
    description: "\u95E8\u5E97\u65E5\u8FD0\u8425\u3001\u9884\u7EA6\u6392\u961F\u3001\u6D3B\u52A8\u6267\u884C\u548C\u65E5\u62A5\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "daily", label: "\u95E8\u5E97\u65E5\u62A5", href: "/workbench/store_manager", description: "\u8425\u6536\u3001\u5BA2\u6D41\u548C\u5F02\u5E38\u9884\u8B66" },
      { key: "service", label: "\u73B0\u573A\u8C03\u5EA6", href: "/workbench/store_manager", description: "\u6392\u73ED\u3001\u9884\u7EA6\u3001\u6392\u961F\u548C\u73B0\u573A\u8D44\u6E90" }
    ]
  },
  {
    role: "GUIDE",
    channel: "PAD",
    title: "\u5BFC\u8D2D\u5DE5\u4F5C\u53F0",
    description: "\u5BA2\u6237\u63A5\u5F85\u3001\u4F1A\u5458\u63A8\u8350\u3001\u88C2\u53D8\u63A8\u5E7F\u4E0E\u7EBF\u7D22\u8DDF\u8FDB\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "crm", label: "\u4F1A\u5458\u63A5\u5F85", href: "/workbench/guide", description: "\u753B\u50CF\u3001\u6807\u7B7E\u3001\u63A8\u8350\u548C\u56DE\u8BBF" },
      { key: "promo", label: "\u63A8\u5E7F\u8F6C\u5316", href: "/workbench/guide", description: "\u63A8\u5E7F\u7801\u3001\u6D3B\u52A8\u5206\u4EAB\u4E0E\u7EBF\u7D22\u8F6C\u5316" }
    ]
  },
  {
    role: "CASHIER",
    channel: "PAD",
    title: "\u6536\u94F6\u53F0",
    description: "\u6536\u94F6\u3001\u6838\u9500\u3001\u50A8\u503C\u3001\u9000\u6B3E\u548C\u5F31\u7F51\u79BB\u7EBF\u515C\u5E95\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "checkout", label: "\u6536\u94F6\u6838\u9500", href: "/workbench/cashier", description: "\u8BA2\u5355\u3001\u79EF\u5206\u3001\u5238\u548C\u76F2\u76D2\u652F\u4ED8" },
      { key: "offline", label: "\u79BB\u7EBF\u6A21\u5F0F", href: "/workbench/cashier", description: "\u5F31\u7F51\u540C\u6B65\u548C\u79BB\u7EBF\u5BB9\u9519" }
    ]
  },
  {
    role: "OPERATIONS",
    channel: "PC",
    title: "\u8FD0\u8425\u4F5C\u6218\u53F0",
    description: "\u5E73\u53F0\u4E0E\u79DF\u6237\u7EA7\u8FD0\u8425\u4E8B\u4EF6\u7684\u7EDF\u4E00\u6CBB\u7406\uFF1A\u4EFB\u52A1\u5206\u6D3E\u3001\u56DE\u6267\u8DDF\u8E2A\u3001\u544A\u8B66 triage\u3001\u96C6\u6210\u7F16\u6392\u4E0E\u57FA\u7840\u8BBE\u65BD\u5DE5\u5355\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "operations", label: "\u8FD0\u8425\u56DE\u6267", href: "/operations", description: "Runtime \u8FD0\u8425\u56DE\u6267\u7EDF\u4E00\u6536\u53E3\u4E0E\u590D\u76D8" },
      { key: "tasks", label: "\u4EFB\u52A1\u5206\u6D3E", href: "/members", description: "\u4F1A\u5458\u4EFB\u52A1\u5206\u6D3E\u3001\u8DDF\u8E2A\u4E0E\u903E\u671F\u544A\u8B66" },
      { key: "approvals", label: "\u6CBB\u7406\u5BA1\u6279", href: "/approvals", description: "\u8DE8\u79DF\u6237 / \u5E73\u53F0\u7EA7\u9AD8\u98CE\u9669\u5BA1\u6279\u5355" },
      { key: "alerts", label: "\u544A\u8B66 triage", href: "/alerts", description: "\u544A\u8B66\u5206\u8BCA\u3001\u6291\u5236\u4E0E\u5347\u7EA7" },
      { key: "integration", label: "\u96C6\u6210\u7F16\u6392", href: "/integration-orchestration", description: "Webhook \u6765\u6E90\u3001\u4E8B\u4EF6\u4FE1\u5C01\u4E0E\u5E42\u7B49\u7F16\u6392" },
      { key: "resilience", label: "\u5F3A\u97E7\u6027\u4F5C\u6218", href: "/resilience", description: "\u53EF\u89C2\u6D4B\u4FE1\u53F7\u3001\u91CD\u8BD5\u7B56\u7565\u4E0E\u6062\u590D\u8BA1\u5212" },
      { key: "audit", label: "\u5BA1\u8BA1\u4E2D\u5FC3", href: "/audit-trail", description: "\u8FD0\u8425\u52A8\u4F5C\u7559\u75D5\u4E0E\u53EF\u7591\u884C\u4E3A\u56DE\u653E" }
    ]
  },
  {
    role: "FINANCE",
    channel: "PC",
    title: "\u8D22\u52A1\u7ED3\u7B97\u53F0",
    description: "\u6536\u5355\u3001\u5BF9\u8D26\u3001\u9000\u6B3E\u3001\u50A8\u503C\u4F59\u989D\u3001\u7A0E\u52A1\u548C\u9650\u6D41\u914D\u989D\u7684\u8D22\u52A1\u8FD0\u8425\u603B\u89C8\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "rate-limits", label: "\u9650\u6D41\u4E0E\u914D\u989D", href: "/rate-limits", description: "\u79DF\u6237\u7EA7\u4E0E\u5E73\u53F0\u7EA7\u9650\u6D41\u7B56\u7565\u3001\u914D\u989D\u8D26\u672C" },
      { key: "configuration", label: "\u914D\u7F6E\u6CBB\u7406", href: "/configuration", description: "\u7A0E\u52A1\u3001\u5E01\u79CD\u3001\u6C47\u7387\u7B49\u914D\u7F6E\u4E2D\u5FC3\u63A5\u5165" },
      { key: "audit", label: "\u5BA1\u8BA1\u4E2D\u5FC3", href: "/audit-trail", description: "\u8D22\u52A1\u52A8\u4F5C\u7559\u75D5\u3001\u4EA4\u6613\u56DE\u653E\u4E0E\u98CE\u63A7\u5BA1\u8BA1" },
      { key: "resilience", label: "\u5F3A\u97E7\u6027\u4F5C\u6218", href: "/resilience", description: "\u5BF9\u8D26\u5931\u8D25\u91CD\u8BD5\u3001\u56DE\u6536\u8BA1\u5212\u4E0E\u5F02\u5E38\u4FE1\u53F7" }
    ]
  },
  {
    role: "WAREHOUSE",
    channel: "PC",
    title: "\u4ED3\u50A8\u8C03\u5EA6\u53F0",
    description: "\u5E93\u5B58\u76D8\u70B9\u3001\u51FA\u5165\u5E93\u3001\u8C03\u62E8\u3001\u635F\u8017\u548C\u95E8\u5E97\u65E5\u62A5\u7684\u4ED3\u50A8\u8FD0\u8425\u603B\u89C8\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "stores", label: "\u95E8\u5E97\u7F51\u7EDC", href: "/stores", description: "\u95E8\u5E97\u65E5\u62A5\u3001\u5E93\u5B58\u6C34\u4F4D\u4E0E\u5F02\u5E38\u9884\u8B66" },
      { key: "brands", label: "\u54C1\u724C\u77E9\u9635", href: "/brands", description: "\u54C1\u724C\u5E93\u5B58\u603B\u89C8\u4E0E\u8DE8\u5E97\u8C03\u62E8\u7B56\u7565" },
      { key: "tenants", label: "\u79DF\u6237\u7BA1\u7406", href: "/tenants", description: "\u79DF\u6237\u7EA7\u4ED3\u50A8\u57DF\u3001\u8DE8\u79DF\u6237\u8C03\u62E8" },
      { key: "operations", label: "\u8FD0\u8425\u56DE\u6267", href: "/operations", description: "\u51FA\u5165\u5E93\u56DE\u6267\u3001\u635F\u8017\u590D\u76D8\u4E0E\u8FD0\u8425\u590D\u76D8" },
      { key: "audit", label: "\u5BA1\u8BA1\u4E2D\u5FC3", href: "/audit-trail", description: "\u4ED3\u50A8\u52A8\u4F5C\u7559\u75D5\u4E0E\u5F02\u5E38\u5BA1\u8BA1" }
    ]
  },
  {
    role: "COACH",
    channel: "PAD",
    title: "\u6559\u7EC3\u5DE5\u4F5C\u53F0",
    description: "\u79C1\u6559\u4F1A\u5458\u63A5\u5F85\u3001\u8BFE\u7A0B\u6392\u671F\u3001\u8BAD\u7EC3\u8BA1\u5212\u3001\u8003\u52E4\u6253\u5361\u4E0E\u88C2\u53D8\u63A8\u5E7F\u3002",
    marketCodes: ["cn-mainland", "us-default"],
    navItems: [
      { key: "crm", label: "\u4F1A\u5458\u63A5\u5F85", href: "/members", description: "\u79C1\u6559\u4F1A\u5458\u753B\u50CF\u3001\u6807\u7B7E\u4E0E\u56DE\u8BBF" },
      { key: "promo", label: "\u63A8\u5E7F\u8F6C\u5316", href: "/members", description: "\u63A8\u5E7F\u7801\u3001\u6D3B\u52A8\u5206\u4EAB\u4E0E\u7EBF\u7D22\u8F6C\u5316" },
      { key: "operations", label: "\u8FD0\u8425\u56DE\u6267", href: "/operations", description: "\u8BFE\u7A0B\u9884\u7EA6\u3001\u7B7E\u5230\u3001\u8003\u52E4\u56DE\u6267" },
      { key: "audit", label: "\u5BA1\u8BA1\u4E2D\u5FC3", href: "/audit-trail", description: "\u6559\u7EC3\u52A8\u4F5C\u7559\u75D5\u4E0E\u4F1A\u5458\u9690\u79C1\u5BA1\u8BA1" }
    ]
  }
];
var defaultRoleWorkbenchContractMap = Object.fromEntries(
  defaultRoleWorkbenchContracts.map((item) => [item.role.toLowerCase(), item])
);
var FRONTEND_TO_BACKEND_ROLE = {
  SUPER_ADMIN: "super_admin",
  BRAND_MANAGER: "brand_admin",
  TENANT_ADMIN: "tenant_admin",
  STORE_MANAGER: "store_admin",
  OPERATIONS: "operator",
  VIEWER: "viewer",
  AUDITOR: "auditor",
  GUIDE: "operator",
  CASHIER: "operator",
  WAREHOUSE: "operator",
  FINANCE: "operator",
  COACH: "operator"
};
function mapToBackendRole(frontendRole) {
  const normalized = frontendRole.trim().toUpperCase();
  return FRONTEND_TO_BACKEND_ROLE[normalized];
}
var memberLevelContracts = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
var memberStatusContracts = ["ACTIVE", "FROZEN", "EXPIRED", "BLACKLISTED"];
var memberLifecycleStageContracts = ["prospect", "newly-paid", "repeat-paid", "vip-active"];
var memberDataSourceContracts = ["memory", "prisma"];
var memberOperationsActionCodeContracts = [
  "complete-member-onboarding",
  "send-post-payment-welcome",
  "issue-bounce-back-coupon",
  "recommend-repeat-purchase-bundle",
  "invite-loyalty-challenge",
  "assign-vip-concierge",
  "push-new-arrival-preview",
  "deliver-channel-follow-up"
];
var memberOperationsActionChannelContracts = ["coupon", "crm-task", "wechat", "app-push"];
var memberOperationsPriorityContracts = ["high", "medium", "low"];
var memberAutomationTriggerCodeContracts = [
  "payment-success-journey",
  "newly-paid-bounce-back",
  "repeat-paid-retention",
  "vip-service-upgrade",
  "channel-retouch"
];
var memberAutomationTriggerStatusContracts = ["ready", "watch"];
var memberAutomationTriggerSourceContracts = ["payment-success", "lifecycle", "tag"];
var memberOperationsTaskStatusContracts = ["queued", "dispatched", "completed"];
var memberOperationsExecutionLaneContracts = [
  "campaign-execution",
  "member-crm",
  "promo-conversion"
];
var memberOperationsTaskSourceContracts = ["payment-success", "manual-refresh"];
var memberOperationsReceiptTargetTypeContracts = ["coupon-offer", "crm-follow-up"];
var memberOperationsReceiptStatusContracts = ["completed"];
var memberOperationsRuntimeStateContracts = [
  "blocked",
  "challenge-issued",
  "submitted",
  "callback-recorded",
  "replay-scheduled"
];
var foundationBootstrapCapabilityRules = [
  {
    capability: "tenant-scope",
    source: "API_BOOTSTRAP",
    requiredApps: ["admin-web", "tob-web", "storefront-web", "miniapp", "app"],
    cacheLayer: "NONE",
    notes: ["\u79DF\u6237\u3001\u54C1\u724C\u3001\u95E8\u5E97\u3001\u5E02\u573A\u4F5C\u7528\u57DF\u5FC5\u987B\u4E0E\u5F53\u524D\u4F1A\u8BDD\u5B9E\u65F6\u5BF9\u9F50\uFF0C\u5207\u79DF\u6237\u6216\u5207\u95E8\u5E97\u540E\u7ACB\u5373\u91CD\u65B0\u62C9\u53D6\u3002"]
  },
  {
    capability: "market-profile",
    source: "API_BOOTSTRAP",
    requiredApps: ["admin-web", "tob-web", "storefront-web", "miniapp", "app"],
    cacheLayer: "LOCAL_PERSISTED",
    ttlSeconds: 900,
    notes: ["\u8BED\u8A00\u3001\u65F6\u533A\u3001\u7A0E\u52A1\u3001\u7F51\u7EDC\u7B49\u975E\u654F\u611F\u5E02\u573A\u914D\u7F6E\u53EF\u77ED\u671F\u7F13\u5B58\uFF0C\u4F46\u5FC5\u987B\u4FDD\u7559 API \u7ED3\u679C\u4E3A\u6700\u7EC8\u51C6\u7EF3\u3002"]
  },
  {
    capability: "portal-shell",
    source: "API_BOOTSTRAP",
    requiredApps: ["admin-web", "tob-web", "storefront-web", "miniapp", "app"],
    cacheLayer: "SESSION",
    ttlSeconds: 300,
    notes: ["\u5BFC\u822A\u3001\u9875\u5934\u3001\u8FD0\u8425\u6587\u6848\u4E0E\u516C\u5F00\u8D44\u6E90\u4F4D\u53EF\u590D\u7528\u540C\u4E00\u4F1A\u8BDD\u5FEB\u7167\uFF0C\u5237\u65B0\u6216\u6062\u590D\u524D\u53F0\u65F6\u91CD\u65B0\u6821\u9A8C\u3002"]
  },
  {
    capability: "feature-flags",
    source: "API_BOOTSTRAP",
    requiredApps: ["admin-web", "tob-web", "storefront-web", "miniapp", "app"],
    cacheLayer: "SESSION",
    ttlSeconds: 60,
    notes: ["\u7070\u5EA6\u5F00\u5173\u7531 API \u7EDF\u4E00\u88C1\u51B3\uFF0C\u5BA2\u6237\u7AEF\u53EA\u505A\u6D88\u8D39\uFF1B\u5931\u6548\u540E\u9ED8\u8BA4\u8D70\u5173\u95ED\u6216\u53EA\u8BFB\u964D\u7EA7\u3002"]
  },
  {
    capability: "masking-policy",
    source: "API_BOOTSTRAP",
    requiredApps: ["admin-web", "tob-web", "storefront-web", "miniapp", "app"],
    cacheLayer: "NONE",
    notes: ["\u8131\u654F\u7B56\u7565\u3001\u5BA1\u6279\u7ED3\u679C\u4E0E PII \u53EF\u89C1\u7EA7\u522B\u4E0D\u843D\u672C\u5730\u6301\u4E45\u5316\uFF0C\u907F\u514D\u5386\u53F2\u5FEB\u7167\u6CC4\u6F0F\u3002"]
  },
  {
    capability: "risk-challenge",
    source: "RUNTIME_CHALLENGE",
    requiredApps: ["admin-web", "tob-web", "storefront-web", "miniapp", "app"],
    cacheLayer: "MEMORY",
    ttlSeconds: 120,
    notes: ["\u6311\u6218\u7968\u636E\u3001\u9A8C\u8BC1\u7801\u4F1A\u8BDD\u4E0E\u8BBE\u5907\u6821\u9A8C\u53EA\u5728\u5185\u5B58\u77ED\u5B58\uFF0C\u5B8C\u6210\u6821\u9A8C\u6216\u8D85\u65F6\u540E\u7ACB\u5373\u4F5C\u5E9F\u3002"]
  }
];
var foundationAppBootstrapProfiles = {
  "admin-web": {
    app: "admin-web",
    audience: "OPERATIONS",
    bootstrapFile: "apps/admin-web/app/bootstrap.ts",
    bootstrapEndpoint: "/api/v1/foundation/bootstrap",
    consumes: ["tenant-scope", "portal-shell", "feature-flags", "masking-policy", "risk-challenge"],
    cacheableCapabilities: ["portal-shell", "feature-flags"],
    tenantScope: {
      resolver: "\u767B\u5F55\u6001 + \u5F53\u524D\u5DE5\u4F5C\u53F0\u4E0A\u4E0B\u6587 + foundation bootstrap",
      bootstrapRequired: true,
      cacheLayer: "NONE",
      revalidateOn: ["\u767B\u5F55\u6210\u529F", "\u5207\u6362\u79DF\u6237", "\u5207\u6362\u54C1\u724C", "\u5207\u6362\u95E8\u5E97", "\u9875\u9762\u786C\u5237\u65B0"],
      mismatchStrategy: "FAIL_CLOSED"
    },
    desensitization: {
      source: "API_BOOTSTRAP",
      defaultMode: "MASKED",
      notes: ["\u540E\u53F0\u9ED8\u8BA4\u5C55\u793A\u8131\u654F\u503C\uFF0C\u5BA1\u6279\u901A\u8FC7\u540E\u518D\u6309\u5B57\u6BB5\u7C92\u5EA6\u89E3\u9501\u3002"]
    },
    featureFlags: {
      source: "API_BOOTSTRAP",
      cacheLayer: "SESSION",
      ttlSeconds: 60,
      fallbackStrategy: "FAIL_CLOSED",
      notes: ["\u5F71\u54CD\u6743\u9650\u3001\u5BFC\u51FA\u3001\u8D22\u52A1\u4E0E\u9AD8\u5371\u64CD\u4F5C\u7684\u5F00\u5173\u5FC5\u987B\u5728\u5237\u65B0\u540E\u91CD\u65B0\u786E\u8BA4\u3002"]
    },
    riskChallenge: {
      triggerSource: "API_BOOTSTRAP",
      cacheLayer: "MEMORY",
      enforcement: "BLOCKING",
      notes: ["\u767B\u5F55\u3001\u5BFC\u51FA\u3001\u6279\u91CF\u6539\u4EF7\u3001\u6743\u9650\u53D8\u66F4\u7B49\u9AD8\u98CE\u9669\u52A8\u4F5C\u89E6\u53D1\u6311\u6218\u3002"]
    }
  },
  "tob-web": {
    app: "tob-web",
    audience: "MERCHANT",
    bootstrapFile: "apps/tob-web/app/bootstrap.ts",
    bootstrapEndpoint: "/api/v1/foundation/bootstrap",
    consumes: ["tenant-scope", "market-profile", "portal-shell", "feature-flags", "masking-policy", "risk-challenge"],
    cacheableCapabilities: ["market-profile", "portal-shell", "feature-flags"],
    tenantScope: {
      resolver: "\u57DF\u540D/\u8DEF\u7531\u53C2\u6570 + \u767B\u5F55\u6001 + foundation bootstrap",
      bootstrapRequired: true,
      cacheLayer: "SESSION",
      revalidateOn: ["\u9996\u5C4F\u8FDB\u5165", "\u79DF\u6237\u5207\u6362", "\u54C1\u724C\u5207\u6362", "\u91CD\u65B0\u767B\u5F55"],
      mismatchStrategy: "FAIL_CLOSED"
    },
    desensitization: {
      source: "API_BOOTSTRAP",
      defaultMode: "MASKED",
      notes: ["\u62DB\u5546\u7EBF\u7D22\u3001\u8054\u7CFB\u4EBA\u4E0E\u8D22\u52A1\u4FE1\u606F\u9075\u5FAA\u79DF\u6237\u7B56\u7565\u8131\u654F\u5C55\u793A\u3002"]
    },
    featureFlags: {
      source: "API_BOOTSTRAP",
      cacheLayer: "SESSION",
      ttlSeconds: 60,
      fallbackStrategy: "READONLY_LAST_KNOWN",
      notes: ["\u95E8\u6237\u58F3\u5C42\u53EF\u7528\u6700\u8FD1\u4E00\u6B21\u6210\u529F\u5FEB\u7167\u515C\u5E95\uFF0C\u4F46\u4EA4\u6613\u548C\u767B\u5F55\u5165\u53E3\u6309\u5173\u95ED\u5904\u7406\u3002"]
    },
    riskChallenge: {
      triggerSource: "API_BOOTSTRAP",
      cacheLayer: "MEMORY",
      enforcement: "STEP_UP",
      notes: ["\u5F02\u5E38\u767B\u5F55\u3001\u7EBF\u7D22\u63D0\u4EA4\u3001\u62DB\u5546\u8868\u5355\u548C\u654F\u611F\u914D\u7F6E\u53D8\u66F4\u6309\u9700\u62C9\u8D77\u6311\u6218\u3002"]
    }
  },
  "storefront-web": {
    app: "storefront-web",
    audience: "CONSUMER",
    bootstrapFile: "apps/storefront-web/app/market-bootstrap.ts",
    bootstrapEndpoint: "/api/v1/foundation/bootstrap",
    consumes: ["tenant-scope", "market-profile", "portal-shell", "feature-flags", "masking-policy", "risk-challenge"],
    cacheableCapabilities: ["market-profile", "portal-shell"],
    tenantScope: {
      resolver: "\u57DF\u540D/\u8DEF\u7531\u53C2\u6570 + \u4F1A\u5458\u4F1A\u8BDD + foundation bootstrap",
      bootstrapRequired: true,
      cacheLayer: "SESSION",
      revalidateOn: ["\u9996\u5C4F\u8FDB\u5165", "\u5207\u5E97", "\u4F1A\u5458\u767B\u5F55", "\u4F1A\u5458\u9000\u51FA"],
      mismatchStrategy: "PUBLIC_LAST_KNOWN"
    },
    desensitization: {
      source: "API_BOOTSTRAP",
      defaultMode: "HIDDEN_UNTIL_APPROVED",
      notes: ["\u672A\u767B\u5F55\u6216\u672A\u6388\u6743\u65F6\u4E0D\u56DE\u663E\u5B8C\u6574\u624B\u673A\u53F7\u3001\u90AE\u7BB1\u548C\u5238\u7801\u3002"]
    },
    featureFlags: {
      source: "API_BOOTSTRAP",
      cacheLayer: "SESSION",
      ttlSeconds: 60,
      fallbackStrategy: "PUBLIC_LAST_KNOWN",
      notes: ["\u516C\u5F00\u5C55\u793A\u4F4D\u53EF\u77ED\u6682\u4F7F\u7528\u4E0A\u6B21\u5FEB\u7167\uFF0C\u4EA4\u6613\u578B\u5165\u53E3\u7F3A\u5C11\u65B0\u88C1\u51B3\u65F6\u9ED8\u8BA4\u5173\u95ED\u3002"]
    },
    riskChallenge: {
      triggerSource: "API_BOOTSTRAP",
      cacheLayer: "MEMORY",
      enforcement: "STEP_UP",
      notes: ["\u6CE8\u518C\u3001\u9886\u5238\u3001\u9884\u7EA6\u3001\u652F\u4ED8\u524D\u98CE\u63A7\u547D\u4E2D\u65F6\u518D\u6309 API \u6307\u4EE4\u62C9\u8D77\u6311\u6218\u3002"]
    }
  },
  miniapp: {
    app: "miniapp",
    audience: "CONSUMER",
    bootstrapFile: "apps/miniapp/src/market-bootstrap.ts",
    bootstrapEndpoint: "/api/v1/foundation/bootstrap",
    consumes: ["tenant-scope", "market-profile", "portal-shell", "feature-flags", "masking-policy", "risk-challenge"],
    cacheableCapabilities: ["market-profile", "portal-shell", "feature-flags"],
    tenantScope: {
      resolver: "\u542F\u52A8\u53C2\u6570 + \u5FAE\u4FE1\u4F1A\u8BDD + foundation bootstrap",
      bootstrapRequired: true,
      cacheLayer: "SESSION",
      revalidateOn: ["\u51B7\u542F\u52A8", "\u95E8\u5E97\u5207\u6362", "\u4F1A\u5458\u767B\u5F55", "\u4F1A\u5458\u9000\u51FA", "\u56DE\u5230\u524D\u53F0"],
      mismatchStrategy: "FAIL_CLOSED"
    },
    desensitization: {
      source: "API_BOOTSTRAP",
      defaultMode: "MASKED",
      notes: ["\u5C0F\u7A0B\u5E8F\u672C\u5730\u7F13\u5B58\u4E0D\u843D\u654F\u611F\u660E\u6587\uFF0C\u5206\u4EAB\u6001\u53EA\u4FDD\u7559\u516C\u5F00\u5B57\u6BB5\u3002"]
    },
    featureFlags: {
      source: "API_BOOTSTRAP",
      cacheLayer: "SESSION",
      ttlSeconds: 60,
      fallbackStrategy: "READONLY_LAST_KNOWN",
      notes: ["\u6D3B\u52A8\u4F4D\u548C\u4F1A\u5458\u4E2D\u5FC3\u53EF\u77ED\u65F6\u590D\u7528\u4F1A\u8BDD\u5FEB\u7167\uFF0C\u652F\u4ED8\u4E0E\u6838\u9500\u7C7B\u5F00\u5173\u9ED8\u8BA4\u5173\u95ED\u3002"]
    },
    riskChallenge: {
      triggerSource: "API_BOOTSTRAP",
      cacheLayer: "MEMORY",
      enforcement: "STEP_UP",
      notes: ["\u767B\u5F55\u3001\u9886\u5238\u3001\u62FC\u56E2\u548C\u8425\u9500\u88C2\u53D8\u547D\u4E2D\u98CE\u63A7\u65F6\u62C9\u8D77\u5FAE\u4FE1\u751F\u6001\u5185\u6311\u6218\u3002"]
    }
  },
  app: {
    app: "app",
    audience: "CONSUMER",
    bootstrapFile: "apps/app/market-bootstrap.ts",
    bootstrapEndpoint: "/api/v1/foundation/bootstrap",
    consumes: ["tenant-scope", "market-profile", "portal-shell", "feature-flags", "masking-policy", "risk-challenge"],
    cacheableCapabilities: ["market-profile", "portal-shell", "feature-flags"],
    tenantScope: {
      resolver: "\u8BBE\u5907\u4F1A\u8BDD + \u7528\u6237\u8EAB\u4EFD + foundation bootstrap",
      bootstrapRequired: true,
      cacheLayer: "SESSION",
      revalidateOn: ["\u51B7\u542F\u52A8", "\u767B\u5F55\u6210\u529F", "\u5207\u5E97", "\u8D26\u53F7\u5207\u6362", "\u56DE\u5230\u524D\u53F0"],
      mismatchStrategy: "FAIL_CLOSED"
    },
    desensitization: {
      source: "API_BOOTSTRAP",
      defaultMode: "MASKED",
      notes: ["\u4F1A\u5458\u8D44\u6599\u3001\u5238\u7801\u548C\u8BBE\u5907\u7ED1\u5B9A\u4FE1\u606F\u4EE5 API \u6388\u6743\u7EA7\u522B\u4E3A\u51C6\uFF0C\u79BB\u7EBF\u6001\u53EA\u4FDD\u7559\u6700\u5C0F\u5C55\u793A\u3002"]
    },
    featureFlags: {
      source: "API_BOOTSTRAP",
      cacheLayer: "SESSION",
      ttlSeconds: 60,
      fallbackStrategy: "READONLY_LAST_KNOWN",
      notes: ["\u5BFC\u822A\u58F3\u5C42\u53EF\u77ED\u65F6\u590D\u7528\u6700\u8FD1\u5FEB\u7167\uFF0C\u6D89\u53CA\u652F\u4ED8\u3001\u8BBE\u5907\u63A7\u5236\u548C\u4F1A\u5458\u5199\u64CD\u4F5C\u65F6\u5FC5\u987B\u62FF\u5230\u65B0\u88C1\u51B3\u3002"]
    },
    riskChallenge: {
      triggerSource: "API_BOOTSTRAP",
      cacheLayer: "MEMORY",
      enforcement: "STEP_UP",
      notes: ["\u8BBE\u5907\u7ED1\u5B9A\u3001\u4F1A\u5458\u627E\u56DE\u3001\u652F\u4ED8\u524D\u6821\u9A8C\u7B49\u9AD8\u98CE\u9669\u52A8\u4F5C\u6309\u9700\u89E6\u53D1\u4E8C\u6B21\u9A8C\u8BC1\u3002"]
    }
  }
};
var foundationBootstrapContract = {
  version: "2026-06-task4",
  bootstrapEndpoint: "/api/v1/foundation/bootstrap",
  deliveredCapabilities: foundationBootstrapCapabilityRules,
  appProfiles: foundationAppBootstrapProfiles
};
function getFoundationAppBootstrapWiring(app) {
  return foundationAppBootstrapProfiles[app];
}
function buildAuditTrailHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    } else if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return queryString ? `/audit-trail?${queryString}` : "/audit-trail";
}
function buildAuditTrailRecordDetailHref(auditId) {
  const encoded = encodeURIComponent(auditId);
  return `/audit-trail/records/${encoded}`;
}
function readAuditTrailRecordDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildConfigurationHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/configuration?${queryString}` : "/configuration";
}
function buildConfigurationOperationDetailHref(operation) {
  const encoded = encodeURIComponent(operation);
  return `/configuration/operations/${encoded}`;
}
function readConfigurationOperationDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildConfigurationSecretDetailHref(name) {
  const encoded = encodeURIComponent(name);
  return `/configuration/secrets/${encoded}`;
}
function readConfigurationSecretDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildConfigurationCertificateDetailHref(name) {
  const encoded = encodeURIComponent(name);
  return `/configuration/certificates/${encoded}`;
}
function readConfigurationCertificateDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildConfigurationFeatureFlagDetailHref(key) {
  const encoded = encodeURIComponent(key);
  return `/configuration/flags/${encoded}`;
}
function readConfigurationFeatureFlagDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildConfigurationConfigEntryDetailHref(id) {
  const encoded = encodeURIComponent(id);
  return `/configuration/entries/${encoded}`;
}
function readConfigurationConfigEntryDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIntegrationOrchestrationSourceDetailHref(source) {
  const encoded = encodeURIComponent(source);
  return `/integration-orchestration/sources/${encoded}`;
}
function readIntegrationOrchestrationSourceDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIntegrationOrchestrationEventDetailHref(envelopeId) {
  const encoded = encodeURIComponent(envelopeId);
  return `/integration-orchestration/events/${encoded}`;
}
function readIntegrationOrchestrationEventDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIntegrationOrchestrationIdempotencyDetailHref(key) {
  const encoded = encodeURIComponent(key);
  return `/integration-orchestration/idempotency/${encoded}`;
}
function readIntegrationOrchestrationIdempotencyDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildResilienceHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/resilience?${queryString}` : "/resilience";
}
function buildResilienceSignalDetailHref(signal) {
  const encoded = encodeURIComponent(signal);
  return `/resilience/signals/${encoded}`;
}
function readResilienceSignalDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildResilienceRetryPolicyDetailHref(key) {
  const encoded = encodeURIComponent(key);
  return `/resilience/retries/${encoded}`;
}
function readResilienceRetryPolicyDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildResilienceRecoveryPlanDetailHref(resource) {
  const encoded = encodeURIComponent(resource);
  return `/resilience/recovery/${encoded}`;
}
function readResilienceRecoveryPlanDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildRateLimitsHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/rate-limits?${queryString}` : "/rate-limits";
}
function buildRateLimitsPolicyDetailHref(policyId) {
  const encoded = encodeURIComponent(policyId);
  return `/rate-limits/policies/${encoded}`;
}
function readRateLimitsPolicyDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildRateLimitsLedgerDetailHref(ledgerId) {
  const encoded = encodeURIComponent(ledgerId);
  return `/rate-limits/ledgers/${encoded}`;
}
function readRateLimitsLedgerDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIdentityAccessHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/identity-access?${queryString}` : "/identity-access";
}
function buildIdentityAccessRoleDetailHref(role) {
  const encoded = encodeURIComponent(role);
  return `/identity-access/roles/${encoded}`;
}
function readIdentityAccessRoleDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIdentityAccessPermissionDetailHref(permission) {
  const encoded = encodeURIComponent(permission);
  return `/identity-access/permissions/${encoded}`;
}
function readIdentityAccessPermissionDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIdentityAccessSessionDetailHref(session) {
  const encoded = encodeURIComponent(session);
  return `/identity-access/sessions/${encoded}`;
}
function readIdentityAccessSessionDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildFoundationWorkspaceHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/foundation?${queryString}` : "/foundation";
}
function buildFoundationModuleDetailHref(moduleKey) {
  const encoded = encodeURIComponent(moduleKey);
  return `/foundation/modules/${encoded}`;
}
function readFoundationModuleDetailParam(raw) {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "string" && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === "string" && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}
function buildIntegrationOrchestrationHref(query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/integration-orchestration?${queryString}` : "/integration-orchestration";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FRONTEND_TO_BACKEND_ROLE,
  adminRuntimeActionKeys,
  adminRuntimeActionPresetContractMap,
  adminRuntimeActionPresetContracts,
  adminWorkbenchConsumerDescriptor,
  advanceRuntimeGovernanceReplayPolicy,
  buildAuditTrailHref,
  buildAuditTrailRecordDetailHref,
  buildConfigurationCertificateDetailHref,
  buildConfigurationConfigEntryDetailHref,
  buildConfigurationFeatureFlagDetailHref,
  buildConfigurationHref,
  buildConfigurationOperationDetailHref,
  buildConfigurationSecretDetailHref,
  buildDomainGovernanceHref,
  buildFoundationAlertLinkedFocusContext,
  buildFoundationAlertLinkedFocusSearchParams,
  buildFoundationAlertOptimisticReadState,
  buildFoundationAlertPanelDerivedState,
  buildFoundationAlertPanelReadState,
  buildFoundationAlertQuickSwitchItems,
  buildFoundationAlertRecentOperationFilterState,
  buildFoundationAlertTimelineEmptyState,
  buildFoundationAlertTimelineFilterQueryPreview,
  buildFoundationAlertTimelineFilterReadState,
  buildFoundationAlertTimelineFilterSearchParams,
  buildFoundationAlertTimelineFilterStateFromQuery,
  buildFoundationAlertTimelineShortcutPresets,
  buildFoundationModuleDetailHref,
  buildFoundationWorkspaceHref,
  buildIdentityAccessHref,
  buildIdentityAccessPermissionDetailHref,
  buildIdentityAccessRoleDetailHref,
  buildIdentityAccessSessionDetailHref,
  buildIntegrationOrchestrationEventDetailHref,
  buildIntegrationOrchestrationHref,
  buildIntegrationOrchestrationIdempotencyDetailHref,
  buildIntegrationOrchestrationSourceDetailHref,
  buildRateLimitsHref,
  buildRateLimitsLedgerDetailHref,
  buildRateLimitsPolicyDetailHref,
  buildResilienceHref,
  buildResilienceRecoveryPlanDetailHref,
  buildResilienceRetryPolicyDetailHref,
  buildResilienceSignalDetailHref,
  buildRuntimeGovernanceCallbackStallDetail,
  buildRuntimeGovernanceReplayEndpoint,
  createRuntimeGovernanceReplayPolicy,
  defaultRoleWorkbenchContractMap,
  defaultRoleWorkbenchContracts,
  evaluateRuntimeGovernanceCallbackStall,
  filterFoundationAlertTimeline,
  filterFoundationAlertTimelineByOwner,
  filterFoundationAlertTimelineBySource,
  findLatestFoundationAlertTimelineEntry,
  foundationAlertCatalogFallback,
  foundationAppBootstrapProfiles,
  foundationBootstrapCapabilityRules,
  foundationBootstrapContract,
  foundationSupportedClients,
  getFoundationAlertLytConnectionGovernanceRiskDetail,
  getFoundationAlertRuntimeCallbackStalledDetail,
  getFoundationAppBootstrapWiring,
  isFoundationAlertLytConnectionGovernanceRiskDetail,
  isFoundationAlertRuntimeCallbackStalledDetail,
  isFoundationAlertTimelineFilterStateEqual,
  listFoundationAlertTimelineActiveFilters,
  mapToBackendRole,
  memberAutomationTriggerCodeContracts,
  memberAutomationTriggerSourceContracts,
  memberAutomationTriggerStatusContracts,
  memberDataSourceContracts,
  memberLevelContracts,
  memberLifecycleStageContracts,
  memberOperationsActionChannelContracts,
  memberOperationsActionCodeContracts,
  memberOperationsExecutionLaneContracts,
  memberOperationsPriorityContracts,
  memberOperationsReceiptStatusContracts,
  memberOperationsReceiptTargetTypeContracts,
  memberOperationsRuntimeStateContracts,
  memberOperationsTaskSourceContracts,
  memberOperationsTaskStatusContracts,
  memberStatusContracts,
  normalizeFoundationAlertTimelineFilterState,
  readAuditTrailRecordDetailParam,
  readConfigurationCertificateDetailParam,
  readConfigurationConfigEntryDetailParam,
  readConfigurationFeatureFlagDetailParam,
  readConfigurationOperationDetailParam,
  readConfigurationSecretDetailParam,
  readFoundationModuleDetailParam,
  readIdentityAccessPermissionDetailParam,
  readIdentityAccessRoleDetailParam,
  readIdentityAccessSessionDetailParam,
  readIntegrationOrchestrationEventDetailParam,
  readIntegrationOrchestrationIdempotencyDetailParam,
  readIntegrationOrchestrationSourceDetailParam,
  readRateLimitsLedgerDetailParam,
  readRateLimitsPolicyDetailParam,
  readResilienceRecoveryPlanDetailParam,
  readResilienceRetryPolicyDetailParam,
  readResilienceSignalDetailParam,
  resolveFoundationAlertFocusCode,
  resolveFoundationAlertSelectedCode,
  runtimeGovernanceActionKeys,
  runtimeGovernanceApiActionKeys,
  runtimeGovernanceCallbackEvents,
  runtimeGovernanceCallbackReceiptStatuses,
  runtimeGovernanceCallbackStallEscalationActions,
  runtimeGovernanceCallbackStatuses,
  runtimeGovernanceCallbackTimeoutThresholds,
  runtimeGovernanceClientApps,
  runtimeGovernanceNextSteps,
  runtimeGovernanceRecommendedActions,
  runtimeGovernanceReplayEscalationActions,
  runtimeGovernanceReplaySources,
  runtimeGovernanceRiskLevels,
  summarizeFoundationAlertOwners,
  summarizeFoundationAlertTimelineDigest,
  summarizeFoundationAlertTimelineFilters,
  summarizeFoundationAlertTimelineMetrics,
  summarizeFoundationAlertTimelineSources
});
