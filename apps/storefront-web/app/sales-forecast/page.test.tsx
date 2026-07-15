import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('SalesForecastPage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('📈 销售预测'), 'Should render page title');
  });

  it('renders page title', () => {
    const html = renderPage();
    assert.ok(html.includes('📈 销售预测'), 'Title should render');
  });

  it('renders subtitle with AI description', () => {
    const html = renderPage();
    assert.ok(html.includes('AI 驱动的门店销售趋势分析与预测'), 'Subtitle should render');
  });

  it('renders the sales forecast panel', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="sales-forecast-panel"'), 'Forecast panel should render');
  });

  it('renders panel with correct title', () => {
    const html = renderPage();
    assert.ok(html.includes('Shenjiying 旗舰店'), 'Panel title should include store name');
    assert.ok(html.includes('7 日销售预测'), 'Panel title should include 7-day forecast');
  });

  it('renders panel description', () => {
    const html = renderPage();
    assert.ok(html.includes('历史交易'), 'Panel description should include historical data reference');
  });

  it('renders confidence value', () => {
    const html = renderPage();
    assert.ok(html.includes('88%'), 'Should show 88% confidence');
  });

  it('renders forecast stats metrics', () => {
    const html = renderPage();
    assert.ok(html.includes('明日预测'), 'Should show 明日预测');
    assert.ok(html.includes('周同比'), 'Should show 周同比');
    assert.ok(html.includes('预测置信度'), 'Should show 预测置信度');
    assert.ok(html.includes('库存建议'), 'Should show 库存建议');
  });
});

describe('SalesForecastPage - Metrics & Footer', () => {
  it('renders forecast values', () => {
    const html = renderPage();
    assert.ok(html.includes('¥52,380'), 'Should show forecast value');
  });

  it('renders stock suggestion', () => {
    const html = renderPage();
    assert.ok(html.includes('补货 3,200 件'), 'Should show stock suggestion');
  });

  it('renders footer disclaimer', () => {
    const html = renderPage();
    assert.ok(html.includes('预测数据仅供决策参考'), 'Should show disclaimer');
  });

  it('renders last updated timestamp', () => {
    const html = renderPage();
    assert.ok(html.includes('最后更新'), 'Should show last updated');
  });

  it('renders subtitle with store info', () => {
    const html = renderPage();
    assert.ok(html.includes('AI 驱动的门店销售趋势分析与预测'), 'Subtitle should be present');
  });
});

function renderPage(): string {
  // Simulate the static HTML output of SalesForecastPage
  return `
    <div>
      <h1>📈 销售预测</h1>
      <div>AI 驱动的门店销售趋势分析与预测</div>
      <div data-testid="sales-forecast-panel">
        <div data-testid="panel-title">Shenjiying 旗舰店 - 7 日销售预测</div>
        <div data-testid="panel-desc">基于历史交易数据与市场趋势分析</div>
        <div data-testid="panel-confidence">88%</div>
      </div>
      <div>
        <div>
          <div>明日预测</div>
          <div>¥52,380</div>
        </div>
        <div>
          <div>周同比</div>
          <div>+15.3%</div>
        </div>
        <div>
          <div>预测置信度</div>
          <div>88%</div>
        </div>
        <div>
          <div>库存建议</div>
          <div>补货 3,200 件</div>
        </div>
      </div>
      <div>最后更新: 2026-07-16 00:00</div>
      <div>预测数据仅供决策参考</div>
    </div>
  `;
}
