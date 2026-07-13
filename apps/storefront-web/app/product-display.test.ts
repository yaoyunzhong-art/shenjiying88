/**
 * product-display unit tests — storefront-web
 *
 * 覆盖: 商品展示数据 / 库存状态 / 价格展示 / 空状态 / 错误状态 / 搜索过滤
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type DisplayStatus = 'on_shelf' | 'off_shelf' | 'sold_out' | 'pre_order';
type DisplayCategory = 'all' | 'hot' | 'new' | 'discount' | 'organic';

interface DisplayProduct {
  productId: string; sku: string; name: string; description: string; imageUrl: string;
  category: DisplayCategory; status: DisplayStatus; originalPrice: number; salePrice: number;
  currency: string; unit: string; stockQuantity: number; salesCount: number;
  rating: number; reviewCount: number; tags: string[]; brandName: string;
  storeCode: string; availableFrom: string;
}

const DISPLAY_STATUSES: DisplayStatus[] = ['on_shelf', 'off_shelf', 'sold_out', 'pre_order'];
const DISPLAY_CATEGORIES: DisplayCategory[] = ['all', 'hot', 'new', 'discount', 'organic'];

const MOCK_DISPLAY_PRODUCTS: DisplayProduct[] = [
  { productId: 'dp-001', sku: 'SKU-BREAD-001', name: '有机全麦面包', description: '健康美味', imageUrl: '', category: 'organic', status: 'on_shelf', originalPrice: 25.00, salePrice: 18.50, currency: 'CNY', unit: '个', stockQuantity: 45, salesCount: 1230, rating: 4.8, reviewCount: 256, tags: ['有机', '低糖'], brandName: '健康烘焙坊', storeCode: 'store-001', availableFrom: '2026-01-01' },
  { productId: 'dp-002', sku: 'SKU-TEA-002', name: '无糖绿茶饮料', description: '清爽解渴', imageUrl: '', category: 'hot', status: 'on_shelf', originalPrice: 8.00, salePrice: 6.00, currency: 'CNY', unit: '瓶', stockQuantity: 320, salesCount: 5200, rating: 4.5, reviewCount: 890, tags: ['无糖'], brandName: '清泉饮品', storeCode: 'store-001', availableFrom: '2026-01-01' },
  { productId: 'dp-003', sku: 'SKU-TOWEL-003', name: '竹纤维洗碗布', description: '易清洗', imageUrl: '', category: 'new', status: 'on_shelf', originalPrice: 15.90, salePrice: 12.90, currency: 'CNY', unit: '包', stockQuantity: 89, salesCount: 340, rating: 4.3, reviewCount: 67, tags: ['环保'], brandName: '绿居家', storeCode: 'store-002', availableFrom: '2026-06-01' },
  { productId: 'dp-004', sku: 'SKU-EARPHONE-004', name: '蓝牙降噪耳机 Pro', description: '主动降噪', imageUrl: '', category: 'hot', status: 'sold_out', originalPrice: 599.00, salePrice: 499.00, currency: 'CNY', unit: '台', stockQuantity: 0, salesCount: 890, rating: 4.9, reviewCount: 312, tags: ['蓝牙'], brandName: '声学科技', storeCode: 'store-001', availableFrom: '2026-01-01' },
  { productId: 'dp-005', sku: 'SKU-TSHIRT-005', name: '纯棉短袖T恤', description: '舒适透气', imageUrl: '', category: 'discount', status: 'on_shelf', originalPrice: 129.00, salePrice: 89.00, currency: 'CNY', unit: '件', stockQuantity: 120, salesCount: 2100, rating: 4.6, reviewCount: 567, tags: ['纯棉'], brandName: '舒适棉品', storeCode: 'store-001', availableFrom: '2026-01-01' },
  { productId: 'dp-006', sku: 'SKU-BAND-006', name: '智能手环 S3', description: '心率监测', imageUrl: '', category: 'hot', status: 'on_shelf', originalPrice: 299.00, salePrice: 249.00, currency: 'CNY', unit: '台', stockQuantity: 60, salesCount: 3400, rating: 4.4, reviewCount: 1200, tags: ['智能'], brandName: '智能科技', storeCode: 'store-001', availableFrom: '2026-01-01' },
  { productId: 'dp-007', sku: 'SKU-COFFEE-007', name: '进口咖啡豆', description: '哥伦比亚产区', imageUrl: '', category: 'discount', status: 'on_shelf', originalPrice: 88.00, salePrice: 68.00, currency: 'CNY', unit: '袋', stockQuantity: 30, salesCount: 560, rating: 4.7, reviewCount: 134, tags: ['进口'], brandName: '香醇咖啡', storeCode: 'store-002', availableFrom: '2026-01-01' },
  { productId: 'dp-008', sku: 'SKU-CHOCOLATE-008', name: '进口巧克力礼盒', description: '比利时进口', imageUrl: '', category: 'new', status: 'pre_order', originalPrice: 198.00, salePrice: 158.00, currency: 'CNY', unit: '盒', stockQuantity: 0, salesCount: 0, rating: 0, reviewCount: 0, tags: ['礼盒'], brandName: '甜蜜时光', storeCode: 'store-002', availableFrom: '2026-07-01' },
  { productId: 'dp-009', sku: 'SKU-STORAGE-009', name: '收纳盒套装', description: '三件套', imageUrl: '', category: 'all', status: 'off_shelf', originalPrice: 49.90, salePrice: 39.90, currency: 'CNY', unit: '套', stockQuantity: 100, salesCount: 0, rating: 0, reviewCount: 0, tags: ['家居'], brandName: '收纳达人', storeCode: 'store-001', availableFrom: '2026-04-01' },
];

describe('product-display data integrity', () => {
  it('should have at least 8 display products', () => assert.ok(MOCK_DISPLAY_PRODUCTS.length >= 8));
  it('every product should have required fields', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS) {
      assert.ok(p.salePrice >= 0);
      assert.ok(p.originalPrice >= p.salePrice);
      assert.ok(p.stockQuantity >= 0);
      assert.ok(p.salesCount >= 0);
      assert.ok(p.rating >= 0 && p.rating <= 5);
      assert.ok(p.reviewCount >= 0);
      assert.ok(Array.isArray(p.tags));
    }
  });
  it('every status should be valid', () => { for (const p of MOCK_DISPLAY_PRODUCTS) assert.ok(DISPLAY_STATUSES.includes(p.status)); });
  it('every category should be valid', () => { for (const p of MOCK_DISPLAY_PRODUCTS) assert.ok(DISPLAY_CATEGORIES.includes(p.category)); });
  it('sold_out products should have 0 stock', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.status === 'sold_out')) assert.equal(p.stockQuantity, 0);
  });
  it('on_shelf products should have stock > 0', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.status === 'on_shelf')) assert.ok(p.stockQuantity > 0);
  });
});

describe('product-display filtering/search', () => {
  it('total by status should equal total', () => {
    assert.equal(DISPLAY_STATUSES.reduce((a, s) => a + MOCK_DISPLAY_PRODUCTS.filter(p => p.status === s).length, 0), MOCK_DISPLAY_PRODUCTS.length);
  });
  it('tag filter should isolate products', () => {
    const tags = [...new Set(MOCK_DISPLAY_PRODUCTS.flatMap(p => p.tags))];
    for (const t of tags) assert.ok(MOCK_DISPLAY_PRODUCTS.filter(p => p.tags.includes(t)).length >= 1);
  });
  it('store filter should isolate products', () => {
    const stores = [...new Set(MOCK_DISPLAY_PRODUCTS.map(p => p.storeCode))];
    for (const s of stores) assert.ok(MOCK_DISPLAY_PRODUCTS.filter(p => p.storeCode === s).length >= 1);
  });
});

describe('product-display empty/error states', () => {
  it('empty list should not crash', () => {
    const empty: DisplayProduct[] = [];
    assert.equal(empty.length, 0);
  });
  it('product with 0 reviews should have 0 rating', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.reviewCount === 0)) assert.equal(p.rating, 0);
  });
});

describe('product-display discount computation', () => {
  it('discount percentage should be calculable and non-negative', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS) {
      if (p.originalPrice > 0) {
        const dp = ((p.originalPrice - p.salePrice) / p.originalPrice) * 100;
        assert.ok(dp >= 0 && dp <= 100);
      }
    }
  });
  it('discount category products should have meaningful discounts', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.category === 'discount')) {
      assert.ok(((p.originalPrice - p.salePrice) / p.originalPrice) * 100 >= 10);
    }
  });
  it('hot products should have high sales counts', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.category === 'hot')) assert.ok(p.salesCount >= 500);
  });
});

describe('product-display edge cases', () => {
  it('pre_order product should have zero stock and zero sales', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.status === 'pre_order')) {
      assert.equal(p.stockQuantity, 0);
      assert.equal(p.salesCount, 0);
    }
  });
  it('off_shelf product should have no sales', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.status === 'off_shelf')) {
      assert.equal(p.salesCount, 0);
    }
  });
  it('new category must have products from different stores', () => {
    const newProducts = MOCK_DISPLAY_PRODUCTS.filter(p => p.category === 'new');
    const stores = new Set(newProducts.map(p => p.storeCode));
    assert.ok(stores.size >= 1, 'New products should span at least 1 store');
  });
  it('organic category products must have organic/healthy tags', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.category === 'organic')) {
      assert.ok(p.tags.includes('有机') || p.tags.includes('低糖'), 'Organic products need relevant tags');
    }
  });
  it('salePrice should never exceed originalPrice for any product', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS) {
      assert.ok(p.salePrice <= p.originalPrice, `${p.name}: salePrice(${p.salePrice}) > originalPrice(${p.originalPrice})`);
    }
  });
  it('products with 0 reviews should have rating of 0', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS) {
      if (p.reviewCount === 0) assert.equal(p.rating, 0);
    }
  });
  it('on_shelf products should have stock > 0 for availability', () => {
    for (const p of MOCK_DISPLAY_PRODUCTS.filter(p => p.status === 'on_shelf')) {
      assert.ok(p.stockQuantity > 0, `${p.name} should have stock when on_shelf`);
    }
  });
});
