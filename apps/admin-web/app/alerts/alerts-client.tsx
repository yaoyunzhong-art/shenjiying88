'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { createWebFoundationAlertPanelClientAccess } from '@m5/sdk';
import {
  createFoundationAdminGovernanceStatsCopy,
  DetailActionBar,
  FoundationAlertAcknowledgeActionButton,
  foundationAdminGovernanceListPreset,
  FoundationAlertListPageSection,
  mapFoundationGovernanceAlertsToRecords,
} from '@m5/ui';
import type { FoundationAlertCatalogItem } from '@m5/types';
import { loadAdminGovernanceReadModel, type AdminGovernanceReadModel } from '../bootstrap';
import { useDetailActions } from '../components/use-detail-actions';

const adminAlertPanelAccess = createWebFoundationAlertPanelClientAccess({
  app: 'admin-web',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland',
});

interface AdminAlertsClientProps {
  initialGovernance: AdminGovernanceReadModel;
}

export function canRenderAdminAlertAcknowledgeAction(
  deliveryMode: AdminGovernanceReadModel['deliveryMode'],
  catalog: FoundationAlertCatalogItem | undefined,
  alertStatus: string
): boolean {
  if (deliveryMode === 'fallback' || !catalog) {
    return false;
  }

  if (catalog.availableActions?.includes('ACK')) {
    return true;
  }

  return catalog.acknowledgementEnabled && alertStatus === 'open';
}

export function AdminAlertsClient({ initialGovernance }: AdminAlertsClientProps) {
  const [governance, setGovernance] = useState(initialGovernance);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loadingAlertCode, setLoadingAlertCode] = useState<string | null>(null);

  const alerts = useMemo(() => mapFoundationGovernanceAlertsToRecords(governance), [governance]);
  const catalogByCode = useMemo(
    () => new Map<string, FoundationAlertCatalogItem>(governance.alerts.map((item) => [String(item.code), item])),
    [governance.alerts]
  );

  const { actions } = useDetailActions({
    workspace: 'alerts',
    detailId: 'overview',
    record: { alerts, deliveryMode: governance.deliveryMode, generatedAt: governance.generatedAt },
    shareTitle: '告警中心',
    shareText: '查看审批 / 审计 / 安全 / 运行时 / 恢复演练相关治理告警'
  });

  const handleAcknowledge = useCallback(async (alertCode: string) => {
    setLoadingAlertCode(alertCode);
    setFeedback(null);
    try {
      await adminAlertPanelAccess.ackAlert(alertCode);
      const nextGovernance = await loadAdminGovernanceReadModel();
      setGovernance(nextGovernance);
      setFeedback({ type: 'success', message: `指挥台已确认告警 ${alertCode}` });
    } catch {
      setFeedback({ type: 'error', message: `确认告警 ${alertCode} 失败，请检查 foundation.write 权限或 API 可达性。` });
    } finally {
      setLoadingAlertCode(null);
    }
  }, []);

  return (
    <>
      <FoundationAlertListPageSection
        title="指挥台告警中心"
        description={`统一查看审批、审计、安全、运行时与恢复演练相关治理告警。当前数据模式：${governance.deliveryMode}`}
        alerts={alerts}
        preset={foundationAdminGovernanceListPreset}
        detailHrefBase="/alerts"
        statsCopy={createFoundationAdminGovernanceStatsCopy(governance.deliveryMode)}
        feedback={feedback}
        onDismissFeedback={() => setFeedback(null)}
        renderAction={(row) => {
          const catalog = catalogByCode.get(row.id);
          if (!canRenderAdminAlertAcknowledgeAction(governance.deliveryMode, catalog, row.status)) {
            return null;
          }

          return (
            <FoundationAlertAcknowledgeActionButton
              alert={row}
              loading={loadingAlertCode === row.id}
              onAcknowledge={handleAcknowledge}
              label={loadingAlertCode === row.id ? '确认中...' : '确认'}
            />
          );
        }}
      />

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前告警中心快照"
      />
    </>
  );
}
