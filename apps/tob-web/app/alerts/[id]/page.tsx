'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { FoundationAlertPresetDetailRoute, foundationAlertDetailDemoPresets, foundationAlertListDemoPresets } from '@m5/ui';

const MOCK = foundationAlertDetailDemoPresets.tob;
const PRESET = foundationAlertListDemoPresets.tob;

export default function AlertDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <FoundationAlertPresetDetailRoute
      alertId={id}
      alerts={MOCK}
      preset={PRESET}
      backHref="/alerts"
      backLabel="返回告警列表"
      notFoundTitle="告警不存在"
      notFoundMessage={(alertId) => `未找到告警 ${alertId}`}
    />
  );
}
