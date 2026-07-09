/**
 * 会员等级分布页面测试 — Member Tier Distribution Page Test
 * 兼容项目 node --import tsx --test 运行方式
 * 使用 jsdom + react-dom/client 渲染，不依赖 @testing-library/react
 */
import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import React from 'react';

// ====== 1. 在组件导入前，先设置 @m5/ui mock ======
const Module = require('module');
const origResolve = Module._resolveFilename;

const MOCK_UI_PATH = '\0m5-ui-mock';
const MOCK_UI_RESOLVED = require.resolve('@m5/ui');

// 创建 mock 组件工厂
function makeEl(tag: string, attrs: Record<string, any>, children?: any) {
  return React.createElement(tag, attrs, children);
}

const mockUiModule = {
  exports: {
    DonutChart: (props: any) =>
      makeEl('div', {
        'data-testid': 'donut-chart',
        'data-data': JSON.stringify(props.data),
        'data-legend': String(props.showLegend),
        'data-percent': String(props.showCenterLabel),
      }, 'DonutChart Mock'),

    SparklineChart: (props: any) =>
      makeEl('div', {
        'data-testid': 'sparkline-chart',
        'data-count': props.data?.length,
        'data-color': props.color,
        'data-fill-color': props.fillColor,
      }, 'SparklineChart Mock'),

    MemberTierDistribution: (props: any) =>
      makeEl('div', {
        'data-testid': 'member-tier-distribution',
        'data-tier-count': props.tiers?.length,
      }, 'MemberTierDistribution Mock'),

    MemberLevelDistribution: (props: any) =>
      makeEl('div', {
        'data-testid': 'member-level-distribution',
        'data-level-count': props.data?.length,
        'data-values': String(props.showValues),
        'data-percent': String(props.showPercentage),
      }, 'MemberLevelDistribution Mock'),

    KpiSummaryCard: ({ title, items }: any) => {
      const cards = (items || []).map((item: any, i: number) =>
        makeEl('div', { key: i, 'data-testid': 'kpi-card', 'data-title': title },
          `${title}: ${item.value}`
        )
      );
      return makeEl(React.Fragment, null, ...cards);
    },

    Card: ({ title, children }: any) =>
      makeEl('div', { 'data-testid': `card-${(title || '').replace(/\s+/g, '-')}` },
        makeEl('h3', null, title), children
      ),

    PageShell: ({ title, subtitle, children }: any) =>
      makeEl('div', { 'data-testid': 'page-shell', 'data-title': title, 'data-subtitle': subtitle },
        makeEl('h1', null, title),
        subtitle ? makeEl('p', null, subtitle) : null,
        children
      ),

    EmptyState: () => makeEl('div', { 'data-testid': 'empty-state' }, 'Empty'),
    LoadingSkeleton: () => makeEl('div', { 'data-testid': 'loading-skeleton' }, 'Loading'),
  },
};

// Hook into module resolution
Module._resolveFilename = function (request: string, parent: any, ...rest: any[]) {
  if (request === '@m5/ui') return MOCK_UI_PATH;
  return origResolve.call(this, request, parent, ...rest);
};

Module._cache[MOCK_UI_PATH] = mockUiModule;
Module._cache[MOCK_UI_RESOLVED] = mockUiModule;

// ====== 2. 导入被测试组件 ======
import MemberTierDistributionPage from './page';

// 恢复原有 resolve
Module._resolveFilename = origResolve;

// ====== 3. 设置 jsdom 环境 ======
import { JSDOM } from 'jsdom';

interface GlobalWithDOM {
  window: any;
  document: any;
  HTMLElement: any;
  HTMLInputElement: any;
  Node: any;
  Element: any;
  CSS: any;
  MutationObserver: any;
  requestAnimationFrame: any;
  cancelAnimationFrame: any;
}

let jsdom: JSDOM | null = null;

function setupJsdom() {
  jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
  });

  const g = globalThis as unknown as GlobalWithDOM;
  g.window = jsdom.window;
  g.document = jsdom.window.document;
  g.HTMLElement = jsdom.window.HTMLElement;
  g.HTMLInputElement = jsdom.window.HTMLInputElement;
  g.Node = jsdom.window.Node;
  g.Element = jsdom.window.Element;
  g.CSS = { supports: () => false };
  g.MutationObserver = jsdom.window.MutationObserver;
  g.requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
  g.cancelAnimationFrame = (id: any) => clearTimeout(id);
}

// ====== 4. 渲染函数 ======
function renderPage(): HTMLElement {
  const container = jsdom!.window.document.createElement('div');
  container.id = 'root';
  jsdom!.window.document.body.innerHTML = '';
  jsdom!.window.document.body.appendChild(container);

  const ReactDOM = require('react-dom/client');
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(MemberTierDistributionPage));

  return container;
}

// ====== 5. 测试套件 ======
describe('MemberTierDistributionPage', () => {
  let container: HTMLElement;

  before(() => {
    setupJsdom();
  });

  it('renders page shell with correct title and subtitle', () => {
    container = renderPage();
    const shell = container.querySelector('[data-testid="page-shell"]');
    assert.ok(shell, 'page-shell should exist');
    assert.equal(shell?.getAttribute('data-title'), '会员等级分布');
    assert.ok(shell?.getAttribute('data-subtitle')?.includes('可视化'));
  });

  it('renders 4 KPI summary cards', () => {
    container = renderPage();
    const kpiCards = container.querySelectorAll('[data-testid="kpi-card"]');
    assert.equal(kpiCards.length, 4);
    assert.equal(kpiCards[0]?.getAttribute('data-title'), '总会员数');
    assert.equal(kpiCards[1]?.getAttribute('data-title'), '高价值会员');
  });

  it('renders DonutChart with correct data', () => {
    container = renderPage();
    const donut = container.querySelector('[data-testid="donut-chart"]');
    assert.ok(donut, 'donut-chart should exist');
    const data = JSON.parse(donut?.getAttribute('data-data') || '[]');
    assert.equal(data.length, 5);
    assert.equal(data[0].key, 'diamond');
    assert.equal(data[0].label, '钻石会员');
    assert.equal(data[0].value, 86);
    assert.equal(donut?.getAttribute('data-legend'), 'true');
    assert.equal(donut?.getAttribute('data-percent'), 'true');
  });

  it('renders MemberTierDistribution with correct tier count', () => {
    container = renderPage();
    const el = container.querySelector('[data-testid="member-tier-distribution"]');
    assert.equal(el?.getAttribute('data-tier-count'), '5');
  });

  it('renders MemberLevelDistribution with correct level count', () => {
    container = renderPage();
    const el = container.querySelector('[data-testid="member-level-distribution"]');
    assert.equal(el?.getAttribute('data-level-count'), '5');
    assert.equal(el?.getAttribute('data-values'), 'true');
    assert.equal(el?.getAttribute('data-percent'), 'true');
  });

  it('renders SparklineChart with 6 data points', () => {
    container = renderPage();
    const el = container.querySelector('[data-testid="sparkline-chart"]');
    assert.equal(el?.getAttribute('data-count'), '6');
    assert.equal(el?.getAttribute('data-color'), '#3b82f6');
    assert.equal(el?.getAttribute('data-fill-color'), 'rgba(59,130,246,0.12)');
  });

  it('renders tier analysis table with correct data', () => {
    container = renderPage();
    const rows = container.querySelectorAll('tbody tr');
    assert.equal(rows.length, 5);
    assert.ok(rows[0]?.textContent?.includes('钻石会员'));
    assert.ok(rows[0]?.textContent?.includes('86'));
    assert.ok(rows[0]?.textContent?.includes('高价值'));
    assert.ok(rows[2]?.textContent?.includes('黄金会员'));
    assert.ok(rows[2]?.textContent?.includes('中价值'));
  });

  it('renders all 5 Card titles correctly', () => {
    container = renderPage();
    assert.ok(container.querySelector('[data-testid="card-等级分布（饼图）"]'));
    assert.ok(container.querySelector('[data-testid="card-等级分布（柱状图）"]'));
    assert.ok(container.querySelector('[data-testid="card-等级占比（水平柱状）"]'));
    assert.ok(container.querySelector('[data-testid="card-高价值会员增长趋势"]'));
    assert.ok(container.querySelector('[data-testid="card-等级构成分析"]'));
  });

  it('calculates totalMembers correctly (86+215+378+425+182=1286)', () => {
    container = renderPage();
    const cards = container.querySelectorAll('[data-testid="kpi-card"]');
    assert.ok(cards[0]?.textContent?.includes('1,286'));
  });

  it('calculates highValueMembers correctly (86+215=301)', () => {
    container = renderPage();
    const cards = container.querySelectorAll('[data-testid="kpi-card"]');
    assert.ok(cards[1]?.textContent?.includes('301'));
  });

  it('has responsive grid layout classes', () => {
    container = renderPage();
    const grids = container.querySelectorAll('.grid');
    assert.ok(grids.length >= 3);
  });

  it('renders tier analysis with correct percentage values', () => {
    container = renderPage();
    const rows = container.querySelectorAll('tbody tr');
    assert.ok(rows[0]?.textContent?.includes('6.7%'));
    assert.ok(rows[3]?.textContent?.includes('33.0'));
  });
});
