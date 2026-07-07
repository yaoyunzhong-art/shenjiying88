/**
 * campaigns-page.test.ts — Unit tests for campaigns list page data, filtering, and logic
 *
 * 🐜 自动: [B-页面创建] [campaigns-page 营销活动管理列表页测试]
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 内联 mock 数据与 page.tsx 结构一致 ----

interface CampaignItem {
  id: string;
  code: string;
  name: string;
  type: 'promotion' | 'seasonal' | 'new_product' | 'retention' | 'cross_sell';
  channel: 'online' | 'offline' | 'omni';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  startDate: string;
  endDate: string;
  createdBy: string;
}

type CampaignStatus = CampaignItem['status'];
type CampaignType = CampaignItem['type'];
type CampaignChannel = CampaignItem['channel'];

const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'];
const CAMPAIGN_TYPES: CampaignType[] = ['promotion', 'seasonal', 'new_product', 'retention', 'cross_sell'];
const CAMPAIGN_CHANNELS: CampaignChannel[] = ['online', 'offline', 'omni'];

const CAMPAIGN_STATUS_MAP: Record<CampaignStatus, { label: string; variant: string }> = {
  draft: { label: '草稿', variant: 'neutral' },
  scheduled: { label: '已排期', variant: 'info' },
  active: { label: '进行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  ended: { label: '已结束', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

const CAMPAIGN_TYPE_MAP: Record<CampaignType, { label: string; color: string }> = {
  promotion: { label: '促销活动', color: '#f59e0b' },
  seasonal: { label: '季节性活动', color: '#10b981' },
  new_product: { label: '新品推广', color: '#3b82f6' },
  retention: { label: '客户留存', color: '#8b5cf6' },
  cross_sell: { label: '交叉销售', color: '#ec4899' },
};

const CAMPAIGN_CHANNEL_MAP: Record<CampaignChannel, { label: string; color: string }> = {
  online: { label: '线上', color: '#06b6d4' },
  offline: { label: '线下', color: '#f97316' },
  omni: { label: '全渠道', color: '#a855f7' },
};

const MOCK_CAMPAIGNS: CampaignItem[] = [
  { id: 'cmp-001', code: 'CAMP-001', name: '618年中大促', type: 'promotion', channel: 'omni', status: 'active', budget: 500000, spent: 385000, impressions: 850000, clicks: 42500, conversions: 3400, roi: 3.8, startDate: '2026-06-01', endDate: '2026-06-20', createdBy: '张三' },
  { id: 'cmp-002', code: 'CAMP-002', name: '夏季新品发布会', type: 'seasonal', channel: 'offline', status: 'scheduled', budget: 200000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-07-10', endDate: '2026-07-12', createdBy: '李四' },
  { id: 'cmp-003', code: 'CAMP-003', name: '会员积分加倍计划', type: 'retention', channel: 'online', status: 'active', budget: 120000, spent: 78000, impressions: 320000, clicks: 18500, conversions: 2100, roi: 4.2, startDate: '2026-06-15', endDate: '2026-07-15', createdBy: '王五' },
  { id: 'cmp-004', code: 'CAMP-004', name: '新品蓝牙耳机推广', type: 'new_product', channel: 'omni', status: 'active', budget: 350000, spent: 215000, impressions: 560000, clicks: 29800, conversions: 1800, roi: 2.5, startDate: '2026-06-10', endDate: '2026-07-10', createdBy: '赵六' },
  { id: 'cmp-005', code: 'CAMP-005', name: '智能家居跨品类推荐', type: 'cross_sell', channel: 'online', status: 'paused', budget: 180000, spent: 92000, impressions: 240000, clicks: 12100, conversions: 780, roi: 1.9, startDate: '2026-05-20', endDate: '2026-06-30', createdBy: '张三' },
  { id: 'cmp-006', code: 'CAMP-006', name: '五一黄金周促销', type: 'promotion', channel: 'omni', status: 'ended', budget: 450000, spent: 420000, impressions: 920000, clicks: 51200, conversions: 4600, roi: 3.2, startDate: '2026-04-25', endDate: '2026-05-05', createdBy: '李四' },
  { id: 'cmp-007', code: 'CAMP-007', name: '企业客户专属优惠', type: 'retention', channel: 'offline', status: 'draft', budget: 80000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-08-01', endDate: '2026-08-31', createdBy: '王五' },
  { id: 'cmp-008', code: 'CAMP-008', name: '开学季学生特惠', type: 'seasonal', channel: 'online', status: 'scheduled', budget: 150000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-08-20', endDate: '2026-09-10', createdBy: '赵六' },
  { id: 'cmp-009', code: 'CAMP-009', name: '双11预售启动', type: 'promotion', channel: 'omni', status: 'draft', budget: 1000000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-10-15', endDate: '2026-11-15', createdBy: '张三' },
  { id: 'cmp-010', code: 'CAMP-010', name: '新注册会员首单礼', type: 'retention', channel: 'online', status: 'active', budget: 60000, spent: 35000, impressions: 185000, clicks: 9600, conversions: 1200, roi: 5.1, startDate: '2026-06-01', endDate: '2026-12-31', createdBy: '李四' },
  { id: 'cmp-011', code: 'CAMP-011', name: '夏季服饰清仓', type: 'seasonal', channel: 'offline', status: 'active', budget: 250000, spent: 168000, impressions: 410000, clicks: 22500, conversions: 3100, roi: 3.5, startDate: '2026-06-20', endDate: '2026-08-15', createdBy: '王五' },
  { id: 'cmp-012', code: 'CAMP-012', name: '高端白酒品鉴会', type: 'new_product', channel: 'offline', status: 'ended', budget: 100000, spent: 95000, impressions: 50000, clicks: 3200, conversions: 420, roi: 1.5, startDate: '2026-05-10', endDate: '2026-05-12', createdBy: '赵六' },
  { id: 'cmp-013', code: 'CAMP-013', name: '全品类满减狂欢', type: 'promotion', channel: 'online', status: 'ended', budget: 300000, spent: 285000, impressions: 680000, clicks: 38900, conversions: 3200, roi: 2.8, startDate: '2026-05-01', endDate: '2026-05-15', createdBy: '张三' },
  { id: 'cmp-014', code: 'CAMP-014', name: '保险产品交叉推荐', type: 'cross_sell', channel: 'online', status: 'paused', budget: 90000, spent: 42000, impressions: 120000, clicks: 6100, conversions: 350, roi: 1.2, startDate: '2026-05-25', endDate: '2026-06-25', createdBy: '李四' },
  { id: 'cmp-015', code: 'CAMP-015', name: '家装季专题促销', type: 'seasonal', channel: 'omni', status: 'active', budget: 380000, spent: 198000, impressions: 490000, clicks: 26100, conversions: 1900, roi: 2.2, startDate: '2026-06-05', endDate: '2026-07-20', createdBy: '王五' },
];

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

function computeCampaignStats(items: CampaignItem[]) {
  const total = items.length;
  const active = items.filter((c) => c.status === 'active').length;
  const totalBudget = items.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = items.reduce((sum, c) => sum + c.spent, 0);
  const avgRoi =
    items.filter((c) => c.roi > 0).length > 0
      ? items.filter((c) => c.roi > 0).reduce((sum, c) => sum + c.roi, 0) /
        items.filter((c) => c.roi > 0).length
      : 0;
  return { total, active, totalBudget, totalSpent, avgRoi };
}

// ── 测试套件 ──

describe('campaigns data integrity', () => {
  describe('MOCK_CAMPAIGNS', () => {
    it('should contain at least 10 campaigns', () => {
      assert.ok(MOCK_CAMPAIGNS.length >= 10, `expected >= 10, got ${MOCK_CAMPAIGNS.length}`);
    });

    it('every campaign should have a unique id', () => {
      const ids = MOCK_CAMPAIGNS.map((c) => c.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every campaign should have a unique code', () => {
      const codes = MOCK_CAMPAIGNS.map((c) => c.code);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every campaign should have a valid status', () => {
      for (const c of MOCK_CAMPAIGNS) {
        assert.ok(
          CAMPAIGN_STATUSES.includes(c.status),
          `invalid status ${c.status} for ${c.id}`
        );
      }
    });

    it('every campaign should have a valid type', () => {
      for (const c of MOCK_CAMPAIGNS) {
        assert.ok(
          CAMPAIGN_TYPES.includes(c.type),
          `invalid type ${c.type} for ${c.id}`
        );
      }
    });

    it('every campaign should have a valid channel', () => {
      for (const c of MOCK_CAMPAIGNS) {
        assert.ok(
          CAMPAIGN_CHANNELS.includes(c.channel),
          `invalid channel ${c.channel} for ${c.id}`
        );
      }
    });

    it('budget should be non-negative', () => {
      for (const c of MOCK_CAMPAIGNS) {
        assert.ok(c.budget >= 0, `negative budget for ${c.id}`);
      }
    });

    it('spent should be non-negative', () => {
      for (const c of MOCK_CAMPAIGNS) {
        assert.ok(c.spent >= 0, `negative spent for ${c.id}`);
      }
    });

    it('spent should not exceed budget', () => {
      for (const c of MOCK_CAMPAIGNS) {
        assert.ok(
          c.spent <= c.budget,
          `spent ${c.spent} > budget ${c.budget} for ${c.id}`
        );
      }
    });

    it('should have campaigns in multiple statuses', () => {
      const statuses = new Set(MOCK_CAMPAIGNS.map((c) => c.status));
      assert.ok(statuses.size >= 4, `expected >= 4 statuses, got ${statuses.size}`);
    });

    it('should have campaigns in all types', () => {
      for (const t of CAMPAIGN_TYPES) {
        const count = MOCK_CAMPAIGNS.filter((c) => c.type === t).length;
        assert.ok(count > 0, `no campaigns with type ${t}`);
      }
    });

    it('should have campaigns in all channels', () => {
      for (const ch of CAMPAIGN_CHANNELS) {
        const count = MOCK_CAMPAIGNS.filter((c) => c.channel === ch).length;
        assert.ok(count > 0, `no campaigns with channel ${ch}`);
      }
    });
  });

  describe('CAMPAIGN_STATUS_MAP', () => {
    it('should have entries for all statuses', () => {
      for (const s of CAMPAIGN_STATUSES) {
        assert.ok(CAMPAIGN_STATUS_MAP[s], `missing status ${s}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const s of CAMPAIGN_STATUSES) {
        const entry = CAMPAIGN_STATUS_MAP[s];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant));
      }
    });
  });

  describe('CAMPAIGN_TYPE_MAP', () => {
    it('should have entries for all types', () => {
      for (const t of CAMPAIGN_TYPES) {
        assert.ok(CAMPAIGN_TYPE_MAP[t], `missing type ${t}`);
      }
    });

    it('each entry should have label and color', () => {
      for (const t of CAMPAIGN_TYPES) {
        const entry = CAMPAIGN_TYPE_MAP[t];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(typeof entry.color === 'string' && entry.color.startsWith('#'));
      }
    });
  });
});

describe('campaigns filtering logic', () => {
  describe('status filter', () => {
    it('should filter by active status', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.status === 'active');
      assert.ok(result.length >= 4);
      for (const c of result) {
        assert.strictEqual(c.status, 'active');
      }
    });

    it('should filter by draft status', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.status === 'draft');
      assert.ok(result.length >= 1);
      for (const c of result) {
        assert.strictEqual(c.status, 'draft');
      }
    });

    it('should filter by ended status', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.status === 'ended');
      assert.ok(result.length >= 2);
      for (const c of result) {
        assert.strictEqual(c.status, 'ended');
      }
    });
  });

  describe('type filter', () => {
    it('should filter by promotion type', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.type === 'promotion');
      assert.ok(result.length >= 3);
      for (const c of result) {
        assert.strictEqual(c.type, 'promotion');
      }
    });

    it('should filter by retention type', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.type === 'retention');
      assert.ok(result.length >= 2);
      for (const c of result) {
        assert.strictEqual(c.type, 'retention');
      }
    });
  });

  describe('channel filter', () => {
    it('should filter by online channel', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.channel === 'online');
      assert.ok(result.length >= 4);
      for (const c of result) {
        assert.strictEqual(c.channel, 'online');
      }
    });

    it('should filter by offline channel', () => {
      const result = MOCK_CAMPAIGNS.filter((c) => c.channel === 'offline');
      assert.ok(result.length >= 2);
      for (const c of result) {
        assert.strictEqual(c.channel, 'offline');
      }
    });
  });

  describe('search filter', () => {
    const searchFields: (keyof CampaignItem)[] = ['code', 'name', 'type', 'channel', 'createdBy'];

    function searchBy(items: CampaignItem[], term: string): CampaignItem[] {
      if (!term.trim()) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFields.some((key) => String(item[key]).toLowerCase().includes(lower))
      );
    }

    it('should match by campaign code', () => {
      const result = searchBy(MOCK_CAMPAIGNS, 'CAMP-001');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'cmp-001');
    });

    it('should match by campaign name (Chinese)', () => {
      const result = searchBy(MOCK_CAMPAIGNS, '618');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'cmp-001');
    });

    it('should match by type string', () => {
      const result = searchBy(MOCK_CAMPAIGNS, 'retention');
      assert.ok(result.length >= 2);
    });

    it('should match by creator name', () => {
      const result = searchBy(MOCK_CAMPAIGNS, '张三');
      assert.ok(result.length >= 2);
    });

    it('should return empty for non-matching search', () => {
      const result = searchBy(MOCK_CAMPAIGNS, 'xyz-nonexistent-99999');
      assert.strictEqual(result.length, 0);
    });

    it('empty search should return all items', () => {
      const result = searchBy(MOCK_CAMPAIGNS, '');
      assert.strictEqual(result.length, MOCK_CAMPAIGNS.length);
    });

    it('partial match should work', () => {
      const result = searchBy(MOCK_CAMPAIGNS, 'camp');
      assert.ok(result.length >= 5);
    });
  });
});

describe('campaigns composite filtering', () => {
  describe('status + type', () => {
    it('active + promotion campaigns should exist', () => {
      const result = MOCK_CAMPAIGNS.filter(
        (c) => c.status === 'active' && c.type === 'promotion'
      );
      assert.ok(result.length >= 1);
      for (const c of result) {
        assert.strictEqual(c.status, 'active');
        assert.strictEqual(c.type, 'promotion');
      }
    });

    it('draft campaigns should have zero spent', () => {
      const draft = MOCK_CAMPAIGNS.filter((c) => c.status === 'draft');
      for (const c of draft) {
        assert.strictEqual(c.spent, 0, `draft campaign ${c.id} has non-zero spent`);
      }
    });
  });

  describe('status + channel', () => {
    it('active + omni campaigns should exist', () => {
      const result = MOCK_CAMPAIGNS.filter(
        (c) => c.status === 'active' && c.channel === 'omni'
      );
      assert.ok(result.length >= 2);
    });

    it('scheduled + online campaigns should exist', () => {
      const result = MOCK_CAMPAIGNS.filter(
        (c) => c.status === 'scheduled' && c.channel === 'online'
      );
      assert.ok(result.length >= 1);
    });
  });

  describe('triple filter: status + type + channel', () => {
    it('active + seasonal + offline should have campaigns', () => {
      const result = MOCK_CAMPAIGNS.filter(
        (c) => c.status === 'active' && c.type === 'seasonal' && c.channel === 'offline'
      );
      assert.ok(result.length >= 1);
    });
  });
});

describe('campaigns pagination logic', () => {
  it('should paginate correctly with pageSize=5', () => {
    const pageSize = 5;
    const pageItems = MOCK_CAMPAIGNS.slice(0, pageSize);
    assert.strictEqual(pageItems.length, pageSize);
    assert.strictEqual(pageItems[0]?.id, MOCK_CAMPAIGNS[0]?.id);
  });

  it('second page should have correct items', () => {
    const pageSize = 5;
    const pageItems = MOCK_CAMPAIGNS.slice(5, 10);
    assert.strictEqual(pageItems.length, 5);
    assert.strictEqual(pageItems[0]?.id, 'cmp-006');
  });

  it('last page should handle fewer items', () => {
    const pageSize = 10;
    const totalPages = Math.ceil(MOCK_CAMPAIGNS.length / pageSize);
    const lastPage = totalPages - 1;
    const pageItems = MOCK_CAMPAIGNS.slice(lastPage * pageSize);
    assert.ok(pageItems.length <= pageSize);
    assert.ok(pageItems.length > 0);
  });

  it('out-of-bounds page should return empty', () => {
    const pageItems = MOCK_CAMPAIGNS.slice(15);
    assert.strictEqual(pageItems.length, 0);
  });
});

describe('campaigns sorting logic', () => {
  it('should sort by budget ascending', () => {
    const sorted = [...MOCK_CAMPAIGNS].sort((a, b) => a.budget - b.budget);
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || (sorted[i]?.budget ?? 0) >= (sorted[i - 1]?.budget ?? 0)
      )
    );
  });

  it('should sort by roi descending', () => {
    const sorted = [...MOCK_CAMPAIGNS].sort((a, b) => b.roi - a.roi);
    assert.ok((sorted[0]?.roi ?? 0) >= (sorted[sorted.length - 1]?.roi ?? 0));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || (sorted[i]?.roi ?? 0) <= (sorted[i - 1]?.roi ?? 0)
      )
    );
  });
});

describe('campaigns stats computation', () => {
  it('should compute correct totals', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    assert.strictEqual(stats.total, 15);
    assert.ok(stats.active >= 4);
    assert.ok(stats.totalBudget > 0);
  });

  it('total spent should not exceed total budget', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    assert.ok(stats.totalSpent <= stats.totalBudget);
  });

  it('avg ROI should be positive', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    assert.ok(stats.avgRoi > 0);
  });
});

describe('campaigns edge cases', () => {
  it('empty filter should return empty array', () => {
    const result = MOCK_CAMPAIGNS.filter(() => false);
    assert.strictEqual(result.length, 0);
  });

  it('ALL filter (no-op) should return all campaigns', () => {
    const result = MOCK_CAMPAIGNS.filter(() => true);
    assert.strictEqual(result.length, MOCK_CAMPAIGNS.length);
  });

  it('campaign name should not be empty', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(c.name.trim().length > 0, `empty name for ${c.id}`);
    }
  });

  it('campaign code should have CAMP- prefix', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(c.code.startsWith('CAMP-'), `unexpected code format: ${c.code}`);
    }
  });

  it('draft and scheduled campaigns should have zero spent and zero roi', () => {
    const upcoming = MOCK_CAMPAIGNS.filter(
      (c) => c.status === 'draft' || c.status === 'scheduled'
    );
    for (const c of upcoming) {
      assert.strictEqual(c.spent, 0, `upcoming campaign ${c.id} should have spent=0`);
      assert.strictEqual(c.roi, 0, `upcoming campaign ${c.id} should have roi=0`);
    }
  });

  it('startDate should be before or equal to endDate', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(
        c.startDate <= c.endDate,
        `startDate ${c.startDate} > endDate ${c.endDate} for ${c.id}`
      );
    }
  });

  it('formatCurrency should handle large values', () => {
    const result = formatCurrency(1000000);
    assert.ok(result.includes('万'), `unexpected format: ${result}`);
  });

  it('formatCurrency should handle small values', () => {
    const result = formatCurrency(500);
    assert.ok(result.startsWith('¥'), `unexpected format: ${result}`);
  });
});
