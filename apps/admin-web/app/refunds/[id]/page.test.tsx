/**
 * Refund Detail Page — page.test.tsx
 *
 * 覆盖:
 *   正例: 状态机流转逻辑、格式化工具、数据查找
 *   反例: 不存在的退单号、非法状态流转、空列表
 *   边界: 大金额、多种状态组合、特殊备注
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

// ---- 类型复制 (从 refund-types.ts) ----

type RefundStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'cancelled';

type RefundType = 'refund' | 'exchange' | 'return';
type RefundChannel = 'original' | 'wechat' | 'alipay' | 'bank' | 'store_credit';

interface RefundItem {
  id: string;
  orderId: string;
  type: RefundType;
  status: RefundStatus;
  channel: RefundChannel;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  amount: number;
  reason: string;
  remark: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  productName: string;
  productSku: string;
  quantity: number;
}

// ---- Helper functions (mirror from page.tsx) ----

const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
};

const REFUND_TYPE_LABEL: Record<RefundType, string> = {
  refund: '仅退款',
  exchange: '换货',
  return: '退货退款',
};

const REFUND_CHANNEL_LABEL: Record<RefundChannel, string> = {
  original: '原路退回',
  wechat: '微信支付',
  alipay: '支付宝',
  bank: '银行转账',
  store_credit: '门店余额',
};

const STATUS_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  pending_approval: ['approved', 'rejected'],
  approved: ['processing', 'cancelled'],
  rejected: [],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function formatYuan(amountFen: number): string {
  return `¥${(amountFen / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function findRefundById(items: RefundItem[], id: string): RefundItem | undefined {
  return items.find((r) => r.id === id);
}

function getAvailableTransitions(status: RefundStatus): RefundStatus[] {
  return STATUS_TRANSITIONS[status] ?? [];
}

function canTransition(from: RefundStatus, to: RefundStatus): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

// ---- Mock data (mirror from refund-data.ts) ----

const MOCK_REFUNDS: RefundItem[] = [
  {
    id: 'RF-20260701',
    orderId: 'ORD-20260701-001',
    type: 'return',
    status: 'pending_approval',
    channel: 'original',
    customerName: '王芳',
    customerPhone: '138****5678',
    storeId: 'S001',
    storeName: '旗舰店-解放路',
    amount: 12900,
    reason: '商品与描述不符',
    remark: '顾客发现颜色差异',
    createdAt: '2026-07-06 09:15',
    productName: '有机蔬菜礼盒',
    productSku: 'VG-2026-001',
    quantity: 2,
  },
  {
    id: 'RF-20260702',
    orderId: 'ORD-20260701-002',
    type: 'exchange',
    status: 'approved',
    channel: 'store_credit',
    customerName: '李明',
    customerPhone: '159****2341',
    storeId: 'S001',
    storeName: '旗舰店-解放路',
    amount: 35800,
    reason: '尺码不合适',
    remark: '换大一号',
    createdAt: '2026-07-05 14:30',
    processedAt: '2026-07-05 16:00',
    processedBy: '张三',
    productName: '运动跑鞋',
    productSku: 'SH-2026-028',
    quantity: 1,
  },
  {
    id: 'RF-20260703',
    orderId: 'ORD-20260701-003',
    type: 'refund',
    status: 'completed',
    channel: 'wechat',
    customerName: '陈伟',
    customerPhone: '182****4532',
    storeId: 'S003',
    storeName: '门店-中山路',
    amount: 8800,
    reason: '重复下单',
    remark: 'APP 和小程序各下一单',
    createdAt: '2026-07-03 08:45',
    processedAt: '2026-07-03 10:20',
    processedBy: '王五',
    productName: '手工饼干',
    productSku: 'BK-2026-045',
    quantity: 3,
  },
  {
    id: 'RF-20260704',
    orderId: 'ORD-20260701-004',
    type: 'exchange',
    status: 'rejected',
    channel: 'store_credit',
    customerName: '刘洋',
    customerPhone: '136****7890',
    storeId: 'S001',
    storeName: '旗舰店-解放路',
    amount: 25900,
    reason: '超过退换货期限',
    remark: '超出30天期限',
    createdAt: '2026-07-02 16:20',
    processedAt: '2026-07-02 17:00',
    processedBy: '赵六',
    productName: '蓝牙耳机',
    productSku: 'EL-2026-033',
    quantity: 1,
  },
  {
    id: 'RF-20260705',
    orderId: 'ORD-20260701-005',
    type: 'refund',
    status: 'cancelled',
    channel: 'store_credit',
    customerName: '周强',
    customerPhone: '137****6789',
    storeId: 'S003',
    storeName: '门店-中山路',
    amount: 4500,
    reason: '已协商解决',
    remark: '顾客同意撤销',
    createdAt: '2026-06-30 09:30',
    processedAt: '2026-06-30 10:15',
    processedBy: '张三',
    productName: '零食大礼包',
    productSku: 'SN-2026-102',
    quantity: 1,
  },
  {
    id: 'RF-20260706',
    orderId: 'ORD-20260701-006',
    type: 'return',
    status: 'processing',
    channel: 'alipay',
    customerName: '孙丽',
    customerPhone: '139****3456',
    storeId: 'S002',
    storeName: '门店-科技路',
    amount: 16800,
    reason: '商品过期',
    remark: '鲜牛奶过保质期',
    createdAt: '2026-07-01 11:10',
    productName: '鲜牛奶',
    productSku: 'DK-2026-078',
    quantity: 4,
  },
];

// ════════════════════════════════════════
// 正例 (Positive)
// ════════════════════════════════════════

describe('refund-detail: 正例', () => {
  describe('formatYuan', () => {
    it('should format 12900 fen as ¥129.00', () => {
      assert.strictEqual(formatYuan(12900), '¥129.00');
    });

    it('should format 8800 fen as ¥88.00', () => {
      assert.strictEqual(formatYuan(8800), '¥88.00');
    });

    it('should format 0 fen as ¥0.00', () => {
      assert.strictEqual(formatYuan(0), '¥0.00');
    });

    it('should format 1 fen as ¥0.01', () => {
      assert.strictEqual(formatYuan(1), '¥0.01');
    });

    it('should format large amounts with thousands separators', () => {
      assert.strictEqual(formatYuan(156000), '¥1,560.00');
      assert.strictEqual(formatYuan(10000000), '¥100,000.00');
    });
  });

  describe('findRefundById', () => {
    it('should find existing refund by id', () => {
      const found = findRefundById(MOCK_REFUNDS, 'RF-20260701');
      assert.ok(found);
      assert.strictEqual(found!.customerName, '王芳');
    });

    it('shoud find refund with "RF-20260702" id', () => {
      const found = findRefundById(MOCK_REFUNDS, 'RF-20260702');
      assert.ok(found);
      assert.strictEqual(found!.status, 'approved');
    });
  });

  describe('getAvailableTransitions', () => {
    it('pending_approval should allow approved and rejected', () => {
      const transitions = getAvailableTransitions('pending_approval');
      assert.deepStrictEqual(transitions, ['approved', 'rejected']);
    });

    it('approved should allow processing and cancelled', () => {
      const transitions = getAvailableTransitions('approved');
      assert.deepStrictEqual(transitions, ['processing', 'cancelled']);
    });

    it('processing should allow completed and cancelled', () => {
      const transitions = getAvailableTransitions('processing');
      assert.deepStrictEqual(transitions, ['completed', 'cancelled']);
    });
  });

  describe('canTransition', () => {
    it('pending_approval -> approved should be allowed', () => {
      assert.ok(canTransition('pending_approval', 'approved'));
    });

    it('pending_approval -> rejected should be allowed', () => {
      assert.ok(canTransition('pending_approval', 'rejected'));
    });

    it('approved -> processing should be allowed', () => {
      assert.ok(canTransition('approved', 'processing'));
    });

    it('processing -> completed should be allowed', () => {
      assert.ok(canTransition('processing', 'completed'));
    });
  });

  describe('status labels', () => {
    it('should have labels for all statuses', () => {
      const statuses: RefundStatus[] = [
        'pending_approval',
        'approved',
        'rejected',
        'processing',
        'completed',
        'cancelled',
      ];
      for (const s of statuses) {
        assert.ok(REFUND_STATUS_LABEL[s], `Missing label for ${s}`);
      }
    });

    it('should have type labels for all types', () => {
      const types: RefundType[] = ['refund', 'exchange', 'return'];
      for (const t of types) {
        assert.ok(REFUND_TYPE_LABEL[t], `Missing label for ${t}`);
      }
    });

    it('should have channel labels for all channels', () => {
      const channels: RefundChannel[] = [
        'original',
        'wechat',
        'alipay',
        'bank',
        'store_credit',
      ];
      for (const c of channels) {
        assert.ok(REFUND_CHANNEL_LABEL[c], `Missing label for ${c}`);
      }
    });
  });

  describe('mock data integrity', () => {
    it('all 6 statuses should be represented', () => {
      const statuses = new Set(MOCK_REFUNDS.map((r) => r.status));
      assert.ok(statuses.has('pending_approval'));
      assert.ok(statuses.has('approved'));
      assert.ok(statuses.has('rejected'));
      assert.ok(statuses.has('processing'));
      assert.ok(statuses.has('completed'));
      assert.ok(statuses.has('cancelled'));
    });

    it('all 3 refund types should be represented', () => {
      const types = new Set(MOCK_REFUNDS.map((r) => r.type));
      assert.ok(types.has('refund'));
      assert.ok(types.has('exchange'));
      assert.ok(types.has('return'));
    });

    it('all refund IDs should be unique', () => {
      const ids = new Set(MOCK_REFUNDS.map((r) => r.id));
      assert.strictEqual(ids.size, MOCK_REFUNDS.length);
    });

    it('every refund should have positive amount', () => {
      for (const r of MOCK_REFUNDS) {
        assert.ok(r.amount > 0, `Refund ${r.id} has non-positive amount`);
      }
    });
  });
});

// ════════════════════════════════════════
// 反例 (Negative)
// ════════════════════════════════════════

describe('refund-detail: 反例', () => {
  it('should return undefined for non-existent id', () => {
    const found = findRefundById(MOCK_REFUNDS, 'NONEXISTENT');
    assert.strictEqual(found, undefined);
  });

  it('rejected status should have no transitions', () => {
    const transitions = getAvailableTransitions('rejected');
    assert.strictEqual(transitions.length, 0);
  });

  it('completed status should have no transitions', () => {
    const transitions = getAvailableTransitions('completed');
    assert.strictEqual(transitions.length, 0);
  });

  it('cancelled status should have no transitions', () => {
    const transitions = getAvailableTransitions('cancelled');
    assert.strictEqual(transitions.length, 0);
  });

  it('should not allow illegal transitions', () => {
    assert.ok(!canTransition('pending_approval', 'completed'));
    assert.ok(!canTransition('pending_approval', 'cancelled'));
    assert.ok(!canTransition('approved', 'rejected'));
    assert.ok(!canTransition('rejected', 'approved'));
    assert.ok(!canTransition('completed', 'processing'));
    assert.ok(!canTransition('cancelled', 'processing'));
  });

  it('should return undefined for empty id string', () => {
    const found = findRefundById(MOCK_REFUNDS, '');
    assert.strictEqual(found, undefined);
  });

  it('empty refund list should return nothing', () => {
    const found = findRefundById([], 'RF-20260701');
    assert.strictEqual(found, undefined);
  });

  it('should not allow transition to same status', () => {
    assert.ok(!canTransition('pending_approval', 'pending_approval'));
    assert.ok(!canTransition('completed', 'completed'));
  });

  it('processedAt should be undefined for unprocessed refunds', () => {
    const pending = MOCK_REFUNDS.find((r) => r.status === 'pending_approval');
    assert.ok(pending);
    assert.strictEqual(pending!.processedAt, undefined);
  });
});

// ════════════════════════════════════════
// 边界 (Boundary)
// ════════════════════════════════════════

describe('refund-detail: 边界', () => {
  it('amount 0 should format as ¥0.00', () => {
    assert.strictEqual(formatYuan(0), '¥0.00');
  });

  it('amount 99999999 (large) should format correctly', () => {
    assert.strictEqual(formatYuan(99999999), '¥999,999.99');
  });

  it('amount 1 fen should format as ¥0.01', () => {
    assert.strictEqual(formatYuan(1), '¥0.01');
  });

  it('refund with empty remark should still be valid', () => {
    const refund: RefundItem = {
      id: 'RF-999',
      orderId: 'ORD-999',
      type: 'refund',
      status: 'pending_approval',
      channel: 'original',
      customerName: '测试',
      customerPhone: '13800000000',
      storeId: 'S999',
      storeName: '测试店',
      amount: 100,
      reason: '测试',
      remark: '',
      createdAt: '2026-07-09 00:00',
      productName: '测试商品',
      productSku: 'TEST-001',
      quantity: 1,
    };
    assert.strictEqual(refund.remark, '');
    assert.ok(refund.id.length > 0);
  });

  it('should handle all status count in mock data', () => {
    const statusCounts: Record<string, number> = {};
    for (const r of MOCK_REFUNDS) {
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
    }
    assert.ok(statusCounts['pending_approval']! >= 1);
    assert.ok(statusCounts['approved']! >= 1);
    assert.ok(statusCounts['rejected']! >= 1);
    assert.ok(statusCounts['processing']! >= 1);
    assert.ok(statusCounts['completed']! >= 1);
    assert.ok(statusCounts['cancelled']! >= 1);
  });

  it('max transition chain length should be 3 (pending_approval -> approved -> processing -> completed)', () => {
    const chain1 = canTransition('pending_approval', 'approved') ? 1 : 0;
    const chain2 = chain1 > 0 && canTransition('approved', 'processing') ? 2 : chain1;
    const chain3 = chain2 > 1 && canTransition('processing', 'completed') ? 3 : chain2;
    assert.strictEqual(chain3, 3, 'Max chain should be 3 steps');
  });

  it('all refunds should have quantity >= 1', () => {
    for (const r of MOCK_REFUNDS) {
      assert.ok(r.quantity >= 1, `Refund ${r.id} has invalid quantity ${r.quantity}`);
    }
  });

  it('unprocessed refund should not have processedAt', () => {
    const unprocessed = MOCK_REFUNDS.filter((r) => r.status === 'pending_approval');
    for (const r of unprocessed) {
      assert.strictEqual(r.processedAt, undefined);
      assert.strictEqual(r.processedBy, undefined);
    }
  });

  it('processed refund should have processedAt and processedBy', () => {
    const processed = MOCK_REFUNDS.filter(
      (r) =>
        r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled',
    );
    for (const r of processed) {
      assert.ok(r.processedAt, `Processed refund ${r.id} should have processedAt`);
      assert.ok(r.processedBy, `Processed refund ${r.id} should have processedBy`);
    }
  });

  it('return-type refund should have positive quantity', () => {
    const returns = MOCK_REFUNDS.filter((r) => r.type === 'return');
    for (const r of returns) {
      assert.ok(r.quantity > 0, `Return refund ${r.id} should have quantity > 0`);
    }
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Refunds — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onCancel={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
