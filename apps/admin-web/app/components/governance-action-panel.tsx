'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createWebFoundationAlertPanelClientAccess } from '@m5/sdk';
import { FoundationAlertPanelSurface } from '@m5/ui';
import { loadAdminGovernanceReadModel, type AdminGovernanceReadModel } from '../bootstrap';

const adminGovernancePanelAccess = createWebFoundationAlertPanelClientAccess({
  app: 'admin-web',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland'
});

interface GovernanceActionPanelProps {
  initialGovernance: AdminGovernanceReadModel;
  focusAlertCode?: string;
  focusContext?: string;
  timelineQueryKey?: string;
  ownerQueryKey?: string;
  sourceQueryKey?: string;
  onFocusChange?: (code: string, context: string) => void;
}

export function GovernanceActionPanel({
  initialGovernance,
  focusAlertCode,
  focusContext,
  timelineQueryKey = 'alertAction',
  ownerQueryKey = 'alertOwner',
  sourceQueryKey,
  onFocusChange
}: GovernanceActionPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sourceEvidence = {
    deliveryMode: initialGovernance.deliveryMode,
    initialSource:
      initialGovernance.deliveryMode === 'api'
        ? 'snapshot.governance'
        : 'fallback governance snapshot',
    refreshSource: 'loadAdminGovernanceReadModel',
    generatedAt: initialGovernance.generatedAt,
    note:
      initialGovernance.deliveryMode === 'api'
        ? '治理动作面板当前以 bootstrap governance 快照作为首屏证据，后续刷新继续命中实时治理读模型。'
        : '治理动作面板当前先展示 fallback governance 快照，后续刷新仍尝试命中实时治理读模型。'
  };

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
          Delivery {sourceEvidence.deliveryMode} · 初始治理来源: {sourceEvidence.initialSource}
        </div>
        <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 13 }}>
          刷新路径: {sourceEvidence.refreshSource} · generatedAt: {sourceEvidence.generatedAt}
        </div>
        <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
          {sourceEvidence.note}
          {sourceQueryKey ? ` 当前告警来源 query key: ${sourceQueryKey}。` : ''}
        </div>
      </div>
      <FoundationAlertPanelSurface
        router={router}
        pathname={pathname}
        searchParams={searchParams}
        panelAccess={adminGovernancePanelAccess}
        themePreset="admin"
        focusContext={focusContext}
        initialGovernance={initialGovernance}
        focusAlertCode={focusAlertCode}
        onFocusChange={onFocusChange}
        loadGovernance={loadAdminGovernanceReadModel}
        timelineQueryKey={timelineQueryKey}
        ownerQueryKey={ownerQueryKey}
        sourceQueryKey={sourceQueryKey}
      />
    </div>
  );
}
