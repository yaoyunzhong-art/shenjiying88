/**
 * products/[id]/page.test.ts — Page-level tests for products detail page.
 * Tests detail lookup, state transitions, form validation, not-found handling.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: products-data.ts, products/[id]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_STATUSES,
  type ProductItem,
  type ProductStatus,
} from '../../products-data';

// ---- Detail lookup (mirrors getProductById in page.tsx) ----

function getProductById(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// ---- State transitions (mirrors VALID_TRANSITIONS in page.tsx) ----

const VALID_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  active: ['inactive', 'discontinued'],
  inactive: ['active', 'discontinued'],
  discontinued: ['draft'],
  draft: ['active'],
};

const TRANSITION_LABELS: Record<ProductStatus, string> = {
  active: '上架',
  inactive: '下架',
  discontinued: '停产',
  draft: '转为草稿',
};

function getAllowedTransitions(status: ProductStatus): ProductStatus[] {
  return VALID_TRANSITIONS[status] || [];
}

// ---- Form validation (mirrors validateForm in page.tsx) ----

interface EditFormData {
  name: string;
  sku: string;
  price: string;
  cost: string;
  stock: string;
  unit: string;
}

interface EditFormErrors {
  name?: string;
  sku?: string;
  price?: string;
  cost?: string;
  stock?: string;
  unit?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '商品名称不能为空';
  if (!data.sku.trim()) errors.sku = 'SKU 不能为空';
  if (!data.price.trim() || isNaN(Number(data.price)) || Number(data.price) <= 0) {
    errors.price = '请输入有效的售价';
  }
  if (!data.cost.trim() || isNaN(Number(data.cost)) || Number(data.cost) < 0) {
    errors.cost = '请输入有效的成本';
  }
  if (!data.stock.trim() || isNaN(Number(data.stock)) || Number(data.stock) < 0) {
    errors.stock = '请输入有效的库存数量';
  }
  if (!data.unit.trim()) errors.unit = '单位不能为空';
  return errors;
}

function computeMarginPercent(item: Pick<ProductItem, 'price' | 'cost'>): number {
  if (item.price <= 0) return 0;
  return ((item.price - item.cost) / item.price) * 100;
}

// ---- 正例 ----

describe('products/[id]: 正例 (positive cases)', () => {
  describe('detail lookup', () => {
    it('should find product by existing id', () => {
      const p = getProductById('p-001');
      assert.ok(p, 'should find p-001');
      assert.strictEqual(p!.sku, 'SKU-10001');
      assert.strictEqual(p!.name, '有机全麦面包');
    });

    it('should find product by another valid id', () => {
      const p = getProductById('p-005');
      assert.ok(p, 'should find p-005');
      assert.ok(p!.sku.length > 0);
    });

    it('every MOCK_PRODUCT should be findable by its id', () => {
      for (const p of MOCK_PRODUCTS) {
        const found = getProductById(p.id);
        assert.strictEqual(found, p);
      }
    });
  });

  describe('state transitions', () => {
    it('active product can transition to inactive or discontinued', () => {
      const transitions = getAllowedTransitions('active');
      assert.ok(transitions.includes('inactive'));
      assert.ok(transitions.includes('discontinued'));
      assert.strictEqual(transitions.length, 2);
    });

    it('discontinued product can only transition to draft', () => {
      const transitions = getAllowedTransitions('discontinued');
      assert.strictEqual(transitions.length, 1);
      assert.strictEqual(transitions[0], 'draft');
    });

    it('draft product can only transition to active', () => {
      const transitions = getAllowedTransitions('draft');
      assert.strictEqual(transitions.length, 1);
      assert.strictEqual(transitions[0], 'active');
    });

    it('inactive product can transition to active or discontinued', () => {
      const transitions = getAllowedTransitions('inactive');
      assert.ok(transitions.includes('active'));
      assert.ok(transitions.includes('discontinued'));
    });

    it('transitions should be reversible where defined', () => {
      const draftTrans = getAllowedTransitions('draft');
      assert.ok(draftTrans.includes('active'));
      // active -> inactive is valid, but inactive -> draft is not
      const activeTrans = getAllowedTransitions('active');
      assert.ok(activeTrans.includes('inactive'));
    });
  });

  describe('margin computation', () => {
    it('should compute positive margin for profitable products', () => {
      for (const p of MOCK_PRODUCTS) {
        const margin = computeMarginPercent(p);
        assert.ok(margin >= 0, `${p.id} margin ${margin} should be >= 0`);
      }
    });
  });

  describe('form validation', () => {
    it('should pass for valid form data', () => {
      const errors = validateForm({
        name: '测试商品',
        sku: 'SKU-TEST-001',
        price: '29.90',
        cost: '15.00',
        stock: '100',
        unit: '个',
      });
      assert.strictEqual(Object.keys(errors).length, 0);
    });
  });
});

// ---- 反例 ----

describe('products/[id]: 反例 (negative cases)', () => {
  describe('detail lookup', () => {
    it('should return undefined for nonexistent id', () => {
      const p = getProductById('nonexistent-id');
      assert.strictEqual(p, undefined);
    });

    it('should return undefined for empty string id', () => {
      const p = getProductById('');
      assert.strictEqual(p, undefined);
    });

    it('should return undefined for null/undefined-like values', () => {
      const p = getProductById('undefined');
      assert.strictEqual(p, undefined);
    });
  });

  describe('state transitions', () => {
    it('active product should NOT transition to draft', () => {
      const transitions = getAllowedTransitions('active');
      assert.ok(!transitions.includes('draft'));
    });

    it('discontinued product should NOT transition to active', () => {
      const transitions = getAllowedTransitions('discontinued');
      assert.ok(!transitions.includes('active'));
    });

    it('inactive product should NOT transition to draft', () => {
      const transitions = getAllowedTransitions('inactive');
      assert.ok(!transitions.includes('draft'));
    });
  });

  describe('form validation', () => {
    it('should reject empty name', () => {
      const errors = validateForm({
        name: '', sku: 'SKU', price: '10', cost: '5', stock: '10', unit: '个',
      });
      assert.ok(errors.name, 'name error expected');
      assert.ok(errors.name!.includes('不能为空'));
    });

    it('should reject empty SKU', () => {
      const errors = validateForm({
        name: '商品', sku: '', price: '10', cost: '5', stock: '10', unit: '个',
      });
      assert.ok(errors.sku, 'sku error expected');
    });

    it('should reject non-numeric price', () => {
      const errors = validateForm({
        name: '商品', sku: 'SKU', price: 'abc', cost: '5', stock: '10', unit: '个',
      });
      assert.ok(errors.price, 'price error expected');
    });

    it('should reject zero price', () => {
      const errors = validateForm({
        name: '商品', sku: 'SKU', price: '0', cost: '0', stock: '10', unit: '个',
      });
      assert.ok(errors.price, 'price should be > 0');
    });

    it('should reject negative cost', () => {
      const errors = validateForm({
        name: '商品', sku: 'SKU', price: '10', cost: '-5', stock: '10', unit: '个',
      });
      assert.ok(errors.cost, 'cost error expected');
    });

    it('should reject negative stock', () => {
      const errors = validateForm({
        name: '商品', sku: 'SKU', price: '10', cost: '5', stock: '-1', unit: '个',
      });
      assert.ok(errors.stock, 'stock error expected');
    });

    it('should reject empty unit', () => {
      const errors = validateForm({
        name: '商品', sku: 'SKU', price: '10', cost: '5', stock: '10', unit: '',
      });
      assert.ok(errors.unit, 'unit error expected');
    });
  });
});

// ---- 边界 ----

describe('products/[id]: 边界 (boundary cases)', () => {
  it('validateForm should return multiple errors at once', () => {
    const errors = validateForm({
      name: '', sku: '', price: '', cost: '', stock: '', unit: '',
    });
    const keys = Object.keys(errors);
    assert.ok(keys.length >= 4, `expected >= 4 errors, got ${keys.length}`);
  });

  it('zero cost is valid (free product edge case)', () => {
    const errors = validateForm({
      name: '免费样品', sku: 'SKU-FREE', price: '0.01', cost: '0', stock: '1', unit: '个',
    });
    // cost can be 0
    assert.ok(!errors.cost, 'zero cost should be valid');
  });

  it('very large stock value is acceptable', () => {
    const errors = validateForm({
      name: '商品', sku: 'SKU', price: '10', cost: '5', stock: '999999', unit: '箱',
    });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('decimal price should be valid', () => {
    const errors = validateForm({
      name: '商品', sku: 'SKU', price: '0.01', cost: '0.01', stock: '1', unit: '个',
    });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('inactive products should have zero stock in mock data', () => {
    const inactive = MOCK_PRODUCTS.filter((p) => p.status === 'inactive');
    for (const p of inactive) {
      assert.strictEqual(p.stock, 0, `${p.id} inactive but has stock ${p.stock}`);
    }
  });

  it('all product ids are prefixed with "p-"', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.id.startsWith('p-'), `id ${p.id} should start with p-`);
    }
  });

  it('each status transition should have a label', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(s in TRANSITION_LABELS, `missing transition label for ${s}`);
    }
  });
});
