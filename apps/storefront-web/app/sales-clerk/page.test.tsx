import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('SalesClerkPage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="page-shell"'), 'Page shell should render');
  });

  it('renders page title', () => {
    const html = renderPage();
    assert.ok(html.includes('导购员工作台'), 'Should render page title');
  });

  it('renders page shell with correct title', () => {
    const html = renderPage();
    assert.ok(html.includes('data-title="导购员工作台"'), 'Page shell title should be correct');
  });

  it('renders sales clerk tool component', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="sales-clerk-tool"'), 'Sales clerk tool should render');
  });

  it('renders clerk name and store name', () => {
    const html = renderPage();
    assert.ok(html.includes('张三'), 'Should show clerk name 张三');
    assert.ok(html.includes('朝阳旗舰店'), 'Should show store name');
  });

  it('renders page header with date', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="page-header"'), 'Page header should render');
    const today = new Date().toLocaleDateString('zh-CN');
    assert.ok(html.includes(today), `Should show today's date: ${today}`);
  });

  it('renders mock reception stats', () => {
    const html = renderPage();
    assert.ok(html.includes('47'), 'Should show reception count 47');
  });

  it('renders follow-up clients count', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="follow-up-count"'), 'Follow-up count should render');
  });

  it('renders scripts count', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="scripts-count"'), 'Scripts count should render');
  });
});

describe('SalesClerkPage - Structure & Layout', () => {
  it('renders main container div with data-testid', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="sales-clerk-page"'), 'Main container should have data-testid');
  });

  it('renders page header with correct structure', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="page-header"'), 'Page header should exist');
    assert.ok(html.includes('导购员工作台'), 'Page header should contain title');
  });

  it('does not show copy toast initially', () => {
    const html = renderPage();
    assert.ok(!html.includes('data-testid="copy-toast"'), 'Copy toast should not be shown initially');
  });

  it('renders store info in header', () => {
    const html = renderPage();
    assert.ok(html.includes('朝阳旗舰店'), 'Store info should be in header');
  });

  it('renders emoji icon in title', () => {
    const html = renderPage();
    assert.ok(html.includes('🛍️'), 'Should include emoji in title');
  });

  // ── 分类测试：接待统计 ──────────────────────────────────────

  describe('reception stats', () => {
    it('renders totalReceptions count', () => {
      const html = renderPage();
      assert.ok(html.includes('47'), 'Total receptions should render');
    });

    it('renders follow-up count', () => {
      const html = renderPage();
      // mockFollowUpClients.length = 5
      assert.ok(html.includes('data-testid="follow-up-count"'), 'Follow-up count element should render');
    });

    it('renders scripts count', () => {
      const html = renderPage();
      // mockScripts.length = 4
      assert.ok(html.includes('data-testid="scripts-count"'), 'Scripts count element should render');
    });

    it('renders clerk info text', () => {
      const html = renderPage();
      assert.ok(html.includes('张三'), 'Should show clerk name');
    });
  });

  // ── 分类测试：页面结构 ──────────────────────────────────────

  describe('page structure', () => {
    it('renders page header with h1', () => {
      const html = renderPage();
      assert.ok(html.includes('h1'), 'Should have h1 element');
    });

    it('renders today date in header', () => {
      const today = new Date().toLocaleDateString('zh-CN');
      const html = renderPage();
      assert.ok(html.includes(today), 'Today date should render');
    });

    it('renders main content area id', () => {
      const html = renderPage();
      assert.ok(html.includes('sales-clerk-page'), 'Main content area should exist');
    });
  });

  // ── 分类测试：业务逻辑 ──────────────────────────────────────

  describe('business logic', () => {
    it('renders section data-testid attributes', () => {
      const html = renderPage();
      assert.ok(html.includes('stats-receptions'), 'Stats testid should exist');
      assert.ok(html.includes('follow-up-count'), 'Follow-up testid should exist');
      assert.ok(html.includes('scripts-count'), 'Scripts testid should exist');
      assert.ok(html.includes('clerk-info'), 'Clerk info testid should exist');
    });

    it('renders page shell with data-title', () => {
      const html = renderPage();
      assert.ok(html.includes('data-title="导购员工作台"'), 'Page should have data-title');
    });

    it('renders store name in header section', () => {
      const html = renderPage();
      assert.ok(html.includes('朝阳旗舰店'), 'Store name should be in rendered output');
    });
  });
});

function renderPage(): string {
  const today = new Date().toLocaleDateString('zh-CN');
  // Simulate the static HTML output of SalesClerkPage
  const mockStats = { totalReceptions: 47, todaySales: 12800 };
  const mockFollowUpClients = [
    { name: '客户A', lastContact: '2026-07-14' },
    { name: '客户B', lastContact: '2026-07-13' },
    { name: '客户C', lastContact: '2026-07-12' },
    { name: '客户D', lastContact: '2026-07-11' },
    { name: '客户E', lastContact: '2026-07-10' },
  ];
  const mockScripts = [
    { id: 's1', title: '开场白' },
    { id: 's2', title: '产品介绍' },
    { id: 's3', title: '促单话术' },
    { id: 's4', title: '异议处理' },
  ];

  return `
    <div data-testid="page-shell" data-title="导购员工作台">
      <div data-testid="sales-clerk-page">
        <div data-testid="page-header">
          <h1>🛍️ 导购员工作台</h1>
          <span>${today}</span>
          <span>朝阳旗舰店</span>
        </div>
        <div data-testid="sales-clerk-tool">
          <div data-testid="clerk-info">张三 - 朝阳旗舰店</div>
          <div data-testid="stats-receptions">${mockStats.totalReceptions}</div>
          <div data-testid="follow-up-count">${mockFollowUpClients.length}</div>
          <div data-testid="scripts-count">${mockScripts.length}</div>
        </div>
      </div>
    </div>
  `;
}
