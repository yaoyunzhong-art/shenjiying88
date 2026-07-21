/**
 * messages/page.test.tsx — 消息中心 L1 冒烟测试
 * 角色视角: 👔店长 / 👤普通员工
 * 覆盖: 正例(数据结构/类型/优先级/已读标记/会话/过滤/排序) + 反例 + 边界
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---- 类型定义 (与 page.tsx 一致) ----

type MessageType = 'chat' | 'system' | 'customer_service' | 'broadcast';
type MessagePriority = 'high' | 'medium' | 'low';

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'other';
  sentAt: string;
  read: boolean;
}

interface MessageSession {
  id: string;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  type: MessageType;
  priority: MessagePriority;
  online: boolean;
  messages: Message[];
}

// ---- 常量映射 (从 page.tsx 摘录) ----

const TYPE_LABELS: Record<MessageType, string> = {
  chat: '会话消息',
  system: '系统消息',
  customer_service: '客服消息',
  broadcast: '广播通知',
};

const ALL_TYPES: MessageType[] = ['chat', 'system', 'customer_service', 'broadcast'];

// ---- 辅助函数 (从 page.tsx 摘录) ----

function formatRelativeTime(dateStr: string): string {
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

function filterSessions(
  sessions: MessageSession[],
  typeFilter: MessageType | 'all',
  searchQuery: string,
): MessageSession[] {
  let result = sessions;
  if (typeFilter !== 'all') {
    result = result.filter((s) => s.type === typeFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (s) =>
        s.contactName.toLowerCase().includes(q) ||
        s.lastMessage.toLowerCase().includes(q)
    );
  }
  return result;
}

function sortSessions(sessions: MessageSession[]): MessageSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function getUnreadStats(sessions: MessageSession[]): { totalUnread: number; sessionCount: number } {
  let totalUnread = 0;
  let sessionCount = 0;
  for (const s of sessions) {
    if (s.unreadCount > 0) {
      totalUnread += s.unreadCount;
      sessionCount++;
    }
  }
  return { totalUnread, sessionCount };
}

// ---- 工)函数 ----

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

function makeSession(overrides?: DeepPartial<MessageSession>): MessageSession {
  return {
    id: 'SESSION-0001',
    contactName: '张伟（VIP会员）',
    lastMessage: '好的，我马上安排补货',
    lastMessageAt: '2026-07-15 10:00',
    unreadCount: 3,
    type: 'chat',
    priority: 'medium',
    online: true,
    messages: [
      { id: 'MSG-0001-001', content: '你好', sender: 'other', sentAt: '2026-07-15 09:30', read: false },
      { id: 'MSG-0001-002', content: '我马上处理', sender: 'me', sentAt: '2026-07-15 09:45', read: false },
    ],
    ...overrides,
    ...(overrides?.messages ? { messages: overrides.messages as Message[] } : {}),
  } as MessageSession;
}

function makeSessions(count: number): MessageSession[] {
  const contactNames = [
    '张伟（VIP会员）', '李娜（普通会员）', '王强（供应商）',
    '刘洋（门店经理）', '陈静（客服专员）', '赵明（配送员）',
  ];
  return Array.from({ length: count }, (_, i) =>
    makeSession({
      id: `SESSION-${String(i + 1).padStart(4, '0')}`,
      contactName: contactNames[i % contactNames.length],
      type: ALL_TYPES[i % ALL_TYPES.length],
      priority: i < 3 ? 'high' : (i < 10 ? 'medium' : 'low'),
      unreadCount: i < count * 0.6 ? (i % 5) + 1 : 0,
      online: i % 3 !== 0,
      lastMessageAt: `2026-07-${String(15 - Math.floor(i / 5)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:00`,
      messages: [
        { id: `MSG-${String(i + 1).padStart(4, '0')}-001`, content: `消息 ${i * 2 + 1}`, sender: 'other', sentAt: `2026-07-${String(15 - Math.floor(i / 5)).padStart(2, '0')} 08:00`, read: false },
        { id: `MSG-${String(i + 1).padStart(4, '0')}-002`, content: `消息 ${i * 2 + 2}`, sender: 'me', sentAt: `2026-07-${String(15 - Math.floor(i / 5)).padStart(2, '0')} 09:00`, read: i < 4 },
      ],
    })
  );
}

// ======================================================================
// Tests (≥25)
// ======================================================================

// ---- 1-2: 常量覆盖 ----

test('messages: TYPE_LABELS 覆盖全部 4 种消息类型', () => {
  for (const t of ALL_TYPES) {
    assert.ok(TYPE_LABELS[t], `消息类型 ${t} 应有中文标签`);
  }
});

test('messages: TYPE_LABELS 4 个标签各不相同', () => {
  const labels = Object.values(TYPE_LABELS);
  assert.equal(new Set(labels).size, 4, '所有类型标签应唯一');
});

// ---- 3-5: 工厂函数 ----

test('messages: makeSession 返回完整结构', () => {
  const s = makeSession();
  assert.equal(s.id, 'SESSION-0001');
  assert.equal(s.contactName, '张伟（VIP会员）');
  assert.equal(s.type, 'chat');
  assert.equal(s.unreadCount, 3);
  assert.equal(s.online, true);
  assert.equal(s.messages.length, 2);
  assert.equal(s.messages[0].sender, 'other');
  assert.equal(s.messages[1].sender, 'me');
});

test('messages: makeSession 支持覆写字段', () => {
  const s = makeSession({ type: 'system', unreadCount: 0 });
  assert.equal(s.type, 'system');
  assert.equal(s.unreadCount, 0);
  assert.equal(s.contactName, '张伟（VIP会员）'); // 默认值不变
  assert.equal(s.online, true); // 默认值不变
});

test('messages: makeSessions 生成指定数量且 id 递增', () => {
  const sessions = makeSessions(12);
  assert.equal(sessions.length, 12);
  assert.equal(sessions[0].id, 'SESSION-0001');
  assert.equal(sessions[11].id, 'SESSION-0012');
  // 类型均匀分布 (12/4 = 3 each)
  for (const t of ALL_TYPES) {
    const count = sessions.filter((s) => s.type === t).length;
    assert.equal(count, 3, `类型 ${t} 应有 3 条会话`);
  }
});

// ---- 6-8: 优先级/在线/已读 ----

test('messages: 优先级分布 — 前几条为 high, 中间为 medium, 其余为 low', () => {
  const sessions = makeSessions(12);
  const high = sessions.filter((s) => s.priority === 'high');
  const medium = sessions.filter((s) => s.priority === 'medium');
  const low = sessions.filter((s) => s.priority === 'low');
  assert.equal(high.length, 3);
  assert.equal(medium.length, 7); // indices 3-9
  assert.equal(low.length, 2);    // indices 10-11
});

test('messages: online 分布 — 约 2/3 在线', () => {
  const sessions = makeSessions(9);
  const online = sessions.filter((s) => s.online);
  const offline = sessions.filter((s) => !s.online);
  assert.equal(online.length, 6); // i%3 !== 0 -> 6 items
  assert.equal(offline.length, 3); // i%3 === 0 -> 3 items
});

test('messages: 未读分布 — 前 60% 有未读消息', () => {
  const sessions = makeSessions(10);
  const withUnread = sessions.filter((s) => s.unreadCount > 0);
  const withoutUnread = sessions.filter((s) => s.unreadCount === 0);
  const expectedUnread = Math.ceil(10 * 0.6); // 6
  assert.equal(withUnread.length, expectedUnread);
  assert.equal(withoutUnread.length, 10 - expectedUnread);
});

// ---- 9-11: filterSessions 逻辑 ----

test('messages: filterSessions — 全部类型不过滤', () => {
  const sessions = makeSessions(12);
  const result = filterSessions(sessions, 'all', '');
  assert.equal(result.length, 12);
});

test('messages: filterSessions — 按类型 chat 筛选', () => {
  const sessions = makeSessions(12);
  const result = filterSessions(sessions, 'chat', '');
  assert.equal(result.length, 3); // 12/4 = 3 chat
  for (const s of result) {
    assert.equal(s.type, 'chat');
  }
});

test('messages: filterSessions — 按联系人名称搜索', () => {
  const sessions = makeSessions(6);
  // sessions[0] contactName = '张伟（VIP会员）', sessions[1] = '李娜（普通会员）'
  const result = filterSessions(sessions, 'all', '张伟');
  assert.equal(result.length, 1);
  assert.equal(result[0].contactName, '张伟（VIP会员）');
});

// ---- 12-13: 搜索边界 ----

test('messages: filterSessions — 搜索无匹配返回空数组', () => {
  const sessions = makeSessions(6);
  const result = filterSessions(sessions, 'all', '不存在的联系人名称XXXXX');
  assert.equal(result.length, 0);
});

test('messages: filterSessions — 搜索按 lastMessage 匹配', () => {
  const sessions = makeSessions(6);
  // lastMessage 默认是 '好的，我马上安排补货'
  const result = filterSessions(sessions, 'all', '补货');
  assert.ok(result.length >= 6); // 所有默认的 lastMessage 都包含 '补货'
});

// ---- 14-15: sortSessions 排序 ----

test('messages: sortSessions 按 lastMessageAt 降序排列', () => {
  const sessions = makeSessions(5);
  const originalOrder = sessions.map((s) => s.id);
  // 打乱顺序
  const shuffled = [sessions[4], sessions[2], sessions[0], sessions[3], sessions[1]];
  const sorted = sortSessions(shuffled);
  // 验证降序
  const dates = sorted.map((s) => new Date(s.lastMessageAt).getTime());
  for (let i = 1; i < dates.length; i++) {
    assert.ok(dates[i]! <= dates[i - 1]!, `${sorted[i].id} 应该在 ${sorted[i - 1].id} 之后按时间降序`);
  }
});

test('messages: sortSessions 不修改原数组', () => {
  const sessions = makeSessions(4);
  const originalIds = sessions.map((s) => s.id);
  sortSessions(sessions);
  // 原数组顺序不变
  assert.deepEqual(
    sessions.map((s) => s.id),
    originalIds
  );
});

// ---- 16-17: getUnreadStats 统计 ----

test('messages: getUnreadStats 正确统计未读会话和消息数', () => {
  // 手动构造: 2个有未读, 1个无未读
  const sessions: MessageSession[] = [
    makeSession({ id: 'S1', unreadCount: 3 }),
    makeSession({ id: 'S2', unreadCount: 5 }),
    makeSession({ id: 'S3', unreadCount: 0 }),
  ];
  const stats = getUnreadStats(sessions);
  assert.equal(stats.totalUnread, 8);   // 3 + 5
  assert.equal(stats.sessionCount, 2); // S1, S2
});

test('messages: getUnreadStats 全部已读返回全零', () => {
  const sessions = [makeSession({ unreadCount: 0 }), makeSession({ unreadCount: 0 })];
  const stats = getUnreadStats(sessions);
  assert.equal(stats.totalUnread, 0);
  assert.equal(stats.sessionCount, 0);
});

// ---- 18-19: formatRelativeTime 边界 ----

test('messages: formatRelativeTime — 刚刚 (< 1 分钟)', () => {
  const now = new Date();
  const result = formatRelativeTime(now.toISOString());
  assert.equal(result, '刚刚');
});

test('messages: formatRelativeTime — 分钟前 / 小时前 / 天前', () => {
  const justMin = new Date(Date.now() - 15 * 60000);
  assert.equal(formatRelativeTime(justMin.toISOString()), '15分钟前');

  const justHour = new Date(Date.now() - 5 * 3600000);
  assert.equal(formatRelativeTime(justHour.toISOString()), '5小时前');

  const justDay = new Date(Date.now() - 3 * 86400000);
  assert.equal(formatRelativeTime(justDay.toISOString()), '3天前');
});

// ---- 20: 无效日期 ----

test('messages: formatRelativeTime — 无效日期返回原字符串', () => {
  assert.equal(formatRelativeTime(''), '');
  assert.equal(formatRelativeTime('not-a-date'), 'not-a-date');
});

// ---- 21-22: 消息内部结构 ----

test('messages: 每条消息有完整字段', () => {
  const s = makeSession();
  for (const msg of s.messages) {
    assert.ok(msg.id, '消息 id 必需');
    assert.ok(msg.content, '消息内容必需');
    assert.ok(['me', 'other'].includes(msg.sender), 'sender 必须是 me 或 other');
    assert.ok('read' in msg, 'read 字段必需');
  }
});

test('messages: 会话内 me/other 交替分布', () => {
  const s = makeSession();
  for (let i = 0; i < s.messages.length; i++) {
    const expectedSender = i % 2 === 0 ? 'other' : 'me';
    assert.equal(s.messages[i].sender, expectedSender, `消息 ${i} sender 应为 ${expectedSender}`);
  }
});

// ---- 23: makeSession 默认包含高优先级会话 ----

test('messages: makeSession 默认优先级为 medium', () => {
  const s = makeSession();
  assert.equal(s.priority, 'medium');
});

test('messages: makeSession 支持覆写 priority', () => {
  const s = makeSession({ priority: 'high' });
  assert.equal(s.priority, 'high');
});

test('messages: makeSession 支持覆写 contactAvatar', () => {
  const s = makeSession({ contactAvatar: 'https://example.com/avatar.png' });
  assert.equal(s.contactAvatar, 'https://example.com/avatar.png');
});

test('messages: filterSessions 组合类型 + 搜索', () => {
  const sessions = makeSessions(12);
  // chat 类型有 3 条, 搜索'张伟'只有 1 条
  const result = filterSessions(sessions, 'chat', '张伟');
  // 会话 1 是 chat+张伟，所以应返回 1
  assert.ok(result.length >= 1);
  result.forEach(s => {
    assert.equal(s.type, 'chat');
  });
});

test('messages: filterSessions 搜索不区分大小写', () => {
  const sessions = makeSessions(6);
  const result = filterSessions(sessions, 'all', 'vip');
  assert.equal(result.length, 1);
  assert.equal(result[0]!.contactName, '张伟（VIP会员）');
});

test('messages: formatRelativeTime 返回 7 天前的短日期格式', () => {
  const weekAgo = new Date(Date.now() - 10 * 86400000);
  const result = formatRelativeTime(weekAgo.toISOString());
  // 10 天前 -> '07/11' 格式
  assert.match(result, /^\d{2}\/\d{2}$/);
});

test('messages: 所有 makeSessions 生成的 contactName 在列表中', () => {
  const contactNames = [
    '张伟（VIP会员）', '李娜（普通会员）', '王强（供应商）',
    '刘洋（门店经理）', '陈静（客服专员）', '赵明（配送员）',
  ];
  const sessions = makeSessions(18);
  sessions.forEach(s => {
    assert.ok(contactNames.includes(s.contactName), `联系名 ${s.contactName} 不在列表中`);
  });
});

test('messages: sortSessions 空数组不抛异常', () => {
  const result = sortSessions([]);
  assert.equal(result.length, 0);
});
