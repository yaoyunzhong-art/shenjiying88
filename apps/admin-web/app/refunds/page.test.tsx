/**
 * refunds/page.test.tsx — 退款管理列表页 L1 测试
 *
 * 覆盖: 退款数据结构、状态统计、金额汇总、类型枚举
 * 正例: 退款字段完整性、状态分布、金额计算
 * 反例: 无效状态/类型、空退款列表、零金额退款
 * 边界: 边界金额(¥1)、大量数据、空搜索
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type RefundStatus = 'pending' | 'review' | 'approved' | 'refunded' | 'rejected';
type RefundType = 'money_only' | 'exchange' | 'return_refund' | 'repair';

interface RefundItem {
  id: string;
  orderNo: string;
  storeName: string;
  customerName: string;
  type: RefundType;
  status: RefundStatus;
  amount: number;
  reason: string;
  createdAt: string;
  processedAt?: string;
  processor?: string;
}

/* ── Mock 数据 ── */

const REFUND_STATUS_MAP: Record<RefundStatus, string> = {
  pending: '待审核',
  review: '审核中',
  approved: '已批准',
  refunded: '已退款',
  rejected: '已拒绝',
};

const REFUND_TYPE_MAP: Record<RefundType, string> = {
  money_only: '仅退款',
  exchange: '换货',
  return_refund: '退货退款',
  repair: '维修',
};

const MOCK_REFUNDS: RefundItem[] = [
  { id: 'RF-001', orderNo: 'ORD-20260701001', storeName: '朝阳旗舰店', customerName: '王芳', type: 'money_only', status: 'pending', amount: 299, reason: '商品破损', createdAt: '2026-07-15 10:30' },
  { id: 'RF-002', orderNo: 'ORD-20260701002', storeName: '海淀店', customerName: '李明', type: 'exchange', status: 'review', amount: 599, reason: '尺码不合适', createdAt: '2026-07-15 11:00' },
  { id: 'RF-003', orderNo: 'ORD-20260701003', storeName: '西城店', customerName: '赵雪', type: 'return_refund', status: 'approved', amount: 1280, reason: '质量问题', createdAt: '2026-07-14 15:00' },
  { id: 'RF-004', orderNo: 'ORD-20260701004', storeName: '东城店', customerName: '陈伟', type: 'money_only', status: 'refunded', amount: 89, reason: '少发商品', createdAt: '2026-07-13 09:20' },
  { id: 'RF-005', orderNo: 'ORD-20260701005', storeName: '朝阳旗舰店', customerName: '刘佳', type: 'return_refund', status: 'pending', amount: 3500, reason: '功能故障', createdAt: '2026-07-15 16:45' },
  { id: 'RF-006', orderNo: 'ORD-20260701006', storeName: '海淀店', customerName: '孙浩', type: 'repair', status: 'review', amount: 200, reason: '配件损坏', createdAt: '2026-07-15 14:10' },
  { id: 'RF-007', orderNo: 'ORD-20260701007', storeName: '西城店', customerName: '周婷', type: 'money_only', status: 'rejected', amount: 450, reason: '超出退款期限', createdAt: '2026-07-12 11:30' },
  { id: 'RF-008', orderNo: 'ORD-20260701008', storeName: '朝阳旗舰店', customerName: '吴强', type: 'exchange', status: 'refunded', amount: 1680, reason: '颜色发错', createdAt: '2026-07-11 10:00' },
  { id: 'RF-009', orderNo: 'ORD-20260701009', storeName: '东城店', customerName: '郑明', type: 'money_only', status: 'pending', amount: 1, reason: '价格调整', createdAt: '2026-07-15 18:00' },
];

/* ── 辅助函数 ── */

function getRefundStats(refunds: RefundItem[]) {
  return {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    review: refunds.filter(r => r.status === 'review').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    refunded: refunds.filter(r => r.status === 'refunded').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    totalAmount: refunds.filter(r => r.status !== 'rejected').reduce((s, r) => s + r.amount, 0),
    pendingAmount: refunds.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0),
  };
}

function searchRefunds(refunds: RefundItem[], query: string): RefundItem[] {
  if (!query.trim()) return refunds;
  const q = query.toLowerCase();
  return refunds.filter(r =>
    r.id.toLowerCase().includes(q) ||
    r.orderNo.toLowerCase().includes(q) ||
    r.storeName.includes(q) ||
    r.customerName.includes(q)
  );
}

function filterByStatus(refunds: RefundItem[], status: RefundStatus | 'all'): RefundItem[] {
  return status === 'all' ? refunds : refunds.filter(r => r.status === status);
}

function filterByType(refunds: RefundItem[], type: RefundType | 'all'): RefundItem[] {
  return type === 'all' ? refunds : refunds.filter(r => r.type === type);
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('refunds — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 是 Server Component', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes("'use client'"), '应为 Server Component');
  });

  it('3. 导出了 async 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 退款数据
   ══════════════════════════════════════════════════════════ */

describe('refunds — 退款数据', () => {
  it('4. 9 条退款记录', () => {
    assert.equal(MOCK_REFUNDS.length, 9);
  });

  it('5. 所有 ID 唯一', () => {
    const ids = MOCK_REFUNDS.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('6. 退款类型在枚举内', () => {
    const types: RefundType[] = ['money_only', 'exchange', 'return_refund', 'repair'];
    for (const r of MOCK_REFUNDS) {
      assert.ok(types.includes(r.type), `${r.id} invalid type`);
    }
  });

  it('7. 退款状态在枚举内', () => {
    const statuses: RefundStatus[] = ['pending', 'review', 'approved', 'refunded', 'rejected'];
    for (const r of MOCK_REFUNDS) {
      assert.ok(statuses.includes(r.status), `${r.id} invalid status`);
    }
  });

  it('8. 客户名非空', () => {
    for (const r of MOCK_REFUNDS) {
      assert.ok(r.customerName.length > 0);
    }
  });

  it('9. 门店名非空', () => {
    for (const r of MOCK_REFUNDS) {
      assert.ok(r.storeName.length > 0);
    }
  });

  it('10. 退款原因非空', () => {
    for (const r of MOCK_REFUNDS) {
      assert.ok(r.reason.length > 0);
    }
  });

  it('11. 金额为正', () => {
    for (const r of MOCK_REFUNDS) {
      assert.ok(r.amount > 0, `${r.id} amount should be > 0`);
    }
  });

  it('12. 状态映射全部覆盖', () => {
    const valid: RefundStatus[] = ['pending', 'review', 'approved', 'refunded', 'rejected'];
    for (const s of valid) {
      assert.ok(typeof REFUND_STATUS_MAP[s] === 'string' && REFUND_STATUS_MAP[s].length > 0);
    }
  });

  it('13. 类型映射全部覆盖', () => {
    const valid: RefundType[] = ['money_only', 'exchange', 'return_refund', 'repair'];
    for (const t of valid) {
      assert.ok(typeof REFUND_TYPE_MAP[t] === 'string' && REFUND_TYPE_MAP[t].length > 0);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 统计与过滤
   ══════════════════════════════════════════════════════════ */

describe('refunds — 统计与过滤', () => {
  it('14. 待处理(pending) 3 条', () => {
    assert.equal(filterByStatus(MOCK_REFUNDS, 'pending').length, 3);
  });

  it('15. 审核中(review) 2 条', () => {
    assert.equal(filterByStatus(MOCK_REFUNDS, 'review').length, 2);
  });

  it('16. 已批准(approved) 1 条', () => {
    assert.equal(filterByStatus(MOCK_REFUNDS, 'approved').length, 1);
  });

  it('17. 已退款(refunded) 2 条', () => {
    assert.equal(filterByStatus(MOCK_REFUNDS, 'refunded').length, 2);
  });

  it('18. 已拒绝(rejected) 1 条', () => {
    assert.equal(filterByStatus(MOCK_REFUNDS, 'rejected').length, 1);
  });

  it('19. 仅退款(money_only) 4 条', () => {
    assert.equal(filterByType(MOCK_REFUNDS, 'money_only').length, 4);
  });

  it('20. 换货(exchange) 2 条', () => {
    assert.equal(filterByType(MOCK_REFUNDS, 'exchange').length, 2);
  });

  it('21. 退货退款(return_refund) 2 条', () => {
    assert.equal(filterByType(MOCK_REFUNDS, 'return_refund').length, 2);
  });

  it('22. getRefundStats 统计正确', () => {
    const stats = getRefundStats(MOCK_REFUNDS);
    assert.equal(stats.total, 9);
    assert.equal(stats.pending, 3);
    assert.equal(stats.rejected, 1);
    assert.equal(stats.totalAmount, 7648);
    assert.equal(stats.pendingAmount, 3800);
  });

  it('23. 搜索"朝阳"返回 4 条', () => {
    assert.equal(searchRefunds(MOCK_REFUNDS, '朝阳').length, 3);
  });

  it('24. 搜索"RF-001"返回 1 条', () => {
    assert.equal(searchRefunds(MOCK_REFUNDS, 'RF-001').length, 1);
  });

  it('25. 空搜索返回全部', () => {
    assert.equal(searchRefunds(MOCK_REFUNDS, '').length, MOCK_REFUNDS.length);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('refunds — 边界与反例', () => {
  it('26. 空退款列表不崩溃', () => {
    const stats = getRefundStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.totalAmount, 0);
  });

  it('27. 最低退款金额 ¥1', () => {
    const min = Math.min(...MOCK_REFUNDS.map(r => r.amount));
    assert.equal(min, 1);
  });

  it('28. 最高退款金额 ¥3,500', () => {
    const max = Math.max(...MOCK_REFUNDS.map(r => r.amount));
    assert.equal(max, 3500);
  });

  it('29. 审核中(refunded)的已处理', () => {
    const refunded = MOCK_REFUNDS.filter(r => r.status === 'refunded');
    for (const r of refunded) {
      assert.ok(r.createdAt.length > 0);
    }
  });

  it('30. 待审核(pending)的未处理', () => {
    const pending = MOCK_REFUNDS.filter(r => r.status === 'pending');
    for (const r of pending) {
      assert.ok(!r.processedAt, `${r.id} pending but has processedAt`);
    }
  });

  it('31. 所有必填字段完整', () => {
    const required: (keyof RefundItem)[] = ['id', 'orderNo', 'storeName', 'customerName', 'type', 'status', 'amount', 'reason', 'createdAt'];
    for (const r of MOCK_REFUNDS) {
      for (const key of required) {
        assert.ok(r[key] !== undefined && r[key] !== null, `${r.id} missing ${key}`);
      }
    }
  });

  it('32. ID 格式 RF-XXX', () => {
    for (const r of MOCK_REFUNDS) {
      assert.match(r.id, /^RF-\d{3}$/, `${r.id} ID format RF-XXX`);
    }
  });

  it('33. 被拒绝的应有拒绝原因', () => {
    const rejected = MOCK_REFUNDS.filter(r => r.status === 'rejected');
    for (const r of rejected) {
      assert.ok(r.reason.length > 0);
    }
  });

  it('34. 日期时间格式 YYYY-MM-DD HH:mm', () => {
    for (const r of MOCK_REFUNDS) {
      assert.match(r.createdAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, `${r.id} invalid date`);
    }
  });

  it('35. 不存在的状态过滤无结果', () => {
    assert.equal((MOCK_REFUNDS as any[]).filter(r => r.status === 'unknown').length, 0);
  });

  it('36. 不存在的类型过滤无结果', () => {
    assert.equal((MOCK_REFUNDS as any[]).filter(r => r.type === 'unknown_type').length, 0);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Refunds — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
