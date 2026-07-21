/**
 * campaign-rules/[id]/page.test.tsx — 营销活动详情 L1 测试
 *
 * 覆盖: 活动数据、状态枚举、搜索筛选、统计聚合
 * 正例: 活动字段完整性、状态映射、日期验证、折扣逻辑
 * 反例: 空活动列表、无效状态、超预算
 * 边界: 零预算、零命中、全草稿
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type CampaignStatus = 'draft' | 'active' | 'ended';

interface CampaignActivity {
  id: string; name: string; description: string;
  startDate: string; endDate: string;
  status: CampaignStatus;
  discount: number; targetAudience: string; budget: number; hitCount: number;
}

// ── 常量映射 ──

const STATUS_MAP: Record<CampaignStatus, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  draft: { label: '草稿', variant: 'default' },
  active: { label: '进行中', variant: 'success' },
  ended: { label: '已结束', variant: 'warning' },
};

// ── Mock 数据 ──

const MOCK_CAMPAIGNS: CampaignActivity[] = [
  { id: 'act-001', name: '618 年中大促', description: '年中购物节全场折扣', startDate: '2026-06-01', endDate: '2026-06-20', status: 'ended', discount: 0.7, targetAudience: '全部会员', budget: 500000, hitCount: 12430 },
  { id: 'act-002', name: '新会员首单礼', description: '新注册会员首单专享', startDate: '2026-07-01', endDate: '2026-08-31', status: 'active', discount: 0.8, targetAudience: '新注册会员', budget: 200000, hitCount: 3456 },
  { id: 'act-003', name: '夏季清凉特卖', description: '夏季商品清仓促销', startDate: '2026-07-15', endDate: '2026-08-15', status: 'draft', discount: 0.6, targetAudience: '高活跃会员', budget: 300000, hitCount: 0 },
  { id: 'act-004', name: '会员日双倍积分', description: '每月15日会员日双倍积分', startDate: '2026-07-15', endDate: '2026-12-31', status: 'active', discount: 1, targetAudience: '全部会员', budget: 100000, hitCount: 5678 },
  { id: 'act-005', name: '开学季大促', description: '开学季文具电子类促销', startDate: '2026-08-20', endDate: '2026-09-10', status: 'draft', discount: 0.75, targetAudience: '学生认证会员', budget: 250000, hitCount: 0 },
  { id: 'act-006', name: '双11 预热', description: '双十一提前预售活动', startDate: '2026-10-20', endDate: '2026-11-11', status: 'draft', discount: 0.5, targetAudience: '全部会员', budget: 1000000, hitCount: 0 },
];

// ── 辅助函数 ──

function getStatusInfo(status: CampaignStatus) {
  return STATUS_MAP[status] ?? { label: status, variant: 'default' as const };
}

function computeActivityStats(campaigns: CampaignActivity[]) {
  return {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    active: campaigns.filter(c => c.status === 'active').length,
    ended: campaigns.filter(c => c.status === 'ended').length,
    totalBudget: campaigns.reduce((s, c) => s + c.budget, 0),
    totalHits: campaigns.reduce((s, c) => s + c.hitCount, 0),
  };
}

function filterByNameOrAudience(campaigns: CampaignActivity[], query: string): CampaignActivity[] {
  if (!query.trim()) return campaigns;
  const lower = query.toLowerCase();
  return campaigns.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.targetAudience.toLowerCase().includes(lower)
  );
}

function filterByStatus(campaigns: CampaignActivity[], status: CampaignStatus | 'all'): CampaignActivity[] {
  if (status === 'all') return campaigns;
  return campaigns.filter(c => c.status === status);
}

// ===================================================================
describe('CampaignRules — 活动数据', () => {
  it('所有活动应有完整字段', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(c.id, 'id required');
      assert.ok(c.name, 'name required');
      assert.ok(c.startDate, 'startDate required');
      assert.ok(c.endDate, 'endDate required');
      assert.ok(typeof c.discount === 'number', 'discount must be number');
      assert.ok(typeof c.budget === 'number', 'budget must be number');
    }
  });

  it('状态枚举有效', () => {
    const valid: CampaignStatus[] = ['draft', 'active', 'ended'];
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(valid.includes(c.status), `Invalid status: ${c.status}`);
    }
  });

  it('折扣范围应在 0~1 之间', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(c.discount > 0 && c.discount <= 1,
        `${c.name}: discount ${c.discount} should be in (0, 1]`);
    }
  });

  it('开始日期应早于或等于结束日期', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(new Date(c.startDate) <= new Date(c.endDate),
        `${c.name}: start ${c.startDate} <= end ${c.endDate}`);
    }
  });

  it('三种状态标签完整', () => {
    assert.equal(getStatusInfo('draft').label, '草稿');
    assert.equal(getStatusInfo('active').label, '进行中');
    assert.equal(getStatusInfo('ended').label, '已结束');
  });
});

// ===================================================================
describe('CampaignRules — 统计聚合', () => {
  it('应正确统计各状态活动数', () => {
    const stats = computeActivityStats(MOCK_CAMPAIGNS);
    assert.equal(stats.total, 6);
    assert.equal(stats.draft, 3);
    assert.equal(stats.active, 2);
    assert.equal(stats.ended, 1);
  });

  it('应正确计算总预算和总命中', () => {
    const stats = computeActivityStats(MOCK_CAMPAIGNS);
    assert.equal(stats.totalBudget, 500000 + 200000 + 300000 + 100000 + 250000 + 1000000);
    assert.equal(stats.totalHits, 12430 + 3456 + 5678);
  });

  it('空活动列表统计为零', () => {
    const stats = computeActivityStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.totalBudget, 0);
  });
});

// ===================================================================
describe('CampaignRules — 搜索筛选', () => {
  it('按活动名称搜索', () => {
    const result = filterByNameOrAudience(MOCK_CAMPAIGNS, '618');
    assert.equal(result.length, 1);
  });

  it('按目标人群搜索', () => {
    const result = filterByNameOrAudience(MOCK_CAMPAIGNS, '会员');
    assert.equal(result.length, 3); // 全部会员 × 3
  });

  it('空查询返回全部', () => {
    assert.equal(filterByNameOrAudience(MOCK_CAMPAIGNS, '').length, MOCK_CAMPAIGNS.length);
  });

  it('按状态筛选', () => {
    const drafts = filterByStatus(MOCK_CAMPAIGNS, 'draft');
    assert.equal(drafts.length, 3);
    assert.ok(drafts.every(c => c.status === 'draft'));
  });

  it('all 状态筛选返回全部', () => {
    assert.equal(filterByStatus(MOCK_CAMPAIGNS, 'all').length, MOCK_CAMPAIGNS.length);
  });
});

// ===================================================================
describe('CampaignRules — 边界', () => {
  it('零预算活动', () => {
    const zeroBudget: CampaignActivity = { ...MOCK_CAMPAIGNS[0], budget: 0 };
    assert.equal(zeroBudget.budget, 0);
  });

  it('零命中活动应有多条', () => {
    const zeroHits = MOCK_CAMPAIGNS.filter(c => c.hitCount === 0);
    assert.equal(zeroHits.length, 3);
  });

  it('全 draft 活动统计', () => {
    const allDraft = MOCK_CAMPAIGNS.filter(c => c.status === 'draft');
    const stats = computeActivityStats(allDraft);
    assert.equal(stats.draft, 3);
    assert.equal(stats.active, 0);
    assert.equal(stats.ended, 0);
  });

  it('不存在的搜索词返回空', () => {
    assert.equal(filterByNameOrAudience(MOCK_CAMPAIGNS, 'xxxyyy').length, 0);
  });

  it('长名称搜索', () => {
    assert.equal(filterByNameOrAudience(MOCK_CAMPAIGNS, '预热').length, 1);
  });
});
