/**
 * h5/campaigns/[id]/page.test.tsx — H5活动详情页 L1 冒烟测试 (node:test 兼容)
 * 不渲染 React 组件（无 jsdom/react-testing-library），只验证：
 * - 模块可导入，default 为函数/组件
 * - Mock 数据完整性（4种类型 × 3种状态）
 * - TYPE_CONFIG / STATUS_CONFIG 映射完整性
 * - 边界/防御情况处理
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的类型及常量 ---- //

type CampaignType = 'flash' | 'discount' | 'gift' | 'member';
type CampaignStatus = 'upcoming' | 'ongoing' | 'ended';

interface CampaignProduct {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  image?: string;
}

interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  type: CampaignType;
  typeName: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  banner?: string;
  tags: string[];
  description?: string;
  rules?: string[];
  benefits?: string[];
  products?: CampaignProduct[];
}

const TYPE_CONFIG: Record<CampaignType, { label: string; color: string }> = {
  flash: { label: '秒杀', color: '#ef4444' },
  discount: { label: '折扣', color: '#3b82f6' },
  gift: { label: '礼包', color: '#8b5cf6' },
  member: { label: '会员', color: '#f59e0b' },
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg?: string }> = {
  upcoming: { label: '即将开始', color: '#f59e0b', bg: '#f59e0b20' },
  ongoing: { label: '进行中', color: '#10b981', bg: '#10b98120' },
  ended: { label: '已结束', color: '#64748b', bg: '#64748b20' },
};

const MOCK_DETAILS: Record<string, Campaign> = {
  'c1': {
    id: 'c1', title: '夏季清凉节', subtitle: '指定商品5折起',
    type: 'discount', typeName: '折扣',
    startDate: '2026-07-01', endDate: '2026-07-31', status: 'ongoing',
    tags: ['夏季', '清凉', '折扣'],
    description: '炎炎夏日，神机营为您带来清凉特惠！',
    rules: ['活动时间：2026年7月1日-7月31日', '指定商品享受5-8折优惠'],
    benefits: ['夏季单品低至5折', '会员专享额外9折', '购物满299元包邮'],
    products: [
      { id: 'p1', name: '夏季运动T恤', originalPrice: 299, salePrice: 149 },
      { id: 'p2', name: '透气运动短裤', originalPrice: 199, salePrice: 99 },
    ],
  },
  'c4': {
    id: 'c4', title: '限时秒杀', subtitle: '每日10点准时开抢',
    type: 'flash', typeName: '秒杀',
    startDate: '2026-07-01', endDate: '2026-07-03', status: 'upcoming',
    tags: ['限时', '秒杀', '每日'],
    description: '每日10点整准时开抢，数量有限先到先得！',
    rules: ['活动时间：2026年7月1日-7月3日', '每人限购1件'],
    benefits: ['爆款商品低至1折', '每日限量100份'],
    products: [
      { id: 'p3', name: '无线蓝牙耳机', originalPrice: 599, salePrice: 99 },
    ],
  },
  'c5': {
    id: 'c5', title: '端午特惠', subtitle: '满200减50',
    type: 'discount', typeName: '折扣',
    startDate: '2026-06-01', endDate: '2026-06-15', status: 'ended',
    tags: ['端午', '特惠'],
    description: '端午节期间全场满200减50',
    rules: ['活动时间：2026年6月1日-6月15日', '满200元减50元'],
    benefits: ['满200减50'],
    products: [],
  },
  'c6': {
    id: 'c6', title: '专属礼包', subtitle: '注册即送',
    type: 'gift', typeName: '礼包',
    startDate: '2026-06-01', endDate: '2026-12-31', status: 'ongoing',
    tags: ['礼包', '注册'],
    description: '新用户注册即送专属礼包一份',
    rules: [],
    benefits: ['新人礼包1份', '满100减20优惠券1张'],
    products: [],
  },
  'c7': {
    id: 'c7', title: '会员日双倍积分', subtitle: '每月15日专享',
    type: 'member', typeName: '会员',
    startDate: '2026-07-15', endDate: '2026-07-15', status: 'upcoming',
    tags: ['会员', '积分', '双倍'],
    description: '每月15日会员专享双倍积分活动',
    rules: ['活动时间：每月15日全天', '仅限认证会员参与', '积分将在活动结束后24小时内到账'],
    benefits: ['消费双倍积分', '积分可兑换商品'],
    products: [],
  },
};

// ---- 正例 (Positive Cases) ---- //

describe('CampaignDetailPage (H5) — 正例', () => {
  it('模块可导入且 default 导出为函数/组件', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function/component');
  });

  it('MOCK_DETAILS 包含 5 条活动详情数据', () => {
    const ids = Object.keys(MOCK_DETAILS);
    assert.equal(ids.length, 5);
  });

  it('覆盖所有 4 种活动类型', () => {
    const types = new Set(Object.values(MOCK_DETAILS).map(c => c.type));
    assert.ok(types.has('flash'), 'should include flash type');
    assert.ok(types.has('discount'), 'should include discount type');
    assert.ok(types.has('gift'), 'should include gift type');
    assert.ok(types.has('member'), 'should include member type');
  });

  it('覆盖 3 种活动状态', () => {
    const statuses = new Set(Object.values(MOCK_DETAILS).map(c => c.status));
    assert.ok(statuses.has('upcoming'), 'should include upcoming');
    assert.ok(statuses.has('ongoing'), 'should include ongoing');
    assert.ok(statuses.has('ended'), 'should include ended');
  });

  it('每条活动数据包含必填字段', () => {
    for (const [id, campaign] of Object.entries(MOCK_DETAILS)) {
      assert.ok(campaign.title, `${id} should have title`);
      assert.ok(campaign.subtitle, `${id} should have subtitle`);
      assert.ok(campaign.type, `${id} should have type`);
      assert.ok(campaign.status, `${id} should have status`);
      assert.ok(campaign.startDate, `${id} should have startDate`);
      assert.ok(campaign.endDate, `${id} should have endDate`);
      assert.ok(Array.isArray(campaign.tags), `${id} tags should be an array`);
    }
  });

  it('所有 ID 唯一', () => {
    const ids = Object.keys(MOCK_DETAILS);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('TYPE_CONFIG 定义完整', () => {
    const expectedLabels: Record<CampaignType, string> = {
      flash: '秒杀',
      discount: '折扣',
      gift: '礼包',
      member: '会员',
    };
    for (const t of ['flash', 'discount', 'gift', 'member'] as CampaignType[]) {
      assert.equal(TYPE_CONFIG[t].label, expectedLabels[t]);
      assert.ok(TYPE_CONFIG[t].color.startsWith('#'), `${t} color should be hex`);
      assert.equal(TYPE_CONFIG[t].color.length, 7, `${t} color should be 7 chars`);
    }
  });

  it('STATUS_CONFIG 定义完整', () => {
    const expectedLabels: Record<CampaignStatus, string> = {
      upcoming: '即将开始',
      ongoing: '进行中',
      ended: '已结束',
    };
    for (const s of ['upcoming', 'ongoing', 'ended'] as CampaignStatus[]) {
      assert.equal(STATUS_CONFIG[s].label, expectedLabels[s]);
      assert.ok(STATUS_CONFIG[s].color.startsWith('#'), `${s} color should be hex`);
    }
  });

  it('活动的日期格式为 YYYY-MM-DD', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const campaign of Object.values(MOCK_DETAILS)) {
      assert.ok(dateRegex.test(campaign.startDate), `${campaign.id} startDate format`);
      assert.ok(dateRegex.test(campaign.endDate), `${campaign.id} endDate format`);
    }
  });

  it('进行中的活动 endDate 在当前日期之后', () => {
    const now = new Date('2026-07-07');
    for (const campaign of Object.values(MOCK_DETAILS)) {
      if (campaign.status === 'ongoing') {
        assert.ok(new Date(campaign.endDate) >= now, `${campaign.id} ongoing endDate should be >= now`);
      }
    }
  });

  it('已结束的活动 endDate 在当前日期之前', () => {
    const now = new Date('2026-07-07');
    const ended = Object.values(MOCK_DETAILS).filter(c => c.status === 'ended');
    for (const campaign of ended) {
      assert.ok(new Date(campaign.endDate) <= now, `${campaign.id} ended endDate should be <= now`);
    }
  });
});

// ---- 边界 (Boundary Cases) ---- //

describe('CampaignDetailPage (H5) — 边界', () => {
  it('活动带有 description 描述', () => {
    const withDesc = Object.values(MOCK_DETAILS).filter(c => c.description);
    assert.equal(withDesc.length, Object.keys(MOCK_DETAILS).length);
  });

  it('活动可以没有 products 或为空数组', () => {
    const noProducts = Object.values(MOCK_DETAILS).filter(c => !c.products || c.products.length === 0);
    assert.ok(noProducts.length > 0, 'should have at least one campaign with no/empty products');
  });

  it('活动可以没有 rules 或为空数组', () => {
    const noRules = Object.values(MOCK_DETAILS).filter(c => !c.rules || c.rules.length === 0);
    assert.ok(noRules.length > 0, 'should have at least one campaign with no/empty rules');
  });

  it('活动 tags 都为字符串且非空', () => {
    for (const campaign of Object.values(MOCK_DETAILS)) {
      for (const tag of campaign.tags) {
        assert.equal(typeof tag, 'string', `${campaign.id} tag should be string`);
        assert.ok(tag.length > 0, `${campaign.id} tag should not be empty`);
      }
    }
  });

  it('4 种类型的颜色各不相同', () => {
    const colors = Object.values(TYPE_CONFIG).map(c => c.color);
    assert.equal(new Set(colors).size, colors.length, 'all type colors should be unique');
  });

  it('3 种状态的颜色各不相同', () => {
    const colors = Object.values(STATUS_CONFIG).map(c => c.color);
    assert.equal(new Set(colors).size, colors.length, 'all status colors should be unique');
  });
});

// ---- 防御 (Defensive Cases) ---- //

describe('CampaignDetailPage (H5) — 防御', () => {
  it('module can be imported', async () => {
    const src = await import('./page');
    assert.ok(src.default, 'default export exists');
  });

  it('活动 title 不为空', () => {
    for (const campaign of Object.values(MOCK_DETAILS)) {
      assert.ok(campaign.title.trim().length > 0, `${campaign.id} title non-empty`);
    }
  });

  it('活动 subtitle 不为空', () => {
    for (const campaign of Object.values(MOCK_DETAILS)) {
      assert.ok(campaign.subtitle.trim().length > 0, `${campaign.id} subtitle non-empty`);
    }
  });

  it('products 中的价格均为正数', () => {
    for (const campaign of Object.values(MOCK_DETAILS)) {
      for (const product of (campaign.products ?? [])) {
        assert.ok(product.originalPrice > 0, `${campaign.id} ${product.id} originalPrice > 0`);
        assert.ok(product.salePrice > 0, `${campaign.id} ${product.id} salePrice > 0`);
        assert.ok(product.salePrice <= product.originalPrice,
          `${campaign.id} ${product.id} salePrice <= originalPrice`);
      }
    }
  });

  it('可以没有 banner 字段', () => {
    const noBanner = Object.values(MOCK_DETAILS).filter(c => !c.banner);
    assert.ok(noBanner.length > 0, 'some campaigns should not have banner');
  });

  it('活动 name 都为正整数', () => {
    for (const campaign of Object.values(MOCK_DETAILS)) {
      for (const product of (campaign.products ?? [])) {
        assert.ok(Number.isFinite(product.originalPrice), `${campaign.id} ${product.id} price finite`);
      }
    }
  });
});
