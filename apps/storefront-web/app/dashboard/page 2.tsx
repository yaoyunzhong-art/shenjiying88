'use client';

import React, { useMemo } from 'react';
import { StoreManagerDashboard } from '@m5/ui';
import type {
  StoreDailyMetrics,
  PendingTask,
  DeviceStatusSummary,
  QuickAction,
} from '@m5/ui';

// ============================================================
//  Mock 数据
// ============================================================

const MOCK_DAILY_METRICS: StoreDailyMetrics = {
  revenue: 58260.00,
  orderCount: 247,
  avgOrderValue: 235.87,
  newMembers: 18,
  revenueTrend: 12.5,
  orderTrend: 8.3,
  avgValueTrend: -1.2,
  memberTrend: 25.0,
};

const now = new Date();
const MOCK_PENDING_TASKS: PendingTask[] = [
  { id: 't1', title: '生鲜到货待验收', type: 'inventory', priority: 'high', createdAt: now.toISOString(), description: '生鲜区今日到货批次待验收' },
  { id: 't2', title: 'VIP 会员投诉跟进', type: 'member', priority: 'high', createdAt: new Date(now.getTime() - 3600000).toISOString(), description: 'VIP 会员反馈服务质量问题' },
  { id: 't3', title: '打印机碳粉更换', type: 'device', priority: 'medium', createdAt: new Date(now.getTime() - 7200000).toISOString(), description: '厨房打印机碳粉不足' },
  { id: 't4', title: '核对今日交班报表', type: 'order', priority: 'medium', createdAt: new Date(now.getTime() - 14400000).toISOString() },
  { id: 't5', title: '库存盘点 — 饮料区', type: 'inventory', priority: 'low', createdAt: new Date(now.getTime() - 86400000).toISOString(), description: '饮料区月盘，预计2小时' },
];

const MOCK_DEVICE_STATUS: DeviceStatusSummary = {
  total: 10,
  online: 7,
  offline: 1,
  warning: 2,
  lastCheckAt: now.toISOString(),
};

const MOCK_QUICK_ACTIONS: QuickAction[] = [
  { key: 'qa1', label: '创建调拨单', icon: '📦', primary: true },
  { key: 'qa2', label: '新增会员', icon: '👤' },
  { key: 'qa3', label: '查看告警', icon: '🔔' },
  { key: 'qa4', label: '销售预测', icon: '📈' },
];

// ============================================================
//  店长工作台页面
// ============================================================

export default function DashboardPage() {
  const lastSyncAt = useMemo(() => new Date().toISOString(), []);

  return (
    <StoreManagerDashboard
      storeName=" Shenjiying 旗舰店 (门店 #001)"
      dailyMetrics={MOCK_DAILY_METRICS}
      pendingTasks={MOCK_PENDING_TASKS}
      deviceStatus={MOCK_DEVICE_STATUS}
      quickActions={MOCK_QUICK_ACTIONS}
      lastSyncAt={lastSyncAt}
      loading={false}
      className="store-dashboard"
    />
  );
}
