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

  return (
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
  );
}
