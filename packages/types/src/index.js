"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationBootstrapContract = exports.foundationAppBootstrapProfiles = exports.foundationBootstrapCapabilityRules = exports.foundationAlertCatalogFallback = exports.foundationSupportedClients = exports.runtimeGovernanceReplayEscalationActions = exports.runtimeGovernanceReplaySources = exports.runtimeGovernanceCallbackStallEscalationActions = exports.runtimeGovernanceCallbackTimeoutThresholds = exports.runtimeGovernanceCallbackEvents = exports.runtimeGovernanceCallbackReceiptStatuses = exports.runtimeGovernanceCallbackStatuses = exports.runtimeGovernanceRecommendedActions = exports.runtimeGovernanceRiskLevels = exports.runtimeGovernanceNextSteps = exports.runtimeGovernanceApiActionKeys = exports.runtimeGovernanceActionKeys = exports.runtimeGovernanceClientApps = void 0;
exports.buildFoundationAlertRecentOperationFilterState = buildFoundationAlertRecentOperationFilterState;
exports.buildFoundationAlertTimelineFilterStateFromQuery = buildFoundationAlertTimelineFilterStateFromQuery;
exports.normalizeFoundationAlertTimelineFilterState = normalizeFoundationAlertTimelineFilterState;
exports.buildFoundationAlertTimelineFilterSearchParams = buildFoundationAlertTimelineFilterSearchParams;
exports.buildFoundationAlertTimelineFilterQueryPreview = buildFoundationAlertTimelineFilterQueryPreview;
exports.resolveFoundationAlertFocusCode = resolveFoundationAlertFocusCode;
exports.buildFoundationAlertLinkedFocusContext = buildFoundationAlertLinkedFocusContext;
exports.buildFoundationAlertLinkedFocusSearchParams = buildFoundationAlertLinkedFocusSearchParams;
exports.filterFoundationAlertTimeline = filterFoundationAlertTimeline;
exports.summarizeFoundationAlertOwners = summarizeFoundationAlertOwners;
exports.filterFoundationAlertTimelineByOwner = filterFoundationAlertTimelineByOwner;
exports.filterFoundationAlertTimelineBySource = filterFoundationAlertTimelineBySource;
exports.summarizeFoundationAlertTimelineSources = summarizeFoundationAlertTimelineSources;
exports.findLatestFoundationAlertTimelineEntry = findLatestFoundationAlertTimelineEntry;
exports.summarizeFoundationAlertTimelineMetrics = summarizeFoundationAlertTimelineMetrics;
exports.summarizeFoundationAlertTimelineDigest = summarizeFoundationAlertTimelineDigest;
exports.listFoundationAlertTimelineActiveFilters = listFoundationAlertTimelineActiveFilters;
exports.summarizeFoundationAlertTimelineFilters = summarizeFoundationAlertTimelineFilters;
exports.isFoundationAlertTimelineFilterStateEqual = isFoundationAlertTimelineFilterStateEqual;
exports.buildFoundationAlertTimelineEmptyState = buildFoundationAlertTimelineEmptyState;
exports.buildFoundationAlertTimelineShortcutPresets = buildFoundationAlertTimelineShortcutPresets;
exports.isFoundationAlertRuntimeCallbackStalledDetail = isFoundationAlertRuntimeCallbackStalledDetail;
exports.getFoundationAlertRuntimeCallbackStalledDetail = getFoundationAlertRuntimeCallbackStalledDetail;
exports.resolveFoundationAlertSelectedCode = resolveFoundationAlertSelectedCode;
exports.buildFoundationAlertPanelReadState = buildFoundationAlertPanelReadState;
exports.buildFoundationAlertPanelDerivedState = buildFoundationAlertPanelDerivedState;
exports.buildFoundationAlertTimelineFilterReadState = buildFoundationAlertTimelineFilterReadState;
exports.buildFoundationAlertQuickSwitchItems = buildFoundationAlertQuickSwitchItems;
exports.buildFoundationAlertOptimisticReadState = buildFoundationAlertOptimisticReadState;
exports.buildRuntimeGovernanceReplayEndpoint = buildRuntimeGovernanceReplayEndpoint;
exports.createRuntimeGovernanceReplayPolicy = createRuntimeGovernanceReplayPolicy;
exports.advanceRuntimeGovernanceReplayPolicy = advanceRuntimeGovernanceReplayPolicy;
exports.evaluateRuntimeGovernanceCallbackStall = evaluateRuntimeGovernanceCallbackStall;
exports.buildRuntimeGovernanceCallbackStallDetail = buildRuntimeGovernanceCallbackStallDetail;
exports.getFoundationAppBootstrapWiring = getFoundationAppBootstrapWiring;
function buildFoundationAlertRecentOperationFilterState(entry) {
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
function buildFoundationAlertTimelineFilterStateFromQuery(query) {
    return {
        action: query.action === 'ACK' || query.action === 'MUTE' || query.action === 'UNMUTE' ? query.action : 'ALL',
        source: query.source || 'ALL',
        owner: query.owner || 'ALL'
    };
}
function normalizeFoundationAlertTimelineFilterState(filters, options) {
    const availableOwners = new Set((options.availableOwners ?? []).map((item) => item || 'ALL').filter((item) => item !== 'ALL'));
    const availableSources = new Set((options.availableSources ?? []).map((item) => item || 'ALL').filter((item) => item !== 'ALL'));
    return {
        action: filters.action,
        owner: filters.owner !== 'ALL' && !availableOwners.has(filters.owner) ? 'ALL' : filters.owner,
        source: filters.source !== 'ALL' && !availableSources.has(filters.source) ? 'ALL' : filters.source
    };
}
function buildFoundationAlertTimelineFilterSearchParams(options) {
    const params = options.search instanceof URLSearchParams
        ? new URLSearchParams(options.search.toString())
        : new URLSearchParams(options.search ?? '');
    if (!options.filters.action || options.filters.action === 'ALL') {
        params.delete(options.queryKeys.action);
    }
    else {
        params.set(options.queryKeys.action, options.filters.action);
    }
    if (!options.filters.source || options.filters.source === 'ALL') {
        params.delete(options.queryKeys.source);
    }
    else {
        params.set(options.queryKeys.source, options.filters.source);
    }
    if (!options.filters.owner || options.filters.owner === 'ALL') {
        params.delete(options.queryKeys.owner);
    }
    else {
        params.set(options.queryKeys.owner, options.filters.owner);
    }
    return params;
}
function buildFoundationAlertTimelineFilterQueryPreview(queryKeys, filters) {
    const query = buildFoundationAlertTimelineFilterSearchParams({
        queryKeys,
        filters
    }).toString();
    return query ? `?${query}` : '(default)';
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
    return summary === '全部 timeline' ? context : `${context} / ${summary}`;
}
function buildFoundationAlertLinkedFocusSearchParams(options) {
    const params = buildFoundationAlertTimelineFilterSearchParams({
        search: options.search,
        queryKeys: options.queryKeys.timeline,
        filters: options.filters ??
            {
                action: 'ALL',
                source: 'ALL',
                owner: 'ALL'
            }
    });
    if (options.focusCode) {
        params.set(options.queryKeys.focus, options.focusCode);
    }
    else {
        params.delete(options.queryKeys.focus);
    }
    return params;
}
function filterFoundationAlertTimeline(history, filter = 'ALL') {
    if (!history?.length) {
        return [];
    }
    if (filter === 'ALL') {
        return history;
    }
    return history.filter((item) => item.action === filter);
}
function summarizeFoundationAlertOwners(history) {
    if (!history?.length) {
        return [];
    }
    const ownerMap = new Map();
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
function filterFoundationAlertTimelineByOwner(history, ownerFilter = 'ALL') {
    if (!history?.length) {
        return [];
    }
    if (ownerFilter === 'ALL') {
        return history;
    }
    return history.filter((item) => (item.actorId ?? '系统') === ownerFilter);
}
function filterFoundationAlertTimelineBySource(history, sourceFilter = 'ALL') {
    if (!history?.length) {
        return [];
    }
    if (sourceFilter === 'ALL') {
        return history;
    }
    return history.filter((item) => (item.source ?? 'unknown') === sourceFilter);
}
function summarizeFoundationAlertTimelineSources(history) {
    if (!history?.length) {
        return [];
    }
    const sourceMap = new Map();
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
    const owners = new Set(entries.map((item) => item.actorId ?? '系统'));
    const sources = summarizeFoundationAlertTimelineSources(entries);
    const actions = ['ACK', 'MUTE', 'UNMUTE'].map((action) => {
        const matched = entries.filter((item) => item.action === action);
        const latestMatched = findLatestFoundationAlertTimelineEntry(matched);
        return {
            action,
            count: matched.length,
            latestAt: latestMatched?.createdAt ?? null
        };
    });
    const dominantAction = actions
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
            return (Date.parse(right.latestAt ?? '1970-01-01T00:00:00.000Z') -
                Date.parse(left.latestAt ?? '1970-01-01T00:00:00.000Z'));
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
function listFoundationAlertTimelineActiveFilters(filters) {
    const chips = [];
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
function summarizeFoundationAlertTimelineFilters(filters) {
    const chips = listFoundationAlertTimelineActiveFilters(filters);
    if (chips.length === 0) {
        return '全部 timeline';
    }
    return chips.map((item) => item.label).join(' / ');
}
function isFoundationAlertTimelineFilterStateEqual(left, right) {
    return left.action === right.action && left.source === right.source && left.owner === right.owner;
}
function buildFoundationAlertTimelineEmptyState(filters) {
    const summary = summarizeFoundationAlertTimelineFilters(filters);
    if (summary === '全部 timeline') {
        return '当前筛选下没有匹配的 timeline 动作。可切换动作、来源或责任人继续排查。';
    }
    return `当前筛选下没有匹配的 timeline 动作。可清除 ${summary} 后继续排查。`;
}
function buildFoundationAlertTimelineShortcutPresets(history) {
    const entries = history ?? [];
    if (entries.length === 0) {
        return [];
    }
    const latest = findLatestFoundationAlertTimelineEntry(entries);
    const digest = summarizeFoundationAlertTimelineDigest(entries);
    const presets = [];
    const seenSummaries = new Set();
    function pushPreset(preset) {
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
function isFoundationAlertRuntimeCallbackStalledDetail(code, detail) {
    if (code !== 'runtime-callback-stalled' || !detail || typeof detail !== 'object') {
        return false;
    }
    const detailRecord = detail;
    const escalationSummary = detailRecord.escalationSummary;
    const timeoutThresholds = detailRecord.timeoutThresholds;
    return (typeof detailRecord.total === 'number' &&
        Array.isArray(detailRecord.receipts) &&
        Boolean(timeoutThresholds) &&
        typeof timeoutThresholds === 'object' &&
        typeof timeoutThresholds.low === 'number' &&
        typeof timeoutThresholds.medium === 'number' &&
        typeof timeoutThresholds.high === 'number' &&
        Boolean(escalationSummary) &&
        typeof escalationSummary === 'object' &&
        typeof escalationSummary.waitCallback === 'number' &&
        typeof escalationSummary.scheduleReplay === 'number' &&
        typeof escalationSummary.openManualReview === 'number');
}
function getFoundationAlertRuntimeCallbackStalledDetail(drilldown, code) {
    if (!drilldown) {
        return null;
    }
    const resolvedCode = code ?? drilldown.code;
    return isFoundationAlertRuntimeCallbackStalledDetail(resolvedCode, drilldown.detail) ? drilldown.detail : null;
}
function resolveFoundationAlertSelectedCode(alerts, options) {
    const resolvedCode = alerts.find((item) => item.code === options?.preferredCode)?.code ??
        alerts.find((item) => item.code === options?.currentCode)?.code;
    return resolvedCode ?? alerts[0]?.code ?? '';
}
function buildFoundationAlertPanelReadState(options) {
    const activeMutation = options.mutation?.code === options.selectedAlert?.code ? (options.mutation ?? null) : null;
    const recentTimeline = activeMutation?.history ?? options.drilldown?.history ?? [];
    return {
        activeMutation,
        recentTimeline,
        currentOwner: recentTimeline[0]?.actorId ??
            options.selectedAlert?.recentOperation?.actorId ??
            options.selectedAlert?.acknowledgement?.actorId ??
            options.drilldown?.acknowledgement?.actorId ??
            '系统',
        currentNote: recentTimeline[0]?.note ??
            options.selectedAlert?.recentOperation?.note ??
            options.drilldown?.acknowledgement?.note ??
            '暂无备注'
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
        hasActiveFilters: filterState.action !== 'ALL' || filterState.source !== 'ALL' || filterState.owner !== 'ALL'
    };
}
function buildFoundationAlertQuickSwitchItems(topRisks, alerts, limit = 5) {
    const picked = new Set();
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
        overviewVisibility: pendingMutationAction === 'MUTE'
            ? 'hidden (optimistic)'
            : pendingMutationAction === 'UNMUTE'
                ? 'visible (optimistic)'
                : options.visibleInOverview === false
                    ? 'hidden'
                    : 'visible',
        feedback: pendingMutationAction
            ? {
                title: `${pendingMutationAction} 正在提交`,
                description: pendingMutationAction === 'MUTE'
                    ? '预期该告警会先从 overview 隐藏，等待真实回包和回刷结果确认。'
                    : pendingMutationAction === 'UNMUTE'
                        ? '预期该告警会重新回到 overview，等待真实回包和回刷结果确认。'
                        : '预期 triage 会先转为已确认状态，等待真实回包和回刷结果确认。'
            }
            : null
    };
}
exports.runtimeGovernanceClientApps = ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app'];
exports.runtimeGovernanceActionKeys = [
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
];
exports.runtimeGovernanceApiActionKeys = [
    'approval-execution',
    'secret-rotation',
    'runtime-replay',
    'member-login',
    'coupon-claim',
    'booking-submit',
    'device-bind',
    'payment-submit'
];
exports.runtimeGovernanceNextSteps = ['PROCEED', 'LOGIN', 'CHALLENGE', 'REFRESH'];
exports.runtimeGovernanceRiskLevels = ['low', 'medium', 'high'];
exports.runtimeGovernanceRecommendedActions = [
    'REFRESH_BOOTSTRAP',
    'COMPLETE_LOGIN',
    'COMPLETE_CHALLENGE',
    'FOLLOW_SUBMIT_CALLBACK'
];
exports.runtimeGovernanceCallbackStatuses = ['callback-blocked', 'callback-recorded'];
exports.runtimeGovernanceCallbackReceiptStatuses = [
    'callback-blocked',
    'awaiting-callback',
    'callback-recorded'
];
exports.runtimeGovernanceCallbackEvents = [
    'PREREQUISITE_PENDING',
    'CHALLENGE_PENDING',
    'HANDLER_ACCEPTED',
    'HANDLER_COMPLETED'
];
exports.runtimeGovernanceCallbackTimeoutThresholds = {
    low: 15 * 60 * 1000,
    medium: 10 * 60 * 1000,
    high: 5 * 60 * 1000
};
exports.runtimeGovernanceCallbackStallEscalationActions = [
    'WAIT_CALLBACK',
    'SCHEDULE_REPLAY',
    'OPEN_MANUAL_REVIEW'
];
exports.runtimeGovernanceReplaySources = [
    'ADMIN_WEB_RUNTIME',
    'TOB_WEB_RUNTIME',
    'STOREFRONT_WEB_RUNTIME',
    'MINIAPP_RUNTIME',
    'APP_RUNTIME'
];
exports.runtimeGovernanceReplayEscalationActions = [
    'REFRESH_TICKET',
    'WAIT_CALLBACK',
    'OPEN_MANUAL_REVIEW'
];
function buildRuntimeGovernanceReplayEndpoint(receiptCode) {
    return `/api/v1/foundation/runtime-governance/actions/${receiptCode}/replay`;
}
function createRuntimeGovernanceReplayPolicy(receiptCode, state) {
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
function advanceRuntimeGovernanceReplayPolicy(policy) {
    const currentAttempt = Math.min(policy.currentAttempt + 1, policy.maxAttempts);
    const retryable = currentAttempt < policy.maxAttempts;
    return {
        currentAttempt,
        retryable,
        nextBackoffMs: retryable ? Math.max(policy.nextBackoffMs, 2000) + 2000 : 0,
        escalationAction: retryable ? 'WAIT_CALLBACK' : 'OPEN_MANUAL_REVIEW'
    };
}
function evaluateRuntimeGovernanceCallbackStall(receipt, options) {
    const timeoutMs = exports.runtimeGovernanceCallbackTimeoutThresholds[receipt.riskLevel];
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
        .find((event) => event.status === 'accepted' &&
        (event.eventType === 'runtime-governance.handler.sync.requested' ||
            event.eventType === 'runtime-governance.action.submitted'));
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
exports.foundationSupportedClients = ['PC', 'PAD', 'H5', 'MINIAPP', 'APP'];
exports.foundationAlertCatalogFallback = [
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
    }
];
exports.foundationBootstrapCapabilityRules = [
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
exports.foundationAppBootstrapProfiles = {
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
exports.foundationBootstrapContract = {
    version: '2026-06-task4',
    bootstrapEndpoint: '/api/v1/foundation/bootstrap',
    deliveredCapabilities: exports.foundationBootstrapCapabilityRules,
    appProfiles: exports.foundationAppBootstrapProfiles
};
function getFoundationAppBootstrapWiring(app) {
    return exports.foundationAppBootstrapProfiles[app];
}
//# sourceMappingURL=index.js.map