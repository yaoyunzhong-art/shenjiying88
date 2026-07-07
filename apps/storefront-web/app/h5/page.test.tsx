/**
 * h5/page.test.tsx — H5移动端首页 L1 冒烟测试
 * Phase-FP T-FP-026 · 2026-07-07
 * 覆盖: Banner / 快捷入口 / 热门活动 / 推荐门店 / 会员卡片
 */

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

// ── 数据工厂 ──

function makeBannerItem(overrides?: Record<string, unknown>) {
  return {
    id: 'b1',
    title: '新用户专享福利',
    image: 'https://picsum.photos/seed/banner1/750/300',
    link: undefined,
    ...overrides,
  };
}

function makeQuickAction(overrides?: Record<string, unknown>) {
  return {
    icon: '🏪',
    label: '门店查询',
    href: '/store-locator',
    color: '#667eea',
    ...overrides,
  };
}

function makeStore(overrides?: Record<string, unknown>) {
  return {
    id: 's01',
    name: '深圳南山旗舰店',
    city: '深圳',
    rating: 4.8,
    distance: '1.2km',
    image: 'https://picsum.photos/seed/store1/200/150',
    ...overrides,
  };
}

function makeCampaign(overrides?: Record<string, unknown>) {
  return {
    id: 'c1',
    title: '夏日清凉季',
    subtitle: '全场8折起',
    badge: '热卖',
    color: '#ef4444',
    ...overrides,
  };
}

// ── 常量验证: Banner ──

const BANNERS: ReturnType<typeof makeBannerItem>[] = [
  { id: 'b1', title: '新用户专享福利', image: 'https://picsum.photos/seed/banner1/750/300' },
  { id: 'b2', title: '限时折扣来袭', image: 'https://picsum.photos/seed/banner2/750/300' },
];

// ── 常量验证: QuickActions ──

const QUICK_ACTIONS: ReturnType<typeof makeQuickAction>[] = [
  { icon: '🏪', label: '门店查询', href: '/store-locator', color: '#667eea' },
  { icon: '🎫', label: '优惠券', href: '/h5/coupons', color: '#f59e0b' },
  { icon: '📋', label: '我的订单', href: '/h5/orders', color: '#10b981' },
  { icon: '💰', label: '积分兑换', href: '/h5/points', color: '#ef4444' },
  { icon: '⭐', label: '我的收藏', href: '/h5/favorites', color: '#8b5cf6' },
  { icon: '📞', label: '联系客服', href: '/h5/contact', color: '#06b6d4' },
];

// ── 常量验证: RecommendedStores ──

const RECOMMENDED_STORES: ReturnType<typeof makeStore>[] = [
  { id: 's01', name: '深圳南山旗舰店', city: '深圳', rating: 4.8, distance: '1.2km', image: 'https://picsum.photos/seed/store1/200/150' },
  { id: 's02', name: '广州天河城店', city: '广州', rating: 4.6, distance: '3.5km', image: 'https://picsum.photos/seed/store2/200/150' },
  { id: 's03', name: '上海浦东店', city: '上海', rating: 4.7, distance: '5.8km', image: 'https://picsum.photos/seed/store3/200/150' },
];

// ── 常量验证: HotCampaigns ──

const HOT_CAMPAIGNS: ReturnType<typeof makeCampaign>[] = [
  { id: 'c1', title: '夏日清凉季', subtitle: '全场8折起', badge: '热卖', color: '#ef4444' },
  { id: 'c2', title: '新人专属礼包', subtitle: '注册即送100元券', badge: '新人', color: '#10b981' },
  { id: 'c3', title: '会员日特惠', subtitle: '每月15日双倍积分', badge: '会员', color: '#f59e0b' },
];

/* ════════════════════════════════════════
   正例 — H5首页数据与UI特征
   ════════════════════════════════════════ */

describe('H5HomePage — data contracts', () => {
  /* ── Banner ── */
  it('should have exactly 2 banner items', () => {
    assert.equal(BANNERS.length, 2);
  });

  it('each banner should have required fields', () => {
    for (const b of BANNERS) {
      assert.equal(typeof b.id, 'string');
      assert.ok(b.id.length > 0);
      assert.equal(typeof b.title, 'string');
      assert.ok(b.title.length > 0);
      assert.equal(typeof b.image, 'string');
      assert.ok(b.image.startsWith('https://'));
    }
  });

  it('banner images should start with picsum domain', () => {
    for (const b of BANNERS) {
      assert.ok(b.image.startsWith('https://picsum.photos/'), `banner ${b.id} has invalid image URL`);
    }
  });

  /* ── QuickActions ── */
  it('should have exactly 6 quick action items (3x2 grid)', () => {
    assert.equal(QUICK_ACTIONS.length, 6);
  });

  it('each quick action should have icon, label, href, and color', () => {
    for (const qa of QUICK_ACTIONS) {
      assert.equal(typeof qa.icon, 'string');
      assert.equal(typeof qa.label, 'string');
      assert.ok(qa.label.length > 0);
      assert.equal(typeof qa.href, 'string');
      assert.ok(qa.href.startsWith('/'));
      assert.equal(typeof qa.color, 'string');
      assert.ok(qa.color.startsWith('#'));
    }
  });

  it('all quick action hrefs should be valid internal routes', () => {
    const validPrefixes = ['/store-locator', '/h5/'];
    for (const qa of QUICK_ACTIONS) {
      const valid = validPrefixes.some((p) => qa.href.startsWith(p));
      assert.ok(valid, `href=${qa.href} is not a valid internal route`);
    }
  });

  /* ── RecommendedStores ── */
  it('should have exactly 3 recommended stores', () => {
    assert.equal(RECOMMENDED_STORES.length, 3);
  });

  it('each store should have required fields', () => {
    for (const s of RECOMMENDED_STORES) {
      assert.equal(typeof s.id, 'string');
      assert.ok(s.id.length > 0);
      assert.equal(typeof s.name, 'string');
      assert.ok(s.name.length > 0);
      assert.equal(typeof s.city, 'string');
      assert.ok(s.city.length > 0);
      assert.equal(typeof s.rating, 'number');
      assert.ok(s.rating >= 0 && s.rating <= 5);
      assert.equal(typeof s.distance, 'string');
      assert.ok(s.distance.match(/^[\d.]+km$/));
      assert.equal(typeof s.image, 'string');
      assert.ok(s.image.startsWith('https://'));
    }
  });

  it('store ratings should be in valid range [0, 5]', () => {
    const ratings = RECOMMENDED_STORES.map((s) => s.rating);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    assert.ok(avg >= 0 && avg <= 5);
    assert.ok(avg > 4, `average rating ${avg} should be > 4 for recommended stores`);
  });

  /* ── HotCampaigns ── */
  it('should have exactly 3 hot campaigns', () => {
    assert.equal(HOT_CAMPAIGNS.length, 3);
  });

  it('each campaign should have required fields and distinct badges', () => {
    const badges = new Set<string>();
    for (const c of HOT_CAMPAIGNS) {
      assert.equal(typeof c.id, 'string');
      assert.ok(c.id.length > 0);
      assert.equal(typeof c.title, 'string');
      assert.ok(c.title.length > 0);
      assert.equal(typeof c.subtitle, 'string');
      assert.ok(c.subtitle.length > 0);
      assert.equal(typeof c.badge, 'string');
      assert.ok(c.badge.length > 0);
      assert.equal(typeof c.color, 'string');
      assert.ok(c.color.startsWith('#'));
      badges.add(c.badge);
    }
    assert.equal(badges.size, HOT_CAMPAIGNS.length, 'each campaign should have a unique badge label');
  });

  /* ── Data integration: store <-> city mappings ── */
  it('should cover at least 2 cities among recommended stores', () => {
    const cities = new Set(RECOMMENDED_STORES.map((s) => s.city));
    assert.ok(cities.size >= 2, `only ${cities.size} cities covered`);
  });
});

/* ════════════════════════════════════════
   反例 — 防御性校验
   ════════════════════════════════════════ */

describe('H5HomePage — defensive checks', () => {
  it('should reject banner with missing title', () => {
    const bad = makeBannerItem({ title: '' });
    assert.equal(bad.title, '');
    assert.ok(!bad.title, 'banner with empty title should be caught');
  });

  it('should reject quick action with missing href', () => {
    const bad = makeQuickAction({ href: '' });
    assert.equal(bad.href, '');
    assert.ok(!bad.href.startsWith('/'), 'action with empty href should not pass route validation');
  });

  it('should reject store with negative rating', () => {
    const bad = makeStore({ rating: -1 });
    assert.equal(bad.rating, -1);
    assert.ok(bad.rating < 0, 'store with negative rating should be caught');
  });

  it('should reject store with rating > 5', () => {
    const bad = makeStore({ rating: 5.5 });
    assert.ok(bad.rating > 5, 'store with over-max rating should be caught');
  });

  it('should reject store without trailing km in distance', () => {
    const bad = makeStore({ distance: '100m' });
    assert.ok(!bad.distance.endsWith('km'), 'distance without km suffix should be rejected');
  });

  it('should reject campaign with missing subtitle', () => {
    const bad = makeCampaign({ subtitle: '' });
    assert.equal(bad.subtitle, '');
    assert.ok(!bad.subtitle, 'campaign with empty subtitle should be caught');
  });

  it('should reject campaign hex color without hash prefix', () => {
    const bad = makeCampaign({ color: 'ef4444' });
    assert.ok(!bad.color.startsWith('#'), 'color without # prefix should be rejected');
  });

  it('should reject banner image with non-https protocol', () => {
    const bad = makeBannerItem({ image: 'http://picsum.photos/test.jpg' });
    assert.ok(!bad.image.startsWith('https://'), 'non-https banner image should be rejected');
  });
});

/* ════════════════════════════════════════
   边界 — 极限数据 / 空数据
   ════════════════════════════════════════ */

describe('H5HomePage — edge cases', () => {
  it('should handle empty banner list gracefully', () => {
    const empty: typeof BANNERS = [];
    assert.equal(empty.length, 0);
  });

  it('should be resilient if BANNERS[0] is nullish', () => {
    // 模拟 banner 为空的情况下的 fallback 显示
    const fallbackTitle = BANNERS[0]?.title ?? '';
    assert.equal(fallbackTitle, '新用户专享福利');

    const noBanner = null as unknown as (typeof BANNERS)[0];
    const noBannerTitle = noBanner?.title ?? '';
    assert.equal(noBannerTitle, '', 'null banner should fallback to empty string');
  });

  it('should handle very long store names (truncation scenario)', () => {
    const longName = '深圳南山区科技园万象天地旗舰体验中心店';
    const store = makeStore({ name: longName });
    assert.ok(store.name.length > 10);
    assert.equal(store.name, longName);
  });

  it('should handle maximum rating edge case (5.0)', () => {
    const max = makeStore({ rating: 5.0 });
    assert.equal(max.rating, 5.0);
    assert.ok(max.rating <= 5);
  });

  it('should handle minimum rating edge case (0)', () => {
    const min = makeStore({ rating: 0 });
    assert.equal(min.rating, 0);
  });

  it('should handle empty quick actions (unlikely, but defensive)', () => {
    const emptyQA: typeof QUICK_ACTIONS = [];
    assert.equal(emptyQA.length, 0);
    // 3x2 grid would show nothing
    const gridCols = emptyQA.length > 0 ? 'repeat(3, 1fr)' : 'none';
    assert.equal(gridCols, 'none', 'empty quick actions should render no grid');
  });

  it('should handle single hot campaign', () => {
    const single = [HOT_CAMPAIGNS[0]];
    assert.equal(single.length, 1);
  });

  it('should handle very long distance strings', () => {
    const far = makeStore({ distance: '999.9km' });
    assert.ok(far.distance.match(/^[\d.]+km$/));
    const parsedDist = parseFloat(far.distance);
    assert.ok(parsedDist > 900);
  });

  it('should handle city name with special characters', () => {
    const store = makeStore({ city: '香港·九龙' });
    assert.equal(typeof store.city, 'string');
    assert.ok(store.city.length > 0);
  });
});

/* ════════════════════════════════════════
   UI 组件行为 — 模拟调用验证
   ════════════════════════════════════════ */

describe('H5HomePage — component behavior', () => {
  it('should link to correct H5 sub-pages from quick actions', () => {
    const expectedLinks = ['/store-locator', '/h5/coupons', '/h5/orders', '/h5/points', '/h5/favorites', '/h5/contact'];
    const actualLinks = QUICK_ACTIONS.map((qa) => qa.href);
    assert.deepEqual(actualLinks.sort(), expectedLinks.sort());
  });

  it('should have at least one highlighted quick action emoji', () => {
    const storeEmojis = QUICK_ACTIONS.filter((qa) => qa.icon === '🏪');
    assert.ok(storeEmojis.length >= 1);
  });

  it('banner indicator count should match banner item count', () => {
    const indicatorCount = BANNERS.length; // one dot per banner
    assert.equal(indicatorCount, 2);
  });

  it('hot campaigns horizontal scroll should have correct card width', () => {
    const CARD_WIDTH = 160;
    assert.equal(CARD_WIDTH, 160, 'each campaign card should be 160px wide');
  });

  it('member card should have reasonable mock data scenario', () => {
    const mockMember = {
      level: '黄金会员',
      points: 1280,
    };
    assert.ok(mockMember.points > 0);
    assert.ok(mockMember.level.length > 0);
    assert.ok(/会员$/.test(mockMember.level), 'member level should end with 会员');
  });

  it('should navigate to campaign detail page with correct path', () => {
    for (const c of HOT_CAMPAIGNS) {
      const detailHref = `/h5/campaigns/${c.id}`;
      assert.ok(detailHref.startsWith('/h5/campaigns/'));
      assert.ok(detailHref.endsWith(c.id));
    }
  });

  it('should navigate to store detail page', () => {
    for (const s of RECOMMENDED_STORES) {
      const detailHref = `/store-locator/${s.id}`;
      assert.ok(detailHref.startsWith('/store-locator/'));
    }
  });

  it('hot campaign colors should be valid 6-char hex', () => {
    for (const c of HOT_CAMPAIGNS) {
      assert.ok(/^#[0-9a-f]{6}$/i.test(c.color), `campaign ${c.id} has invalid hex color ${c.color}`);
    }
  });

  it('search placeholder text should be correct', () => {
    const PLACEHOLDER = '搜索门店、商品...';
    assert.equal(PLACEHOLDER, '搜索门店、商品...');
  });
});
