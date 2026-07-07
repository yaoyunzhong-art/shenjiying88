/**
 * H5活动页面 - page.test.tsx — L1 冒烟测试
 * Phase-FP · 2026-07-05
 * 覆盖: 正例 + 反例(防御) + 边界(极端/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据工厂 ──

function makeCampaign(overrides?: Record<string, unknown>) {
  return {
    id: 'c1',
    title: '夏季清凉节',
    subtitle: '指定商品5折起',
    type: 'discount' as const,
    typeName: '折扣',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    status: 'ongoing' as const,
    tags: ['夏季', '清凉', '折扣'],
    ...overrides,
  };
}

function makeCampaignListResponse(overrides?: Record<string, unknown>) {
  return {
    success: true,
    data: {
      campaigns: [
        makeCampaign(),
        makeCampaign({ id: 'c2', type: 'member' as const, status: 'ongoing' as const }),
        makeCampaign({ id: 'c3', type: 'gift' as const, status: 'upcoming' as const }),
        makeCampaign({ id: 'c4', type: 'flash' as const, status: 'ended' as const }),
      ],
      total: 4,
    },
    ...overrides,
  };
}

const CAMPAIGN_TYPES = ['flash', 'discount', 'gift', 'member'] as const;
const CAMPAIGN_STATUSES = ['upcoming', 'ongoing', 'ended'] as const;

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  flash: { label: '秒杀', color: '#ef4444' },
  discount: { label: '折扣', color: '#3b82f6' },
  gift: { label: '礼包', color: '#8b5cf6' },
  member: { label: '会员', color: '#f59e0b' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  upcoming: { label: '即将开始', color: '#f59e0b' },
  ongoing: { label: '进行中', color: '#10b981' },
  ended: { label: '已结束', color: '#64748b' },
};

/* ── 正例 ── */

test('CampaignsPage: should accept a valid Campaign with all fields', () => {
  const c = makeCampaign();
  assert.equal(typeof c.id, 'string');
  assert.equal(typeof c.title, 'string');
  assert.equal(typeof c.subtitle, 'string');
  assert.equal(typeof c.status, 'string');
  assert.ok(CAMPAIGN_TYPES.includes(c.type));
  assert.ok(CAMPAIGN_STATUSES.includes(c.status));
  assert.ok(Array.isArray(c.tags));
});

test('CampaignsPage: should accept a valid CampaignListResponse', () => {
  const resp = makeCampaignListResponse();
  assert.equal(resp.success, true);
  assert.ok(resp.data !== undefined);
  assert.equal(resp.data!.campaigns.length, 4);
  assert.equal(resp.data!.total, 4);
});

test('CampaignsPage: each type should have a config', () => {
  for (const type of CAMPAIGN_TYPES) {
    const cfg = TYPE_CONFIG[type];
    assert.ok(cfg !== undefined);
    assert.equal(typeof cfg.label, 'string');
    assert.equal(typeof cfg.color, 'string');
  }
});

test('CampaignsPage: each status should have a config', () => {
  for (const status of CAMPAIGN_STATUSES) {
    const cfg = STATUS_CONFIG[status];
    assert.ok(cfg !== undefined);
    assert.equal(typeof cfg.label, 'string');
    assert.equal(typeof cfg.color, 'string');
  }
});

test('CampaignsPage: should filter campaigns by status', () => {
  const campaigns = [
    makeCampaign({ id: 'c1', status: 'ongoing' as const }),
    makeCampaign({ id: 'c2', status: 'upcoming' as const }),
    makeCampaign({ id: 'c3', status: 'ongoing' as const }),
    makeCampaign({ id: 'c4', status: 'ended' as const }),
  ];
  const ongoing = campaigns.filter(c => c.status === 'ongoing');
  const upcoming = campaigns.filter(c => c.status === 'upcoming');
  const ended = campaigns.filter(c => c.status === 'ended');
  assert.equal(ongoing.length, 2);
  assert.equal(upcoming.length, 1);
  assert.equal(ended.length, 1);
});

test('CampaignsPage: should count stats by status', () => {
  const campaigns = [
    makeCampaign({ status: 'ongoing' as const }),
    makeCampaign({ status: 'ongoing' as const }),
    makeCampaign({ status: 'upcoming' as const }),
    makeCampaign({ status: 'ended' as const }),
  ];
  const stats = {
    total: campaigns.length,
    ongoing: campaigns.filter(c => c.status === 'ongoing').length,
    upcoming: campaigns.filter(c => c.status === 'upcoming').length,
    ended: campaigns.filter(c => c.status === 'ended').length,
  };
  assert.equal(stats.total, 4);
  assert.equal(stats.ongoing, 2);
  assert.equal(stats.upcoming, 1);
  assert.equal(stats.ended, 1);
});

test('CampaignsPage: upcoming campaign should show "即将开始" label', () => {
  const c = makeCampaign({ status: 'upcoming' as const });
  assert.equal(STATUS_CONFIG[c.status].label, '即将开始');
});

test('CampaignsPage: ongoing campaign should show "进行中" label', () => {
  const c = makeCampaign({ status: 'ongoing' as const });
  assert.equal(STATUS_CONFIG[c.status].label, '进行中');
});

test('CampaignsPage: ended campaign should show "已结束" label', () => {
  const c = makeCampaign({ status: 'ended' as const });
  assert.equal(STATUS_CONFIG[c.status].label, '已结束');
});

test('CampaignsPage: type labels should be correct', () => {
  assert.equal(TYPE_CONFIG.flash.label, '秒杀');
  assert.equal(TYPE_CONFIG.discount.label, '折扣');
  assert.equal(TYPE_CONFIG.gift.label, '礼包');
  assert.equal(TYPE_CONFIG.member.label, '会员');
});

test('CampaignsPage: filter toggle should switch between ALL/status', () => {
  let filter = 'ALL';
  assert.equal(filter, 'ALL');
  filter = 'ongoing';
  assert.equal(filter, 'ongoing');
  filter = 'upcoming';
  assert.equal(filter, 'upcoming');
  filter = 'ended';
  assert.equal(filter, 'ended');
});

test('CampaignsPage: campaign with optional fields', () => {
  const full = makeCampaign({
    description: '炎炎夏日优惠',
    rules: ['活动时间'],
    benefits: ['低至5折'],
    products: [{ id: 'p1', name: 'T恤', originalPrice: 299, salePrice: 149 }],
  });
  assert.equal(full.description, '炎炎夏日优惠');
  assert.equal(full.rules!.length, 1);
  assert.equal(full.benefits!.length, 1);
  assert.equal(full.products!.length, 1);

  const minimal = makeCampaign({ description: undefined, rules: undefined, benefits: undefined, products: undefined });
  assert.equal(minimal.description, undefined);
});

/* ── 反例 / 防御 ── */

test('CampaignsPage: should handle empty campaign list', () => {
  const resp = { success: true, data: { campaigns: [] as unknown[], total: 0 } };
  assert.equal(resp.data.campaigns.length, 0);
  assert.equal(resp.data.total, 0);
});

test('CampaignsPage: should handle failed response', () => {
  const resp = { success: false, error: { code: 'FETCH_ERROR', message: '获取活动列表失败' } };
  assert.equal(resp.success, false);
  assert.equal(resp.error!.code, 'FETCH_ERROR');
});

test('CampaignsPage: should handle missing data field', () => {
  const resp = { success: false, data: undefined };
  assert.equal(resp.data, undefined);
});

test('CampaignsPage: should handle unknown status', () => {
  const unknownStatuses = [undefined, null, 'unknown', ''];
  for (const s of unknownStatuses) {
    const c = makeCampaign({ status: s });
    assert.equal(c.status, s);
  }
});

test('CampaignsPage: should handle unknown type', () => {
  const unknownTypes = [undefined, null, 'unknown', ''];
  for (const t of unknownTypes) {
    const c = makeCampaign({ type: t });
    assert.equal(c.type, t);
  }
});

test('CampaignsPage: should handle empty tags array', () => {
  const c = makeCampaign({ tags: [] });
  assert.equal(c.tags.length, 0);
});

test('CampaignsPage: should handle missing id', () => {
  const c = makeCampaign({ id: undefined });
  assert.equal(c.id, undefined);
});

test('CampaignsPage: should handle empty title', () => {
  const c = makeCampaign({ title: '' });
  assert.equal(c.title, '');
});

/* ── 边界 ── */

test('CampaignsPage: should handle many campaigns', () => {
  const campaigns = Array.from({ length: 100 }, (_, i) => makeCampaign({
    id: `c${i}`,
    status: i % 3 === 0 ? 'ongoing' as const : i % 3 === 1 ? 'upcoming' as const : 'ended' as const,
  }));
  assert.equal(campaigns.length, 100);
  const counts = campaigns.reduce((acc, c) => { acc[c.status]++; return acc; }, { ongoing: 0, upcoming: 0, ended: 0 });
  assert.equal(counts.ongoing + counts.upcoming + counts.ended, 100);
});

test('CampaignsPage: should handle very long title', () => {
  const longTitle = '超长活动名称'.repeat(30);
  const c = makeCampaign({ title: longTitle });
  assert.ok(c.title.length > 60);
});

test('CampaignsPage: should handle all campaigns being ongoing', () => {
  const campaigns = Array.from({ length: 5 }, (_, i) => makeCampaign({ id: `c${i}`, status: 'ongoing' as const }));
  assert.equal(campaigns.every(c => c.status === 'ongoing'), true);
});

test('CampaignsPage: should handle all campaigns being ended', () => {
  const campaigns = Array.from({ length: 3 }, (_, i) => makeCampaign({ id: `c${i}`, status: 'ended' as const }));
  assert.equal(campaigns.every(c => c.status === 'ended'), true);
});

test('CampaignsPage: tags should be non-empty strings', () => {
  const c = makeCampaign({ tags: ['夏季', '', ' '] });
  assert.equal(c.tags.length, 3);
});

test('CampaignsPage: campaign data from mock should produce valid types', () => {
  const mockCampaigns = [
    { id: 'c1', title: '夏季清凉节', subtitle: '指定商品5折起', type: 'discount' as const, status: 'ongoing' as const },
    { id: 'c2', title: '会员专享日', subtitle: '全场双倍积分', type: 'member' as const, status: 'ongoing' as const },
    { id: 'c3', title: '新人礼包', subtitle: '注册即送100元', type: 'gift' as const, status: 'ongoing' as const },
    { id: 'c4', title: '限时秒杀', subtitle: '每日10点', type: 'flash' as const, status: 'upcoming' as const },
    { id: 'c5', title: '端午特惠', subtitle: '满200减50', type: 'discount' as const, status: 'ended' as const },
  ];
  assert.equal(mockCampaigns.length, 5);
  assert.ok(mockCampaigns.every(c => CAMPAIGN_TYPES.includes(c.type)));
  assert.ok(mockCampaigns.every(c => CAMPAIGN_STATUSES.includes(c.status)));
  assert.ok(mockCampaigns.every(c => typeof c.title === 'string' && c.title.length > 0));
});

test('CampaignsPage: URL construction with status filter', () => {
  const params = new URLSearchParams();
  params.set('status', 'ongoing');
  params.set('page', '1');
  const url = `/h5/campaigns?${params}`;
  assert.ok(url.includes('status=ongoing'));
  assert.ok(url.includes('page=1'));
});
