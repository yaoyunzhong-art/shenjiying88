export interface PaginationInput {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResult<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export type FoundationClientApp = 'admin-web' | 'tob-web' | 'storefront-web' | 'miniapp' | 'app';

export type BootstrapDeliveryChannel = 'API_BOOTSTRAP' | 'RUNTIME_CHALLENGE';

export type BootstrapCacheLayer = 'NONE' | 'MEMORY' | 'SESSION' | 'LOCAL_PERSISTED';

export type BootstrapFallbackStrategy = 'FAIL_CLOSED' | 'READONLY_LAST_KNOWN' | 'PUBLIC_LAST_KNOWN';

export interface BootstrapCapabilityRule {
  capability: string;
  source: BootstrapDeliveryChannel;
  requiredApps: FoundationClientApp[];
  cacheLayer: BootstrapCacheLayer;
  ttlSeconds?: number;
  notes: string[];
}

export interface TenantScopeBootstrapPolicy {
  resolver: string;
  bootstrapRequired: boolean;
  cacheLayer: BootstrapCacheLayer;
  revalidateOn: string[];
  mismatchStrategy: BootstrapFallbackStrategy;
}

export interface DesensitizationBootstrapPolicy {
  source: 'API_BOOTSTRAP';
  defaultMode: 'MASKED' | 'HIDDEN_UNTIL_APPROVED' | 'PUBLIC_ONLY';
  notes: string[];
}

export interface FeatureFlagBootstrapPolicy {
  source: 'API_BOOTSTRAP';
  cacheLayer: BootstrapCacheLayer;
  ttlSeconds?: number;
  fallbackStrategy: BootstrapFallbackStrategy;
  notes: string[];
}

export interface RiskChallengeBootstrapPolicy {
  triggerSource: 'API_BOOTSTRAP';
  cacheLayer: 'NONE' | 'MEMORY';
  enforcement: 'STEP_UP' | 'BLOCKING';
  notes: string[];
}

export interface AppBootstrapWiring {
  app: FoundationClientApp;
  audience: 'OPERATIONS' | 'MERCHANT' | 'CONSUMER';
  bootstrapFile: string;
  bootstrapEndpoint: string;
  consumes: string[];
  cacheableCapabilities: string[];
  tenantScope: TenantScopeBootstrapPolicy;
  desensitization: DesensitizationBootstrapPolicy;
  featureFlags: FeatureFlagBootstrapPolicy;
  riskChallenge: RiskChallengeBootstrapPolicy;
}

export interface UnifiedFoundationBootstrapContract {
  version: string;
  bootstrapEndpoint: string;
  deliveredCapabilities: BootstrapCapabilityRule[];
  appProfiles: Record<FoundationClientApp, AppBootstrapWiring>;
}

export type FoundationModuleKey =
  | 'identity-access'
  | 'configuration-governance'
  | 'integration-orchestration'
  | 'trust-governance'
  | 'resilience-operations'
  | 'runtime-governance';

export type FoundationConsumerKey = 'market' | 'portal' | 'workbench' | 'lyt-adapter';

export type FoundationAlertCode =
  | 'approvals-pending'
  | 'approval-execution-failures'
  | 'high-risk-audits'
  | 'blocked-rate-limit-ledgers'
  | 'secret-rotation-attention'
  | 'observability-degradation'
  | 'recovery-drill-attention'
  | 'runtime-governance-backlog'
  | 'runtime-callback-stalled'
  | 'lyt-connection-governance-risk';

export type FoundationAlertSeverity = 'high' | 'medium' | 'low';

export type FoundationAlertAcknowledgementStatus = 'ACKED' | 'MUTED';

export interface FoundationAlertAcknowledgement {
  status: FoundationAlertAcknowledgementStatus;
  note: string | null;
  actorId: string | null;
  acknowledgedAt: string | null;
  mutedUntil: string | null;
  updatedAt: string;
}

export interface FoundationAlertCatalogItem {
  code: FoundationAlertCode;
  defaultSummary: string;
  severityPolicy: string;
  sourceModules: FoundationModuleKey[];
  drilldownEnabled: boolean;
  acknowledgementEnabled: boolean;
  drilldownPath: string;
  ackPath: string;
  mutePath: string;
  unmutePath: string;
  acknowledgement?: FoundationAlertAcknowledgement | null;
  visibleInOverview?: boolean;
  availableActions?: FoundationAlertOperation[];
  recentOperation?: FoundationAlertTimelineEntry | null;
  triageState?: FoundationOperationsAlertTriageState;
  triageSummary?: string;
}

export interface FoundationAlertCatalogResponse {
  generatedAt: string;
  alerts: FoundationAlertCatalogItem[];
}

export type FoundationAlertOperation = 'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE';

export type FoundationAlertMutationKind = 'ACK' | 'MUTE' | 'UNMUTE';

export type FoundationAlertTimelineFilter = 'ALL' | FoundationAlertMutationKind;

export type FoundationAlertOwnerFilter = 'ALL' | string;

export type FoundationAlertTimelineSourceFilter = 'ALL' | string;

export interface FoundationAlertTimelineEntry {
  action: FoundationAlertMutationKind;
  note: string | null;
  actorId: string | null;
  mutedUntil: string | null;
  visibleInOverview: boolean;
  createdAt: string;
  source: string | null;
}

export interface FoundationAlertOwnerSummary {
  actorId: string;
  count: number;
  lastAction: FoundationAlertMutationKind;
  lastSeenAt: string;
}

export interface FoundationAlertTimelineMetrics {
  total: number;
  visibleInOverview: number;
  hiddenFromOverview: number;
  latestMatchedAt: string | null;
}

export interface FoundationAlertTimelineSourceSummary {
  source: string;
  count: number;
  latestAt: string | null;
}

export interface FoundationAlertTimelineActionSummary {
  action: FoundationAlertMutationKind;
  count: number;
  latestAt: string | null;
}

export interface FoundationAlertTimelineDigest {
  actions: FoundationAlertTimelineActionSummary[];
  uniqueOwnerCount: number;
  latestActorId: string | null;
  dominantAction: FoundationAlertMutationKind | null;
  latestVisibleAction: FoundationAlertMutationKind | null;
  latestHiddenAction: FoundationAlertMutationKind | null;
  dominantSource: string | null;
  latestSource: string | null;
  latestVisibleSource: string | null;
  latestHiddenSource: string | null;
}

export interface FoundationAlertTimelineFilterState {
  action: FoundationAlertTimelineFilter;
  source: FoundationAlertTimelineSourceFilter;
  owner: FoundationAlertOwnerFilter;
}

export interface FoundationAlertTimelineActiveFilterChip {
  kind: 'action' | 'source' | 'owner';
  label: string;
  value: string;
}

export interface FoundationAlertTimelineShortcutPreset {
  key: 'latest-owner' | 'latest-source' | 'dominant-action' | 'recent-hidden-flow' | 'recent-visible-flow';
  label: string;
  helper: string;
  filters: FoundationAlertTimelineFilterState;
}

export interface FoundationAlertTimelineFilterQueryKeys {
  action: string;
  source: string;
  owner: string;
}

export interface FoundationAlertLinkedFocusQueryKeys {
  focus: string;
  timeline: FoundationAlertTimelineFilterQueryKeys;
}

export interface FoundationAlertRuntimeCallbackStalledEscalationSummary {
  waitCallback: number;
  scheduleReplay: number;
  openManualReview: number;
}

export function buildFoundationAlertRecentOperationFilterState(
  entry: FoundationAlertTimelineEntry | null | undefined
): FoundationAlertTimelineFilterState {
  if (!entry) {
    return {
      action: 'ALL',
      source: 'ALL',
      owner: 'ALL'
    };
  }

  return {
    action: entry.action,
    source: entry.source ?? 'ALL',
    owner: entry.actorId ?? 'ALL'
  };
}

export function buildFoundationAlertTimelineFilterStateFromQuery(query: {
  action?: string | null;
  source?: string | null;
  owner?: string | null;
}): FoundationAlertTimelineFilterState {
  return {
    action: query.action === 'ACK' || query.action === 'MUTE' || query.action === 'UNMUTE' ? query.action : 'ALL',
    source: query.source || 'ALL',
    owner: query.owner || 'ALL'
  };
}

export function normalizeFoundationAlertTimelineFilterState(
  filters: FoundationAlertTimelineFilterState,
  options: {
    availableOwners?: Array<string | null | undefined>;
    availableSources?: Array<string | null | undefined>;
  }
): FoundationAlertTimelineFilterState {
  const availableOwners = new Set(
    (options.availableOwners ?? []).map((item) => item || 'ALL').filter((item) => item !== 'ALL')
  );
  const availableSources = new Set(
    (options.availableSources ?? []).map((item) => item || 'ALL').filter((item) => item !== 'ALL')
  );

  return {
    action: filters.action,
    owner: filters.owner !== 'ALL' && !availableOwners.has(filters.owner) ? 'ALL' : filters.owner,
    source: filters.source !== 'ALL' && !availableSources.has(filters.source) ? 'ALL' : filters.source
  };
}

export function buildFoundationAlertTimelineFilterSearchParams(options: {
  search?: string | URLSearchParams;
  queryKeys: FoundationAlertTimelineFilterQueryKeys;
  filters: FoundationAlertTimelineFilterState;
}): URLSearchParams {
  const params =
    options.search instanceof URLSearchParams
      ? new URLSearchParams(options.search.toString())
      : new URLSearchParams(options.search ?? '');

  if (!options.filters.action || options.filters.action === 'ALL') {
    params.delete(options.queryKeys.action);
  } else {
    params.set(options.queryKeys.action, options.filters.action);
  }

  if (!options.filters.source || options.filters.source === 'ALL') {
    params.delete(options.queryKeys.source);
  } else {
    params.set(options.queryKeys.source, options.filters.source);
  }

  if (!options.filters.owner || options.filters.owner === 'ALL') {
    params.delete(options.queryKeys.owner);
  } else {
    params.set(options.queryKeys.owner, options.filters.owner);
  }

  return params;
}

export function buildFoundationAlertTimelineFilterQueryPreview(
  queryKeys: FoundationAlertTimelineFilterQueryKeys,
  filters: FoundationAlertTimelineFilterState
) {
  const query = buildFoundationAlertTimelineFilterSearchParams({
    queryKeys,
    filters
  }).toString();

  return query ? `?${query}` : '(default)';
}

export function resolveFoundationAlertFocusCode(
  queryFocusCode: string | null | undefined,
  candidateGroups: Array<Array<{ code: string }> | null | undefined>
) {
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

export function buildFoundationAlertLinkedFocusContext(
  context: string,
  filters?: FoundationAlertTimelineFilterState | null
) {
  if (!filters) {
    return context;
  }

  const summary = summarizeFoundationAlertTimelineFilters(filters);
  return summary === '全部 timeline' ? context : `${context} / ${summary}`;
}

export function buildFoundationAlertLinkedFocusSearchParams(options: {
  search?: string | URLSearchParams;
  queryKeys: FoundationAlertLinkedFocusQueryKeys;
  focusCode?: string | null;
  filters?: FoundationAlertTimelineFilterState | null;
}): URLSearchParams {
  const params = buildFoundationAlertTimelineFilterSearchParams({
    search: options.search,
    queryKeys: options.queryKeys.timeline,
    filters:
      options.filters ??
      ({
        action: 'ALL',
        source: 'ALL',
        owner: 'ALL'
      } satisfies FoundationAlertTimelineFilterState)
  });

  if (options.focusCode) {
    params.set(options.queryKeys.focus, options.focusCode);
  } else {
    params.delete(options.queryKeys.focus);
  }

  return params;
}

export function filterFoundationAlertTimeline(
  history: FoundationAlertTimelineEntry[] | null | undefined,
  filter: FoundationAlertTimelineFilter = 'ALL'
): FoundationAlertTimelineEntry[] {
  if (!history?.length) {
    return [];
  }

  if (filter === 'ALL') {
    return history;
  }

  return history.filter((item) => item.action === filter);
}

export function summarizeFoundationAlertOwners(
  history: FoundationAlertTimelineEntry[] | null | undefined
): FoundationAlertOwnerSummary[] {
  if (!history?.length) {
    return [];
  }

  const ownerMap = new Map<string, FoundationAlertOwnerSummary>();

  for (const item of history) {
    const actorId = item.actorId ?? '系统';
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

export function filterFoundationAlertTimelineByOwner(
  history: FoundationAlertTimelineEntry[] | null | undefined,
  ownerFilter: FoundationAlertOwnerFilter = 'ALL'
): FoundationAlertTimelineEntry[] {
  if (!history?.length) {
    return [];
  }

  if (ownerFilter === 'ALL') {
    return history;
  }

  return history.filter((item) => (item.actorId ?? '系统') === ownerFilter);
}

export function filterFoundationAlertTimelineBySource(
  history: FoundationAlertTimelineEntry[] | null | undefined,
  sourceFilter: FoundationAlertTimelineSourceFilter = 'ALL'
): FoundationAlertTimelineEntry[] {
  if (!history?.length) {
    return [];
  }

  if (sourceFilter === 'ALL') {
    return history;
  }

  return history.filter((item) => (item.source ?? 'unknown') === sourceFilter);
}

export function summarizeFoundationAlertTimelineSources(
  history: FoundationAlertTimelineEntry[] | null | undefined
): FoundationAlertTimelineSourceSummary[] {
  if (!history?.length) {
    return [];
  }

  const sourceMap = new Map<string, FoundationAlertTimelineSourceSummary>();

  for (const item of history) {
    const source = item.source ?? 'unknown';
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
    if (Date.parse(item.createdAt) >= Date.parse(current.latestAt ?? '1970-01-01T00:00:00.000Z')) {
      current.latestAt = item.createdAt;
    }
  }

  return [...sourceMap.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return Date.parse(right.latestAt ?? '1970-01-01T00:00:00.000Z') - Date.parse(left.latestAt ?? '1970-01-01T00:00:00.000Z');
  });
}

export function findLatestFoundationAlertTimelineEntry(
  history: FoundationAlertTimelineEntry[] | null | undefined
): FoundationAlertTimelineEntry | null {
  if (!history?.length) {
    return null;
  }

  return history.reduce<FoundationAlertTimelineEntry | null>((latest, item) => {
    if (!latest) {
      return item;
    }

    return Date.parse(item.createdAt) >= Date.parse(latest.createdAt) ? item : latest;
  }, null);
}

export function summarizeFoundationAlertTimelineMetrics(
  history: FoundationAlertTimelineEntry[] | null | undefined
): FoundationAlertTimelineMetrics {
  const entries = history ?? [];
  const latest = findLatestFoundationAlertTimelineEntry(entries);

  return {
    total: entries.length,
    visibleInOverview: entries.filter((item) => item.visibleInOverview).length,
    hiddenFromOverview: entries.filter((item) => !item.visibleInOverview).length,
    latestMatchedAt: latest?.createdAt ?? null
  };
}

export function summarizeFoundationAlertTimelineDigest(
  history: FoundationAlertTimelineEntry[] | null | undefined
): FoundationAlertTimelineDigest {
  const entries = history ?? [];
  const latest = findLatestFoundationAlertTimelineEntry(entries);
  const latestVisible = findLatestFoundationAlertTimelineEntry(entries.filter((item) => item.visibleInOverview));
  const latestHidden = findLatestFoundationAlertTimelineEntry(entries.filter((item) => !item.visibleInOverview));
  const owners = new Set(entries.map((item) => item.actorId ?? '系统'));
  const sources = summarizeFoundationAlertTimelineSources(entries);
  const actions = (['ACK', 'MUTE', 'UNMUTE'] as const).map((action) => {
    const matched = entries.filter((item) => item.action === action);
    const latestMatched = findLatestFoundationAlertTimelineEntry(matched);

    return {
      action,
      count: matched.length,
      latestAt: latestMatched?.createdAt ?? null
    };
  });
  const dominantAction =
    actions
      .slice()
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count;
        }

        return Date.parse(right.latestAt ?? '1970-01-01T00:00:00.000Z') - Date.parse(left.latestAt ?? '1970-01-01T00:00:00.000Z');
      })[0]?.count
      ? actions
          .slice()
          .sort((left, right) => {
            if (right.count !== left.count) {
              return right.count - left.count;
            }

            return (
              Date.parse(right.latestAt ?? '1970-01-01T00:00:00.000Z') -
              Date.parse(left.latestAt ?? '1970-01-01T00:00:00.000Z')
            );
          })[0]?.action ?? null
      : null;

  return {
    actions,
    uniqueOwnerCount: owners.size,
    latestActorId: latest?.actorId ?? null,
    dominantAction,
    latestVisibleAction: latestVisible?.action ?? null,
    latestHiddenAction: latestHidden?.action ?? null,
    dominantSource: sources[0]?.count ? sources[0].source : null,
    latestSource: latest?.source ?? 'unknown',
    latestVisibleSource: latestVisible?.source ?? (latestVisible ? 'unknown' : null),
    latestHiddenSource: latestHidden?.source ?? (latestHidden ? 'unknown' : null)
  };
}

export function listFoundationAlertTimelineActiveFilters(
  filters: FoundationAlertTimelineFilterState
): FoundationAlertTimelineActiveFilterChip[] {
  const chips: FoundationAlertTimelineActiveFilterChip[] = [];

  if (filters.action !== 'ALL') {
    chips.push({
      kind: 'action',
      label: `动作 ${filters.action}`,
      value: filters.action
    });
  }

  if (filters.source !== 'ALL') {
    chips.push({
      kind: 'source',
      label: `来源 ${filters.source}`,
      value: filters.source
    });
  }

  if (filters.owner !== 'ALL') {
    chips.push({
      kind: 'owner',
      label: `责任人 ${filters.owner}`,
      value: filters.owner
    });
  }

  return chips;
}

export function summarizeFoundationAlertTimelineFilters(filters: FoundationAlertTimelineFilterState): string {
  const chips = listFoundationAlertTimelineActiveFilters(filters);

  if (chips.length === 0) {
    return '全部 timeline';
  }

  return chips.map((item) => item.label).join(' / ');
}

export function isFoundationAlertTimelineFilterStateEqual(
  left: FoundationAlertTimelineFilterState,
  right: FoundationAlertTimelineFilterState
): boolean {
  return left.action === right.action && left.source === right.source && left.owner === right.owner;
}

export function buildFoundationAlertTimelineEmptyState(filters: FoundationAlertTimelineFilterState): string {
  const summary = summarizeFoundationAlertTimelineFilters(filters);

  if (summary === '全部 timeline') {
    return '当前筛选下没有匹配的 timeline 动作。可切换动作、来源或责任人继续排查。';
  }

  return `当前筛选下没有匹配的 timeline 动作。可清除 ${summary} 后继续排查。`;
}

export function buildFoundationAlertTimelineShortcutPresets(
  history: FoundationAlertTimelineEntry[] | null | undefined
): FoundationAlertTimelineShortcutPreset[] {
  const entries = history ?? [];

  if (entries.length === 0) {
    return [];
  }

  const latest = findLatestFoundationAlertTimelineEntry(entries);
  const digest = summarizeFoundationAlertTimelineDigest(entries);
  const presets: FoundationAlertTimelineShortcutPreset[] = [];
  const seenSummaries = new Set<string>();

  function pushPreset(preset: FoundationAlertTimelineShortcutPreset) {
    const summary = summarizeFoundationAlertTimelineFilters(preset.filters);

    if (summary === '全部 timeline' || seenSummaries.has(summary)) {
      return;
    }

    seenSummaries.add(summary);
    presets.push(preset);
  }

  if (latest) {
    pushPreset({
      key: 'latest-owner',
      label: `最近责任人 ${latest.actorId ?? '系统'}`,
      helper: '聚焦最近一次接手这条告警的责任人轨迹。',
      filters: {
        action: 'ALL',
        source: 'ALL',
        owner: latest.actorId ?? '系统'
      }
    });
    pushPreset({
      key: 'latest-source',
      label: `最近来源 ${latest.source ?? 'unknown'}`,
      helper: '快速回看最近一次命中的 timeline 来源。',
      filters: {
        action: 'ALL',
        source: latest.source ?? 'unknown',
        owner: 'ALL'
      }
    });
  }

  if (digest.dominantAction) {
    pushPreset({
      key: 'dominant-action',
      label: `主动作 ${digest.dominantAction}`,
      helper: '聚焦当前 timeline 中最密集的动作类型。',
      filters: {
        action: digest.dominantAction,
        source: 'ALL',
        owner: 'ALL'
      }
    });
  }

  if (digest.latestHiddenAction || digest.latestHiddenSource) {
    pushPreset({
      key: 'recent-hidden-flow',
      label: '最近隐藏流转',
      helper: '定位最近一次把告警移出 overview 的动作轨迹。',
      filters: {
        action: digest.latestHiddenAction ?? 'ALL',
        source: digest.latestHiddenSource ?? 'ALL',
        owner: 'ALL'
      }
    });
  }

  if (digest.latestVisibleAction || digest.latestVisibleSource) {
    pushPreset({
      key: 'recent-visible-flow',
      label: '最近恢复流转',
      helper: '定位最近一次把告警重新带回 overview 的动作轨迹。',
      filters: {
        action: digest.latestVisibleAction ?? 'ALL',
        source: digest.latestVisibleSource ?? 'ALL',
        owner: 'ALL'
      }
    });
  }

  return presets;
}

export interface FoundationAlertRuntimeCallbackStalledDetail {
  total: number;
  timeoutThresholds: Record<RuntimeGovernanceRiskLevel, number>;
  escalationSummary: FoundationAlertRuntimeCallbackStalledEscalationSummary;
  receipts: RuntimeGovernanceCallbackStallDetail[];
}

export interface FoundationAlertLytGovernanceAlertGroup {
  severity: 'high' | 'medium' | 'low';
  code: string;
  count: number;
  summary: string;
  affectedStoreIds: string[];
  affectedCapabilities: string[];
  recommendedNextActions: string[];
}

export interface FoundationAlertLytConnectionGovernanceRiskDetail {
  total: number;
  scope: {
    tenantId?: string;
    brandId?: string;
  };
  alerts: FoundationAlertLytGovernanceAlertGroup[];
  topAlertCodes: string[];
  affectedStoreIds: string[];
  affectedCapabilities: string[];
  recommendedNextActions: string[];
}

export type FoundationAlertDrilldownDetail =
  | Record<string, unknown>
  | FoundationAlertRuntimeCallbackStalledDetail
  | FoundationAlertLytConnectionGovernanceRiskDetail;

export function isFoundationAlertRuntimeCallbackStalledDetail(
  code: FoundationAlertCode | string,
  detail: FoundationAlertDrilldownDetail | null | undefined
): detail is FoundationAlertRuntimeCallbackStalledDetail {
  if (code !== 'runtime-callback-stalled' || !detail || typeof detail !== 'object') {
    return false;
  }

  const detailRecord = detail as Record<string, unknown>;
  const escalationSummary = detailRecord.escalationSummary;
  const timeoutThresholds = detailRecord.timeoutThresholds;

  return (
    typeof detailRecord.total === 'number' &&
    Array.isArray(detailRecord.receipts) &&
    Boolean(timeoutThresholds) &&
    typeof timeoutThresholds === 'object' &&
    typeof (timeoutThresholds as Record<string, unknown>).low === 'number' &&
    typeof (timeoutThresholds as Record<string, unknown>).medium === 'number' &&
    typeof (timeoutThresholds as Record<string, unknown>).high === 'number' &&
    Boolean(escalationSummary) &&
    typeof escalationSummary === 'object' &&
    typeof (escalationSummary as Record<string, unknown>).waitCallback === 'number' &&
    typeof (escalationSummary as Record<string, unknown>).scheduleReplay === 'number' &&
    typeof (escalationSummary as Record<string, unknown>).openManualReview === 'number'
  );
}

export function getFoundationAlertRuntimeCallbackStalledDetail(
  drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined,
  code?: FoundationAlertCode | string | null
) {
  if (!drilldown) {
    return null;
  }

  const resolvedCode = code ?? drilldown.code;
  return isFoundationAlertRuntimeCallbackStalledDetail(resolvedCode, drilldown.detail) ? drilldown.detail : null;
}

export function isFoundationAlertLytConnectionGovernanceRiskDetail(
  code: FoundationAlertCode | string,
  detail: FoundationAlertDrilldownDetail | null | undefined
): detail is FoundationAlertLytConnectionGovernanceRiskDetail {
  if (code !== 'lyt-connection-governance-risk' || !detail || typeof detail !== 'object') {
    return false;
  }

  const detailRecord = detail as Record<string, unknown>;
  const scope = detailRecord.scope;

  return (
    typeof detailRecord.total === 'number' &&
    Boolean(scope) &&
    typeof scope === 'object' &&
    Array.isArray(detailRecord.alerts) &&
    Array.isArray(detailRecord.topAlertCodes) &&
    Array.isArray(detailRecord.affectedStoreIds) &&
    Array.isArray(detailRecord.affectedCapabilities) &&
    Array.isArray(detailRecord.recommendedNextActions)
  );
}

export function getFoundationAlertLytConnectionGovernanceRiskDetail(
  drilldown: Pick<FoundationAlertDrilldownResponse, 'code' | 'detail'> | null | undefined,
  code?: FoundationAlertCode | string | null
) {
  if (!drilldown) {
    return null;
  }

  const resolvedCode = code ?? drilldown.code;
  return isFoundationAlertLytConnectionGovernanceRiskDetail(resolvedCode, drilldown.detail) ? drilldown.detail : null;
}

export interface LytStoreCapabilityAccessItem {
  capability: string;
  readiness: 'ready' | 'inherited-ready' | 'stale' | 'pending-configuration' | 'not-enabled';
  access: 'enabled' | 'degraded' | 'blocked' | 'hidden';
  reason: string;
}

export interface LytStoreCapabilityAccessViewResponse {
  storeId: string;
  storeCode?: string;
  storeName?: string;
  connectionStatus: 'configured' | 'pending-configuration';
  resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback';
  healthStatus?: 'healthy' | 'stale' | 'pending-configuration';
  accessByCapability: LytStoreCapabilityAccessItem[];
  recommendedNextActions: string[];
}

export interface FoundationAlertPanelReadState {
  activeMutation: FoundationAlertMutationResponse | null;
  recentTimeline: FoundationAlertTimelineEntry[];
  currentOwner: string;
  currentNote: string;
}

export interface FoundationAlertPanelDerivedState extends FoundationAlertPanelReadState {
  selectedAlert: FoundationAlertCatalogItem | null;
  actionFilteredTimeline: FoundationAlertTimelineEntry[];
  runtimeCallbackDrilldown: FoundationAlertRuntimeCallbackStalledDetail | null;
  sourceSummary: FoundationAlertTimelineSourceSummary[];
  sourceFilteredTimeline: FoundationAlertTimelineEntry[];
  ownerSummary: FoundationAlertOwnerSummary[];
  filteredTimeline: FoundationAlertTimelineEntry[];
  latestMatchedTimeline: FoundationAlertTimelineEntry | null;
  timelineMetrics: FoundationAlertTimelineMetrics;
  timelineDigest: FoundationAlertTimelineDigest;
}

export interface FoundationAlertTimelineFilterReadState {
  filterState: FoundationAlertTimelineFilterState;
  activeFilterChips: FoundationAlertTimelineActiveFilterChip[];
  filterSummary: string;
  filterEmptyState: string;
  shortcutPresets: FoundationAlertTimelineShortcutPreset[];
  hasActiveFilters: boolean;
}

export type FoundationAlertOptimisticOverviewVisibility =
  | 'hidden (optimistic)'
  | 'visible (optimistic)'
  | 'hidden'
  | 'visible';

export interface FoundationAlertOptimisticFeedback {
  title: string;
  description: string;
}

export interface FoundationAlertOptimisticReadState {
  overviewVisibility: FoundationAlertOptimisticOverviewVisibility;
  feedback: FoundationAlertOptimisticFeedback | null;
}

export interface FoundationAlertQuickSwitchItem {
  code: string;
}

export function resolveFoundationAlertSelectedCode<TAlert extends { code: string }>(
  alerts: readonly TAlert[],
  options?: {
    preferredCode?: string | null;
    currentCode?: string | null;
  }
) {
  const resolvedCode =
    alerts.find((item) => item.code === options?.preferredCode)?.code ??
    alerts.find((item) => item.code === options?.currentCode)?.code;
  return resolvedCode ?? alerts[0]?.code ?? '';
}

export function buildFoundationAlertPanelReadState(options: {
  selectedAlert?: Pick<FoundationOperationsAlert, 'code' | 'recentOperation' | 'acknowledgement'> | null;
  drilldown?: Pick<FoundationAlertDrilldownResponse, 'history' | 'acknowledgement'> | null;
  mutation?: FoundationAlertMutationResponse | null;
}): FoundationAlertPanelReadState {
  const activeMutation = options.mutation?.code === options.selectedAlert?.code ? (options.mutation ?? null) : null;
  const recentTimeline = activeMutation?.history ?? options.drilldown?.history ?? [];

  return {
    activeMutation,
    recentTimeline,
    currentOwner:
      recentTimeline[0]?.actorId ??
      options.selectedAlert?.recentOperation?.actorId ??
      options.selectedAlert?.acknowledgement?.actorId ??
      options.drilldown?.acknowledgement?.actorId ??
      '系统',
    currentNote:
      recentTimeline[0]?.note ??
      options.selectedAlert?.recentOperation?.note ??
      options.drilldown?.acknowledgement?.note ??
      '暂无备注'
  };
}

export function buildFoundationAlertPanelDerivedState(options: {
  alerts: FoundationAlertCatalogItem[];
  selectedAlertCode?: string | null;
  drilldown?: FoundationAlertDrilldownResponse | null;
  mutation?: FoundationAlertMutationResponse | null;
  filters: FoundationAlertTimelineFilterState;
}): FoundationAlertPanelDerivedState {
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

export function buildFoundationAlertTimelineFilterReadState(options: {
  action: FoundationAlertTimelineFilter;
  source: FoundationAlertTimelineSourceFilter;
  owner: FoundationAlertOwnerFilter;
  history?: FoundationAlertTimelineEntry[] | null;
}): FoundationAlertTimelineFilterReadState {
  const filterState: FoundationAlertTimelineFilterState = {
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
    hasActiveFilters: filterState.action !== 'ALL' || filterState.source !== 'ALL' || filterState.owner !== 'ALL'
  };
}

export function buildFoundationAlertQuickSwitchItems(
  topRisks: Array<{ code: string }>,
  alerts: Array<{ code: string }>,
  limit = 5
): FoundationAlertQuickSwitchItem[] {
  const picked = new Set<string>();
  const quickSwitchItems: FoundationAlertQuickSwitchItem[] = [];

  for (const item of [...topRisks, ...alerts]) {
    if (picked.has(item.code)) {
      continue;
    }

    picked.add(item.code);
    quickSwitchItems.push({ code: item.code });
  }

  return quickSwitchItems.slice(0, limit);
}

export function buildFoundationAlertOptimisticReadState(options: {
  pendingMutationAction?: FoundationAlertMutationKind | null;
  visibleInOverview?: boolean | null;
}): FoundationAlertOptimisticReadState {
  const pendingMutationAction = options.pendingMutationAction ?? null;

  return {
    overviewVisibility:
      pendingMutationAction === 'MUTE'
        ? 'hidden (optimistic)'
        : pendingMutationAction === 'UNMUTE'
          ? 'visible (optimistic)'
          : options.visibleInOverview === false
            ? 'hidden'
            : 'visible',
    feedback: pendingMutationAction
      ? {
          title: `${pendingMutationAction} 正在提交`,
          description:
            pendingMutationAction === 'MUTE'
              ? '预期该告警会先从 overview 隐藏，等待真实回包和回刷结果确认。'
              : pendingMutationAction === 'UNMUTE'
                ? '预期该告警会重新回到 overview，等待真实回包和回刷结果确认。'
                : '预期 triage 会先转为已确认状态，等待真实回包和回刷结果确认。'
        }
      : null
  };
}

export interface FoundationAlertDrilldownResponse {
  generatedAt: string;
  code: FoundationAlertCode | string;
  catalog?: FoundationAlertCatalogItem | null;
  alert?: FoundationOperationsAlert | null;
  acknowledgement?: FoundationAlertAcknowledgement | null;
  visibleInOverview?: boolean;
  availableActions?: FoundationAlertOperation[];
  history?: FoundationAlertTimelineEntry[];
  detail?: FoundationAlertDrilldownDetail;
  availableAlertCodes?: FoundationAlertCode[];
}

export interface FoundationAlertMutationResponse {
  generatedAt: string;
  code: FoundationAlertCode | string;
  catalog?: FoundationAlertCatalogItem | null;
  acknowledgement?: FoundationAlertAcknowledgement;
  visibleInOverview?: boolean;
  availableActions?: FoundationAlertOperation[];
  history?: FoundationAlertTimelineEntry[];
  availableAlertCodes?: FoundationAlertCode[];
}

export const runtimeGovernanceClientApps = ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app', 'lyt'] as const;

export type RuntimeGovernanceClientApp = (typeof runtimeGovernanceClientApps)[number];

export const runtimeGovernanceActionKeys = [
  'approval-execution',
  'market-profile-resolve',
  'regional-override-preview',
  'secret-rotation',
  'runtime-replay',
  'webhook-callback',
  'edge-replay',
  'member-login',
  'coupon-claim',
  'booking-submit',
  'device-bind',
  'payment-submit'
] as const;

export type RuntimeGovernanceActionKey = (typeof runtimeGovernanceActionKeys)[number];

export const runtimeGovernanceApiActionKeys = [
  'approval-execution',
  'secret-rotation',
  'runtime-replay',
  'member-login',
  'coupon-claim',
  'booking-submit',
  'device-bind',
  'payment-submit'
] as const satisfies readonly RuntimeGovernanceActionKey[];

export type RuntimeGovernanceApiActionKey = (typeof runtimeGovernanceApiActionKeys)[number];

export const adminRuntimeActionKeys = ['approval-execution', 'secret-rotation', 'runtime-replay'] as const satisfies
  readonly RuntimeGovernanceApiActionKey[];

export type AdminRuntimeActionKey = (typeof adminRuntimeActionKeys)[number];

export const runtimeGovernanceNextSteps = ['PROCEED', 'LOGIN', 'CHALLENGE', 'REFRESH'] as const;

export type RuntimeGovernanceNextStep = (typeof runtimeGovernanceNextSteps)[number];

export type RuntimeGovernanceActionState =
  | 'blocked'
  | 'challenge-issued'
  | 'submitted'
  | 'callback-recorded'
  | 'replay-scheduled';

export const runtimeGovernanceRiskLevels = ['low', 'medium', 'high'] as const;

export type RuntimeGovernanceRiskLevel = (typeof runtimeGovernanceRiskLevels)[number];

export const runtimeGovernanceRecommendedActions = [
  'REFRESH_BOOTSTRAP',
  'COMPLETE_LOGIN',
  'COMPLETE_CHALLENGE',
  'FOLLOW_SUBMIT_CALLBACK'
] as const;

export type RuntimeGovernanceRecommendedAction = (typeof runtimeGovernanceRecommendedActions)[number];

export const runtimeGovernanceCallbackStatuses = ['callback-blocked', 'callback-recorded'] as const;

export type RuntimeGovernanceCallbackStatus = (typeof runtimeGovernanceCallbackStatuses)[number];

export const runtimeGovernanceCallbackReceiptStatuses = [
  'callback-blocked',
  'awaiting-callback',
  'callback-recorded'
] as const;

export type RuntimeGovernanceCallbackReceiptStatus = (typeof runtimeGovernanceCallbackReceiptStatuses)[number];

export const runtimeGovernanceCallbackEvents = [
  'PREREQUISITE_PENDING',
  'CHALLENGE_PENDING',
  'HANDLER_ACCEPTED',
  'HANDLER_COMPLETED'
] as const;

export type RuntimeGovernanceCallbackEvent = (typeof runtimeGovernanceCallbackEvents)[number];

export const runtimeGovernanceCallbackTimeoutThresholds = {
  low: 15 * 60 * 1000,
  medium: 10 * 60 * 1000,
  high: 5 * 60 * 1000
} as const satisfies Record<RuntimeGovernanceRiskLevel, number>;

export const runtimeGovernanceCallbackStallEscalationActions = [
  'WAIT_CALLBACK',
  'SCHEDULE_REPLAY',
  'OPEN_MANUAL_REVIEW'
] as const;

export type RuntimeGovernanceCallbackStallEscalationAction =
  (typeof runtimeGovernanceCallbackStallEscalationActions)[number];

export const runtimeGovernanceReplaySources = [
  'ADMIN_WEB_RUNTIME',
  'TOB_WEB_RUNTIME',
  'STOREFRONT_WEB_RUNTIME',
  'MINIAPP_RUNTIME',
  'APP_RUNTIME'
] as const;

export type RuntimeGovernanceReplaySource = (typeof runtimeGovernanceReplaySources)[number];

export interface AdminRuntimeActionPresetContract {
  action: AdminRuntimeActionKey;
  label: string;
  scenario: string;
  riskLevel: RuntimeGovernanceRiskLevel;
  nextStep: RuntimeGovernanceNextStep;
  recommendedAction: RuntimeGovernanceRecommendedAction;
  requestEndpoint: string;
  handlerName: string;
  replaySource: Extract<RuntimeGovernanceReplaySource, 'ADMIN_WEB_RUNTIME'>;
  payload: Record<string, unknown>;
}

export const adminRuntimeActionPresetContracts = [
  {
    action: 'runtime-replay',
    label: 'Runtime Replay',
    scenario: '运营台从 runtime backlog 发起统一 replay，并立即拿到可查询的真实 receipt。',
    riskLevel: 'high',
    nextStep: 'PROCEED',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
    handlerName: 'admin-runtime-replay-handler',
    replaySource: 'ADMIN_WEB_RUNTIME',
    payload: {
      sourceReceiptCode: 'ADMIN-WORKBENCH-RUNTIME-REPLAY-001',
      operatorNote: 'manual-runtime-follow-up'
    }
  },
  {
    action: 'approval-execution',
    label: 'Approval Execution',
    scenario: '总部总控台执行高风险审批前，先走统一 runtime submit，观察 challenge-issued 回执。',
    riskLevel: 'high',
    nextStep: 'CHALLENGE',
    recommendedAction: 'COMPLETE_CHALLENGE',
    requestEndpoint: '/api/v1/workbenches/approvals/execute',
    handlerName: 'admin-approval-execution-handler',
    replaySource: 'ADMIN_WEB_RUNTIME',
    payload: {
      approvalCode: 'APPROVAL-CODE-001',
      challengeProfile: 'step-up'
    }
  },
  {
    action: 'secret-rotation',
    label: 'Secret Rotation',
    scenario: '密钥轮换在 fallback 场景先走真实 runtime submit，保留 blocked 回执与刷新建议。',
    riskLevel: 'high',
    nextStep: 'REFRESH',
    recommendedAction: 'REFRESH_BOOTSTRAP',
    requestEndpoint: '/api/v1/foundation/configuration-governance/secrets/rotate',
    handlerName: 'admin-secret-rotation-handler',
    replaySource: 'ADMIN_WEB_RUNTIME',
    payload: {
      secretName: 'tenant-demo-openapi-secret',
      targetScope: 'tenant',
      rotationReason: 'manual-governance-rotation'
    }
  }
] as const satisfies readonly AdminRuntimeActionPresetContract[];

export const adminRuntimeActionPresetContractMap = adminRuntimeActionPresetContracts.reduce<
  Record<AdminRuntimeActionKey, AdminRuntimeActionPresetContract>
>(
  (accumulator, item) => {
    accumulator[item.action] = item;
    return accumulator;
  },
  {} as Record<AdminRuntimeActionKey, AdminRuntimeActionPresetContract>
);

export const runtimeGovernanceReplayEscalationActions = [
  'REFRESH_TICKET',
  'WAIT_CALLBACK',
  'OPEN_MANUAL_REVIEW'
] as const;

export type RuntimeGovernanceReplayEscalationAction = (typeof runtimeGovernanceReplayEscalationActions)[number];

export interface RuntimeGovernanceSubmitRequest {
  app: RuntimeGovernanceClientApp;
  action: RuntimeGovernanceActionKey;
  nextStep: RuntimeGovernanceNextStep;
  riskLevel: RuntimeGovernanceRiskLevel;
  requestEndpoint: string;
  payload: Record<string, unknown>;
  payloadSummary: string;
  recommendedAction: RuntimeGovernanceRecommendedAction;
  handlerName: string;
  idempotencyKey: string;
  actorId?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export interface RuntimeGovernanceSyncRequest {
  handlerName: string;
  ticketCode: string;
  idempotencyKey: string;
  actorId?: string;
  tenantId?: string;
}

export interface RuntimeGovernanceCallbackRequest {
  callbackStatus: RuntimeGovernanceCallbackStatus;
  ackToken: string;
  lastEvent: RuntimeGovernanceCallbackEvent;
  summary: string;
  idempotencyKey: string;
  actorId?: string;
  tenantId?: string;
}

export interface RuntimeGovernanceReplayRequest {
  ledgerKey: string;
  requestedFrom: RuntimeGovernanceReplaySource;
  ticketCode: string;
  idempotencyKey: string;
  actorId?: string;
  tenantId?: string;
}

export interface RuntimeGovernanceBatchReplayItem extends RuntimeGovernanceReplayRequest {
  receiptCode: string;
}

export interface RuntimeGovernanceBatchReplayRequest {
  items: RuntimeGovernanceBatchReplayItem[];
}

export interface RuntimeGovernanceBatchReplayResponse {
  generatedAt: string;
  total: number;
  items: Array<{
    receiptCode: string;
    receipt: RuntimeGovernanceReceipt;
  }>;
}

export interface RuntimeGovernanceOverviewFilter {
  focus?: 'all' | 'batch-replay' | 'governance-audit';
  state?: RuntimeGovernanceActionState;
  callbackStatus?: RuntimeGovernanceCallbackReceipt['callbackStatus'];
  riskLevel?: RuntimeGovernanceRiskLevel;
  replayable?: boolean;
  stalledOnly?: boolean;
}

export interface RuntimeGovernanceTicket {
  ticketCode: string;
  ticketType: 'BLOCK_GUARD' | 'CHALLENGE_GATE' | 'HANDLER_CALLBACK';
  status: 'waiting-prerequisite' | 'pending-challenge' | 'ready-for-handler';
  summary: string;
}

export interface RuntimeGovernanceSyncContract {
  handlerName: string;
  syncMode: 'deferred' | 'challenge-gated' | 'callback-followup';
  syncEndpoint: string;
  callbackEndpoint: string;
  idempotencyKey: string;
  ready: boolean;
  summary: string;
}

export interface RuntimeGovernanceCallbackReceipt {
  callbackStatus: RuntimeGovernanceCallbackReceiptStatus;
  ackToken: string;
  lastEvent: RuntimeGovernanceCallbackEvent;
  summary: string;
}

export interface RuntimeGovernanceLedgerRecord {
  ledgerKey: string;
  replayEndpoint: string;
  replayable: boolean;
  summary: string;
}

export interface RuntimeGovernanceReplayPolicy {
  replayEndpoint: string;
  retryable: boolean;
  maxAttempts: number;
  currentAttempt: number;
  nextBackoffMs: number;
  escalationAction: RuntimeGovernanceReplayEscalationAction;
  summary: string;
}

export interface RuntimeGovernanceCallbackStallStatus {
  stalled: boolean;
  timeoutMs: number;
  elapsedMs: number;
  exceededMs: number;
  escalationAction: RuntimeGovernanceCallbackStallEscalationAction;
  summary: string;
}

export interface RuntimeGovernanceCallbackStallDetail extends RuntimeGovernanceCallbackStallStatus {
  receiptCode: string;
  app: RuntimeGovernanceClientApp;
  action: RuntimeGovernanceActionKey;
  riskLevel: RuntimeGovernanceRiskLevel;
  handlerName: string;
  callbackStatus: RuntimeGovernanceCallbackReceiptStatus;
  replayable: boolean;
  scopeKey: string;
  latestEventType: string | null;
}

export function buildRuntimeGovernanceReplayEndpoint(receiptCode: string) {
  return `/api/v1/foundation/runtime-governance/actions/${receiptCode}/replay`;
}

export function createRuntimeGovernanceReplayPolicy(
  receiptCode: string,
  state: RuntimeGovernanceActionState
): RuntimeGovernanceReplayPolicy {
  if (state === 'submitted') {
    return {
      replayEndpoint: buildRuntimeGovernanceReplayEndpoint(receiptCode),
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: '等待 callback 回写，如失败则进入统一 replay。'
    };
  }

  if (state === 'challenge-issued') {
    return {
      replayEndpoint: buildRuntimeGovernanceReplayEndpoint(receiptCode),
      retryable: true,
      maxAttempts: 2,
      currentAttempt: 0,
      nextBackoffMs: 5000,
      escalationAction: 'REFRESH_TICKET',
      summary: '需先刷新 challenge ticket，再决定是否 replay。'
    };
  }

  return {
    replayEndpoint: buildRuntimeGovernanceReplayEndpoint(receiptCode),
    retryable: false,
    maxAttempts: 1,
    currentAttempt: 0,
    nextBackoffMs: 0,
    escalationAction: 'OPEN_MANUAL_REVIEW',
    summary: '当前动作仍被阻断，应转人工复核。'
  };
}

export function advanceRuntimeGovernanceReplayPolicy(
  policy: Pick<RuntimeGovernanceReplayPolicy, 'currentAttempt' | 'maxAttempts' | 'nextBackoffMs'>
) {
  const currentAttempt = Math.min(policy.currentAttempt + 1, policy.maxAttempts);
  const retryable = currentAttempt < policy.maxAttempts;

  return {
    currentAttempt,
    retryable,
    nextBackoffMs: retryable ? Math.max(policy.nextBackoffMs, 2000) + 2000 : 0,
    escalationAction: retryable ? ('WAIT_CALLBACK' as const) : ('OPEN_MANUAL_REVIEW' as const)
  };
}

export function evaluateRuntimeGovernanceCallbackStall(
  receipt: Pick<RuntimeGovernanceReceipt, 'riskLevel' | 'callback' | 'retry' | 'events'>,
  options?: { now?: string | Date; startedAt?: string | Date }
): RuntimeGovernanceCallbackStallStatus {
  const timeoutMs = runtimeGovernanceCallbackTimeoutThresholds[receipt.riskLevel];

  if (receipt.callback.callbackStatus !== 'awaiting-callback') {
    return {
      stalled: false,
      timeoutMs,
      elapsedMs: 0,
      exceededMs: 0,
      escalationAction: 'WAIT_CALLBACK',
      summary: 'callback 未处于等待状态。'
    };
  }

  const waitingEvent = [...receipt.events]
    .reverse()
    .find(
      (event) =>
        event.status === 'accepted' &&
        (event.eventType === 'runtime-governance.handler.sync.requested' ||
          event.eventType === 'runtime-governance.action.submitted')
    );
  const startedAt = options?.startedAt ?? waitingEvent?.occurredAt ?? receipt.events[receipt.events.length - 1]?.occurredAt;
  const nowMs = options?.now ? new Date(options.now).getTime() : Date.now();
  const startedMs = startedAt ? new Date(startedAt).getTime() : nowMs;
  const elapsedMs = Math.max(0, nowMs - startedMs);
  const stalled = elapsedMs >= timeoutMs;
  const exceededMs = stalled ? elapsedMs - timeoutMs : 0;
  const escalationAction = stalled
    ? receipt.retry.retryable
      ? 'SCHEDULE_REPLAY'
      : 'OPEN_MANUAL_REVIEW'
    : 'WAIT_CALLBACK';

  return {
    stalled,
    timeoutMs,
    elapsedMs,
    exceededMs,
    escalationAction,
    summary: stalled
      ? escalationAction === 'SCHEDULE_REPLAY'
        ? 'callback 超时未回写，建议进入 replay 补偿。'
        : 'callback 超时且已无自动重试空间，建议转人工复核。'
      : 'callback 仍在等待窗口内。'
  };
}

export function buildRuntimeGovernanceCallbackStallDetail(
  receipt: Pick<
    RuntimeGovernanceReceipt,
    'receiptCode' | 'app' | 'action' | 'riskLevel' | 'sync' | 'callback' | 'ledger' | 'rateLimit' | 'retry' | 'events'
  >,
  options?: { now?: string | Date; startedAt?: string | Date }
): RuntimeGovernanceCallbackStallDetail {
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

export interface RuntimeGovernanceRateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  scopeKey: string;
}

export interface RuntimeGovernanceEventRecord {
  eventType: string;
  status: 'accepted' | 'duplicate';
  idempotencyKey: string;
  occurredAt: string;
  summary: string;
}

export type RuntimeGovernanceApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export interface RuntimeGovernanceApprovalExecutionFailure {
  failureStatus: string | null;
  failureReason: string | null;
  failedAt: string | null;
  failedBy: string | null;
}

export interface RuntimeGovernanceApprovalExecution {
  attempts: number;
  executed: boolean;
  executionStatus: string | null;
  executedAt: string | null;
  executedBy: string | null;
  lastFailure: RuntimeGovernanceApprovalExecutionFailure | null;
}

export interface RuntimeGovernanceApproval {
  required: boolean;
  ticket: string | null;
  status: RuntimeGovernanceApprovalStatus;
  requestedBy: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  updatedAt: string | null;
  execution?: RuntimeGovernanceApprovalExecution;
  summary?: Record<string, unknown> | null;
}

export interface RuntimeGovernanceReceipt {
  receiptCode: string;
  app: RuntimeGovernanceClientApp;
  action: RuntimeGovernanceActionKey;
  state: RuntimeGovernanceActionState;
  nextStep: RuntimeGovernanceNextStep;
  riskLevel: RuntimeGovernanceRiskLevel;
  recommendedAction: RuntimeGovernanceRecommendedAction;
  requestEndpoint: string;
  payloadSummary: string;
  ticket: RuntimeGovernanceTicket;
  sync: RuntimeGovernanceSyncContract;
  callback: RuntimeGovernanceCallbackReceipt;
  ledger: RuntimeGovernanceLedgerRecord;
  retry: RuntimeGovernanceReplayPolicy;
  rateLimit: RuntimeGovernanceRateLimitDecision;
  approval?: RuntimeGovernanceApproval;
  events: RuntimeGovernanceEventRecord[];
  generatedAt: string;
}

export interface RuntimeGovernanceOperationsOverviewSummary {
  backlog: number;
  stalledCallbacks: number;
  highRiskBacklog: number;
  blockedActions: number;
}

export interface RuntimeGovernanceOperationsBatchSummary {
  filteredReceipts: number;
  replayableReceipts: number;
  governanceAuditReceipts: number;
  stalledReceipts: number;
  blockedReceipts: number;
  highRiskReceipts: number;
}

export interface RuntimeGovernanceOperationsOverview {
  generatedAt: string;
  appliedFilter: RuntimeGovernanceOverviewFilter;
  summary: RuntimeGovernanceOperationsOverviewSummary;
  totalSummary: RuntimeGovernanceOperationsOverviewSummary;
  receipts: RuntimeGovernanceReceipt[];
  stalledReceipts: RuntimeGovernanceCallbackStallDetail[];
  batchSummary: RuntimeGovernanceOperationsBatchSummary;
}

export interface FoundationOperationsAlert {
  severity: FoundationAlertSeverity;
  code: FoundationAlertCode;
  count: number;
  summary: string;
  acknowledgement?: FoundationAlertAcknowledgement | null;
  visibleInOverview?: boolean;
  availableActions?: FoundationAlertOperation[];
  recentOperation?: FoundationAlertTimelineEntry | null;
  triageState?: FoundationOperationsAlertTriageState;
  triageSummary?: string;
}

export interface FoundationOperationsOverviewSummary {
  approvalsPending: number;
  approvalsWithFailures: number;
  highRiskAudits: number;
  blockedLedgers: number;
  rotationDueSecrets: number;
  expiredSecrets: number;
  expiringCertificates: number;
  expiredCertificates: number;
  degradedSignals: number;
  attentionRecoveryPlans: number;
  staleDrills: number;
  runtimeGovernanceBacklog: number;
  stalledRuntimeCallbacks: number;
  highRiskRuntimeBacklog: number;
  runtimeBlockedActions: number;
}

export interface FoundationOperationsOverviewResponse {
  generatedAt: string;
  summary: FoundationOperationsOverviewSummary;
  alerts: FoundationOperationsAlert[];
  topRisks: FoundationOperationsAlert[];
  modules?: {
    runtimeGovernance?: RuntimeGovernanceOperationsOverview;
    [key: string]: unknown;
  };
}

export interface FoundationCapabilityDescriptor {
  key: string;
  name: string;
  responsibilities: string[];
  entrypoints: string[];
  consumers: FoundationConsumerKey[];
  status: 'planned' | 'skeleton' | 'active';
}

export interface FoundationModuleDescriptor {
  key: FoundationModuleKey;
  name: string;
  purpose: string;
  inboundContracts: string[];
  outboundContracts: string[];
  capabilities: FoundationCapabilityDescriptor[];
}

export interface FoundationConsumerDescriptor {
  consumer: FoundationConsumerKey;
  modulePath: string;
  dependsOn: FoundationModuleKey[];
  responsibility: string;
  handoffContracts: string[];
  recommendedSequence: string[];
  governanceTouchpoints: string[];
  highRiskEntrypoints: string[];
  actionGovernanceExamples: FoundationConsumerActionGovernanceExample[];
  runtimeHandoffExamples: FoundationConsumerRuntimeHandoffExample[];
  runtimeReceiptExamples: FoundationConsumerRuntimeReceiptExample[];
  governanceAlertLifecycleExamples: FoundationConsumerGovernanceAlertLifecycleExample[];
}

export interface FoundationConsumerActionGovernanceExample {
  surface: RuntimeGovernanceClientApp;
  action: RuntimeGovernanceActionKey;
  scenario: string;
  riskLevel: 'low' | 'medium' | 'high';
  bootstrapState: FoundationFrontendBootstrapState;
  nextStep: RuntimeGovernanceNextStep;
  submitState: RuntimeGovernanceActionState;
  requestEndpoint: string;
}

export interface FoundationConsumerRuntimeHandoffExample {
  surface: RuntimeGovernanceClientApp;
  action: RuntimeGovernanceActionKey;
  scenario: string;
  ticketType: RuntimeGovernanceTicket['ticketType'];
  ticketStatus: RuntimeGovernanceTicket['status'];
  handlerName: string;
  syncMode: RuntimeGovernanceSyncContract['syncMode'];
  syncEndpoint: string;
  callbackStatus: RuntimeGovernanceCallbackReceipt['callbackStatus'];
  callbackEndpoint: string;
  replayStatus: 'replay-scheduled' | 'replay-blocked' | 'replay-skipped';
  replayEndpoint: string;
  retryEscalationAction: RuntimeGovernanceReplayPolicy['escalationAction'];
}

export interface FoundationConsumerRuntimeReceiptExample {
  surface: RuntimeGovernanceClientApp;
  action: RuntimeGovernanceActionKey;
  scenario: string;
  mode: 'api-first-submit' | 'fallback-replay' | 'fallback-callback';
  receiptState: RuntimeGovernanceActionState;
  generatedAtSource: 'api' | 'local-fallback';
  requestEndpoint: string;
  runtimeEndpoint: string;
  callbackStatus: RuntimeGovernanceCallbackReceipt['callbackStatus'];
  replayable: boolean;
  rateLimitScopeKey: string;
  latestEventType: string;
}

export interface FoundationConsumerGovernanceAlertLifecycleExample {
  surface: RuntimeGovernanceClientApp;
  alertCode: FoundationAlertCode;
  stage: 'drilldown' | 'ack' | 'mute' | 'unmute';
  scenario: string;
  endpoint: string;
  latestHistoryAction: FoundationAlertMutationKind;
  acknowledgementStatus: FoundationAlertAcknowledgementStatus | null;
  visibleInOverview: boolean;
  availableActions: FoundationAlertOperation[];
}

const adminApprovalExecutionPreset = adminRuntimeActionPresetContractMap['approval-execution'];
const adminSecretRotationPreset = adminRuntimeActionPresetContractMap['secret-rotation'];
const adminRuntimeReplayPreset = adminRuntimeActionPresetContractMap['runtime-replay'];

export const adminWorkbenchConsumerDescriptor: FoundationConsumerDescriptor = {
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
  highRiskEntrypoints: [...adminRuntimeActionKeys],
  actionGovernanceExamples: [
    {
      surface: 'admin-web',
      action: adminApprovalExecutionPreset.action,
      scenario: '总部总控台执行高风险审批前必须完成 step-up challenge，禁止前端直接跳过挑战放行动作。',
      riskLevel: adminApprovalExecutionPreset.riskLevel,
      bootstrapState: 'challenge-required',
      nextStep: adminApprovalExecutionPreset.nextStep,
      submitState: 'challenge-issued',
      requestEndpoint: adminApprovalExecutionPreset.requestEndpoint
    },
    {
      surface: 'admin-web',
      action: adminSecretRotationPreset.action,
      scenario: '治理读面处于 fallback 时，密钥轮换必须先刷新 foundation bootstrap，避免用旧配置直接轮换。',
      riskLevel: adminSecretRotationPreset.riskLevel,
      bootstrapState: 'readonly-fallback',
      nextStep: adminSecretRotationPreset.nextStep,
      submitState: 'blocked',
      requestEndpoint: adminSecretRotationPreset.requestEndpoint
    },
    {
      surface: 'admin-web',
      action: adminRuntimeReplayPreset.action,
      scenario: '运营台从 runtime backlog drilldown 发起 replay 时，tenant scope 已就绪即可直接提交统一 replay 请求。',
      riskLevel: adminRuntimeReplayPreset.riskLevel,
      bootstrapState: 'ready',
      nextStep: adminRuntimeReplayPreset.nextStep,
      submitState: 'submitted',
      requestEndpoint: adminRuntimeReplayPreset.requestEndpoint
    }
  ],
  runtimeHandoffExamples: [
    {
      surface: 'admin-web',
      action: adminApprovalExecutionPreset.action,
      scenario: '审批执行命中高风险时保留 challenge gate，必须等待人工完成挑战后再继续执行。',
      ticketType: 'CHALLENGE_GATE',
      ticketStatus: 'pending-challenge',
      handlerName: adminApprovalExecutionPreset.handlerName,
      syncMode: 'challenge-gated',
      syncEndpoint: `/api/v1/workbenches/handlers/${adminApprovalExecutionPreset.handlerName}/sync`,
      callbackStatus: 'callback-blocked',
      callbackEndpoint: '/api/v1/workbenches/handlers/admin-approval-execution-handler/callbacks/ADMIN-APPROVAL-EXECUTION-CHALLENGE',
      replayStatus: 'replay-blocked',
      replayEndpoint: '/api/v1/workbenches/actions/ADMIN-APPROVAL-EXECUTION-CHALLENGE/replay',
      retryEscalationAction: 'REFRESH_TICKET'
    },
    {
      surface: 'admin-web',
      action: adminSecretRotationPreset.action,
      scenario: '密钥轮换处于只读 fallback 时先保留 block guard，不进入 handler callback，转运维人工复核。',
      ticketType: 'BLOCK_GUARD',
      ticketStatus: 'waiting-prerequisite',
      handlerName: adminSecretRotationPreset.handlerName,
      syncMode: 'deferred',
      syncEndpoint: `/api/v1/workbenches/handlers/${adminSecretRotationPreset.handlerName}/sync`,
      callbackStatus: 'callback-blocked',
      callbackEndpoint: '/api/v1/workbenches/handlers/admin-secret-rotation-handler/callbacks/ADMIN-SECRET-ROTATION-BLOCKED',
      replayStatus: 'replay-skipped',
      replayEndpoint: '/api/v1/workbenches/actions/ADMIN-SECRET-ROTATION-BLOCKED/replay',
      retryEscalationAction: 'OPEN_MANUAL_REVIEW'
    },
    {
      surface: 'admin-web',
      action: adminRuntimeReplayPreset.action,
      scenario: '运营台从 backlog 发起统一 replay 后进入 handler follow-up，继续等待 callback 与后续人工确认。',
      ticketType: 'HANDLER_CALLBACK',
      ticketStatus: 'ready-for-handler',
      handlerName: adminRuntimeReplayPreset.handlerName,
      syncMode: 'callback-followup',
      syncEndpoint: `/api/v1/workbenches/handlers/${adminRuntimeReplayPreset.handlerName}/sync`,
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
      action: adminApprovalExecutionPreset.action,
      scenario: '审批执行会优先走 runtime governance submit API，并返回 challenge-issued receipt 供运营台继续追踪。',
      mode: 'api-first-submit',
      receiptState: 'challenge-issued',
      generatedAtSource: 'api',
      requestEndpoint: adminApprovalExecutionPreset.requestEndpoint,
      runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions',
      callbackStatus: 'callback-blocked',
      replayable: true,
      rateLimitScopeKey: 'admin-web:approval-execution:tenant-demo',
      latestEventType: 'runtime-governance.action.submitted'
    },
    {
      surface: 'admin-web',
      action: adminRuntimeReplayPreset.action,
      scenario: '运营台 runtime replay 优先提交到统一 runtime API，并立即生成 submitted receipt。',
      mode: 'api-first-submit',
      receiptState: 'submitted',
      generatedAtSource: 'api',
      requestEndpoint: adminRuntimeReplayPreset.requestEndpoint,
      runtimeEndpoint: adminRuntimeReplayPreset.requestEndpoint,
      callbackStatus: 'awaiting-callback',
      replayable: true,
      rateLimitScopeKey: 'admin-web:runtime-replay:tenant-demo',
      latestEventType: 'runtime-governance.action.submitted'
    },
    {
      surface: 'admin-web',
      action: adminRuntimeReplayPreset.action,
      scenario: '运营台 fallback 下重放 receipt 会先标记为 replay-scheduled，并等待统一 callback 回写。',
      mode: 'fallback-replay',
      receiptState: 'replay-scheduled',
      generatedAtSource: 'local-fallback',
      requestEndpoint: adminRuntimeReplayPreset.requestEndpoint,
      runtimeEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WORKBENCH-RUNTIME-REPLAY-001/replay',
      callbackStatus: 'awaiting-callback',
      replayable: true,
      rateLimitScopeKey: 'admin-web:runtime-replay:tenant-demo',
      latestEventType: 'runtime-governance.receipt.replay.scheduled'
    },
    {
      surface: 'admin-web',
      action: adminApprovalExecutionPreset.action,
      scenario: '审批执行在 fallback challenge 回写后，会把 receipt 推进到 callback-recorded 以保留运营留痕。',
      mode: 'fallback-callback',
      receiptState: 'callback-recorded',
      generatedAtSource: 'local-fallback',
      requestEndpoint: adminApprovalExecutionPreset.requestEndpoint,
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
};

export interface FoundationGovernanceBaseline {
  key: string;
  name: string;
  ownerModule: FoundationModuleKey;
  summary: string;
  controls: string[];
  evidence: string[];
}

export interface FoundationBlueprint {
  generatedAt: string;
  docs: string[];
  guardrails: string[];
  frontendBootstrap: UnifiedFoundationBootstrapContract;
  modules: FoundationModuleDescriptor[];
  consumers: FoundationConsumerDescriptor[];
  governanceBaselines: FoundationGovernanceBaseline[];
}

export type FoundationOperationsAlertTriageState = 'needs-triage' | 'acknowledged' | 'muted' | 'expired-mute';

export type FoundationFrontendBootstrapState =
  | 'bootstrapping'
  | 'ready'
  | 'readonly-fallback'
  | 'challenge-required'
  | 'scope-mismatch';

export type FoundationSupportedClient = 'PC' | 'PAD' | 'H5' | 'MINIAPP' | 'APP';

export const foundationSupportedClients = ['PC', 'PAD', 'H5', 'MINIAPP', 'APP'] as const satisfies readonly FoundationSupportedClient[];

export const foundationAlertCatalogFallback: FoundationAlertCatalogItem[] = [
  {
    code: 'approvals-pending',
    defaultSummary: '存在待处理审批单',
    severityPolicy: '待处理审批单数量 >= 5 时为 high，否则为 medium',
    sourceModules: ['trust-governance', 'configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
    ackPath: '/foundation/overview/alerts/approvals-pending/ack',
    mutePath: '/foundation/overview/alerts/approvals-pending/mute',
    unmutePath: '/foundation/overview/alerts/approvals-pending/unmute'
  },
  {
    code: 'approval-execution-failures',
    defaultSummary: '存在执行失败且待人工确认的审批单',
    severityPolicy: '只要存在即为 high',
    sourceModules: ['trust-governance', 'configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/approval-execution-failures/drilldown',
    ackPath: '/foundation/overview/alerts/approval-execution-failures/ack',
    mutePath: '/foundation/overview/alerts/approval-execution-failures/mute',
    unmutePath: '/foundation/overview/alerts/approval-execution-failures/unmute'
  },
  {
    code: 'high-risk-audits',
    defaultSummary: '存在高风险治理审计事件',
    severityPolicy: '高风险审计数量 >= 5 时为 high，否则为 medium',
    sourceModules: ['trust-governance', 'configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/high-risk-audits/drilldown',
    ackPath: '/foundation/overview/alerts/high-risk-audits/ack',
    mutePath: '/foundation/overview/alerts/high-risk-audits/mute',
    unmutePath: '/foundation/overview/alerts/high-risk-audits/unmute'
  },
  {
    code: 'blocked-rate-limit-ledgers',
    defaultSummary: '存在被封禁中的配额账本',
    severityPolicy: '只要存在即为 medium',
    sourceModules: ['trust-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/blocked-rate-limit-ledgers/drilldown',
    ackPath: '/foundation/overview/alerts/blocked-rate-limit-ledgers/ack',
    mutePath: '/foundation/overview/alerts/blocked-rate-limit-ledgers/mute',
    unmutePath: '/foundation/overview/alerts/blocked-rate-limit-ledgers/unmute'
  },
  {
    code: 'secret-rotation-attention',
    defaultSummary: '存在需要轮换或已过期的密钥',
    severityPolicy: '存在 expired secret 时为 high，否则为 medium',
    sourceModules: ['configuration-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/secret-rotation-attention/drilldown',
    ackPath: '/foundation/overview/alerts/secret-rotation-attention/ack',
    mutePath: '/foundation/overview/alerts/secret-rotation-attention/mute',
    unmutePath: '/foundation/overview/alerts/secret-rotation-attention/unmute'
  },
  {
    code: 'observability-degradation',
    defaultSummary: '存在异常的 metrics/logs/traces 信号',
    severityPolicy: 'critical 信号存在时为 high，否则为 medium',
    sourceModules: ['resilience-operations'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
    ackPath: '/foundation/overview/alerts/observability-degradation/ack',
    mutePath: '/foundation/overview/alerts/observability-degradation/mute',
    unmutePath: '/foundation/overview/alerts/observability-degradation/unmute'
  },
  {
    code: 'recovery-drill-attention',
    defaultSummary: '存在待补演练或恢复预案关注项',
    severityPolicy: 'attention 或 staleDrills > 0 时为 medium',
    sourceModules: ['resilience-operations'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/recovery-drill-attention/drilldown',
    ackPath: '/foundation/overview/alerts/recovery-drill-attention/ack',
    mutePath: '/foundation/overview/alerts/recovery-drill-attention/mute',
    unmutePath: '/foundation/overview/alerts/recovery-drill-attention/unmute'
  },
  {
    code: 'runtime-governance-backlog',
    defaultSummary: '存在待持续跟进的 runtime governance receipt',
    severityPolicy: '存在 high risk backlog 或 backlog >= 5 时为 high，否则为 medium',
    sourceModules: ['runtime-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/runtime-governance-backlog/drilldown',
    ackPath: '/foundation/overview/alerts/runtime-governance-backlog/ack',
    mutePath: '/foundation/overview/alerts/runtime-governance-backlog/mute',
    unmutePath: '/foundation/overview/alerts/runtime-governance-backlog/unmute'
  },
  {
    code: 'runtime-callback-stalled',
    defaultSummary: '存在等待 callback 回写的 runtime receipt',
    severityPolicy: '只要存在等待 callback 的 receipt 即为 high',
    sourceModules: ['runtime-governance'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/runtime-callback-stalled/drilldown',
    ackPath: '/foundation/overview/alerts/runtime-callback-stalled/ack',
    mutePath: '/foundation/overview/alerts/runtime-callback-stalled/mute',
    unmutePath: '/foundation/overview/alerts/runtime-callback-stalled/unmute'
  },
  {
    code: 'lyt-connection-governance-risk',
    defaultSummary: '存在 LYT 门店连接治理风险',
    severityPolicy: '存在 high severity LYT 治理告警时为 high，否则为 medium',
    sourceModules: ['integration-orchestration'],
    drilldownEnabled: true,
    acknowledgementEnabled: true,
    drilldownPath: '/foundation/overview/alerts/lyt-connection-governance-risk/drilldown',
    ackPath: '/foundation/overview/alerts/lyt-connection-governance-risk/ack',
    mutePath: '/foundation/overview/alerts/lyt-connection-governance-risk/mute',
    unmutePath: '/foundation/overview/alerts/lyt-connection-governance-risk/unmute'
  }
];

export interface MarketProfileContract {
  marketCode: string;
  marketName: string;
  countryCode: string;
  locale: { defaultLanguage: string; supportedLanguages: string[] };
  timezone: { timezone: string };
  currency: { currencyCode: string; symbol: string };
  tax: { taxMode: string; taxRate: number; taxLabel: string };
  network: { networkRegion: string; apiBaseUrl: string; cdnBaseUrl: string; callbackBaseUrl: string };
  email: { provider: string; fromName: string; fromAddress: string; replyTo: string };
  social: { primaryPlatforms: string[]; supportPlatforms: string[] };
}

export interface RegionalConfigOverrideContract {
  scopeType: string;
  scopeCode: string;
  inheritanceMode: string;
  marketCode: string;
  locale?: { defaultLanguage?: string; supportedLanguages?: string[] };
  timezone?: { timezone?: string };
  currency?: { currencyCode?: string; symbol?: string };
  tax?: { taxMode?: string; taxRate?: number; taxLabel?: string };
  network?: { networkRegion?: string; apiBaseUrl?: string; cdnBaseUrl?: string; callbackBaseUrl?: string };
  email?: { provider?: string; fromName?: string; fromAddress?: string; replyTo?: string };
  social?: { primaryPlatforms?: string[]; supportPlatforms?: string[] };
}

export interface MarketBootstrapResponse extends BootstrapFoundationMetadataContract {
  defaultDomesticMarketCode: string;
  defaultInternationalMarketCode: string;
  supportedMarkets: MarketProfileContract[];
}

export interface BootstrapFoundationMetadataContract {
  foundationDependencies: FoundationModuleKey[];
  foundationContracts: string[];
}

export interface PortalLoginEntryContract {
  label: string;
  loginPath: string;
  ssoEnabled: boolean;
}

export interface TobPortalContract {
  audience: string;
  scopeType: string;
  scopeCode: string;
  tenantCode: string;
  brandCode?: string;
  marketCode: string;
  channel: string;
  name: string;
  primaryDomain: string;
  domainSource: 'custom' | 'default';
  supportedLanguages: string[];
  heroTitle: string;
  heroSubtitle: string;
  solutionTags: string[];
  loginEntry: PortalLoginEntryContract;
}

export interface StorePortalContract {
  audience: string;
  scopeType: string;
  scopeCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
  storeName: string;
  marketCode: string;
  channel: string;
  name: string;
  primaryDomain: string;
  domainSource: 'custom' | 'default';
  supportedLanguages: string[];
  supportedSurfaces: string[];
}

export interface PortalBootstrapResponse extends BootstrapFoundationMetadataContract {
  tenantPortal: TobPortalContract;
  brandPortal: TobPortalContract;
  storePortal: StorePortalContract;
  marketProfile: MarketProfileContract;
  regionalOverrides: RegionalConfigOverrideContract[];
}

export interface PortalDomainGovernanceScopeSummaryContract {
  scopeType: string;
  tenantId: string;
  brandId?: string;
  storeId?: string;
  activeDomainCount: number;
  missingPrimary: boolean;
  currentPrimaryDomain?: string | null;
  recommendedDomain?: string | null;
  recommendationReason?: string;
}

export interface PortalDomainGovernanceSummaryContract {
  totalMissingPrimaryScopes: number;
  totalActiveWithoutPrimaryDomains: number;
  recommendedReadyScopes: number;
  tenantMissingPrimaryScopes: number;
  brandMissingPrimaryScopes: number;
  storeMissingPrimaryScopes: number;
  requiresAttention: boolean;
  lastEvaluatedAt: string;
  currentScopes: PortalDomainGovernanceScopeSummaryContract[];
}

export interface DomainGovernanceWorkspaceQuery {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
  scopeType?: string;
}

export function selectDomainGovernanceFocusScope(
  summary: PortalDomainGovernanceSummaryContract,
): PortalDomainGovernanceScopeSummaryContract | undefined {
  return (
    summary.currentScopes.find((item) => item.missingPrimary) ??
    summary.currentScopes.find((item) => item.scopeType === 'STORE') ??
    summary.currentScopes.find((item) => item.scopeType === 'BRAND') ??
    summary.currentScopes[0]
  );
}

export function buildDomainGovernanceHref(query: DomainGovernanceWorkspaceQuery = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return queryString ? `/saas/domains?${queryString}` : '/saas/domains';
}

export function buildDomainGovernanceWorkspaceHref(
  summary: PortalDomainGovernanceSummaryContract,
  marketCode: string,
): string {
  const scope = selectDomainGovernanceFocusScope(summary);

  return buildDomainGovernanceHref({
    tenantId: scope?.tenantId,
    brandId: scope?.brandId,
    storeId: scope?.storeId,
    marketCode,
    scopeType: scope?.scopeType,
  });
}

export function getDomainGovernanceAttentionLabel(
  summary: PortalDomainGovernanceSummaryContract,
): '待治理' | '已对齐' {
  return summary.requiresAttention ? '待治理' : '已对齐';
}

export function formatDomainGovernanceCountsSummary(
  summary: PortalDomainGovernanceSummaryContract,
): string {
  return `缺主 scope ${summary.totalMissingPrimaryScopes} / 活跃未设主域名 ${summary.totalActiveWithoutPrimaryDomains}`;
}

export function formatDomainGovernanceSourceSummary(
  domainSource: string,
  summary: PortalDomainGovernanceSummaryContract,
): string {
  return `域名来源 ${domainSource} / 可直接补选 ${summary.recommendedReadyScopes}`;
}

export interface WorkbenchNavItemContract {
  key: string;
  label: string;
  href: string;
  description: string;
}

export interface RoleWorkbenchContract {
  role: string;
  channel: string;
  title: string;
  description: string;
  marketCodes: string[];
  navItems: WorkbenchNavItemContract[];
}

export const defaultRoleWorkbenchContracts: RoleWorkbenchContract[] = [
  {
    role: 'SUPER_ADMIN',
    channel: 'PC',
    title: '总部总控台',
    description: '平台级租户、审计、安全和全局基础设施入口。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'tenants', label: '租户管理', href: '/workbench/super_admin', description: '租户开通、关停和能力授权' },
      { key: 'foundation', label: 'Foundation 总览', href: '/foundation', description: '模块目录、治理基线与消费者依赖总览' },
      { key: 'identity-access', label: '身份与授权', href: '/identity-access', description: 'Actor 上下文、角色、权限与租户边界校验' },
      { key: 'configuration', label: '配置治理', href: '/configuration', description: '功能开关、配置项、密钥、证书与审批' },
      { key: 'resilience', label: '强韧性作战台', href: '/resilience', description: '可观测信号、重试策略与恢复计划' },
      { key: 'rate-limits', label: '限流与配额', href: '/rate-limits', description: '租户级与平台级限流策略、配额账本' },
      { key: 'integration-orchestration', label: '集成编排', href: '/integration-orchestration', description: 'Webhook 来源、事件信封与幂等编排总览' },
      { key: 'audit', label: '审计中心', href: '/audit-trail', description: '全局日志、风控与可疑行为' },
      { key: 'markets', label: '国际化治理', href: '/workbench/super_admin', description: '市场默认值、网络区、邮箱与税务策略' }
    ]
  },
  {
    role: 'TENANT_ADMIN',
    channel: 'PC',
    title: '租户经营台',
    description: '品牌矩阵、门店网络、渠道编排和目标管理入口。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'brands', label: '品牌矩阵', href: '/workbench/tenant_admin', description: '品牌开通与会员互通配置' },
      { key: 'channels', label: '渠道编排', href: '/workbench/tenant_admin', description: '官网、H5、小程序、App、Pad 能力开关' },
      { key: 'foundation', label: 'Foundation 总览', href: '/foundation', description: '模块目录、治理基线与消费者依赖总览' },
      { key: 'identity-access', label: '身份与授权', href: '/identity-access', description: '租户级角色、权限与租户隔离校验' },
      { key: 'configuration', label: '配置治理', href: '/configuration', description: '租户级功能开关、配置项、密钥与审批' },
      { key: 'resilience', label: '强韧性作战台', href: '/resilience', description: '租户级可观测信号、重试与恢复' },
      { key: 'rate-limits', label: '限流与配额', href: '/rate-limits', description: '租户级限流策略、配额账本' },
      { key: 'integration-orchestration', label: '集成编排', href: '/integration-orchestration', description: 'Webhook、事件出库与幂等编排' },
      { key: 'tob', label: '租户 ToB 官网', href: '/workbench/tenant_admin', description: '租户营销官网、登录入口和域名策略' },
      { key: 'regional', label: '国际化配置', href: '/workbench/tenant_admin', description: '国家、语言、时区、税务、网络和社媒覆盖策略' }
    ]
  },
  {
    role: 'BRAND_MANAGER',
    channel: 'PC',
    title: '品牌经营台',
    description: '品牌活动、会员分层、商品服务、品牌 ToB 官网与区域化投放。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'members', label: '会员运营', href: '/workbench/brand_manager', description: '等级、积分、SVIP 和券策略' },
      { key: 'campaigns', label: '营销投放', href: '/workbench/brand_manager', description: '官网 / H5 / 小程序 / App 联动' },
      { key: 'brandPortal', label: '品牌 ToB 官网', href: '/workbench/brand_manager', description: '品牌招商、加盟合作和品牌登录入口' },
      { key: 'marketPolicy', label: '市场与本地化', href: '/workbench/brand_manager', description: '品牌级国家、语言、税务和社媒覆盖配置' }
    ]
  },
  {
    role: 'STORE_MANAGER',
    channel: 'PC',
    title: '店长经营台',
    description: '门店日运营、预约排队、活动执行和日报。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'daily', label: '门店日报', href: '/workbench/store_manager', description: '营收、客流和异常预警' },
      { key: 'service', label: '现场调度', href: '/workbench/store_manager', description: '排班、预约、排队和现场资源' }
    ]
  },
  {
    role: 'GUIDE',
    channel: 'PAD',
    title: '导购工作台',
    description: '客户接待、会员推荐、裂变推广与线索跟进。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'crm', label: '会员接待', href: '/workbench/guide', description: '画像、标签、推荐和回访' },
      { key: 'promo', label: '推广转化', href: '/workbench/guide', description: '推广码、活动分享与线索转化' }
    ]
  },
  {
    role: 'CASHIER',
    channel: 'PAD',
    title: '收银台',
    description: '收银、核销、储值、退款和弱网离线兜底。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'checkout', label: '收银核销', href: '/workbench/cashier', description: '订单、积分、券和盲盒支付' },
      { key: 'offline', label: '离线模式', href: '/workbench/cashier', description: '弱网同步和离线容错' }
    ]
  },
  {
    role: 'OPERATIONS',
    channel: 'PC',
    title: '运营作战台',
    description: '平台与租户级运营事件的统一治理：任务分派、回执跟踪、告警 triage、集成编排与基础设施工单。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'operations', label: '运营回执', href: '/operations', description: 'Runtime 运营回执统一收口与复盘' },
      { key: 'tasks', label: '任务分派', href: '/members', description: '会员任务分派、跟踪与逾期告警' },
      { key: 'approvals', label: '治理审批', href: '/approvals', description: '跨租户 / 平台级高风险审批单' },
      { key: 'alerts', label: '告警 triage', href: '/alerts', description: '告警分诊、抑制与升级' },
      { key: 'integration', label: '集成编排', href: '/integration-orchestration', description: 'Webhook 来源、事件信封与幂等编排' },
      { key: 'resilience', label: '强韧性作战', href: '/resilience', description: '可观测信号、重试策略与恢复计划' },
      { key: 'audit', label: '审计中心', href: '/audit-trail', description: '运营动作留痕与可疑行为回放' }
    ]
  },
  {
    role: 'FINANCE',
    channel: 'PC',
    title: '财务结算台',
    description: '收单、对账、退款、储值余额、税务和限流配额的财务运营总览。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'rate-limits', label: '限流与配额', href: '/rate-limits', description: '租户级与平台级限流策略、配额账本' },
      { key: 'configuration', label: '配置治理', href: '/configuration', description: '税务、币种、汇率等配置中心接入' },
      { key: 'audit', label: '审计中心', href: '/audit-trail', description: '财务动作留痕、交易回放与风控审计' },
      { key: 'resilience', label: '强韧性作战', href: '/resilience', description: '对账失败重试、回收计划与异常信号' }
    ]
  },
  {
    role: 'WAREHOUSE',
    channel: 'PC',
    title: '仓储调度台',
    description: '库存盘点、出入库、调拨、损耗和门店日报的仓储运营总览。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'stores', label: '门店网络', href: '/stores', description: '门店日报、库存水位与异常预警' },
      { key: 'brands', label: '品牌矩阵', href: '/brands', description: '品牌库存总览与跨店调拨策略' },
      { key: 'tenants', label: '租户管理', href: '/tenants', description: '租户级仓储域、跨租户调拨' },
      { key: 'operations', label: '运营回执', href: '/operations', description: '出入库回执、损耗复盘与运营复盘' },
      { key: 'audit', label: '审计中心', href: '/audit-trail', description: '仓储动作留痕与异常审计' }
    ]
  },
  {
    role: 'COACH',
    channel: 'PAD',
    title: '教练工作台',
    description: '私教会员接待、课程排期、训练计划、考勤打卡与裂变推广。',
    marketCodes: ['cn-mainland', 'us-default'],
    navItems: [
      { key: 'crm', label: '会员接待', href: '/members', description: '私教会员画像、标签与回访' },
      { key: 'promo', label: '推广转化', href: '/members', description: '推广码、活动分享与线索转化' },
      { key: 'operations', label: '运营回执', href: '/operations', description: '课程预约、签到、考勤回执' },
      { key: 'audit', label: '审计中心', href: '/audit-trail', description: '教练动作留痕与会员隐私审计' }
    ]
  }
];

export const defaultRoleWorkbenchContractMap: Record<string, RoleWorkbenchContract> = Object.fromEntries(
  defaultRoleWorkbenchContracts.map((item) => [item.role.toLowerCase(), item])
);

// ============ 角色命名映射 (P1-3) ============

/**
 * 前端 Workbench 角色 (大写下划线) → 后端 tenant-config 角色 (蛇形)
 *
 * 后端 ROLE_LEVEL_ACCESS 使用小写蛇形:
 *   super_admin / brand_admin / tenant_admin / store_admin / operator / viewer / auditor
 * 前端 defaultRoleWorkbenchContracts 使用大写下划线:
 *   SUPER_ADMIN / BRAND_MANAGER / TENANT_ADMIN / STORE_MANAGER / OPERATIONS / VIEWER / AUDITOR
 * (GUIDE / CASHIER / WAREHOUSE / FINANCE / COACH 等暂未在 tenant-config 中使用)
 */
export const FRONTEND_TO_BACKEND_ROLE: Record<string, string> = {
  SUPER_ADMIN: 'super_admin',
  BRAND_MANAGER: 'brand_admin',
  TENANT_ADMIN: 'tenant_admin',
  STORE_MANAGER: 'store_admin',
  OPERATIONS: 'operator',
  VIEWER: 'viewer',
  AUDITOR: 'auditor',
  GUIDE: 'operator',
  CASHIER: 'operator',
  WAREHOUSE: 'operator',
  FINANCE: 'operator',
  COACH: 'operator',
};

/** 后端角色枚举 (与后端 ROLE_LEVEL_ACCESS key 对齐) */
export type BackendTenantRole =
  | 'super_admin' | 'brand_admin' | 'tenant_admin'
  | 'store_admin' | 'operator' | 'viewer' | 'auditor';

/** 前端 Workbench 角色 (与 defaultRoleWorkbenchContracts 对齐) */
export type FrontendWorkbenchRole =
  | 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'BRAND_MANAGER' | 'STORE_MANAGER'
  | 'GUIDE' | 'CASHIER' | 'OPERATIONS' | 'FINANCE' | 'WAREHOUSE' | 'COACH';

/** 角色映射工具: 把前端 Workbench role 转成后端 tenant-config role */
export function mapToBackendRole(frontendRole: string): BackendTenantRole | undefined {
  const normalized = frontendRole.trim().toUpperCase();
  return FRONTEND_TO_BACKEND_ROLE[normalized] as BackendTenantRole | undefined;
}

export interface TenantContextContract {
  tenantId: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export const memberLevelContracts = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;

export type MemberLevelContract = (typeof memberLevelContracts)[number];

export const memberStatusContracts = ['ACTIVE', 'FROZEN', 'EXPIRED', 'BLACKLISTED'] as const;

export type MemberStatusContract = (typeof memberStatusContracts)[number];

export const memberLifecycleStageContracts = ['prospect', 'newly-paid', 'repeat-paid', 'vip-active'] as const;

export type MemberLifecycleStageContract = (typeof memberLifecycleStageContracts)[number];

export const memberDataSourceContracts = ['memory', 'prisma'] as const;

export type MemberDataSourceContract = (typeof memberDataSourceContracts)[number];

export const memberOperationsActionCodeContracts = [
  'complete-member-onboarding',
  'send-post-payment-welcome',
  'issue-bounce-back-coupon',
  'recommend-repeat-purchase-bundle',
  'invite-loyalty-challenge',
  'assign-vip-concierge',
  'push-new-arrival-preview',
  'deliver-channel-follow-up'
] as const;

export type MemberOperationsActionCodeContract = (typeof memberOperationsActionCodeContracts)[number];

export const memberOperationsActionChannelContracts = ['coupon', 'crm-task', 'wechat', 'app-push'] as const;

export type MemberOperationsActionChannelContract = (typeof memberOperationsActionChannelContracts)[number];

export const memberOperationsPriorityContracts = ['high', 'medium', 'low'] as const;

export type MemberOperationsPriorityContract = (typeof memberOperationsPriorityContracts)[number];

export const memberAutomationTriggerCodeContracts = [
  'payment-success-journey',
  'newly-paid-bounce-back',
  'repeat-paid-retention',
  'vip-service-upgrade',
  'channel-retouch'
] as const;

export type MemberAutomationTriggerCodeContract = (typeof memberAutomationTriggerCodeContracts)[number];

export const memberAutomationTriggerStatusContracts = ['ready', 'watch'] as const;

export type MemberAutomationTriggerStatusContract = (typeof memberAutomationTriggerStatusContracts)[number];

export const memberAutomationTriggerSourceContracts = ['payment-success', 'lifecycle', 'tag'] as const;

export type MemberAutomationTriggerSourceContract = (typeof memberAutomationTriggerSourceContracts)[number];

export const memberOperationsTaskStatusContracts = ['queued', 'dispatched', 'completed'] as const;

export type MemberOperationsTaskStatusContract = (typeof memberOperationsTaskStatusContracts)[number];

export const memberOperationsExecutionLaneContracts = [
  'campaign-execution',
  'member-crm',
  'promo-conversion'
] as const;

export type MemberOperationsExecutionLaneContract = (typeof memberOperationsExecutionLaneContracts)[number];

export const memberOperationsTaskSourceContracts = ['payment-success', 'manual-refresh'] as const;

export type MemberOperationsTaskSourceContract = (typeof memberOperationsTaskSourceContracts)[number];

export const memberOperationsReceiptTargetTypeContracts = ['coupon-offer', 'crm-follow-up'] as const;

export type MemberOperationsReceiptTargetTypeContract = (typeof memberOperationsReceiptTargetTypeContracts)[number];

export const memberOperationsReceiptStatusContracts = ['completed'] as const;

export type MemberOperationsReceiptStatusContract = (typeof memberOperationsReceiptStatusContracts)[number];

export const memberOperationsRuntimeStateContracts = [
  'blocked',
  'challenge-issued',
  'submitted',
  'callback-recorded',
  'replay-scheduled'
] as const;

export type MemberOperationsRuntimeStateContract = (typeof memberOperationsRuntimeStateContracts)[number];

export interface MemberProfileContract {
  memberId: string;
  userId?: string;
  tenantContext: TenantContextContract;
  mobile?: string;
  nickname: string;
  email?: string;
  address?: string;
  notes?: string;
  level: MemberLevelContract;
  status: MemberStatusContract;
  points: number;
  growthValue?: number;
  svipStatus?: string;
  registeredAt: string;
  lastActiveAt?: string;
  lifecycleStage?: MemberLifecycleStageContract;
  tags?: string[];
  lastPaymentAt?: string;
  lastPaymentAmount?: number;
  lastPaymentOrderId?: string;
  lastPaymentChannel?: string;
  source?: MemberDataSourceContract;
  persisted?: boolean;
}

export interface LytMemberSnapshotContract {
  snapshotId: string;
  tenantContext: TenantContextContract;
  memberProfileId?: string;
  externalMemberId: string;
  memberCode?: string;
  mobile?: string;
  nickname?: string;
  levelCode?: string;
  points: number;
  growthValue: number;
  status: string;
  updatedAtFromSource: string;
  rawVersion?: string;
  rawPayload?: Record<string, unknown>;
  source?: MemberDataSourceContract;
}

export interface MemberOperationsActionContract {
  code: MemberOperationsActionCodeContract;
  label: string;
  reason: string;
  channel: MemberOperationsActionChannelContract;
  priority: MemberOperationsPriorityContract;
}

export interface MemberAutomationTriggerContract {
  code: MemberAutomationTriggerCodeContract;
  status: MemberAutomationTriggerStatusContract;
  source: MemberAutomationTriggerSourceContract;
  reason: string;
}

export interface MemberOperationsProfileContract {
  memberId: string;
  tenantContext: TenantContextContract;
  level: MemberLevelContract;
  status: MemberStatusContract;
  lifecycleStage: MemberLifecycleStageContract | 'prospect';
  audienceSegments: string[];
  recommendedActions: MemberOperationsActionContract[];
  automationTriggers: MemberAutomationTriggerContract[];
  lastPaymentAt?: string;
  lastPaymentAmount?: number;
  lastPaymentChannel?: string;
  tags: string[];
  source?: MemberDataSourceContract;
}

export interface MemberOperationsTaskContract {
  taskId: string;
  tenantContext: TenantContextContract;
  memberId: string;
  actionCode: MemberOperationsActionCodeContract;
  title: string;
  reason: string;
  channel: MemberOperationsActionChannelContract;
  priority: MemberOperationsPriorityContract;
  status: MemberOperationsTaskStatusContract;
  executionLane: MemberOperationsExecutionLaneContract;
  source: MemberOperationsTaskSourceContract;
  sourceOrderId?: string;
  sourcePaymentId?: string;
  executionSummary?: string;
  executionTargetId?: string;
  executedAt?: string;
  dedupeKey: string;
  createdAt: string;
  scheduledAt: string;
}

export interface MemberOperationsExecutionReceiptContract {
  executionId: string;
  tenantContext: TenantContextContract;
  memberId: string;
  taskId: string;
  actionCode: MemberOperationsActionCodeContract;
  targetType: MemberOperationsReceiptTargetTypeContract;
  targetId: string;
  status: MemberOperationsReceiptStatusContract;
  summary: string;
  payload: Record<string, unknown>;
  runtimeReceiptCode?: string;
  runtimeState?: MemberOperationsRuntimeStateContract;
  runtimeReplayable?: boolean;
  executedAt: string;
}

export interface FoundationBootstrapResponse extends FoundationBlueprint {
  tenantContext: TenantContextContract;
}

export interface RegionalLoginPolicyContract {
  defaultLoginPath: string;
  ssoEnabled: boolean;
}

export interface WorkbenchBootstrapResponse extends BootstrapFoundationMetadataContract {
  tenantContext: TenantContextContract;
  workbenches: RoleWorkbenchContract[];
  storePortals: StorePortalContract[];
  tenantPortal: TobPortalContract;
  brandPortal: TobPortalContract;
  marketProfile: MarketProfileContract;
  regionalLoginPolicies: RegionalLoginPolicyContract;
  supportedLocales: string[];
  supportedClients: FoundationSupportedClient[];
}

export const foundationBootstrapCapabilityRules: BootstrapCapabilityRule[] = [
  {
    capability: 'tenant-scope',
    source: 'API_BOOTSTRAP',
    requiredApps: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'],
    cacheLayer: 'NONE',
    notes: ['租户、品牌、门店、市场作用域必须与当前会话实时对齐，切租户或切门店后立即重新拉取。']
  },
  {
    capability: 'market-profile',
    source: 'API_BOOTSTRAP',
    requiredApps: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'],
    cacheLayer: 'LOCAL_PERSISTED',
    ttlSeconds: 900,
    notes: ['语言、时区、税务、网络等非敏感市场配置可短期缓存，但必须保留 API 结果为最终准绳。']
  },
  {
    capability: 'portal-shell',
    source: 'API_BOOTSTRAP',
    requiredApps: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'],
    cacheLayer: 'SESSION',
    ttlSeconds: 300,
    notes: ['导航、页头、运营文案与公开资源位可复用同一会话快照，刷新或恢复前台时重新校验。']
  },
  {
    capability: 'feature-flags',
    source: 'API_BOOTSTRAP',
    requiredApps: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'],
    cacheLayer: 'SESSION',
    ttlSeconds: 60,
    notes: ['灰度开关由 API 统一裁决，客户端只做消费；失效后默认走关闭或只读降级。']
  },
  {
    capability: 'masking-policy',
    source: 'API_BOOTSTRAP',
    requiredApps: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'],
    cacheLayer: 'NONE',
    notes: ['脱敏策略、审批结果与 PII 可见级别不落本地持久化，避免历史快照泄漏。']
  },
  {
    capability: 'risk-challenge',
    source: 'RUNTIME_CHALLENGE',
    requiredApps: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'],
    cacheLayer: 'MEMORY',
    ttlSeconds: 120,
    notes: ['挑战票据、验证码会话与设备校验只在内存短存，完成校验或超时后立即作废。']
  }
];

export const foundationAppBootstrapProfiles: Record<FoundationClientApp, AppBootstrapWiring> = {
  'admin-web': {
    app: 'admin-web',
    audience: 'OPERATIONS',
    bootstrapFile: 'apps/admin-web/app/bootstrap.ts',
    bootstrapEndpoint: '/api/v1/foundation/bootstrap',
    consumes: ['tenant-scope', 'portal-shell', 'feature-flags', 'masking-policy', 'risk-challenge'],
    cacheableCapabilities: ['portal-shell', 'feature-flags'],
    tenantScope: {
      resolver: '登录态 + 当前工作台上下文 + foundation bootstrap',
      bootstrapRequired: true,
      cacheLayer: 'NONE',
      revalidateOn: ['登录成功', '切换租户', '切换品牌', '切换门店', '页面硬刷新'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'MASKED',
      notes: ['后台默认展示脱敏值，审批通过后再按字段粒度解锁。']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'SESSION',
      ttlSeconds: 60,
      fallbackStrategy: 'FAIL_CLOSED',
      notes: ['影响权限、导出、财务与高危操作的开关必须在刷新后重新确认。']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      enforcement: 'BLOCKING',
      notes: ['登录、导出、批量改价、权限变更等高风险动作触发挑战。']
    }
  },
  'tob-web': {
    app: 'tob-web',
    audience: 'MERCHANT',
    bootstrapFile: 'apps/tob-web/app/bootstrap.ts',
    bootstrapEndpoint: '/api/v1/foundation/bootstrap',
    consumes: ['tenant-scope', 'market-profile', 'portal-shell', 'feature-flags', 'masking-policy', 'risk-challenge'],
    cacheableCapabilities: ['market-profile', 'portal-shell', 'feature-flags'],
    tenantScope: {
      resolver: '域名/路由参数 + 登录态 + foundation bootstrap',
      bootstrapRequired: true,
      cacheLayer: 'SESSION',
      revalidateOn: ['首屏进入', '租户切换', '品牌切换', '重新登录'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'MASKED',
      notes: ['招商线索、联系人与财务信息遵循租户策略脱敏展示。']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'SESSION',
      ttlSeconds: 60,
      fallbackStrategy: 'READONLY_LAST_KNOWN',
      notes: ['门户壳层可用最近一次成功快照兜底，但交易和登录入口按关闭处理。']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      enforcement: 'STEP_UP',
      notes: ['异常登录、线索提交、招商表单和敏感配置变更按需拉起挑战。']
    }
  },
  'storefront-web': {
    app: 'storefront-web',
    audience: 'CONSUMER',
    bootstrapFile: 'apps/storefront-web/app/market-bootstrap.ts',
    bootstrapEndpoint: '/api/v1/foundation/bootstrap',
    consumes: ['tenant-scope', 'market-profile', 'portal-shell', 'feature-flags', 'masking-policy', 'risk-challenge'],
    cacheableCapabilities: ['market-profile', 'portal-shell'],
    tenantScope: {
      resolver: '域名/路由参数 + 会员会话 + foundation bootstrap',
      bootstrapRequired: true,
      cacheLayer: 'SESSION',
      revalidateOn: ['首屏进入', '切店', '会员登录', '会员退出'],
      mismatchStrategy: 'PUBLIC_LAST_KNOWN'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'HIDDEN_UNTIL_APPROVED',
      notes: ['未登录或未授权时不回显完整手机号、邮箱和券码。']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'SESSION',
      ttlSeconds: 60,
      fallbackStrategy: 'PUBLIC_LAST_KNOWN',
      notes: ['公开展示位可短暂使用上次快照，交易型入口缺少新裁决时默认关闭。']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      enforcement: 'STEP_UP',
      notes: ['注册、领券、预约、支付前风控命中时再按 API 指令拉起挑战。']
    }
  },
  miniapp: {
    app: 'miniapp',
    audience: 'CONSUMER',
    bootstrapFile: 'apps/miniapp/src/market-bootstrap.ts',
    bootstrapEndpoint: '/api/v1/foundation/bootstrap',
    consumes: ['tenant-scope', 'market-profile', 'portal-shell', 'feature-flags', 'masking-policy', 'risk-challenge'],
    cacheableCapabilities: ['market-profile', 'portal-shell', 'feature-flags'],
    tenantScope: {
      resolver: '启动参数 + 微信会话 + foundation bootstrap',
      bootstrapRequired: true,
      cacheLayer: 'SESSION',
      revalidateOn: ['冷启动', '门店切换', '会员登录', '会员退出', '回到前台'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'MASKED',
      notes: ['小程序本地缓存不落敏感明文，分享态只保留公开字段。']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'SESSION',
      ttlSeconds: 60,
      fallbackStrategy: 'READONLY_LAST_KNOWN',
      notes: ['活动位和会员中心可短时复用会话快照，支付与核销类开关默认关闭。']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      enforcement: 'STEP_UP',
      notes: ['登录、领券、拼团和营销裂变命中风控时拉起微信生态内挑战。']
    }
  },
  app: {
    app: 'app',
    audience: 'CONSUMER',
    bootstrapFile: 'apps/app/market-bootstrap.ts',
    bootstrapEndpoint: '/api/v1/foundation/bootstrap',
    consumes: ['tenant-scope', 'market-profile', 'portal-shell', 'feature-flags', 'masking-policy', 'risk-challenge'],
    cacheableCapabilities: ['market-profile', 'portal-shell', 'feature-flags'],
    tenantScope: {
      resolver: '设备会话 + 用户身份 + foundation bootstrap',
      bootstrapRequired: true,
      cacheLayer: 'SESSION',
      revalidateOn: ['冷启动', '登录成功', '切店', '账号切换', '回到前台'],
      mismatchStrategy: 'FAIL_CLOSED'
    },
    desensitization: {
      source: 'API_BOOTSTRAP',
      defaultMode: 'MASKED',
      notes: ['会员资料、券码和设备绑定信息以 API 授权级别为准，离线态只保留最小展示。']
    },
    featureFlags: {
      source: 'API_BOOTSTRAP',
      cacheLayer: 'SESSION',
      ttlSeconds: 60,
      fallbackStrategy: 'READONLY_LAST_KNOWN',
      notes: ['导航壳层可短时复用最近快照，涉及支付、设备控制和会员写操作时必须拿到新裁决。']
    },
    riskChallenge: {
      triggerSource: 'API_BOOTSTRAP',
      cacheLayer: 'MEMORY',
      enforcement: 'STEP_UP',
      notes: ['设备绑定、会员找回、支付前校验等高风险动作按需触发二次验证。']
    }
  }
};

export const foundationBootstrapContract: UnifiedFoundationBootstrapContract = {
  version: '2026-06-task4',
  bootstrapEndpoint: '/api/v1/foundation/bootstrap',
  deliveredCapabilities: foundationBootstrapCapabilityRules,
  appProfiles: foundationAppBootstrapProfiles
};

export function getFoundationAppBootstrapWiring(app: FoundationClientApp): AppBootstrapWiring {
  return foundationAppBootstrapProfiles[app];
}

// ───────────────────────── Audit Trail Contract ─────────────────────────

export type AuditRiskLevel = 'low' | 'medium' | 'high';

export interface AuditRecordContract {
  auditId: string;
  eventType: string;
  tenantId?: string;
  actorId?: string;
  source?: string;
  riskLevel: AuditRiskLevel;
  occurredAt: string;
  details: Record<string, unknown>;
}

export interface AuditTrailQuery {
  tenantId?: string;
  action?: string;
  source?: string;
  requestId?: string;
  actorId?: string;
  approvalTicket?: string;
  resourceType?: string;
  resourceId?: string;
  purpose?: string;
  riskLevel?: AuditRiskLevel;
  from?: string;
  to?: string;
  limit?: number;
}

export interface AuditTrailResponse {
  records: AuditRecordContract[];
  total: number;
  query: AuditTrailQuery;
}

export interface AuditTrailSummary {
  total: number;
  byAction: Record<string, number>;
  bySource: Record<string, number>;
  byRiskLevel: Record<AuditRiskLevel, number>;
}

export function buildAuditTrailHref(query: AuditTrailQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    } else if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();
  return queryString ? `/audit-trail?${queryString}` : '/audit-trail';
}

// ─────────────────── Audit Trail Record Detail Hrefs ───────────────────

export function buildAuditTrailRecordDetailHref(auditId: string): string {
  const encoded = encodeURIComponent(auditId);
  return `/audit-trail/records/${encoded}`;
}

export function readAuditTrailRecordDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

// ─────────────────── Configuration Governance Contract ───────────────────

export type ConfigurationScopeType = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE';

export interface ConfigurationScope {
  scopeType: ConfigurationScopeType;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export interface ConfigurationConfigEntryRevision {
  version: number;
  changedBy?: string;
  changeReason?: string;
  createdAt: string;
}

export interface ConfigurationConfigEntry {
  id: string;
  namespace?: string;
  key: string;
  valueType?: string;
  scopeType: ConfigurationScopeType | string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketProfileId?: string;
  portalSiteId?: string;
  version?: number;
  value?: unknown;
  schemaRef?: string;
  tags?: string[];
  status?: string;
  createdBy?: string;
  latestRevision?: ConfigurationConfigEntryRevision | null;
  updatedAt: string;
}

export interface ConfigurationFeatureFlag {
  key: string;
  name?: string;
  description?: string;
  enabled: boolean;
  reason?: string;
  matchedScope?: ConfigurationScope | null;
  rolloutPercentage?: number;
  subjectKey?: string;
  source?: 'in-memory' | 'persisted' | string;
}

export type ConfigurationSecretStatus = 'rotation-due' | 'expired' | 'active' | string;
export type ConfigurationCertificateStatus = 'active' | 'expiring-soon' | 'expired' | string;

export interface ConfigurationSecretMetadata {
  name: string;
  status?: ConfigurationSecretStatus;
  expiresAt?: string | null;
  consumers?: string[];
  version?: number;
  rotationDueAt?: string | null;
  source?: string;
  rotatedBy?: string | null;
  rotatedAt?: string | null;
}

export interface ConfigurationCertificateMetadata {
  name: string;
  status: ConfigurationCertificateStatus;
  expiresAt: string;
  autoRenew?: boolean;
  issuer?: string;
  fingerprint?: string;
  daysToExpire?: number;
}

export interface ConfigurationSnapshot {
  snapshotId: string;
  generatedAt: string;
  scopeChain: ConfigurationScope[];
  context: ConfigurationScope;
  config: Record<string, unknown>;
  featureFlags: ConfigurationFeatureFlag[];
  secrets: ConfigurationSecretMetadata[];
  checksum: string;
}

export interface ConfigurationPostureAttention {
  type: 'secret' | 'certificate';
  key: string;
  status: string;
  expiresAt?: string | null;
}

export interface ConfigurationPosture {
  generatedAt: string;
  secrets: {
    total: number;
    rotationDue: number;
    expired: number;
    sharedConsumers: number;
  };
  certificates: {
    total: number;
    expiringSoon: number;
    expired: number;
    autoRenewDisabled: number;
  };
  attention: {
    secrets: ConfigurationPostureAttention[];
    certificates: ConfigurationPostureAttention[];
  };
}

export interface ConfigurationGovernanceMetadataEntry {
  operation: string;
  rbac: {
    resource: string;
    action: string;
    requiredRoles: string[];
    requiredPermissions: string[];
  };
  approval: {
    required: boolean;
    approvalId: string | null;
    version: number | null;
    requestedBy: string | null;
    ticket: string | null;
    status: ConfigurationGovernanceMetadataStatus;
    submitted: boolean;
    persisted: boolean;
    decidedBy: string | null;
    decidedAt: string | null;
    updatedAt: string | null;
    execution: {
      attempts: number;
      executed: boolean;
      executionStatus: string | null;
      executedAt: string | null;
      executedBy: string | null;
    };
  };
}

export type ConfigurationGovernanceMetadataStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUPERSEDED'
  | string;

export interface ConfigurationOverview {
  generatedAt: string;
  approvals?: Record<string, Record<string, number>>;
  audits?: Record<string, Record<string, number>>;
  configuration: {
    entries: {
      total: number;
      active: number;
      namespaces: Record<string, number>;
      items: ConfigurationConfigEntry[];
    };
    featureFlags: {
      total: number;
      enabled: number;
      active: number;
      byStrategy: Record<string, number>;
      items: ConfigurationFeatureFlag[];
    };
    secrets: {
      total: number;
      persisted: number;
      static: number;
      rotationDue: number;
      expired: number;
      items: ConfigurationSecretMetadata[];
    };
    certificates: {
      total: number;
      autoRenew: number;
      expiringSoon: number;
      expired: number;
      items: ConfigurationCertificateMetadata[];
    };
  };
  posture: ConfigurationPosture;
  scopeChain?: ConfigurationScope[];
}

export interface ConfigurationOverviewQuery {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export function buildConfigurationHref(query: ConfigurationOverviewQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/configuration?${queryString}` : '/configuration';
}

export function buildConfigurationOperationDetailHref(operation: string): string {
  const encoded = encodeURIComponent(operation);
  return `/configuration/operations/${encoded}`;
}

export function readConfigurationOperationDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildConfigurationSecretDetailHref(name: string): string {
  const encoded = encodeURIComponent(name);
  return `/configuration/secrets/${encoded}`;
}

export function readConfigurationSecretDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildConfigurationCertificateDetailHref(name: string): string {
  const encoded = encodeURIComponent(name);
  return `/configuration/certificates/${encoded}`;
}

export function readConfigurationCertificateDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildConfigurationFeatureFlagDetailHref(key: string): string {
  const encoded = encodeURIComponent(key);
  return `/configuration/flags/${encoded}`;
}

export function readConfigurationFeatureFlagDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildConfigurationConfigEntryDetailHref(id: string): string {
  const encoded = encodeURIComponent(id);
  return `/configuration/entries/${encoded}`;
}

export function readConfigurationConfigEntryDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

// ─────────────────── Integration Orchestration Detail Hrefs ───────────────────

export function buildIntegrationOrchestrationSourceDetailHref(source: string): string {
  const encoded = encodeURIComponent(source);
  return `/integration-orchestration/sources/${encoded}`;
}

export function readIntegrationOrchestrationSourceDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildIntegrationOrchestrationEventDetailHref(envelopeId: string): string {
  const encoded = encodeURIComponent(envelopeId);
  return `/integration-orchestration/events/${encoded}`;
}

export function readIntegrationOrchestrationEventDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildIntegrationOrchestrationIdempotencyDetailHref(key: string): string {
  const encoded = encodeURIComponent(key);
  return `/integration-orchestration/idempotency/${encoded}`;
}

export function readIntegrationOrchestrationIdempotencyDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export interface IntegrationOrchestrationEventDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  envelopeId: string;
  notFound: boolean;
  envelope: IntegrationEventEnvelopeContract | null;
  relatedIdempotencyRecords: IntegrationIdempotencyRecordContract[];
  workspaceHref: string;
  foundationHref: string;
  auditHref: string;
}

export interface IntegrationOrchestrationIdempotencyDetail {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  key: string;
  notFound: boolean;
  record: IntegrationIdempotencyRecordContract | null;
  relatedEvent: IntegrationEventEnvelopeContract | null;
  workspaceHref: string;
  foundationHref: string;
  auditHref: string;
}

// ─────────────────── Resilience Operations Contract ───────────────────

export type ObservabilitySignalType = 'metrics' | 'logs' | 'traces';
export type ObservabilityStatus = 'healthy' | 'warning' | 'critical';
export type RecoveryPlanStatus = 'ready' | 'attention';

export interface ObservabilitySignalContract {
  signal: ObservabilitySignalType;
  status: ObservabilityStatus;
  coverage: number;
  collectionLagSeconds: number;
  lastCollectedAt: string;
  owner: string;
  alertRoutes: string[];
  evidence: string[];
}

export interface RetryPolicyContract {
  key: string;
  capability: string;
  trigger: string;
  maxAttempts: number;
  backoff: string;
  recoveryAction: string;
  escalationTarget: string;
}

export interface RecoveryPlanContract {
  resource: string;
  status: RecoveryPlanStatus;
  rtoMinutes: number;
  rpoMinutes: number;
  lastDrillAt: string;
  staleAfterDays: number;
  dependencies: string[];
  runbook: string;
}

export interface ResilienceOverview {
  generatedAt: string;
  observability: {
    totalSignals: number;
    degradedSignals: number;
    byStatus: Record<string, number>;
    averageCoverage: number;
    maxCollectionLagSeconds: number;
    signals: ObservabilitySignalContract[];
  };
  retries: {
    totalPolicies: number;
    byCapability: Record<string, number>;
    maxAttempts: number;
    policies: RetryPolicyContract[];
  };
  recovery: {
    totalPlans: number;
    attentionRequired: number;
    staleDrills: number;
    plans: RecoveryPlanContract[];
  };
}

export interface EdgeReplayStageRequest {
  storeId: string;
  operationCount: number;
}

export interface EdgeReplayStageContract {
  status: 'staged';
  storeId: string;
  operationCount: number;
  replayPipeline: string[];
  retryPolicy?: RetryPolicyContract | null;
  observabilityHooks: string[];
  recoveryPlan?: RecoveryPlanContract | null;
}

export interface ResilienceQuery {
  capability?: string;
  status?: string;
  resource?: string;
}

export function buildResilienceHref(query: ResilienceQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/resilience?${queryString}` : '/resilience';
}

// ─────────────────── Resilience Detail Hrefs ───────────────────

export function buildResilienceSignalDetailHref(signal: string): string {
  const encoded = encodeURIComponent(signal);
  return `/resilience/signals/${encoded}`;
}

export function readResilienceSignalDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildResilienceRetryPolicyDetailHref(key: string): string {
  const encoded = encodeURIComponent(key);
  return `/resilience/retries/${encoded}`;
}

export function readResilienceRetryPolicyDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildResilienceRecoveryPlanDetailHref(resource: string): string {
  const encoded = encodeURIComponent(resource);
  return `/resilience/recovery/${encoded}`;
}

export function readResilienceRecoveryPlanDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

// ─────────────────── Rate Limit & Quota Contract ───────────────────

export type RateLimitScopeType = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'INTEGRATION';
export type RateLimitPeriod = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
export type RateLimitAlgorithm = 'FIXED_WINDOW' | 'SLIDING_WINDOW' | 'TOKEN_BUCKET' | string;
export type QuotaLedgerStatus = 'healthy' | 'warning' | 'blocked';

export interface RateLimitPolicyRecord {
  id: string;
  code: string;
  scopeType: RateLimitScopeType | string;
  tenantId?: string | null;
  brandId?: string | null;
  storeId?: string | null;
  integrationAppId?: string | null;
  period: RateLimitPeriod | string;
  limit: number;
  burstLimit?: number | null;
  dimensionKeys?: string[];
  algorithm?: RateLimitAlgorithm;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface QuotaLedgerRecord {
  id: string;
  subjectKey: string;
  period: RateLimitPeriod | string;
  consumed: number;
  remaining?: number | null;
  resetAt: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
  policy: {
    id: string;
    code: string;
    limit: number;
    period: RateLimitPeriod | string;
  };
}

export interface RateLimitWorkspace {
  generatedAt: string;
  totals: {
    policies: number;
    activePolicies: number;
    ledgers: number;
    blockedLedgers: number;
    highConsumptionLedgers: number;
  };
  policies: RateLimitPolicyRecord[];
  ledgers: QuotaLedgerRecord[];
  byPeriod: Record<string, number>;
  byScope: Record<string, number>;
}

export interface RateLimitWorkspaceQuery {
  tenantId?: string;
  policyCode?: string;
  subjectKey?: string;
  status?: QuotaLedgerStatus | 'ALL';
}

export function buildRateLimitsHref(query: RateLimitWorkspaceQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/rate-limits?${queryString}` : '/rate-limits';
}

// ─────────────────── Rate Limits Detail Hrefs ───────────────────

export function buildRateLimitsPolicyDetailHref(policyId: string): string {
  const encoded = encodeURIComponent(policyId);
  return `/rate-limits/policies/${encoded}`;
}

export function readRateLimitsPolicyDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildRateLimitsLedgerDetailHref(ledgerId: string): string {
  const encoded = encodeURIComponent(ledgerId);
  return `/rate-limits/ledgers/${encoded}`;
}

export function readRateLimitsLedgerDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

// ─────────────────── Identity Access Contract ───────────────────

export interface IdentityAccessActorContext {
  actorId: string;
  actorType?: string;
  actorName?: string;
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  roles: string[];
  permissions: string[];
  authenticated: boolean;
  source?: string;
}

export interface IdentityAccessTenantContext {
  tenantId: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export interface IdentityAccessResolvedContext {
  authenticated: boolean;
  actor: IdentityAccessActorContext | null;
  tenantContext: IdentityAccessTenantContext;
  effectiveTenantId?: string;
  effectiveBrandId?: string;
  effectiveStoreId?: string;
  effectiveMarketCode?: string;
  roles: string[];
  permissions: string[];
}

export interface IdentityAccessAuthorizationDecision {
  status: 'allowed' | 'denied';
  action: string;
  resourceScope: Record<string, string | undefined>;
  actor: IdentityAccessActorContext | null;
  permissionMatched: boolean;
  tenantScopeMatched: boolean;
  enforcedBy: string[];
}

export interface IdentityAccessValidationResult {
  status: 'allowed' | 'denied';
  check: 'role' | 'permission' | 'tenant-scope';
  resolved?: IdentityAccessResolvedContext;
  authorization?: IdentityAccessAuthorizationDecision;
  targetTenantId?: string;
}

export interface IdentityAccessWorkspaceQuery {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

export interface IdentityAccessWorkspace {
  generatedAt: string;
  context: IdentityAccessResolvedContext;
  roleValidation: IdentityAccessValidationResult | null;
  permissionValidation: IdentityAccessValidationResult | null;
  tenantScopeValidation: IdentityAccessValidationResult | null;
}

export function buildIdentityAccessHref(query: IdentityAccessWorkspaceQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/identity-access?${queryString}` : '/identity-access';
}

export function buildIdentityAccessRoleDetailHref(role: string): string {
  const encoded = encodeURIComponent(role);
  return `/identity-access/roles/${encoded}`;
}

export function readIdentityAccessRoleDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildIdentityAccessPermissionDetailHref(permission: string): string {
  const encoded = encodeURIComponent(permission);
  return `/identity-access/permissions/${encoded}`;
}

export function readIdentityAccessPermissionDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export function buildIdentityAccessSessionDetailHref(session: string): string {
  const encoded = encodeURIComponent(session);
  return `/identity-access/sessions/${encoded}`;
}

export function readIdentityAccessSessionDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

export interface FoundationWorkspaceQuery {
  moduleKey?: string;
  consumer?: string;
}

export function buildFoundationWorkspaceHref(query: FoundationWorkspaceQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/foundation?${queryString}` : '/foundation';
}

// ─────────────────── Foundation Module Detail Hrefs ───────────────────

export function buildFoundationModuleDetailHref(moduleKey: string): string {
  const encoded = encodeURIComponent(moduleKey);
  return `/foundation/modules/${encoded}`;
}

export function readFoundationModuleDetailParam(raw: unknown): string | null {
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === 'string' && first.length > 0 ? decodeURIComponent(first) : null;
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return decodeURIComponent(raw);
  }
  return null;
}

// ─────────────────── Integration Orchestration Contract ───────────────────

export interface IntegrationWebhookSourceContract {
  source: string;
  algorithm: 'hmac-sha256' | string;
  toleranceSeconds: number;
  description: string;
  secretRef: string;
}

export interface IntegrationEventEnvelopeContract {
  envelopeId: string;
  eventName: string;
  source: string;
  aggregateId?: string;
  idempotencyKey: string;
  occurredAt: string;
  receivedAt: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
}

export interface IntegrationIdempotencyRecordContract {
  key: string;
  source: string;
  eventId: string;
  eventType: string;
  firstSeenAt: string;
  envelopeId: string;
  status: 'accepted' | string;
  payloadChecksum: string;
}

export interface IntegrationPublishEventRequest {
  eventName: string;
  source?: string;
  aggregateId?: string;
  idempotencyKey?: string;
  payload: Record<string, unknown>;
}

export interface IntegrationPublishEventResponse {
  status: 'accepted' | 'duplicate';
  envelope: IntegrationEventEnvelopeContract;
  persistedEventId: string;
  guarantees: string[];
}

export interface IntegrationWebhookIngestRequest {
  eventId?: string;
  eventType?: string;
  signature: string;
  timestamp: string;
  rawBody?: string;
  payload: Record<string, unknown>;
}

export interface IntegrationWebhookIngestResponse {
  status: 'accepted' | 'duplicate';
  source: string;
  signatureVerified: boolean;
  idempotency: IntegrationIdempotencyRecordContract;
  envelope?: IntegrationEventEnvelopeContract;
  pipeline: string[];
}

export interface IntegrationOrchestrationWorkspaceQuery {
  source?: string;
}

export interface IntegrationOrchestrationWorkspace {
  generatedAt: string;
  sources: IntegrationWebhookSourceContract[];
  events: IntegrationEventEnvelopeContract[];
  idempotencyRecords: IntegrationIdempotencyRecordContract[];
  summary: {
    sources: number;
    events: number;
    idempotencyRecords: number;
    uniqueEventSources: number;
    duplicateSensitiveRecords: number;
  };
}

export function buildIntegrationOrchestrationHref(query: IntegrationOrchestrationWorkspaceQuery = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.length > 0) {
      params.set(key, value);
    }
  }
  const queryString = params.toString();
  return queryString ? `/integration-orchestration?${queryString}` : '/integration-orchestration';
}

// ── Agent & Knowledge V2 (Phase-23/24/25 — 后端 entity 镜像) ──

/** Agent 会话状态 */
export type AgentSessionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

/** Agent 执行状态 */
export type AgentExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

/** Agent 工具调用状态 */
export type AgentToolCallStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

/** Agent 消息角色 */
export type AgentMessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** Agent 运行时配置 */
export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  maxSteps: number;
  enableReflection: boolean;
  allowedTools: string[];
  timeoutMs: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

/** Agent 消息 */
export interface AgentMessage {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  content: string;
  toolCallId?: string;
  toolCalls?: AgentToolCall[];
  timestamp: string;
}

/** Agent 工具调用 */
export interface AgentToolCall {
  id: string;
  name: string;
  input: unknown;
  output?: unknown;
  status: AgentToolCallStatus;
  durationMs?: number;
  error?: string;
}

/** Agent 运行会话 */
export interface AgentSession {
  id: string;
  configId: string;
  status: AgentSessionStatus;
  userInput: string;
  finalOutput?: string;
  currentStep: number;
  maxSteps: number;
  enableReflection: boolean;
  messages: AgentMessage[];
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  createdBy: string;
  tenantId: string;
}

/** Agent 执行记录 */
export interface AgentExecution {
  id: string;
  sessionId: string;
  configId: string;
  status: AgentExecutionStatus;
  steps: number;
  totalDurationMs: number;
  llmCalls: number;
  toolCalls: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
  tenantId: string;
}

/** 质量评估结果 */
export interface QualityEvaluation {
  id: string;
  sessionId: string;
  userInput: string;
  agentOutput: string;
  relevanceScore: number;
  accuracyScore: number;
  completenessScore: number;
  safetyScore: number;
  helpfulnessScore: number;
  concisenessScore: number;
  overallScore: number;
  feedback: string;
  evaluatedAt: string;
  evaluatedBy: string;
  tenantId: string;
}

/** 创建 Agent 会话请求 */
export interface CreateSessionRequest {
  configId: string;
  userInput: string;
  maxSteps?: number;
  enableReflection?: boolean;
  createdBy: string;
  tenantId: string;
}

/** Agent 会话执行响应 */
export interface SessionExecutionResult {
  session: AgentSession;
  execution: AgentExecution;
  evaluation?: QualityEvaluation;
  timestamp: string;
}

/** 批量 Agent 请求 */
export interface BatchAgentRequest {
  items: Array<{
    configId: string;
    userInput: string;
    maxSteps?: number;
    enableReflection?: boolean;
  }>;
  createdBy: string;
  tenantId: string;
}

/** 批量 Agent 响应 */
export interface BatchAgentResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    index: number;
    session: AgentSession;
    execution: AgentExecution;
  }>;
  timestamp: string;
}

/** Agent 统计 */
export interface AgentStats {
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  runningSessions: number;
  avgSteps: number;
  avgDurationMs: number;
  avgLlmCalls: number;
  avgQualityScore: number;
  tenantId: string;
  timestamp: string;
}

export type ToolRiskLevel = 'low' | 'medium' | 'high';

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  riskLevel: ToolRiskLevel;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ── Phase-27: Agent Session Event Stream ──

/** Agent 会话流事件 — discriminated union */
export type AgentSessionEvent =
  | { type: 'session_started'; session: AgentSession; timestamp: string }
  | { type: 'message_added'; message: AgentMessage; timestamp: string }
  | { type: 'tool_call_started'; toolCall: AgentToolCall; timestamp: string }
  | { type: 'tool_call_completed'; toolCall: AgentToolCall; timestamp: string }
  | { type: 'step_progress'; step: number; maxSteps: number; timestamp: string }
  | { type: 'reflection_started'; step: number; timestamp: string }
  | {
      type: 'session_completed';
      session: AgentSession;
      execution: AgentExecution;
      timestamp: string;
    }
  | { type: 'session_failed'; session: AgentSession; error: string; timestamp: string };

/** 事件类型联合 (用于 SDK filter / switch) */
export type AgentSessionEventType = AgentSessionEvent['type'];

// ════════════════════════════════════════════════════════════════════════════
// Phase-35: 收银台业务模块 (订单 / 支付 / 退款)
// DR-36: 状态机 + 幂等性 + 整数分(cents) + 乐观锁
// ════════════════════════════════════════════════════════════════════════════

/** 订单状态 (8 个, 状态机见 apps/api/src/modules/cashier/order-state-machine.ts) */
export type OrderStatus =
  | 'DRAFT'             // 草稿
  | 'PENDING'           // 待支付
  | 'PAID'              // 已支付
  | 'FULFILLED'         // 已履约 (发货/核销)
  | 'PARTIALLY_REFUNDED'// 部分退款
  | 'REFUNDED'          // 全部退款 (终态)
  | 'CANCELED'          // 已取消 (终态)
  | 'TIMEOUT';          // 超时关闭 (终态)

/** 支付方式 (4 种) */
export type PaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY' | 'CARD';

/** 支付状态 (4 个) */
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

/** 退款状态 (3 个) */
export type RefundStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

/** 订单行 (商品明细) */
export interface OrderItem {
  id: string;                     // OIT-YYYYMMDD-XXXXX
  orderId: string;
  tenantId: string;
  productId: string;
  productName: string;            // 冗余, 商品改名不影响历史
  unitPriceCents: number;         // 单价 (整数分)
  quantity: number;               // 数量
  subtotalCents: number;          // 小计 = unitPriceCents × quantity
  discountCents: number;          // 优惠
  createdAt: string;
}

/** 订单主单 */
export interface Order {
  id: string;                     // ORD-YYYYMMDD-XXXXX
  tenantId: string;
  memberId: string | null;        // 散客 = null
  status: OrderStatus;
  /** 金额 (整数分, DR-36 决策 4: 绝不用浮点) */
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;             // 应付
  paidCents: number;              // 已付
  refundedCents: number;          // 累计退款
  paymentMethod: PaymentMethod | null;
  createdBy: string;              // 收银员 userId
  clientOrderId: string;          // 前端 UUID (幂等键)
  version: number;                // 乐观锁
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  closedAt: string | null;        // 取消/完成
}

/** 支付记录 */
export interface Payment {
  id: string;                     // PAY-YYYYMMDD-XXXXX
  tenantId: string;
  orderId: string;
  method: PaymentMethod;
  amountCents: number;
  status: PaymentStatus;
  providerTxnId: string | null;   // 微信/支付宝流水号 (幂等键)
  idempotencyKey: string;         // (orderId + method) hash
  paidAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 退款记录 */
export interface Refund {
  id: string;                     // RFD-YYYYMMDD-XXXXX
  tenantId: string;
  orderId: string;
  paymentId: string;
  amountCents: number;
  reason: string;
  reasonHash: string;             // 幂等键 part
  status: RefundStatus;
  providerRefundId: string | null;
  idempotencyKey: string;         // (orderId + amount + reasonHash) hash
  refundedAt: string | null;
  failureReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** 订单事件 (SSE 推送, 8 类型 discriminated union) */
export type OrderEvent =
  | { type: 'order_created'; order: Order; timestamp: string }
  | { type: 'order_submitted'; order: Order; timestamp: string }
  | { type: 'payment_pending'; order: Order; payment: Payment; timestamp: string }
  | { type: 'order_paid'; order: Order; payment: Payment; timestamp: string }
  | { type: 'order_fulfilled'; order: Order; timestamp: string }
  | { type: 'order_refunded'; order: Order; refund: Refund; timestamp: string }
  | { type: 'order_timeout'; order: Order; timestamp: string }
  | { type: 'order_canceled'; order: Order; reason: string; timestamp: string };

/** OrderEvent 类型联合 */
export type OrderEventType = OrderEvent['type'];

/** 创建订单输入 */
export interface CreateOrderInput {
  clientOrderId: string;          // 前端 UUID (幂等键)
  memberId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPriceCents: number;
    discountCents?: number;
  }>;
  discountCents?: number;
  taxCents?: number;
  metadata?: Record<string, unknown>;
}

/** 创建支付输入 */
export interface CreatePaymentInput {
  orderId: string;
  method: PaymentMethod;
  amountCents: number;            // 应等于 order.totalCents
}

/** 创建退款输入 */
export interface CreateRefundInput {
  orderId: string;
  paymentId: string;
  amountCents: number;            // ≤ order.paidCents - order.refundedCents
  reason: string;
}

/** 订单事件 (带 id, 用于 SSE Last-Event-ID 续传) */
export type OrderEventWithId = OrderEvent & { id: number };

// ═══════════════════════════════════════════════════════════════════════════
// Phase-35: 智能体接入模块 - LLM配置类型
// ═══════════════════════════════════════════════════════════════════════════

/** LLM 服务提供商 */
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'minimax' | 'custom';

/** LLM 配置状态 */
export type LLMConfigStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

/** 站点LLM配置 */
export interface TenantLLMConfig {
  id: string;
  tenantId: string;
  siteId?: string;
  storeId?: string;
  name: string;
  provider: LLMProvider;
  modelName: string;
  apiEndpoint?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  quotaLimit?: number;
  quotaUsed?: number;
  quotaAlertThreshold?: number;
  status: LLMConfigStatus;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

/** 创建LLM配置请求 */
export interface CreateLLMConfigRequest {
  name: string;
  provider: LLMProvider;
  modelName: string;
  apiEndpoint?: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  quotaLimit?: number;
  quotaAlertThreshold?: number;
  siteId?: string;
  storeId?: string;
}

/** 更新LLM配置请求 */
export interface UpdateLLMConfigRequest {
  name?: string;
  provider?: LLMProvider;
  modelName?: string;
  apiEndpoint?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  quotaLimit?: number;
  quotaAlertThreshold?: number;
  enabled?: boolean;
}

/** LLM调用统计 */
export interface LLMStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCost: number;
  currency: string;
  avgLatencyMs: number;
  periodStart: string;
  periodEnd: string;
}

/** LLM调用日志 */
export interface LLMCallLog {
  id: string;
  configId: string;
  tenantId: string;
  sessionId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimate: number;
  currency: string;
  latencyMs: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  createdAt: string;
}

/** 接入申请请求 */
export interface ApplyLLMConfigRequest {
  configId: string;
  useCase: string;
  expectedVolume: number;
  businessJustification?: string;
}

/** 全球化地域上下文 */
export interface GeoContext {
  country: string;
  province?: string;
  city?: string;
  language: SupportedLanguage;
  currency: SupportedCurrency;
  timezone: string;
  regionCode: string;
}

/** 支持的语言 */
export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'zh-TW' | 'es-ES' | 'fr-FR' | 'de-DE';

/** 支持的货币 */
export type SupportedCurrency = 'USD' | 'CNY' | 'JPY' | 'KRW' | 'EUR' | 'GBP' | 'HKD' | 'SGD';
