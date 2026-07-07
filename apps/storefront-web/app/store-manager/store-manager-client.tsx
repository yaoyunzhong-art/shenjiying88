'use client';

import React from 'react';
import {
  StoreManagerDashboard,
  type StoreDailyMetrics,
  type PendingTask,
  type DeviceStatusSummary,
  type QuickAction,
} from '@m5/ui';

// ============================================================
// Mock 店长工作台数据
// ============================================================

const MOCK_METRICS: StoreDailyMetrics = {
  revenue: 52800,
  orderCount: 342,
  avgOrderValue: 154.4,
  newMembers: 12,
  revenueTrend: 5.2,
  orderTrend: -1.3,
  avgValueTrend: 3.1,
  memberTrend: 8.0,
};

const MOCK_TASKS: PendingTask[] = [
  { id: 't1', title: 'SKU-089 库存不足 (仅剩3件)', type: 'inventory', priority: 'high', createdAt: '10:45', description: '单品咖啡豆库存低于安全阈值，建议今日补货' },
  { id: 't2', title: '钻石会员张先生投诉未处理', type: 'member', priority: 'high', createdAt: '09:30', description: '会员反馈积分未到账，需客服主管跟进' },
  { id: 't3', title: 'POS-02 打印机缺纸', type: 'device', priority: 'medium', createdAt: '08:15', description: '前台2号POS小票纸用尽，请及时更换' },
  { id: 't4', title: '晚班排班表待确认', type: 'order', priority: 'medium', createdAt: '昨日', description: '本周六晚班人员安排需店长审批' },
  { id: 't5', title: '冷藏柜温度异常通知', type: 'alert', priority: 'low', createdAt: '昨日', description: '冷藏柜夜间温度波动+2°C，已自动恢复' },
];

const MOCK_DEVICE_STATUS: DeviceStatusSummary = {
  total: 48,
  online: 42,
  offline: 3,
  warning: 3,
  lastCheckAt: new Date().toISOString(),
};

const MOCK_ACTIONS: QuickAction[] = [
  { key: 'scan', label: '📷 扫码入库', primary: true },
  { key: 'order', label: '📋 新建订单' },
  { key: 'member', label: '👤 会员查询' },
  { key: 'device', label: '🔧 设备巡检' },
  { key: 'report', label: '📊 营收报表' },
  { key: 'shift', label: '🔄 交接班' },
];

// ============================================================
// 店长工作台客户端组件
// ============================================================

export function StoreManagerDashboardClient() {
  return (
    <StoreManagerDashboard
      storeName="朝阳旗舰店"
      dailyMetrics={MOCK_METRICS}
      pendingTasks={MOCK_TASKS}
      deviceStatus={MOCK_DEVICE_STATUS}
      quickActions={MOCK_ACTIONS}
      lastSyncAt={new Date().toISOString()}
    />
  );
}
