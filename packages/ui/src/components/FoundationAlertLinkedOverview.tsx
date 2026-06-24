'use client';
import React, { useMemo, useRef } from 'react';
import {
  buildFoundationAlertRecentOperationFilterState,
  type FoundationAlertCode,
  type FoundationAlertTimelineEntry,
} from '@m5/types';
import {
  FoundationAlertLinkedAlertGridReadout,
  FoundationAlertLinkedFocusBarReadout,
  FoundationAlertLinkedOverviewStatsReadout,
  SearchFilterInput,
  createFoundationAlertNextNavigationBindings,
  useSearchFilter,
  useFoundationAlertLinkedFocusQuery,
} from './LinkedOverviewStubs';

interface FoundationAlertAcknowledgementLike {
  actorId?: string | null;
}

interface FoundationAlertItemLike {
  code: FoundationAlertCode;
  triageSummary?: string;
  triageState?: string;
  recentOperation?: FoundationAlertTimelineEntry | null;
  defaultSummary?: string;
}

interface FoundationAlertTopRiskItemLike extends FoundationAlertItemLike {
  summary: string;
  count: number;
  acknowledgement?: FoundationAlertAcknowledgementLike | null;
}

interface FoundationAlertGovernanceReadModelLike {
  topRisks: FoundationAlertTopRiskItemLike[];
  overviewAlerts: FoundationAlertItemLike[];
  alerts: FoundationAlertItemLike[];
}

interface NavigationBindingsLike {
  searchParams: unknown;
  pathname: string;
  replace: (...args: unknown[]) => void;
}

export interface FoundationAlertLinkedOverviewCardDefinition {
  label: string;
  value: string;
  helper: string;
  preferredCodes: FoundationAlertCode[];
}

export interface FoundationAlertLinkedOverviewSummaryLike {
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
}

export type FoundationAlertLinkedOverviewStatsPreset = 'admin' | 'tob' | 'storefront';

export interface FoundationAlertLinkedOverviewPalette {
  accentText: string;
  focusBannerBackground: string;
  focusBannerBorder: string;
  actionButtonBorder: string;
  actionButtonBackground: string;
  actionButtonText: string;
  overviewActiveBorder: string;
  overviewActiveBackground: string;
  riskCardBorder: string;
  riskCardBackground: string;
  riskActiveBorder: string;
  riskActiveBackground: string;
  catalogActiveBorder: string;
  catalogActiveBackground: string;
}

interface SearchConfig {
  enabled?: boolean;
  placeholder?: string;
  statusColor?: string;
}

export interface FoundationAlertLinkedOverviewPanelRenderArgs {
  focusAlertCode: string;
  focusContext: string;
  timelineQueryKey: string;
  ownerQueryKey: string;
  onFocusChange: (code: string, context: string) => void;
}

export interface FoundationAlertLinkedOverviewSectionProps {
  governance: FoundationAlertGovernanceReadModelLike;
  navigationBindings: NavigationBindingsLike;
  palette: FoundationAlertLinkedOverviewPalette;
  overviewStats: FoundationAlertLinkedOverviewCardDefinition[];
  focusQueryKey?: string;
  title?: string;
  description?: string;
  sectionStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  descriptionStyle?: React.CSSProperties;
  defaultFocusContextPrefix?: string;
  search?: SearchConfig;
  topRisksTitle?: string;
  catalogTitle?: string;
  topRisksEmptyText?: string;
  catalogEmptyText?: string;
  emptyShareStatus?: string;
  buildTopRiskMetaLines?: (item: FoundationAlertTopRiskItemLike) => string[];
  buildCatalogMetaLines?: (item: FoundationAlertItemLike) => string[];
  renderPanel: (args: FoundationAlertLinkedOverviewPanelRenderArgs) => React.ReactNode;
}

export interface FoundationAlertLinkedOverviewSurfaceProps
  extends Omit<FoundationAlertLinkedOverviewSectionProps, 'navigationBindings'> {
  router?: unknown;
  pathname?: string;
  searchParams?: unknown;
}

interface SearchableAlert {
  code: string;
  summary?: string;
  triageSummary?: string;
  triageState?: string;
}

function renderSectionShell(
  hasShell: boolean,
  title: string | undefined,
  description: string | undefined,
  titleStyle: React.CSSProperties | undefined,
  descriptionStyle: React.CSSProperties | undefined,
  sectionStyle: React.CSSProperties | undefined,
  children: React.ReactNode
) {
  if (!hasShell) {
    return <>{children}</>;
  }

  return (
    <section style={sectionStyle}>
      {title ? <div style={titleStyle}>{title}</div> : null}
      {description ? <div style={descriptionStyle}>{description}</div> : null}
      {children}
    </section>
  );
}

export function FoundationAlertLinkedOverviewSection({
  governance,
  navigationBindings,
  palette,
  overviewStats,
  focusQueryKey = 'alert',
  title,
  description,
  sectionStyle,
  titleStyle,
  descriptionStyle,
  defaultFocusContextPrefix,
  search,
  topRisksTitle = 'Top Risks',
  catalogTitle = 'Catalog Triage',
  topRisksEmptyText = '暂无匹配的 Top Risk',
  catalogEmptyText = '暂无匹配的 Catalog Alert',
  emptyShareStatus = '按 URL 打开时会自动滚到当前治理面板',
  buildTopRiskMetaLines,
  buildCatalogMetaLines,
  renderPanel,
}: FoundationAlertLinkedOverviewSectionProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchEnabled = search?.enabled ?? false;
  const topRisks = governance.topRisks.slice(0, 3);
  const defaultFocusCode = useMemo(
    () => topRisks[0]?.code ?? governance.overviewAlerts[0]?.code ?? governance.alerts[0]?.code ?? '',
    [governance.alerts, governance.overviewAlerts, topRisks]
  );
  const timelineQueryKey = `${focusQueryKey}Action`;
  const ownerQueryKey = `${focusQueryKey}Owner`;
  const defaultFocusContext = defaultFocusContextPrefix
    ? `${defaultFocusContextPrefix} / 默认聚焦 / ${defaultFocusCode || 'none'}`
    : `默认聚焦 / ${defaultFocusCode || 'none'}`;

  const searchableAlerts = useMemo<SearchableAlert[]>(
    () => [
      ...governance.topRisks.map((item) => ({
        code: item.code,
        summary: item.summary,
        triageSummary: item.triageSummary,
        triageState: item.triageState,
      })),
      ...governance.overviewAlerts.map((item) => ({
        code: item.code,
        summary: item.defaultSummary,
        triageSummary: item.triageSummary,
        triageState: item.triageState,
      })),
      ...governance.alerts.map((item) => ({
        code: item.code,
        triageSummary: item.triageSummary,
        triageState: item.triageState,
        summary: item.defaultSummary,
      })),
    ],
    [governance.alerts, governance.overviewAlerts, governance.topRisks]
  );

  const searchResult = useSearchFilter(searchableAlerts, ['code', 'summary', 'triageSummary', 'triageState']);
  const searchTerm = searchEnabled ? searchResult.searchTerm : '';
  const setSearchTerm = searchEnabled ? searchResult.setSearchTerm : () => {};
  const filteredSearchableAlerts = searchEnabled ? searchResult.filteredItems : searchableAlerts;
  const matchedCount = searchEnabled ? searchResult.matchedCount : searchableAlerts.length;
  const totalCount = searchEnabled ? searchResult.totalCount : searchableAlerts.length;

  const matchedCodes = useMemo(
    () => new Set((filteredSearchableAlerts ?? []).map((item) => item.code)),
    [filteredSearchableAlerts]
  );
  const displayTopRisks = useMemo(
    () =>
      searchTerm.trim()
        ? governance.topRisks.filter((item) => matchedCodes.has(item.code)).slice(0, 3)
        : governance.topRisks.slice(0, 3),
    [governance.topRisks, matchedCodes, searchTerm]
  );
  const displayCatalogAlerts = useMemo(
    () =>
      searchTerm.trim()
        ? governance.alerts.filter((item) => matchedCodes.has(item.code)).slice(0, 3)
        : governance.alerts.slice(0, 3),
    [governance.alerts, matchedCodes, searchTerm]
  );

  const {
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
  } = useFoundationAlertLinkedFocusQuery({
    searchParams: navigationBindings.searchParams,
    pathname: navigationBindings.pathname,
    replace: navigationBindings.replace,
    focusQueryKey,
    defaultFocusCode,
    defaultFocusContext,
    candidateGroups: [governance.topRisks, governance.overviewAlerts, governance.alerts],
    panelRef,
  });

  function pickPreferredAlert(preferredCodes: readonly FoundationAlertCode[]) {
    for (const code of preferredCodes) {
      const topRisk = displayTopRisks.find((item) => item.code === code);
      if (topRisk) {
        return topRisk;
      }

      const overviewAlert = governance.overviewAlerts.find((item) => item.code === code);
      if (overviewAlert) {
        return overviewAlert;
      }

      const alert = governance.alerts.find((item) => item.code === code);
      if (alert) {
        return alert;
      }
    }

    return (
      governance.alerts.find((item) => item.code === defaultFocusCode) ??
      governance.overviewAlerts[0] ??
      displayTopRisks[0] ??
      null
    );
  }

  const overviewStatItems = useMemo(
    () =>
      overviewStats.map((item) => {
        const preferredAlert = pickPreferredAlert(item.preferredCodes);
        const preferredCode = preferredAlert?.code ?? '';
        return {
          key: item.label,
          label: item.label,
          value: item.value,
          helper: item.helper,
          focusCode: preferredCode,
          isActive: preferredCode !== '' && preferredCode === focusAlertCode,
          recentOperation: preferredAlert?.recentOperation,
        };
      }),
    [focusAlertCode, overviewStats]
  );

  const topRiskItems = useMemo(
    () =>
      displayTopRisks.map((item) => ({
        key: title ? `${title}-${item.code}-risk` : `${item.code}-risk`,
        code: item.code,
        summary: `${item.triageState ?? 'needs-triage'} / ${item.count} 件`,
        accent: item.triageSummary ?? item.summary,
        metaLines:
          buildTopRiskMetaLines?.(item) ?? [
            `责任人：${item.recentOperation?.actorId ?? item.acknowledgement?.actorId ?? '系统'}`,
            `最近动作：${item.recentOperation ? `${item.recentOperation.action} @ ${item.recentOperation.createdAt}` : 'none'}`,
          ],
        isActive: item.code === focusAlertCode,
        recentOperation: item.recentOperation,
      })),
    [buildTopRiskMetaLines, displayTopRisks, focusAlertCode, title]
  );

  const catalogAlertItems = useMemo(
    () =>
      displayCatalogAlerts.map((item) => ({
        key: title ? `${title}-${item.code}` : item.code,
        code: item.code,
        summary: `${item.triageState ?? 'needs-triage'} / ${item.defaultSummary ?? ''}`,
        accent: item.triageSummary ?? '待处理，尚无最近运维动作',
        metaLines:
          buildCatalogMetaLines?.(item) ?? [
            `最近动作：${item.recentOperation ? `${item.recentOperation.action} @ ${item.recentOperation.createdAt}` : 'none'}`,
          ],
        isActive: item.code === focusAlertCode,
        recentOperation: item.recentOperation,
      })),
    [buildCatalogMetaLines, displayCatalogAlerts, focusAlertCode, title]
  );

  const content = (
    <>
      <FoundationAlertLinkedFocusBarReadout
        palette={palette}
        focusQueryLabel={`?${focusQueryKey}=${focusAlertCode || 'none'}`}
        linkedFilterSummary={linkedFilterSummary}
        linkedFilterQueryPreview={linkedFilterQueryPreview}
        shareStatus={shareStatus}
        hasLinkedFilters={hasLinkedFilters}
        onCopyFocusLink={copyFocusLink}
        onClearLinkedTriage={clearLinkedTriage}
        emptyShareStatus={emptyShareStatus}
      />
      <FoundationAlertLinkedOverviewStatsReadout
        palette={palette}
        items={overviewStatItems}
        onSelect={(key: string) => {
          const item = overviewStatItems.find((entry) => entry.key === key);
          if (!item) {
            return;
          }
          activateFocus(
            item.focusCode,
            `概览卡 / ${item.label}`,
            buildFoundationAlertRecentOperationFilterState(
              item.recentOperation as FoundationAlertTimelineEntry | null | undefined
            )
          );
        }}
      />
      {searchEnabled ? (
        <>
          <div style={{ marginTop: 14 }}>
            <SearchFilterInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={search?.placeholder ?? '搜索告警代码、摘要或 triage 状态...'}
            />
          </div>
          {searchTerm.trim() ? (
            <div style={{ marginTop: 8, color: search?.statusColor ?? palette.accentText, fontSize: 12 }}>
              搜索告警：匹配 {matchedCount}/{totalCount} 条
            </div>
          ) : null}
        </>
      ) : null}
      <FoundationAlertLinkedAlertGridReadout
        palette={palette}
        title={topRisksTitle}
        emptyText={topRisksEmptyText}
        items={topRiskItems}
        variant="risk"
        onSelect={(key: string) => {
          const item = topRiskItems.find((entry) => entry.key === key);
          if (!item) {
            return;
          }
          activateFocus(
            item.code,
            `Top risk / ${item.code}`,
            buildFoundationAlertRecentOperationFilterState(item.recentOperation)
          );
        }}
      />
      <FoundationAlertLinkedAlertGridReadout
        palette={palette}
        title={catalogTitle}
        emptyText={catalogEmptyText}
        items={catalogAlertItems}
        variant="catalog"
        onSelect={(key: string) => {
          const item = catalogAlertItems.find((entry) => entry.key === key);
          if (!item) {
            return;
          }
          activateFocus(
            item.code,
            `Catalog triage / ${item.code}`,
            buildFoundationAlertRecentOperationFilterState(item.recentOperation)
          );
        }}
      />
      <div ref={panelRef}>
        {renderPanel({
          focusAlertCode,
          focusContext,
          timelineQueryKey,
          ownerQueryKey,
          onFocusChange: handlePanelFocusChange,
        })}
      </div>
    </>
  );

  return renderSectionShell(
    Boolean(title || description || sectionStyle),
    title,
    description,
    titleStyle,
    descriptionStyle,
    sectionStyle,
    content
  );
}

export function FoundationAlertLinkedOverviewSurface({
  router,
  pathname,
  searchParams,
  ...props
}: FoundationAlertLinkedOverviewSurfaceProps) {
  const navigationBindings = createFoundationAlertNextNavigationBindings({
    router,
    pathname,
    searchParams,
  });

  return <FoundationAlertLinkedOverviewSection {...props} navigationBindings={navigationBindings} />;
}

export function createFoundationAlertLinkedOverviewStats(
  preset: FoundationAlertLinkedOverviewStatsPreset,
  summary: FoundationAlertLinkedOverviewSummaryLike,
  topRiskCount = 0
): FoundationAlertLinkedOverviewCardDefinition[] {
  switch (preset) {
    case 'admin':
      return [
        {
          label: '待处理审批',
          value: String(summary.approvalsPending),
          helper: `执行失败 ${summary.approvalsWithFailures}`,
          preferredCodes: ['approvals-pending', 'approval-execution-failures'],
        },
        {
          label: '高风险审计',
          value: String(summary.highRiskAudits),
          helper: `限流封禁 ${summary.blockedLedgers}`,
          preferredCodes: ['high-risk-audits', 'blocked-rate-limit-ledgers'],
        },
        {
          label: '密钥与证书',
          value: String(
            summary.rotationDueSecrets +
              summary.expiredSecrets +
              summary.expiringCertificates +
              summary.expiredCertificates
          ),
          helper: `信号异常 ${summary.degradedSignals}`,
          preferredCodes: ['secret-rotation-attention', 'observability-degradation'],
        },
      ];
    case 'tob':
      return [
        {
          label: '待处理审批',
          value: String(summary.approvalsPending),
          helper: `执行失败 ${summary.approvalsWithFailures}`,
          preferredCodes: ['approvals-pending', 'approval-execution-failures'],
        },
        {
          label: '高风险审计',
          value: String(summary.highRiskAudits),
          helper: `密钥轮换 ${summary.rotationDueSecrets}`,
          preferredCodes: ['high-risk-audits', 'secret-rotation-attention'],
        },
        {
          label: '韧性关注项',
          value: String(summary.degradedSignals + summary.attentionRecoveryPlans + summary.staleDrills),
          helper: `top risks ${topRiskCount}`,
          preferredCodes: ['observability-degradation', 'recovery-drill-attention'],
        },
      ];
    case 'storefront':
      return [
        {
          label: '待处理审批',
          value: String(summary.approvalsPending),
          helper: `执行失败 ${summary.approvalsWithFailures}`,
          preferredCodes: ['approvals-pending', 'approval-execution-failures'],
        },
        {
          label: '密钥/证书',
          value: String(
            summary.rotationDueSecrets +
              summary.expiredSecrets +
              summary.expiringCertificates +
              summary.expiredCertificates
          ),
          helper: `高风险审计 ${summary.highRiskAudits}`,
          preferredCodes: ['secret-rotation-attention', 'high-risk-audits'],
        },
        {
          label: '韧性风险',
          value: String(summary.degradedSignals + summary.attentionRecoveryPlans + summary.staleDrills),
          helper: `top risks ${topRiskCount}`,
          preferredCodes: ['observability-degradation', 'recovery-drill-attention'],
        },
      ];
  }
}
