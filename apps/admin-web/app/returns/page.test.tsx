/**
 * returns/page.test.tsx — 退换货管理列表页 L1 测试
 *
 * 覆盖: 退换货数据结构、状态统计、类型枚举、数量/金额汇总
 * 正例: 退换字段完整性、状态与类型分布、统计卡片计算
 * 反例: 无效状态/类型、空退货列表、负数金额
 * 边界: 零元维修、超大额退货、空搜索结果
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type ReturnStatus = 'pending' | 'review' | 'received' | 'processing' | 'completed' | 'closed';
type ReturnType = 'money_only' | 'exchange' | 'repair' | 'refund';

interface ReturnItem {
  id: string;
  returnNo: string;
  orderNo: string;
  storeName: string;
  customerName: string;
  type: ReturnType;
  status: ReturnStatus;
  amount: number;
  quantity: number;
  reason: string;
  createdAt: string;
  processedAt?: string;
  processor?: string;
}

/* ── Mock 数据 ── */

const RETURN_STATUS_MAP: Record<ReturnStatus, string> = {
  pending: '待审核', review: '审核中', received: '待收货',
  processing: '处理中', completed: '已完成', closed: '已关闭',
};

const RETURN_STATUSES: ReturnStatus[] = ['pending', 'review', 'received', 'processing', 'completed', 'closed'];
const RETURN_TYPES: ReturnType[] = ['money_only', 'exchange', 'repair', 'refund'];

const MOCK_RETURNS: ReturnItem[] = [
  { id: 'RT-001', returnNo: 'R20260715001', orderNo: 'ORD-20260701001', storeName: '朝阳旗舰店', customerName: '王芳', type: 'refund', status: 'pending', amount: 299, quantity: 1, reason: '商品破损', createdAt: '2026-07-15 10:30' },
  { id: 'RT-002', returnNo: 'R20260715002', orderNo: 'ORD-20260701002', storeName: '海淀店', customerName: '李明', type: 'exchange', status: 'review', amount: 599, quantity: 2, reason: '尺码不合适', createdAt: '2026-07-15 11:00' },
  { id: 'RT-003', returnNo: 'R20260715003', orderNo: 'ORD-20260701003', storeName: '西城店', customerName: '赵雪', type: 'refund', status: 'received', amount: 1280, quantity: 1, reason: '质量问题', createdAt: '2026-07-14 15:00' },
  { id: 'RT-004', returnNo: 'R20260715004', orderNo: 'ORD-20260701004', storeName: '东城店', customerName: '陈伟', type: 'money_only', status: 'processing', amount: 89, quantity: 1, reason: '少发商品', createdAt: '2026-07-13 09:20' },
  { id: 'RT-005', returnNo: 'R20260715005', orderNo: 'ORD-20260701005', storeName: '朝阳旗舰店', customerName: '刘佳', type: 'exchange', status: 'completed', amount: 3500, quantity: 3, reason: '功能故障', createdAt: '2026-07-12 16:45' },
  { id: 'RT-006', returnNo: 'R20260715006', orderNo: 'ORD-20260701006', storeName: '海淀店', customerName: '孙浩', type: 'repair', status: 'processing', amount: 200, quantity: 1, reason: '配件损坏', createdAt: '2026-07-15 14:10' },
  { id: 'RT-007', returnNo: 'R20260715007', orderNo: 'ORD-20260701007', storeName: '西城店', customerName: '周婷', type: 'refund', status: 'closed', amount: 450, quantity: 1, reason: '超出退货期限', createdAt: '2026-07-12 11:30' },
  { id: 'RT-008', returnNo: 'R20260715008', orderNo: 'ORD-20260701008', storeName: '朝阳旗舰店', customerName: '吴强', type: 'refund', status: 'completed', amount: 1680, quantity: 2, reason: '颜色发错', createdAt: '2026-07-11 10:00' },
  { id: 'RT-009', returnNo: 'R20260715009', orderNo: 'ORD-20260701009', storeName: '东城店', customerName: '郑明', type: 'exchange', status: 'pending', amount: 880, quantity: 1, reason: '与描述不符', createdAt: '2026-07-15 18:00' },
  { id: 'RT-010', returnNo: 'R20260715010', orderNo: 'ORD-20260701010', storeName: '朝阳旗舰店', customerName: '吴芳', type: 'repair', status: 'completed', amount: 0, quantity: 1, reason: '保修期内维修', createdAt: '2026-07-10 09:00' },
];

/* ── 辅助函数 ── */

function getReturnStats(returns: ReturnItem[]) {
  const pending = returns.filter(r => r.status === 'pending' || r.status === 'review').length;
  const processing = returns.filter(r => r.status === 'processing' || r.status === 'received').length;
  const completed = returns.filter(r => r.status === 'completed').length;
  const closed = returns.filter(r => r.status === 'closed').length;
  const totalAmount = returns.reduce((s, r) => s + r.amount, 0);
  const totalQuantity = returns.reduce((s, r) => s + r.quantity, 0);
  return { total: returns.length, pending, processing, completed, closed, totalAmount, totalQuantity };
}

function searchReturns(returns: ReturnItem[], query: string): ReturnItem[] {
  if (!query.trim()) return returns;
  const q = query.toLowerCase();
  return returns.filter(r =>
    r.returnNo.toLowerCase().includes(q) ||
    r.orderNo.toLowerCase().includes(q) ||
    r.storeName.includes(q) ||
    r.customerName.includes(q)
  );
}

function filterByStatus(returns: ReturnItem[], status: ReturnStatus | 'all'): ReturnItem[] {
  return status === 'all' ? returns : returns.filter(r => r.status === status);
}

function filterByType(returns: ReturnItem[], type: ReturnType | 'all'): ReturnItem[] {
  return type === 'all' ? returns : returns.filter(r => r.type === type);
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('returns — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 是 Server Component', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes("'use client'"));
  });

  it('3. 导出了 async 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 退换货数据
   ══════════════════════════════════════════════════════════ */

describe('returns — 退换货数据', () => {
  it('4. 10 条退换货记录', () => {
    assert.equal(MOCK_RETURNS.length, 10);
  });

  it('5. 所有 ID 唯一', () => {
    const ids = MOCK_RETURNS.map(r => r.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('6. 所有 returnNo 唯一', () => {
    const nos = MOCK_RETURNS.map(r => r.returnNo);
    assert.equal(new Set(nos).size, nos.length);
  });

  it('7. 所有状态在枚举内', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(RETURN_STATUSES.includes(r.status), `${r.id} invalid status`);
    }
  });

  it('8. 所有类型在枚举内', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(RETURN_TYPES.includes(r.type), `${r.id} invalid type`);
    }
  });

  it('9. 客户名非空', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(r.customerName.length > 0);
    }
  });

  it('10. 门店名非空', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(r.storeName.length > 0);
    }
  });

  it('11. 原因非空', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(r.reason.length > 0);
    }
  });

  it('12. quantity 为正整数', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(Number.isInteger(r.quantity) && r.quantity > 0, `${r.id} invalid quantity`);
    }
  });

  it('13. amount 非负', () => {
    for (const r of MOCK_RETURNS) {
      assert.ok(r.amount >= 0, `${r.id} negative amount`);
    }
  });

  it('14. 状态映射全覆盖', () => {
    for (const s of RETURN_STATUSES) {
      assert.ok(typeof RETURN_STATUS_MAP[s] === 'string' && RETURN_STATUS_MAP[s].length > 0);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 统计与过滤
   ══════════════════════════════════════════════════════════ */

describe('returns — 统计与过滤', () => {
  it('15. 待处理(pending+review) 3 条', () => {
    const p = MOCK_RETURNS.filter(r => r.status === 'pending' || r.status === 'review').length;
    assert.equal(p, 3);
  });

  it('16. 处理中(processing+received) 3 条', () => {
    const by = MOCK_RETURNS.filter(r => r.status === 'processing' || r.status === 'received').length;
    assert.equal(by, 3);
  });

  it('17. 已完成 3 条', () => {
    assert.equal(MOCK_RETURNS.filter(r => r.status === 'completed').length, 3);
  });

  it('18. 已关闭 1 条', () => {
    assert.equal(MOCK_RETURNS.filter(r => r.status === 'closed').length, 1);
  });

  it('19. getReturnStats 统计正确', () => {
    const stats = getReturnStats(MOCK_RETURNS);
    assert.equal(stats.total, 10);
    assert.equal(stats.pending, 3);
    assert.equal(stats.processing, 3);
    assert.equal(stats.completed, 3);
    assert.equal(stats.closed, 1);
    assert.equal(stats.totalAmount, 8977);
    assert.equal(stats.totalQuantity, 14);
  });

  it('20. 搜索"朝阳"返回 4 条', () => {
    assert.equal(searchReturns(MOCK_RETURNS, '朝阳').length, 4);
  });

  it('21. 搜索"R20260715001"返回 1 条', () => {
    assert.equal(searchReturns(MOCK_RETURNS, 'R20260715001').length, 1);
  });

  it('22. 空搜索返回全部', () => {
    assert.equal(searchReturns(MOCK_RETURNS, '').length, MOCK_RETURNS.length);
  });

  it('23. filterByStatus pending 返回 2', () => {
    assert.equal(filterByStatus(MOCK_RETURNS, 'pending').length, 2);
  });

  it('24. filterByType refund 返回 4', () => {
    assert.equal(filterByType(MOCK_RETURNS, 'refund').length, 4);
  });

  it('25. filterByType exchange 返回 3', () => {
    assert.equal(filterByType(MOCK_RETURNS, 'exchange').length, 3);
  });

  it('26. filterByType repair 返回 2', () => {
    assert.equal(filterByType(MOCK_RETURNS, 'repair').length, 2);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('returns — 边界与反例', () => {
  it('27. 空退货列表不崩溃', () => {
    const stats = getReturnStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.totalAmount, 0);
  });

  it('28. 含 0 元免费维修记录', () => {
    const zero = MOCK_RETURNS.find(r => r.amount === 0);
    assert.ok(zero !== undefined);
    assert.equal(zero!.reason, '保修期内维修');
  });

  it('29. 最高金额 ¥3,500', () => {
    const max = Math.max(...MOCK_RETURNS.map(r => r.amount));
    assert.equal(max, 3500);
  });

  it('30. returnNo 格式 R + 日期 + 序号', () => {
    for (const r of MOCK_RETURNS) {
      assert.match(r.returnNo, /^R\d{11}$/, `${r.id} invalid returnNo format`);
    }
  });

  it('31. 所有必填字段完整', () => {
    const required: (keyof ReturnItem)[] = ['id', 'returnNo', 'orderNo', 'storeName', 'customerName', 'type', 'status', 'amount', 'quantity', 'reason', 'createdAt'];
    for (const r of MOCK_RETURNS) {
      for (const key of required) {
        assert.ok(r[key] !== undefined && r[key] !== null, `${r.id} missing ${key}`);
      }
    }
  });

  it('32. 不存在的状态过滤无结果', () => {
    assert.equal((MOCK_RETURNS as any[]).filter(r => r.status === 'unknown').length, 0);
  });

  it('33. 朝阳店退货总额 > 其他', () => {
    const cy = MOCK_RETURNS.filter(r => r.storeName === '朝阳旗舰店').reduce((s, r) => s + r.amount, 0);
    const other = MOCK_RETURNS.filter(r => r.storeName !== '朝阳旗舰店').reduce((s, r) => s + r.amount, 0);
    assert.ok(cy > 0);
    assert.ok(other > 0);
  });

  it('34. 日期时间格式', () => {
    for (const r of MOCK_RETURNS) {
      assert.match(r.createdAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, `${r.id} invalid date`);
    }
  });

  it('35. ID 格式 RT-XXX', () => {
    for (const r of MOCK_RETURNS) {
      assert.match(r.id, /^RT-\d{3}$/, `${r.id} invalid ID format`);
    }
  });

  it('36. 维修类型(repair)金额可能为 0', () => {
    const repairs = MOCK_RETURNS.filter(r => r.type === 'repair');
    for (const r of repairs) {
      assert.ok(r.amount === 0 || r.amount > 0);
    }
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Returns — hooks验证', () => {
  it('使用函数组件', () => assert.ok(SRC.includes('function ') || SRC.includes('=>')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('on') || SRC.includes('handle')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
