'use client';

import {
  FoundationAlertDemoListPage,
  foundationAlertListDemoPresets,
} from '@m5/ui';

const tobPreset = foundationAlertListDemoPresets.tob;

export default function AlertListPage() {
  return (
    <FoundationAlertDemoListPage
      title="告警中心"
      description="统一查看和管理所有基础设施告警。"
      preset={tobPreset}
      count={50}
      detailHrefBase="/alerts"
      acknowledgeOptions={{
        copy: {
          actionLabel: '确认',
          successMessage: (alertId) => `告警 ${alertId} 已确认`,
          errorMessage: (alertId) => `确认告警 ${alertId} 失败`,
        },
      }}
    />
  );
}
