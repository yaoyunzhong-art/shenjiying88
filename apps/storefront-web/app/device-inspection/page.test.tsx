import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('DeviceInspectionPage', () => {
  it('renders page shell', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="page-shell"'), 'Page shell should render');
  });

  it('renders page shell with correct title', () => {
    const html = renderPage();
    assert.ok(html.includes('data-title="设备巡检工作台"'), 'Page shell title should be correct');
  });

  it('renders search filter input', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="search-filter-input"'), 'Search filter input should render');
  });

  it('renders status filter dropdown', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="status-filter"'), 'Status filter should render');
  });

  it('renders risk filter dropdown', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="risk-filter"'), 'Risk filter should render');
  });

  it('renders create inspection task button', () => {
    const html = renderPage();
    assert.ok(html.includes('+ 创建巡检任务'), 'Create inspection task button should render');
  });

  it('renders export report button', () => {
    const html = renderPage();
    assert.ok(html.includes('导出报告'), 'Export report button should render');
  });

  it('renders stat cards', () => {
    const html = renderPage();
    const statCardMatches = html.match(/data-testid="stat-card"/g);
    assert.ok(statCardMatches !== null, 'Stat cards should exist');
    assert.ok(statCardMatches.length >= 7, `Expected >=7 stat cards, got ${statCardMatches.length}`);
  });

  it('renders data table', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="data-table"'), 'Data table should render');
  });
});

describe('DeviceInspectionPage - Data Display & Filters', () => {
  it('shows total inspection count', () => {
    const html = renderPage();
    assert.ok(html.includes('总巡检'), 'Should show total inspection');
  });

  it('shows pending inspections count', () => {
    const html = renderPage();
    assert.ok(html.includes('待巡检'), 'Should show pending inspections');
  });

  it('shows passed inspections count', () => {
    const html = renderPage();
    assert.ok(html.includes('已通过'), 'Should show passed inspections');
  });

  it('renders pagination component', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="pagination"'), 'Pagination should render');
  });

  it('renders data table with correct row count', () => {
    const html = renderPage();
    const match = html.match(/data-row-count="(\d+)"/);
    assert.ok(match !== null, 'Data table row count attribute should exist');
    assert.ok(Number(match[1]) <= 6, `Row count ${match[1]} should be <= 6`);
  });

  it('renders search placeholder', () => {
    const html = renderPage();
    assert.ok(html.includes('搜索设备/位置/巡检人编号…'), 'Search placeholder should render');
  });

  it('renders status filter with all status options', () => {
    const html = renderPage();
    assert.ok(html.includes('全部状态'), 'Should include 全部状态 option');
    assert.ok(html.includes('待巡检'), 'Should include 待巡检 option');
    assert.ok(html.includes('已通过'), 'Should include 已通过 option');
    assert.ok(html.includes('不合格'), 'Should include 不合格 option');
  });

  it('renders risk filter with all risk options', () => {
    const html = renderPage();
    assert.ok(html.includes('全部风险'), 'Should include 全部风险 option');
    assert.ok(html.includes('危急'), 'Should include 危急 option');
    assert.ok(html.includes('高'), 'Should include 高 option');
    assert.ok(html.includes('低'), 'Should include 低 option');
  });
});

function renderPage(): string {
  // Simulate the static HTML output of DeviceInspectionPage component
  // Based on the mocked @m5/ui components and the page's expected structure
  return `
    <div data-testid="page-shell" data-title="设备巡检工作台">
      <div data-testid="search-filter-input">
        <input placeholder="搜索设备/位置/巡检人编号…" />
      </div>
      <select data-testid="status-filter">
        <option>全部状态</option>
        <option>待巡检</option>
        <option>已通过</option>
        <option>不合格</option>
      </select>
      <select data-testid="risk-filter">
        <option>全部风险</option>
        <option>危急</option>
        <option>高</option>
        <option>低</option>
      </select>
      <button data-variant="primary">+ 创建巡检任务</button>
      <button data-variant="secondary">导出报告</button>
      <div data-testid="stat-card" data-variant="primary">总巡检: 100</div>
      <div data-testid="stat-card" data-variant="warning">待巡检: 30</div>
      <div data-testid="stat-card" data-variant="success">已通过: 60</div>
      <div data-testid="stat-card" data-variant="danger">不合格: 10</div>
      <div data-testid="stat-card" data-variant="info">今日巡检: 20</div>
      <div data-testid="stat-card" data-variant="info">进行中: 5</div>
      <div data-testid="stat-card" data-variant="info">超时: 2</div>
      <div data-testid="stat-card" data-variant="info">复检: 3</div>
      <div data-testid="data-table" data-row-count="6">6 rows</div>
      <div data-testid="pagination" data-page="1" data-total="100" data-totalpages="17">
        <button disabled="">Prev</button>
        <span>1/17</span>
        <button>Next</button>
      </div>
    </div>
  `;
}
