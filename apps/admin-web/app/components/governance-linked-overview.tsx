'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FoundationAlertLinkedOverviewPanelRenderArgs,
  FoundationAlertLinkedOverviewSurface,
  type FoundationAlertLinkedOverviewPalette,
  createFoundationAlertLinkedOverviewStats,
} from '@m5/ui';
import type { AdminGovernanceReadModel } from '../bootstrap';
import { GovernanceActionPanel } from './governance-action-panel';

interface GovernanceLinkedOverviewProps {
  governance: AdminGovernanceReadModel;
}

export function GovernanceLinkedOverview({ governance }: GovernanceLinkedOverviewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const overviewStats = useMemo(() => createFoundationAlertLinkedOverviewStats('admin', governance.summary), [governance]);
  const sourceEvidence = useMemo(
    () => ({
      deliveryMode: governance.deliveryMode,
      controlPlaneSource:
        governance.deliveryMode === 'api' ? 'snapshot.governance' : 'fallback governance snapshot',
      generatedAt: governance.generatedAt,
      note:
        governance.deliveryMode === 'api'
          ? '治理联动概览当前直接消费 bootstrap governance 快照，可区分实时 catalog 与联动摘要。'
          : '治理联动概览当前回退到 fallback governance 快照，联动面板仅作为只读控制面证据。'
    }),
    [governance]
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          borderRadius: 16,
          padding: '14px 16px',
          background: 'rgba(15, 23, 42, 0.28)',
          border: '1px solid rgba(148, 163, 184, 0.16)'
        }}
      >
        <div style={{ color: '#e2e8f0', fontSize: 13 }}>
          Delivery {sourceEvidence.deliveryMode} · 治理联动来源: {sourceEvidence.controlPlaneSource}
        </div>
        <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 13 }}>
          generatedAt: {sourceEvidence.generatedAt}
        </div>
        <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
          {sourceEvidence.note}
        </div>
      </div>
      <FoundationAlertLinkedOverviewSurface
        governance={governance}
        router={router}
        pathname={pathname}
        searchParams={searchParams}
        palette={linkedOverviewPalette}
        overviewStats={overviewStats}
        search={{
          enabled: true,
          placeholder: '搜索告警代码、摘要或 triage 状态...',
          statusColor: '#93c5fd'
        }}
        emptyShareStatus="打开带 ?alert= 的链接会自动滚到治理面板"
        renderPanel={({
          focusAlertCode,
          focusContext,
          timelineQueryKey,
          ownerQueryKey,
          onFocusChange
        }: FoundationAlertLinkedOverviewPanelRenderArgs) => (
          <GovernanceActionPanel
            initialGovernance={governance}
            focusAlertCode={focusAlertCode}
            focusContext={focusContext}
            timelineQueryKey={timelineQueryKey}
            ownerQueryKey={ownerQueryKey}
            onFocusChange={onFocusChange}
          />
        )}
      />
    </div>
  );
}

const linkedOverviewPalette: FoundationAlertLinkedOverviewPalette = {
  accentText: '#93c5fd',
  focusBannerBackground: 'rgba(30, 41, 59, 0.5)',
  focusBannerBorder: 'rgba(96, 165, 250, 0.18)',
  actionButtonBorder: 'rgba(96, 165, 250, 0.28)',
  actionButtonBackground: 'rgba(37, 99, 235, 0.18)',
  actionButtonText: '#dbeafe',
  overviewActiveBorder: 'rgba(147, 197, 253, 0.8)',
  overviewActiveBackground: 'rgba(30, 41, 59, 0.72)',
  riskCardBorder: 'rgba(96, 165, 250, 0.2)',
  riskCardBackground: 'rgba(59, 130, 246, 0.14)',
  riskActiveBorder: 'rgba(147, 197, 253, 0.82)',
  riskActiveBackground: 'rgba(37, 99, 235, 0.24)',
  catalogActiveBorder: 'rgba(96, 165, 250, 0.82)',
  catalogActiveBackground: 'rgba(30, 64, 175, 0.18)'
} as const;
