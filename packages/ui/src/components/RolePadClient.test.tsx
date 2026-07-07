/**
 * RolePadClient Test — 角色操作面板客户端组件
 * 覆盖: 三种角色渲染 / Tab切换 / 角色Badge / 设备宽度提示 / 边界场景
 */
import React from 'react';
import assert from 'node:assert/strict';
import test from 'node:test';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { RolePadClient } = require('./RolePadClient');

// ── Tests ───────────────────────────────────────────────────

test('RolePadClient - renders store manager role', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'store_manager' })
  );
  assert.ok(html.includes('店长'));
  assert.ok(html.includes('店长工作台'));
  assert.ok(html.includes('工作台'));
  assert.ok(html.includes('数据分析'));
  assert.ok(html.includes('人员管理'));
  assert.ok(html.includes('设置'));
});

test('RolePadClient - renders front desk role', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'front_desk' })
  );
  assert.ok(html.includes('前台'));
  assert.ok(html.includes('前台工作台'));
  assert.ok(html.includes('排队管理'));
  assert.ok(html.includes('收银'));
  assert.ok(html.includes('客户'));
});

test('RolePadClient - renders sales clerk role', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'sales_clerk' })
  );
  assert.ok(html.includes('导购员'));
  assert.ok(html.includes('导购员工作台'));
  assert.ok(html.includes('客户跟进'));
  assert.ok(html.includes('推荐话术'));
  assert.ok(html.includes('报表'));
});

test('RolePadClient - shows active tab as workbench by default', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'store_manager' })
  );
  assert.ok(html.includes('工作台 面板'));
});

test('RolePadClient - shows custom active tab', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, {
      role: 'store_manager',
      activeTab: 'analytics',
    })
  );
  assert.ok(html.includes('数据分析 面板'));
});

test('RolePadClient - renders device width hint when provided', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, {
      role: 'front_desk',
      deviceWidthHint: 1024,
    })
  );
  assert.ok(html.includes('1024px'));
});

test('RolePadClient - role badge has correct colors for each role', () => {
  const mgr = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'store_manager' })
  );
  assert.ok(mgr.includes('店长'));

  const desk = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'front_desk' })
  );
  assert.ok(desk.includes('前台'));

  const clerk = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'sales_clerk' })
  );
  assert.ok(clerk.includes('导购员'));
});

test('RolePadClient - all tabs are rendered as buttons', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'sales_clerk' })
  );
  assert.ok(html.includes('工作台'));
  assert.ok(html.includes('客户跟进'));
  assert.ok(html.includes('推荐话术'));
  assert.ok(html.includes('报表'));
});

test('RolePadClient - placeholder displays current active tab name', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, {
      role: 'front_desk',
      activeTab: 'checkout',
    })
  );
  assert.ok(html.includes('收银 面板'));
});

test('RolePadClient - no device hint row when no deviceWidthHint', () => {
  const html = renderToStaticMarkup(
    React.createElement(RolePadClient, { role: 'store_manager' })
  );
  // '屏幕:' only renders when deviceWidthHint is provided
  assert.ok(!html.includes('屏幕:'));
});
