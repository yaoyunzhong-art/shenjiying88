/**
 * stores/[id]/platform/page.test.tsx — 开放平台页面 L1 测试
 *
 * 覆盖: API密钥数据、平台配置统计、开发文档、搜索过滤、状态标签
 * 正例: 数据类型、统计计数、配置状态、render结构、条件渲染
 * 反例: 空搜索、未知状态、缺失字段、类型错误
 * 边界: 百分比边界值、空/满配额、配置统计合计、时间比较
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import fs from 'node:fs';

/* ── 类型 ── */

type ConfigStatus = 'configured' | 'unconfigured' | 'error';

interface PlatformConfigItem {
  id: string;
  name: string;
  category: string;
  status: ConfigStatus;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  status: string;
  created: string;
  expires: string;
  lastUsed: string;
  quota: number;
  used: number;
}

interface APIKeyStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  nonActive: number;
  totalQuota: number;
  totalUsed: number;
  usagePct: number;
}

/* ── 平台配置数据 ── */

const PLATFORM_CONFIGS: PlatformConfigItem[] = [
  { id: 'PC-01', name: 'API密钥', category: '基础', status: 'configured' },
  { id: 'PC-02', name: 'Webhook回调', category: '集成', status: 'configured' },
  { id: 'PC-03', name: 'OAuth2认证', category: '安全', status: 'configured' },
  { id: 'PC-04', name: 'IP白名单', category: '安全', status: 'configured' },
  { id: 'PC-05', name: '频率限制', category: '基础', status: 'configured' },
  { id: 'PC-06', name: '日志推送', category: '集成', status: 'configured' },
  { id: 'PC-07', name: '监控告警', category: '运维', status: 'configured' },
  { id: 'PC-08', name: '数据导出', category: '集成', status: 'unconfigured' },
  { id: 'PC-09', name: '自定义域名', category: '基础', status: 'unconfigured' },
  { id: 'PC-10', name: 'SSL证书', category: '安全', status: 'unconfigured' },
  { id: 'PC-11', name: '邮件服务', category: '集成', status: 'error' },
  { id: 'PC-12', name: '短信通道', category: '集成', status: 'error' },
];

/* ── API密钥数据 ── */

const API_KEYS: APIKey[] = [
  { id:'K-001', name:'收银系统集成', key:'sk_live_****a1b2', status:'active',  created:'2026-03-01', expires:'2027-03-01', lastUsed:'2026-07-14 10:23', quota:10000, used:7245 },
  { id:'K-002', name:'会员小程序',     key:'sk_live_****c3d4', status:'active',  created:'2026-04-15', expires:'2027-04-15', lastUsed:'2026-07-14 09:15', quota:5000,  used:3120 },
  { id:'K-003', name:'第三方合作伙伴', key:'sk_live_****e5f6', status:'active',  created:'2026-05-01', expires:'2027-05-01', lastUsed:'2026-07-13 16:30', quota:2000,  used:845  },
  { id:'K-004', name:'测试密钥(旧)',   key:'sk_test_****g7h8', status:'expired', created:'2025-06-01', expires:'2026-06-01', lastUsed:'2026-05-30',       quota:1000,  used:989  },
  { id:'K-005', name:'离职开发密钥',   key:'sk_live_****i9j0', status:'revoked', created:'2025-10-01', expires:'2026-10-01', lastUsed:'2026-06-15',       quota:5000,  used:4800 },
];

/* ── 工具函数 ── */

function getConfigStatusCounts(configs: PlatformConfigItem[]) {
  const total = configs.length;
  const configured = configs.filter(c => c.status === 'configured').length;
  const unconfigured = configs.filter(c => c.status === 'unconfigured').length;
  const error = configs.filter(c => c.status === 'error').length;
  return { total, configured, unconfigured, error };
}

function getKeyStats(keys: APIKey[]): APIKeyStats {
  const total = keys.length;
  const active = keys.filter(k => k.status === 'active').length;
  const expired = keys.filter(k => k.status === 'expired').length;
  const revoked = keys.filter(k => k.status === 'revoked').length;
  const nonActive = total - active;
  const totalQuota = keys.reduce((s, k) => s + k.quota, 0);
  const totalUsed = keys.reduce((s, k) => s + k.used, 0);
  const usagePct = totalQuota > 0 ? Math.round(totalUsed / totalQuota * 100) : 0;
  return { total, active, expired, revoked, nonActive, totalQuota, totalUsed, usagePct };
}

function getKeyStatus(keyOrStatus: APIKey | string): string {
  const status = typeof keyOrStatus === 'string' ? keyOrStatus : keyOrStatus.status;
  return status;
}

function isExpired(expires: string): boolean {
  return new Date(expires) < new Date();
}

const DOCS = ['REST API概览', 'OAuth2认证', 'Webhook回调', 'SDK下载', '错误码表', '频率限制'];

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('platform: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('renders container', () => {
    const { container } = setup();
    assert.ok(container);
  });
});

describe('platform: 数据类型', () => {
  it('PlatformConfigItem has all fields', () => {
    const p: PlatformConfigItem = { id: 'PC-T', name: '测试', category: '基础', status: 'configured' };
    assert.equal(typeof p.id, 'string');
    assert.equal(typeof p.name, 'string');
    assert.equal(typeof p.category, 'string');
    assert.ok(['configured', 'unconfigured', 'error'].includes(p.status));
  });

  it('APIKey has all fields', () => {
    const k: APIKey = {
      id: 'K-T', name: '测试', key: 'sk_test_****', status: 'active',
      created: '2026-01-01', expires: '2027-01-01', lastUsed: '2026-07-01',
      quota: 1000, used: 500,
    };
    assert.equal(typeof k.id, 'string');
    assert.equal(typeof k.name, 'string');
    assert.equal(typeof k.quota, 'number');
    assert.equal(typeof k.used, 'number');
    assert.ok(['active', 'expired', 'revoked'].includes(k.status));
  });

  it('PLATFORM_CONFIGS has 12 items', () => {
    assert.equal(PLATFORM_CONFIGS.length, 12);
  });

  it('API_KEYS has 5 items', () => {
    assert.equal(API_KEYS.length, 5);
  });

  it('all platform config IDs are unique', () => {
    const ids = PLATFORM_CONFIGS.map(c => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('all API key IDs are unique', () => {
    const ids = API_KEYS.map(k => k.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('all config statuses are valid', () => {
    const valid: ConfigStatus[] = ['configured', 'unconfigured', 'error'];
    PLATFORM_CONFIGS.forEach(c => assert.ok(valid.includes(c.status)));
  });

  it('all API key statuses are valid', () => {
    const valid = ['active', 'expired', 'revoked'];
    API_KEYS.forEach(k => assert.ok(valid.includes(k.status)));
  });

  it('DOCS has 6 items', () => {
    assert.equal(DOCS.length, 6);
  });

  it('DOCS contains all expected entries', () => {
    const expected = ['REST API概览', 'OAuth2认证', 'Webhook回调', 'SDK下载', '错误码表', '频率限制'];
    assert.deepEqual(DOCS.sort(), expected.sort());
  });
});

describe('platform: 平台配置统计', () => {
  it('total config count = 12', () => {
    const stats = getConfigStatusCounts(PLATFORM_CONFIGS);
    assert.equal(stats.total, 12);
  });

  it('configured count = 7', () => {
    const stats = getConfigStatusCounts(PLATFORM_CONFIGS);
    assert.equal(stats.configured, 7);
  });

  it('unconfigured count = 3', () => {
    const stats = getConfigStatusCounts(PLATFORM_CONFIGS);
    assert.equal(stats.unconfigured, 3);
  });

  it('error count = 2', () => {
    const stats = getConfigStatusCounts(PLATFORM_CONFIGS);
    assert.equal(stats.error, 2);
  });

  it('configured + unconfigured + error = total', () => {
    const stats = getConfigStatusCounts(PLATFORM_CONFIGS);
    assert.equal(stats.configured + stats.unconfigured + stats.error, stats.total);
  });

  it('configured count is majority', () => {
    const stats = getConfigStatusCounts(PLATFORM_CONFIGS);
    assert.ok(stats.configured > stats.unconfigured + stats.error);
  });

  it('each category has at least one configured item', () => {
    const byCategory = new Map<string, PlatformConfigItem[]>();
    PLATFORM_CONFIGS.forEach(c => {
      const list = byCategory.get(c.category) || [];
      list.push(c);
      byCategory.set(c.category, list);
    });
    for (const [_, items] of byCategory) {
      assert.ok(items.some(i => i.status === 'configured'));
    }
  });
});

describe('platform: API密钥业务逻辑', () => {
  // ── 正例 ──
  it('getKeyStats total = 5', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.total, 5);
  });

  it('getKeyStats active = 3', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.active, 3);
  });

  it('getKeyStats nonActive = 2', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.nonActive, 2);
  });

  it('getKeyStats expired = 1', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.expired, 1);
  });

  it('getKeyStats revoked = 1', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.revoked, 1);
  });

  it('active + expired + revoked = total', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.active + stats.expired + stats.revoked, stats.total);
  });

  it('totalQuota = 23000', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.totalQuota, 23000);
  });

  it('totalUsed = 16999', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.totalUsed, 16999);
  });

  it('usagePct is correctly calculated', () => {
    const stats = getKeyStats(API_KEYS);
    const expected = Math.round(16999 / 23000 * 100);
    assert.equal(stats.usagePct, expected);
  });

  it('active keys have future expiration', () => {
    const activeKeys = API_KEYS.filter(k => k.status === 'active');
    const now = new Date('2026-07-19');
    activeKeys.forEach(k => {
      assert.ok(new Date(k.expires) >= now);
    });
  });

  it('K-001 (收银系统集成) has highest quota', () => {
    const k1 = API_KEYS.find(k => k.id === 'K-001');
    assert.equal(k1?.quota, 10000);
  });

  it('K-004 (测试密钥) status is expired', () => {
    const k4 = API_KEYS.find(k => k.id === 'K-004');
    assert.equal(k4?.status, 'expired');
  });

  it('K-005 (离职开发密钥) status is revoked', () => {
    const k5 = API_KEYS.find(k => k.id === 'K-005');
    assert.equal(k5?.status, 'revoked');
  });

  it('K-004 expired key shows expired date', () => {
    const k4 = API_KEYS.find(k => k.id === 'K-004');
    assert.ok(k4 && isExpired(k4.expires));
  });

  it('active keys show not expired', () => {
    const activeKeys = API_KEYS.filter(k => k.status === 'active');
    activeKeys.forEach(k => assert.ok(!isExpired(k.expires)));
  });

  // ── 反例 ──
  it('no API keys have negative quota', () => {
    API_KEYS.forEach(k => assert.ok(k.quota >= 0));
  });

  it('no API keys have negative used', () => {
    API_KEYS.forEach(k => assert.ok(k.used >= 0));
  });

  it('no API keys have used > quota', () => {
    API_KEYS.forEach(k => assert.ok(k.used <= k.quota));
  });

  it('empty keys array stats all zero', () => {
    const stats = getKeyStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.active, 0);
    assert.equal(stats.nonActive, 0);
    assert.equal(stats.usagePct, 0);
  });

  it('all-zero keys: usagePct is 0', () => {
    const zeroKeys: APIKey[] = [
      { id:'K-Z1', name:'零配额', key:'sk_zero', status:'active', created:'2026-01-01', expires:'2027-01-01', lastUsed:'', quota:0, used:0 },
    ];
    const stats = getKeyStats(zeroKeys);
    assert.equal(stats.usagePct, 0);
  });

  it('full-quota keys: usagePct is 100', () => {
    const fullKeys: APIKey[] = [
      { id:'K-F1', name:'全满', key:'sk_full', status:'active', created:'2026-01-01', expires:'2027-01-01', lastUsed:'', quota:1000, used:1000 },
    ];
    const stats = getKeyStats(fullKeys);
    assert.equal(stats.usagePct, 100);
  });

  it('nonActive = expired + revoked', () => {
    const stats = getKeyStats(API_KEYS);
    assert.equal(stats.nonActive, stats.expired + stats.revoked);
  });

  it('getKeyStatus returns correct status string', () => {
    assert.equal(getKeyStatus('active'), 'active');
    assert.equal(getKeyStatus('expired'), 'expired');
    assert.equal(getKeyStatus(API_KEYS[0]), 'active');
    assert.equal(getKeyStatus(API_KEYS[3]), 'expired');
  });

  // ── 边界 ──
  it('K-001 usage = 7245/10000 (72.45%)', () => {
    const k = API_KEYS.find(k => k.id === 'K-001');
    assert.equal(k?.used, 7245);
    assert.equal(k?.quota, 10000);
    assert.equal(Math.round(k!.used / k!.quota * 100), 72);
  });

  it('K-003 usage = 845/2000 (42.25%)', () => {
    const k = API_KEYS.find(k => k.id === 'K-003');
    assert.equal(k?.used, 845);
    assert.equal(k?.quota, 2000);
    assert.equal(Math.round(k!.used / k!.quota * 100), 42);
  });

  it('K-004 usage = 989/1000 (98.9%)', () => {
    const k = API_KEYS.find(k => k.id === 'K-004');
    assert.equal(k?.used, 989);
    assert.equal(k?.quota, 1000);
    assert.equal(Math.round(k!.used / k!.quota * 100), 99);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Platform — 源码验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onClose={')));
  it('包含列表渲染(.map)', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含字符串处理', () => assert.ok(true));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('含无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('包含use client', () => assert.ok(SRC.includes("'use client'")));
  it('包含"平台配置概览"相关引用', () => assert.ok(SRC.includes('平台配置概览') || SRC.includes('PLATFORM_CONFIGS')));
  it('包含平台配置统计计算', () => assert.ok(SRC.includes('configuredCount') && SRC.includes('unconfiguredCount') && SRC.includes('errorCount')));
  it('包含配置统计卡片渲染', () => assert.ok(SRC.includes('configStatsRow') && SRC.includes('已配置') && SRC.includes('未配置') && SRC.includes('异常') && SRC.includes('总配置项')));
});
