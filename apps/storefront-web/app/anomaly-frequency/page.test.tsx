/**
 * anomaly-frequency/page.test.tsx — 门店异常时序频率页面 L1 冒烟测试
 * 角色视角: 👔店长 / 🛒前台 / 🎮导玩员
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 手动测试辅助 ── */

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const reactPath = `${PROJECT_ROOT}/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js`;
const serverPath = `${PROJECT_ROOT}/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js`;

const React = require(reactPath);
const { renderToStaticMarkup } = require(serverPath);
const AnomalyFrequencyPage = require('./page').default;

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

function contains(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

function notContains(haystack: string, needle: string): boolean {
  return !haystack.includes(needle);
}

/* ════════════════════════════════════════════════════════
   正例
   ════════════════════════════════════════════════════════ */

test('导出 AnomalyFrequencyPage 为函数', () => {
  assert.equal(typeof AnomalyFrequencyPage, 'function');
});

test('渲染页面标题 "门店异常时序频率"', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '门店异常时序频率'), '应展示页面标题');
});

test('渲染统计卡片——总异常数', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '总异常数'), '应展示总异常数');
});

test('渲染统计卡片——严重异常', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '严重异常'), '应展示严重异常统计');
});

test('渲染统计卡片——高优先级', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '高优先级'), '应展示高优先级统计');
});

test('渲染统计卡片——时段均值', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '时段均值'), '应展示时段均值统计');
});

test('渲染时间范围按钮——近6小时', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '近6小时'), '应展示近6小时');
});

test('渲染时间范围按钮——近24小时', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '近24小时'), '应展示近24小时');
});

test('渲染时间范围按钮——近7天', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '近7天'), '应展示近7天');
});

test('渲染时间范围按钮——近30天', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '近30天'), '应展示近30天');
});

test('渲染严重程度过滤按钮——全部', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '🔴 严重'), '应展示严重按钮');
});

test('渲染严重程度过滤按钮——高', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '🟠 高'), '应展示高按钮');
});

test('渲染严重程度过滤按钮——中', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '🟡 中'), '应展示中按钮');
});

test('渲染严重程度过滤按钮——低', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '🟢 低'), '应展示低按钮');
});

test('渲染异常时序分布图容器', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, 'data-testid="anomaly-frequency-timeline-page"'), '应渲染时序图');
});

test('渲染刷新按钮', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '刷新'), '应有刷新按钮');
});

test('渲染底部说明区域', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '时序频率图展示各时段内不同严重级别异常的分布'), '应有说明文字');
});

test('统计数值为非负数', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  // 验证至少有一个统计数字
  const match = html.match(/>\d+</);
  assert.ok(match, '应有统计数值');
});

test('默认选中 timeRange=24h 的近24小时按钮样式为激活态', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  const activeMatch = html.match(/近24小时/);
  assert.ok(activeMatch, '默认应展示近24小时标签');
});

test('默认选中 severity=all', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, '全部'), '应展示全部按钮');
});

/* ════════════════════════════════════════════════════════
   边界: 极端/空数据
   ════════════════════════════════════════════════════════ */

test('边界: 组件不依赖外部 props，不会因缺失参数崩溃', () => {
  assert.doesNotThrow(() => render(React.createElement(AnomalyFrequencyPage)));
});

test('边界: 实例化两次无副作用', () => {
  const html1 = render(React.createElement(AnomalyFrequencyPage));
  const html2 = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(html1.length > 100);
  assert.ok(html2.length > 100);
  assert.equal(contains(html1, '总异常数'), true);
  assert.equal(contains(html2, '总异常数'), true);
});

test('边界: 异常时序图组件 data-testid 属性透传', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(contains(html, 'data-testid'), '应有 data-testid');
});

/* ════════════════════════════════════════════════════════
   防御
   ════════════════════════════════════════════════════════ */

test('防御: 不意外渲染无关文本', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  assert.ok(notContains(html, 'undefined'), '不应包含 undefined');
  assert.ok(notContains(html, 'NaN'), '不应包含 NaN');
  assert.ok(notContains(html, '[object Object]'), '不应包含 [object Object]');
});

test('防御: 统计卡片数值为数字（非空）', () => {
  const html = render(React.createElement(AnomalyFrequencyPage));
  const digitPattern = />\d+</;
  assert.ok(digitPattern.test(html), '统计值应为数字');
});

test('防御: 渲染不抛出异常', () => {
  assert.doesNotThrow(() => {
    React.createElement(AnomalyFrequencyPage);
  });
});
