import assert from 'node:assert';
import { describe, it } from 'node:test';

// ---- 类型定义 (从 page.tsx 复制) ----

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'alert' | 'reminder' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  targetScope: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET';
  targetId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

type NotifStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const TYPE_MAP: Record<NotificationItem['type'], { label: string; variant: NotifStatusVariant }> = {
  system: { label: '系统', variant: 'neutral' },
  alert: { label: '告警', variant: 'danger' },
  reminder: { label: '提醒', variant: 'warning' },
  announcement: { label: '公告', variant: 'success' },
};

const PRIORITY_MAP: Record<NotificationItem['priority'], { label: string; variant: NotifStatusVariant }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'success' },
  high: { label: '高', variant: 'warning' },
  urgent: { label: '紧急', variant: 'danger' },
};

const STATUS_MAP: Record<NotificationItem['status'], { label: string; variant: NotifStatusVariant }> = {
  unread: { label: '未读', variant: 'warning' },
  read: { label: '已读', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

const SCOPE_MAP: Record<NotificationItem['targetScope'], string> = {
  PLATFORM: '平台',
  TENANT: '租户',
  BRAND: '品牌',
  STORE: '门店',
  MARKET: '市场',
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', title: '系统维护通知', content: '平台将于 2026-06-16 02:00-04:00 进行季度维护', type: 'system', priority: 'high', status: 'unread', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'system', createdAt: '2026-06-14 04:00:00', expiresAt: '2026-06-17 04:00:00' },
  { id: 'n2', title: '日本市场激活成功', content: '日本市场已完成激活', type: 'announcement', priority: 'medium', status: 'unread', targetScope: 'MARKET', targetId: 'm-005', createdBy: 'admin@m5.com', createdAt: '2026-06-14 03:30:00', expiresAt: '2026-07-14 03:30:00' },
  { id: 'n3', title: '证书即将过期', content: 'SSL 证书 cert-007 将在 7 天内过期', type: 'alert', priority: 'urgent', status: 'unread', targetScope: 'PLATFORM', targetId: 'cert-007', createdBy: 'system', createdAt: '2026-06-14 03:00:00', expiresAt: '2026-06-28 03:00:00' },
  { id: 'n4', title: '租户配额提醒', content: 'API 调用配额已使用 85%', type: 'reminder', priority: 'medium', status: 'unread', targetScope: 'TENANT', targetId: 't-001', createdBy: 'system', createdAt: '2026-06-14 02:30:00', expiresAt: '2026-06-21 02:30:00' },
  { id: 'n5', title: '门店暂停通知', content: '门店因消防安全整改已暂停', type: 'alert', priority: 'high', status: 'read', targetScope: 'STORE', targetId: 's-005', createdBy: 'admin@m5.com', createdAt: '2026-06-14 02:00:00', expiresAt: '2026-06-21 02:00:00' },
  { id: 'n6', title: '品牌等级升级', content: '品牌已升级为旗舰级', type: 'announcement', priority: 'medium', status: 'read', targetScope: 'BRAND', targetId: 'b-004', createdBy: 'brand-mgr@m5.com', createdAt: '2026-06-13 18:00:00', expiresAt: '2026-07-13 18:00:00' },
  { id: 'n7', title: '新功能发布', content: '智能搜索已上线', type: 'announcement', priority: 'low', status: 'read', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'product@m5.com', createdAt: '2026-06-13 15:00:00', expiresAt: '2026-09-13 15:00:00' },
  { id: 'n8', title: '边缘节点离线', content: '边缘节点已离线超过 1 小时', type: 'alert', priority: 'urgent', status: 'unread', targetScope: 'STORE', targetId: 's-003', createdBy: 'system', createdAt: '2026-06-13 14:30:00', expiresAt: '2026-06-14 14:30:00' },
  { id: 'n9', title: '季度审计报告', content: 'Q2 审计报告已生成', type: 'system', priority: 'low', status: 'archived', targetScope: 'PLATFORM', targetId: 'platform', createdBy: 'system', createdAt: '2026-06-13 12:00:00', expiresAt: '2026-09-30 12:00:00' },
  { id: 'n10', title: '网关配额超限', content: '网关请求量超过上限 40%', type: 'reminder', priority: 'high', status: 'unread', targetScope: 'TENANT', targetId: 't-002', createdBy: 'system', createdAt: '2026-06-13 11:00:00', expiresAt: '2026-06-15 11:00:00' },
];

// ---- 纯函数工具 ----

/** 基础搜索过滤 */
function filterBySearch(items: NotificationItem[], term: string, fields: (keyof NotificationItem)[]): NotificationItem[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => String(item[f]).toLowerCase().includes(lower))
  );
}

/** 按状态筛选 */
function filterByStatus(items: NotificationItem[], status: NotificationItem['status'] | 'ALL'): NotificationItem[] {
  return status === 'ALL' ? items : items.filter((item) => item.status === status);
}

/** 按类型筛选 */
function filterByType(items: NotificationItem[], type: NotificationItem['type'] | 'ALL'): NotificationItem[] {
  return type === 'ALL' ? items : items.filter((item) => item.type === type);
}

/** 按优先级筛选 */
function filterByPriority(items: NotificationItem[], priority: NotificationItem['priority'] | 'ALL'): NotificationItem[] {
  return priority === 'ALL' ? items : items.filter((item) => item.priority === priority);
}

/** 按作用域筛选 */
function filterByScope(items: NotificationItem[], scope: NotificationItem['targetScope'] | 'ALL'): NotificationItem[] {
  return scope === 'ALL' ? items : items.filter((item) => item.targetScope === scope);
}

/** 排序（支持升序/降序） */
function sortByKey<T>(items: T[], key: keyof T, direction: 'asc' | 'desc'): T[] {
  return [...items].sort((a, b) => {
    const va = String(a[key] ?? '');
    const vb = String(b[key] ?? '');
    const cmp = va.localeCompare(vb);
    return direction === 'asc' ? cmp : -cmp;
  });
}

/** 分页 */
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** 统计 */
function computeStats(items: NotificationItem[]) {
  return {
    total: items.length,
    unread: items.filter((n) => n.status === 'unread').length,
    alert: items.filter((n) => n.type === 'alert').length,
    urgent: items.filter((n) => n.priority === 'urgent').length,
  };
}

// ---- Tests ----

describe('notifications-data / 通知中心数据层', () => {
  const searchFields: (keyof NotificationItem)[] = ['title', 'content', 'createdBy', 'targetId'];

  describe('filterBySearch', () => {
    it('空搜索词返回全部', () => {
      assert.strictEqual(filterBySearch(MOCK_NOTIFICATIONS, '', searchFields).length, 10);
      assert.strictEqual(filterBySearch(MOCK_NOTIFICATIONS, '  ', searchFields).length, 10);
    });

    it('按标题搜索', () => {
      const r = filterBySearch(MOCK_NOTIFICATIONS, '维护', searchFields);
      assert.ok(r.length >= 1);
      assert.ok(r.every((n) => n.title.includes('维护') || n.content.includes('维护')));
    });

    it('按发布者搜索', () => {
      const r = filterBySearch(MOCK_NOTIFICATIONS, 'admin@m5', searchFields);
      assert.strictEqual(r.length, 2); // n2, n5
      assert.strictEqual(r[0]!.id, 'n2');
      assert.strictEqual(r[1]!.id, 'n5');
    });

    it('按目标ID搜索', () => {
      const r = filterBySearch(MOCK_NOTIFICATIONS, 't-001', searchFields);
      assert.strictEqual(r.length, 1);
      assert.strictEqual(r[0]!.id, 'n4');
    });

    it('不存在的关键词返回空数组', () => {
      const r = filterBySearch(MOCK_NOTIFICATIONS, 'zzz_not_exist_999', searchFields);
      assert.strictEqual(r.length, 0);
    });

    it('大小写不敏感', () => {
      const r = filterBySearch(MOCK_NOTIFICATIONS, 'SYSTEM', searchFields);
      assert.ok(r.length >= 1);
    });
  });

  describe('filterByStatus', () => {
    it('ALL 返回全部', () => {
      assert.strictEqual(filterByStatus(MOCK_NOTIFICATIONS, 'ALL').length, 10);
    });

    it('unread 过滤', () => {
      const r = filterByStatus(MOCK_NOTIFICATIONS, 'unread');
      assert.ok(r.every((n) => n.status === 'unread'));
      // 期望: n1, n2, n3, n4, n8, n10 = 6
      assert.strictEqual(r.length, 6);
    });

    it('read 过滤', () => {
      const r = filterByStatus(MOCK_NOTIFICATIONS, 'read');
      assert.ok(r.every((n) => n.status === 'read'));
      assert.strictEqual(r.length, 3); // n5, n6, n7
    });

    it('archived 过滤', () => {
      const r = filterByStatus(MOCK_NOTIFICATIONS, 'archived');
      assert.ok(r.every((n) => n.status === 'archived'));
      assert.strictEqual(r.length, 1); // n9
    });
  });

  describe('filterByType', () => {
    it('alert 过滤', () => {
      const r = filterByType(MOCK_NOTIFICATIONS, 'alert');
      assert.ok(r.every((n) => n.type === 'alert'));
      assert.strictEqual(r.length, 3); // n3, n5, n8
    });

    it('system 过滤', () => {
      const r = filterByType(MOCK_NOTIFICATIONS, 'system');
      assert.strictEqual(r.length, 2); // n1, n9
    });

    it('announcement 过滤', () => {
      const r = filterByType(MOCK_NOTIFICATIONS, 'announcement');
      assert.strictEqual(r.length, 3); // n2, n6, n7
    });
  });

  describe('filterByPriority', () => {
    it('urgent 过滤', () => {
      const r = filterByPriority(MOCK_NOTIFICATIONS, 'urgent');
      assert.ok(r.every((n) => n.priority === 'urgent'));
      assert.strictEqual(r.length, 2); // n3, n8
    });

    it('low 过滤', () => {
      const r = filterByPriority(MOCK_NOTIFICATIONS, 'low');
      assert.strictEqual(r.length, 2); // n7, n9
    });
  });

  describe('filterByScope', () => {
    it('PLATFORM 过滤', () => {
      const r = filterByScope(MOCK_NOTIFICATIONS, 'PLATFORM');
      assert.strictEqual(r.length, 4); // n1, n3, n7, n9
    });

    it('STORE 过滤', () => {
      const r = filterByScope(MOCK_NOTIFICATIONS, 'STORE');
      assert.strictEqual(r.length, 2); // n5, n8
    });

    it('MARKET 过滤', () => {
      const r = filterByScope(MOCK_NOTIFICATIONS, 'MARKET');
      assert.strictEqual(r.length, 1); // n2
    });
  });

  describe('filterByStatus + filterByType + filterByPriority 复合过滤', () => {
    it('未读 + 告警', () => {
      const s = filterByStatus(MOCK_NOTIFICATIONS, 'unread');
      const t = filterByType(s, 'alert');
      const r = filterByPriority(t, 'urgent');
      assert.strictEqual(r.length, 2); // n3, n8
      assert.ok(r.every((n) => n.status === 'unread' && n.type === 'alert' && n.priority === 'urgent'));
    });

    it('已读 + 公告', () => {
      const s = filterByStatus(MOCK_NOTIFICATIONS, 'read');
      const t = filterByType(s, 'announcement');
      assert.strictEqual(t.length, 2); // n6, n7
    });
  });

  describe('sortByKey', () => {
    it('按 createdAt 升序', () => {
      const r = sortByKey(MOCK_NOTIFICATIONS, 'createdAt', 'asc');
      // idx 0 = 最早
      assert.strictEqual(r[0]!.createdAt, '2026-06-13 11:00:00');
      assert.strictEqual(r[r.length - 1]!.createdAt, '2026-06-14 04:00:00');
    });

    it('按 createdAt 降序', () => {
      const r = sortByKey(MOCK_NOTIFICATIONS, 'createdAt', 'desc');
      assert.strictEqual(r[0]!.createdAt, '2026-06-14 04:00:00');
      assert.strictEqual(r[r.length - 1]!.createdAt, '2026-06-13 11:00:00');
    });

    it('按 title 排序', () => {
      const r = sortByKey(MOCK_NOTIFICATIONS, 'title', 'asc');
      assert.ok(r[0]!.title.localeCompare(r[1]!.title) <= 0);
    });
  });

  describe('paginate', () => {
    it('第1页, pageSize=5', () => {
      const r = paginate(MOCK_NOTIFICATIONS, 1, 5);
      assert.strictEqual(r.length, 5);
      assert.strictEqual(r[0]!.id, 'n1');
    });

    it('第2页, pageSize=5', () => {
      const r = paginate(MOCK_NOTIFICATIONS, 2, 5);
      assert.strictEqual(r.length, 5);
      assert.strictEqual(r[0]!.id, 'n6');
    });

    it('第3页, pageSize=5 (超出)', () => {
      const r = paginate(MOCK_NOTIFICATIONS, 3, 5);
      assert.strictEqual(r.length, 0);
    });

    it('pageSize=3, 第4页返回 1 条', () => {
      const r = paginate(MOCK_NOTIFICATIONS, 4, 3);
      assert.strictEqual(r.length, 1); // 第10条
      assert.strictEqual(r[0]!.id, 'n10');
    });
  });

  describe('computeStats', () => {
    it('正确计算统计数据', () => {
      const s = computeStats(MOCK_NOTIFICATIONS);
      assert.strictEqual(s.total, 10);
      assert.strictEqual(s.unread, 6);
      assert.strictEqual(s.alert, 3);
      assert.strictEqual(s.urgent, 2);
    });

    it('全部已读时的统计', () => {
      const allRead = MOCK_NOTIFICATIONS.map((n) => ({ ...n, status: 'read' as const }));
      const s = computeStats(allRead);
      assert.strictEqual(s.unread, 0);
    });
  });

  describe('TYPE_MAP / PRIORITY_MAP / STATUS_MAP / SCOPE_MAP 映射', () => {
    it('所有 type 都有映射', () => {
      const types: NotificationItem['type'][] = ['system', 'alert', 'reminder', 'announcement'];
      types.forEach((t) => {
        assert.ok(TYPE_MAP[t], `缺少 TYPE_MAP[${t}]`);
        assert.ok(TYPE_MAP[t].label);
        assert.ok(TYPE_MAP[t].variant);
      });
    });

    it('所有 priority 都有映射', () => {
      const priorities: NotificationItem['priority'][] = ['low', 'medium', 'high', 'urgent'];
      priorities.forEach((p) => {
        assert.ok(PRIORITY_MAP[p], `缺少 PRIORITY_MAP[${p}]`);
        assert.ok(PRIORITY_MAP[p].label);
        assert.ok(PRIORITY_MAP[p].variant);
      });
    });

    it('所有 status 都有映射', () => {
      const statuses: NotificationItem['status'][] = ['unread', 'read', 'archived'];
      statuses.forEach((s) => {
        assert.ok(STATUS_MAP[s], `缺少 STATUS_MAP[${s}]`);
        assert.ok(STATUS_MAP[s].label);
        assert.ok(STATUS_MAP[s].variant);
      });
    });

    it('所有 targetScope 都有映射', () => {
      const scopes: NotificationItem['targetScope'][] = ['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'MARKET'];
      scopes.forEach((s) => {
        assert.ok(SCOPE_MAP[s], `缺少 SCOPE_MAP[${s}]`);
      });
    });
  });
});
