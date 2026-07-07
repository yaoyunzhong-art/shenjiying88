import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('StoreManagerPage structure', () => {
  // Page file exists
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Client file exists
  it('should have the client component file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Page exports a default function
  it('should export default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  // Client component exports named function
  it('should export StoreManagerDashboardClient', async () => {
    const mod = await import('./store-manager-client.tsx');
    assert.equal(typeof mod.StoreManagerDashboardClient, 'function');
  });

  // Verify source contains expected sections
  it('should contain expected sections in client source', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // Import check
    assert.ok(source.includes('StoreManagerDashboard'), 'Missing StoreManagerDashboard import');
    assert.ok(source.includes('@m5/ui'), 'Missing @m5/ui import');

    // Mock data
    assert.ok(source.includes('朝阳旗舰店'), 'Missing store name');
    assert.ok(source.includes('52800'), 'Missing revenue mock data');
    assert.ok(source.includes('342'), 'Missing order count');
    assert.ok(source.includes('SKU-089'), 'Missing task title');
    assert.ok(source.includes('POS-02'), 'Missing device task');
    assert.ok(source.includes('扫码入库'), 'Missing quick action');
    assert.ok(source.includes('新建订单'), 'Missing order action');
    assert.ok(source.includes('会员查询'), 'Missing member action');
    assert.ok(source.includes('设备巡检'), 'Missing device action');
    assert.ok(source.includes('交接班'), 'Missing shift action');
  });

  // Verify metric types are complete
  it('should have complete daily metrics', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('revenue'), 'Missing revenue field');
    assert.ok(source.includes('orderCount'), 'Missing orderCount field');
    assert.ok(source.includes('avgOrderValue'), 'Missing avgOrderValue field');
    assert.ok(source.includes('newMembers'), 'Missing newMembers field');
    assert.ok(source.includes('revenueTrend'), 'Missing revenueTrend field');
    assert.ok(source.includes('orderTrend'), 'Missing orderTrend field');
    assert.ok(source.includes('memberTrend'), 'Missing memberTrend field');
  });

  // Verify device status completeness
  it('should have complete device status', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('total'), 'Missing total field');
    assert.ok(source.includes('online'), 'Missing online field');
    assert.ok(source.includes('offline'), 'Missing offline field');
    assert.ok(source.includes('warning'), 'Missing warning field');
  });

  // Verify pending tasks data
  it('should have all 5 pending tasks', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const taskTitles = [
      'SKU-089 库存不足',
      '钻石会员张先生投诉',
      'POS-02 打印机缺纸',
      '晚班排班表待确认',
      '冷藏柜温度异常',
    ];

    for (const title of taskTitles) {
      assert.ok(source.includes(title), `Missing task: ${title}`);
    }
  });

  // Verify all quick actions
  it('should have 6 quick actions', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    const actions = ['扫码入库', '新建订单', '会员查询', '设备巡检', '营收报表', '交接班'];
    for (const action of actions) {
      assert.ok(source.includes(action), `Missing action: ${action}`);
    }
  });

  // Verify lastSyncAt is present
  it('should include lastSyncAt prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('lastSyncAt'), 'Missing lastSyncAt prop');
  });

  // Priority coverage
  it('should include all priority levels', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes("priority: 'high'"), 'Missing high priority');
    assert.ok(source.includes("priority: 'medium'"), 'Missing medium priority');
    assert.ok(source.includes("priority: 'low'"), 'Missing low priority');
  });

  // Task type coverage
  it('should include all task types', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./store-manager-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes("type: 'inventory'"), 'Missing inventory type');
    assert.ok(source.includes("type: 'member'"), 'Missing member type');
    assert.ok(source.includes("type: 'device'"), 'Missing device type');
    assert.ok(source.includes("type: 'order'"), 'Missing order type');
    assert.ok(source.includes("type: 'alert'"), 'Missing alert type');
  });
});
