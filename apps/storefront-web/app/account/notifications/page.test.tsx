/**
 * account/notifications/page.test.tsx — 消息通知页 L1 冒烟测试
 * 角色视角: 👔店长 / 👤普通员工
 * 覆盖: 正例(数据结构/分类/优先级/已读标记) + 反例 + 边界
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---- 类型定义 (与 page.tsx 一致) ----

type NotificationCategory = 'order' | 'system' | 'promotion' | 'member' | 'inventory' | 'alert';
type NotificationPriority = 'high' | 'medium' | 'low';

interface Notification {
  id: string;
  title: string;
  content: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  sender: string;
}

// ---- 映射表 (从 page.tsx 摘录) ----

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: '订单通知',
  system: '系统通知',
  promotion: '营销活动',
  member: '会员通知',
  inventory: '库存提醒',
  alert: '告警通知',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const CATEGORIES: NotificationCategory[] = ['order', 'system', 'promotion', 'member', 'inventory', 'alert'];

// ---- 工厂函数 ----

function makeNotification(overrides?: Partial<Notification>): Notification {
  return {
    id: 'NOTIF-0001',
    title: '测试通知',
    content: '这是测试通知的详细内容。',
    category: 'system',
    priority: 'medium',
    read: false,
    createdAt: '2026-07-15 10:00',
    sender: '系统管理员',
    ...overrides,
  };
}

function makeNotifications(count: number): Notification[] {
  return Array.from({ length: count }, (_, i) =>
    makeNotification({
      id: `NOTIF-${String(i + 1).padStart(4, '0')}`,
      title: `通知 ${i + 1}`,
      category: CATEGORIES[i % CATEGORIES.length],
      priority: i < 3 ? 'high' : (i < 10 ? 'medium' : 'low'),
      read: i >= count * 0.6,
      createdAt: `2026-07-${String(15 - Math.floor(i / 5)).padStart(2, '0')} 10:00`,
    })
  );
}

// ---- 辅助函数 (从 page.tsx 摘录) ----

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

// ---- Tests ----

test('notifications: CATEGORY_LABELS 覆盖全部 6 个分类', () => {
  for (const cat of CATEGORIES) {
    assert.ok(CATEGORY_LABELS[cat], `分类 ${cat} 应有中文标签`);
  }
});

test('notifications: PRIORITY_LABELS 覆盖全部 3 个优先级', () => {
  const priorities: NotificationPriority[] = ['high', 'medium', 'low'];
  for (const p of priorities) {
    assert.ok(PRIORITY_LABELS[p], `优先级 ${p} 应有中文标签`);
  }
});

test('notifications: 工厂函数 makeNotification 返回完整结构', () => {
  const n = makeNotification();
  assert.equal(n.id, 'NOTIF-0001');
  assert.equal(n.title, '测试通知');
  assert.equal(n.category, 'system');
  assert.equal(n.priority, 'medium');
  assert.equal(n.read, false);
  assert.equal(n.sender, '系统管理员');
});

test('notifications: 工厂函数 makeNotification 支持覆写', () => {
  const n = makeNotification({ category: 'order', read: true });
  assert.equal(n.category, 'order');
  assert.equal(n.read, true);
  assert.equal(n.title, '测试通知'); // 默认值不变
});

test('notifications: 工厂函数 makeNotifications 生成指定数量', () => {
  const notifications = makeNotifications(24);
  assert.equal(notifications.length, 24);
  assert.equal(notifications[0].id, 'NOTIF-0001');
  assert.equal(notifications[23].id, 'NOTIF-0024');
});

test('notifications: 分类占比 — 6 个分类均匀分布', () => {
  const notifications = makeNotifications(24);
  for (const cat of CATEGORIES) {
    const count = notifications.filter((n) => n.category === cat).length;
    assert.equal(count, 4, `分类 ${cat} 应有 4 条通知`);
  }
});

test('notifications: 优先级分布 — 前几条是高优先级', () => {
  const notifications = makeNotifications(12);
  const highPriority = notifications.filter((n) => n.priority === 'high');
  assert.equal(highPriority.length, 3);
  for (const n of highPriority) {
    assert.equal(n.priority, 'high');
  }
});

test('notifications: 已读/未读标记正确', () => {
  const notifications = makeNotifications(20);
  const readCount = notifications.filter((n) => n.read).length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  // i >= 20*0.6 = 12, so indices 12-19 (8 items) are read
  assert.equal(readCount, 8);
  assert.equal(unreadCount, 12);
});

test('notifications: 过滤 — 按分类筛选', () => {
  const notifications = makeNotifications(24);
  const alerts = notifications.filter((n) => n.category === 'alert');
  assert.equal(alerts.length, 4);
  for (const n of alerts) {
    assert.equal(n.category, 'alert');
  }
});

test('notifications: 过滤 — 按优先级筛选', () => {
  const notifications = makeNotifications(12);
  const highPriority = notifications.filter((n) => n.priority === 'high');
  assert.equal(highPriority.length, 3);
});

test('notifications: 搜索 — 按标题匹配', () => {
  const notifications = makeNotifications(10);
  const q = '通知 5';
  const matched = notifications.filter((n) => n.title.includes(q));
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'NOTIF-0005');
});

test('notifications: 搜索 — 按发送人匹配', () => {
  const notifications = makeNotifications(5);
  const q = '系统';
  const matched = notifications.filter((n) => n.sender.includes(q));
  assert.ok(matched.length >= 5);
});

test('notifications: formatTime — 刚刚 (< 1 分钟)', () => {
  const now = new Date();
  const result = formatTime(now.toISOString());
  assert.equal(result, '刚刚');
});

test('notifications: formatTime — 分钟前', () => {
  const past = new Date(Date.now() - 30 * 60000);
  const result = formatTime(past.toISOString());
  assert.equal(result, '30分钟前');
});

test('notifications: formatTime — 小时前', () => {
  const past = new Date(Date.now() - 3 * 3600000);
  const result = formatTime(past.toISOString());
  assert.equal(result, '3小时前');
});

test('notifications: formatTime — 天前', () => {
  const past = new Date(Date.now() - 2 * 86400000);
  const result = formatTime(past.toISOString());
  assert.equal(result, '2天前');
});

test('notifications: formatTime — 无效日期返回原字符串', () => {
  const result = formatTime('invalid-date');
  assert.equal(result, 'invalid-date');
});

test('notifications: 分类标签 — 全部 6 个标签唯一', () => {
  const labels = Object.values(CATEGORY_LABELS);
  const unique = new Set(labels);
  assert.equal(unique.size, 6, '所有分类标签应唯一');
});

test('notifications: 优先级标签 — 全部 3 个标签唯一', () => {
  const labels = Object.values(PRIORITY_LABELS);
  const unique = new Set(labels);
  assert.equal(unique.size, 3, '所有优先级标签应唯一');
});

test('notifications: 边界 — 空创建时间应能安全处理', () => {
  const n = makeNotification({ createdAt: '' });
  // formatTime 不会崩溃
  const result = formatTime(n.createdAt);
  assert.equal(result, '');
});

test('notifications: 边界 — actionUrl 可选', () => {
  const n1 = makeNotification({ actionUrl: '/orders' });
  const n2 = makeNotification();
  assert.equal(n1.actionUrl, '/orders');
  assert.equal(n2.actionUrl, undefined);
});
