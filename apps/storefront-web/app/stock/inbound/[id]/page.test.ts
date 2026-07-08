/**
 * 入库接收处理页 — 数据层单元测试
 * 验证: 状态映射、统计逻辑、Mock 数据完整性
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 类型定义 (与 page.tsx 同步) ----

type InboundStatus = 'pending' | 'inspecting' | 'shelving' | 'completed' | 'cancelled';

const STATUS_MAP: Record<InboundStatus, string> = {
  pending: '待验收',
  inspecting: '质检中',
  shelving: '上架中',
  completed: '已完成',
  cancelled: '已取消',
};

interface InboundItem {
  sku: string;
  name: string;
  expectedQty: number;
  inspectedQty: number;
  passQty: number;
  failQty: number;
  unit: string;
  status: 'pending' | 'passed' | 'failed';
}

interface InboundDetail {
  id: string;
  orderNo: string;
  poNo: string;
  supplier: string;
  status: InboundStatus;
  items: InboundItem[];
  totalExpected: number;
  totalInspected: number;
  totalPassed: number;
  totalFailed: number;
  createdAt: string;
  expectedAt: string;
  completedAt?: string;
  operator?: string;
  notes?: string;
}

function getMockInbound(id: string): InboundDetail {
  return {
    id,
    orderNo: `IN-${id}`,
    poNo: 'PO-2024-0689',
    supplier: '云南咖啡基地',
    status: 'inspecting',
    items: [
      { sku: 'SKU-001', name: '哥伦比亚精品咖啡豆', expectedQty: 200, inspectedQty: 180, passQty: 175, failQty: 5, unit: '袋', status: 'passed' },
      { sku: 'SKU-002', name: '埃塞俄比亚耶加雪菲', expectedQty: 150, inspectedQty: 150, passQty: 150, failQty: 0, unit: '袋', status: 'passed' },
      { sku: 'SKU-003', name: '有机抹茶粉', expectedQty: 100, inspectedQty: 80, passQty: 70, failQty: 10, unit: '罐', status: 'failed' },
      { sku: 'SKU-004', name: '法式烘焙混合豆', expectedQty: 250, inspectedQty: 0, passQty: 0, failQty: 0, unit: '袋', status: 'pending' },
      { sku: 'SKU-005', name: '阿拉比卡挂耳包', expectedQty: 100, inspectedQty: 100, passQty: 100, failQty: 0, unit: '盒', status: 'passed' },
    ],
    totalExpected: 800,
    totalInspected: 510,
    totalPassed: 495,
    totalFailed: 15,
    createdAt: '2024-06-30 09:00',
    expectedAt: '2024-06-30 14:00',
    operator: '张三',
    notes: '注意抹茶粉包装有破损，需退回供应商。',
  };
}

// ---- 辅助函数 ----

function computeSummary(items: InboundItem[]) {
  return {
    totalExpected: items.reduce((s, i) => s + i.expectedQty, 0),
    totalInspected: items.reduce((s, i) => s + i.inspectedQty, 0),
    totalPassed: items.reduce((s, i) => s + i.passQty, 0),
    totalFailed: items.reduce((s, i) => s + i.failQty, 0),
  };
}

// ---- Tests ----

describe('入库接收页 - 状态映射', () => {
  it('所有入库状态都有对应的显示标签', () => {
    const allStatuses: InboundStatus[] = ['pending', 'inspecting', 'shelving', 'completed', 'cancelled'];
    for (const s of allStatuses) {
      assert.ok(STATUS_MAP[s], `状态 ${s} 应有标签`);
      assert.ok(STATUS_MAP[s].length > 0);
    }
  });

  it('所有状态标签唯一', () => {
    const labels = Object.values(STATUS_MAP);
    assert.strictEqual(new Set(labels).size, labels.length);
  });
});

describe('入库接收页 - Mock 数据完整性', () => {
  it('Mock 入库单包含所有必要字段', () => {
    const d = getMockInbound('INB-001');
    const requiredFields: (keyof InboundDetail)[] = [
      'id', 'orderNo', 'poNo', 'supplier', 'status', 'items',
      'totalExpected', 'totalInspected', 'totalPassed', 'totalFailed',
      'createdAt', 'expectedAt',
    ];
    for (const f of requiredFields) {
      assert.ok(f in d, `缺少字段: ${f}`);
    }
  });

  it('Mock 数据字段类型正确', () => {
    const d = getMockInbound('INB-001');
    assert.strictEqual(typeof d.id, 'string');
    assert.strictEqual(typeof d.totalExpected, 'number');
    assert.ok(d.items.length > 0);
  });

  it('Mock 包含所有 5 个商品', () => {
    const d = getMockInbound('INB-001');
    assert.strictEqual(d.items.length, 5);
  });

  it('Mock 商品包含三种不同质检状态', () => {
    const d = getMockInbound('INB-001');
    const statuses = new Set(d.items.map((i) => i.status));
    assert.ok(statuses.has('passed'));
    assert.ok(statuses.has('failed'));
    assert.ok(statuses.has('pending'));
  });
});

describe('入库接收页 - 统计数据计算', () => {
  it('入库商品的 per-item 检查: failQty = inspectedQty - passQty', () => {
    const d = getMockInbound('INB-001');
    for (const item of d.items) {
      assert.strictEqual(
        item.failQty,
        item.inspectedQty - item.passQty,
        `${item.sku}: failQty 应为 inspectedQty(${item.inspectedQty}) - passQty(${item.passQty})`,
      );
    }
  });

  it('汇总统计与 Mock 数据一致', () => {
    const d = getMockInbound('INB-001');
    const computed = computeSummary(d.items);
    assert.strictEqual(computed.totalExpected, d.totalExpected);
    assert.strictEqual(computed.totalInspected, d.totalInspected);
    assert.strictEqual(computed.totalPassed, d.totalPassed);
    assert.strictEqual(computed.totalFailed, d.totalFailed);
  });

  it('合格 + 不合格 = 已检验', () => {
    const d = getMockInbound('INB-001');
    assert.strictEqual(d.totalPassed + d.totalFailed, d.totalInspected);
  });

  it('已检验不超过预期总数', () => {
    const d = getMockInbound('INB-001');
    assert.ok(d.totalInspected <= d.totalExpected);
  });
});

describe('入库接收页 - 边界情况', () => {
  it('待检商品的各项数量应为 0', () => {
    const d = getMockInbound('INB-001');
    const pendingItem = d.items.find((i) => i.status === 'pending');
    assert.ok(pendingItem);
    assert.strictEqual(pendingItem.inspectedQty, 0);
    assert.strictEqual(pendingItem.passQty, 0);
    assert.strictEqual(pendingItem.failQty, 0);
  });

  it('完全合格商品的 failQty 与 inspectedQty - passQty 一致', () => {
    const d = getMockInbound('INB-001');
    for (const item of d.items) {
      assert.strictEqual(item.failQty, item.inspectedQty - item.passQty,
        `${item.sku}: failQty(${item.failQty}) !== inspectedQty(${item.inspectedQty}) - passQty(${item.passQty})`);
    }
  });

  it('不合格商品的 failQty > 0', () => {
    const d = getMockInbound('INB-001');
    const failedItem = d.items.find((i) => i.status === 'failed');
    assert.ok(failedItem);
    assert.ok(failedItem.failQty > 0);
  });
});
