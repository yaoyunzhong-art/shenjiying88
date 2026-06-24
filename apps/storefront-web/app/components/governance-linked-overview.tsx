'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FoundationAlertLinkedOverviewPanelRenderArgs,
  FoundationAlertLinkedOverviewSurface,
  type FoundationAlertLinkedOverviewPalette,
  createFoundationAlertLinkedOverviewStats,
} from '@m5/ui';
import type { StorefrontGovernanceReadModel } from '../market-bootstrap';
import { GovernanceActionPanel } from './governance-action-panel';

interface GovernanceLinkedOverviewProps {
  cnGovernance: StorefrontGovernanceReadModel;
  usGovernance: StorefrontGovernanceReadModel;
}

export interface GovernanceLinkedSectionProps {
  title: string;
  description: string;
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
  governance: StorefrontGovernanceReadModel;
  focusQueryKey?: string;
}

export function GovernanceLinkedOverview({
  cnGovernance,
  usGovernance
}: GovernanceLinkedOverviewProps) {
  return (
    <div style={{ marginTop: 14, display: 'grid', gap: 18 }}>
      <GovernanceLinkedSection
        title="中国门店治理"
        description="门店官网概览卡、top risks 与 triage 卡片直接驱动中国门店面板 focus。"
        marketCode="cn-mainland"
        tenantCode="demo-tenant"
        brandCode="demo-brand"
        storeCode="store-001"
        governance={cnGovernance}
        focusQueryKey="cnAlert"
      />
      <GovernanceLinkedSection
        title="美国门店治理"
        description="国际 H5 场景维持独立联动链路，避免跨市场状态串扰。"
        marketCode="us-default"
        tenantCode="demo-tenant"
        brandCode="demo-brand"
        storeCode="store-001"
        governance={usGovernance}
        focusQueryKey="usAlert"
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
  storeCode,
  governance,
  focusQueryKey = 'alert'
}: GovernanceLinkedSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const overviewStats = useMemo(
    () => createFoundationAlertLinkedOverviewStats('storefront', governance.summary, governance.topRisks.length),
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
      sectionStyle={sectionStyle}
      titleStyle={titleTextStyle}
      descriptionStyle={descriptionTextStyle}
      buildTopRiskMetaLines={(item: {
        recentOperation?: { actorId?: string | null } | null;
        acknowledgement?: { actorId?: string | null } | null;
      }) => [`责任人：${item.recentOperation?.actorId ?? item.acknowledgement?.actorId ?? '系统'}`]}
      renderPanel={({ focusAlertCode, focusContext, timelineQueryKey, ownerQueryKey, onFocusChange }: FoundationAlertLinkedOverviewPanelRenderArgs) => (
        <GovernanceActionPanel
          marketCode={marketCode}
          tenantCode={tenantCode}
          brandCode={brandCode}
          storeCode={storeCode}
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
  focusBannerBackground: 'rgba(30, 64, 175, 0.14)',
  focusBannerBorder: 'rgba(147, 197, 253, 0.16)',
  actionButtonBorder: 'rgba(147, 197, 253, 0.26)',
  actionButtonBackground: 'rgba(30, 64, 175, 0.18)',
  actionButtonText: '#dbeafe',
  overviewActiveBorder: 'rgba(147, 197, 253, 0.8)',
  overviewActiveBackground: 'rgba(30, 64, 175, 0.18)',
  riskCardBorder: 'rgba(96, 165, 250, 0.2)',
  riskCardBackground: 'rgba(59, 130, 246, 0.14)',
  riskActiveBorder: 'rgba(147, 197, 253, 0.82)',
  riskActiveBackground: 'rgba(30, 64, 175, 0.26)',
  catalogActiveBorder: 'rgba(147, 197, 253, 0.82)',
  catalogActiveBackground: 'rgba(15, 23, 42, 0.64)'
} as const;

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.32)',
  border: '1px solid rgba(96, 165, 250, 0.14)'
};

const titleTextStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#93c5fd'
};

const descriptionTextStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#cbd5e1'
};
