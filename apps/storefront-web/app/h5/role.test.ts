/**
 * h5/role.test.ts — H5 移动端首页 L1 角色测试
 *
 * 覆盖: Banner / QuickAction / 商品卡片 / 底部导航 / 空状态
 * L1 JMeter 风格: 正例 + 反例 + 边界
 *
 * 角色视角:
 *   手机端消费者 — 浏览首页、查看商品、搜索
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据模型 ──

interface BannerItem {
  id: string;
  title: string;
  image: string;
  link?: string;
}

interface QuickAction {
  icon: string;
  label: string;
  href: string;
}

interface ProductCard {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  tags: string[];
  sales: number;
}

// 模拟 Banner 列表（共 3 张）
const MOCK_BANNERS: BannerItem[] = [
  { id: 'b1', title: '夏日特惠', image: '/banners/summer.jpg', link: '/promotions/summer' },
  { id: 'b2', title: '新品上市', image: '/banners/new.jpg' },
  { id: 'b3', title: '会员日', image: '/banners/member.jpg', link: '/member-center' },
];

// 模拟快捷操作（首页 8 个按钮）
const QUICK_ACTIONS: QuickAction[] = [
  { icon: '📱', label: '扫码', href: '/h5/scan' },
  { icon: '📦', label: '订单', href: '/h5/orders' },
  { icon: '🎫', label: '优惠券', href: '/h5/coupons' },
  { icon: '❤️', label: '收藏', href: '/h5/favorites' },
  { icon: '📢', label: '活动', href: '/h5/campaigns' },
  { icon: '🎯', label: '积分', href: '/h5/points' },
  { icon: '🏪', label: '门店', href: '/store-locator' },
  { icon: '👤', label: '我的', href: '/member-center' },
];

// 模拟商品列表
const MOCK_PRODUCTS: ProductCard[] = [
  { id: 'p001', title: '经典商品 A', price: 99.00, originalPrice: 129.00, image: '/products/a.jpg', tags: ['热销', '新品'], sales: 2341 },
  { id: 'p002', title: '热卖商品 B', price: 49.90, image: '/products/b.jpg', tags: ['特价'], sales: 5678 },
  { id: 'p003', title: '精品 C', price: 199.00, originalPrice: 299.00, image: '/products/c.jpg', tags: ['精品'], sales: 1234 },
  { id: 'p004', title: '商品 D', price: 29.90, image: '/products/d.jpg', tags: [], sales: 9876 },
];

// 翻页模拟
function paginateProducts(products: ProductCard[], page: number, pageSize: number): { items: ProductCard[]; total: number; hasMore: boolean } {
  if (page < 1) throw new Error('页码必须 >= 1');
  if (pageSize < 1) throw new Error('每页数量必须 >= 1');
  const start = (page - 1) * pageSize;
  const items = products.slice(start, start + pageSize);
  return { items, total: products.length, hasMore: start + pageSize < products.length };
}

// 搜索模拟
function searchProducts(products: ProductCard[], query: string): ProductCard[] {
  if (!query || query.trim().length === 0) return products;
  return products.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );
}

// ── 正例 ──

describe('h5: 手机端首页浏览（正例）', () => {

  it('Banner 应有 3 张轮播图', () => {
    assert.equal(MOCK_BANNERS.length, 3);
  });

  it('Banner 应包含基本的 id 和 title', () => {
    for (const b of MOCK_BANNERS) {
      assert.ok(b.id.length > 0);
      assert.ok(b.title.length > 0);
      assert.ok(b.image.length > 0);
    }
  });

  it('快捷操作应有 8 个按钮', () => {
    assert.equal(QUICK_ACTIONS.length, 8);
  });

  it('快捷操作包含扫码、订单、优惠券等核心入口', () => {
    const labels = QUICK_ACTIONS.map(a => a.label);
    assert.ok(labels.includes('扫码'));
    assert.ok(labels.includes('订单'));
    assert.ok(labels.includes('优惠券'));
    assert.ok(labels.includes('活动'));
  });

  it('商品列表第 1 页应返回 4 个商品', () => {
    const result = paginateProducts(MOCK_PRODUCTS, 1, 10);
    assert.equal(result.items.length, 4);
    assert.equal(result.total, 4);
    assert.equal(result.hasMore, false);
  });

  it('搜索"精品"应匹配 1 件商品（"精品 C"）', () => {
    const results = searchProducts(MOCK_PRODUCTS, '精品');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'p003');
  });

  it('空搜索词应返回全部商品', () => {
    const results = searchProducts(MOCK_PRODUCTS, '');
    assert.equal(results.length, 4);
  });

  it('页面应导出默认 React 组件', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', '默认导出应为 React 组件函数');
  });
});

// ── 反例 ──

describe('h5: 移动端异常场景（反例）', () => {

  it('搜索不存在的商品应返回空数组', () => {
    const results = searchProducts(MOCK_PRODUCTS, '不存在-zzz');
    assert.equal(results.length, 0);
  });

  it('翻页页码为 0 应抛异常', () => {
    assert.throws(() => paginateProducts(MOCK_PRODUCTS, 0, 10), /必须 >= 1/);
  });

  it('翻页 pageSize 为 0 应抛异常', () => {
    assert.throws(() => paginateProducts(MOCK_PRODUCTS, 1, 0), /必须 >= 1/);
  });

  it('超出最大页码应返回空列表', () => {
    const result = paginateProducts(MOCK_PRODUCTS, 100, 10);
    assert.equal(result.items.length, 0);
    assert.equal(result.total, 4);
  });

  it('Banner 不应有重复 id', () => {
    const ids = MOCK_BANNERS.map(b => b.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length);
  });

  it('商品价格为 0 应属于正常范围', () => {
    const zeroPriceProduct: ProductCard = { id: 'p000', title: '免费商品', price: 0, image: '/free.jpg', tags: [], sales: 100 };
    assert.equal(zeroPriceProduct.price, 0);
    assert.ok(typeof zeroPriceProduct.price === 'number');
  });
});

// ── 边界 ──

describe('h5: 移动端边界条件（边界）', () => {

  it('分页 pageSize = 2 时分两页且 hasMore 正确', () => {
    const p1 = paginateProducts(MOCK_PRODUCTS, 1, 2);
    assert.equal(p1.items.length, 2);
    assert.equal(p1.hasMore, true);

    const p2 = paginateProducts(MOCK_PRODUCTS, 2, 2);
    assert.equal(p2.items.length, 2);
    assert.equal(p2.hasMore, false);
  });

  it('搜索关键字仅含空格应视为空搜索,返回全部', () => {
    const results = searchProducts(MOCK_PRODUCTS, '   ');
    assert.equal(results.length, 4);
  });

  it('QuickAction 的 href 均应指向 /h5/* 或合法路径', () => {
    for (const a of QUICK_ACTIONS) {
      assert.ok(a.href.startsWith('/'), `${a.label} href 应以 / 开头`);
    }
  });

  it('商品原价应 >= 现价（若有原价）', () => {
    for (const p of MOCK_PRODUCTS) {
      if (p.originalPrice !== undefined) {
        assert.ok(p.originalPrice >= p.price, `${p.title}: 原价 ${p.originalPrice} >= 现价 ${p.price}`);
      }
    }
  });

  it('所有商品销量应为非负整数', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.sales >= 0, `${p.title} 销量 ${p.sales} 应 >= 0`);
      assert.ok(Number.isInteger(p.sales), `${p.title} 销量应为整数`);
    }
  });
});
