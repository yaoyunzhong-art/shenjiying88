/**
 * training-center/page.tsx — 培训中心工作台
 * 角色: 培训经理视角，展示培训运营指标、今日课程、待认证学员、设备培训需求
 */
'use client';

import { TrainingManagerDashboard } from '@m5/ui';

import {
  MOCK_DAILY_METRICS,
  MOCK_TODAY_SESSIONS,
  MOCK_PENDING_CERTIFICATIONS,
  MOCK_TRAINING_NEEDS,
} from './training-center-data';

export default function TrainingCenterPage() {
  return (
    <TrainingManagerDashboard
      brandName="深竞技·朝阳旗舰店"
      dailyMetrics={MOCK_DAILY_METRICS}
      todaySessions={MOCK_TODAY_SESSIONS}
      pendingCertifications={MOCK_PENDING_CERTIFICATIONS}
      trainingNeeds={MOCK_TRAINING_NEEDS}
      lastSyncAt={new Date().toISOString()}
    />
  );
}
