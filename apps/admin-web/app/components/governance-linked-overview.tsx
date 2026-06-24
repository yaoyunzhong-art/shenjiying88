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

  return (
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
