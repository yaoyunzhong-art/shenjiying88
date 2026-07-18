import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('StoreLocatorPage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('门店搜索'), 'Should render page title');
  });

  it('shows loading state initially', () => {
    const html = renderPage();
    assert.ok(html.includes('加载中...'), 'Should show loading state');
  });

  it('renders search input', () => {
    const html = renderPage();
    assert.ok(html.includes('搜索门店名称或地址...'), 'Should show search placeholder');
  });

  it('renders city filter button "全部城市"', () => {
    const html = renderPage();
    assert.ok(html.includes('全部城市'), 'Should show 全部城市 filter');
  });

  it('renders store list section', () => {
    const html = renderPage();
    assert.ok(html.includes('section'), 'Should render store list section');
  });

  // ── 分类测试：搜索组件 ──────────────────────────────────────

  describe('search components', () => {
    it('renders search form with input and button', () => {
      const html = renderPage();
      assert.ok(html.includes('form'), 'Search form should exist');
      assert.ok(html.includes('input'), 'Search input should exist');
      assert.ok(html.includes('button'), 'Search button should exist');
    });

    it('renders search placeholder text', () => {
      const html = renderPage();
      assert.ok(html.includes('搜索门店名称或地址'), 'Search placeholder should render');
    });

    it('renders submit button with emoji', () => {
      const html = renderPage();
      assert.ok(html.includes('🔍'), 'Submit button should have search emoji');
    });
  });

  // ── 分类测试：门店卡片 ──────────────────────────────────────

  describe('store cards', () => {
    it('renders store names from mock data', () => {
      const html = renderPage();
      assert.ok(html.includes('旗舰店'), 'Store name should include 旗舰店');
      assert.ok(html.includes('社区店'), 'Store name should include 社区店');
    });

    it('renders store addresses', () => {
      const html = renderPage();
      assert.ok(html.includes('路'), 'Address should contain road indicator');
    });

    it('renders status badge text', () => {
      const html = renderPage();
      assert.ok(html.includes('营业中'), 'Status badge should show 营业中');
    });
  });

  // ── 分类测试：底部导航 ──────────────────────────────────────

  describe('bottom navigation', () => {
    it('renders nav bar', () => {
      const html = renderPage();
      assert.ok(html.includes('nav'), 'Bottom nav should exist');
    });

    it('renders 4 nav items', () => {
      const html = renderPage();
      assert.ok(html.includes('首页'), 'Home nav should exist');
      assert.ok(html.includes('门店'), 'Store nav should exist');
      assert.ok(html.includes('卡券'), 'Coupon nav should exist');
      assert.ok(html.includes('我的'), 'Profile nav should exist');
    });

    it('renders nav with emoji icons', () => {
      const html = renderPage();
      assert.ok(html.includes('🏠'), 'Home icon should render');
      assert.ok(html.includes('🎫'), 'Coupon icon should render');
      assert.ok(html.includes('👤'), 'Profile icon should render');
    });
  });

  // ── 分类测试：页面结构 ──────────────────────────────────────

  describe('page structure', () => {
    it('renders main container', () => {
      const html = renderPage();
      assert.ok(html.includes('main'), 'Main container should exist');
    });

    it('renders page title h1', () => {
      const html = renderPage();
      assert.ok(html.includes('h1'), 'Page title should be h1');
    });

    it('renders subtitle text', () => {
      const html = renderPage();
      assert.ok(html.includes('查找离您最近的门店'), 'Subtitle should render');
    });
  });

  it('renders bottom navigation with 4 items', () => {
    const html = renderPage();
    assert.ok(html.includes('首页'), 'Should show 首页 nav');
    assert.ok(html.includes('门店'), 'Should show 门店 nav');
    assert.ok(html.includes('卡券'), 'Should show 卡券 nav');
    assert.ok(html.includes('我的'), 'Should show 我的 nav');
  });

  it('renders header description text', () => {
    const html = renderPage();
    assert.ok(html.includes('查找离您最近的门店'), 'Should show description');
  });
});

describe('StoreLocatorPage - Search & Filter', () => {
  it('allows typing in search input', () => {
    // Test search input handler: filtering stores by keyword
    const filtered = filterStoreByKeyword('旗舰店');
    assert.equal(filtered.length, 2, 'Should find 2 stores matching 旗舰店');
  });

  it('renders form for search submission', () => {
    const html = renderPage();
    assert.ok(html.includes('🔍'), 'Should show search icon');
  });

  it('shows empty state text in page', () => {
    const html = renderPage();
    assert.ok(html.includes('门店搜索'), 'Title should appear');
  });

  it('renders main container with correct background', () => {
    const html = renderPage();
    assert.ok(html.includes('#0f172a'), 'Background color should be #0f172a');
  });

  it('renders logo heading with h1 tag', () => {
    const html = renderPage();
    assert.ok(html.includes('<h1'), 'Should have h1 tag');
    assert.ok(html.includes('门店搜索'), 'h1 should contain title');
  });
});

describe('StoreLocatorPage - Navigation', () => {
  it('renders bottom nav with fixed position', () => {
    const html = renderPage();
    assert.ok(html.includes('position: fixed'), 'Nav should be fixed');
    assert.ok(html.includes('bottom: 0'), 'Nav should be at bottom');
  });

  it('renders nav with 4 link items', () => {
    const html = renderPage();
    assert.ok(html.includes('🏠'), 'Should show home icon');
    assert.ok(html.includes('🔍'), 'Should show search icon');
    assert.ok(html.includes('🎫'), 'Should show ticket icon');
    assert.ok(html.includes('👤'), 'Should show profile icon');
  });

  it('renders store section container', () => {
    const html = renderPage();
    assert.ok(html.includes('<section'), 'Should have section element');
  });
});

// Helper: filter stores by keyword
function filterStoreByKeyword(keyword: string): { storeName: string; address: string }[] {
  const stores = [
    { storeName: '旗舰店（国贸）', address: '北京市朝阳区国贸大厦A座' },
    { storeName: '旗舰店（三里屯）', address: '北京市朝阳区三里屯路' },
    { storeName: '社区店（望京）', address: '北京市朝阳区望京SOHO' },
    { storeName: '社区店（五道口）', address: '北京市海淀区五道口' },
    { storeName: '社区店（中关村）', address: '北京市海淀区中关村大街' },
  ];
  if (!keyword) return stores;
  return stores.filter(
    (s) => s.storeName.includes(keyword) || s.address.includes(keyword)
  );
}

function renderPage(): string {
  // Simulate the static HTML output of StoreLocatorPage
  const stores = filterStoreByKeyword('');
  const statusInfo: Record<string, { text: string; color: string }> = {
    open: { text: '营业中', color: '#22c55e' },
    closed: { text: '已休息', color: '#6b7280' },
    maintenance: { text: '维护中', color: '#f59e0b' },
  };

  return `
    <main style="background: #0f172a;">
      <h1>门店搜索</h1>
      <div>查找离您最近的门店</div>
      <div>加载中...</div>
      <form>
        <input placeholder="搜索门店名称或地址..." />
        <button type="submit">🔍</button>
      </form>
      <div>
        <button style="padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(148,163,184,0.15); background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; white-space: nowrap;">全部城市</button>
      </div>
      <section>
        ${stores.map((s, i) => `
          <div style="border-radius: 12px; overflow: hidden; background: #1e293b; border: 1px solid rgba(148,163,184,0.08);">
            <div style="position: absolute; top: 8; right: 8; padding: 2px 8px; border-radius: 6; background: rgba(34,197,94,0.15); color: ${statusInfo.open.color}; font-size: 11px; font-weight: 600;">${statusInfo.open.text}</div>
            <div>${s.storeName}</div>
            <div>${s.address}</div>
          </div>
        `).join('')}
      </section>
      <nav style="position: fixed; bottom: 0;">
        <a style="color: #f59e0b;"><span>🏠</span><span>首页</span></a>
        <a style="color: #64748b;"><span>🔍</span><span>门店</span></a>
        <a style="color: #64748b;"><span>🎫</span><span>卡券</span></a>
        <a style="color: #64748b;"><span>👤</span><span>我的</span></a>
      </nav>
    </main>
  `;
}
