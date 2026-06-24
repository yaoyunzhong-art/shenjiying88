import React from 'react';
import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import { loadAdminGovernanceReadModel } from '../../bootstrap';
import { AdminAlertDetailRouteView } from './detail-presenter';

function createAdminAlertClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

interface AdminAlertDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminAlertDetailPage({ params }: AdminAlertDetailPageProps) {
  const { id } = await params;

  try {
    const drilldown = await createAdminAlertClient().getFoundationAlertDrilldown(id, { cache: 'no-store' });
    return <AdminAlertDetailRouteView alertId={id} drilldown={drilldown} />;
  } catch {
    try {
      const governance = await loadAdminGovernanceReadModel();
      if (governance.alerts.some((item) => String(item.code) === id)) {
        return <AdminAlertDetailRouteView alertId={id} governance={governance} />;
      }
    } catch (governanceError) {
      console.error('admin alert detail fallback failed', governanceError);
    }

    return <AdminAlertDetailRouteView alertId={id} />;
  }
}
