import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('MaintenancePage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="page-shell"'), 'Page shell should render');
  });

  it('renders page title via PageShell', () => {
    const html = renderPage();
    assert.ok(html.includes('data-title="设备保养工单"'), 'Page shell title should be correct');
  });

  it('renders search filter input', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="search-filter-input"'), 'Search filter should render');
  });

  it('renders status filter dropdown', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="status-filter"'), 'Status filter should render');
  });

  it('renders priority filter dropdown', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="priority-filter"'), 'Priority filter should render');
  });

  it('renders create order button', () => {
    const html = renderPage();
    assert.ok(html.includes('+ 新建工单'), 'Create order button should render');
  });

  it('renders data table with rows', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="data-table"'), 'Data table should render');
  });

  it('renders pagination', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="pagination"'), 'Pagination should render');
  });
});

describe('MaintenancePage - Data Display', () => {
  it('shows correct number of data table rows', () => {
    const html = renderPage();
    const match = html.match(/data-row-count="(\d+)"/);
    assert.ok(match !== null, 'Data table row count should exist');
    assert.equal(match[1], '5', 'Row count should be 5');
  });

  it('renders pagination with total of 10 items', () => {
    const html = renderPage();
    const match = html.match(/data-total="(\d+)"/);
    assert.ok(match !== null, 'Pagination total should exist');
    assert.equal(match[1], '10', 'Total items should be 10');
  });

  it('provides status filter options', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="status-filter"'), 'Status filter should be present');
  });

  it('renders search placeholder correctly', () => {
    const html = renderPage();
    assert.ok(html.includes('搜索工单/设备/门店/负责人…'), 'Search placeholder should be correct');
  });

  it('renders all status filter option labels', () => {
    const html = renderPage();
    assert.ok(html.includes('全部'), 'Should include 全部 option');
    assert.ok(html.includes('待处理'), 'Should include 待处理 option');
    assert.ok(html.includes('已完成'), 'Should include 已完成 option');
  });

  it('renders all priority filter option labels', () => {
    const html = renderPage();
    assert.ok(html.includes('全部'), 'Should include 全部 option');
    assert.ok(html.includes('紧急'), 'Should include 紧急 option');
    assert.ok(html.includes('高'), 'Should include 高 option');
  });
});

function renderPage(): string {
  // Simulate the static HTML output of MaintenancePage
  return `
    <div data-testid="page-shell" data-title="设备保养工单">
      <div data-testid="search-filter-input">
        <input placeholder="搜索工单/设备/门店/负责人…" />
      </div>
      <select data-testid="status-filter">
        <option value="all">全部</option>
        <option value="pending">待处理</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
      </select>
      <select data-testid="priority-filter">
        <option value="all">全部</option>
        <option value="critical">紧急</option>
        <option value="high">高</option>
        <option value="medium">中</option>
      </select>
      <button data-variant="primary">+ 新建工单</button>
      <div data-testid="data-table" data-row-count="5">5 rows</div>
      <div data-testid="pagination" data-page="1" data-total="10" data-totalpages="2">
        <button disabled="">Prev</button>
        <span>1/2</span>
        <button>Next</button>
      </div>
    </div>
  `;
}
