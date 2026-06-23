'use client';
import React from 'react';
import {
  buildFoundationAlertLinkedFocusContext,
  buildFoundationAlertLinkedFocusSearchParams,
  buildFoundationAlertTimelineFilterQueryPreview,
  buildFoundationAlertTimelineFilterStateFromQuery,
  isFoundationAlertTimelineFilterStateEqual,
  resolveFoundationAlertFocusCode,
  summarizeFoundationAlertTimelineFilters,
  type FoundationAlertLinkedFocusQueryKeys,
  type FoundationAlertTimelineFilterState,
} from '@m5/types';
import {
  SearchFilterInput as SharedSearchFilterInput,
  useSearchFilter as useDebouncedSearchFilter,
} from './SearchFilterInput';

/* ========== SearchFilter (compatible overload for linked-overview) ========== */

export function useSearchFilter<T>(
  items: T[],
  searchFields: Array<keyof T | string>
): {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filteredItems: T[];
  matchedCount: number;
  totalCount: number;
};
export function useSearchFilter(
  initialValue?: string,
  debounceMs?: number
): {
  value: string;
  debouncedValue: string;
  setValue: (value: string) => void;
};
export function useSearchFilter(...args: any[]) {
  // Overload 1: useSearchFilter(initialValue, debounceMs) -> { value, debouncedValue, setValue }
  // Overload 2: useSearchFilter(items, searchFields) -> { searchTerm, setSearchTerm, filteredItems, matchedCount, totalCount }
  if (Array.isArray(args[0])) {
    const items: any[] = args[0];
    const [searchTerm, setSearchTerm] = React.useState('');
    const filteredItems = React.useMemo(() => {
      if (!searchTerm.trim()) return items;
      const term = searchTerm.toLowerCase();
      return items.filter((item: any) => {
        const fields: string[] = args[1] ?? Object.keys(item);
        return fields.some((f) => String(item[f] ?? '').toLowerCase().includes(term));
      });
    }, [items, searchTerm, args]);
    return {
      searchTerm,
      setSearchTerm,
      filteredItems,
      matchedCount: filteredItems.length,
      totalCount: items.length,
    };
  }
  // Overload 1
  const initialValue: string = args[0] ?? '';
  const debounceMs: number = args[1] ?? 300;
  return useDebouncedSearchFilter(initialValue, debounceMs);
}

export function SearchFilterInput(props: any): React.ReactElement {
  return React.createElement(SharedSearchFilterInput, { width: '100%', ...props });
}

/* ========== Linked Overview Stubs ========== */

const DEFAULT_FILTERS: FoundationAlertTimelineFilterState = {
  action: 'ALL',
  source: 'ALL',
  owner: 'ALL',
};

function toSearchParams(value: unknown): URLSearchParams {
  if (value instanceof URLSearchParams) {
    return new URLSearchParams(value.toString());
  }
  if (typeof value === 'string') {
    return new URLSearchParams(value);
  }
  if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
    return new URLSearchParams(value.toString());
  }
  return new URLSearchParams();
}

function buildFocusQueryKeys(focusQueryKey = 'alert'): FoundationAlertLinkedFocusQueryKeys {
  return {
    focus: focusQueryKey,
    timeline: {
      action: `${focusQueryKey}Action`,
      source: `${focusQueryKey}Source`,
      owner: `${focusQueryKey}Owner`,
    },
  };
}

async function writeTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

function renderMetaLine(line: string, index: number) {
  return React.createElement(
    'div',
    {
      key: `${line}-${index}`,
      style: { fontSize: 12, color: '#94a3b8', lineHeight: 1.5 },
    },
    line
  );
}

export function FoundationAlertLinkedAlertGridReadout(props: any) {
  const { palette, title, emptyText, items = [], variant = 'catalog', onSelect } = props;
  const accentBorder =
    variant === 'risk' ? palette?.riskCardBorder ?? 'rgba(96,165,250,0.2)' : palette?.catalogActiveBorder ?? 'rgba(96,165,250,0.2)';
  const accentBackground =
    variant === 'risk' ? palette?.riskCardBackground ?? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.28)';

  return React.createElement(
    'section',
    { style: { marginTop: 16 } },
    title
      ? React.createElement(
          'div',
          { style: { fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 } },
          title
        )
      : null,
    items.length === 0
      ? React.createElement(
          'div',
          {
            style: {
              borderRadius: 14,
              padding: 18,
              border: `1px dashed ${accentBorder}`,
              color: '#94a3b8',
              background: 'rgba(15,23,42,0.18)',
              fontSize: 13,
            },
          },
          emptyText ?? '暂无可展示的告警'
        )
      : React.createElement(
          'div',
          {
            style: {
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            },
          },
          ...items.map((item: any) =>
            React.createElement(
              'button',
              {
                key: item.key,
                type: 'button',
                onClick: () => onSelect?.(item.key),
                style: {
                  textAlign: 'left',
                  borderRadius: 14,
                  padding: 16,
                  border: item.isActive
                    ? `1px solid ${
                        variant === 'risk'
                          ? palette?.riskActiveBorder ?? 'rgba(147,197,253,0.82)'
                          : palette?.catalogActiveBorder ?? 'rgba(96,165,250,0.82)'
                      }`
                    : `1px solid ${accentBorder}`,
                  background: item.isActive
                    ? variant === 'risk'
                      ? palette?.riskActiveBackground ?? 'rgba(37,99,235,0.2)'
                      : palette?.catalogActiveBackground ?? 'rgba(30,64,175,0.16)'
                    : accentBackground,
                  color: '#e2e8f0',
                  cursor: 'pointer',
                },
              },
              React.createElement(
                'div',
                { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 } },
                React.createElement(
                  'div',
                  null,
                  React.createElement(
                    'div',
                    { style: { fontWeight: 700, fontSize: 14, color: palette?.accentText ?? '#93c5fd' } },
                    item.code ?? item.key
                  ),
                  React.createElement(
                    'div',
                    { style: { marginTop: 6, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 } },
                    item.summary ?? item.accent ?? ''
                  )
                ),
                item.isActive
                  ? React.createElement(
                      'span',
                      {
                        style: {
                          fontSize: 11,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: 'rgba(96,165,250,0.16)',
                          color: '#dbeafe',
                          whiteSpace: 'nowrap',
                        },
                      },
                      '已聚焦'
                    )
                  : null
              ),
              item.accent
                ? React.createElement(
                    'div',
                    { style: { marginTop: 10, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 } },
                    item.accent
                  )
                : null,
              item.metaLines?.length
                ? React.createElement(
                    'div',
                    { style: { marginTop: 10, display: 'grid', gap: 4 } },
                    ...item.metaLines.map(renderMetaLine)
                  )
                : null
            )
          )
        )
  );
}

export function FoundationAlertLinkedFocusBarReadout(props: any) {
  const {
    palette,
    focusQueryLabel,
    linkedFilterSummary,
    linkedFilterQueryPreview,
    shareStatus,
    hasLinkedFilters,
    onCopyFocusLink,
    onClearLinkedTriage,
    emptyShareStatus,
  } = props;

  const buttonStyle: React.CSSProperties = {
    borderRadius: 8,
    border: `1px solid ${palette?.actionButtonBorder ?? 'rgba(96,165,250,0.28)'}`,
    background: palette?.actionButtonBackground ?? 'rgba(37,99,235,0.18)',
    color: palette?.actionButtonText ?? '#dbeafe',
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  };

  return React.createElement(
    'section',
    {
      style: {
        borderRadius: 14,
        padding: 16,
        background: palette?.focusBannerBackground ?? 'rgba(30,41,59,0.5)',
        border: `1px solid ${palette?.focusBannerBorder ?? 'rgba(96,165,250,0.18)'}`,
      },
    },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' } },
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { style: { fontSize: 13, fontWeight: 700, color: '#e2e8f0' } },
          `当前聚焦 ${focusQueryLabel ?? '?alert=none'}`
        ),
        React.createElement(
          'div',
          { style: { marginTop: 6, fontSize: 12, color: palette?.accentText ?? '#93c5fd' } },
          hasLinkedFilters ? linkedFilterSummary ?? '已挂载联动筛选' : '全部 timeline'
        ),
        React.createElement(
          'div',
          { style: { marginTop: 4, fontSize: 12, color: '#94a3b8' } },
          linkedFilterQueryPreview ?? '(default)'
        )
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => void onCopyFocusLink?.(),
            style: buttonStyle,
          },
          '复制联动链接'
        ),
        hasLinkedFilters
          ? React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => onClearLinkedTriage?.(),
                style: {
                  ...buttonStyle,
                  background: 'rgba(15,23,42,0.2)',
                  color: '#cbd5e1',
                },
              },
              '清空联动'
            )
          : null
      )
    ),
    React.createElement(
      'div',
      {
        style: {
          marginTop: 10,
          fontSize: 12,
          color: shareStatus ? '#4ade80' : '#94a3b8',
        },
      },
      shareStatus ?? emptyShareStatus ?? '复制链接后可在其他页面还原当前聚焦状态'
    )
  );
}

export function FoundationAlertLinkedOverviewStatsReadout(props: any) {
  const { palette, items = [], onSelect } = props;
  return React.createElement(
    'div',
    {
      style: {
        marginTop: 16,
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      },
    },
    ...items.map((item: any) =>
      React.createElement(
        'button',
        {
          key: item.key,
          type: 'button',
          onClick: () => onSelect?.(item.key),
          style: {
            textAlign: 'left',
            borderRadius: 14,
            padding: 16,
            border: item.isActive
              ? `1px solid ${palette?.overviewActiveBorder ?? 'rgba(147,197,253,0.8)'}`
              : '1px solid rgba(148,163,184,0.14)',
            background: item.isActive
              ? palette?.overviewActiveBackground ?? 'rgba(30,41,59,0.72)'
              : 'rgba(15,23,42,0.24)',
            cursor: 'pointer',
            color: '#e2e8f0',
          },
        },
        React.createElement('div', { style: { fontSize: 12, color: '#94a3b8' } }, item.label),
        React.createElement('div', { style: { marginTop: 8, fontSize: 26, fontWeight: 700 } }, item.value),
        React.createElement(
          'div',
          { style: { marginTop: 8, fontSize: 12, color: palette?.accentText ?? '#93c5fd', lineHeight: 1.5 } },
          item.helper
        )
      )
    )
  );
}

export function createFoundationAlertNextNavigationBindings(opts: any) {
  return {
    router: opts?.router ?? { push: () => {}, replace: () => {} },
    pathname: opts?.pathname ?? '/',
    searchParams: toSearchParams(opts?.searchParams),
    push: (...args: unknown[]) => opts?.push?.(...args) ?? opts?.router?.push?.(...args),
    replace: (...args: unknown[]) => opts?.replace?.(...args) ?? opts?.router?.replace?.(...args),
  };
}

export function useFoundationAlertLinkedFocusQuery(opts: any) {
  const focusQueryKey = opts?.focusQueryKey ?? 'alert';
  const queryKeys = React.useMemo(() => buildFocusQueryKeys(focusQueryKey), [focusQueryKey]);
  const searchParams = React.useMemo(() => toSearchParams(opts?.searchParams), [opts?.searchParams]);
  const searchSnapshot = searchParams.toString();

  const resolveStateFromSearch = React.useCallback(() => {
    const params = toSearchParams(opts?.searchParams);
    const filters = buildFoundationAlertTimelineFilterStateFromQuery({
      action: params.get(queryKeys.timeline.action),
      source: params.get(queryKeys.timeline.source),
      owner: params.get(queryKeys.timeline.owner),
    });
    const resolvedFocus =
      resolveFoundationAlertFocusCode(params.get(queryKeys.focus), opts?.candidateGroups ?? []) ??
      opts?.defaultFocusCode ??
      '';

    return {
      filters,
      focusCode: resolvedFocus,
      fromQuery: params.has(queryKeys.focus),
    };
  }, [opts?.candidateGroups, opts?.defaultFocusCode, opts?.searchParams, queryKeys]);

  const initialState = React.useMemo(() => resolveStateFromSearch(), [resolveStateFromSearch]);
  const [focusAlertCode, setFocusAlertCode] = React.useState(initialState.focusCode);
  const [linkedFilters, setLinkedFilters] = React.useState<FoundationAlertTimelineFilterState>(initialState.filters);
  const [focusContext, setFocusContext] = React.useState(() =>
    initialState.fromQuery
      ? buildFoundationAlertLinkedFocusContext(`URL 聚焦 / ${initialState.focusCode || 'none'}`, initialState.filters)
      : (opts?.defaultFocusContext ?? '')
  );
  const [shareStatus, setShareStatus] = React.useState<string | undefined>();

  const replaceUrl = React.useCallback(
    (nextFocusCode: string, nextFilters: FoundationAlertTimelineFilterState) => {
      const nextParams = buildFoundationAlertLinkedFocusSearchParams({
        search: opts?.searchParams,
        queryKeys,
        focusCode: nextFocusCode || null,
        filters: nextFilters,
      });
      const query = nextParams.toString();
      const nextUrl = query ? `${opts?.pathname ?? '/'}?${query}` : (opts?.pathname ?? '/');
      opts?.replace?.(nextUrl);
    },
    [opts?.pathname, opts?.replace, opts?.searchParams, queryKeys]
  );

  React.useEffect(() => {
    const nextState = resolveStateFromSearch();
    if (nextState.focusCode !== focusAlertCode) {
      setFocusAlertCode(nextState.focusCode);
    }
    if (!isFoundationAlertTimelineFilterStateEqual(nextState.filters, linkedFilters)) {
      setLinkedFilters(nextState.filters);
    }
    setFocusContext(
      nextState.fromQuery
        ? buildFoundationAlertLinkedFocusContext(`URL 聚焦 / ${nextState.focusCode || 'none'}`, nextState.filters)
        : (opts?.defaultFocusContext ?? '')
    );
    if (nextState.fromQuery && opts?.panelRef?.current) {
      opts.panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusAlertCode, linkedFilters, opts?.defaultFocusContext, opts?.panelRef, resolveStateFromSearch, searchSnapshot]);

  const activateFocus = React.useCallback(
    (code: string, ctx: string, filters?: FoundationAlertTimelineFilterState) => {
      const nextFilters = filters ?? DEFAULT_FILTERS;
      setFocusAlertCode(code);
      setLinkedFilters(nextFilters);
      setFocusContext(buildFoundationAlertLinkedFocusContext(ctx, nextFilters));
      setShareStatus(undefined);
      replaceUrl(code, nextFilters);
    },
    [replaceUrl]
  );

  const clearLinkedTriage = React.useCallback(() => {
    setLinkedFilters(DEFAULT_FILTERS);
    setFocusContext(buildFoundationAlertLinkedFocusContext(`联动已清空 / ${focusAlertCode || 'none'}`, DEFAULT_FILTERS));
    setShareStatus(undefined);
    replaceUrl(focusAlertCode, DEFAULT_FILTERS);
  }, [focusAlertCode, replaceUrl]);

  const copyFocusLink = React.useCallback(async () => {
    const params = buildFoundationAlertLinkedFocusSearchParams({
      search: opts?.searchParams,
      queryKeys,
      focusCode: focusAlertCode || null,
      filters: linkedFilters,
    });
    const query = params.toString();
    const path = query ? `${opts?.pathname ?? '/'}?${query}` : (opts?.pathname ?? '/');
    const target =
      typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;
    const copied = typeof navigator !== 'undefined' && typeof document !== 'undefined'
      ? await writeTextToClipboard(target)
      : false;
    setShareStatus(copied ? '已复制联动链接' : '复制失败，请手动复制当前地址');
  }, [focusAlertCode, linkedFilters, opts?.pathname, opts?.searchParams, queryKeys]);

  const handlePanelFocusChange = React.useCallback(
    (code: string, ctx: string) => {
      setFocusAlertCode(code);
      setFocusContext(buildFoundationAlertLinkedFocusContext(ctx, linkedFilters));
      setShareStatus(undefined);
      replaceUrl(code, linkedFilters);
    },
    [linkedFilters, replaceUrl]
  );

  const linkedFilterSummary = React.useMemo(
    () => summarizeFoundationAlertTimelineFilters(linkedFilters),
    [linkedFilters]
  );
  const hasLinkedFilters = linkedFilterSummary !== '全部 timeline';
  const linkedFilterQueryPreview = React.useMemo(
    () => buildFoundationAlertTimelineFilterQueryPreview(queryKeys.timeline, linkedFilters),
    [linkedFilters, queryKeys]
  );

  return {
    activateFocus,
    clearLinkedTriage,
    copyFocusLink,
    focusAlertCode,
    focusContext,
    handlePanelFocusChange,
    hasLinkedFilters,
    linkedFilterQueryPreview,
    linkedFilterSummary,
    shareStatus,
  };
}

/* ========== Runtime Governance Stubs ========== */

export function canReplayRuntimePanelAction(_receipt: any, _extraCheck?: (receipt: any) => boolean): boolean {
  const base = _receipt?.ledger?.replayable ?? false;
  if (base && _extraCheck) return _extraCheck(_receipt);
  return base;
}

export function createRuntimeReceiptStatusCardProps(_opts: any) {
  const receipt = _opts?.receipt ?? null;
  return {
    receipt,
    summary: receipt ? _opts?.summarize?.(receipt) ?? '' : '暂无 receipt，可先执行 submit 获取真实闭环状态。',
    scopeLabel: _opts?.scopeLabel ?? '',
    metaLabel: _opts?.metaLabel,
    eventCount: Array.isArray(receipt?.events) ? receipt.events.length : 0,
  };
}

export function createRuntimeOperationToolbarProps(_opts: any) {
  const canReplay =
    typeof _opts?.canReplay === 'function' ? _opts.canReplay(_opts?.receipt) : Boolean(_opts?.canReplay);
  return {
    onSubmit: _opts?.onSubmit ?? (() => {}),
    onQuery: _opts?.onQuery ?? (() => {}),
    onReplay: _opts?.onReplay ?? (() => {}),
    disableSubmit: _opts?.disableSubmit ?? Boolean(_opts?.pendingOperation),
    disableQuery: _opts?.disableQuery ?? (!_opts?.receipt || Boolean(_opts?.pendingOperation)),
    disableReplay: _opts?.disableReplay ?? (!canReplay || Boolean(_opts?.pendingOperation)),
    canReplay,
    pendingOperation: _opts?.pendingOperation ?? null,
    receipt: _opts?.receipt ?? null,
  };
}

export function hasRuntimePanelReceiptCode(_receipt: any): boolean {
  return !!(_receipt && typeof _receipt === 'object' && 'receiptCode' in _receipt);
}

export function RuntimeOperationToolbar(props: any) {
  const { onSubmit, onQuery, onReplay, pendingOperation, disableSubmit, disableQuery, disableReplay, canReplay } = props;
  const buttonStyle = (tone: 'primary' | 'secondary' | 'warn'): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: 8,
    border: tone === 'primary' ? 'none' : '1px solid rgba(148,163,184,0.16)',
    background:
      tone === 'primary' ? 'rgba(37,99,235,0.9)' : tone === 'warn' ? 'rgba(245,158,11,0.15)' : 'rgba(15,23,42,0.32)',
    color: tone === 'primary' ? '#f8fafc' : tone === 'warn' ? '#fcd34d' : '#cbd5e1',
    fontSize: 12,
    cursor: 'pointer',
  });

  return React.createElement(
    'div',
    {
      'data-testid': 'runtime-operation-toolbar',
      style: {
        marginTop: 16,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
      },
    },
    React.createElement(
      'button',
      { onClick: onSubmit, disabled: disableSubmit, style: buttonStyle('primary') },
      pendingOperation === 'submit' ? '提交中...' : '提交 Runtime'
    ),
    React.createElement(
      'button',
      { onClick: onQuery, disabled: disableQuery, style: buttonStyle('secondary') },
      pendingOperation === 'query' ? '查询中...' : '查询'
    ),
    canReplay
      ? React.createElement(
          'button',
          { onClick: onReplay, disabled: disableReplay, style: buttonStyle('warn') },
          pendingOperation === 'replay' ? '重放中...' : '重放'
        )
      : null
  );
}

export function RuntimePanelFeedback(props: any) {
  const { message, receipt, actionError } = props;
  return React.createElement(
    'div',
    {
      'data-testid': 'runtime-panel-feedback',
      style: {
        marginTop: 16,
        borderRadius: 14,
        padding: 14,
        background: actionError ? 'rgba(127,29,29,0.22)' : 'rgba(15,23,42,0.24)',
        border: actionError ? '1px solid rgba(248,113,113,0.24)' : '1px solid rgba(148,163,184,0.14)',
      },
    },
    message
      ? React.createElement('p', { className: 'feedback-message', style: { margin: 0, fontSize: 13, color: '#e2e8f0' } }, message)
      : null,
    receipt
      ? React.createElement(
          'p',
          { className: 'feedback-receipt', style: { margin: '8px 0 0', fontSize: 12, color: '#93c5fd' } },
          `最近 receipt：${String(receipt.receiptCode ?? '')} / ${String(receipt.state ?? 'unknown')}`
        )
      : null,
    actionError
      ? React.createElement('p', { className: 'feedback-error', style: { margin: '8px 0 0', fontSize: 12, color: '#fca5a5' } }, actionError)
      : null
  );
}

export function RuntimePanelFrame(props: any) {
  const { scopeSummary, children } = props;
  return React.createElement(
    'section',
    {
      'data-testid': 'runtime-panel-frame',
      style: {
        borderRadius: 18,
        padding: 20,
        background: 'rgba(15,23,42,0.34)',
        border: '1px solid rgba(148,163,184,0.16)',
        color: '#f8fafc',
      },
    },
    React.createElement('h2', { style: { margin: 0, fontSize: 18, fontWeight: 700 } }, '真实 Runtime 闭环'),
    React.createElement('p', { className: 'scope-summary', style: { margin: '8px 0 0', fontSize: 13, color: '#94a3b8' } }, scopeSummary ?? ''),
    ...React.Children.toArray(children ?? [])
  );
}

export function RuntimePanelGrid(_props: any) {
  return React.createElement(
    'div',
    {
      style: {
        display: 'grid',
        gap: 16,
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        marginTop: 16,
      },
    },
    ...React.Children.toArray(_props?.children ?? [])
  );
}

export function joinRuntimeScopeSummary(parts: string[], _opts?: any): string {
  const summary = parts.filter(Boolean).join(' / ');
  return _opts?.prefix ? `${_opts.prefix}${summary}` : summary;
}

export function useRuntimePresetSelection<T>(presets?: readonly T[] | T[], defaultKey?: string) {
  const [selectedAction, setSelectedAction] = React.useState<string>(defaultKey ?? '');
  const activePreset = React.useMemo(() => {
    if (!presets || !Array.isArray(presets)) return (presets as any) ?? null;
    return (presets as any[]).find((p: any) => p?.key === selectedAction) ?? presets?.[0] ?? null;
  }, [presets, selectedAction]);
  return {
    selectedAction,
    setSelectedAction,
    activePreset,
  };
}

export function useRuntimePanelState<T = any>(defaultMessage?: string) {
  const [receipt, setReceipt] = React.useState<T | null>(null);
  const [pendingOperation, setPendingOperation] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(defaultMessage ?? null);
  const runOperation = React.useCallback(async (operation: string, fn: () => Promise<any>) => {
    setPendingOperation(operation);
    setActionError(null);
    try {
      const result = await fn();
      setReceipt(result);
      setMessage(`操作 ${operation} 完成`);
    } catch (err: any) {
      setActionError(err?.message ?? String(err));
      setMessage(`操作 ${operation} 失败`);
    } finally {
      setPendingOperation(null);
    }
  }, []);
  return {
    receipt,
    setReceipt,
    pendingOperation,
    setPendingOperation,
    actionError,
    setActionError,
    message,
    setMessage,
    runOperation,
  };
}

export function RuntimePresetCard(props: any) {
  const { preset } = props;
  return React.createElement(
    'div',
    {
      'data-testid': 'runtime-preset-card',
      style: {
        borderRadius: 14,
        padding: 16,
        background: 'rgba(30,41,59,0.5)',
        border: '1px solid rgba(96,165,250,0.14)',
      },
    },
    preset
      ? [
          React.createElement('div', { key: 'label', style: { fontSize: 16, fontWeight: 700, color: '#e2e8f0' } }, preset.label ?? preset.scenario ?? ''),
          React.createElement('div', { key: 'scenario', style: { marginTop: 8, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 } }, preset.scenario ?? ''),
          React.createElement('div', { key: 'risk', style: { marginTop: 10, fontSize: 12, color: '#fcd34d' } }, `风险级别：${preset.riskLevel ?? 'unknown'}`),
          React.createElement('div', { key: 'next-step', style: { marginTop: 4, fontSize: 12, color: '#94a3b8' } }, `下一步：${preset.nextStep ?? '-'}`),
          React.createElement('div', { key: 'recommend', style: { marginTop: 4, fontSize: 12, color: '#94a3b8' } }, `建议动作：${preset.recommendedAction ?? '-'}`),
          preset.requestEndpoint
            ? React.createElement('div', { key: 'endpoint', style: { marginTop: 8, fontSize: 12, color: '#93c5fd', wordBreak: 'break-all' } }, preset.requestEndpoint)
            : null,
        ]
      : null
  );
}

export function RuntimePresetSelector(props: any) {
  const { options, selectedKey, onSelect } = props;
  return React.createElement(
    'div',
    {
      'data-testid': 'runtime-preset-selector',
      style: {
        marginTop: 16,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      },
    },
    ...(options ?? []).map((opt: any, idx: number) =>
      React.createElement(
        'button',
        {
          type: 'button',
          key: opt.key ?? idx,
          className: opt.key === selectedKey ? 'selected' : '',
          onClick: () => onSelect?.(opt.key),
          style: {
            padding: '8px 12px',
            borderRadius: 999,
            border: opt.key === selectedKey ? '1px solid rgba(147,197,253,0.8)' : '1px solid rgba(148,163,184,0.14)',
            background: opt.key === selectedKey ? 'rgba(30,64,175,0.22)' : 'rgba(15,23,42,0.22)',
            color: opt.key === selectedKey ? '#dbeafe' : '#cbd5e1',
            fontSize: 12,
            cursor: 'pointer',
          },
        },
        opt.label ?? opt.key
      )
    )
  );
}

export function RuntimeReceiptStatusCard(props: any) {
  const { receipt, summary, scopeLabel, eventCount } = props;
  return React.createElement(
    'div',
    {
      'data-testid': 'runtime-receipt-status-card',
      style: {
        borderRadius: 14,
        padding: 16,
        background: 'rgba(30,41,59,0.42)',
        border: '1px solid rgba(148,163,184,0.14)',
      },
    },
    React.createElement('h3', { style: { margin: 0, fontSize: 15, fontWeight: 700, color: '#e2e8f0' } }, '最近 Receipt'),
    React.createElement('p', { className: 'receipt-summary', style: { margin: '10px 0 0', fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 } }, summary ?? '暂无'),
    React.createElement('p', { className: 'receipt-scope', style: { margin: '8px 0 0', fontSize: 12, color: '#94a3b8' } }, scopeLabel ?? ''),
    receipt
      ? React.createElement(
          'div',
          { style: { marginTop: 10, display: 'grid', gap: 4, fontSize: 12, color: '#93c5fd' } },
          React.createElement('div', { key: 'code' }, `receiptCode: ${receipt.receiptCode ?? '-'}`),
          React.createElement('div', { key: 'state' }, `state: ${receipt.state ?? '-'}`),
          React.createElement('div', { key: 'ticket' }, `ticket: ${receipt.ticket?.status ?? '-'}`),
          React.createElement('div', { key: 'callback' }, `callback: ${receipt.callback?.callbackStatus ?? '-'}`),
          React.createElement('div', { key: 'events' }, `events: ${eventCount ?? 0}`)
        )
      : null
  );
}

export async function executeRuntimePanelOperation(_opts: any): Promise<any> {
  try {
    return await _opts?.run?.();
  } catch (error: any) {
    if (_opts?.errorMessage) {
      throw new Error(`${_opts.errorMessage}${error?.message ? ` (${error.message})` : ''}`);
    }
    throw error;
  }
}

/* ========== DataTable sorting ========== */

export interface DataTableSortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function useSortedItems<T>(items: T[] | undefined | null, _columns: any[], sortConfig: DataTableSortConfig | null): T[] {
  return React.useMemo(() => {
    if (!items || !items.length) return (items ?? []) as T[];
    if (!sortConfig) return items;
    const sorted = [...items].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [items, sortConfig]);
}

/* ========== Portal List ========== */

export interface PortalListItemView {
  id: string;
  label: string;
  subtitle?: string;
  status?: string;
  meta?: string;
}

interface PortalListProps {
  portals: PortalListItemView[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function PortalList({
  portals,
  searchPlaceholder = '搜索门户...',
  emptyTitle = '暂无门户',
  emptyDescription = '没有可用的门户数据。',
}: PortalListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!searchTerm.trim()) return portals;
    const term = searchTerm.toLowerCase();
    return portals.filter(
      (p) =>
        p.label.toLowerCase().includes(term) ||
        (p.subtitle ?? '').toLowerCase().includes(term) ||
        (p.meta ?? '').toLowerCase().includes(term)
    );
  }, [portals, searchTerm]);

  if (portals.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          padding: 48,
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>
          {emptyTitle}
        </div>
        <div style={{ fontSize: 14, color: '#64748b' }}>{emptyDescription}</div>
      </div>
    );
  }

  return (
    <div>
      {/* 搜索框 */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={searchPlaceholder}
          style={searchInputStyle}
        />
      </div>

      {/* 搜索结果提示 */}
      {searchTerm.trim() && (
        <div
          style={{
            fontSize: 13,
            color: '#94a3b8',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>
            搜索 "{searchTerm}" 匹配 {filtered.length} 条结果
          </span>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{
              fontSize: 12,
              color: '#93c5fd',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            清除
          </button>
        </div>
      )}

      {/* 无匹配结果 */}
      {filtered.length === 0 ? (
        <div
          style={{
            borderRadius: 16,
            padding: 48,
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.3)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8' }}>
            无匹配结果
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>
            尝试其他关键词
          </div>
        </div>
      ) : (
        /* 门户卡片网格 */
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          }}
        >
          {filtered.map((portal) => (
            <article
              key={portal.id}
              style={cardStyle}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>
                  {portal.label}
                </div>
                {portal.status ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 6,
                      background: 'rgba(74, 222, 128, 0.12)',
                      color: '#4ade80',
                    }}
                  >
                    {portal.status}
                  </span>
                ) : null}
              </div>
              {portal.subtitle ? (
                <div style={{ marginTop: 6, fontSize: 13, color: '#94a3b8' }}>
                  {portal.subtitle}
                </div>
              ) : null}
              {portal.meta ? (
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  {portal.meta}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      {/* 统计底栏 */}
      <div
        style={{
          marginTop: 16,
          padding: '10px 0',
          fontSize: 12,
          color: '#64748b',
          textAlign: 'right',
          borderTop: '1px solid rgba(148, 163, 184, 0.08)',
        }}
      >
        共 {portals.length} 个门户{searchTerm.trim() ? ` · 显示 ${filtered.length} 个` : ''}
      </div>
    </div>
  );
}

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  padding: '12px 16px',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const cardStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  transition: 'border-color 0.15s, background 0.15s',
};

/* ========== Additional stubs for store-showcase ========== */

export function formatRuntimeCallbackStalledDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export function describeRuntimeCallbackStalledEscalation(action: string): string {
  const map: Record<string, string> = {
    SCHEDULE_REPLAY: '进入 replay',
    OPEN_MANUAL_REVIEW: '转人工复核',
    WAIT_CALLBACK: '继续等待 callback',
  };
  return map[action] ?? action;
}

export function FoundationAlertRuntimeCallbackStalledReadout(_props: any) {
  return React.createElement('div', null);
}

export function summarizeRuntimePanelReceipt(receipt: any): string {
  return `${receipt?.action ?? 'unknown'} -> ${receipt?.state ?? 'unknown'} / ticket ${receipt?.ticket?.status ?? 'unknown'} / callback ${receipt?.callback?.callbackStatus ?? 'unknown'} / replay ${receipt?.ledger?.replayable ? 'ready' : 'not-ready'}`;
}

export function canReplayRuntimePanelReceipt(receipt: any): boolean {
  return receipt?.ledger?.replayable ?? false;
}

export function getRuntimePanelTenantId(receipt: any): string {
  return receipt?.rateLimit?.scopeKey?.split(':').slice(-1)[0] ?? 'unknown';
}

export function createRuntimeReceiptStatusCard(_opts: any) {
  return React.createElement(RuntimeReceiptStatusCard, createRuntimeReceiptStatusCardProps(_opts));
}

export function RuntimeReceiptEvents(_props: any) {
  const events = _props?.events ?? _props?.receipt?.events ?? [];
  return React.createElement(
    'div',
    {
      style: {
        marginTop: 12,
        display: 'grid',
        gap: 6,
      },
    },
    events.length === 0
      ? React.createElement('div', { style: { fontSize: 12, color: '#64748b' } }, '暂无 receipt events')
      : events.map((event: any, index: number) =>
          React.createElement(
            'div',
            {
              key: `${event.type ?? 'event'}-${index}`,
              style: {
                borderRadius: 10,
                padding: '8px 10px',
                background: 'rgba(15,23,42,0.24)',
                border: '1px solid rgba(148,163,184,0.12)',
                fontSize: 12,
                color: '#cbd5e1',
              },
            },
            `${event.type ?? 'unknown'} @ ${event.createdAt ?? '-'}`
          )
        )
  );
}

export function refreshFoundationAlertSelection(_opts: any): string {
  if (_opts?.alerts?.some((a: any) => a.code === _opts?.nextSelectedCode)) {
    return _opts?.nextSelectedCode;
  }
  return _opts?.currentSelectedCode ?? '';
}
