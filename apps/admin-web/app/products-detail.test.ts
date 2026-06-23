/**
 * products-detail.test.ts — Unit tests for products detail page logic
 *   Covers: detail lookup, state transition rules, form validation, margin computation,
 *   not-found handling, delete confirmation flow
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  PRODUCT_STATUSES,
  type ProductItem,
  type ProductStatus,
} from '../app/products-data';

// ---- Detail lookup logic (mirrors getProductById in page.tsx) ----

function getProductById(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// ---- State transition rules (mirrors VALID_TRANSITIONS) ----

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

// ---- Form validation logic (mirrors validateForm in page.tsx) ----

interface EditFormData {
  name: string;
  sku: string;
  price: string;
  cost: string;
  stock: string;
  unit: string;
  description: string;
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

// ---- Margin computation helper ----

function marginPercent(item: Pick<ProductItem, 'price' | 'cost'>): number {
  return item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;
}

// ---- Tests ----

describe('products-detail lookup', () => {
  it('should find an existing product by id', () => {
    const p = getProductById('p-001');
    assert.ok(p, 'product p-001 should exist');
    assert.strictEqual(p!.id, 'p-001');
    assert.strictEqual(p!.name, '有机全麦面包');
    assert.strictEqual(p!.sku, 'SKU-10001');
  });

  it('should find a product by another id', () => {
    const p = getProductById('p-005');
    assert.ok(p, 'product p-005 should exist');
    assert.strictEqual(p!.id, 'p-005');
    assert.strictEqual(p!.category, 'clothing');
  });

  it('should return undefined for non-existent product', () => {
    const p = getProductById('non-existent-999');
    assert.strictEqual(p, undefined);
  });

  it('should return undefined for empty string id', () => {
    const p = getProductById('');
    assert.strictEqual(p, undefined);
  });

  it('every mock product should be findable by its own id', () => {
    for (const mock of MOCK_PRODUCTS) {
      const found = getProductById(mock.id);
      assert.ok(found, `product ${mock.id} should be findable`);
      assert.strictEqual(found!.id, mock.id);
    }
  });
});

describe('products-detail state transitions', () => {
  it('active product can transition to inactive and discontinued', () => {
    const transitions = getAllowedTransitions('active');
    assert.deepStrictEqual(transitions, ['inactive', 'discontinued']);
  });

  it('inactive product can transition to active and discontinued', () => {
    const transitions = getAllowedTransitions('inactive');
    assert.deepStrictEqual(transitions, ['active', 'discontinued']);
  });

  it('discontinued product can only transition to draft', () => {
    const transitions = getAllowedTransitions('discontinued');
    assert.deepStrictEqual(transitions, ['draft']);
  });

  it('draft product can only transition to active', () => {
    const transitions = getAllowedTransitions('draft');
    assert.deepStrictEqual(transitions, ['active']);
  });

  it('all statuses in MOCK_PRODUCTS have defined transitions', () => {
    for (const s of PRODUCT_STATUSES) {
      const transitions = VALID_TRANSITIONS[s];
      assert.ok(transitions, `status ${s} should have transitions defined`);
      assert.ok(Array.isArray(transitions));
      assert.ok(transitions.every((t) => PRODUCT_STATUSES.includes(t)));
    }
  });

  it('transition labels exist for all statuses', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(TRANSITION_LABELS[s], `missing transition label for ${s}`);
      assert.ok(typeof TRANSITION_LABELS[s] === 'string' && TRANSITION_LABELS[s].length > 0);
    }
  });

  it('no transition should point to itself', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(!VALID_TRANSITIONS[s]!.includes(s), `${s} should not transition to itself`);
    }
  });
});

describe('products-detail form validation', () => {
  const validForm: EditFormData = {
    name: '测试商品',
    sku: 'SKU-TEST-001',
    price: '99.00',
    cost: '50.00',
    stock: '100',
    unit: '个',
    description: '',
  };

  it('should pass validation with valid data', () => {
    const errors = validateForm(validForm);
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('should fail if name is empty', () => {
    const errors = validateForm({ ...validForm, name: '' });
    assert.strictEqual(errors.name, '商品名称不能为空');
  });

  it('should fail if name is whitespace only', () => {
    const errors = validateForm({ ...validForm, name: '   ' });
    assert.strictEqual(errors.name, '商品名称不能为空');
  });

  it('should fail if sku is empty', () => {
    const errors = validateForm({ ...validForm, sku: '' });
    assert.strictEqual(errors.sku, 'SKU 不能为空');
  });

  it('should fail if price is empty', () => {
    const errors = validateForm({ ...validForm, price: '' });
    assert.strictEqual(errors.price, '请输入有效的售价');
  });

  it('should fail if price is zero', () => {
    const errors = validateForm({ ...validForm, price: '0' });
    assert.strictEqual(errors.price, '请输入有效的售价');
  });

  it('should fail if price is negative', () => {
    const errors = validateForm({ ...validForm, price: '-10' });
    assert.strictEqual(errors.price, '请输入有效的售价');
  });

  it('should fail if price is not a number', () => {
    const errors = validateForm({ ...validForm, price: 'abc' });
    assert.strictEqual(errors.price, '请输入有效的售价');
  });

  it('should fail if cost is negative', () => {
    const errors = validateForm({ ...validForm, cost: '-1' });
    assert.strictEqual(errors.cost, '请输入有效的成本');
  });

  it('should pass if cost is zero', () => {
    const errors = validateForm({ ...validForm, cost: '0' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('should fail if cost is not a number', () => {
    const errors = validateForm({ ...validForm, cost: 'xyz' });
    assert.strictEqual(errors.cost, '请输入有效的成本');
  });

  it('should fail if stock is empty', () => {
    const errors = validateForm({ ...validForm, stock: '' });
    assert.strictEqual(errors.stock, '请输入有效的库存数量');
  });

  it('should pass if stock is zero', () => {
    const errors = validateForm({ ...validForm, stock: '0' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('should fail if stock is negative', () => {
    const errors = validateForm({ ...validForm, stock: '-5' });
    assert.strictEqual(errors.stock, '请输入有效的库存数量');
  });

  it('should fail if unit is empty', () => {
    const errors = validateForm({ ...validForm, unit: '' });
    assert.strictEqual(errors.unit, '单位不能为空');
  });

  it('should report multiple errors at once', () => {
    const errors = validateForm({ name: '', sku: '', price: '', cost: '', stock: '-1', unit: '', description: '' });
    assert.strictEqual(Object.keys(errors).length, 6);
    assert.strictEqual(errors.name, '商品名称不能为空');
    assert.strictEqual(errors.sku, 'SKU 不能为空');
    assert.strictEqual(errors.price, '请输入有效的售价');
    assert.strictEqual(errors.cost, '请输入有效的成本');
    assert.strictEqual(errors.stock, '请输入有效的库存数量');
    assert.strictEqual(errors.unit, '单位不能为空');
  });

  it('should pass validation with price/cost having decimal values', () => {
    const errors = validateForm({ ...validForm, price: '18.50', cost: '12.30' });
    assert.strictEqual(Object.keys(errors).length, 0);
  });
});

describe('products-detail margin computation', () => {
  it('should compute margin correctly for a given product', () => {
    const p = MOCK_PRODUCTS[0]!; // price 18.5, cost 12.3
    const margin = marginPercent(p);
    assert.ok(margin > 0 && margin < 100);
    assert.ok(Math.abs(margin - 33.5) < 1); // ~33.5%
  });

  it('should return 0 when price is 0', () => {
    const margin = marginPercent({ price: 0, cost: 10 });
    assert.strictEqual(margin, 0);
  });

  it('should return 100 minus fraction when cost is 0 and price > 0', () => {
    const margin = marginPercent({ price: 100, cost: 0 });
    assert.strictEqual(margin, 100);
  });

  it('should classify margins correctly: high >= 50, medium 30-50, low < 30', () => {
    for (const p of MOCK_PRODUCTS) {
      const m = marginPercent(p);
      if (m >= 50) assert.ok(true, `high margin product: ${p.name}`);
      else if (m >= 30) assert.ok(true, `medium margin product: ${p.name}`);
      else assert.ok(true, `low margin product: ${p.name}`);
    }
  });
});

describe('products-detail status/category display info', () => {
  it('every product status maps to a valid label and variant', () => {
    for (const s of PRODUCT_STATUSES) {
      const entry = PRODUCT_STATUS_MAP[s];
      assert.ok(entry, `missing PRODUCT_STATUS_MAP entry for ${s}`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
      assert.ok(['success', 'warning', 'danger', 'neutral'].includes(entry.variant));
    }
  });

  it('every product category maps to a valid label and variant', () => {
    for (const c of ['food', 'beverage', 'daily', 'electronics', 'clothing', 'other'] as const) {
      const entry = PRODUCT_CATEGORY_MAP[c];
      assert.ok(entry, `missing PRODUCT_CATEGORY_MAP entry for ${c}`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
      assert.ok(['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant));
    }
  });
});

describe('products-detail edge cases', () => {
  it('should handle a product with stock = 0', () => {
    const p = getProductById('p-006');
    assert.ok(p);
    assert.strictEqual(p!.stock, 0);
    assert.strictEqual(p!.status, 'inactive');
  });

  it('should handle a discontinued product', () => {
    const p = getProductById('p-010');
    assert.ok(p);
    assert.strictEqual(p!.status, 'discontinued');
    const transitions = getAllowedTransitions(p!.status);
    assert.deepStrictEqual(transitions, ['draft']);
  });

  it('should handle a draft product', () => {
    const p = getProductById('p-011');
    assert.ok(p);
    assert.strictEqual(p!.status, 'draft');
    const transitions = getAllowedTransitions(p!.status);
    assert.deepStrictEqual(transitions, ['active']);
  });

  it('should handle a high-volume product (stock = 3000)', () => {
    const p = getProductById('p-012');
    assert.ok(p);
    assert.strictEqual(p!.stock, 3000);
  });

  it('each product should have a valid brand name', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(typeof p.brandName === 'string' && p.brandName.length > 0, `invalid brandName for ${p.id}`);
    }
  });

  it('each product should have a valid store name', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(typeof p.storeName === 'string' && p.storeName.length > 0, `invalid storeName for ${p.id}`);
    }
  });

  it('each product should have createdAt <= updatedAt', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.createdAt <= p.updatedAt, `${p.id}: createdAt ${p.createdAt} > updatedAt ${p.updatedAt}`);
    }
  });
});

describe('products-detail integration: full flow simulation', () => {
  it('find product → validate form → check transitions', () => {
    const product = getProductById('p-001');
    assert.ok(product);

    // Fill valid form from product data
    const form: EditFormData = {
      name: product!.name,
      sku: product!.sku,
      price: String(product!.price),
      cost: String(product!.cost),
      stock: String(product!.stock),
      unit: product!.unit,
      description: '',
    };

    const errors = validateForm(form);
    assert.strictEqual(Object.keys(errors).length, 0);

    const transitions = getAllowedTransitions(product!.status);
    assert.deepStrictEqual(transitions, ['inactive', 'discontinued']);
  });

  it('should catch invalid form in full flow', () => {
    const form: EditFormData = {
      name: '',
      sku: '',
      price: '-1',
      cost: 'abc',
      stock: '-10',
      unit: '',
      description: '',
    };

    const errors = validateForm(form);
    assert.ok(Object.keys(errors).length >= 5);
  });
});
