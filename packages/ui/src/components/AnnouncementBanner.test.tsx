import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
const { AnnouncementBanner } = require('./AnnouncementBanner');
import type { AnnouncementSeverity, AnnouncementVariant } from './AnnouncementBanner';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(AnnouncementBanner, props));
}

// ---- 基础渲染 ----

test('AnnouncementBanner - 渲染默认信息横幅', () => {
  const html = renderHTML({ message: '系统将于今晚 23:00 进行维护升级' });
  assert.ok(html.includes('系统将于今晚 23:00 进行维护升级'), '应显示公告消息');
  assert.ok(html.includes('role="alert"'), '应有 alert role');
});

test('AnnouncementBanner - 渲染各严重级别', () => {
  const severities: AnnouncementSeverity[] = ['info', 'success', 'warning', 'error', 'promotion'];
  for (const s of severities) {
    const html = renderHTML({ message: `${s} 级别消息`, severity: s });
    assert.ok(html.includes(`${s} 级别消息`), `应渲染 ${s} 级别`);
  }
});

test('AnnouncementBanner - 渲染各变体', () => {
  const variants: AnnouncementVariant[] = ['banner', 'bar', 'ribbon'];
  for (const v of variants) {
    const html = renderHTML({ message: `${v} 变体`, variant: v });
    assert.ok(html.includes(`${v} 变体`), `应渲染 ${v} 变体`);
  }
});

// ---- 关闭行为 ----

test('AnnouncementBanner - 有关闭按钮', () => {
  const html = renderHTML({ message: '可关闭的公告' });
  assert.ok(html.includes('aria-label="关闭公告"'), '应有关闭按钮 aria-label');
  assert.ok(html.includes('✕'), '应含有 ✕ 字符');
});

test('AnnouncementBanner - closable=false 时不显示关闭按钮', () => {
  const html = renderHTML({ message: '不可关闭', closable: false });
  assert.ok(!html.includes('aria-label="关闭公告"'), '不应有关闭按钮');
});

test('AnnouncementBanner - defaultVisible=false 默认隐藏', () => {
  const html = renderHTML({ message: '默认隐藏', defaultVisible: false });
  assert.equal(html, '', '默认不可见应返回空字符串');
});

// ---- 操作按钮 ----

test('AnnouncementBanner - 渲染操作按钮', () => {
  const html = renderHTML({
    message: '新版本发布',
    action: { label: '查看详情', onClick: () => {} },
  });
  assert.ok(html.includes('查看详情'), '应展示操作按钮文本');
  assert.ok(html.includes('→'), '应展示箭头');
});

test('AnnouncementBanner - 操作按钮支持 href', () => {
  const html = renderHTML({
    message: '促销活动',
    action: { label: '立即参与', onClick: () => {}, href: '/promotions' },
  });
  assert.ok(html.includes('立即参与'), '应展示操作按钮');
  assert.ok(html.includes('href="/promotions"'), '应包含 href');
});

test('AnnouncementBanner - 无 action 时不渲染操作按钮', () => {
  const html = renderHTML({ message: '无操作按钮' });
  assert.ok(!html.includes('→'), '不应展示箭头');
});

// ---- 自定义图标 ----

test('AnnouncementBanner - 支持自定义图标', () => {
  const html = renderHTML({ message: '自定义图标', icon: React.createElement('span', { 'data-testid': 'custom-icon' }, '🔔') });
  assert.ok(html.includes('🔔'), '应渲染自定义图标内容');
});

// ---- aria 属性 ----

test('AnnouncementBanner - 具有正确的 aria 属性', () => {
  const html = renderHTML({ message: '可访问性测试' });
  assert.ok(html.includes('role="alert"'), '应有 role="alert"');
  assert.ok(html.includes('aria-live="polite"'), 'aria-live 应为 polite');
});
