/**
 * home-screen.test.ts
 * B页面 - HomeScreen 数据/配置层测试
 * 功能: 验证角色配置、统计数据、快捷操作数据结构
 * Uses node:test (no react-test-renderer — pure logic tests)
 */
import assert from 'node:assert/strict';
import test from 'node:test';

/* ------------------------------------------------------------------ */
/*  Data config (extracted from HomeScreen.tsx for testing)            */
/* ------------------------------------------------------------------ */

type Role = 'shop_manager' | 'cashier' | 'sales';

const roleConfig: Record<Role, { title: string; greeting: string; showStats: string[] }> = {
  shop_manager: {
    title: '张店长',
    greeting: '下午好，张店长',
    showStats: ['revenue', 'orders', 'members', 'tasks'],
  },
  cashier: {
    title: '收银员',
    greeting: '下午好，收银员',
    showStats: ['revenue', 'orders', 'members', 'tasks'],
  },
  sales: {
    title: '导购',
    greeting: '下午好，导购',
    showStats: ['orders', 'members', 'tasks'],
  },
};

const quickActions: Record<Role, { id: string; title: string; icon: string; route: string; color: string }[]> = {
  shop_manager: [
    { id: '1', title: '收银', icon: '💰', route: 'PaymentTab', color: '#10B981' },
    { id: '2', title: '扫码', icon: '📷', route: 'ScanTab', color: '#3B82F6' },
    { id: '3', title: '订单', icon: '📋', route: 'OrdersTab', color: '#8B5CF6' },
    { id: '4', title: '库存', icon: '📦', route: 'InventoryTab', color: '#F59E0B' },
    { id: '5', title: '会员', icon: '👤', route: 'MemberTab', color: '#EC4899' },
    { id: '6', title: '报表', icon: '📊', route: 'Report', color: '#EF4444' },
  ],
  cashier: [
    { id: '1', title: '收银', icon: '💰', route: 'PaymentTab', color: '#10B981' },
    { id: '2', title: '扫码', icon: '📷', route: 'ScanTab', color: '#3B82F6' },
    { id: '3', title: '订单', icon: '📋', route: 'OrdersTab', color: '#8B5CF6' },
    { id: '4', title: '会员', icon: '👤', route: 'MemberTab', color: '#EC4899' },
  ],
  sales: [
    { id: '1', title: '扫码', icon: '📷', route: 'ScanTab', color: '#3B82F6' },
    { id: '2', title: '订单', icon: '📋', route: 'OrdersTab', color: '#8B5CF6' },
    { id: '3', title: '库存', icon: '📦', route: 'InventoryTab', color: '#F59E0B' },
    { id: '4', title: '会员', icon: '👤', route: 'MemberTab', color: '#EC4899' },
  ],
};

const mockStats = {
  todayRevenue: 12580.5,
  orderCount: 86,
  memberCount: 42,
  pendingTasks: 5,
};

const mockTasks = [
  { id: '1', title: '待处理退款 (3)', priority: 'high' as const },
  { id: '2', title: '库存预警 (2)', priority: 'medium' as const },
  { id: '3', title: '员工排班待确认', priority: 'low' as const },
];

const mockAnnouncements = [
  { id: '1', title: '端午活动即将开始', time: '2小时前' },
  { id: '2', title: '系统升级通知', time: '昨天' },
];

/* ------------------------------------------------------------------ */
/*  Test: roleConfig                                                   */
/* ------------------------------------------------------------------ */

test('roleConfig: all three roles are defined', () => {
  const roles = Object.keys(roleConfig);
  assert.deepEqual(roles.sort(), ['cashier', 'sales', 'shop_manager']);
});

test('roleConfig: shop_manager has all 4 stats', () => {
  const { showStats } = roleConfig.shop_manager;
  assert.deepEqual(showStats, ['revenue', 'orders', 'members', 'tasks']);
});

test('roleConfig: cashier has all 4 stats', () => {
  const { showStats } = roleConfig.cashier;
  assert.deepEqual(showStats, ['revenue', 'orders', 'members', 'tasks']);
});

test('roleConfig: sales has 3 stats (no revenue)', () => {
  const { showStats } = roleConfig.sales;
  assert.deepEqual(showStats, ['orders', 'members', 'tasks']);
  assert.equal(showStats.includes('revenue'), false, '导购不应看到营收数据');
});

test('roleConfig: each role has title and greeting', () => {
  for (const [role, config] of Object.entries(roleConfig)) {
    assert.ok(config.title, `${role} 应有title`);
    assert.ok(config.greeting, `${role} 应有greeting`);
    assert.ok(config.greeting.includes(config.title.slice(0, 1)), `问候语应包含姓：${role}`);
  }
});

/* ------------------------------------------------------------------ */
/*  Test: quickActions                                                 */
/* ------------------------------------------------------------------ */

test('quickActions: shop_manager has 6 items', () => {
  assert.equal(quickActions.shop_manager.length, 6);
});

test('quickActions: cashier has 4 items', () => {
  assert.equal(quickActions.cashier.length, 4);
});

test('quickActions: sales has 4 items', () => {
  assert.equal(quickActions.sales.length, 4);
});

test('quickActions: every action has required fields', () => {
  for (const [role, actions] of Object.entries(quickActions)) {
    for (const action of actions) {
      assert.ok(action.id, `${role}/${action.title} 应有id`);
      assert.ok(action.title, `${role} 应有title`);
      assert.ok(action.icon, `${role}/${action.title} 应有icon`);
      assert.ok(action.route, `${role}/${action.title} 应有route`);
      assert.ok(action.color, `${role}/${action.title} 应有color`);
      assert.match(action.color, /^#[0-9A-Fa-f]{6}$/, `${role}/${action.title} 的color应为十六进制颜色`);
    }
  }
});

test('quickActions: all routes are unique per role', () => {
  for (const [role, actions] of Object.entries(quickActions)) {
    const routes = actions.map((a) => a.route);
    const uniqueRoutes = new Set(routes);
    assert.equal(uniqueRoutes.size, routes.length, `${role} 的快捷操作路由应唯一`);
  }
});

test('quickActions: shop_manager routes include Report', () => {
  const routes = quickActions.shop_manager.map((a) => a.route);
  assert.ok(routes.includes('Report'), '店长应包含报表路由');
});

test('quickActions: cashier does not have Report route', () => {
  const routes = quickActions.cashier.map((a) => a.route);
  assert.equal(routes.includes('Report'), false, '收银员不应包含报表路由');
});

/* ------------------------------------------------------------------ */
/*  Test: mockStats                                                    */
/* ------------------------------------------------------------------ */

test('mockStats: revenue is a positive number with 1 decimal', () => {
  assert.equal(typeof mockStats.todayRevenue, 'number');
  assert.ok(mockStats.todayRevenue > 0);
  // 12580.5 should format as ¥12,580.5
  const formatted = `¥${mockStats.todayRevenue.toLocaleString()}`;
  assert.equal(formatted, '¥12,580.5');
});

test('mockStats: all values are finite positive numbers', () => {
  for (const [key, val] of Object.entries(mockStats)) {
    assert.ok(typeof val === 'number' && isFinite(val), `${key} 应为有限数字`);
    assert.ok(val >= 0, `${key} 应 >= 0`);
  }
});

/* ------------------------------------------------------------------ */
/*  Test: mockTasks                                                    */
/* ------------------------------------------------------------------ */

test('mockTasks: has 3 tasks with correct priorities', () => {
  assert.equal(mockTasks.length, 3);
  assert.equal(mockTasks[0].priority, 'high');
  assert.equal(mockTasks[1].priority, 'medium');
  assert.equal(mockTasks[2].priority, 'low');
});

test('mockTasks: all tasks have unique ids', () => {
  const ids = mockTasks.map((t) => t.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

/* ------------------------------------------------------------------ */
/*  Test: mockAnnouncements                                            */
/* ------------------------------------------------------------------ */

test('mockAnnouncements: has 2 items with all fields', () => {
  assert.equal(mockAnnouncements.length, 2);
  for (const item of mockAnnouncements) {
    assert.ok(item.id);
    assert.ok(item.title);
    assert.ok(item.time);
  }
});

test('mockAnnouncements: titles are meaningful', () => {
  const titles = mockAnnouncements.map((a) => a.title);
  assert.ok(titles.some((t) => t.includes('端午')), '应包含端午活动公告');
  assert.ok(titles.some((t) => t.includes('系统升级')), '应包含系统升级公告');
});
