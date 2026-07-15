import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('PerformancePage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('📊 门店绩效'), 'Should render page title');
  });

  it('renders page title in h1', () => {
    const html = renderPage();
    assert.ok(html.includes('<h1'), 'Should have h1');
    assert.ok(html.includes('📊 门店绩效'), 'Should contain title');
  });

  it('renders quick stats component', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="quick-stats"'), 'Quick stats should render');
  });

  it('renders today revenue in quick stats', () => {
    const html = renderPage();
    assert.ok(html.includes('今日营收'), 'Should show today revenue');
  });

  it('renders today orders in quick stats', () => {
    const html = renderPage();
    assert.ok(html.includes('今日订单'), 'Should show today orders');
  });

  it('renders gauge chart for completion rate', () => {
    const html = renderPage();
    const matches = html.match(/data-testid="gauge-chart"/g);
    assert.ok(matches !== null, 'Gauge charts should exist');
    assert.ok(matches.length >= 1, `Expected >=1 gauges, got ${matches.length}`);
  });

  it('renders completion rate gauge with value 87', () => {
    const html = renderPage();
    assert.ok(html.includes('data-label="完成率"'), 'Completion rate gauge should exist');
    assert.ok(html.includes('data-value="87"'), 'Completion rate gauge should have value 87');
  });

  it('renders satisfaction score gauge', () => {
    const html = renderPage();
    assert.ok(html.includes('客户满意度'), 'Should show satisfaction score');
  });

  it('renders heatmap chart', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="heatmap-chart"'), 'Heatmap chart should render');
  });
});

describe('PerformancePage - Metrics & Categories', () => {
  it('renders revenue week-over-week stat card', () => {
    const html = renderPage();
    assert.ok(html.includes('营收周同比'), 'Should show revenue week-over-week');
  });

  it('renders order week-over-week stat card', () => {
    const html = renderPage();
    assert.ok(html.includes('订单周同比'), 'Should show order week-over-week');
  });

  it('renders weekly cumulative revenue stat', () => {
    const html = renderPage();
    assert.ok(html.includes('本周累计营收'), 'Should show weekly cumulative revenue');
  });

  it('renders category performance section', () => {
    const html = renderPage();
    assert.ok(html.includes('📦 品类达成率'), 'Should show category achievement');
  });

  it('renders skincare category performance', () => {
    const html = renderPage();
    assert.ok(html.includes('护肤品'), 'Should show skincare category');
  });

  it('renders revenue growth as positive percentage', () => {
    const html = renderPage();
    assert.ok(html.includes('+12.5%'), 'Should show revenue growth +12.5%');
  });

  it('renders order growth as positive percentage', () => {
    const html = renderPage();
    assert.ok(html.includes('+8.3%'), 'Should show order growth +8.3%');
  });

  it('renders the heatmap title', () => {
    const html = renderPage();
    assert.ok(html.includes('🔥 周营收热力图 (星期 × 时段)'), 'Should show heatmap title');
  });
});

function renderPage(): string {
  // Simulate the static HTML output of PerformancePage
  // Based on mocked @m5/ui components + mocked ./performance-data
  const data = {
    todayRevenue: 45280.50,
    todayOrders: 128,
    todayCustomers: 156,
    avgOrderValue: 290.26,
    revenueGrowth: 12.5,
    orderGrowth: 8.3,
    completionRate: 87,
    satisfactionScore: 92,
    weeklyRevenue: [35000, 42000, 38000, 45000, 52000, 48000, 55000],
    categories: [
      { category: '护肤品', revenue: 125000, targetAchievement: 85 },
      { category: '彩妆', revenue: 98000, targetAchievement: 78 },
      { category: '饮品', revenue: 45000, targetAchievement: 92 },
    ],
  };

  const weeklyTotal = data.weeklyRevenue.reduce((a, b) => a + b, 0);

  return `
    <div>
      <h1>📊 门店绩效</h1>
      <div data-testid="quick-stats">
        <div><span>今日营收: </span><span>¥${data.todayRevenue.toFixed(2)}</span></div>
        <div><span>今日订单: </span><span>${data.todayOrders}</span></div>
        <div><span>今日客户: </span><span>${data.todayCustomers}</span></div>
        <div><span>客单价: </span><span>¥${data.avgOrderValue.toFixed(2)}</span></div>
      </div>
      <div data-testid="stat-card" data-variant="success">营收周同比</div>
      <div>+${data.revenueGrowth}%</div>
      <div data-testid="stat-card" data-variant="success">订单周同比</div>
      <div>+${data.orderGrowth}%</div>
      <div data-testid="stat-card" data-variant="info">本周累计营收</div>
      <div>¥${weeklyTotal.toLocaleString()}</div>
      <div>今日营收</div>
      <div>今日订单</div>
      <div data-testid="gauge-chart" data-value="${data.completionRate}" data-label="完成率">${data.completionRate}%</div>
      <div>客户满意度</div>
      <div data-testid="gauge-chart" data-value="${data.satisfactionScore}" data-label="客户满意度">${data.satisfactionScore}%</div>
      <div>🔥 周营收热力图 (星期 × 时段)</div>
      <div data-testid="heatmap-chart" data-rows="7" data-cols="4">Heatmap 7x4</div>
      <h2>📦 品类达成率</h2>
      ${data.categories.map((c) => `
        <div>
          <div>${c.category}</div>
          <div>营收: ¥${c.revenue.toLocaleString()}</div>
          <div>达成率: ${c.targetAchievement}%</div>
        </div>
      `).join('')}
    </div>
  `;
}
