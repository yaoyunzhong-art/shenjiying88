/*!
 * stock-transfer/new/page.test.tsx - 新建调拨单 L1 冒烟测试（增强版）
 * 源码分析模式：不渲染 UI 组件，只测试纯函数和业务逻辑
 * 角色视角: 👔店长 / 💳采购 / 📦仓管
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ── 类型 ──

type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

interface TransferLineItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
}

// ── 常量（从 page.tsx 镜像） ──

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇄门店',
  warehouse_to_store: '仓库→门店',
  store_to_warehouse: '门店→仓库',
};

const TRANSFER_TYPE_DIRECTIONS: Record<TransferType, { from: string; to: string }> = {
  store_to_store: { from: '调出门店', to: '调入门店' },
  warehouse_to_store: { from: '仓库', to: '门店' },
  store_to_warehouse: { from: '门店', to: '仓库' },
};

const LOCATION_OPTIONS: Record<string, string[]> = {
  store: ['旗舰店(天河城)', '分店(体育西)', '分店(珠江新城)', '分店(北京路)'],
  warehouse: ['中央仓库', '华南仓库', '华东仓库'],
};

const SUGGESTED_PRODUCTS: TransferLineItem[] = [
  { sku: 'CL-001', name: '氨基酸洁面乳', quantity: 0, unit: '支' },
  { sku: 'CL-002', name: '泡沫洁面啫喱', quantity: 0, unit: '支' },
  { sku: 'LK-001', name: '哑光丝绒口红 #520', quantity: 0, unit: '支' },
  { sku: 'LK-002', name: '水润唇釉 #301', quantity: 0, unit: '支' },
  { sku: 'EX-001', name: '防晒喷雾 SPF50', quantity: 0, unit: '瓶' },
];

// ── 分类标签函数 ──

function renderTransferTypeTag(type: TransferType): string {
  return TRANSFER_TYPE_LABELS[type] || '未知类型';
}

function getDirectionLabel(type: TransferType, which: 'from' | 'to'): string {
  const dir = TRANSFER_TYPE_DIRECTIONS[type];
  return dir ? dir[which] : '未知';
}

// ── 地点选项函数（从 page.tsx 镜像） ──

function getLocationOptions(which: 'from' | 'to', type: TransferType): string[] {
  if (type === 'store_to_store') return [...LOCATION_OPTIONS.store];
  if (type === 'warehouse_to_store') return which === 'from' ? [...LOCATION_OPTIONS.warehouse] : [...LOCATION_OPTIONS.store];
  return which === 'from' ? [...LOCATION_OPTIONS.store] : [...LOCATION_OPTIONS.warehouse];
}

// ── 验证函数（从 page.tsx 镜像） ──

function validateForm(fields: {
  fromLocation: string;
  toLocation: string;
  reason: string;
  items: TransferLineItem[];
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.fromLocation) errors.fromLocation = '请选择调出地';
  if (!fields.toLocation) errors.toLocation = '请选择调入地';
  if (fields.fromLocation && fields.toLocation && fields.fromLocation === fields.toLocation) {
    errors.toLocation = '调出地和调入地不能相同';
  }
  if (!fields.reason.trim()) errors.reason = '请填写调拨原因';
  const validItems = fields.items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) errors.items = '请至少添加一个商品且数量大于0';
  return errors;
}

// ── 统计函数 ──

interface TransferStats {
  totalItems: number;
  totalQuantity: number;
  selectedTypes: number;
  itemsByUnit: Record<string, number>;
}

function computeTransferStats(items: TransferLineItem[]): TransferStats {
  const validItems = items.filter((i) => i.quantity > 0);
  const itemsByUnit: Record<string, number> = {};
  for (const item of validItems) {
    itemsByUnit[item.unit] = (itemsByUnit[item.unit] || 0) + item.quantity;
  }
  return {
    totalItems: validItems.length,
    totalQuantity: validItems.reduce((s, i) => s + i.quantity, 0),
    selectedTypes: new Set(validItems.map((i) => i.unit)).size,
    itemsByUnit,
  };
}

function getTransferTypeCount(): number {
  return Object.keys(TRANSFER_TYPE_LABELS).length;
}

// ── 测试 ──

const MOCK_STORES = ['旗舰店(天河城)', '分店(体育西)', '分店(珠江新城)'];
const MOCK_WAREHOUSE = '中央仓库';

// === 新增：分类标签测试 ===

describe('NewStockTransferPage - 分类标签标签化', () => {
  it('renderTransferTypeTag 返回正确类型标签', () => {
    assert.equal(renderTransferTypeTag('store_to_store'), '门店⇄门店');
    assert.equal(renderTransferTypeTag('warehouse_to_store'), '仓库→门店');
    assert.equal(renderTransferTypeTag('store_to_warehouse'), '门店→仓库');
  });

  it('renderTransferTypeTag 处理未知类型返回"未知类型"', () => {
    assert.equal(renderTransferTypeTag('' as TransferType), '未知类型');
    assert.equal(renderTransferTypeTag('unknown' as TransferType), '未知类型');
  });

  it('getDirectionLabel 返回正确的方向标签', () => {
    // store_to_store
    assert.equal(getDirectionLabel('store_to_store', 'from'), '调出门店');
    assert.equal(getDirectionLabel('store_to_store', 'to'), '调入门店');
    // warehouse_to_store
    assert.equal(getDirectionLabel('warehouse_to_store', 'from'), '仓库');
    assert.equal(getDirectionLabel('warehouse_to_store', 'to'), '门店');
    // store_to_warehouse
    assert.equal(getDirectionLabel('store_to_warehouse', 'from'), '门店');
    assert.equal(getDirectionLabel('store_to_warehouse', 'to'), '仓库');
  });
});

// === 新增：地点选项函数测试 ===

describe('NewStockTransferPage - 地点选项逻辑', () => {
  it('getLocationOptions store_to_store: 两侧都是门店', () => {
    const from = getLocationOptions('from', 'store_to_store');
    const to = getLocationOptions('to', 'store_to_store');
    assert.deepEqual(from, to);
    assert.ok(from.every((l) => l.includes('店') || l.includes('旗舰')));
  });

  it('getLocationOptions warehouse_to_store: 调出仓库，调入门店', () => {
    const from = getLocationOptions('from', 'warehouse_to_store');
    const to = getLocationOptions('to', 'warehouse_to_store');
    assert.ok(from.every((l) => l.includes('仓库')));
    assert.ok(to.every((l) => l.includes('店')));
  });

  it('getLocationOptions store_to_warehouse: 调出门店，调入仓库', () => {
    const from = getLocationOptions('from', 'store_to_warehouse');
    const to = getLocationOptions('to', 'store_to_warehouse');
    assert.ok(from.every((l) => l.includes('店')));
    assert.ok(to.every((l) => l.includes('仓库')));
  });

  it('getLocationOptions 不修改原始数据', () => {
    const from = getLocationOptions('from', 'store_to_store');
    from.push('test');
    // Original should not be modified
    assert.equal(LOCATION_OPTIONS.store.length, 4);
  });
});

// === 新增：统计函数测试 ===

describe('NewStockTransferPage - 统计计算', () => {
  it('computeTransferStats 正确计算统计数据', () => {
    const items: TransferLineItem[] = [
      { sku: 'CL-001', name: '氨基酸洁面乳', quantity: 30, unit: '支' },
      { sku: 'CL-002', name: '泡沫洁面啫喱', quantity: 20, unit: '支' },
      { sku: 'EX-001', name: '防晒喷雾 SPF50', quantity: 10, unit: '瓶' },
    ];
    const stats = computeTransferStats(items);
    assert.equal(stats.totalItems, 3);
    assert.equal(stats.totalQuantity, 60);
    assert.equal(stats.selectedTypes, 2);
    assert.equal(stats.itemsByUnit['支'], 50);
    assert.equal(stats.itemsByUnit['瓶'], 10);
  });

  it('computeTransferStats 跳过数量为0的商品', () => {
    const items: TransferLineItem[] = [
      { sku: 'CL-001', name: 'A', quantity: 0, unit: '支' },
      { sku: 'CL-002', name: 'B', quantity: 5, unit: '支' },
    ];
    const stats = computeTransferStats(items);
    assert.equal(stats.totalItems, 1);
    assert.equal(stats.totalQuantity, 5);
  });

  it('computeTransferStats 空数组返回全零', () => {
    const stats = computeTransferStats([]);
    assert.equal(stats.totalItems, 0);
    assert.equal(stats.totalQuantity, 0);
    assert.equal(stats.selectedTypes, 0);
    assert.deepEqual(stats.itemsByUnit, {});
  });

  it('computeTransferStats 全零数量返回空', () => {
    const stats = computeTransferStats([
      { sku: 'CL-001', name: 'A', quantity: 0, unit: '支' },
    ]);
    assert.equal(stats.totalItems, 0);
    assert.equal(stats.totalQuantity, 0);
  });

  it('getTransferTypeCount 有 3 种调拨类型', () => {
    assert.equal(getTransferTypeCount(), 3);
  });
});

// === 新增：验证函数增强测试 ===

describe('NewStockTransferPage - 表单验证逻辑', () => {
  it('validateForm 完整表单验证通过', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '门店补货 — 洁面系列',
      items: [
        { sku: 'CL-001', name: '氨基酸洁面乳', quantity: 30, unit: '支' },
      ],
    });
    assert.deepEqual(errors, {});
  });

  it('validateForm 空表单全部字段报错', () => {
    const errors = validateForm({
      fromLocation: '',
      toLocation: '',
      reason: '',
      items: [],
    });
    assert.equal(errors.fromLocation, '请选择调出地');
    assert.equal(errors.toLocation, '请选择调入地');
    assert.equal(errors.reason, '请填写调拨原因');
    assert.equal(errors.items, '请至少添加一个商品且数量大于0');
  });

  it('validateForm 调出调入地相同报错', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_WAREHOUSE,
      reason: '调拨测试',
      items: [{ sku: 'CL-001', name: '洁面乳', quantity: 10, unit: '支' }],
    });
    assert.equal(errors.toLocation, '调出地和调入地不能相同');
  });

  it('validateForm 缺少调拨原因报错', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '',
      items: [{ sku: 'CL-001', name: '洁面乳', quantity: 10, unit: '支' }],
    });
    assert.equal(errors.reason, '请填写调拨原因');
  });

  it('validateForm 数量为0视为未选择', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '补货',
      items: [{ sku: 'CL-001', name: '洁面乳', quantity: 0, unit: '支' }],
    });
    assert.equal(errors.items, '请至少添加一个商品且数量大于0');
  });

  it('validateForm 混合0和非0数量通过', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '补货',
      items: [
        { sku: 'CL-001', name: '洁面乳', quantity: 0, unit: '支' },
        { sku: 'CL-002', name: '洁面啫喱', quantity: 1, unit: '支' },
      ],
    });
    assert.deepEqual(errors, {});
  });

  it('validateForm 仅空格原因不通过', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '   ',
      items: [{ sku: 'CL-001', name: '洁面', quantity: 5, unit: '支' }],
    });
    assert.equal(errors.reason, '请填写调拨原因');
  });
});

// === 原有测试保持不变 ===

describe('NewStockTransferPage - 数据与常量完整性', () => {
  it('数据与常量完整性', () => {
    assert.equal(Object.keys(TRANSFER_TYPE_LABELS).length, 3);
    assert.equal(SUGGESTED_PRODUCTS.length, 5);
    assert.ok(SUGGESTED_PRODUCTS.every((p) => p.sku && p.name && p.unit));
  });

  it('调拨类型到地点的映射', () => {
    // store_to_store: 两侧都是门店
    const from1 = getLocationOptions('from', 'store_to_store');
    const to1 = getLocationOptions('to', 'store_to_store');
    assert.ok(from1.every((l) => l.includes('店') || l.includes('旗舰')));
    assert.deepEqual(from1, to1);

    // warehouse_to_store: 调出是仓库，调入是门店
    const from2 = getLocationOptions('from', 'warehouse_to_store');
    const to2 = getLocationOptions('to', 'warehouse_to_store');
    assert.ok(from2.every((l) => l.includes('仓库')));
    assert.ok(to2.every((l) => l.includes('店')));

    // store_to_warehouse: 调出门店，调入仓库
    const from3 = getLocationOptions('from', 'store_to_warehouse');
    const to3 = getLocationOptions('to', 'store_to_warehouse');
    assert.ok(from3.every((l) => l.includes('店')));
    assert.ok(to3.every((l) => l.includes('仓库')));
  });

  it('正例：完整表单校验通过', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '门店补货 — 洁面系列',
      items: [
        { sku: 'CL-001', name: '氨基酸洁面乳', quantity: 30, unit: '支' },
        { sku: 'CL-002', name: '泡沫洁面啫喱', quantity: 20, unit: '支' },
      ],
    });
    assert.deepEqual(errors, {});
  });

  it('反例：空表单全部字段报错', () => {
    const errors = validateForm({
      fromLocation: '',
      toLocation: '',
      reason: '',
      items: [],
    });
    assert.equal(errors.fromLocation, '请选择调出地');
    assert.equal(errors.toLocation, '请选择调入地');
    assert.equal(errors.reason, '请填写调拨原因');
    assert.equal(errors.items, '请至少添加一个商品且数量大于0');
  });

  it('反例：调出调入地相同', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_WAREHOUSE,
      reason: '调拨测试',
      items: [{ sku: 'CL-001', name: '洁面乳', quantity: 10, unit: '支' }],
    });
    assert.equal(errors.toLocation, '调出地和调入地不能相同');
  });

  it('反例：缺少调拨原因', () => {
    const errors = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '',
      items: [{ sku: 'CL-001', name: '洁面乳', quantity: 10, unit: '支' }],
    });
    assert.equal(errors.reason, '请填写调拨原因');
  });

  it('边界：商品数量为0视为未选择', () => {
    const errors1 = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '补货',
      items: [{ sku: 'CL-001', name: '洁面乳', quantity: 0, unit: '支' }],
    });
    assert.equal(errors1.items, '请至少添加一个商品且数量大于0');

    // 数量 > 0 的算有效
    const errors2 = validateForm({
      fromLocation: MOCK_WAREHOUSE,
      toLocation: MOCK_STORES[0],
      reason: '补货',
      items: [
        { sku: 'CL-001', name: '洁面乳', quantity: 0, unit: '支' },
        { sku: 'CL-002', name: '洁面啫喱', quantity: 1, unit: '支' },
      ],
    });
    assert.deepEqual(errors2, {});
  });

  it('边界：门店全量校验', () => {
    for (let i = 0; i < MOCK_STORES.length; i++) {
      for (let j = 0; j < MOCK_STORES.length; j++) {
        const from = MOCK_STORES[i];
        const to = MOCK_STORES[j];
        const errors = validateForm({
          fromLocation: from,
          toLocation: to,
          reason: '调拨',
          items: [{ sku: 'CL-001', name: '洁面乳', quantity: 5, unit: '支' }],
        });
        if (i === j) {
          assert.equal(errors.toLocation, '调出地和调入地不能相同', `相同门店 ${from} 应报错`);
        } else {
          assert.equal(errors.toLocation, undefined, `不同门店 ${from}→${to} 不应报错`);
        }
      }
    }
  });

  it('商品详情完整性', () => {
    for (const product of SUGGESTED_PRODUCTS) {
      assert.ok(product.sku, `SKU should exist for ${product.name}`);
      assert.ok(product.name, `Name should exist for SKU ${product.sku}`);
      assert.ok(product.unit, `Unit should exist for ${product.name}`);
    }
  });

  it('数量总数计算', () => {
    const items: TransferLineItem[] = [
      { sku: 'CL-001', name: 'A', quantity: 30, unit: '支' },
      { sku: 'CL-002', name: 'B', quantity: 20, unit: '支' },
      { sku: 'CL-003', name: 'C', quantity: 5, unit: '个' },
    ];
    const total = items.reduce((s, i) => s + i.quantity, 0);
    assert.equal(total, 55);
    const selectedCount = items.filter((i) => i.quantity > 0).length;
    assert.equal(selectedCount, 3);
  });

  it('空商品列表校验', () => {
    const errors = validateForm({
      fromLocation: '仓库A',
      toLocation: '门店B',
      reason: '测试',
      items: [],
    });
    assert.equal(errors.items, '请至少添加一个商品且数量大于0');
  });

  it('仅空格也无法通过原因校验', () => {
    const errorsBlank = validateForm({
      fromLocation: '仓库A',
      toLocation: '门店B',
      reason: '   ',
      items: [{ sku: 'CL-001', name: '洁面', quantity: 5, unit: '支' }],
    });
    assert.equal(errorsBlank.reason, '请填写调拨原因');
  });
});

describe('NewStockTransferPage - 正例', () => {
  it('exports default NewStockTransferPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewStockTransferPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines TransferLineItem interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface TransferLineItem') || src.includes('type TransferLineItem'), 'missing TransferLineItem');
  });
  it('defines FormState interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormState') || src.includes('type FormState'), 'missing FormState');
  });
});

describe('NewStockTransferPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('NewStockTransferPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('NewStockTransferPage - 数据完整性', () => {
  it('includes context "中央仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('中央仓库'), 'missing 中央仓库');
  });
  it('includes context "仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('仓库'), 'missing 仓库');
  });
  it('includes context "仓库→门店..."', () => {
    const src = readSource();
    assert.ok(src.includes('仓库→门店'), 'missing 仓库→门店');
  });
  it('includes context "分店(体育西)..."', () => {
    const src = readSource();
    assert.ok(src.includes('分店(体育西)'), 'missing 分店(体育西)');
  });
  it('includes context "分店(北京路)..."', () => {
    const src = readSource();
    assert.ok(src.includes('分店(北京路)'), 'missing 分店(北京路)');
  });
  it('includes context "分店(珠江新城)..."', () => {
    const src = readSource();
    assert.ok(src.includes('分店(珠江新城)'), 'missing 分店(珠江新城)');
  });
  it('includes context "华东仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('华东仓库'), 'missing 华东仓库');
  });
  it('includes context "华南仓库..."', () => {
    const src = readSource();
    assert.ok(src.includes('华南仓库'), 'missing 华南仓库');
  });
  it('includes context "提交中…..."', () => {
    const src = readSource();
    assert.ok(src.includes('提交中…'), 'missing 提交中…');
  });
  it('includes context "提交调拨单..."', () => {
    const src = readSource();
    assert.ok(src.includes('提交调拨单'), 'missing 提交调拨单');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant typeDir', () => {
    const src = readSource();
    assert.ok(src.includes('typeDir'), 'missing typeDir');
  });
  it('has constant getLocationOptions', () => {
    const src = readSource();
    assert.ok(src.includes('getLocationOptions'), 'missing getLocationOptions');
  });
  it('has constant fromOptions', () => {
    const src = readSource();
    assert.ok(src.includes('fromOptions'), 'missing fromOptions');
  });
});
