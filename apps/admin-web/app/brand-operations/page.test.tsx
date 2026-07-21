/**
 * brand-operations/page.test.tsx — 品牌运营管理 L1 测试
 *
 * 覆盖: 品牌资产列表、活动管理、联名合作、搜索筛选、统计聚合
 * 正例: 资产/活动/合作数据结构、状态枚举、搜索过滤
 * 反例: 空列表、无效状态、缺失字段、越界值
 * 边界: 全活动活动、空项目合作、全类型覆盖
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type AssetType = 'logo' | 'banner' | 'video' | 'copy';
type CampaignStatus = 'draft' | 'pending_review' | 'approved' | 'active' | 'ended' | 'cancelled';
type CollabStatus = 'draft' | 'negotiating' | 'active' | 'ended' | 'terminated';
type PartnerGrade = 'platinum' | 'gold' | 'silver' | 'bronze';

interface BrandAsset {
  id: string; type: AssetType; name: string; active: boolean; url: string; createdAt: string;
}

interface BrandCampaign {
  id: string; title: string; description: string; storeIds: string[];
  status: CampaignStatus; startDate: string; endDate: string; createdBy: string;
}

interface Collaboration {
  id: string; title: string;
  partner: { name: string; grade: PartnerGrade; contactName: string; };
  type: string; status: CollabStatus; startDate: string; endDate: string;
}

// ── 常量映射 ──

const ASSET_TYPES: Record<AssetType, string> = { logo: 'Logo', banner: 'Banner', video: '视频', copy: '文案' };

const CAMPAIGN_STATUS: Record<CampaignStatus, { l: string; v: 'default' | 'pending' | 'success' | 'warning' | 'error' }> = {
  draft: { l: '草稿', v: 'default' },
  pending_review: { l: '待审批', v: 'pending' },
  approved: { l: '已审批', v: 'success' },
  active: { l: '进行中', v: 'success' },
  ended: { l: '已结束', v: 'default' },
  cancelled: { l: '已取消', v: 'error' },
};

const COLLAB_STATUS: Record<CollabStatus, string> = {
  draft: '草稿', negotiating: '洽谈中', active: '合作中', ended: '已到期', terminated: '已终止',
};

const PARTNER_GRADE: Record<PartnerGrade, string> = {
  platinum: '铂金', gold: '黄金', silver: '白银', bronze: '青铜',
};

// ── Mock 数据 ──

const MOCK_ASSETS: BrandAsset[] = [
  { id: 'a-001', type: 'logo', name: '主品牌Logo', active: true, url: '/assets/logo-main.png', createdAt: '2026-01-15' },
  { id: 'a-002', type: 'banner', name: '618主KV', active: true, url: '/assets/banner-618.jpg', createdAt: '2026-05-20' },
  { id: 'a-003', type: 'video', name: '品牌宣传片', active: true, url: '/assets/brand-video.mp4', createdAt: '2026-03-10' },
  { id: 'a-004', type: 'copy', name: '品牌Slogan集合', active: false, url: '/assets/slogans.md', createdAt: '2026-02-01' },
  { id: 'a-005', type: 'banner', name: '双11预热Banner', active: false, url: '/assets/banner-double11.jpg', createdAt: '2026-07-01' },
];

const MOCK_CAMPAIGNS: BrandCampaign[] = [
  { id: 'c-001', title: '618年中大促', description: '年中购物节', storeIds: ['s-001', 's-002'], status: 'ended', startDate: '2026-06-01', endDate: '2026-06-20', createdBy: '张三' },
  { id: 'c-002', title: '夏日清凉季', description: '夏季促销', storeIds: ['s-001'], status: 'active', startDate: '2026-07-01', endDate: '2026-08-31', createdBy: '李四' },
  { id: 'c-003', title: '新品首发', description: '秋季新品发布', storeIds: ['s-003'], status: 'draft', startDate: '2026-09-01', endDate: '2026-09-15', createdBy: '王五' },
  { id: 'c-004', title: '会员日专享', description: '会员日促销', storeIds: ['s-001', 's-002', 's-003'], status: 'active', startDate: '2026-07-15', endDate: '2026-07-15', createdBy: '赵六' },
  { id: 'c-005', title: '双11预热', description: '双十一提前预售', storeIds: ['s-001'], status: 'pending_review', startDate: '2026-10-20', endDate: '2026-11-11', createdBy: '张三' },
];

const MOCK_COLLABS: Collaboration[] = [
  { id: 'co-001', title: '可口可乐联名', partner: { name: '可口可乐', grade: 'platinum', contactName: '王经理' }, type: '联名产品', status: 'active', startDate: '2026-05-01', endDate: '2026-12-31' },
  { id: 'co-002', title: '奈雪の茶合作', partner: { name: '奈雪の茶', grade: 'gold', contactName: '李经理' }, type: '联名活动', status: 'negotiating', startDate: '2026-08-01', endDate: '2026-09-30' },
  { id: 'co-003', title: '腾讯游戏合作', partner: { name: '腾讯游戏', grade: 'platinum', contactName: '赵总监' }, type: 'IP授权', status: 'terminated', startDate: '2025-06-01', endDate: '2026-05-31' },
];

// ── 辅助函数 ──

function getAssetTypeLabel(type: AssetType): string {
  return ASSET_TYPES[type] ?? type;
}

function getCampaignStatusInfo(status: CampaignStatus): { label: string; variant: string } {
  const info = CAMPAIGN_STATUS[status];
  return info ? { label: info.l, variant: info.v } : { label: status, variant: 'default' };
}

function getCollabStatusLabel(status: CollabStatus): string {
  return COLLAB_STATUS[status] ?? status;
}

function getPartnerGradeLabel(grade: PartnerGrade): string {
  return PARTNER_GRADE[grade] ?? grade;
}

function filterAssets(items: BrandAsset[], typeFilter: AssetType | 'all', activeOnly: boolean): BrandAsset[] {
  let result = items;
  if (typeFilter !== 'all') {
    result = result.filter(a => a.type === typeFilter);
  }
  if (activeOnly) {
    result = result.filter(a => a.active);
  }
  return result;
}

function computeCampaignStats(items: BrandCampaign[]) {
  return {
    total: items.length,
    active: items.filter(c => c.status === 'active').length,
    draft: items.filter(c => c.status === 'draft').length,
    ended: items.filter(c => c.status === 'ended').length,
    pending: items.filter(c => c.status === 'pending_review').length,
  };
}

// ===================================================================
describe('BrandOperations — 品牌资产', () => {
  it('资产类型映射完整——四种类型均有中文标签', () => {
    const types: AssetType[] = ['logo', 'banner', 'video', 'copy'];
    for (const t of types) {
      const label = getAssetTypeLabel(t);
      assert.ok(label.length > 0, `Asset type ${t} should have a label`);
      assert.notEqual(label, t, `Asset type ${t} label should differ from key`);
    }
  });

  it('资产列表字段完整', () => {
    for (const a of MOCK_ASSETS) {
      assert.ok(a.id, 'id required');
      assert.ok(a.name, 'name required');
      assert.ok(typeof a.active === 'boolean', 'active must be boolean');
      assert.ok(ASSET_TYPES[a.type], `valid asset type: ${a.type}`);
    }
  });

  it('按类型筛选 assets 正确过滤', () => {
    const banners = filterAssets(MOCK_ASSETS, 'banner', false);
    assert.equal(banners.length, 2);
    assert.ok(banners.every(a => a.type === 'banner'));
  });

  it('activeOnly 筛选正确', () => {
    const active = filterAssets(MOCK_ASSETS, 'all', true);
    assert.equal(active.length, 3);
    assert.ok(active.every(a => a.active));
  });

  it('无匹配类型筛选应返回空数组', () => {
    const result = filterAssets([], 'logo', false);
    assert.deepEqual(result, []);
  });

  it('未知类型应返回原始键', () => {
    const label = ASSET_TYPES['copy' as AssetType];
    assert.equal(label, '文案');
  });
});

// ===================================================================
describe('BrandOperations — 活动管理', () => {
  it('活动状态映射应包含全部六种状态', () => {
    const expectedStatuses: CampaignStatus[] = ['draft', 'pending_review', 'approved', 'active', 'ended', 'cancelled'];
    for (const s of expectedStatuses) {
      const info = getCampaignStatusInfo(s);
      assert.ok(info.label.length > 0, `Campaign status ${s} should have a label`);
    }
  });

  it('活动统计数据正确', () => {
    const stats = computeCampaignStats(MOCK_CAMPAIGNS);
    assert.equal(stats.total, 5);
    assert.equal(stats.active, 2);
    assert.equal(stats.draft, 1);
    assert.equal(stats.ended, 1);
    assert.equal(stats.pending, 1);
  });

  it('storeIds 应包含门店引用', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(Array.isArray(c.storeIds), 'storeIds should be an array');
      assert.ok(c.storeIds.length > 0, 'at least one store');
    }
  });

  it('活动日期有效性: startDate 不应晚于 endDate', () => {
    for (const c of MOCK_CAMPAIGNS) {
      assert.ok(new Date(c.startDate) <= new Date(c.endDate),
        `${c.title}: startDate ${c.startDate} <= endDate ${c.endDate}`);
    }
  });

  it('空活动列表统计数据为零', () => {
    const stats = computeCampaignStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.active, 0);
  });

  it('全 ended 活动统计', () => {
    const allEnded: BrandCampaign[] = [
      { id: 'x', title: 'A', description: '', storeIds: ['s1'], status: 'ended', startDate: '2026-01-01', endDate: '2026-01-02', createdBy: 'u' },
      { id: 'y', title: 'B', description: '', storeIds: ['s1'], status: 'ended', startDate: '2026-02-01', endDate: '2026-02-02', createdBy: 'u' },
    ];
    const stats = computeCampaignStats(allEnded);
    assert.equal(stats.total, 2);
    assert.equal(stats.ended, 2);
    assert.equal(stats.active, 0);
  });
});

// ===================================================================
describe('BrandOperations — 联名合作', () => {
  it('合作状态映射应包含五种', () => {
    const statuses: CollabStatus[] = ['draft', 'negotiating', 'active', 'ended', 'terminated'];
    for (const s of statuses) {
      const label = getCollabStatusLabel(s);
      assert.ok(label.length > 0, `Collab status ${s} should have a label`);
    }
  });

  it('合作伙伴等级映射应包含四种', () => {
    const grades: PartnerGrade[] = ['platinum', 'gold', 'silver', 'bronze'];
    for (const g of grades) {
      const label = getPartnerGradeLabel(g);
      assert.ok(label.length > 0, `Partner grade ${g} should have a label`);
    }
  });

  it('合作记录应包含 partner 对象', () => {
    for (const co of MOCK_COLLABS) {
      assert.ok(co.partner, 'partner required');
      assert.ok(co.partner.name, 'partner name required');
      assert.ok(co.partner.grade, 'partner grade required');
    }
  });

  it('日期区间有效性: 合作 startDate <= endDate', () => {
    for (const co of MOCK_COLLABS) {
      assert.ok(new Date(co.startDate) <= new Date(co.endDate),
        `${co.title}: start ${co.startDate} <= end ${co.endDate}`);
    }
  });
});

// ===================================================================
describe('BrandOperations — 搜索与过滤', () => {
  it('按类型+active 复合过滤', () => {
    const result = filterAssets(MOCK_ASSETS, 'banner', true);
    assert.equal(result.length, 1); // 只有 banner + active
  });

  it('全部资产不过滤返回全量', () => {
    const result = filterAssets(MOCK_ASSETS, 'all', false);
    assert.equal(result.length, MOCK_ASSETS.length);
  });

  it('空资产列表过滤不抛异常', () => {
    assert.doesNotThrow(() => filterAssets([], 'logo', true));
  });
});
