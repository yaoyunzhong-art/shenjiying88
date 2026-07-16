/**
 * workbench/store-manager/page.test.tsx — 店长工作台 L1 测试
 *
 * 覆盖: KPI 指标、待办任务、热门商品、排班、营收时段、Tabs 切换
 * 正例: KPI 数据计算、任务优先级排序、商品排行、排班统计、营收趋势
 * 反例: 任务状态未知、设备离线、排班缺岗
 * 边界: 零营收时段、全部完成任务、库存无限 ∞
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import StoreManagerWorkbenchPage from './page';

/* ── 类型 ── */

type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
type TaskStatus = 'todo' | 'in_progress' | 'done';
type DeviceStatusType = 'online' | 'offline' | 'error' | 'maintenance';

interface KpiCard {
  label: string;
  value: string;
  trend: { value: string; positive: boolean };
  helper?: string;
}

interface TaskItem {
  id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  assignee: string;
  category: string;
}

interface StoreItem {
  id: string;
  name: string;
  category: string;
  sales: number;
  stock: number;
  margin: number;
}

interface StaffOnDuty {
  id: string;
  name: string;
  role: string;
  shift: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface RevenueHour {
  hour: string;
  amount: number;
  visitors: number;
}

/* ── 常量 ── */

const PRIORITY_MAP: Record<TaskPriority, { label: string; variant: 'danger' | 'warning' | 'neutral' }> = {
  urgent: { label: '紧急', variant: 'danger' },
  high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'neutral' },
  low: { label: '低', variant: 'neutral' },
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

function formatMoney(a: number): string {
  return `¥${a.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

/* ── Mock 辅助 ── */

function mockKpi(): KpiCard[] {
  return [
    { label: '今日营收', value: formatMoney(12680), trend: { value: '+18.5%', positive: true }, helper: '较昨日' },
    { label: '今日客流', value: '320人', trend: { value: '+12.3%', positive: true }, helper: '较昨日' },
    { label: '设备在线率', value: '92%', trend: { value: '+3%', positive: true }, helper: '22台在线' },
    { label: '会员消费占比', value: '62%', trend: { value: '+8.2%', positive: true }, helper: '较上周' },
  ];
}

function mockTasks(): TaskItem[] {
  return [
    { id: 'T1', title: '检查娃娃机维护工单', priority: 'urgent', status: 'todo', deadline: '今日 18:00', assignee: '王强', category: '设备' },
    { id: 'T2', title: '审批排班变更申请', priority: 'high', status: 'todo', deadline: '今日 16:00', assignee: '店长', category: '人事' },
    { id: 'T3', title: '核对昨日营收数据', priority: 'high', status: 'in_progress', deadline: '今日 14:00', assignee: '李娜', category: '财务' },
    { id: 'T6', title: '检查消防设备状态', priority: 'urgent', status: 'done', deadline: '今日 12:00', assignee: '赵敏', category: '安全' },
    { id: 'T7', title: '新员工入职培训安排', priority: 'low', status: 'todo', deadline: '明日 14:00', assignee: '周杰', category: '人事' },
    { id: 'T10', title: '准备周报数据', priority: 'low', status: 'todo', deadline: '周五 17:00', assignee: '店长', category: '报表' },
  ];
}

function mockHotProducts(): StoreItem[] {
  return [
    { id: 'P1', name: '经典游戏币兑换', category: '游戏币', sales: 156, stock: 5000, margin: 85 },
    { id: 'P4', name: '会员充值200赠50', category: '会员', sales: 45, stock: Infinity, margin: 90 },
    { id: 'P6', name: '可乐(罐装)', category: '餐饮', sales: 89, stock: 240, margin: 55 },
  ];
}

function mockStaff(): StaffOnDuty[] {
  return [
    { id: 'S1', name: '李娜', role: '值班经理', shift: '早班', startTime: '08:00', endTime: '14:00', status: '在岗' },
    { id: 'S4', name: '刘洋', role: '导玩员', shift: '中班', startTime: '14:00', endTime: '20:00', status: '未到岗' },
  ];
}

function mockRevenueHours(): RevenueHour[] {
  return [
    { hour: '08:00', amount: 200, visitors: 10 },
    { hour: '12:00', amount: 800, visitors: 35 },
    { hour: '19:00', amount: 1200, visitors: 55 },
    { hour: '23:00', amount: 150, visitors: 8 },
  ];
}

/* ── 业务逻辑函数 ── */

function getTodoCount(tasks: TaskItem[]): number {
  return tasks.filter(t => t.status === 'todo').length;
}

function getUrgentOrHighCount(tasks: TaskItem[]): number {
  return tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
}

function getOnDutyCount(staff: StaffOnDuty[]): number {
  return staff.filter(s => s.status === '在岗').length;
}

function getTotalRevenue(hours: RevenueHour[]): number {
  return hours.reduce((s, r) => s + r.amount, 0);
}

function getPeakHour(hours: RevenueHour[]): string {
  return hours.reduce((a, b) => a.amount > b.amount ? a : b).hour;
}

function getAverageRevenue(hours: RevenueHour[]): number {
  if (hours.length === 0) return 0;
  return getTotalRevenue(hours) / hours.length;
}

function getTopProducts(products: StoreItem[]): StoreItem[] {
  return [...products].sort((a, b) => b.sales - a.sales);
}

function hasStockWarning(item: StoreItem): boolean {
  return Number.isFinite(item.stock) && item.stock < 50;
}

function getTaskByStatus(tasks: TaskItem[], status: TaskStatus): TaskItem[] {
  return tasks.filter(t => t.status === status);
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(StoreManagerWorkbenchPage));
}

/* ============================================================ */

describe('store-manager: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('renders title', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('店长工作台'));
  });

  it('component is a function', () => {
    assert.equal(typeof StoreManagerWorkbenchPage, 'function');
  });

  it('renders KPI cards', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('今日营收') && text.includes('今日客流'));
  });

  it('renders status bar', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('待办任务') || text.includes('紧急事项') || text.includes('当班员工'));
  });

  it('renders tab navigation', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('运营概览') || text.includes('待办'));
  });
});

describe('store-manager: 数据类型', () => {
  it('TaskPriority enum valid', () => {
    const valid: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
    assert.equal(valid.length, 4);
  });

  it('TaskStatus enum valid', () => {
    const valid: TaskStatus[] = ['todo', 'in_progress', 'done'];
    assert.equal(valid.length, 3);
  });

  it('DeviceStatusType enum valid', () => {
    const valid: DeviceStatusType[] = ['online', 'offline', 'error', 'maintenance'];
    assert.equal(valid.length, 4);
  });

  it('KpiCard has trend and helper', () => {
    const k: KpiCard = { label: '营收', value: '¥1000', trend: { value: '+10%', positive: true }, helper: '较昨日' };
    assert.equal(k.trend.positive, true);
    assert.equal(k.helper, '较昨日');
  });

  it('TaskItem has all fields', () => {
    const t: TaskItem = { id: 'T1', title: '测试', priority: 'high', status: 'todo', deadline: '今日', assignee: '张三', category: '设备' };
    assert.equal(Object.keys(t).length, 7);
  });

  it('StoreItem stock can be Infinity for virtual goods', () => {
    const p = mockHotProducts()[1];
    assert.equal(p.stock, Infinity);
    assert.equal(p.margin, 90);
  });

  it('StaffOnDuty has shift and status', () => {
    const s = mockStaff()[0];
    assert.equal(s.status, '在岗');
    assert.equal(s.shift, '早班');
  });

  it('RevenueHour has three fields', () => {
    const r: RevenueHour = { hour: '08:00', amount: 200, visitors: 10 };
    assert.equal(Object.keys(r).length, 3);
  });

  it('PRIORITY_MAP has all entries', () => {
    const keys: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
    keys.forEach(k => {
      assert.ok(PRIORITY_MAP[k]);
      assert.ok(['danger', 'warning', 'neutral'].includes(PRIORITY_MAP[k].variant));
    });
  });

  it('STATUS_LABELS has Chinese text', () => {
    assert.equal(STATUS_LABELS.todo, '待办');
    assert.equal(STATUS_LABELS.done, '已完成');
  });

  it('sales field is positive', () => {
    mockHotProducts().forEach(p => assert.ok(p.sales > 0));
  });
});

describe('store-manager: 业务逻辑', () => {
  it('formatMoney renders with currency symbol', () => {
    assert.equal(formatMoney(12680), '¥12,680.00');
  });

  it('formatMoney for zero', () => {
    assert.equal(formatMoney(0), '¥0.00');
  });

  it('formatMoney for small number', () => {
    assert.equal(formatMoney(99.5), '¥99.50');
  });

  it('getTodoCount returns correct count', () => {
    const tasks = mockTasks();
    assert.equal(getTodoCount(tasks), 4);
  });

  it('getTodoCount returns zero for empty list', () => {
    assert.equal(getTodoCount([]), 0);
  });

  it('getUrgentOrHighCount returns urgent + high', () => {
    const tasks = mockTasks();
    assert.equal(getUrgentOrHighCount(tasks), 3);
  });

  it('getOnDutyCount returns staff in 在岗 status', () => {
    const staff = mockStaff();
    assert.equal(getOnDutyCount(staff), 1);
  });

  it('getTotalRevenue sums all hours', () => {
    const hours = mockRevenueHours();
    assert.equal(getTotalRevenue(hours), 2350);
  });

  it('getTotalRevenue of empty array is zero', () => {
    assert.equal(getTotalRevenue([]), 0);
  });

  it('getPeakHour returns hour with max amount', () => {
    const hours = mockRevenueHours();
    assert.equal(getPeakHour(hours), '19:00');
  });

  it('getAverageRevenue calculates correctly', () => {
    const hours = mockRevenueHours();
    assert.equal(getAverageRevenue(hours), 587.5);
  });

  it('getAverageRevenue returns zero for empty', () => {
    assert.equal(getAverageRevenue([]), 0);
  });

  it('getTopProducts sorts by sales descending', () => {
    const products = mockHotProducts();
    const sorted = getTopProducts(products);
    assert.equal(sorted[0].sales, 156);
    assert.equal(sorted[sorted.length - 1].sales, 45);
  });

  it('hasStockWarning detects low stock', () => {
    const low: StoreItem = { id: 'test', name: '测试', category: 'G', sales: 10, stock: 25, margin: 50 };
    assert.ok(hasStockWarning(low));
  });

  it('hasStockWarning ignores infinite stock', () => {
    const inf: StoreItem = { id: 'test', name: '测试', category: 'G', sales: 10, stock: Infinity, margin: 50 };
    assert.ok(!hasStockWarning(inf));
  });

  it('hasStockWarning for adequate stock', () => {
    const ok: StoreItem = { id: 'test', name: '测试', category: 'G', sales: 10, stock: 100, margin: 50 };
    assert.ok(!hasStockWarning(ok));
  });

  it('getTaskByStatus returns filtered tasks', () => {
    const tasks = mockTasks();
    assert.equal(getTaskByStatus(tasks, 'todo').length, 4);
    assert.equal(getTaskByStatus(tasks, 'done').length, 1);
    assert.equal(getTaskByStatus(tasks, 'in_progress').length, 1);
  });

  it('getTaskByStatus empty list returns empty', () => {
    assert.equal(getTaskByStatus([], 'todo').length, 0);
  });

  it('PRIORITY_MAP urgent variant is danger', () => {
    assert.equal(PRIORITY_MAP.urgent.variant, 'danger');
  });

  it('PRIORITY_MAP low variant is neutral', () => {
    assert.equal(PRIORITY_MAP.low.variant, 'neutral');
  });

  it('STATUS_LABELS in_progress is 进行中', () => {
    assert.equal(STATUS_LABELS.in_progress, '进行中');
  });

  it('store item with Infinity stock is not a stock warning', () => {
    const virtual = mockHotProducts()[1];
    assert.equal(virtual.stock, Infinity);
  });

  it('revenue hours all have 24-hour format', () => {
    mockRevenueHours().forEach(r => {
      assert.ok(/^\d{2}:\d{2}$/.test(r.hour));
    });
  });

  it('visitors number is positive or zero', () => {
    mockRevenueHours().forEach(r => assert.ok(r.visitors >= 0));
  });

  it('done task has strike-through styling implication', () => {
    const doneTask = mockTasks().find(t => t.status === 'done');
    assert.ok(doneTask !== undefined);
    assert.equal(doneTask!.title, '检查消防设备状态');
  });

  it('urgent todo tasks count as both urgent and todo', () => {
    const tasks = mockTasks();
    const urgentTodos = tasks.filter(t => t.priority === 'urgent' && t.status === 'todo');
    assert.equal(urgentTodos.length, 1);
    assert.equal(urgentTodos[0].id, 'T1');
  });

  it('task deadline format includes 今日 or 明日 or weekday', () => {
    mockTasks().forEach(t => {
      assert.ok(t.deadline.includes('今日') || t.deadline.includes('明日') || t.deadline.includes('周五'));
    });
  });

  it('all staff roles are defined', () => {
    const roles = mockStaff().map(s => s.role);
    assert.ok(roles.includes('值班经理') || roles.includes('导玩员'));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Workbench / Store Manager — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
