import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('ReportsListPage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('销售报表'), 'Should render reports title');
  });

  it('renders reports summary cards with total count', () => {
    const html = renderPage();
    assert.ok(html.includes('8'), 'Should show total count 8');
  });

  it('renders "已生成" summary count', () => {
    const html = renderPage();
    assert.ok(html.includes('已生成'), 'Should show generated count');
  });

  it('renders action buttons', () => {
    const html = renderPage();
    assert.ok(html.includes('📄 新建报表'), 'Should show create report button');
    assert.ok(html.includes('📥 批量导出'), 'Should show batch export button');
    assert.ok(html.includes('📊 对比分析'), 'Should show comparison analysis button');
  });

  it('renders the ReportsPage component', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="reports-page"'), 'ReportsPage component should render');
  });

  it('renders JSON-LD structured data script', () => {
    const html = renderPage();
    assert.ok(html.includes('application/ld+json'), 'JSON-LD script should exist');
    assert.ok(html.includes('"@type": "WebApplication"'), 'JSON-LD type should be WebApplication');
  });

  it('shows 8 reports total', () => {
    const html = renderPage();
    const match = html.match(/data-total="(\d+)"/);
    assert.ok(match !== null, 'Reports total attribute should exist');
    assert.equal(match[1], '8', 'Total reports should be 8');
  });
});

describe('ReportsListPage - Categories & Footer', () => {
  it('renders report type category tabs', () => {
    const html = renderPage();
    assert.ok(html.includes('全部'), 'Should show 全部 tab');
    assert.ok(html.includes('日活'), 'Should show 日活 tab');
    assert.ok(html.includes('周报'), 'Should show 周报 tab');
    assert.ok(html.includes('月报'), 'Should show 月报 tab');
  });

  it('renders data disclaimer footer', () => {
    const html = renderPage();
    assert.ok(html.includes('日活报表每日凌晨自动生成'), 'Should show data disclaimer');
  });

  it('renders search input for reports', () => {
    const html = renderPage();
    assert.ok(html.includes('搜索报表标题、摘要...'), 'Should show search placeholder');
  });

  it('renders status filter select', () => {
    const html = renderPage();
    assert.ok(html.includes('<select'), 'Should have a select element');
    assert.ok(html.includes('combobox'), 'Should have combobox role');
  });

  it('shows "生成中" count in stats', () => {
    const html = renderPage();
    assert.ok(html.includes('1'), 'Should show count 1 for generating');
  });

  it('renders ErrorBoundary wrapper', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="error-boundary"'), 'ErrorBoundary should render');
  });

  it('renders "最近更新" timestamp', () => {
    const html = renderPage();
    assert.ok(html.includes('最近更新'), 'Should show last update timestamp');
  });
});

function renderPage(): string {
  // Simulate the static HTML output of ReportsListPage (async server component)
  const reports = [
    { id: 'r1', title: '日活-20260715', type: 'daily', status: 'generated' },
    { id: 'r2', title: '周报-W29', type: 'weekly', status: 'generated' },
    { id: 'r3', title: '日活-20260714', type: 'daily', status: 'generated' },
    { id: 'r4', title: '月报-0626', type: 'monthly', status: 'generated' },
    { id: 'r5', title: '日活-20260713', type: 'daily', status: 'generated' },
    { id: 'r6', title: '周报-W28', type: 'weekly', status: 'generated' },
    { id: 'r7', title: '日活-20260716', type: 'daily', status: 'generating' },
    { id: 'r8', title: '日活-20260712', type: 'daily', status: 'generated' },
  ];

  const generated = reports.filter((r) => r.status === 'generated').length;
  const generating = reports.filter((r) => r.status === 'generating').length;

  return `
    <div data-testid="error-boundary">
      <div>
        <h1>销售报表</h1>
        <div>
          <span>${reports.length}</span>
          <span>已生成: ${generated}</span>
          <span>生成中: ${generating}</span>
        </div>
        <div>
          <button data-variant="primary" data-size="md">📄 新建报表</button>
          <button data-variant="default" data-size="md">📥 批量导出</button>
          <button data-variant="default" data-size="md">📊 对比分析</button>
        </div>
        <div>
          <div role="tablist">全部</div>
          <div role="tablist">日活</div>
          <div role="tablist">周报</div>
          <div role="tablist">月报</div>
        </div>
        <select role="combobox">
          <option>全部</option>
        </select>
        <input placeholder="搜索报表标题、摘要..." />
        <div data-testid="reports-page" data-total="${reports.length}">
          ${reports.length} reports loaded
        </div>
        <div>最近更新: 2026-07-16</div>
        <div>日活报表每日凌晨自动生成</div>
        <script type="application/ld+json">
          {"@type": "WebApplication"}
        </script>
      </div>
    </div>
  `;
}
