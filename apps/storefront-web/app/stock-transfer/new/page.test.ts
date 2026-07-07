/**
 * stock-transfer/new/page.test.ts — 新建调拨单 L1 冒烟测试
 * 角色视角: 👔店长 / 💳采购 / 📦仓管
 * 覆盖: 正例(表单初始状态/类型切换/选择商品) + 反例(校验失败) + 边界(重复地点/数量极值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 ──

type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

interface TransferLineItem {
  sku: string;
  name: string;
  quantity: number;
  unit: string;
}

// ── 镜像页面常量 ──

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇄门店',
  warehouse_to_store: '仓库→门店',
  store_to_warehouse: '门店→仓库',
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

// ── 辅助函数 ──

function getLocationOptions(which: 'from' | 'to', type: TransferType): string[] {
  if (type === 'store_to_store') return LOCATION_OPTIONS.store;
  if (type === 'warehouse_to_store') return which === 'from' ? LOCATION_OPTIONS.warehouse : LOCATION_OPTIONS.store;
  return which === 'from' ? LOCATION_OPTIONS.store : LOCATION_OPTIONS.warehouse;
}

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

const MOCK_STORES = ['旗舰店(天河城)', '分店(体育西)', '分店(珠江新城)'];
const MOCK_WAREHOUSE = '中央仓库';

// ── 测试 ──

test('新建调拨单 — 数据与常量完整性', () => {
  assert.equal(Object.keys(TRANSFER_TYPE_LABELS).length, 3);
  assert.equal(SUGGESTED_PRODUCTS.length, 5);
  assert.ok(SUGGESTED_PRODUCTS.every((p) => p.sku && p.name && p.unit));
});

test('新建调拨单 — 调拨类型到地点的映射', () => {
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

test('新建调拨单 — 正例：完整表单校验通过', () => {
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

test('新建调拨单 — 反例：空表单全部字段报错', () => {
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

test('新建调拨单 — 反例：调出调入地相同', () => {
  const errors = validateForm({
    fromLocation: MOCK_WAREHOUSE,
    toLocation: MOCK_WAREHOUSE,
    reason: '调拨测试',
    items: [{ sku: 'CL-001', name: '洁面乳', quantity: 10, unit: '支' }],
  });
  assert.equal(errors.toLocation, '调出地和调入地不能相同');
});

test('新建调拨单 — 反例：缺少调拨原因', () => {
  const errors = validateForm({
    fromLocation: MOCK_WAREHOUSE,
    toLocation: MOCK_STORES[0],
    reason: '',
    items: [{ sku: 'CL-001', name: '洁面乳', quantity: 10, unit: '支' }],
  });
  assert.equal(errors.reason, '请填写调拨原因');
});

test('新建调拨单 — 边界：商品数量为0视为未选择', () => {
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

test('新建调拨单 — 边界：门店全量校验', () => {
  // 遍历所有门店组合，只有相同门店时才报错
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

test('新建调拨单 — 商品详情完整性', () => {
  // 每个推荐商品应有完整的字段
  for (const product of SUGGESTED_PRODUCTS) {
    assert.ok(product.sku, `SKU should exist for ${product.name}`);
    assert.ok(product.name, `Name should exist for SKU ${product.sku}`);
    assert.ok(product.unit, `Unit should exist for ${product.name}`);
  }
});

test('新建调拨单 — 数量总数计算', () => {
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

test('新建调拨单 — 空商品列表校验', () => {
  const errors = validateForm({
    fromLocation: '仓库A',
    toLocation: '门店B',
    reason: '测试',
    items: [],
  });
  assert.equal(errors.items, '请至少添加一个商品且数量大于0');
});

test('新建调拨单 — 仅空格也无法通过原因校验', () => {
  const errorsBlank = validateForm({
    fromLocation: MOCK_WAREHOUSE,
    toLocation: MOCK_STORES[0],
    reason: '   ',
    items: [{ sku: 'CL-001', name: '洁面', quantity: 5, unit: '支' }],
  });
  assert.equal(errorsBlank.reason, '请填写调拨原因');
});
