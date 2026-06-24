/**
 * 店长工作台页面测试 — storefront-web
 *
 * 覆盖: 页面 props 数据验证 / 各类型 Mock 数据完整性
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// 数据类型定义 (与 @m5/ui StoreManagerDashboard 保持一致)
type PendingTaskType = 'inventory' | 'member' | 'order' | 'device' | 'alert';
type Priority = 'high' | 'medium' | 'low';

interface PendingTask {
  id: string;
  title: string;
  type: PendingTaskType;
  priority: Priority;
  createdAt: string;
  description?: string;
}

interface StoreDailyMetrics {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  newMembers: number;
  revenueTrend: number;
  orderTrend: number;
  avgValueTrend: number;
  memberTrend: number;
}

interface DeviceStatusSummary {
  total: number;
  online: number;
  offline: number;
  warning: number;
  lastCheckAt?: string;
}

interface QuickAction {
  key: string;
  label: string;
  icon?: string;
  primary?: boolean;
}

// 模拟数据 (与 page.tsx 对齐)
const now = new Date();
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

describe('Dashboard (店长工作台) — 数据验证', () => {
  // ---- 运营指标 ----
  describe('dailyMetrics', () => {
    const m = MOCK_DAILY_METRICS;

    it('revenue 应为正数', () => {
      assert.ok(m.revenue > 0, `revenue=${m.revenue} 应为正数`);
    });

    it('orderCount 应为正整数', () => {
      assert.ok(m.orderCount > 0 && Number.isInteger(m.orderCount));
    });

    it('avgOrderValue 应合理', () => {
      assert.ok(m.avgOrderValue > 0);
      assert.ok(m.avgOrderValue < 5000);
    });

    it('newMembers 应 >= 0', () => {
      assert.ok(m.newMembers >= 0);
    });

    it('trend 字段都应存在', () => {
      assert.equal(typeof m.revenueTrend, 'number');
      assert.equal(typeof m.orderTrend, 'number');
      assert.equal(typeof m.avgValueTrend, 'number');
      assert.equal(typeof m.memberTrend, 'number');
    });
  });

  // ---- 待办任务 ----
  describe('pendingTasks', () => {
    const tasks = MOCK_PENDING_TASKS;

    it('任务列表非空', () => {
      assert.ok(tasks.length > 0);
    });

    it('每个任务都有 id 和 title', () => {
      for (const t of tasks) {
        assert.ok(t.id);
        assert.ok(t.title);
      }
    });

    it('type 必须为合法值', () => {
      const valid: PendingTaskType[] = ['inventory', 'member', 'order', 'device', 'alert'];
      for (const t of tasks) {
        assert.ok(valid.includes(t.type), `非法 type: ${t.type}`);
      }
    });

    it('priority 必须为合法值', () => {
      const valid: Priority[] = ['high', 'medium', 'low'];
      for (const t of tasks) {
        assert.ok(valid.includes(t.priority), `非法 priority: ${t.priority}`);
      }
    });

    it('createdAt 必须为有效 ISO 字符串', () => {
      for (const t of tasks) {
        assert.doesNotThrow(() => new Date(t.createdAt).toISOString());
      }
    });
  });

  // ---- 设备状态 ----
  describe('deviceStatus', () => {
    const ds = MOCK_DEVICE_STATUS;

    it('total = online + offline + warning', () => {
      assert.equal(ds.total, ds.online + ds.offline + ds.warning);
    });

    it('每个分量 >= 0', () => {
      assert.ok(ds.online >= 0);
      assert.ok(ds.offline >= 0);
      assert.ok(ds.warning >= 0);
    });

    it('lastCheckAt 为有效 ISO 字符串', () => {
      assert.doesNotThrow(() => new Date(ds.lastCheckAt!).toISOString());
    });
  });

  // ---- 快速操作 ----
  describe('quickActions', () => {
    const qa = MOCK_QUICK_ACTIONS;

    it('操作列表非空', () => {
      assert.ok(qa.length > 0);
    });

    it('每个操作都有 key 和 label', () => {
      for (const a of qa) {
        assert.ok(a.key);
        assert.ok(a.label);
      }
    });

    it('至少有1个 primary 操作', () => {
      const p = qa.filter(a => a.primary);
      assert.ok(p.length >= 1);
    });
  });
});
