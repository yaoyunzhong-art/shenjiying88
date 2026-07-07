/**
 * 运营经理工作台 — Operations Manager Dashboard (Next.js App Router Page)
 * 角色: 运营经理视角，展示辖区门店汇总指标、门店概览、巡检任务、快速操作
 */
'use client';

import React from 'react';
import { PageShell, OperationsManagerDashboard } from '@m5/ui';
import type {
  DistrictSummary,
  DistrictStoreSnapshot,
  InspectionTask,
  OpsQuickAction,
} from '@m5/ui';

// ============================================================
// Mock 运营经理工作台数据
// ============================================================

const MOCK_DISTRICT_SUMMARY: DistrictSummary = {
  totalStores: 12,
  operatingStores: 10,
  totalRevenue: 386500,
  revenueQoQ: 4.8,
  totalVisitors: 4210,
  visitorsQoQ: 2.1,
  avgKpiRate: 87.3,
  kpiRateQoQ: 3.2,
  pendingAlerts: 8,
  alertsQoQ: -12.5,
};

const MOCK_STORES: DistrictStoreSnapshot[] = [
  { id: 's1', name: '朝阳旗舰店', region: '朝阳区', status: 'operating', todayRevenue: 52800, revenueRate: 92, visitorCount: 380, monthlyKpiRate: 88, alertCount: 1, staffOnDuty: 8, lastInspectionAt: '2026-07-07 10:30' },
  { id: 's2', name: '海淀中关村店', region: '海淀区', status: 'operating', todayRevenue: 43500, revenueRate: 85, visitorCount: 320, monthlyKpiRate: 82, alertCount: 2, staffOnDuty: 6, lastInspectionAt: '2026-07-07 09:15' },
  { id: 's3', name: '西单大悦城店', region: '西城区', status: 'operating', todayRevenue: 61200, revenueRate: 106, visitorCount: 460, monthlyKpiRate: 95, alertCount: 0, staffOnDuty: 10, lastInspectionAt: '2026-07-07 11:00' },
  { id: 's4', name: '望京SOHO店', region: '朝阳区', status: 'operating', todayRevenue: 38900, revenueRate: 78, visitorCount: 290, monthlyKpiRate: 76, alertCount: 1, staffOnDuty: 5, lastInspectionAt: '2026-07-07 08:45' },
  { id: 's5', name: '通州万达店', region: '通州区', status: 'paused', todayRevenue: 0, revenueRate: 0, visitorCount: 0, monthlyKpiRate: 65, alertCount: 3, staffOnDuty: 2, lastInspectionAt: '2026-07-06 16:20' },
  { id: 's6', name: '大兴荟聚店', region: '大兴区', status: 'operating', todayRevenue: 35600, revenueRate: 81, visitorCount: 270, monthlyKpiRate: 80, alertCount: 1, staffOnDuty: 6, lastInspectionAt: '2026-07-07 10:00' },
  { id: 's7', name: '丰台科技园店', region: '丰台区', status: 'closed_today', todayRevenue: 0, revenueRate: 0, visitorCount: 0, monthlyKpiRate: 72, alertCount: 0, staffOnDuty: 0, lastInspectionAt: '2026-07-06 18:30' },
  { id: 's8', name: '东城金宝街店', region: '东城区', status: 'operating', todayRevenue: 47600, revenueRate: 95, visitorCount: 350, monthlyKpiRate: 91, alertCount: 0, staffOnDuty: 7, lastInspectionAt: '2026-07-07 09:50' },
];

const MOCK_INSPECTION_TASKS: InspectionTask[] = [
  { id: 'it1', storeId: 's5', storeName: '通州万达店', type: 'hygiene', priority: 'high', status: 'overdue', deadline: '2026-07-07 12:00', assignee: '李强' },
  { id: 'it2', storeId: 's2', storeName: '海淀中关村店', type: 'routine', priority: 'medium', status: 'pending', deadline: '2026-07-08 18:00', assignee: '王丽' },
  { id: 'it3', storeId: 's7', storeName: '丰台科技园店', type: 'compliance', priority: 'high', status: 'assigned', deadline: '2026-07-08 12:00', assignee: '赵刚' },
  { id: 'it4', storeId: 's4', storeName: '望京SOHO店', type: 'device', priority: 'critical', status: 'in_progress', deadline: '2026-07-07 18:00', assignee: '刘伟' },
  { id: 'it5', storeId: 's1', storeName: '朝阳旗舰店', type: 'spot_check', priority: 'low', status: 'pending', deadline: '2026-07-09 18:00', assignee: '张敏' },
];

const MOCK_QUICK_ACTIONS: OpsQuickAction[] = [
  { key: 'new_task', label: '📋 新建巡检任务', primary: true },
  { key: 'alert', label: '⚠️ 处理告警', primary: false },
  { key: 'report', label: '📊 辖区日报', primary: false },
  { key: 'schedule', label: '🗓️ 排班审批', primary: false },
  { key: 'kpi', label: '📈 KPI看板', primary: false },
  { key: 'stock', label: '📦 库存调度', primary: false },
];

export default function OpsManagerPage() {
  return (
    <PageShell title="运营经理工作台" description="运营经理专属工作台 · 北京辖区">
      <OperationsManagerDashboard
        districtSummary={MOCK_DISTRICT_SUMMARY}
        stores={MOCK_STORES}
        inspectionTasks={MOCK_INSPECTION_TASKS}
        quickActions={MOCK_QUICK_ACTIONS}
        managerName="陈晓东"
        districtName="北京辖区"
        lastSyncAt={new Date().toISOString()}
      />
    </PageShell>
  );
}
