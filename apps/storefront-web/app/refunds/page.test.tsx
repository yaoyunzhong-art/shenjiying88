/**
 * 退换货管理页 — Refunds List Page 测试
 * 测试策略: 纯 Node test (不依赖 jsdom), 覆盖过滤/搜索逻辑
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 内联数据模型 ──

type RefundStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'cancelled';

type RefundType = 'refund' | 'exchange' | 'return';

interface RefundItem {
  id: string;
  orderId: string;
  type: RefundType;
  status: RefundStatus;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  createdAt: string;
  processedAt?: string;
  productName: string;
}

const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消',
};

const REFUND_STATUS_VARIANT: Record<RefundStatus, string> = {
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  processing: 'info',
  completed: 'success',
  cancelled: 'neutral',
};

const REFUND_TYPE_LABEL: Record<RefundType, string> = {
  refund: '仅退款',
  exchange: '换货',
  return: '退货退款',
};

// ── Mock 数据 (与 page.tsx / refund-data.ts 一致) ──

const MOCK_REFUNDS: RefundItem[] = [
  { id: 'RF-20260601', orderId: 'ORD-20260601-001', type: 'refund', status: 'pending_approval', customerName: '王芳', customerPhone: '138****5678', amount: 12900, reason: '商品与描述不符', createdAt: '2026-06-28 09:15', productName: '有机蔬菜礼盒' },
  { id: 'RF-20260602', orderId: 'ORD-20260601-002', type: 'exchange', status: 'approved', customerName: '李明', customerPhone: '159****2341', amount: 35800, reason: '尺码不合适，换货', createdAt: '2026-06-27 14:30', processedAt: '2026-06-27 16:00', productName: '运动跑鞋' },
  { id: 'RF-20260603', orderId: 'ORD-20260601-003', type: 'return', status: 'processing', customerName: '赵雪', customerPhone: '176****9087', amount: 52000, reason: '收到的商品破损', createdAt: '2026-06-26 10:00', processedAt: '2026-06-26 11:30', productName: '进口红酒套装' },
  { id: 'RF-20260604', orderId: 'ORD-20260601-004', type: 'refund', status: 'completed', customerName: '陈伟', customerPhone: '182****4532', amount: 8800, reason: '重复下单', createdAt: '2026-06-25 08:45', processedAt: '2026-06-25 10:20', productName: '手工饼干' },
  { id: 'RF-20260605', orderId: 'ORD-20260601-005', type: 'exchange', status: 'rejected', customerName: '刘洋', customerPhone: '136****7890', amount: 25900, reason: '超过退换货期限', createdAt: '2026-06-24 16:20', processedAt: '2026-06-24 17:00', productName: '蓝牙耳机' },
  { id: 'RF-20260606', orderId: 'ORD-20260601-006', type: 'return', status: 'pending_approval', customerName: '孙丽', customerPhone: '139****3456', amount: 16800, reason: '商品过期', createdAt: '2026-06-23 11:10', productName: '鲜牛奶' },
  { id: 'RF-20260607', orderId: 'ORD-20260601-007', type: 'refund', status: 'cancelled', customerName: '周强', customerPhone: '137****6789', amount: 4500, reason: '已协商解决', createdAt: '2026-06-22 09:30', processedAt: '2026-06-22 10:15', productName: '零食大礼包' },
  { id: 'RF-20260608', orderId: 'ORD-20260601-008', type: 'exchange', status: 'completed', customerName: '吴敏', customerPhone: '158****2345', amount: 68900, reason: '颜色发错', createdAt: '2026-06-21 15:00', processedAt: '2026-06-22 09:00', productName: '羊绒围巾' },
];

// ── 工具函数 (与 page.tsx 过滤逻辑一致) ──

function filterRefunds(
  items: RefundItem[],
  statusFilter: RefundStatus | 'ALL',
  searchText: string,
): RefundItem[] {
  let result = items;

  // 状态过滤
  if (statusFilter !== 'ALL') {
    result = result.filter((r) => r.status === statusFilter);
  }

  // 搜索
  if (searchText.trim()) {
    const lower = searchText.toLowerCase();
    result = result.filter(
      (r) =>
        r.id.toLowerCase().includes(lower) ||
        r.customerName.toLowerCase().includes(lower) ||
        r.productName.toLowerCase().includes(lower) ||
        r.reason.toLowerCase().includes(lower),
    );
  }

  return result;
}

function getStatusCounts(items: RefundItem[]): Record<RefundStatus, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
  }
  return counts as Record<RefundStatus, number>;
}

function getTotalAmount(items: RefundItem[]): number {
  return items.reduce((sum, r) => sum + r.amount, 0);
}

// ============================================================
//  测试套件
// ============================================================

describe('退换货管理页 — Refunds List Page', () => {
  // ── 数据完整性 ──

  describe('数据完整性', () => {
    it('MOCK_REFUNDS 应有 8 条数据', () => {
      assert.equal(MOCK_REFUNDS.length, 8);
    });

    it('所有退单 ID 唯一', () => {
      const ids = MOCK_REFUNDS.map((r) => r.id);
      assert.equal(new Set(ids).size, ids.length);
    });

    it('每条记录的必要字段非空', () => {
      const required: (keyof RefundItem)[] = ['id', 'orderId', 'type', 'status', 'customerName', 'amount', 'reason', 'createdAt', 'productName'];
      for (const record of MOCK_REFUNDS) {
        for (const field of required) {
          const val = record[field];
          assert.ok(val !== undefined && val !== null && val !== '',
            `${field} 不能为空 (${record.id})`);
        }
      }
    });

    it('金额字段为正数', () => {
      for (const record of MOCK_REFUNDS) {
        assert.ok(record.amount > 0, `${record.id} amount 必须 > 0`);
      }
    });

    it('状态值均在 REFUND_STATUS_LABEL 中', () => {
      for (const record of MOCK_REFUNDS) {
        assert.ok(record.status in REFUND_STATUS_LABEL, `${record.id} 状态异常`);
      }
    });

    it('类型值均在 REFUND_TYPE_LABEL 中', () => {
      for (const record of MOCK_REFUNDS) {
        assert.ok(record.type in REFUND_TYPE_LABEL, `${record.id} 类型异常`);
      }
    });

    it('covered all 6 refund statuses', () => {
      const statuses = new Set(MOCK_REFUNDS.map((r) => r.status));
      assert.equal(statuses.size, 6);
      const expected: RefundStatus[] = ['pending_approval', 'approved', 'rejected', 'processing', 'completed', 'cancelled'];
      for (const s of expected) {
        assert.ok(statuses.has(s), `缺少状态: ${s}`);
      }
    });

    it('covered all 3 refund types', () => {
      const types = new Set(MOCK_REFUNDS.map((r) => r.type));
      assert.equal(types.size, 3);
      assert.ok(types.has('refund'));
      assert.ok(types.has('exchange'));
      assert.ok(types.has('return'));
    });
  });

  // ── 状态过滤 ──

  describe('状态过滤', () => {
    it('ALL 返回全部 8 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '');
      assert.equal(result.length, 8);
    });

    it('pending_approval 返回 2 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'pending_approval', '');
      assert.equal(result.length, 2);
      assert.ok(result.every((r) => r.status === 'pending_approval'));
    });

    it('approved 返回 1 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'approved', '');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260602');
    });

    it('rejected 返回 1 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'rejected', '');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260605');
    });

    it('processing 返回 1 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'processing', '');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260603');
    });

    it('completed 返回 2 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'completed', '');
      assert.equal(result.length, 2);
      assert.ok(result.every((r) => r.status === 'completed'));
    });

    it('cancelled 返回 1 条', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'cancelled', '');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260607');
    });
  });

  // ── 搜索 ──

  describe('搜索', () => {
    it('空搜索返回全部', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '');
      assert.equal(result.length, 8);
    });

    it('按退单号搜索 RF-20260601', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', 'RF-20260601');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260601');
    });

    it('搜索 "王芳" 匹配会员名', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '王芳');
      assert.equal(result.length, 1);
      assert.equal(result[0].customerName, '王芳');
    });

    it('搜索 "红酒" 匹配商品名', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '红酒');
      assert.equal(result.length, 1);
      assert.equal(result[0].productName, '进口红酒套装');
    });

    it('搜索 "破损" 匹配原因', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '破损');
      assert.equal(result.length, 1);
      assert.equal(result[0].reason, '收到的商品破损');
    });

    it('搜索 "饼干" 匹配商品名', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '饼干');
      assert.equal(result.length, 1);
      assert.equal(result[0].productName, '手工饼干');
    });

    it('搜索 "零食" 匹配商品名', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '零食');
      assert.equal(result.length, 1);
      assert.equal(result[0].productName, '零食大礼包');
    });

    it('搜索不存在的文本返回空', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', 'zzznotexist');
      assert.equal(result.length, 0);
    });

    it('搜索大小写不敏感', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', 'rf-20260601');
      assert.equal(result.length, 1);
    });

    it('搜索 "围巾" + 状态 completed', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'completed', '围巾');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260608');
    });
  });

  // ── 组合过滤 ──

  describe('组合过滤', () => {
    it('pending_approval 搜索 "孙丽"', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'pending_approval', '孙丽');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260606');
    });

    it('completed 搜索 "吴敏"', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'completed', '吴敏');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260608');
    });

    it('状态过滤后搜索不存在返回空', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'rejected', '蔬菜');
      assert.equal(result.length, 0);
    });
  });

  // ── 统计函数 ──

  describe('统计', () => {
    it('getStatusCounts 正确计数', () => {
      const counts = getStatusCounts(MOCK_REFUNDS);
      assert.equal(counts.pending_approval, 2);
      assert.equal(counts.approved, 1);
      assert.equal(counts.rejected, 1);
      assert.equal(counts.processing, 1);
      assert.equal(counts.completed, 2);
      assert.equal(counts.cancelled, 1);
    });

    it('空数组返回空 counts', () => {
      const counts = getStatusCounts([]);
      assert.deepEqual(counts, {});
    });

    it('getTotalAmount 总和正确', () => {
      const total = getTotalAmount(MOCK_REFUNDS);
      // 12900 + 35800 + 52000 + 8800 + 25900 + 16800 + 4500 + 68900
      assert.equal(total, 225600);
    });

    it('空数组 totalAmount = 0', () => {
      assert.equal(getTotalAmount([]), 0);
    });
  });

  // ── 常量映射 ──

  describe('常量映射', () => {
    it('REFUND_STATUS_LABEL 覆盖6种状态', () => {
      assert.equal(Object.keys(REFUND_STATUS_LABEL).length, 6);
    });

    it('REFUND_TYPE_LABEL 覆盖3种类型', () => {
      assert.equal(Object.keys(REFUND_TYPE_LABEL).length, 3);
      assert.equal(REFUND_TYPE_LABEL.refund, '仅退款');
      assert.equal(REFUND_TYPE_LABEL.exchange, '换货');
      assert.equal(REFUND_TYPE_LABEL.return, '退货退款');
    });

    it('REFUND_STATUS_VARIANT 映射正确', () => {
      assert.equal(REFUND_STATUS_VARIANT.pending_approval, 'warning');
      assert.equal(REFUND_STATUS_VARIANT.approved, 'success');
      assert.equal(REFUND_STATUS_VARIANT.rejected, 'danger');
      assert.equal(REFUND_STATUS_VARIANT.processing, 'info');
      assert.equal(REFUND_STATUS_VARIANT.completed, 'success');
      assert.equal(REFUND_STATUS_VARIANT.cancelled, 'neutral');
    });
  });

  // ── 边缘情况 ──

  describe('边缘情况', () => {
    it('搜索含空格的文本', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '   ');
      assert.equal(result.length, 8);
    });

    it('搜索部分匹配 "06" 匹配多个退单号', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '06');
      // 所有 ID 都包含 06
      assert.ok(result.length >= 8);
    });

    it('搜索 "蔬菜" 匹配商品名', () => {
      const result = filterRefunds(MOCK_REFUNDS, 'ALL', '蔬菜');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'RF-20260601');
    });

    it('pending_approval 待处理统计 = 2', () => {
      const pending = MOCK_REFUNDS.filter((r) => r.status === 'pending_approval');
      assert.equal(pending.length, 2);
    });

    it('refund type 只退款条目', () => {
      const refunds = MOCK_REFUNDS.filter((r) => r.type === 'refund');
      assert.equal(refunds.length, 3);
      assert.ok(refunds.every((r) => r.type === 'refund'));
    });

    it('exchange 换货条目', () => {
      const exchanges = MOCK_REFUNDS.filter((r) => r.type === 'exchange');
      assert.equal(exchanges.length, 3);
    });

    it('return 退货条目', () => {
      const returns = MOCK_REFUNDS.filter((r) => r.type === 'return');
      assert.equal(returns.length, 2);
    });

    it('金额 ¥ 格式转换', () => {
      const formatYuan = (fen: number) => `¥${(fen / 100).toFixed(2)}`;
      assert.equal(formatYuan(12900), '¥129.00');
      assert.equal(formatYuan(35800), '¥358.00');
      assert.equal(formatYuan(68900), '¥689.00');
      assert.equal(formatYuan(0), '¥0.00');
      assert.equal(formatYuan(99), '¥0.99');
    });

    it('processedAt 只对非 pending_approval 有效', () => {
      const pendingIds = MOCK_REFUNDS.filter((r) => r.status === 'pending_approval').map((r) => r.id);
      for (const record of MOCK_REFUNDS) {
        if (pendingIds.includes(record.id)) {
          assert.equal(record.processedAt, undefined, `pending_approval 不应有 processedAt: ${record.id}`);
        } else {
          assert.ok(record.processedAt, `非 pending_approval 应有 processedAt: ${record.id}`);
        }
      }
    });
  });
});
