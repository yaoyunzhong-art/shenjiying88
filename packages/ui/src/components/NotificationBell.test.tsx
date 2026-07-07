'use strict';

const React = require('react');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { NotificationBell } = require('./NotificationBell');

// ==================== 工厂函数 ====================

function createItems() {
  return [
    {
      id: 'n1',
      title: '新订单 #1024',
      description: '客人已下单，请准备。',
      read: false,
      type: 'info',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'n2',
      title: '库存预警',
      description: '可乐库存不足，剩余3瓶。',
      read: false,
      type: 'warning',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'n3',
      title: '设备离线',
      description: '3号机台已离线。',
      read: true,
      type: 'error',
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'n4',
      title: '系统更新完成',
      read: true,
      type: 'success',
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
  ];
}

describe('NotificationBell', () => {
  // ===== 基础 SSR 渲染 =====

  it('SSR 渲染铃铛 SVG 图标 (包含 aria-label)', () => {
    const html = renderToStaticMarkup(
      React.createElement(NotificationBell, { items: createItems() })
    );
    assert.ok(html.includes('aria-label'));
    assert.ok(html.includes('svg'));
    assert.ok(html.includes('bell-badge'));
  });

  it('SSR 渲染未读数徽章 (2个未读)', () => {
    const html = renderToStaticMarkup(
      React.createElement(NotificationBell, { items: createItems() })
    );
    assert.ok(html.includes('bell-badge'));
    // The badge内容 "2" 应该可见
    assert.ok(html.includes('>2<') || html.includes('">2"') || html.includes('>2'));
  });

  it('SSR 没有未读时不渲染徽章', () => {
    const allRead = createItems().map(function (i) {
      return Object.assign({}, i, { read: true });
    });
    const html = renderToStaticMarkup(
      React.createElement(NotificationBell, { items: allRead })
    );
    assert.ok(!html.includes('bell-badge'));
  });

  it('SSR 超过 maxBadgeCount 显示 N+', () => {
    var manyItems = [];
    for (var i = 0; i < 150; i++) {
      manyItems.push({
        id: 'n-' + i,
        title: '通知 ' + i,
        read: false,
        type: 'info',
        timestamp: new Date().toISOString(),
      });
    }
    const html = renderToStaticMarkup(
      React.createElement(NotificationBell, { items: manyItems, maxBadgeCount: 99 })
    );
    assert.ok(html.includes('99+'));
  });

  it('SSR 不抛出异常（正常渲染）', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: createItems() })
      );
    });
  });

  // ===== 空状态（SSR 下拉面板不会渲染，仅验证不报错） =====

  it('空列表 SSR 不抛出异常', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: [], emptyText: '没有新消息' })
      );
    });
  });

  // ===== 不同 size SSR =====

  it('sm 尺寸 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: createItems(), size: 'sm' })
      );
    });
  });

  it('lg 尺寸 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: createItems(), size: 'lg' })
      );
    });
  });

  // ===== 自定义 className =====

  it('自定义 className 被传递到外层 div', () => {
    const html = renderToStaticMarkup(
      React.createElement(NotificationBell, { items: createItems(), className: 'my-custom-bell' })
    );
    assert.ok(html.includes('my-custom-bell'));
  });

  // ===== 回调属性传递（SSR 不会调用，仅验证不报错） =====

  it('传入 onMarkAllRead 回调 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, {
          items: createItems(),
          onMarkAllRead: function () {},
        })
      );
    });
  });

  it('传入 onViewAll 回调 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, {
          items: createItems(),
          onViewAll: function () {},
        })
      );
    });
  });

  it('传入 onMarkRead 回调 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, {
          items: createItems(),
          onMarkRead: function () {},
        })
      );
    });
  });

  // ===== 边界条件 =====

  it('超大通知数量 SSR 不报错', () => {
    var bigList = [];
    for (var i = 0; i < 500; i++) {
      bigList.push({
        id: 'big-' + i,
        title: '通知 ' + i,
        read: i % 2 === 0,
        type: 'info',
        timestamp: new Date().toISOString(),
      });
    }
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: bigList })
      );
    });
  });

  it('特殊字符标题 SSR 不报错', () => {
    var items = [{
      id: 'n1',
      title: '测试 <script>alert("xss")</script>',
      description: '描述 & 特殊符号 <>',
      read: false,
      type: 'info',
      timestamp: new Date().toISOString(),
    }];
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: items })
      );
    });
  });

  it('allRead+空数组 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: [], emptyText: '暂无通知' })
      );
    });
  });

  it('缺失可选字段 item SSR 不报错', () => {
    var minimalItems = [{
      id: 'n1',
      title: '最小通知',
      read: false,
      timestamp: new Date().toISOString(),
    }];
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: minimalItems })
      );
    });
  });

  // ===== Props 边界 =====

  it('maxListCount 为 0 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: createItems(), maxListCount: 0 })
      );
    });
  });

  it('maxBadgeCount 为 0 SSR 不报错', () => {
    assert.doesNotThrow(function () {
      renderToStaticMarkup(
        React.createElement(NotificationBell, { items: createItems(), maxBadgeCount: 0 })
      );
    });
  });
});
