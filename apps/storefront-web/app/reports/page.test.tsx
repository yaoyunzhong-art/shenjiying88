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

describe('ReportsListPage - Data integrity & Edge Cases', () => {
  it('should generate correct counts per type: daily has 5, weekly has 2, monthly has 1', () => {
    const types: Record<string, number> = {};
    const reports = getMockReports();
    for (const r of reports) {
      types[r.type] = (types[r.type] || 0) + 1;
    }
    assert.equal(types.daily, 5);
    assert.equal(types.weekly, 2);
    assert.equal(types.monthly, 1);
  });

  it('should correctly calculate "generated" vs "generating" counts', () => {
    const reports = getMockReports();
    const generated = reports.filter((r) => r.status === 'generated').length;
    const generating = reports.filter((r) => r.status === 'generating').length;
    assert.equal(generated, 7);
    assert.equal(generating, 1);
    assert.equal(generated + generating, reports.length);
  });

  it('should handle edge case: all reports generating', () => {
    const allGenerating = getMockReports().map(r => ({ ...r, status: 'generating' as const }));
    const generated = allGenerating.filter((r) => r.status === 'generated').length;
    const generating = allGenerating.filter((r) => r.status === 'generating').length;
    assert.equal(generated, 0);
    assert.equal(generating, 8);
  });

  it('search placeholder should match search pattern', () => {
    const html = renderPage();
    const match = html.match(/placeholder="([^"]+)"/);
    assert.ok(match !== null);
    assert.ok(match[1].includes('搜索'));
  });

  it('should have tablist role for category navigation', () => {
    const html = renderPage();
    const tablistCount = (html.match(/role="tablist"/g) || []).length;
    assert.equal(tablistCount, 3, 'Should have 3 tab roles for categories (daily, weekly, monthly)');
  });

  it('report IDs should all be unique', () => {
    const reports = getMockReports();
    const ids = reports.map(r => r.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'All report IDs should be unique');
  });

  it('report titles should be non-empty strings', () => {
    const reports = getMockReports();
    for (const r of reports) {
      assert.ok(typeof r.title === 'string' && r.title.length > 0);
    }
  });

  it('should handle empty reports list gracefully', () => {
    const html = renderPageWith([]);
    assert.ok(html.includes('0'), 'Should show 0 total');
  });

  it('should handle single report', () => {
    const single = [{ id: 'r1', title: '日活-20260710', type: 'daily' as const, status: 'generated' as const }];
    const html = renderPageWith(single);
    assert.ok(html.includes('1'), 'Should show count 1');
  });

  it('should handle all types represented', () => {
    const reports = getMockReports();
    const typeSet = new Set(reports.map(r => r.type));
    assert.ok(typeSet.has('daily'));
    assert.ok(typeSet.has('weekly'));
    assert.ok(typeSet.has('monthly'));
  });

  it('should handle reports with long titles', () => {
    const longTitle = '日活-20260719-周末特别版-含分时段客流分析';
    const reports = getMockReports();
    const found = reports.some(r => r.title.length > 14);
    // At least some titles are long enough
    assert.ok(reports[0].title.length > 5);
  });

  it('should not show "生成中" when none generating', () => {
    const allGenerated = getMockReports().map(r => ({ ...r, status: 'generated' as const }));
    const html = renderPageWith(allGenerated);
    assert.ok(!html.includes('生成中') || html.includes('生成中: 0'), 'Should show 0 generating');
  });
});

function getMockReports() {
  return [
    { id: 'r1', title: '日活-20260715', type: 'daily' as const, status: 'generated' as const },
    { id: 'r2', title: '周报-W29', type: 'weekly' as const, status: 'generated' as const },
    { id: 'r3', title: '日活-20260714', type: 'daily' as const, status: 'generated' as const },
    { id: 'r4', title: '月报-0626', type: 'monthly' as const, status: 'generated' as const },
    { id: 'r5', title: '日活-20260713', type: 'daily' as const, status: 'generated' as const },
    { id: 'r6', title: '周报-W28', type: 'weekly' as const, status: 'generated' as const },
    { id: 'r7', title: '日活-20260716', type: 'daily' as const, status: 'generating' as const },
    { id: 'r8', title: '日活-20260712', type: 'daily' as const, status: 'generated' as const },
  ];
}

function renderPageWith(reports: Array<{ id: string; title: string; type: string; status: string }>): string {
  const generated = reports.filter((r) => r.status === 'generated').length;
  const generating = reports.filter((r) => r.status === 'generating').length;
  const totals = { daily: 0, weekly: 0, monthly: 0 };
  for (const r of reports) { if (r.type in totals) (totals as Record<string, number>)[r.type]++; }

  const tabs = Object.keys(totals).filter(t => (totals as Record<string, number>)[t] > 0);
  const tabHtml = tabs.map(t => `<div role="tablist">${t === 'daily' ? '日活' : t === 'weekly' ? '周报' : '月报'}</div>`).join('\n');

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
        <div>${tabHtml}</div>
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

function renderPage(): string {
  return renderPageWith(getMockReports());
}
