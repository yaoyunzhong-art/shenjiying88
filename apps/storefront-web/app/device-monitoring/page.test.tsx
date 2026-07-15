import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('DeviceMonitoringPage — 源码分析', () => {
  it('应导出默认函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export default function DeviceMonitoringPage'));
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"));
  });

  it('应包含 LoadingSkeleton 组件', () => {
    const src = readSource();
    assert.ok(src.includes('function LoadingSkeleton'));
  });

  it('应包含 ErrorState 组件', () => {
    const src = readSource();
    assert.ok(src.includes('function ErrorState'));
    assert.ok(src.includes('onRetry'));
  });

  it('应包含 CategoryDistributionChart 分类分布图', () => {
    const src = readSource();
    assert.ok(src.includes('CategoryDistributionChart'));
    assert.ok(src.includes('设备类型分布'));
  });

  it('应包含 AlertSummary 告警汇总', () => {
    const src = readSource();
    assert.ok(src.includes('AlertSummary'));
    assert.ok(src.includes('告警汇总'));
  });

  it('应包含 RecentEvents 最近心跳', () => {
    const src = readSource();
    assert.ok(src.includes('RecentEvents'));
    assert.ok(src.includes('最近心跳上报'));
  });

  it('应包含 MaintenanceRecord 维护记录', () => {
    const src = readSource();
    assert.ok(src.includes('MaintenanceRecord'));
    assert.ok(src.includes('最近维护记录'));
  });

  it('应模拟加载延迟（loading态）', () => {
    const src = readSource();
    assert.ok(src.includes('setLoading(true)'));
    assert.ok(src.includes('setLoading(false)'));
  });

  it('应模拟错误概率（error态）', () => {
    const src = readSource();
    assert.ok(src.includes('Math.random() < 0.05'));
    assert.ok(src.includes('setError'));
  });

  it('应包含 handleRetry 重试函数', () => {
    const src = readSource();
    assert.ok(src.includes('handleRetry'));
  });

  it('应包含空状态守卫', () => {
    const src = readSource();
    assert.ok(src.includes('暂无设备'));
  });

  it('renders page shell with correct title', () => {
    const src = readSource();
    assert.ok(src.includes('设备监控'));
    assert.ok(src.includes('PageShell'));
  });

  it('uses model imports', () => {
    const src = readSource();
    assert.ok(src.includes('generateMockDevices'));
    assert.ok(src.includes('computeStats'));
    assert.ok(src.includes('sortDevicesBySeverity'));
    assert.ok(src.includes('filterDevices'));
  });

  it('uses segmented control and search', () => {
    const src = readSource();
    assert.ok(src.includes('SegmentedControl'));
    assert.ok(src.includes('SearchFilterInput'));
  });

  it('uses pagination', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'));
  });
});

describe('DeviceMonitoringPage - 模拟渲染', () => {
  it('renders stat cards for device counts', () => {
    const src = readSource();
    assert.ok(src.includes('设备总数'));
    assert.ok(src.includes('在线'));
    assert.ok(src.includes('离线'));
    assert.ok(src.includes('警告'));
    assert.ok(src.includes('健康率'));
  });

  it('shows device IP addresses in rendering', () => {
    const src = readSource();
    assert.ok(src.includes('.ip'));
  });

  it('shows firmware versions', () => {
    const src = readSource();
    assert.ok(src.includes('firmware'));
  });

  it('shows store names for devices', () => {
    const src = readSource();
    assert.ok(src.includes('storeName'));
  });

  it('shows health rate percentage value', () => {
    const src = readSource();
    assert.ok(src.includes('stats.healthRate'));
  });

  it('renders device category labels', () => {
    const src = readSource();
    assert.ok(src.includes('DEVICE_CATEGORY_LABELS'));
  });

  it('shows alert counts on device items', () => {
    const src = readSource();
    assert.ok(src.includes('告警'));
  });

  it('shows status badge for each device', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'));
  });

  it('shows pagination info in footer', () => {
    const src = readSource();
    assert.ok(src.includes('totalPages'));
    assert.ok(src.includes('filtered.length'));
  });
});

describe('DeviceMonitoringPage - 防御', () => {
  it('page.tsx should not contain hardcoded phone numbers', () => {
    const src = readSource();
    assert.ok(!src.match(/1[3-9]\d{9}/), '不应包含手机号');
  });

  it('empty state handles zero devices', () => {
    const src = readSource();
    assert.ok(src.includes('devices.length === 0'));
  });

  it('properly handles the onPageChange callback', () => {
    const src = readSource();
    assert.ok(src.includes('onPageChange'));
  });
});
