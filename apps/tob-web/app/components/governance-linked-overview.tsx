'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FoundationAlertLinkedOverviewPanelRenderArgs,
  FoundationAlertLinkedOverviewSurface,
  type FoundationAlertLinkedOverviewPalette,
  createFoundationAlertLinkedOverviewStats,
} from '@m5/ui';
import type { TobGovernanceReadModel } from '../bootstrap';
import { GovernanceActionPanel } from './governance-action-panel';

interface GovernanceLinkedOverviewProps {
  tenantGovernance: TobGovernanceReadModel;
  brandGovernance: TobGovernanceReadModel;
}

export interface GovernanceLinkedSectionProps {
  title: string;
  description: string;
  marketCode: string;
  tenantCode: string;
  brandCode?: string;
  governance: TobGovernanceReadModel;
  focusQueryKey?: string;
}

export function GovernanceLinkedOverview({
  tenantGovernance,
  brandGovernance
}: GovernanceLinkedOverviewProps) {
  return (
    <div style={{ marginTop: 14, display: 'grid', gap: 18 }}>
      <GovernanceLinkedSection
        title="中国租户治理"
        description="概览卡、top risks 与 triage 卡片会直接驱动租户治理面板聚焦。"
        marketCode="cn-mainland"
        tenantCode="demo-tenant"
        governance={tenantGovernance}
        focusQueryKey="tenantAlert"
      />
      <GovernanceLinkedSection
        title="美国品牌治理"
        description="品牌级读面保留独立联动上下文，避免两个面板抢占同一 focus。"
        marketCode="us-default"
        tenantCode="demo-tenant"
        brandCode="demo-brand"
        governance={brandGovernance}
        focusQueryKey="brandAlert"
      />
    </div>
  );
}

export function GovernanceLinkedSection({
  title,
  description,
  marketCode,
  tenantCode,
  brandCode,
  governance,
  focusQueryKey = 'alert'
}: GovernanceLinkedSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const overviewStats = useMemo(
    () => createFoundationAlertLinkedOverviewStats('tob', governance.summary, governance.topRisks.length),
    [governance]
  );

  return (
    <FoundationAlertLinkedOverviewSurface
      governance={governance}
      router={router}
      pathname={pathname}
      searchParams={searchParams}
      palette={linkedOverviewPalette}
      overviewStats={overviewStats}
      focusQueryKey={focusQueryKey}
      title={title}
      description={description}
      defaultFocusContextPrefix={title}
      search={{
        enabled: true,
        placeholder: '搜索告警代码、摘要或 triage 状态...',
        statusColor: '#67e8f9'
      }}
      sectionStyle={sectionStyle}
      titleStyle={titleTextStyle}
      descriptionStyle={descriptionTextStyle}
      renderPanel={({ focusAlertCode, focusContext, timelineQueryKey, ownerQueryKey, onFocusChange }: FoundationAlertLinkedOverviewPanelRenderArgs) => (
        <GovernanceActionPanel
          marketCode={marketCode}
          tenantCode={tenantCode}
          brandCode={brandCode}
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
  accentText: '#67e8f9',
  focusBannerBackground: 'rgba(8, 145, 178, 0.12)',
  focusBannerBorder: 'rgba(103, 232, 249, 0.16)',
  actionButtonBorder: 'rgba(103, 232, 249, 0.26)',
  actionButtonBackground: 'rgba(8, 145, 178, 0.18)',
  actionButtonText: '#cffafe',
  overviewActiveBorder: 'rgba(103, 232, 249, 0.8)',
  overviewActiveBackground: 'rgba(8, 145, 178, 0.18)',
  riskCardBorder: 'rgba(125, 211, 252, 0.2)',
  riskCardBackground: 'rgba(8, 145, 178, 0.14)',
  riskActiveBorder: 'rgba(103, 232, 249, 0.82)',
  riskActiveBackground: 'rgba(8, 145, 178, 0.24)',
  catalogActiveBorder: 'rgba(103, 232, 249, 0.82)',
  catalogActiveBackground: 'rgba(6, 95, 70, 0.2)'
} as const;

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.32)',
  border: '1px solid rgba(125, 211, 252, 0.14)'
};

const titleTextStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#67e8f9'
};

const descriptionTextStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#cbd5e1'
};
