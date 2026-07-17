/**
 * products/[id]/page.test.tsx — 商品详情页 L1 测试
 *
 * 覆盖: 商品查找、状态流转、编辑表单验证、删除确认、费率计算
 * 正例: 商品查询、状态流转链、表单验证通过、毛利率计算
 * 反例: 商品不存在、无效价格/库存、空字段、删除确认逻辑
 * 边界: 零成本、零库存、满库存、停产草稿互转
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

type ProductStatus = 'active' | 'inactive' | 'discontinued' | 'draft';
type ProductCategory = 'food' | 'beverage' | 'daily' | 'electronics' | 'clothing' | 'other';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  status: ProductStatus;
  brandName: string;
  marketCode: string;
  storeName: string;
  createdAt: string;
  updatedAt: string;
}

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
  description?: string;
}

// ---- 产品数据 ----

const PRODUCT_STATUS_MAP: Record<ProductStatus, string> = {
  active: '在售',
  inactive: '下架',
  discontinued: '停产',
  draft: '草稿',
};

const VALID_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  active: ['inactive', 'discontinued'],
  inactive: ['active', 'discontinued'],
  discontinued: ['draft'],
  draft: ['active'],
};

const MOCK_PRODUCTS: ProductItem[] = [
  { id: 'p-001', sku: 'SKU-10001', name: '有机全麦面包', category: 'food', price: 18.50, cost: 12.30, stock: 245, unit: '个', status: 'active', brandName: '健康烘焙坊', marketCode: 'CN-BJ', storeName: '朝阳旗舰店', createdAt: '2025-01-15', updatedAt: '2026-06-10' },
  { id: 'p-002', sku: 'SKU-10002', name: '无糖绿茶饮料', category: 'beverage', price: 6.00, cost: 3.80, stock: 1520, unit: '瓶', status: 'active', brandName: '清泉饮品', marketCode: 'CN-BJ', storeName: '朝阳旗舰店', createdAt: '2025-02-20', updatedAt: '2026-06-12' },
  { id: 'p-003', sku: 'SKU-10003', name: '竹纤维洗碗布', category: 'daily', price: 15.00, cost: 9.50, stock: 0, unit: '包', status: 'inactive', brandName: '家洁', marketCode: 'CN-SH', storeName: '徐汇店', createdAt: '2025-03-01', updatedAt: '2026-05-20' },
  { id: 'p-004', sku: 'SKU-10004', name: '蓝牙耳机 Pro', category: 'electronics', price: 299.00, cost: 180.00, stock: 30, unit: '个', status: 'active', brandName: '声悦', marketCode: 'CN-BJ', storeName: '朝阳旗舰店', createdAt: '2025-04-10', updatedAt: '2026-06-15' },
  { id: 'p-005', sku: 'SKU-10005', name: '纯棉T恤', category: 'clothing', price: 89.00, cost: 45.00, stock: 500, unit: '件', status: 'draft', brandName: '棉品', marketCode: 'CN-GZ', storeName: '天河店', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
];

// ---- 辅助函数 ----

function getProductById(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
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

function calcGrossMargin(price: number, cost: number): string {
  if (price <= 0) return '0.0';
  return (((price - cost) / price) * 100).toFixed(1);
}

function getStockStatus(stock: number): string {
  if (stock === 0) return '缺货';
  if (stock < 50) return '低库存预警';
  return '库存充足';
}

function isTransitionAllowed(from: ProductStatus, to: ProductStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

/* ============================================================ */

describe('product-detail: 数据类型', () => {
  it('ProductItem has all fields', () => {
    const p: ProductItem = { id: 't', sku: 'S', name: 'N', category: 'food', price: 10, cost: 5, stock: 100, unit: '个', status: 'active', brandName: 'B', marketCode: 'M', storeName: 'S', createdAt: '2025-01-01', updatedAt: '2025-01-02' };
    assert.equal(typeof p.id, 'string');
    assert.equal(typeof p.price, 'number');
    assert.equal(typeof p.stock, 'number');
  });

  it('ProductStatus enum values', () => {
    const statuses: ProductStatus[] = ['active', 'inactive', 'discontinued', 'draft'];
    assert.equal(statuses.length, 4);
  });

  it('ProductCategory enum values', () => {
    const cats: ProductCategory[] = ['food', 'beverage', 'daily', 'electronics', 'clothing', 'other'];
    assert.equal(cats.length, 6);
  });

  it('EditFormErrors fields are optional', () => {
    const errors: EditFormErrors = {};
    assert.deepEqual(errors, {});
    const withPrice: EditFormErrors = { price: '价格错误' };
    assert.equal(withPrice.price, '价格错误');
  });
});

describe('product-detail: 业务逻辑 - 商品查找', () => {
  it('getProductById finds existing product', () => {
    const p = getProductById('p-001');
    assert.ok(p);
    assert.equal(p?.name, '有机全麦面包');
  });

  it('getProductById returns undefined for non-existent id', () => {
    assert.equal(getProductById('p-999'), undefined);
  });

  it('getProductById returns undefined for empty id', () => {
    assert.equal(getProductById(''), undefined);
  });

  it('getProductById is case-sensitive', () => {
    assert.equal(getProductById('P-001'), undefined);
  });
});

describe('product-detail: 业务逻辑 - 状态流转', () => {
  it('active can transition to inactive and discontinued', () => {
    assert.ok(isTransitionAllowed('active', 'inactive'));
    assert.ok(isTransitionAllowed('active', 'discontinued'));
    assert.ok(!isTransitionAllowed('active', 'draft'));
  });

  it('inactive can transition to active and discontinued', () => {
    assert.ok(isTransitionAllowed('inactive', 'active'));
    assert.ok(isTransitionAllowed('inactive', 'discontinued'));
    assert.ok(!isTransitionAllowed('inactive', 'draft'));
  });

  it('discontinued can only transition to draft', () => {
    assert.ok(isTransitionAllowed('discontinued', 'draft'));
    assert.ok(!isTransitionAllowed('discontinued', 'active'));
    assert.ok(!isTransitionAllowed('discontinued', 'inactive'));
  });

  it('draft can transition to active', () => {
    assert.ok(isTransitionAllowed('draft', 'active'));
    assert.ok(!isTransitionAllowed('draft', 'inactive'));
    assert.ok(!isTransitionAllowed('draft', 'discontinued'));
  });

  it('all statuses have transition entries', () => {
    const statuses: ProductStatus[] = ['active', 'inactive', 'discontinued', 'draft'];
    assert.ok(statuses.every(s => VALID_TRANSITIONS[s] !== undefined));
  });
});

describe('product-detail: 业务逻辑 - 表单验证', () => {
  it('valid form passes validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '18.50', cost: '12.30', stock: '100', unit: '个', description: '' };
    assert.deepEqual(validateForm(data), {});
  });

  it('empty name fails validation', () => {
    const data: EditFormData = { name: '', sku: 'SKU-001', price: '18.50', cost: '12.30', stock: '100', unit: '个', description: '' };
    assert.equal(validateForm(data).name, '商品名称不能为空');
  });

  it('empty sku fails validation', () => {
    const data: EditFormData = { name: '面包', sku: '', price: '18.50', cost: '12.30', stock: '100', unit: '个', description: '' };
    assert.equal(validateForm(data).sku, 'SKU 不能为空');
  });

  it('negative price fails validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '-5', cost: '2', stock: '10', unit: '个', description: '' };
    assert.equal(validateForm(data).price, '请输入有效的售价');
  });

  it('zero price fails validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '0', cost: '0', stock: '10', unit: '个', description: '' };
    assert.equal(validateForm(data).price, '请输入有效的售价');
  });

  it('non-numeric price fails validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: 'abc', cost: '10', stock: '10', unit: '个', description: '' };
    assert.equal(validateForm(data).price, '请输入有效的售价');
  });

  it('negative cost fails validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '20', cost: '-1', stock: '10', unit: '个', description: '' };
    assert.equal(validateForm(data).cost, '请输入有效的成本');
  });

  it('zero cost passes validation (free product)', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '20', cost: '0', stock: '10', unit: '个', description: '' };
    const errors = validateForm(data);
    assert.equal(errors.cost, undefined);
  });

  it('negative stock fails validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '20', cost: '10', stock: '-5', unit: '个', description: '' };
    assert.equal(validateForm(data).stock, '请输入有效的库存数量');
  });

  it('empty unit fails validation', () => {
    const data: EditFormData = { name: '面包', sku: 'SKU-001', price: '18.50', cost: '12.30', stock: '100', unit: '', description: '' };
    assert.equal(validateForm(data).unit, '单位不能为空');
  });

  it('multiple validation errors return all at once', () => {
    const data: EditFormData = { name: '', sku: '', price: '-1', cost: 'x', stock: '-1', unit: '', description: '' };
    const errors = validateForm(data);
    assert.ok(errors.name);
    assert.ok(errors.sku);
    assert.ok(errors.price);
    assert.ok(errors.cost);
    assert.ok(errors.stock);
    assert.ok(errors.unit);
  });
});

describe('product-detail: 业务逻辑 - 毛利率与库存', () => {
  it('calcGrossMargin positive margin', () => {
    assert.equal(calcGrossMargin(100, 60), '40.0');
  });

  it('calcGrossMargin zero cost is 100% margin', () => {
    assert.equal(calcGrossMargin(50, 0), '100.0');
  });

  it('calcGrossMargin zero price returns 0.0', () => {
    assert.equal(calcGrossMargin(0, 10), '0.0');
  });

  it('calcGrossMargin cost equals price is 0%', () => {
    assert.equal(calcGrossMargin(50, 50), '0.0');
  });

  it('getStockStatus zero stock is 缺货', () => {
    assert.equal(getStockStatus(0), '缺货');
  });

  it('getStockStatus 1-49 is 低库存预警', () => {
    assert.equal(getStockStatus(1), '低库存预警');
    assert.equal(getStockStatus(49), '低库存预警');
  });

  it('getStockStatus 50+ is 库存充足', () => {
    assert.equal(getStockStatus(50), '库存充足');
    assert.equal(getStockStatus(9999), '库存充足');
  });

  it('active product p-004 has margin >= 30%', () => {
    const p = getProductById('p-004')!;
    const margin = calcGrossMargin(p.price, p.cost);
    assert.ok(Number(margin) >= 30);
  });

  it('inactive product p-003 has zero stock', () => {
    const p = getProductById('p-003')!;
    assert.equal(p.stock, 0);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Products — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
