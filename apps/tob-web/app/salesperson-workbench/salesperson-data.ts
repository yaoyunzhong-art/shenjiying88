/**
 * salesperson-data.ts — 导购员工作台 Mock 数据
 */

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type CustomerIntent = 'ready' | 'comparing' | 'browsing' | 'follow_up';

export interface SalesTask {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  priority: TaskPriority;
  status: TaskStatus;
  intent: CustomerIntent;
  createdAt: string;
  dueAt: string;
  description: string;
}

export interface DailyMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
}

export interface RecentCustomer {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  intent: CustomerIntent;
  estimatedValue: number;
}

export const TASK_PRIORITY_MAP: Record<TaskPriority, { label: string; variant: 'danger' | 'warning' | 'info' | 'neutral'; color: string }> = {
  urgent: { label: '紧急', variant: 'danger', color: '#ef4444' },
  high: { label: '高', variant: 'warning', color: '#f59e0b' },
  normal: { label: '普通', variant: 'info', color: '#3b82f6' },
  low: { label: '低优', variant: 'neutral', color: '#94a3b8' },
};

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; variant: 'warning' | 'success' | 'info' }> = {
  pending: { label: '待处理', variant: 'warning' },
  in_progress: { label: '进行中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
};

export const CUSTOMER_INTENT_MAP: Record<CustomerIntent, { label: string; color: string }> = {
  ready: { label: '意向强烈', color: '#22c55e' },
  comparing: { label: '比价中', color: '#f59e0b' },
  browsing: { label: '随便看看', color: '#94a3b8' },
  follow_up: { label: '待回访', color: '#3b82f6' },
};

const SALESPERSONS = ['张三', '李四', '王五', '赵六'];
const CURRENT_SALESPERSON = '张三';

const CUSTOMER_NAMES = ['王芳', '李娜', '张伟', '刘洋', '陈静', '杨磊', '赵敏', '黄强', '周杰', '吴秀英'];
const INTENTS: CustomerIntent[] = ['ready', 'comparing', 'browsing', 'follow_up'];
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'normal', 'low'];
const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed'];

export function getCurrentSalesperson(): string {
  return CURRENT_SALESPERSON;
}

export function createMockTasks(count = 8): SalesTask[] {
  const now = new Date('2026-07-08');
  const tasks: SalesTask[] = [];
  for (let i = 1; i <= count; i++) {
    const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)]!;
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]!;
    const intent = INTENTS[Math.floor(Math.random() * INTENTS.length)]!;
    const customerName = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]!;

    const pool = [
      '新品推荐 & 试穿',
      '会员积分兑换咨询',
      'VIP 客户生日回访',
      '售后跟进',
      '促销活动邀约',
      '老客户唤醒',
      '意向客户跟进',
      '退换货处理',
    ];
    const title = pool[Math.floor(Math.random() * pool.length)]!;

    const dueDays = Math.floor(Math.random() * 7) + 1;
    const createdDays = Math.floor(Math.random() * 14) + 1;

    tasks.push({
      id: `task-${String(i).padStart(3, '0')}`,
      title,
      customerName,
      customerPhone: `1${(['38', '39', '50', '86'] as const)[Math.floor(Math.random() * 4)]!}${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      priority,
      status,
      intent,
      createdAt: new Date(now.getTime() - createdDays * 86400000).toISOString().slice(0, 10),
      dueAt: new Date(now.getTime() + dueDays * 86400000).toISOString().slice(0, 10),
      description: `${customerName} 的跟进任务`,
    });
  }
  return tasks;
}

export function createMockDailyMetrics(): DailyMetric[] {
  return [
    { label: '今日接客', value: 23, unit: '人', trend: 'up', changePercent: 12 },
    { label: '今日成交', value: 7, unit: '单', trend: 'up', changePercent: 18 },
    { label: '今日销售额', value: 36800, unit: '元', trend: 'up', changePercent: 8 },
    { label: '待办任务', value: 5, unit: '项', trend: 'down', changePercent: 20 },
  ];
}

export function createMockRecentCustomers(count = 6): RecentCustomer[] {
  const now = new Date('2026-07-08');
  const customers: RecentCustomer[] = [];
  for (let i = 1; i <= count; i++) {
    const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]!;
    const intent = INTENTS[Math.floor(Math.random() * INTENTS.length)]!;
    const daysAgo = Math.floor(Math.random() * 14);
    customers.push({
      id: `cust-${String(i).padStart(3, '0')}`,
      name,
      phone: `1${(['38', '39', '50', '86'] as const)[Math.floor(Math.random() * 4)]!}${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      lastVisit: new Date(now.getTime() - daysAgo * 86400000).toISOString().slice(0, 10),
      intent,
      estimatedValue: Math.floor(Math.random() * 50000) + 1000,
    });
  }
  return customers;
}

export const MOCK_TASKS = createMockTasks(8);
export const MOCK_DAILY_METRICS = createMockDailyMetrics();
export const MOCK_RECENT_CUSTOMERS = createMockRecentCustomers(6);
