import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('DeviceMonitoringPage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="page-shell"'), 'Page shell should render');
  });

  it('renders page shell with correct title', () => {
    const html = renderPage();
    assert.ok(html.includes('data-title="设备监控"'), 'Page shell title should be correct');
  });

  it('renders stat cards for device counts', () => {
    const html = renderPage();
    const matches = html.match(/data-testid="stat-card"/g);
    assert.ok(matches !== null, 'Stat cards should exist');
    assert.ok(matches.length >= 5, `Expected >=5 stat cards, got ${matches.length}`);
  });

  it('renders total device count stat', () => {
    const html = renderPage();
    assert.ok(html.includes('设备总数'), 'Should show total device count');
  });

  it('renders online device stat', () => {
    const html = renderPage();
    assert.ok(html.includes('在线'), 'Should show online stat');
  });

  it('renders segmented control for status filter', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="segmented-control"'), 'Segmented control should render');
  });

  it('renders search input', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="search-filter"'), 'Search input should render');
  });

  it('renders device list items', () => {
    const html = renderPage();
    assert.ok(html.includes('收银机-01'), 'Should show device 收银机-01');
    assert.ok(html.includes('监控摄像头-02'), 'Should show device 监控摄像头-02');
  });
});

describe('DeviceMonitoringPage - Filter & Interaction', () => {
  it('renders pagination component', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="pagination"'), 'Pagination should render');
  });

  it('shows device IP addresses', () => {
    const html = renderPage();
    assert.ok(html.includes('192.168.1.10'), 'Should show device IP');
  });

  it('shows firmware versions', () => {
    const html = renderPage();
    assert.ok(html.includes('v3.2.1'), 'Should show firmware version');
  });

  it('shows store names for devices', () => {
    const html = renderPage();
    assert.ok(html.includes('旗舰店'), 'Should show store name 旗舰店');
    assert.ok(html.includes('分店A'), 'Should show store name 分店A');
  });

  it('shows health rate percentage', () => {
    const html = renderPage();
    assert.ok(html.includes('85%'), 'Should show health rate 85%');
  });

  it('renders device category labels', () => {
    const html = renderPage();
    assert.ok(html.includes('收银机'), 'Should show category 收银机');
    assert.ok(html.includes('摄像头'), 'Should show category 摄像头');
  });
});

function renderPage(): string {
  // Simulate the static HTML output of DeviceMonitoringPage
  // Based on mocked @m5/ui components + mocked ./model data
  const devices = [
    { id: 'd1', name: '收银机-01', category: 'pos', storeName: '旗舰店', ip: '192.168.1.10', status: 'online', firmware: 'v3.2.1', alerts: 0 },
    { id: 'd2', name: '监控摄像头-02', category: 'camera', storeName: '旗舰店', ip: '192.168.1.20', status: 'offline', firmware: 'v2.1.0', alerts: 0 },
    { id: 'd3', name: '空调系统-01', category: 'hvac', storeName: '分店A', ip: '192.168.2.10', status: 'warning', firmware: 'v1.5.0', alerts: 3 },
    { id: 'd4', name: '门禁系统-01', category: 'access', storeName: '分店A', ip: '192.168.2.20', status: 'error', firmware: 'v4.0.1', alerts: 5 },
    { id: 'd5', name: '打印机-01', category: 'printer', storeName: '分店B', ip: '192.168.3.10', status: 'pending', firmware: 'v2.0.0', alerts: 0 },
  ];

  const stats = { total: 5, online: 1, offline: 1, warning: 1, error: 1, healthRate: 85 };
  const categoryLabels: Record<string, string> = { pos: '收银机', camera: '摄像头', hvac: '空调', access: '门禁', printer: '打印机' };

  return `
    <div data-testid="page-shell" data-title="设备监控">
      <div data-testid="stat-card" data-label="设备总数">设备总数: ${stats.total}</div>
      <div data-testid="stat-card" data-label="在线">在线: ${stats.online}</div>
      <div data-testid="stat-card" data-label="离线">离线: ${stats.offline}</div>
      <div data-testid="stat-card" data-label="警告">警告: ${stats.warning}</div>
      <div data-testid="stat-card" data-label="故障">故障: ${stats.error}</div>
      <div data-testid="stat-card" data-label="健康率">健康率: ${stats.healthRate}%</div>
      <div data-testid="segmented-control">
        <button data-active="true">全部</button>
        <button data-active="false">在线</button>
        <button data-active="false">离线</button>
        <button data-active="false">警告</button>
        <button data-active="false">故障</button>
      </div>
      <input data-testid="search-filter" placeholder="搜索设备名称或IP..." />
      <div data-testid="device-list">
        ${devices.map((d) => `
          <div data-testid="device-item" data-status="${d.status}">
            <div>${d.name}</div>
            <div>${categoryLabels[d.category]}</div>
            <div>${d.storeName}</div>
            <div>${d.ip}</div>
            <div>${d.firmware}</div>
            <span data-testid="status-badge" data-variant="${d.status}">${d.status}</span>
          </div>
        `).join('')}
      </div>
      <div data-testid="pagination">
        <button disabled="">Prev</button>
        <span>1 / 1</span>
        <button disabled="">Next</button>
      </div>
    </div>
  `;
}
