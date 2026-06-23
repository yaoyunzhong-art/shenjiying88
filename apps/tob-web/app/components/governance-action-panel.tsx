'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createWebFoundationAlertPanelClientAccess } from '@m5/sdk';
import { FoundationAlertPanelSurface } from '@m5/ui';
import { loadTobGovernanceReadModel, type TobGovernanceReadModel } from '../bootstrap';

interface TobGovernanceActionPanelProps {
  marketCode: string;
  tenantCode: string;
  brandCode?: string;
  initialGovernance: TobGovernanceReadModel;
  focusAlertCode?: string;
  focusContext?: string;
  timelineQueryKey?: string;
  ownerQueryKey?: string;
  sourceQueryKey?: string;
  onFocusChange?: (code: string, context: string) => void;
}

export function GovernanceActionPanel({
  marketCode,
  tenantCode,
  brandCode,
  initialGovernance,
  focusAlertCode,
  focusContext,
  timelineQueryKey = 'alertAction',
  ownerQueryKey = 'alertOwner',
  sourceQueryKey,
  onFocusChange
}: TobGovernanceActionPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loadGovernance = useMemo(
    () => loadTobGovernanceReadModel.bind(null, marketCode, tenantCode, brandCode),
    [brandCode, marketCode, tenantCode]
  );
  const panelAccess = useMemo(
    () =>
      createWebFoundationAlertPanelClientAccess({
        app: 'tob-web',
        tenantId: tenantCode,
        brandId: brandCode,
        marketCode
      }),
    [brandCode, marketCode, tenantCode]
  );
  return (
    <FoundationAlertPanelSurface
      router={router}
      pathname={pathname}
      searchParams={searchParams}
      panelAccess={panelAccess}
      themePreset="tob"
      focusContext={focusContext}
      initialGovernance={initialGovernance}
      focusAlertCode={focusAlertCode}
      onFocusChange={onFocusChange}
      loadGovernance={loadGovernance}
      timelineQueryKey={timelineQueryKey}
      ownerQueryKey={ownerQueryKey}
      sourceQueryKey={sourceQueryKey}
    />
  );
}
