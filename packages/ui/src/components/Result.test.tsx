import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Result } from './Result';

function extractText(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

test('ui Result: renders with default status (info)', () => {
  const html = renderToStaticMarkup(React.createElement(Result));
  const text = extractText(html);
  assert.match(text, /ℹ️/);
  assert.match(text, /提示信息/);
});

test('ui Result: renders success status', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: 'success' }));
  const text = extractText(html);
  assert.match(text, /✅/);
  assert.match(text, /操作成功/);
  assert.match(text, /请等待系统处理完成/);
});

test('ui Result: renders error status', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: 'error' }));
  const text = extractText(html);
  assert.match(text, /❌/);
  assert.match(text, /操作失败/);
  assert.match(text, /请稍后重试或联系管理员/);
});

test('ui Result: renders warning status', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: 'warning' }));
  const text = extractText(html);
  assert.match(text, /⚠️/);
  assert.match(text, /警告/);
  assert.match(text, /请确认操作是否正确/);
});

test('ui Result: renders 403 status', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: '403' }));
  const text = extractText(html);
  assert.match(text, /🔒/);
  assert.match(text, /403/);
  assert.match(text, /无权限访问/);
  assert.match(text, /联系管理员/);
});

test('ui Result: renders 404 status', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: '404' }));
  const text = extractText(html);
  assert.match(text, /🔍/);
  assert.match(text, /404/);
  assert.match(text, /页面未找到/);
  assert.match(text, /不存在或已被移除/);
});

test('ui Result: renders 500 status', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: '500' }));
  const text = extractText(html);
  assert.match(text, /💥/);
  assert.match(text, /500/);
  assert.match(text, /服务器错误/);
  assert.match(text, /稍后重试/);
});

test('ui Result: supports custom title and subTitle overriding defaults', () => {
  const html = renderToStaticMarkup(
    React.createElement(Result, {
      title: '自定义标题',
      subTitle: '自定义副标题描述',
    })
  );
  const text = extractText(html);
  assert.match(text, /自定义标题/);
  assert.match(text, /自定义副标题描述/);
  // Should NOT show default info icon (but default icon is still used since icon not provided)
  assert.match(text, /ℹ️/);
});

test('ui Result: supports custom icon', () => {
  const html = renderToStaticMarkup(
    React.createElement(Result, {
      status: 'success',
      icon: React.createElement('span', { 'data-testid': 'custom-icon' }, '🎉'),
    })
  );
  assert.ok(html.includes('🎉'));
  // Default success icon should not appear
  assert.ok(!html.includes('✅'));
});

test('ui Result: renders extra action area', () => {
  const extra = React.createElement('button', { key: 'retry' }, '重试');
  const html = renderToStaticMarkup(
    React.createElement(Result, { status: 'error', extra })
  );
  const text = extractText(html);
  assert.match(text, /重试/);
});

test('ui Result: renders children', () => {
  const children = React.createElement('div', { key: 'details' }, '错误详情：网络超时');
  const html = renderToStaticMarkup(
    React.createElement(Result, { status: 'error', children })
  );
  const text = extractText(html);
  assert.match(text, /错误详情：网络超时/);
});

test('ui Result: multiple extras render in a row', () => {
  const extra = React.createElement(React.Fragment, null,
    React.createElement('button', { key: 'a' }, '返回首页'),
    React.createElement('button', { key: 'b' }, '联系客服'),
  );
  const html = renderToStaticMarkup(
    React.createElement(Result, { status: '500', extra })
  );
  const text = extractText(html);
  assert.match(text, /返回首页/);
  assert.match(text, /联系客服/);
});

test('ui Result: title only still shows default subTitle, but both render', () => {
  const html = renderToStaticMarkup(
    React.createElement(Result, { status: 'success', title: '仅标题' })
  );
  // When subTitle is not provided, default subTitle is used
  const text = extractText(html);
  assert.match(text, /仅标题/);
  assert.match(text, /请等待系统处理完成/);
});

test('ui Result: subTitle only without title uses default title', () => {
  const html = renderToStaticMarkup(
    React.createElement(Result, { status: 'success', subTitle: '自定义副标题' })
  );
  const text = extractText(html);
  assert.match(text, /操作成功/);
  assert.match(text, /自定义副标题/);
});

test('ui Result: warning status renders warning subtitle', () => {
  const html = renderToStaticMarkup(React.createElement(Result, { status: 'warning' }));
  const text = extractText(html);
  assert.match(text, /⚠️/);
  assert.match(text, /警告/);
  assert.match(text, /请确认操作是否正确/);
});

test('ui Result: all 7 statuses render without throwing', () => {
  const statuses: Array<ResultProps['status']> = [
    'success', 'error', 'info', 'warning', '403', '404', '500',
  ];
  for (const status of statuses) {
    const html = renderToStaticMarkup(React.createElement(Result, { status }));
    assert.ok(html.length > 0, `Status "${status}" should render`);
    const text = extractText(html);
    assert.ok(text.length > 0, `Status "${status}" should produce visible text`);
  }
});

test('ui Result: renders with both extra and children', () => {
  const extra = React.createElement('button', { key: 'go' }, '前往首页');
  const children = React.createElement('p', { key: 'tip' }, '如果需要帮助，请联系 IT 支持');
  const html = renderToStaticMarkup(
    React.createElement(Result, { status: '403', extra, children })
  );
  const text = extractText(html);
  assert.match(text, /403/);
  assert.match(text, /无权限访问/);
  assert.match(text, /前往首页/);
  assert.match(text, /IT 支持/);
});

import type { ResultProps } from './Result';
