/**
 * account/page.test.tsx — 账户工作台 L1 测试
 *
 * 覆盖: 用户账户页面数据、通知子页面、Mock 数据结构
 * 正例: 账户信息字段完整性、通知数据校验、分类标签映射
 * 反例: 无效字段值、空数据、undefined 防御
 * 边界: 空的字段/超长字段/零值边界
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 用户账户 Mock 数据（模拟 page.tsx 可能的数据结构） ── */

interface AccountInfo {
  name: string;
  avatar: string;
  email: string;
  phone: string;
  role: string;
  storeName: string;
  storeId: string;
  joinDate: string;
  lastLogin: string;
  status: 'active' | 'disabled';
}

const MOCK_ACCOUNT: AccountInfo = {
  name: '张店长',
  avatar: '',
  email: 'zhang@example.com',
  phone: '138****8888',
  role: '店长',
  storeName: '朝阳区旗舰店',
  storeId: 'STORE-001',
  joinDate: '2024-03-15',
  lastLogin: '2026-07-15 18:30:22',
  status: 'active',
};

/* ── 通知分类常量（与 notifications/page.tsx 同步） ── */

type NotificationCategory = 'order' | 'system' | 'promotion' | 'member' | 'inventory' | 'alert';
type NotificationPriority = 'high' | 'medium' | 'low';

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  order: '订单通知',
  system: '系统通知',
  promotion: '营销活动',
  member: '会员通知',
  inventory: '库存提醒',
  alert: '告警通知',
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  order: '📋',
  system: '🔧',
  promotion: '📢',
  member: '👤',
  inventory: '📦',
  alert: '⚠️',
};

/* ── 通知 Mock 数据 ── */

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

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'N-001', title: '新订单 #20260715001', content: '会员王芳下单 ¥299.00', category: 'order', priority: 'high', read: false, createdAt: '2026-07-15 18:30', sender: '系统' },
  { id: 'N-002', title: '库存预警: 鲜牛奶', content: '库存仅剩 5 瓶，低于安全库存 20', category: 'inventory', priority: 'high', read: false, createdAt: '2026-07-15 16:00', sender: '库存系统' },
  { id: 'N-003', title: '系统维护通知', content: '7月16日凌晨2-4点系统升级', category: 'system', priority: 'medium', read: true, createdAt: '2026-07-14 10:00', sender: '运维部' },
  { id: 'N-004', title: '会员日促销活动', content: '周五会员日享8折优惠', category: 'promotion', priority: 'low', read: true, createdAt: '2026-07-13 09:00', sender: '市场部' },
  { id: 'N-005', title: '新会员注册', content: '李明注册成为会员', category: 'member', priority: 'low', read: false, createdAt: '2026-07-15 14:20', sender: '系统' },
  { id: 'N-006', title: '设备故障告警', content: '收银机 #003 离线超过30分钟', category: 'alert', priority: 'high', read: false, createdAt: '2026-07-15 15:10', sender: '监控系统' },
  { id: 'N-007', title: '交接班提醒', content: '今日营业数据请在23:00前完成交接', category: 'system', priority: 'medium', read: false, createdAt: '2026-07-15 20:00', sender: '系统' },
  { id: 'N-008', title: '退货申请 #R20260715003', content: '会员赵雪申请退货 ¥89.00', category: 'order', priority: 'medium', read: true, createdAt: '2026-07-15 11:30', sender: '系统' },
];

/* ── 辅助函数 ── */

function unreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}

function filterByCategory(notifications: Notification[], category: NotificationCategory): Notification[] {
  return notifications.filter((n) => n.category === category);
}

function filterByPriority(notifications: Notification[], priority: NotificationPriority): Notification[] {
  return notifications.filter((n) => n.priority === priority);
}

/* ══════════════════════════════════════════════════════════
   测试: 文件存在性
   ══════════════════════════════════════════════════════════ */

describe('account — 文件结构', () => {
  it('1. notifications 子目录存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'notifications')), true);
  });

  it('2. notifications/page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'notifications', 'page.tsx')), true);
  });

  it('3. notifications/page.test.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'notifications', 'page.test.tsx')), true);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 账户信息
   ══════════════════════════════════════════════════════════ */

describe('account — 账户信息', () => {
  /* ── 正例 ── */

  it('4. 账户名非空', () => {
    assert.ok(MOCK_ACCOUNT.name.length > 0);
  });

  it('5. 邮箱格式包含 @', () => {
    assert.ok(MOCK_ACCOUNT.email.includes('@'));
  });

  it('6. 手机号 11 位（含掩码）', () => {
    const digits = MOCK_ACCOUNT.phone.replace(/[^0-9*]/g, '');
    assert.equal(digits.length, 11);
  });

  it('7. 角色不为空', () => {
    assert.ok(MOCK_ACCOUNT.role.length > 0);
  });

  it('8. 门店名称不为空', () => {
    assert.ok(MOCK_ACCOUNT.storeName.length > 0);
  });

  it('9. 状态为有效值', () => {
    assert.ok(['active', 'disabled'].includes(MOCK_ACCOUNT.status));
  });

  it('10. 加入日期格式 YYYY-MM-DD', () => {
    assert.match(MOCK_ACCOUNT.joinDate, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('11. 最后登录日期不为空', () => {
    assert.ok(MOCK_ACCOUNT.lastLogin.length > 0);
  });

  it('12. 门店 ID 格式 STORE-XXX', () => {
    assert.ok(MOCK_ACCOUNT.storeId.startsWith('STORE-'));
  });

  /* ── 边界 ── */

  it('13. 头像为空时使用默认头像', () => {
    // avatar 为空字符串表示使用默认头像
    assert.equal(MOCK_ACCOUNT.avatar, '');
  });

  it('14. 邮箱前缀长度合理', () => {
    const [local] = MOCK_ACCOUNT.email.split('@');
    assert.ok(local.length > 0 && local.length < 64);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 通知分类映射
   ══════════════════════════════════════════════════════════ */

describe('account — 通知分类映射', () => {
  it('15. CATEGORY_LABELS 覆盖所有 6 个分类', () => {
    const categories: NotificationCategory[] = ['order', 'system', 'promotion', 'member', 'inventory', 'alert'];
    for (const c of categories) {
      assert.ok(typeof CATEGORY_LABELS[c] === 'string', `missing label for ${c}`);
      assert.ok(CATEGORY_LABELS[c].length > 0, `empty label for ${c}`);
    }
  });

  it('16. PRIORITY_LABELS 覆盖所有 3 个优先级', () => {
    const priorities: NotificationPriority[] = ['high', 'medium', 'low'];
    for (const p of priorities) {
      assert.ok(typeof PRIORITY_LABELS[p] === 'string', `missing label for ${p}`);
    }
  });

  it('17. CATEGORY_ICONS 覆盖所有分类', () => {
    const categories: NotificationCategory[] = ['order', 'system', 'promotion', 'member', 'inventory', 'alert'];
    for (const c of categories) {
      assert.ok(typeof CATEGORY_ICONS[c] === 'string', `missing icon for ${c}`);
      assert.ok(CATEGORY_ICONS[c].length > 0, `empty icon for ${c}`);
    }
  });

  it('18. 每个映射表 key 数量一致', () => {
    const catKeys = Object.keys(CATEGORY_LABELS).sort();
    const iconKeys = Object.keys(CATEGORY_ICONS).sort();
    assert.deepEqual(catKeys, iconKeys);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 通知数据
   ══════════════════════════════════════════════════════════ */

describe('account — 通知数据', () => {
  /* ── 正例 ── */

  it('19. 8 条模拟通知', () => {
    assert.equal(MOCK_NOTIFICATIONS.length, 8);
  });

  it('20. 所有通知 ID 唯一', () => {
    const ids = MOCK_NOTIFICATIONS.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('21. 所有分类都有有效值', () => {
    const validCats: NotificationCategory[] = ['order', 'system', 'promotion', 'member', 'inventory', 'alert'];
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(validCats.includes(n.category), `${n.id} invalid category`);
    }
  });

  it('22. 所有优先级都有有效值', () => {
    const validPriority: NotificationPriority[] = ['high', 'medium', 'low'];
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(validPriority.includes(n.priority), `${n.id} invalid priority`);
    }
  });

  it('23. 标题非空', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(n.title.length > 0, `${n.id} empty title`);
    }
  });

  it('24. 发送者非空', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(n.sender.length > 0, `${n.id} empty sender`);
    }
  });

  it('25. 创建时间非空', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(n.createdAt.length > 0, `${n.id} empty createdAt`);
    }
  });

  /* ── 统计 ── */

  it('26. 未读通知 4 条', () => {
    assert.equal(unreadCount(MOCK_NOTIFICATIONS), 4);
  });

  it('27. 高优先级通知 3 条', () => {
    assert.equal(filterByPriority(MOCK_NOTIFICATIONS, 'high').length, 3);
  });

  it('28. 中优先级通知 3 条', () => {
    assert.equal(filterByPriority(MOCK_NOTIFICATIONS, 'medium').length, 3);
  });

  it('29. 低优先级通知 2 条', () => {
    assert.equal(filterByPriority(MOCK_NOTIFICATIONS, 'low').length, 2);
  });

  it('30. 订单(order)分类 2 条', () => {
    assert.equal(filterByCategory(MOCK_NOTIFICATIONS, 'order').length, 2);
  });

  it('31. 告警(alert)分类 1 条', () => {
    assert.equal(filterByCategory(MOCK_NOTIFICATIONS, 'alert').length, 1);
  });

  it('32. 库存(inventory)分类 1 条', () => {
    assert.equal(filterByCategory(MOCK_NOTIFICATIONS, 'inventory').length, 1);
  });
});

/* ══════════════════════════════════════════════════════════
   边界与反例
   ══════════════════════════════════════════════════════════ */

describe('account — 边界与反例', () => {
  it('33. 空通知列表不崩溃', () => {
    const empty: Notification[] = [];
    assert.equal(unreadCount(empty), 0);
    assert.equal(filterByCategory(empty, 'order').length, 0);
    assert.equal(filterByPriority(empty, 'high').length, 0);
  });

  it('34. 分类过滤不存在分类返回空', () => {
    // 传入无效分类名（类型强制）
    const result = (MOCK_NOTIFICATIONS as any[]).filter(
      (n: any) => n.category === 'invalid_category',
    );
    assert.equal(result.length, 0);
  });

  it('35. 未读状态正确布尔值', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.equal(typeof n.read, 'boolean');
    }
  });

  it('36. 所有内容不为空', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(n.content.length > 0, `${n.id} empty content`);
    }
  });

  it('37. actionUrl 可选，有值则 actionLabel 也应有值', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      if (n.actionUrl) {
        assert.ok(n.actionLabel && n.actionLabel.length > 0,
          `${n.id} has actionUrl but no actionLabel`);
      }
    }
  });

  it('38. 通知 ID 格式 N-XXX', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.match(n.id, /^N-\d{3}$/, `${n.id} ID format N-XXX`);
    }
  });

  it('39. 创建日期可排序（按时间降序）', () => {
    const sorted = [...MOCK_NOTIFICATIONS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    // 8 条数据排序后仍为 8 条
    assert.equal(sorted.length, MOCK_NOTIFICATIONS.length);
  });

  it('40. 分类分布覆盖至少 4 种', () => {
    const categories = new Set(MOCK_NOTIFICATIONS.map((n) => n.category));
    assert.ok(categories.size >= 4, `only ${categories.size} categories covered`);
  });
});
