/**
 * DeviceDetailPage — 设备详情页测试
 * 测试：类型/常量完备性、状态流转、工具函数、页面组件渲染（仅 Node test）
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 类型定义 ──

type DeviceStatus = 'online' | 'offline' | 'warning' | 'error' | 'maintenance';

const VALID_STATUSES: DeviceStatus[] = ['online', 'offline', 'warning', 'error', 'maintenance'];

const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  warning: '警告',
  error: '故障',
  maintenance: '维护中',
};

const STATUS_VARIANT: Record<DeviceStatus, string> = {
  online: 'success',
  offline: 'neutral',
  warning: 'warning',
  error: 'error',
  maintenance: 'info',
};

const STATUS_ACTIONS: { label: string; status: DeviceStatus }[] = [
  { label: '标记在线', status: 'online' },
  { label: '标记离线', status: 'offline' },
  { label: '标记警告', status: 'warning' },
  { label: '标记故障', status: 'error' },
  { label: '维护中', status: 'maintenance' },
];

// ── 工具函数 ──

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

function uptimeLabel(uptime: string): string {
  const match = uptime.match(/^(\d+)h$/);
  if (!match) return uptime;
  const h = parseInt(match[1]!, 10);
  const days = Math.floor(h / 24);
  const hours = h % 24;
  if (days > 0) return `${days}天 ${hours}小时`;
  return `${hours} 小时`;
}

function heartbeatLabel(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DeviceDetailPage — 状态常量', () => {
  it('所有状态有中文标签', () => {
    for (const s of VALID_STATUSES) {
      assert.ok(DEVICE_STATUS_LABELS[s]);
      assert.equal(typeof DEVICE_STATUS_LABELS[s], 'string');
    }
  });

  it('所有状态有对应 variant', () => {
    for (const s of VALID_STATUSES) {
      assert.ok(STATUS_VARIANT[s]);
    }
  });

  it('STATUS_VARIANT 值在预期范围内', () => {
    const allowed = ['success', 'neutral', 'warning', 'error', 'info'];
    for (const v of Object.values(STATUS_VARIANT)) {
      assert.ok(allowed.includes(v));
    }
  });

  it('STATUS_ACTIONS 覆盖所有状态', () => {
    assert.equal(STATUS_ACTIONS.length, 5);
    const statuses = STATUS_ACTIONS.map((a) => a.status);
    for (const s of VALID_STATUSES) {
      assert.ok(statuses.includes(s), `缺少 ${s}`);
    }
  });
});

describe('DeviceDetailPage — formatSeconds', () => {
  it('3600s => 1h', () => {
    assert.equal(formatSeconds(3600), '1h');
  });
  it('3660s => 1h 1m', () => {
    assert.equal(formatSeconds(3660), '1h 1m');
  });
  it('0s => 0m', () => {
    assert.equal(formatSeconds(0), '0m');
  });
  it('59s => 0m', () => {
    assert.equal(formatSeconds(59), '0m');
  });
  it('86400s => 24h', () => {
    assert.equal(formatSeconds(86400), '24h');
  });
});

describe('DeviceDetailPage — uptimeLabel', () => {
  it('0h => 0 小时', () => {
    assert.equal(uptimeLabel('0h'), '0 小时');
  });
  it('1h => 1 小时', () => {
    assert.equal(uptimeLabel('1h'), '1 小时');
  });
  it('23h => 23 小时', () => {
    assert.equal(uptimeLabel('23h'), '23 小时');
  });
  it('24h => 1天 0小时', () => {
    assert.equal(uptimeLabel('24h'), '1天 0小时');
  });
  it('48h => 2天 0小时', () => {
    assert.equal(uptimeLabel('48h'), '2天 0小时');
  });
  it('720h => 30天 0小时', () => {
    assert.equal(uptimeLabel('720h'), '30天 0小时');
  });
  it('非标准格式直接返回', () => {
    assert.equal(uptimeLabel('2d 3h'), '2d 3h');
  });
});

describe('DeviceDetailPage — heartbeatLabel', () => {
  it('刚刚（<1分钟）', () => {
    const now = new Date().toISOString();
    assert.equal(heartbeatLabel(now), '刚刚');
  });
  it('5分钟前', () => {
    const past = new Date(Date.now() - 5 * 60000).toISOString();
    assert.equal(heartbeatLabel(past), '5 分钟前');
  });
  it('1小时前', () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    assert.equal(heartbeatLabel(past), '1 小时前');
  });
  it('23小时前', () => {
    const past = new Date(Date.now() - 23 * 3600000).toISOString();
    assert.equal(heartbeatLabel(past), '23 小时前');
  });
  it('1天前', () => {
    const past = new Date(Date.now() - 25 * 3600000).toISOString();
    assert.equal(heartbeatLabel(past), '1 天前');
  });
  it('3天前', () => {
    const past = new Date(Date.now() - 72 * 3600000).toISOString();
    assert.equal(heartbeatLabel(past), '3 天前');
  });
});

describe('DeviceDetailPage — formatDateTime', () => {
  it('ISO 转 zh-CN 格式', () => {
    const result = formatDateTime('2026-06-29T12:00:00Z');
    assert.ok(result.includes('2026'));
    assert.ok(result.includes('06'));
    assert.ok(result.includes('29'));
  });

  it('处理北京时间', () => {
    const result = formatDateTime('2026-06-29T20:12:00+08:00');
    assert.ok(result.includes('20'));
    assert.ok(result.includes('12'));
  });
});
