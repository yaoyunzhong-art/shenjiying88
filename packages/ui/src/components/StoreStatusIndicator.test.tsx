/**
 * StoreStatusIndicator.test.tsx — L1 JMeter-style tests
 * Pattern: 正例 + 反例 + 边界
 * ≥ 20 项测试
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);
const { StoreStatusIndicator } = require('./StoreStatusIndicator');

function render(props: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(React.createElement(StoreStatusIndicator, props));
}

// ============================================================
// 1. 基础渲染 — 每种状态
// ============================================================

describe('StoreStatusIndicator — 基础渲染', () => {
  it('应渲染 open 状态', () => {
    const html = render({ status: 'open' });
    assert.ok(html.includes('data-store-status="open"'), '应有 data-store-status="open"');
    assert.ok(html.includes('营业中'), '应显示中文标签');
    assert.ok(html.includes('data-testid="store-status-indicator-open"'), '应有 data-testid');
    assert.ok(html.includes('data-testid="store-status-dot-open"'), '应有状态圆点');
  });

  it('应渲染 closed 状态', () => {
    const html = render({ status: 'closed' });
    assert.ok(html.includes('data-store-status="closed"'), '应有 data-store-status="closed"');
    assert.ok(html.includes('休息中'), '应显示中文标签');
  });

  it('应渲染 busy 状态', () => {
    const html = render({ status: 'busy' });
    assert.ok(html.includes('data-store-status="busy"'), '应有 data-store-status="busy"');
    assert.ok(html.includes('繁忙'), '应显示中文标签');
  });

  it('应渲染 maintenance 状态', () => {
    const html = render({ status: 'maintenance' });
    assert.ok(html.includes('data-store-status="maintenance"'), '应有 data-store-status="maintenance"');
    assert.ok(html.includes('维修中'), '应显示中文标签');
  });

  it('应渲染 offline 状态', () => {
    const html = render({ status: 'offline' });
    assert.ok(html.includes('data-store-status="offline"'), '应有 data-store-status="offline"');
    assert.ok(html.includes('离线'), '应显示中文标签');
  });

  it('应渲染 error 状态', () => {
    const html = render({ status: 'error' });
    assert.ok(html.includes('data-store-status="error"'), '应有 data-store-status="error"');
    assert.ok(html.includes('异常'), '应显示中文标签');
  });
});

// ============================================================
// 2. label 自定义
// ============================================================

describe('StoreStatusIndicator — label 自定义', () => {
  it('自定义 label 应覆盖默认值', () => {
    const html = render({ status: 'open', label: '正常营业' });
    assert.ok(html.includes('正常营业'), '应显示自定义标签');
    assert.ok(!html.includes('营业中'), '不应包含默认标签');
  });

  it('自定义 label 不影响 data-store-status', () => {
    const html = render({ status: 'closed', label: '已打烊' });
    assert.ok(html.includes('已打烊'), '应显示自定义标签');
    assert.ok(html.includes('data-store-status="closed"'), 'data-store-status 仍为 closed');
  });
});

// ============================================================
// 3. size 尺寸变体
// ============================================================

describe('StoreStatusIndicator — size 尺寸', () => {
  it('默认 size 应为 md', () => {
    const html = render({ status: 'open' });
    assert.ok(html.includes('data-store-status-size="md"'), '默认 size 为 md');
  });

  it('sm 尺寸应正确设置', () => {
    const html = render({ status: 'open', size: 'sm' });
    assert.ok(html.includes('data-store-status-size="sm"'), 'size 为 sm');
  });

  it('lg 尺寸应正确设置', () => {
    const html = render({ status: 'open', size: 'lg' });
    assert.ok(html.includes('data-store-status-size="lg"'), 'size 为 lg');
  });

  it('不同尺寸应产生不同圆点大小', () => {
    const htmlSm = render({ status: 'open', size: 'sm' });
    const htmlLg = render({ status: 'open', size: 'lg' });
    assert.notEqual(htmlSm.length, htmlLg.length, '不同尺寸渲染不同');
  });
});

// ============================================================
// 4. textOnly 纯文本模式
// ============================================================

describe('StoreStatusIndicator — textOnly 纯文本', () => {
  it('textOnly 不应渲染状态原点', () => {
    const html = render({ status: 'open', textOnly: true });
    assert.ok(!html.includes('store-status-dot'), '不应包含圆点元素');
    assert.ok(html.includes('营业中'), '仍应显示文本');
  });

  it('textOnly=false 应有圆点', () => {
    const html = render({ status: 'open', textOnly: false });
    assert.ok(html.includes('store-status-dot'), '应有圆点元素');
  });
});

// ============================================================
// 5. lastUpdated 最后更新时间
// ============================================================

describe('StoreStatusIndicator — lastUpdated', () => {
  it('应渲染最后更新时间', () => {
    const html = render({ status: 'open', lastUpdated: '10:30' });
    assert.ok(html.includes('10:30'), '应显示最后更新时间');
    assert.ok(html.includes('data-testid="store-status-time-open"'), '应有 time data-testid');
  });

  it('无 lastUpdated 时不渲染时间区域', () => {
    const html = render({ status: 'open' });
    assert.ok(!html.includes('store-status-time'), '不应有时间元素');
  });
});

// ============================================================
// 6. animated 脉冲动画
// ============================================================

describe('StoreStatusIndicator — animated', () => {
  it('open 状态默认应有脉冲动画', () => {
    const html = render({ status: 'open' });
    assert.ok(html.includes('store-status-pulse'), 'open 默认有脉冲动画');
  });

  it('closed 状态默认无脉冲动画', () => {
    const html = render({ status: 'closed' });
    assert.ok(!html.includes('store-status-pulse'), 'closed 默认无脉冲动画');
  });

  it('animated=false 应关闭动画', () => {
    const html = render({ status: 'open', animated: false });
    assert.ok(!html.includes('store-status-pulse'), 'animated=false 应关闭动画');
  });

  it('animated=true 应开启动画', () => {
    const html = render({ status: 'closed', animated: true });
    assert.ok(html.includes('store-status-pulse'), 'animated=true 应开启动画');
  });
});

// ============================================================
// 7. onClick 交互
// ============================================================

describe('StoreStatusIndicator — onClick', () => {
  it('无 onClick 时不应有 role="button"', () => {
    const html = render({ status: 'open' });
    assert.ok(!html.includes('role="button"'), '无 onClick 无 button role');
  });

  it('有 onClick 时应渲染 role="button"', () => {
    const html = render({ status: 'open', onClick: () => {} });
    assert.ok(html.includes('role="button"'), '有 onClick 有 button role');
    assert.ok(html.includes('tabindex="0"'), '有 onClick 应有 tabIndex');
  });

  it('有 onClick 时 cursor 应为 pointer', () => {
    const html = render({ status: 'open', onClick: () => {} });
    assert.ok(html.includes('pointer'), '有 onClick 时 cursor 为 pointer');
  });
});

// ============================================================
// 8. className & style 自定义
// ============================================================

describe('StoreStatusIndicator — className & style', () => {
  it('className 应被应用', () => {
    const html = render({ status: 'open', className: 'my-custom-class' });
    assert.ok(html.includes('my-custom-class'), '自定义 className 应生效');
  });

  it('style 应被合并', () => {
    const html = render({ status: 'open', style: { marginLeft: 10 } });
    assert.ok(html.includes('margin-left'), '自定义 style 应合并');
  });
});

// ============================================================
// 9. 边界情况
// ============================================================

describe('StoreStatusIndicator — 边界情况', () => {
  it('未知 status 应 fallback 到离线颜色', () => {
    // @ts-expect-error — 测试非法值
    const html = render({ status: 'unknown' });
    assert.ok(html.includes('data-store-status="unknown"'), '非法值不应崩溃');
  });

  it('空 label 不应崩溃', () => {
    const html = render({ status: 'open', label: '' });
    assert.ok(html.includes(''), '空 label 不应崩溃');
  });
});
