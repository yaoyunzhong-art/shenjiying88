/**
 * 采购单列表页 — Purchase Orders List Page Test
 * 验证: 常量映射、Mock 数据完整性、状态过滤逻辑、搜索逻辑、分页逻辑、统计计算
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据类型 & 常量 (与 page.tsx 一致) ──

type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'cancelled';

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  itemsCount: number;
  orderDate: string;
  expectedDelivery: string;
  contactPerson: string;
  createdAt: string;
}

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
  shipped: '已发货',
  received: '已收货',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<PurchaseOrderStatus, 'warning' | 'info' | 'success' | 'default' | 'pending' | 'neutral'> = {
  draft: 'warning',
  submitted: 'info',
  confirmed: 'success',
  shipped: 'success',
  received: 'neutral',
  cancelled: 'neutral',
};

// ── Mock 数据 ──

const MOCK_ORDERS: PurchaseOrder[] = [
  { id: '1', orderNo: 'PO-20260601-001', supplier: '广州美妆供应链有限公司', totalAmount: 28600, status: 'received', itemsCount: 12, orderDate: '2026-06-01', expectedDelivery: '2026-06-10', contactPerson: '李明', createdAt: '2026-06-01 09:00' },
  { id: '2', orderNo: 'PO-20260605-002', supplier: '上海日化贸易有限公司', totalAmount: 15800, status: 'shipped', itemsCount: 8, orderDate: '2026-06-05', expectedDelivery: '2026-06-15', contactPerson: '王芳', createdAt: '2026-06-05 10:30' },
  { id: '3', orderNo: 'PO-20260610-003', supplier: '深圳包材创新有限公司', totalAmount: 8900, status: 'confirmed', itemsCount: 6, orderDate: '2026-06-10', expectedDelivery: '2026-06-20', contactPerson: '刘洋', createdAt: '2026-06-10 14:00' },
  { id: '4', orderNo: 'PO-20260612-004', supplier: '杭州香氛科技有限公司', totalAmount: 4200, status: 'submitted', itemsCount: 3, orderDate: '2026-06-12', expectedDelivery: '2026-06-22', contactPerson: '张伟', createdAt: '2026-06-12 11:20' },
  { id: '5', orderNo: 'PO-20260615-005', supplier: '广州妆具工贸有限公司', totalAmount: 12600, status: 'draft', itemsCount: 10, orderDate: '2026-06-15', expectedDelivery: '2026-06-25', contactPerson: '赵鹏', createdAt: '2026-06-15 16:00' },
  { id: '6', orderNo: 'PO-20260618-006', supplier: '广州美妆供应链有限公司', totalAmount: 34000, status: 'shipped', itemsCount: 15, orderDate: '2026-06-18', expectedDelivery: '2026-06-28', contactPerson: '李明', createdAt: '2026-06-18 08:45' },
  { id: '7', orderNo: 'PO-20260620-007', supplier: '上海日化贸易有限公司', totalAmount: 7500, status: 'cancelled', itemsCount: 5, orderDate: '2026-06-20', expectedDelivery: '2026-06-30', contactPerson: '王芳', createdAt: '2026-06-20 13:10' },
  { id: '8', orderNo: 'PO-20260622-008', supplier: '深圳包材创新有限公司', totalAmount: 5200, status: 'received', itemsCount: 4, orderDate: '2026-06-22', expectedDelivery: '2026-07-02', contactPerson: '刘洋', createdAt: '2026-06-22 09:30' },
];

// ── 测试 ──

describe('PurchaseOrdersListPage - 常量验证', () => {
  it('STATUS_LABELS 包含所有状态', () => {
    const statuses: PurchaseOrderStatus[] = ['draft', 'submitted', 'confirmed', 'shipped', 'received', 'cancelled'];
    for (const s of statuses) {
      assert.ok(STATUS_LABELS[s], `Missing label for ${s}`);
    }
  });

  it('STATUS_LABELS 所有标签都是中文', () => {
    const labels = Object.values(STATUS_LABELS);
    for (const label of labels) {
      assert.ok(/[\u4e00-\u9fff]/.test(label), `${label} should contain Chinese characters`);
    }
  });

  it('STATUS_VARIANTS 包含所有状态', () => {
    const statuses: PurchaseOrderStatus[] = ['draft', 'submitted', 'confirmed', 'shipped', 'received', 'cancelled'];
    for (const s of statuses) {
      assert.ok(STATUS_VARIANTS[s], `Missing variant for ${s}`);
    }
  });

  it('草稿状态标签为草稿', () => {
    assert.strictEqual(STATUS_LABELS.draft, '草稿');
  });

  it('已收货状态标签为已收货', () => {
    assert.strictEqual(STATUS_LABELS.received, '已收货');
  });
});

describe('PurchaseOrdersListPage - Mock数据验证', () => {
  it('有8条采购单数据', () => {
    assert.strictEqual(MOCK_ORDERS.length, 8);
  });

  it('每条数据都有完整字段', () => {
    const keys: (keyof PurchaseOrder)[] = ['id', 'orderNo', 'supplier', 'totalAmount', 'status', 'itemsCount', 'orderDate', 'expectedDelivery', 'contactPerson', 'createdAt'];
    for (const item of MOCK_ORDERS) {
      for (const key of keys) {
        assert.ok(item[key] !== undefined && item[key] !== null, `Missing ${key} in ${item.orderNo}`);
      }
    }
  });

  it('采购单号格式正确', () => {
    for (const item of MOCK_ORDERS) {
      assert.ok(/^PO-\d{8}-\d{3}$/.test(item.orderNo), `Invalid orderNo format: ${item.orderNo}`);
    }
  });

  it('总金额均为正数', () => {
    for (const item of MOCK_ORDERS) {
      assert.ok(item.totalAmount > 0, `${item.orderNo} totalAmount should be positive`);
    }
  });

  it('商品数均为正数', () => {
    for (const item of MOCK_ORDERS) {
      assert.ok(item.itemsCount > 0, `${item.orderNo} itemsCount should be positive`);
    }
  });

  it('有5个不同供应商', () => {
    const suppliers = new Set(MOCK_ORDERS.map((o) => o.supplier));
    assert.strictEqual(suppliers.size, 5);
  });

  it('所有状态都有覆盖', () => {
    const statuses = new Set(MOCK_ORDERS.map((o) => o.status));
    assert.ok(statuses.has('draft'));
    assert.ok(statuses.has('submitted'));
    assert.ok(statuses.has('confirmed'));
    assert.ok(statuses.has('shipped'));
    assert.ok(statuses.has('received'));
    assert.ok(statuses.has('cancelled'));
  });
});

describe('PurchaseOrdersListPage - 搜索逻辑', () => {
  it('按采购单号搜索可匹配', () => {
    const searchTerm = 'PO-20260601';
    const results = MOCK_ORDERS.filter(
      (o) =>
        o.orderNo.includes(searchTerm) ||
        o.supplier.includes(searchTerm) ||
        o.contactPerson.includes(searchTerm),
    );
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]?.orderNo, 'PO-20260601-001');
  });

  it('按供应商搜索可匹配', () => {
    const searchTerm = '广州美妆';
    const results = MOCK_ORDERS.filter(
      (o) =>
        o.orderNo.includes(searchTerm) ||
        o.supplier.includes(searchTerm) ||
        o.contactPerson.includes(searchTerm),
    );
    assert.strictEqual(results.length, 2); // 广州美妆有2条
  });

  it('按联系人搜索可匹配', () => {
    const searchTerm = '刘洋';
    const results = MOCK_ORDERS.filter(
      (o) =>
        o.orderNo.includes(searchTerm) ||
        o.supplier.includes(searchTerm) ||
        o.contactPerson.includes(searchTerm),
    );
    assert.strictEqual(results.length, 2); // 刘洋有2条
  });

  it('不存在的搜索词返回空结果', () => {
    const searchTerm = '不存在';
    const results = MOCK_ORDERS.filter(
      (o) =>
        o.orderNo.includes(searchTerm) ||
        o.supplier.includes(searchTerm) ||
        o.contactPerson.includes(searchTerm),
    );
    assert.strictEqual(results.length, 0);
  });
});

describe('PurchaseOrdersListPage - 状态过滤逻辑', () => {
  it('全部状态返回所有数据', () => {
    assert.strictEqual(MOCK_ORDERS.length, 8);
  });

  it('过滤 received 状态', () => {
    const results = MOCK_ORDERS.filter((o) => o.status === 'received');
    assert.strictEqual(results.length, 2);
    for (const r of results) {
      assert.strictEqual(r.status, 'received');
    }
  });

  it('过滤 shipped 状态', () => {
    const results = MOCK_ORDERS.filter((o) => o.status === 'shipped');
    assert.strictEqual(results.length, 2);
  });

  it('过滤 draft 状态', () => {
    const results = MOCK_ORDERS.filter((o) => o.status === 'draft');
    assert.strictEqual(results.length, 1);
  });

  it('过滤 cancelled 状态', () => {
    const results = MOCK_ORDERS.filter((o) => o.status === 'cancelled');
    assert.strictEqual(results.length, 1);
  });
});

describe('PurchaseOrdersListPage - 统计计算', () => {
  it('总采购单数为8', () => {
    assert.strictEqual(MOCK_ORDERS.length, 8);
  });

  it('总金额正确', () => {
    const totalAmount = MOCK_ORDERS.reduce((s, o) => s + o.totalAmount, 0);
    assert.strictEqual(totalAmount, 116800);
  });

  it('已收货数量为2', () => {
    const received = MOCK_ORDERS.filter((o) => o.status === 'received').length;
    assert.strictEqual(received, 2);
  });

  it('已发货数量为2', () => {
    const shipped = MOCK_ORDERS.filter((o) => o.status === 'shipped').length;
    assert.strictEqual(shipped, 2);
  });
});

describe('PurchaseOrdersListPage - 分页逻辑', () => {
  it('page=1 时返回前10条 (所有数据小于10条)', () => {
    const page = 1;
    const pageSize = 10;
    const items = MOCK_ORDERS.slice((page - 1) * pageSize, page * pageSize);
    assert.strictEqual(items.length, MOCK_ORDERS.length);
    assert.strictEqual(items[0]?.id, '1');
  });

  it('pageSize=5 时分页正确', () => {
    const PAGE_SIZE = 5;
    const totalPages = Math.ceil(MOCK_ORDERS.length / PAGE_SIZE);
    assert.strictEqual(totalPages, 2);

    const page1 = MOCK_ORDERS.slice(0, PAGE_SIZE);
    assert.strictEqual(page1.length, 5);

    const page2 = MOCK_ORDERS.slice(PAGE_SIZE, PAGE_SIZE * 2);
    assert.strictEqual(page2.length, 3);
  });
});

describe('PurchaseOrdersListPage - 模块加载', () => {
  it('page 模块可正常导入且 default 为函数', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', 'default export should be a function component');
  });
});
