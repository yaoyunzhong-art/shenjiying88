// ---- node --test runner ----
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const React = require('react');
const {
  NotificationCenter,
  useNotificationSummary,
} = require('./NotificationCenter');

// ---- 测试工厂 ----

/**
 * @param {object} [overrides]
 * @returns {import('./NotificationCenter').NotificationItem}
 */
function makeNotification(overrides) {
  return Object.assign({
    id: `n-${Math.random().toString(36).slice(2, 8)}`,
    title: '测试通知',
    description: '这是一条测试通知的描述',
    severity: 'info',
    category: 'system',
    timestamp: Date.now() - 60000,
    read: false,
  }, overrides);
}

// ============== NotificationCenter 组件测试 ==============

describe('NotificationCenter', () => {
  test('renders empty state when no notifications', () => {
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications: [] })
    );
    assert.match(html, /暂无通知/);
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications: [],
        emptyText: '一切正常',
      })
    );
    assert.match(html, /一切正常/);
    assert.doesNotMatch(html, /暂无通知/);
  });

  test('renders notification items', () => {
    const notifications = [
      makeNotification({ id: '1', title: '系统更新通知' }),
      makeNotification({ id: '2', title: '设备异常告警', severity: 'error', category: 'device' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /系统更新通知/);
    assert.match(html, /设备异常告警/);
  });

  test('shows unread badge when unread exists', () => {
    const notifications = [
      makeNotification({ id: '1', read: false }),
      makeNotification({ id: '2', read: false }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, />2</);
  });

  test('does not show unread badge when all read', () => {
    const notifications = [
      makeNotification({ id: '1', read: true }),
      makeNotification({ id: '2', read: true }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    // "2" should only appear as count in the "全部" tab if all are read and badge is hidden
    // badge should not be rendered (nothing with red background around unread count)
    assert.doesNotMatch(html, /#ef4444.*>\s*2\s*</);
  });

  test('renders category labels for all categories', () => {
    const notifications = [
      makeNotification({ id: '1', category: 'system' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /系统/);
    assert.match(html, /会员/);
    assert.match(html, /设备/);
    assert.match(html, /订单/);
    assert.match(html, /告警/);
    assert.match(html, /全部/);
  });

  test('shows severity icons', () => {
    const notifications = [
      makeNotification({ id: '1', severity: 'error', category: 'alert' }),
      makeNotification({ id: '2', severity: 'warning', category: 'device' }),
      makeNotification({ id: '3', severity: 'success', category: 'order' }),
      makeNotification({ id: '4', severity: 'info', category: 'member' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    // All items rendered — check severity color dots
    assert.match(html, /#f87171/); // error
    assert.match(html, /#fbbf24/); // warning
    assert.match(html, /#4ade80/); // success
    assert.match(html, /#60a5fa/); // info
  });

  test('renders unread dot for unread notifications', () => {
    const notifications = [
      makeNotification({ id: '1', read: false }),
      makeNotification({ id: '2', read: true }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    // Unread dot has SEVERITY_DOT_COLORS; check for the unread indicator style
    // unread items get different background
    assert.match(html, /rgba\(99, 102, 241, 0\.04\)/);
    // read items get transparent bg
    // The unread dot styling uses the severity color
  });

  test('shows notification description', () => {
    const notifications = [
      makeNotification({ id: '1', description: '会员张三点数余额不足' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /会员张三点数余额不足/);
  });

  test('renders without description', () => {
    const notifications = [
      makeNotification({ id: '1', description: '', title: '无描述通知' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /无描述通知/);
  });

  test('renders notification actions', () => {
    const notifications = [
      makeNotification({
        id: '1',
        title: '新订单',
        category: 'order',
        actions: [
          { label: '查看', onClick: () => {}, variant: 'primary' },
          { label: '忽略', onClick: () => {}, variant: 'secondary' },
        ],
      }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /查看/);
    assert.match(html, /忽略/);
  });

  test('shows formatted timestamp', () => {
    const notifications = [
      makeNotification({ id: '1', timestamp: Date.now() - 30000 }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /刚刚/);
  });

  test('has correct aria attributes', () => {
    const notifications = [makeNotification({ id: '1' })];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /通知中心/);
    assert.match(html, /role="listitem"/);
  });

  test('custom maxHeight applied', () => {
    const notifications = Array.from({ length: 20 }, (_, i) =>
      makeNotification({ id: `${i}`, title: `通知 ${i}` })
    );
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications,
        maxHeight: 300,
      })
    );
    assert.match(html, /max-height:300px/);
  });

  test('default maxHeight is 480', () => {
    const notifications = [makeNotification({ id: '1' })];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /max-height:480px/);
  });

  test('renders "全部已读" button when unread exists', () => {
    const notifications = [
      makeNotification({ id: '1', read: false }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications,
        onMarkAllAsRead: () => {},
      })
    );
    assert.match(html, /全部已读/);
  });

  test('renders "清空已读" button when read items exist', () => {
    const notifications = [
      makeNotification({ id: '1', read: true }),
      makeNotification({ id: '2', read: false }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications,
        onClearRead: () => {},
      })
    );
    assert.match(html, /清空已读/);
  });

  test('does not show "全部已读" when all read', () => {
    const notifications = [
      makeNotification({ id: '1', read: true }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications,
        onMarkAllAsRead: () => {},
      })
    );
    assert.doesNotMatch(html, /全部已读/);
  });

  test('does not show "清空已读" when no read items', () => {
    const notifications = [
      makeNotification({ id: '1', read: false }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications,
        onClearRead: () => {},
      })
    );
    assert.doesNotMatch(html, /清空已读/);
  });
});

// ============== useNotificationSummary hook 测试 ==============

describe('useNotificationSummary', () => {
  test('calculates total and unread correctly', () => {
    function Tester() {
      const notifications = [
        makeNotification({ id: '1', read: false, category: 'system' }),
        makeNotification({ id: '2', read: true, category: 'device' }),
        makeNotification({ id: '3', read: false, category: 'alert' }),
      ];
      const summary = useNotificationSummary(notifications);
      return React.createElement('div', null,
        React.createElement('span', { 'data-testid': 'total' }, String(summary.total)),
        React.createElement('span', { 'data-testid': 'unread' }, String(summary.unread)),
        React.createElement('span', { 'data-testid': 'byCategory-system' }, String(summary.byCategory.system ?? 0)),
        React.createElement('span', { 'data-testid': 'byCategory-device' }, String(summary.byCategory.device ?? 0)),
        React.createElement('span', { 'data-testid': 'byCategory-alert' }, String(summary.byCategory.alert ?? 0)),
      );
    }
    const html = renderToStaticMarkup(React.createElement(Tester));
    assert.match(html, /<span data-testid="total">3<\/span>/);
    assert.match(html, /<span data-testid="unread">2<\/span>/);
    // system: 1 unread
    assert.match(html, /<span data-testid="byCategory-system">1<\/span>/);
    // device: 1 total but all read → 0 unread
    assert.match(html, /<span data-testid="byCategory-device">0<\/span>/);
    // alert: 1 unread
    assert.match(html, /<span data-testid="byCategory-alert">1<\/span>/);
  });

  test('returns zeroes for empty notifications', () => {
    function Tester() {
      const summary = useNotificationSummary([]);
      return React.createElement('span', { 'data-testid': 'total' }, String(summary.total));
    }
    const html = renderToStaticMarkup(React.createElement(Tester));
    assert.match(html, /<span data-testid="total">0<\/span>/);
  });

  test('handles all read', () => {
    function Tester() {
      const notifications = [
        makeNotification({ id: '1', read: true }),
        makeNotification({ id: '2', read: true }),
      ];
      const summary = useNotificationSummary(notifications);
      return React.createElement('span', { 'data-testid': 'unread' }, String(summary.unread));
    }
    const html = renderToStaticMarkup(React.createElement(Tester));
    assert.match(html, /<span data-testid="unread">0<\/span>/);
  });
});

// ============== 边界 & 覆盖 ==============

describe('NotificationCenter edge cases', () => {
  test('handles large list gracefully', () => {
    const notifications = Array.from({ length: 100 }, (_, i) =>
      makeNotification({ id: `${i}`, title: `通知 ${i}` })
    );
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    assert.match(html, /通知 0/);
    assert.match(html, /通知 99/);
  });

  test('handles notification with link property', () => {
    const notifications = [
      makeNotification({ id: '1', title: '可点击通知', link: '/orders/123' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, {
        notifications,
        onNotificationClick: () => {},
      })
    );
    assert.match(html, /可点击通知/);
  });

  test('category by severity order', () => {
    const categories = ['system', 'member', 'device', 'order', 'alert'];
    // Check that all severities produce valid items
    const severities = ['info', 'warning', 'error', 'success'];
    const notifications = categories.flatMap((cat, i) =>
      severities.map((sev, j) =>
        makeNotification({
          id: `${cat}-${sev}`,
          category: cat,
          severity: sev,
          title: `${cat}-${sev}`,
        })
      )
    );
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    // Should render all 20 items
    for (const n of notifications) {
      assert.match(html, new RegExp(n.title));
    }
  });

  test('renders all severity dot colors', () => {
    const severities = ['info', 'warning', 'error', 'success'];
    const notifications = severities.map((sev) =>
      makeNotification({ id: sev, severity: sev, read: false })
    );
    const html = renderToStaticMarkup(
      React.createElement(NotificationCenter, { notifications })
    );
    // All severity dots should be present
    assert.match(html, /#60a5fa/); // info
    assert.match(html, /#fbbf24/); // warning
    assert.match(html, /#f87171/); // error
    assert.match(html, /#4ade80/); // success
  });
});
