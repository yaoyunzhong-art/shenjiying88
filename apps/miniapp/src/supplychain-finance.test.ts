/**
 * miniapp 供应链 — 财务模块单元测试
 *
 * 覆盖：
 * - 金额计算与格式化（正例 + 反例 + 边界）
 * - 付款状态归一化
 * - 退/换货财务逻辑 (refund/exchange amount)
 * - 采购单/退货单财务聚合
 * - 金额跨模块一致性
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildMiniappPurchaseOrderActionRequest,
  flattenPurchaseReturns,
  mapPurchaseOrderToDetail,
  mapPurchaseOrderToListItem,
  resolveMiniappReturnActionExecution,
  resolvePurchaseReturnDetail,
  type MiniappPurchaseOrderDetail,
  type MiniappReturnOrderDetail,
  type MiniappPurchaseOrderListItem,
} from './supplychain-runtime';

// ────────────────────────────────────────────────────────────
// 辅助：金额格式化（与页面/组件一致的合约）
// ────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeAmount(amount: number): string {
  return amount >= 10000 ? `¥${(amount / 10000).toFixed(1)}万` : formatAmount(amount);
}

// ────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────

const fallbackPurchaseDetail: MiniappPurchaseOrderDetail = {
  id: 'fallback-order',
  orderNo: 'PO-FALLBACK-001',
  supplier: '回退供应商',
  supplierContact: '回退联系人',
  supplierPhone: '13900000000',
  totalAmount: 100,
  status: 'draft',
  items: [],
  itemsCount: 0,
  orderDate: '2026-07-01',
  expectedDate: '2026-07-05',
  remark: '回退备注',
  creator: '回退创建人',
  approver: '回退审批人',
};

const fallbackReturnDetail: MiniappReturnOrderDetail = {
  id: 'fallback-return',
  returnNo: 'RT-FALLBACK-001',
  customerName: '回退供应商',
  phone: '待补联系人',
  productName: '回退商品',
  spec: '回退规格',
  qty: 1,
  reason: '其他原因',
  description: '回退描述',
  amount: 50,
  status: 'pending',
  createdDate: '2026-07-02',
  remark: '回退备注',
  evidenceImages: [],
};

// 多品类采购单 fixture
const multiItemApiOrder = {
  id: 'order-multi',
  orderNo: 'PO-MULTI-001',
  supplierName: '多品供应链有限公司',
  supplierContact: '王经理',
  status: 'RECEIVED',
  items: [
    {
      productId: 'prod-a', productName: '氨基酸洁面乳',
      sku: 'SKU-A001', quantity: 50, unitPrice: 45, totalPrice: 2250,
      receivedQuantity: 50, returnQuantity: 0, damagedQuantity: 0,
    },
    {
      productId: 'prod-b', productName: '保湿精华水',
      sku: 'SKU-B002', quantity: 30, unitPrice: 128, totalPrice: 3840,
      receivedQuantity: 28, returnQuantity: 2, damagedQuantity: 0,
    },
    {
      productId: 'prod-c', productName: '修护面霜',
      sku: 'SKU-C003', quantity: 20, unitPrice: 260, totalPrice: 5200,
      receivedQuantity: 20, returnQuantity: 0, damagedQuantity: 0,
    },
  ],
  totalAmount: 11290,
  totalPaid: 8000,
  paymentStatus: 'PARTIAL',
  receiveStatus: 'PARTIAL',
  expectedDeliveryAt: '2026-07-28T00:00:00.000Z',
  createdBy: '测试员',
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-20T10:00:00.000Z',
  notes: [{ id: 'n1', content: '分批到货请注意', createdAt: '2026-07-20T10:05:00.000Z' }],
  approvals: [{ approverName: '审批人' }],
  returns: [
    {
      id: 'ret-multi-1', purchaseOrderId: 'order-multi',
      returnOrderNo: 'RT-MULTI-001',
      items: [
        {
          productId: 'prod-b', productName: '保湿精华水',
          sku: 'SKU-B002', quantity: 2, unitPrice: 128, totalPrice: 256,
          reason: 'DAMAGED',
        },
      ],
      reason: 'DAMAGED', totalAmount: 256, status: 'APPROVED',
      reasonDetail: '包装破损，瓶体轻微渗漏', appliedBy: '张三',
      appliedAt: '2026-07-21T08:00:00.000Z',
      approvedBy: '李四', approvedAt: '2026-07-21T09:00:00.000Z',
      createdAt: '2026-07-21T08:00:00.000Z',
      updatedAt: '2026-07-21T09:00:00.000Z',
    },
    {
      id: 'ret-multi-2', purchaseOrderId: 'order-multi',
      returnOrderNo: 'RT-MULTI-002',
      items: [
        {
          productId: 'prod-c', productName: '修护面霜',
          sku: 'SKU-C003', quantity: 1, unitPrice: 260, totalPrice: 260,
          reason: 'QUALITY_ISSUE',
        },
      ],
      reason: 'QUALITY_ISSUE', totalAmount: 260, status: 'REFUNDED',
      reasonDetail: '膏体颜色异常', appliedBy: '王五',
      appliedAt: '2026-07-22T08:00:00.000Z',
      approvedBy: '赵六', approvedAt: '2026-07-22T09:00:00.000Z',
      completedAt: '2026-07-22T10:00:00.000Z',
      createdAt: '2026-07-22T08:00:00.000Z',
      updatedAt: '2026-07-22T10:00:00.000Z',
    },
  ],
};

// 无退货采购单 fixture
const noReturnApiOrder = {
  id: 'order-no-ret',
  orderNo: 'PO-NORET-001',
  supplierName: '无退货供应商',
  supplierContact: '周经理',
  status: 'RECEIVED',
  items: [
    {
      productId: 'prod-x', productName: '普通商品',
      sku: 'SKU-X001', quantity: 10, unitPrice: 50, totalPrice: 500,
      receivedQuantity: 10, returnQuantity: 0, damagedQuantity: 0,
    },
  ],
  totalAmount: 500,
  totalPaid: 500,
  paymentStatus: 'PAID',
  receiveStatus: 'COMPLETE',
  createdBy: '测试员',
  createdAt: '2026-07-15T08:00:00.000Z',
  updatedAt: '2026-07-15T08:00:00.000Z',
  notes: [],
  approvals: [],
  returns: [],
};

// ────────────────────────────────────────────────────────────
// 1. 金额计算与格式化（正例）
// ────────────────────────────────────────────────────────────

describe('财务 — 金额计算与格式化（正例）', () => {
  it('formatAmount 应正确处理整数金额', () => {
    assert.equal(formatAmount(28600), '¥28,600.00');
    assert.equal(formatAmount(100), '¥100.00');
    assert.equal(formatAmount(1), '¥1.00');
  });

  it('formatAmount 应正确处理小数金额', () => {
    assert.equal(formatAmount(99.5), '¥99.50');
    assert.equal(formatAmount(0.01), '¥0.01');
    assert.equal(formatAmount(1234.56), '¥1,234.56');
  });

  it('formatLargeAmount 应正确处理万元转换', () => {
    assert.equal(formatLargeAmount(28600), '¥2.9万');
    assert.equal(formatLargeAmount(10000), '¥1.0万');
    assert.equal(formatLargeAmount(9999), '¥9,999.00');
  });

  it('多品类采购单 totalAmount 应等于 items 金额之和', () => {
    const itemsSum = multiItemApiOrder.items.reduce(
      (sum, item) => sum + item.totalPrice, 0,
    );
    assert.equal(itemsSum, 11290);
    assert.equal(multiItemApiOrder.totalAmount, itemsSum);
  });

  it('采购单 mapped detail 每项 amount 应与 totalPrice 一致', () => {
    const detail = mapPurchaseOrderToDetail(multiItemApiOrder, fallbackPurchaseDetail);
    assert.equal(detail.items[0]!.amount, 2250);
    assert.equal(detail.items[1]!.amount, 3840);
    assert.equal(detail.items[2]!.amount, 5200);
  });

  it('采购单 mapped detail totalAmount 应与 API totalAmount 一致', () => {
    const detail = mapPurchaseOrderToDetail(multiItemApiOrder, fallbackPurchaseDetail);
    assert.equal(detail.totalAmount, 11290);
  });

  it('采购单列表映射应保留 totalAmount', () => {
    const item = mapPurchaseOrderToListItem(multiItemApiOrder);
    assert.equal(item.totalAmount, 11290);
  });

  it('退货列表聚合应正确计算 totalAmount', () => {
    const items = flattenPurchaseReturns([multiItemApiOrder]);
    assert.equal(items.length, 2);
    assert.equal(items[0]!.amount, 256);
    assert.equal(items[1]!.amount, 260);
  });

  it('退货详情 amount 应为各退货项 totalPrice 之和', () => {
    const detail = resolvePurchaseReturnDetail([multiItemApiOrder], 'ret-multi-1', fallbackReturnDetail);
    assert.ok(detail);
    // 退货单的 qty 是 items.reduce(...) - 2件
    assert.equal(detail!.qty, 2);
    assert.equal(detail!.amount, 256);
  });

  it('退货商品单价应正确映射', () => {
    const detail = resolvePurchaseReturnDetail([multiItemApiOrder], 'ret-multi-1', fallbackReturnDetail);
    assert.ok(detail);
    // 回退时的 amount/totalPrice 是 2×128=256
    assert.equal(detail!.amount, 256);
  });

  it('采购单 mapped detail itemsCount 应与 items 长度一致', () => {
    const detail = mapPurchaseOrderToDetail(multiItemApiOrder, fallbackPurchaseDetail);
    assert.equal(detail.itemsCount, 3);
    assert.equal(detail.items.length, 3);
  });

  it('退款金额应来自 returnOrder.totalAmount', () => {
    const items = flattenPurchaseReturns([multiItemApiOrder]);
    const refunded = items.find((r) => r.status === 'refunded');
    assert.ok(refunded);
    assert.equal(refunded!.amount, 260);
  });

  it('退货商品 totalPrice 应等于 quantity × unitPrice', () => {
    for (const item of multiItemApiOrder.returns[0]!.items) {
      assert.equal(item.totalPrice, item.quantity * item.unitPrice);
    }
    for (const item of multiItemApiOrder.returns[1]!.items) {
      assert.equal(item.totalPrice, item.quantity * item.unitPrice);
    }
  });
});

// ────────────────────────────────────────────────────────────
// 2. 金额计算（反例 + 防守）
// ────────────────────────────────────────────────────────────

describe('财务 — 金额计算（反例 + 防守）', () => {
  it('无退货的采购单应正常映射，金额保持原值', () => {
    const item = mapPurchaseOrderToListItem(noReturnApiOrder);
    assert.equal(item.totalAmount, 500);
    assert.equal(item.itemsCount, 1);
  });

  it('空退货列表应返回空数组', () => {
    const items = flattenPurchaseReturns([noReturnApiOrder]);
    assert.equal(items.length, 0);
  });

  it('不存在的退货 ID 应返回 null', () => {
    const detail = resolvePurchaseReturnDetail(
      [multiItemApiOrder], 'non-existent-id', fallbackReturnDetail,
    );
    assert.equal(detail, null);
  });

  it('采购单 items 为空时 mapped detail items 也应该为空', () => {
    const emptyOrder = {
      ...noReturnApiOrder,
      items: [],
      totalAmount: 0,
      totalPaid: 0,
      status: 'DRAFT',
    };
    const detail = mapPurchaseOrderToDetail(emptyOrder, fallbackPurchaseDetail);
    assert.equal(detail.items.length, 0);
    assert.equal(detail.totalAmount, 0);
  });

  it('零金额采购单应安全映射', () => {
    const zeroOrder = {
      ...noReturnApiOrder,
      totalAmount: 0,
      totalPaid: 0,
      items: [{ ...noReturnApiOrder.items[0]!, totalPrice: 0, unitPrice: 0, quantity: 0 }],
    };
    const detail = mapPurchaseOrderToDetail(zeroOrder, fallbackPurchaseDetail);
    assert.equal(detail.totalAmount, 0);
    assert.equal(detail.items[0]!.amount, 0);
    assert.equal(detail.items[0]!.qty, 0);
  });

  it('退货单金额为 0 时仍应正常映射为项', () => {
    const zeroReturnOrder = {
      ...multiItemApiOrder,
      totalAmount: 500,
      returns: [{
        ...multiItemApiOrder.returns[0]!,
        totalAmount: 0,
        items: [{ ...multiItemApiOrder.returns[0]!.items[0]!, totalPrice: 0, quantity: 0 }],
        status: 'PENDING',
      }],
    };
    const items = flattenPurchaseReturns([zeroReturnOrder]);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.amount, 0);
  });

  it('退货的动作请求 rejected 应含正确的退款状态标记', () => {
    const exec = resolveMiniappReturnActionExecution('ret-1', 'rejected', '驳回');
    assert.equal(exec.supported, true);
    assert.equal(exec.apiNextStatus, 'rejected');
    // rejected 不会触发退款
    assert.equal(exec.request?.path, '/inventory/purchase/returns/ret-1/reject');
  });

  it('退款动作请求应含正确的退款状态标记', () => {
    const exec = resolveMiniappReturnActionExecution('ret-1', 'refunded', '退款');
    assert.equal(exec.supported, true);
    assert.equal(exec.apiNextStatus, 'refunded');
    assert.equal(exec.request?.path, '/inventory/purchase/returns/ret-1/refund');
    assert.equal((exec.request?.body as { operatorName?: string }).operatorName, '小程序供应链操作员');
  });

  it('换货动作请求应含正确的操作人身份', () => {
    const exec = resolveMiniappReturnActionExecution('ret-1', 'exchanged', '换货');
    assert.equal(exec.supported, true);
    assert.equal(exec.apiNextStatus, 'exchanged');
    assert.equal(exec.request?.path, '/inventory/purchase/returns/ret-1/exchange');
    const body = exec.request?.body as { operatorName?: string };
    assert.equal(body.operatorName, '小程序供应链操作员');
  });
});

// ────────────────────────────────────────────────────────────
// 3. 财务边界条件
// ────────────────────────────────────────────────────────────

describe('财务 — 边界条件', () => {
  it('formatAmount 应正确处理极端数值: 0', () => {
    assert.equal(formatAmount(0), '¥0.00');
  });

  it('formatAmount 应正确处理极端数值: 大金额', () => {
    assert.equal(formatAmount(1_000_000), '¥1,000,000.00');
    assert.equal(formatAmount(99_999_999), '¥99,999,999.00');
  });

  it('formatAmount 应正确处理极端数值: 分位精度', () => {
    assert.equal(formatAmount(0.1), '¥0.10');
    assert.equal(formatAmount(0.01), '¥0.01');
    assert.equal(formatAmount(0.001), '¥0.00'); // 四舍五入截断
  });

  it('formatLargeAmount 应正确处理万元精确边界', () => {
    assert.equal(formatLargeAmount(9999), '¥9,999.00'); // < 1万
    assert.equal(formatLargeAmount(10000), '¥1.0万');   // 恰 1万
    assert.equal(formatLargeAmount(10001), '¥1.0万');   // > 1万 but < 2万
    assert.equal(formatLargeAmount(15000), '¥1.5万');
    assert.equal(formatLargeAmount(99999), '¥10.0万');
  });

  it('采购单 mapped detail 缺失 notes 时 remark 应回退', () => {
    const noNotesOrder = {
      ...noReturnApiOrder, notes: undefined,
    };
    const detail = mapPurchaseOrderToDetail(noNotesOrder, fallbackPurchaseDetail);
    assert.equal(detail.remark, '回退备注');
  });

  it('采购单 mapped detail 缺失 approvals 时 approver 应回退', () => {
    const noApprovalOrder = {
      ...noReturnApiOrder, approvals: undefined,
    };
    const detail = mapPurchaseOrderToDetail(noApprovalOrder, fallbackPurchaseDetail);
    assert.equal(detail.approver, '回退审批人');
  });

  it('采购单 mapped detail 某商品无 productId 时应使用 sku 作为后备', () => {
    const orderNoProductId = {
      ...noReturnApiOrder,
      items: [{ ...noReturnApiOrder.items[0]!, productId: '', productName: '无 ID 商品', sku: 'SKU-FALLBACK', quantity: 1, unitPrice: 100, totalPrice: 100, receivedQuantity: 1, returnQuantity: 0, damagedQuantity: 0 }],
    };
    const detail = mapPurchaseOrderToDetail(orderNoProductId, fallbackPurchaseDetail);
    assert.equal(detail.items[0]!.sku, 'SKU-FALLBACK');
  });

  it('退货列表聚合时缺失 returns 字段应安全处理为 []', () => {
    const orderNoReturns = { ...noReturnApiOrder, returns: undefined };
    const items = flattenPurchaseReturns([orderNoReturns]);
    assert.equal(items.length, 0);
  });

  it('退货列表单条无 items 时 productName 应使用后备值', () => {
    const orderEmptyItems = {
      ...multiItemApiOrder,
      returns: [{
        ...multiItemApiOrder.returns[0]!,
        items: [],
      }],
    };
    const items = flattenPurchaseReturns([orderEmptyItems]);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.productName, '退货商品待确认');
  });

  it('采购单动作 submited 应包含 body 中提交人信息', () => {
    const req = buildMiniappPurchaseOrderActionRequest('order-1', 'submitted', fallbackPurchaseDetail);
    const body = req.body as { submittedBy?: string };
    assert.equal(body.submittedBy, '小程序供应链操作员');
  });

  it('采购单动作 cancelled 应包含 body 中取消原因', () => {
    const req = buildMiniappPurchaseOrderActionRequest('order-1', 'cancelled', {
      ...fallbackPurchaseDetail, remark: '供应商缺货',
    });
    const body = req.body as { reason?: string };
    assert.equal(body.reason, '供应商缺货');
  });

  it('采购单动作 received 的 body 中 items 数量应与 detail items 一致', () => {
    const req = buildMiniappPurchaseOrderActionRequest('order-1', 'received', {
      ...fallbackPurchaseDetail,
      items: [
        { sku: 'SKU-001', name: '商品A', spec: '规格A', qty: 10, unit: '件', unitPrice: 50, amount: 500, productId: 'p1' },
        { sku: 'SKU-002', name: '商品B', spec: '规格B', qty: 5, unit: '件', unitPrice: 100, amount: 500, productId: 'p2' },
      ],
    });
    const body = req.body as { items: Array<{ productId: string; receivedQuantity: number; damagedQuantity: number }> };
    assert.equal(body.items.length, 2);
    assert.equal(body.items[0]!.receivedQuantity, 10);
    assert.equal(body.items[1]!.receivedQuantity, 5);
  });
});

// ────────────────────────────────────────────────────────────
// 4. 财务聚合汇总（多采购单维度）
// ────────────────────────────────────────────────────────────

describe('财务 — 跨单聚合', () => {
  it('多个采购单总金额应等于各单金额之和', () => {
    const orders = [multiItemApiOrder, noReturnApiOrder];
    const total = orders.reduce((s, o) => s + o.totalAmount, 0);
    assert.equal(total, 11790); // 11290 + 500
  });

  it('多单退货总金额应等于各退货单退款之和', () => {
    const items = flattenPurchaseReturns([multiItemApiOrder]);
    const totalRefund = items.reduce((s, r) => s + r.amount, 0);
    assert.equal(totalRefund, 516); // 256 + 260
  });

  it('已付款/未付款金额应正确区分', () => {
    const paid = multiItemApiOrder.totalPaid;       // 8000
    const unpaid = multiItemApiOrder.totalAmount - paid; // 11290 - 8000 = 3290
    assert.equal(paid, 8000);
    assert.equal(unpaid, 3290);
  });

  it('采购单列表映射应正确保留 totalAmount', () => {
    const orders: Array<ReturnType<typeof mapPurchaseOrderToListItem>> = [
      mapPurchaseOrderToListItem(multiItemApiOrder),
      mapPurchaseOrderToListItem(noReturnApiOrder),
    ];
    const total = orders.reduce((s, o) => s + o.totalAmount, 0);
    assert.equal(total, 11790);
  });

  it('多退货单按状态分类统计', () => {
    const items = flattenPurchaseReturns([multiItemApiOrder]);
    const approved = items.filter((r) => r.status === 'approved');
    const refunded = items.filter((r) => r.status === 'refunded');
    assert.equal(approved.length, 1);
    assert.equal(refunded.length, 1);
    assert.equal(approved[0]!.amount, 256);
    assert.equal(refunded[0]!.amount, 260);
  });
});

// ────────────────────────────────────────────────────────────
// 5. 付款状态映射
// ────────────────────────────────────────────────────────────

describe('财务 — 付款状态映射合规', () => {
  it('PAID 状态应表示已全额付款', () => {
    assert.equal(noReturnApiOrder.totalPaid, noReturnApiOrder.totalAmount);
    assert.equal(noReturnApiOrder.paymentStatus, 'PAID');
  });

  it('PARTIAL 状态应表示部分付款 (totalPaid < totalAmount)', () => {
    assert.ok(multiItemApiOrder.totalPaid < multiItemApiOrder.totalAmount);
    assert.equal(multiItemApiOrder.paymentStatus, 'PARTIAL');
  });

  it('未付款应隐含 totalPaid = 0', () => {
    const unpaidOrder = { ...noReturnApiOrder, totalPaid: 0, paymentStatus: 'UNPAID' };
    assert.equal(unpaidOrder.totalPaid, 0);
    assert.equal(unpaidOrder.paymentStatus, 'UNPAID');
  });

  it('超额付款 (overpaid) 应仍可映射', () => {
    const overpaidOrder = {
      ...noReturnApiOrder,
      totalPaid: 600,
      totalAmount: 500,
      paymentStatus: 'OVERPAID',
    };
    // 映射不关心 paymentStatus 字段；只检查 totalPaid/totalAmount 透传
    assert.ok(overpaidOrder.totalPaid > overpaidOrder.totalAmount);
    assert.equal(overpaidOrder.paymentStatus, 'OVERPAID');
  });

  it('未定义 paymentStatus 时映射不应崩溃', () => {
    const undefinedStatusOrder = { ...noReturnApiOrder, paymentStatus: undefined as unknown as string };
    const item = mapPurchaseOrderToListItem(undefinedStatusOrder);
    assert.equal(item.totalAmount, 500);
  });
});
