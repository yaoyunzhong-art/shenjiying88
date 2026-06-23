'use client';

import React from 'react';
import {
  DetailActionBar,
  DetailClosureBar,
  FoundationAlertDetailView,
  WorkspaceBreadcrumb,
  foundationAdminGovernanceListPreset,
  buildFoundationAlertDrilldownSections,
  buildFoundationAlertLytConnectionGovernanceSections,
  buildFoundationAlertRecordFromDrilldown,
  type FoundationAlertRecord,
} from '@m5/ui';
import type {
  FoundationAlertCatalogItem,
  FoundationAlertDrilldownResponse,
  FoundationAlertOperation,
  FoundationAlertTimelineEntry,
  FoundationOperationsAlert,
} from '@m5/types';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

interface AdminAlertGovernanceReadModelLike {
  deliveryMode: 'api' | 'fallback';
  generatedAt: string;
  alerts: FoundationAlertCatalogItem[];
  overviewAlerts: FoundationOperationsAlert[];
}

const adminGovernanceSourceMap: Record<string, string> = {
  'governance-approval': 'approval',
  'trust-governance': 'trust',
  'resilience-operations': 'recovery',
  'identity-access': 'identity',
  'configuration-governance': 'configuration',
  'integration-orchestration': 'integration',
  'runtime-governance': 'runtime',
};

interface AdminAlertDetailSection {
  title: string;
  content: React.ReactNode;
}

export interface AdminAlertDetailViewModel {
  alert: FoundationAlertRecord;
  subtitle: string;
  extraSections: AdminAlertDetailSection[];
}

interface AdminAlertDetailRouteViewProps {
  alertId: string;
  drilldown?: FoundationAlertDrilldownResponse | null;
  governance?: AdminAlertGovernanceReadModelLike | null;
}

const ADMIN_PRESET = foundationAdminGovernanceListPreset;

export function buildAdminAlertDetailViewModel(drilldown: FoundationAlertDrilldownResponse): AdminAlertDetailViewModel {
  return {
    alert: buildFoundationAlertRecordFromDrilldown(drilldown),
    subtitle: `告警编码：${String(drilldown.code)}`,
    extraSections: [
      ...buildFoundationAlertDrilldownSections(drilldown),
      ...buildFoundationAlertLytConnectionGovernanceSections(drilldown),
    ],
  };
}

function resolveFallbackAvailableActions(
  governance: AdminAlertGovernanceReadModelLike,
  catalog: FoundationAlertCatalogItem,
  overviewAlert?: FoundationOperationsAlert
): FoundationAlertOperation[] {
  if (governance.deliveryMode === 'fallback') {
    return [];
  }

  if (catalog.availableActions?.length) {
    return catalog.availableActions;
  }

  if (overviewAlert?.availableActions?.length) {
    return overviewAlert.availableActions;
  }

  const fallbackActions: FoundationAlertOperation[] = ['DRILLDOWN'];
  if (!catalog.acknowledgementEnabled) {
    return fallbackActions;
  }

  if (catalog.acknowledgement?.status === 'MUTED' || overviewAlert?.acknowledgement?.status === 'MUTED') {
    fallbackActions.push('UNMUTE');
    return fallbackActions;
  }

  fallbackActions.push('ACK', 'MUTE');
  return fallbackActions;
}

function buildAdminAlertFallbackSection(
  governance: AdminAlertGovernanceReadModelLike,
  catalog: FoundationAlertCatalogItem,
  overviewAlert?: FoundationOperationsAlert
): AdminAlertDetailSection {
  const triageState = catalog.triageState ?? overviewAlert?.triageState;
  const triageSummary = catalog.triageSummary ?? overviewAlert?.triageSummary;

  return {
    title: '降级详情',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
          当前 drilldown 暂不可用，页面已回退到{governance.deliveryMode === 'fallback' ? ' fallback' : ' API'}治理快照，保证列表进入详情后仍能查看基础信息。
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>数据模式</div>
            <div style={{ color: '#e2e8f0', fontSize: 14 }}>{governance.deliveryMode === 'fallback' ? 'fallback 快照' : 'API 快照'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>分诊状态</div>
            <div style={{ color: '#e2e8f0', fontSize: 14 }}>{triageState ?? '待补充'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>分诊摘要</div>
            <div style={{ color: '#e2e8f0', fontSize: 14 }}>{triageSummary ?? '当前治理快照未提供额外分诊摘要。'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>写能力</div>
            <div style={{ color: '#e2e8f0', fontSize: 14 }}>
              {governance.deliveryMode === 'fallback' ? '只读 fallback，需恢复实时 API 后才能执行 ACK / MUTE。' : '可按返回动作执行处置。'}
            </div>
          </div>
        </div>
      </div>
    ),
  };
}

function buildAdminAlertFallbackRecord(
  governance: AdminAlertGovernanceReadModelLike,
  catalog: FoundationAlertCatalogItem,
  overviewAlert?: FoundationOperationsAlert
): FoundationAlertRecord {
  const sourceModule = catalog.sourceModules[0];
  const source = sourceModule ? adminGovernanceSourceMap[sourceModule] ?? sourceModule : 'foundation';
  const acknowledgement = catalog.acknowledgement ?? overviewAlert?.acknowledgement ?? null;
  const recentOperation = catalog.recentOperation ?? overviewAlert?.recentOperation ?? null;

  return {
    id: String(catalog.code),
    title: catalog.defaultSummary,
    description: catalog.severityPolicy,
    severity: overviewAlert?.severity ?? 'low',
    source,
    status:
      acknowledgement?.status === 'MUTED' ? 'muted' : acknowledgement?.status === 'ACKED' ? 'acknowledged' : 'open',
    owner: acknowledgement?.actorId ?? recentOperation?.actorId ?? undefined,
    createdAt: governance.generatedAt,
    updatedAt: acknowledgement?.updatedAt ?? recentOperation?.createdAt ?? governance.generatedAt,
  };
}

export function buildAdminAlertFallbackDetailViewModel(
  governance: AdminAlertGovernanceReadModelLike,
  alertId: string
): AdminAlertDetailViewModel | null {
  const catalog = governance.alerts.find((item) => String(item.code) === alertId);
  if (!catalog) {
    return null;
  }

  const overviewAlert = governance.overviewAlerts.find((item) => String(item.code) === alertId);
  const alert = buildAdminAlertFallbackRecord(governance, catalog, overviewAlert);
  const history = [catalog.recentOperation ?? overviewAlert?.recentOperation].filter(
    (entry): entry is FoundationAlertTimelineEntry => Boolean(entry)
  );
  const fallbackDrilldown: FoundationAlertDrilldownResponse = {
    generatedAt: governance.generatedAt,
    code: alertId,
    catalog,
    alert: overviewAlert ?? null,
    acknowledgement: catalog.acknowledgement ?? overviewAlert?.acknowledgement ?? null,
    visibleInOverview: catalog.visibleInOverview ?? overviewAlert?.visibleInOverview,
    availableActions: resolveFallbackAvailableActions(governance, catalog, overviewAlert),
    history,
  };

  return {
    alert,
    subtitle: `告警编码：${alertId} · drilldown 降级为治理快照`,
    extraSections: [
      buildAdminAlertFallbackSection(governance, catalog, overviewAlert),
      ...buildFoundationAlertDrilldownSections(fallbackDrilldown),
    ],
  };
}

export function AdminAlertDetailRouteView({ alertId, drilldown, governance }: AdminAlertDetailRouteViewProps) {
  const detailViewModel = drilldown
    ? buildAdminAlertDetailViewModel(drilldown)
    : governance
      ? buildAdminAlertFallbackDetailViewModel(governance, alertId)
      : null;

  const { actions: detailActions } = useDetailActions({
    workspace: 'alerts',
    detailId: alertId,
    record: detailViewModel?.alert ?? {},
    shareTitle: `告警 · ${alertId}`,
    shareText: `查看告警 ${alertId} 详情`
  });

  return (
    <>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'alerts', detailLabel: detailViewModel?.alert.title ?? alertId })}
      />
      <FoundationAlertDetailView
        alert={detailViewModel?.alert ?? null}
        preset={ADMIN_PRESET}
        subtitle={detailViewModel?.subtitle}
        backHref="/alerts"
        backLabel="返回告警中心"
        notFoundTitle="告警不存在"
        notFoundMessage={`未找到告警 ${alertId}，或当前租户无权访问该 drilldown。`}
        extraSections={detailViewModel?.extraSections}
      />
      <DetailActionBar
        actions={detailActions}
        heading="详情收口动作"
        caption="复制 / 导出 / 分享当前告警详情"
      />
      <DetailClosureBar
        links={buildStandardClosureLinks({ workspace: 'alerts', detailId: alertId })}
      />
    </>
  );
}
