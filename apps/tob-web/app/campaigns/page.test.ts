/**
 * campaigns/page.test.ts — 营销活动列表页单元测试
 *
 * 测试：
 * 1. Mock 数据完整性与正确性
 * 2. 工具函数 (formatCurrency, computeCampaignStats)
 * 3. 页面使用的过滤逻辑镜像
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_CAMPAIGNS,
  CAMPAIGN_STATUS_MAP,
  CAMPAIGN_TYPE_MAP,
  CAMPAIGN_CHANNEL_MAP,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  CAMPAIGN_CHANNELS,
  CAMPAIGN_SEARCH_FIELDS,
  computeCampaignStats,
  formatCurrency,
  type CampaignItem,
  type CampaignStatus,
  type CampaignType,
  type CampaignChannel,
} from '../campaigns-data';

// ── 测试：Mock 数据 ──

describe('tob-web /campaigns — mock data', () => {
  it('MOCK_CAMPAIGNS should contain 15 items', () => {
    assert.equal(MOCK_CAMPAIGNS.length, 15);
  });

  it('each campaign should have required fields', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(c.id, `campaign ${c.name} missing id`);
      assert.ok(c.code, `campaign ${c.name} missing code`);
      assert.ok(c.name, `campaign ${c.name} missing name`);
      assert.ok(typeof c.budget === 'number', `campaign ${c.name} budget not number`);
      assert.ok(typeof c.spent === 'number', `campaign ${c.name} spent not number`);
      assert.ok(typeof c.roi === 'number', `campaign ${c.name} roi not number`);
      assert.ok(CAMPAIGN_STATUSES.includes(c.status), `campaign ${c.name} invalid status ${c.status}`);
      assert.ok(CAMPAIGN_TYPES.includes(c.type), `campaign ${c.name} invalid type ${c.type}`);
      assert.ok(CAMPAIGN_CHANNELS.includes(c.channel), `campaign ${c.name} invalid channel ${c.channel}`);
    }
  });

  it('each campaign should have unique ids', () => {
    const ids = MOCK_CAMPAIGNS.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('each campaign should have unique codes', () => {
    const codes = MOCK_CAMPAIGNS.map((c) => c.code);
    assert.equal(new Set(codes).size, codes.length);
  });
});

// ── 测试：静态映射表 ──

describe('tob-web /campaigns — mapping tables', () => {
  it('CAMPAIGN_STATUS_MAP should cover all statuses', () => {
    for (const status of CAMPAIGN_STATUSES) {
      const entry = CAMPAIGN_STATUS_MAP[status];
      assert.ok(entry, `missing status map for ${status}`);
      assert.ok(entry.label.length > 0);
      assert.ok(['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant));
    }
  });

  it('CAMPAIGN_TYPE_MAP should cover all types', () => {
    for (const t of CAMPAIGN_TYPES) {
      const entry = CAMPAIGN_TYPE_MAP[t];
      assert.ok(entry, `missing type map for ${t}`);
      assert.ok(entry.label.length > 0);
      assert.ok(entry.color.startsWith('#'));
    }
  });

  it('CAMPAIGN_CHANNEL_MAP should cover all channels', () => {
    for (const ch of CAMPAIGN_CHANNELS) {
      const entry = CAMPAIGN_CHANNEL_MAP[ch];
      assert.ok(entry, `missing channel map for ${ch}`);
      assert.ok(entry.label.length > 0);
    }
  });
});

// ── 测试：formatCurrency ──

describe('tob-web /campaigns — formatCurrency', () => {
  it('should format values >= 1_000_000 in 万', () => {
    assert.equal(formatCurrency(1_000_000), '¥100.0万');
  });

  it('should format values >= 1_000 in K', () => {
    assert.equal(formatCurrency(350_000), '¥350.0K');
    assert.equal(formatCurrency(1_000), '¥1.0K');
  });

  it('should format small values directly', () => {
    assert.equal(formatCurrency(500), '¥500');
    assert.equal(formatCurrency(0), '¥0');
  });

  it('should format 999 correctly as direct value', () => {
    assert.equal(formatCurrency(999), '¥999');
  });
});

// ── 测试：computeCampaignStats ──

describe('tob-web /campaigns — computeCampaignStats', () => {
  it('should return correct total count', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    assert.equal(stats.total, 15);
  });

  it('should count active campaigns correctly', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    // active campaigns in mock data: cmp-001, cmp-003, cmp-004, cmp-010, cmp-011, cmp-015 = 6
    assert.equal(stats.active, 6);
  });

  it('totalBudget should be sum of all budgets', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    const expected = MOCK_CAMPAIGNS.reduce((s, c) => s + c.budget, 0);
    assert.equal(stats.totalBudget, expected);
  });

  it('totalSpent should be sum of all spent', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    const expected = MOCK_CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
    assert.equal(stats.totalSpent, expected);
  });

  it('avgRoi should exclude items with roi=0', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    const withRoi = MOCK_CAMPAIGNS.filter((c) => c.roi > 0);
    const expectedAvg = withRoi.reduce((s, c) => s + c.roi, 0) / withRoi.length;
    assert.equal(stats.avgRoi, expectedAvg);
  });

  it('should return 0 avgRoi when no items have positive roi', () => {
    const items: CampaignItem[] = [
      { ...MOCK_CAMPAIGNS[0]!, roi: 0, id: 'zero-roi' },
    ];
    const stats = computeCampaignStats(items);
    assert.equal(stats.avgRoi, 0);
  });
});

// ── 测试：搜索字段定义 ──

describe('tob-web /campaigns — search fields', () => {
  it('CAMPAIGN_SEARCH_FIELDS should contain valid keys', () => {
    const validKeys: (keyof CampaignItem)[] = ['code', 'name', 'type', 'channel', 'createdBy'];
    assert.deepEqual(CAMPAIGN_SEARCH_FIELDS.sort(), validKeys.sort());
  });
});

// ── 测试：页面过滤逻辑镜像 ──

describe('tob-web /campaigns — page filter logic mirror', () => {
  // 与 page.tsx 保持一致的过滤逻辑：status → type → channel

  it('status filter should work correctly', () => {
    const status: CampaignStatus = 'active';
    const filtered = MOCK_CAMPAIGNS.filter((c) => c.status === status);
    assert.equal(filtered.length, 6);
    assert.ok(filtered.every((c) => c.status === 'active'));
  });

  it('type filter on status-filtered results should work', () => {
    const statusFiltered = MOCK_CAMPAIGNS.filter((c) => c.status === 'active');
    const type: CampaignType = 'promotion';
    const filtered = statusFiltered.filter((c) => c.type === type);
    // active + promotion: cmp-001 = 1
    assert.equal(filtered.length, 1);
  });

  it('channel filter on nested filters should work', () => {
    const statusFiltered = MOCK_CAMPAIGNS.filter((c) => c.status === 'active');
    const typeFiltered = statusFiltered.filter((c) => c.type !== 'promotion');
    const channel: CampaignChannel = 'online';
    const filtered = typeFiltered.filter((c) => c.channel === channel);
    // active + not promotion + online: cmp-003 (retention), cmp-010 (retention) = 2
    assert.equal(filtered.length, 2);
  });
});
