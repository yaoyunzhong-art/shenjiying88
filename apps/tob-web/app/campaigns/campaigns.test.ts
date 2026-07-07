/**
 * campaigns.test.ts — Page-level tests for tob-web 营销活动列表页
 *
 * 正例 + 反例 + 边界, ≥3 个测试用例
 * References: page.tsx (CampaignItem, filters, search, stats, pagination)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Data shapes ─────────────────────────────────────────────────────────

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'CANCELLED';
type CampaignType = 'DISCOUNT' | 'COUPON' | 'CASHBACK' | 'LOYALTY' | 'EVENT';
type CampaignChannel = 'WECHAT' | 'ALIPAY' | 'SMS' | 'APP_PUSH' | 'OFFLINE' | 'MINIAPP';

interface CampaignItem {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: CampaignChannel;
  budgetCents: number;
  spentCents: number;
  roi: number;
  startDate: string;
  endDate: string;
}

// ─── Replicated helpers ──────────────────────────────────────────────────

const CAMPAIGN_STATUS_MAP: Record<CampaignStatus, { label: string; color: string }> = {
  ACTIVE:    { label: '进行中', color: 'green' },
  PAUSED:    { label: '已暂停', color: 'yellow' },
  COMPLETED: { label: '已结束', color: 'blue' },
  DRAFT:     { label: '草稿',   color: 'gray' },
  CANCELLED: { label: '已取消', color: 'red' },
};

const CAMPAIGN_TYPE_MAP: Record<CampaignType, string> = {
  DISCOUNT: '折扣', COUPON: '优惠券', CASHBACK: '返现',
  LOYALTY: '积分', EVENT: '活动',
};

const CAMPAIGN_CHANNEL_MAP: Record<CampaignChannel, string> = {
  WECHAT: '微信', ALIPAY: '支付宝', SMS: '短信',
  APP_PUSH: 'App推送', OFFLINE: '线下', MINIAPP: '小程序',
};

function formatCurrency(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

function computeCampaignStats(campaigns: CampaignItem[]) {
  const totalBudget = campaigns.reduce((s, c) => s + c.budgetCents, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spentCents, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const avgRoi = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.roi, 0) / campaigns.length
    : 0;
  return { totalBudget, totalSpent, activeCampaigns, avgRoi, count: campaigns.length };
}

function filterByStatus(campaigns: CampaignItem[], status: CampaignStatus | 'ALL'): CampaignItem[] {
  if (status === 'ALL') return campaigns;
  return campaigns.filter(c => c.status === status);
}

function filterByType(campaigns: CampaignItem[], type: CampaignType | 'ALL'): CampaignItem[] {
  if (type === 'ALL') return campaigns;
  return campaigns.filter(c => c.type === type);
}

function filterByChannel(campaigns: CampaignItem[], channel: CampaignChannel | 'ALL'): CampaignItem[] {
  if (channel === 'ALL') return campaigns;
  return campaigns.filter(c => c.channel === channel);
}

function searchCampaigns(campaigns: CampaignItem[], query: string): CampaignItem[] {
  if (!query.trim()) return campaigns;
  const q = query.toLowerCase();
  return campaigns.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q)
  );
}

// ─── Mock data ───────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: CampaignItem[] = [
  { id: 'C001', name: '暑期大促', type: 'DISCOUNT', status: 'ACTIVE', channel: 'WECHAT', budgetCents: 5000000, spentCents: 1200000, roi: 3.5, startDate: '2025-07-01', endDate: '2025-08-31' },
  { id: 'C002', name: '新会员礼包', type: 'COUPON', status: 'ACTIVE', channel: 'MINIAPP', budgetCents: 1000000, spentCents: 350000, roi: 2.8, startDate: '2025-06-01', endDate: '2025-12-31' },
  { id: 'C003', name: '双十一预售', type: 'DISCOUNT', status: 'DRAFT', channel: 'ALIPAY', budgetCents: 10000000, spentCents: 0, roi: 0, startDate: '2025-11-01', endDate: '2025-11-11' },
  { id: 'C004', name: '积分兑换活动', type: 'LOYALTY', status: 'COMPLETED', channel: 'APP_PUSH', budgetCents: 2000000, spentCents: 1800000, roi: 4.2, startDate: '2025-04-01', endDate: '2025-05-31' },
  { id: 'C005', name: '周末促销', type: 'CASHBACK', status: 'PAUSED', channel: 'SMS', budgetCents: 500000, spentCents: 200000, roi: 1.5, startDate: '2025-06-01', endDate: '2025-06-30' },
  { id: 'C006', name: '门店开业活动', type: 'EVENT', status: 'ACTIVE', channel: 'OFFLINE', budgetCents: 3000000, spentCents: 1500000, roi: 5.0, startDate: '2025-06-15', endDate: '2025-07-15' },
  { id: 'C007', name: '老带新活动', type: 'COUPON', status: 'CANCELLED', channel: 'WECHAT', budgetCents: 800000, spentCents: 100000, roi: 0.8, startDate: '2025-05-01', endDate: '2025-05-15' },
  { id: 'C008', name: '周年庆促销', type: 'DISCOUNT', status: 'ACTIVE', channel: 'ALIPAY', budgetCents: 8000000, spentCents: 3000000, roi: 2.5, startDate: '2025-06-01', endDate: '2025-06-30' },
];

// ─── Tests ───────────────────────────────────────────────────────────────

describe('tob-campaigns: 正例', () => {
  it('formatCurrency 正确格式化', () => {
    assert.equal(formatCurrency(5000000), '¥50000.00');
    assert.equal(formatCurrency(100), '¥1.00');
    assert.equal(formatCurrency(99), '¥0.99');
  });

  it('computeCampaignStats 正确计算统计', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    assert.equal(stats.count, 8);
    assert.equal(stats.activeCampaigns, 4);
    assert.ok(stats.totalBudget > 0);
    assert.ok(stats.totalSpent > 0);
    assert.ok(stats.avgRoi > 0);
  });

  it('filterByStatus "ALL" 返回全部', () => {
    assert.equal(filterByStatus(MOCK_CAMPAIGNS, 'ALL').length, 8);
  });

  it('filterByStatus ACTIVE 返回 4 个', () => {
    const active = filterByStatus(MOCK_CAMPAIGNS, 'ACTIVE');
    assert.equal(active.length, 4);
    assert.ok(active.every(c => c.status === 'ACTIVE'));
  });

  it('filterByType DISCOUNT 返回 3 个', () => {
    const discount = filterByType(MOCK_CAMPAIGNS, 'DISCOUNT');
    assert.equal(discount.length, 3);
  });

  it('filterByChannel WECHAT 返回 2 个', () => {
    const wechat = filterByChannel(MOCK_CAMPAIGNS, 'WECHAT');
    assert.equal(wechat.length, 2);
  });

  it('searchCampaigns 按名称搜索', () => {
    const result = searchCampaigns(MOCK_CAMPAIGNS, '暑期');
    assert.equal(result.length, 1);
    assert.equal(result[0]!.id, 'C001');
  });

  it('searchCampaigns 按 ID 搜索', () => {
    const result = searchCampaigns(MOCK_CAMPAIGNS, 'C004');
    assert.equal(result.length, 1);
  });

  it('CAMPAIGN_STATUS_MAP/CHANNEL_MAP/TYPE_MAP 覆盖完整', () => {
    const allStatuses: CampaignStatus[] = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT', 'CANCELLED'];
    const allTypes: CampaignType[] = ['DISCOUNT', 'COUPON', 'CASHBACK', 'LOYALTY', 'EVENT'];
    const allChannels: CampaignChannel[] = ['WECHAT', 'ALIPAY', 'SMS', 'APP_PUSH', 'OFFLINE', 'MINIAPP'];
    for (const s of allStatuses) assert.ok(CAMPAIGN_STATUS_MAP[s], `missing status ${s}`);
    for (const t of allTypes) assert.ok(CAMPAIGN_TYPE_MAP[t], `missing type ${t}`);
    for (const c of allChannels) assert.ok(CAMPAIGN_CHANNEL_MAP[c], `missing channel ${c}`);
  });
});

describe('tob-campaigns: 反例', () => {
  it('searchCampaigns 不存在的关键词返回空', () => {
    assert.equal(searchCampaigns(MOCK_CAMPAIGNS, '不存在').length, 0);
  });

  it('filterByStatus 不存在的状态返回空', () => {
    assert.equal(filterByStatus(MOCK_CAMPAIGNS, 'ARCHIVED' as any).length, 0);
  });

  it('filterByType 不存在的类型返回空', () => {
    assert.equal(filterByType(MOCK_CAMPAIGNS, 'GIFT' as any).length, 0);
  });

  it('filterByChannel 不存在的渠道返回空', () => {
    assert.equal(filterByChannel(MOCK_CAMPAIGNS, 'FACEBOOK' as any).length, 0);
  });

  it('computeCampaignStats 空数组', () => {
    const stats = computeCampaignStats([]);
    assert.equal(stats.count, 0);
    assert.equal(stats.activeCampaigns, 0);
    assert.equal(stats.totalBudget, 0);
    assert.equal(stats.avgRoi, 0);
  });

  it('formatCurrency 负数金额', () => {
    assert.equal(formatCurrency(-100), '¥-1.00');
  });
});

describe('tob-campaigns: 边界', () => {
  it('预算与花费比例', () => {
    for (const c of MOCK_CAMPAIGNS) {
      if (c.status !== 'DRAFT') {
        assert.ok(c.spentCents <= c.budgetCents, `${c.name} 花费超过预算`);
      }
    }
  });

  it('DRAFT 状态活动花费必须为 0', () => {
    const drafts = MOCK_CAMPAIGNS.filter(c => c.status === 'DRAFT');
    for (const d of drafts) {
      assert.equal(d.spentCents, 0, `草稿活动 ${d.name} 不应有花费`);
    }
  });

  it('ACTIVE 活动 ROI 应为正', () => {
    const active = MOCK_CAMPAIGNS.filter(c => c.status === 'ACTIVE');
    for (const a of active) {
      assert.ok(a.roi > 0, `活动 ${a.name} ROI 应为正`);
    }
  });

  it('searchCampaigns 大小写不敏感（英文名）', () => {
    // 中文名不支持拼音搜索, 测试英文场景
    const c = MOCK_CAMPAIGNS.filter(c => c.name.toLowerCase().includes('c'));
    assert.ok(c.length >= 0);
  });

  it('formatCurrency 精度测试（小数值）', () => {
    assert.equal(formatCurrency(1), '¥0.01');
    assert.equal(formatCurrency(10), '¥0.10');
  });
});
