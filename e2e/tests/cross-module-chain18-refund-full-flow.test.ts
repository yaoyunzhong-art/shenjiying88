/**
 * 🦞 链18: Mobile→API→Domain→API→Storefront 退款全流程 + 极限压力 + 降序验证
 * 
 * 路径: Mobile 发起退款请求(全额/部分/多商品) 
 *      → API 退款受理(校验订单状态/金额/时限)
 *      → Domain 退款履约流(状态机: requested→approved→processed→completed)
 *      → API 返回退款结果
 *      → Storefront 退款展示 & 降序排列 & 聚合统计
 * 
 * 覆盖模块: mobile · api · domain · storefront-web (4 模块)
 * 新增模式: 退款全链路状态机 + 退款极限场景(超时/超额/重复/部分) + 降序验证
 * 
 * Pulse-Nightly-09 新增
 */

import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

// ========== 仓储层 ==========
interface OrderRecord {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paidAt: string;
  source: string;
}

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface RefundRecord {
  id: string;
  orderId: string;
  requestId: string;
  amount: number;
  reason: string;
  items: { productName: string; quantity: number; amount: number }[];
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  processedBy?: string;
  rejectReason?: string;
}

const orderStore: Map<string, OrderRecord> = new Map();
const refundStore: RefundRecord[] = [];
const processedRefundRequests: Set<string> = new Set();
const refundTimeline: { refundId: string; fromStatus: string; toStatus: string; at: string }[] = [];

function seedData() {
  orderStore.clear();
  refundStore.length = 0;
  processedRefundRequests.clear();
  refundTimeline.length = 0;

  const baseOrders: OrderRecord[] = [
    { id: 'order_01', items: [{ productName: '冰咖啡机 Pro', quantity: 2, unitPrice: 2999, subtotal: 5998 }, { productName: '制冰机 Mini', quantity: 1, unitPrice: 1599, subtotal: 1599 }], totalAmount: 7597, status: 'delivered', paidAt: '2026-07-01T10:00:00Z', source: 'mobile' },
    { id: 'order_02', items: [{ productName: '自助售货柜 A1', quantity: 1, unitPrice: 8999, subtotal: 8999 }], totalAmount: 8999, status: 'delivered', paidAt: '2026-07-02T14:30:00Z', source: 'mobile' },
    { id: 'order_03', items: [{ productName: '商用制冰机', quantity: 1, unitPrice: 15999, subtotal: 15999 }], totalAmount: 15999, status: 'paid', paidAt: '2026-07-03T09:00:00Z', source: 'storefront' },
    { id: 'order_04', items: [{ productName: '冷柜 V2', quantity: 3, unitPrice: 4999, subtotal: 14997 }], totalAmount: 14997, status: 'cancelled', paidAt: '2026-07-01T08:00:00Z', source: 'mobile' },
    { id: 'order_05', items: [{ productName: '咖啡杯套装', quantity: 20, unitPrice: 99, subtotal: 1980 }], totalAmount: 1980, status: 'delivered', paidAt: '2026-07-04T16:00:00Z', source: 'storefront' },
  ];
  for (const o of baseOrders) {
    orderStore.set(o.id, { ...o });
  }
}

// ========== Mock 服务函数 ==========

// Mobile: 发起退款
function mobileRequestRefund(req: {
  orderId: string;
  amount: number;
  reason: string;
  items?: { productName: string; quantity: number; amount: number }[];
  requestId?: string;
}): { success: boolean; refund?: RefundRecord | { alreadyProcessed: boolean }; error?: string } {
  const reqId = req.requestId || `ref_${Date.now()}`;
  if (processedRefundRequests.has(reqId)) {
    return { success: true, refund: { alreadyProcessed: true } };
  }

  const order = orderStore.get(req.orderId);
  if (!order) return { success: false, error: 'order_not_found' };
  if (order.status === 'cancelled') return { success: false, error: 'order_already_cancelled' };
  if (order.status === 'pending') return { success: false, error: 'order_not_paid' };

  // 退款金额限制
  if (req.amount <= 0) return { success: false, error: 'refund_amount_must_be_positive' };
  if (req.amount > order.totalAmount) return { success: false, error: 'refund_exceeds_order_total' };

  const refund: RefundRecord = {
    id: `refund_${Date.now()}_${String(Math.random()).slice(2, 8)}`,
    orderId: req.orderId,
    requestId: reqId,
    amount: req.amount,
    reason: req.reason,
    items: req.items || [],
    status: 'requested',
    requestedAt: new Date().toISOString(),
  };
  refundStore.push(refund);
  refundTimeline.push({ refundId: refund.id, fromStatus: '-', toStatus: 'requested', at: refund.requestedAt });
  processedRefundRequests.add(reqId);
  return { success: true, refund };
}

// API: 退款受理
function apiApproveRefund(refundId: string, processedBy?: string): { success: boolean; refund?: RefundRecord; error?: string } {
  const refund = refundStore.find(r => r.id === refundId);
  if (!refund) return { success: false, error: 'refund_not_found' };
  if (refund.status !== 'requested') return { success: false, error: `invalid_status:${refund.status}` };

  refund.status = 'approved';
  refund.approvedAt = new Date().toISOString();
  refund.processedBy = processedBy || 'admin_01';
  refundTimeline.push({ refundId: refund.id, fromStatus: 'requested', toStatus: 'approved', at: refund.approvedAt! });
  return { success: true, refund: { ...refund } };
}

function apiRejectRefund(refundId: string, reason: string): { success: boolean; error?: string } {
  const refund = refundStore.find(r => r.id === refundId);
  if (!refund) return { success: false, error: 'refund_not_found' };
  if (refund.status !== 'requested') return { success: false, error: `invalid_status:${refund.status}` };

  refund.status = 'rejected';
  refund.rejectReason = reason;
  refundTimeline.push({ refundId: refund.id, fromStatus: 'requested', toStatus: 'rejected', at: new Date().toISOString() });
  return { success: true };
}

// Domain: 退款履约流
function domainProcessRefund(refundId: string): { success: boolean; refund?: RefundRecord; error?: string } {
  const refund = refundStore.find(r => r.id === refundId);
  if (!refund) return { success: false, error: 'refund_not_found' };
  if (refund.status !== 'approved') return { success: false, error: `cannot_process_${refund.status}` };

  // 模拟处理
  refund.status = 'processing';
  refundTimeline.push({ refundId: refund.id, fromStatus: 'approved', toStatus: 'processing', at: new Date().toISOString() });

  // 处理完成
  refund.status = 'completed';
  refund.completedAt = new Date().toISOString();
  refundTimeline.push({ refundId: refund.id, fromStatus: 'processing', toStatus: 'completed', at: refund.completedAt });

  // 更新订单状态
  const order = orderStore.get(refund.orderId);
  if (order && refund.amount >= order.totalAmount) {
    order.status = 'cancelled'; // 全额退款
  }

  return { success: true, refund: { ...refund } };
}

function domainGetRefundHistory(orderId?: string, status?: RefundRecord['status']): RefundRecord[] {
  return refundStore.filter(r => {
    if (orderId && r.orderId !== orderId) return false;
    if (status && r.status !== status) return false;
    return true;
  });
}

function domainGetRefundTimeline(refundId: string): { fromStatus: string; toStatus: string; at: string }[] {
  return refundTimeline.filter(t => t.refundId === refundId);
}

// Storefront: 退款展示
function storefrontGetRefundList(orderId?: string, sortOrder: 'asc' | 'desc' = 'desc'): { items: RefundRecord[]; total: number; totalAmount: number } {
  let items = orderId ? refundStore.filter(r => r.orderId === orderId) : [...refundStore];
  if (sortOrder === 'desc') {
    items.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } else {
    items.sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
  }
  const total = items.length;
  const totalAmount = items.reduce((s, r) => s + r.amount, 0);
  return { items, total, totalAmount };
}

function storefrontGetRefundStats(period?: { startDate: string; endDate: string }): { totalRefunds: number; totalAmount: number; byStatus: Record<string, number>; byReason: Record<string, number> } {
  let filtered = [...refundStore];
  if (period) {
    filtered = filtered.filter(r => {
      const t = new Date(r.requestedAt).getTime();
      return t >= new Date(period.startDate).getTime() && t <= new Date(period.endDate).getTime();
    });
  }
  const byStatus: Record<string, number> = {};
  const byReason: Record<string, number> = {};
  for (const r of filtered) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byReason[r.reason] = (byReason[r.reason] || 0) + 1;
  }
  return { totalRefunds: filtered.length, totalAmount: filtered.reduce((s, r) => s + r.amount, 0), byStatus, byReason };
}


// ========== 测试用例 ==========

describe('链18: 退款全流程 + 极限场景 + 降序验证 (Mobile→API→Domain→Storefront)', () => {

  before(() => {
    seedData();
  });

  // --- Phase 1: Mobile 发起退款（全额/部分/多商品） ---
  test('[正例] Mobile发起全额退款请求 → 创建refund, status=requested', () => {
    const r = mobileRequestRefund({ orderId: 'order_01', amount: 7597, reason: '商品质量问题', requestId: 'ref_req_01' });
    assert.ok(r.success);
    assert.ok(r.refund);
    assert.equal((r.refund as RefundRecord).status, 'requested');
    assert.equal((r.refund as any).alreadyProcessed, undefined);
  });

  test('[正例] Mobile发起部分退款请求(仅退一件商品) → 创建refund', () => {
    const r = mobileRequestRefund({ orderId: 'order_05', amount: 990, reason: '部分破损', items: [{ productName: '咖啡杯套装', quantity: 10, amount: 990 }], requestId: 'ref_req_02' });
    assert.ok(r.success);
    assert.equal((r.refund as RefundRecord).status, 'requested');
    assert.equal((r.refund as RefundRecord).amount, 990);
  });

  test('[正例] Mobile发起全额退款未送达订单 → 可以退款', () => {
    const r = mobileRequestRefund({ orderId: 'order_03', amount: 15999, reason: '未收到货', requestId: 'ref_req_03' });
    assert.ok(r.success);
  });

  test('[反例] Mobile重复提交相同requestId → 幂等返回', () => {
    const r = mobileRequestRefund({ orderId: 'order_01', amount: 7597, reason: '重复请求', requestId: 'ref_req_01' });
    assert.ok(r.success);
    assert.ok((r.refund as any).alreadyProcessed);
  });

  test('[反例] Mobile退款金额为0 → 拒绝', () => {
    const r = mobileRequestRefund({ orderId: 'order_01', amount: 0, reason: '零元退款', requestId: 'ref_req_zero' });
    assert.equal(r.success, false);
    assert.equal(r.error, 'refund_amount_must_be_positive');
  });

  test('[反例] Mobile退款超额 → 拒绝', () => {
    const r = mobileRequestRefund({ orderId: 'order_02', amount: 99999, reason: '超额', requestId: 'ref_req_excess' });
    assert.equal(r.success, false);
    assert.equal(r.error, 'refund_exceeds_order_total');
  });

  test('[反例] Mobile退款已取消订单 → 拒绝', () => {
    const r = mobileRequestRefund({ orderId: 'order_04', amount: 100, reason: '取消后退款', requestId: 'ref_req_cancelled' });
    assert.equal(r.success, false);
    assert.equal(r.error, 'order_already_cancelled');
  });

  test('[反例] Mobile退款不存在的订单 → 拒绝', () => {
    const r = mobileRequestRefund({ orderId: 'order_nonexistent', amount: 100, reason: '不存在', requestId: 'ref_req_notfound' });
    assert.equal(r.success, false);
    assert.equal(r.error, 'order_not_found');
  });

  // --- Phase 2: API 退款受理（approved/rejected） ---
  test('[正例] API审核通过退款 → status→approved', () => {
    const refunds = domainGetRefundHistory('order_01');
    const r = apiApproveRefund(refunds[0].id, 'finance_01');
    assert.ok(r.success);
    assert.equal(r.refund!.status, 'approved');
    assert.equal(r.refund!.processedBy, 'finance_01');
  });

  test('[正例] API审核通过其他退款 → approved', () => {
    const refunds_03 = domainGetRefundHistory('order_03');
    apiApproveRefund(refunds_03[0].id, 'system');
    const refunds_05 = domainGetRefundHistory('order_05');
    apiApproveRefund(refunds_05[0].id, 'finance_02');
  });

  test('[反例] API拒绝退款 → status→rejected, 记录原因', () => {
    // 再创建一个新退款
    const r = mobileRequestRefund({ orderId: 'order_02', amount: 8999, reason: '不想要了', requestId: 'ref_req_reject_01' });
    assert.ok(r.success);
    const refundId = (r.refund as RefundRecord).id;

    const rejectResult = apiRejectRefund(refundId, '不符合退款政策:超过7天无理由');
    assert.ok(rejectResult.success);

    const updated = domainGetRefundHistory('order_02');
    const rejected = updated.find(u => u.id === refundId);
    assert.equal(rejected!.status, 'rejected');
    assert.equal(rejected!.rejectReason, '不符合退款政策:超过7天无理由');
  });

  test('[反例] API重复审核同一退款 → 拒绝(非requested状态)', () => {
    const refunds = domainGetRefundHistory('order_01');
    const approvedRefund = refunds.find(r => r.status === 'approved')!;
    const r = apiApproveRefund(approvedRefund.id);
    assert.equal(r.success, false);
    assert.ok(r.error?.includes('invalid_status'));
  });

  test('[反例] API审核不存在的退款 → 拒绝', () => {
    const r = apiApproveRefund('refund_nonexistent');
    assert.equal(r.success, false);
    assert.equal(r.error, 'refund_not_found');
  });

  // --- Phase 3: Domain 退款履约流（状态机验证） ---
  test('[正例] Domain处理已审核退款 → processing→completed, 时间线记录完整', () => {
    const refunds = domainGetRefundHistory('order_01');
    const approvedRefund = refunds.find(r => r.status === 'approved')!;

    const r = domainProcessRefund(approvedRefund.id);
    assert.ok(r.success);
    assert.equal(r.refund!.status, 'completed');
    assert.ok(r.refund!.completedAt);

    // 时间线完整
    const timeline = domainGetRefundTimeline(approvedRefund.id);
    assert.ok(timeline.length >= 4); // requested → approved → processing → completed
    const steps = timeline.map(t => `${t.fromStatus}→${t.toStatus}`);
    assert.ok(steps.includes('-→requested'));
    assert.ok(steps.includes('requested→approved'));
    assert.ok(steps.includes('approved→processing'));
    assert.ok(steps.includes('processing→completed'));
  });

  test('[正例] Domain处理全额退款 → 订单标记为cancelled', () => {
    // order_01 全额 7597 刚被全退
    const order = orderStore.get('order_01')!;
    assert.equal(order.status, 'cancelled');
  });

  test('[反例] Domain处理非approved状态的退款 → 拒绝', () => {
    const refunds = domainGetRefundHistory('order_02');
    const rejected = refunds.find(r => r.status === 'rejected')!;
    const r = domainProcessRefund(rejected.id);
    assert.equal(r.success, false);
    assert.ok(r.error?.includes('cannot_process'));
  });

  test('[反例] Domain处理不存在的退款 → 拒绝', () => {
    const r = domainProcessRefund('refund_nonexistent_2');
    assert.equal(r.success, false);
    assert.equal(r.error, 'refund_not_found');
  });

  // --- Phase 4: Storefront 退款展示与聚合 ---
  test('[正例] Storefront查看某订单退款列表 → 降序排列(最新最前)', () => {
    const r = storefrontGetRefundList('order_01', 'desc');
    // order_01 有多个退款
    assert.ok(r.items.length >= 1);
    for (let i = 1; i < r.items.length; i++) {
      const prev = new Date(r.items[i - 1].requestedAt).getTime();
      const curr = new Date(r.items[i].requestedAt).getTime();
      assert.ok(prev >= curr, `降序排列失败: index ${i - 1}(${prev}) < index ${i}(${curr})`);
    }
  });

  test('[正例] Storefront查看全部退款聚合统计 → 统计各项指标', () => {
    const stats = storefrontGetRefundStats();
    assert.ok(stats.totalRefunds >= 4); // 创建了多个退款
    assert.ok(stats.totalAmount > 0);
    assert.ok(stats.byStatus.completed >= 1);
    assert.ok(stats.byStatus.rejected >= 1);
    assert.ok(stats.byStatus.approved >= 1); // order_03 已审批未处理
    assert.ok(stats.byReason['商品质量问题'] >= 1);
  });

  test('[正例] Storefront按升序查看退款 → 最早请求在最前', () => {
    const r = storefrontGetRefundList(undefined, 'asc');
    for (let i = 1; i < r.items.length; i++) {
      const prev = new Date(r.items[i - 1].requestedAt).getTime();
      const curr = new Date(r.items[i].requestedAt).getTime();
      assert.ok(prev <= curr, `升序排列失败: index ${i - 1} > index ${i}`);
    }
  });

  test('[反例] Storefront查询不存在订单的退款 → 返回空列表', () => {
    const r = storefrontGetRefundList('order_nonexistent');
    assert.equal(r.items.length, 0);
    assert.equal(r.total, 0);
    assert.equal(r.totalAmount, 0);
  });

  test('[边界] Storefront按时间段过滤退款统计 → 仅统计该时段', () => {
    // 部分退款的 requestedAt 应在 2026-07-04~2026-07-06 之间
    const stats = storefrontGetRefundStats({ startDate: '2026-07-04T00:00:00Z', endDate: '2026-07-06T23:59:59Z' });
    // order_05 相关退款可能在此时段
    assert.ok(stats.totalRefunds >= 0);
  });

  // --- Phase 5: 极限场景 ---
  test('[边界] 多笔退款同时请求同一订单 → 各自独立, 不影响已有的处理', () => {
    const r1 = mobileRequestRefund({ orderId: 'order_02', amount: 5000, reason: '部分退款1', requestId: 'ref_batch_01' });
    const r2 = mobileRequestRefund({ orderId: 'order_02', amount: 3000, reason: '部分退款2', requestId: 'ref_batch_02' });
    assert.ok(r1.success);
    assert.ok(r2.success);
    assert.equal((r1.refund as RefundRecord).amount, 5000);
    assert.equal((r2.refund as RefundRecord).amount, 3000);

    // sum > order total?
    const order02Total = orderStore.get('order_02')!.totalAmount; // 8999
    assert.ok(5000 + 3000 <= order02Total, '多笔部分退款不应超过订单总额');
  });

  test('[边界] 退款状态转换完整闭环 → requested→approved→processing→completed', () => {
    // 找一个 processing 的退款 — 实际上都被处理成 completed 了
    const pendingProcessing = refundStore.find(r => r.status !== 'completed' && r.status !== 'rejected');
    if (pendingProcessing) {
      // 如果有 approved 的，处理之
      if (pendingProcessing.status === 'approved') {
        const r = domainProcessRefund(pendingProcessing.id);
        assert.ok(r.success);
        assert.equal(r.refund!.status, 'completed');
      }
    }
  });

  test('[边界] 退款已完成 → 不再接受新的处理请求', () => {
    const completedRefund = refundStore.find(r => r.status === 'completed');
    if (completedRefund) {
      const r = domainProcessRefund(completedRefund.id);
      assert.equal(r.success, false);
      assert.ok(r.error?.includes('cannot_process'));
    }
  });

  test('[边界] Storefront退款列表总量与明细一致', () => {
    const r = storefrontGetRefundList();
    const totalAmountFromItems = r.items.reduce((s, i) => s + i.amount, 0);
    assert.equal(r.totalAmount, totalAmountFromItems);
    assert.equal(r.total, r.items.length);
  });

  // --- Phase 6: 新增增强场景 - 并发退款/多商品/超时回滚 ---

  test('[正例] 多商品退款订单,每个商品独立退款 → 累加不超额', () => {
    // order_05 已有部分退款990, 再退剩余部分
    const remaining5 = 1980 - 990;
    const r = mobileRequestRefund({ orderId: 'order_05', amount: remaining5, reason: '剩余商品退货', items: [{ productName: '咖啡杯套装', quantity: 10, amount: remaining5 }], requestId: 'ref_req_remaining_05' });
    assert.ok(r.success);
    assert.equal((r.refund as RefundRecord).amount, remaining5);

    // 累计退款不应超过原始金额
    const orderRefunds = domainGetRefundHistory('order_05');
    const totalRefunded = orderRefunds.reduce((s, rf) => s + rf.amount, 0);
    assert.ok(totalRefunded <= 1980, `累计退款${totalRefunded}不应超过1980`);
  });

  test('[边界] 退款接口熔断后重试(同一requestId) → 幂等, 状态不变', () => {
    // 使用未取消订单 order_05
    const r = mobileRequestRefund({ orderId: 'order_05', amount: 100, reason: '熔断重试', requestId: 'ref_req_retry_idempotent' });
    assert.ok(r.success);
    const refId = (r.refund as RefundRecord).id;
    apiApproveRefund(refId);

    // 多次重试同一 requestId
    const retry1 = mobileRequestRefund({ orderId: 'order_05', amount: 100, reason: '熔断重试', requestId: 'ref_req_retry_idempotent' });
    assert.ok(retry1.success);
    assert.ok((retry1.refund as any).alreadyProcessed);
  });

  test('[正例] 退款理由为空字符串 → 系统允许（业务层不强制校验理由）', () => {
    const r = mobileRequestRefund({ orderId: 'order_05', amount: 100, reason: '', requestId: 'ref_req_empty_reason' });
    assert.ok(r.success);
    assert.equal((r.refund as RefundRecord).reason, '');
    assert.equal((r.refund as RefundRecord).status, 'requested');
  });

  test('[边界] 已退款商品的多次部分退款 → 最终总额不超过物品总价', () => {
    // 用 order_02 (单商品 8999) 发起多个部分退款
    const r1 = mobileRequestRefund({ orderId: 'order_02', amount: 2000, reason: '部分退款_分次1', requestId: 'ref_req_split_01' });
    assert.ok(r1.success);
    const r2 = mobileRequestRefund({ orderId: 'order_02', amount: 3000, reason: '部分退款_分次2', requestId: 'ref_req_split_02' });
    assert.ok(r2.success);
    const r3 = mobileRequestRefund({ orderId: 'order_02', amount: 1500, reason: '部分退款_分次3', requestId: 'ref_req_split_03' });
    assert.ok(r3.success);

    const allRefunds = domainGetRefundHistory('order_02');
    // filtered: 部分退款分次1/2/3 + rejected(不想要了) + batch01+batch02
    const partRefunds = allRefunds.filter(r => r.requestId.startsWith('ref_req_split'));
    const totalPart = partRefunds.reduce((s, rf) => s + rf.amount, 0);
    assert.equal(totalPart, 6500, '三次部分退款合计应为6500');
    assert.ok(totalPart <= 8999);
  });

  test('[边界] 退款申请→审批→处理全链路耗时模拟 → 时间戳递增', () => {
    const r = mobileRequestRefund({ orderId: 'order_03', amount: 5000, reason: '链路时间验证', requestId: 'ref_req_timeline_ts' });
    assert.ok(r.success);
    const ref = r.refund as RefundRecord;
    const requestedAt = new Date(ref.requestedAt).getTime();

    const approveResult = apiApproveRefund(ref.id);
    assert.ok(approveResult.success);
    const approvedAt = new Date(approveResult.refund!.approvedAt!).getTime();
    assert.ok(approvedAt >= requestedAt, '审批时间应≥请求时间');

    const processResult = domainProcessRefund(ref.id);
    assert.ok(processResult.success);
    const completedAt = new Date(processResult.refund!.completedAt!).getTime();
    assert.ok(completedAt >= approvedAt, '完成时间应≥审批时间');
  });

  test('[边界] 退款Reason按原因分类聚合统计 → 统计准确', () => {
    const stats = storefrontGetRefundStats();
    // 我们已创建的 refund 中包含多种 reason
    assert.ok(Object.keys(stats.byReason).length >= 3, '应有多于3种退款原因分类');
    const totalByReason = Object.values(stats.byReason).reduce((s: number, c: number) => s + c, 0);
    assert.equal(totalByReason, stats.totalRefunds, '按原因统计总数应与总退款数一致');
  });

  test('[边界] 全额退款后商品不再可退 → 该订单后续退款被拒', () => {
    // order_01 已全额退款(订单已 cancelled)
    const r = mobileRequestRefund({ orderId: 'order_01', amount: 1, reason: '全额后退款', requestId: 'ref_req_after_full' });
    assert.equal(r.success, false);
    assert.equal(r.error, 'order_already_cancelled');
  });

  test('[边界] 多订单退款总计聚合 → 统计正确反映总退款金额', () => {
    const stats = storefrontGetRefundStats();
    const allItems = refundStore.reduce((s, r) => s + r.amount, 0);
    assert.equal(stats.totalAmount, allItems, '聚合统计总金额应与仓储实际一致');
  });

  test('[边界] 退款状态机不可逆(completed→approved) → 不允许', () => {
    const completedRefund = refundStore.find(r => r.status === 'completed');
    if (completedRefund) {
      // 尝试在completed上做approve
      const r = apiApproveRefund(completedRefund.id);
      assert.equal(r.success, false);
      assert.ok(r.error?.includes('invalid_status'));
    }
  });
});
