'use client';

import {
  FoundationAlertDemoListPage,
  foundationAlertListDemoPresets,
} from '@m5/ui';

const storefrontPreset = foundationAlertListDemoPresets.storefront;

export default function AlertsListPage() {
  return (
    <FoundationAlertDemoListPage
      title="门店告警中心"
      description="查看门店运行告警、降级状态与处理进度。"
      preset={storefrontPreset}
      count={25}
      detailHrefBase="/alerts"
      mapRecords={(alerts) =>
        alerts.map((alert, index) => ({
          ...alert,
          title: `告警 ${index + 1}：${alert.title}`,
        }))
      }
    />
  );
}
