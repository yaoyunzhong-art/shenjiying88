/**
 * store-manager/page.test.tsx — 店长工作台页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('store-manager — 正例', () => {
  it('应导出一个默认函数组件 StoreManagerPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreManagerPage'), '缺少默认导出');
  });

  it('应导入 StoreManagerDashboardClient', () => {
    const src = readSource();
    assert.ok(src.includes('StoreManagerDashboardClient'), '缺少 StoreManagerDashboardClient 导入');
  });

  it('应返回 JSX 组件 StoreManagerDashboardClient', () => {
    const src = readSource();
    assert.ok(src.includes('<StoreManagerDashboardClient'), '缺少 JSX 渲染');
  });
});

describe('store-manager-client — 正例', () => {
  it('应在 store-manager-client.tsx 中定义 MOCK_METRICS 数据', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('MOCK_METRICS'), '缺少 MOCK_METRICS');
  });

  it('应包含 StoreDailyMetrics 类型指标字段', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('revenue'), '缺少 revenue');
    assert.ok(src.includes('orderCount'), '缺少 orderCount');
    assert.ok(src.includes('avgOrderValue'), '缺少 avgOrderValue');
    assert.ok(src.includes('newMembers'), '缺少 newMembers');
  });

  it('趋势字段中应有 revenueTrend', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('revenueTrend'), '缺少 revenueTrend');
  });
});

describe('store-manager-client — 边界', () => {
  it('应包含 PendingTask 待办任务列表数据', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('MOCK_TASKS'), '缺少待办任务');
    assert.ok(src.includes('priority'), '缺少 priority 字段');
    assert.ok(src.includes('high'), '高优先级任务');
    assert.ok(src.includes('medium'), '中优先级任务');
  });

  it('应包含 DeviceStatusSummary 设备状态数据', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('MOCK_DEVICE_STATUS'), '缺少设备状态');
    assert.ok(src.includes('online'), '在线设备');
    assert.ok(src.includes('offline'), '离线设备');
  });

  it('应包含 QuickAction 快速操作列表', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('MOCK_ACTIONS'), '缺少快速操作');
    assert.ok(src.includes('scan'), '扫码入库');
    assert.ok(src.includes('order'), '新建订单');
  });

  it('门店名称和同步时间应存在', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('storeName'), '缺少 storeName');
    assert.ok(src.includes('lastSyncAt'), '缺少 lastSyncAt');
  });
});

describe('store-manager-client — 防御', () => {
  it('store-manager-client.tsx 应包含 use client 指令', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应使用 StoreManagerDashboard 组件', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('StoreManagerDashboard'), '缺少 StoreManagerDashboard');
  });

  it('应导入类型 StoreDailyMetrics / PendingTask / QuickAction', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('StoreDailyMetrics'), '缺少 StoreDailyMetrics 类型');
    assert.ok(src.includes('PendingTask'), '缺少 PendingTask 类型');
    assert.ok(src.includes('QuickAction'), '缺少 QuickAction 类型');
  });

  it('MOCK_TASKS 应包含 inventory, member, device 等任务类型', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes("'inventory'"), '库存任务');
    assert.ok(src.includes("'member'"), '会员任务');
    assert.ok(src.includes("'device'"), '设备任务');
  });

  it('MOCK_ACTIONS 应包含 primary 快捷操作标记', () => {
    const src = readFileSync(resolve(__dirname, 'store-manager-client.tsx'), 'utf-8');
    assert.ok(src.includes('primary'), '缺少 primary 操作标记');
    assert.ok(src.includes('true'), 'primary 标记为 true');
  });
});
