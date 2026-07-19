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
} from './supplychain-runtime';

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

const apiOrder = {
  id: 'order-1',
  orderNo: 'PO-20260719-001',
  supplierName: '广州美妆供应链有限公司',
  supplierContact: '李经理',
  status: 'RECEIVED',
  items: [
    {
      productId: 'prod-1',
      productName: '玫瑰精华面膜',
      sku: 'SKU-001',
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
      receivedQuantity: 2,
      returnQuantity: 1,
      damagedQuantity: 0,
    },
  ],
  totalAmount: 200,
  totalPaid: 200,
  paymentStatus: 'PAID',
  receiveStatus: 'COMPLETE',
  expectedDeliveryAt: '2026-07-22T00:00:00.000Z',
  createdBy: '张三',
  createdAt: '2026-07-19T08:00:00.000Z',
  updatedAt: '2026-07-19T08:00:00.000Z',
  notes: [{ id: 'note-1', content: '优先入库', createdAt: '2026-07-19T08:10:00.000Z' }],
  approvals: [{ approverName: '李四' }],
  returns: [
    {
      id: 'return-1',
      purchaseOrderId: 'order-1',
      returnOrderNo: 'RT-20260719-001',
      items: [
        {
          productId: 'prod-1',
          productName: '玫瑰精华面膜',
          sku: 'SKU-001',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100,
          reason: 'DAMAGED',
        },
      ],
      reason: 'DAMAGED',
      totalAmount: 100,
      status: 'COMPLETED',
      reasonDetail: '包装破损',
      appliedBy: '王五',
      appliedAt: '2026-07-20T08:00:00.000Z',
      approvedBy: '赵六',
      approvedAt: '2026-07-20T09:00:00.000Z',
      completedAt: '2026-07-20T10:00:00.000Z',
      createdAt: '2026-07-20T08:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
  ],
};

describe('supplychain-runtime 映射', () => {
  it('采购列表映射应归一化状态和日期', () => {
    const item = mapPurchaseOrderToListItem(apiOrder);

    assert.equal(item.orderNo, 'PO-20260719-001');
    assert.equal(item.status, 'received');
    assert.equal(item.itemsCount, 1);
    assert.equal(item.orderDate, '2026-07-19');
  });

  it('采购详情映射应优先使用 API 字段', () => {
    const detail = mapPurchaseOrderToDetail(apiOrder, fallbackPurchaseDetail);

    assert.equal(detail.supplier, '广州美妆供应链有限公司');
    assert.equal(detail.supplierContact, '李经理');
    assert.equal(detail.status, 'received');
    assert.equal(detail.remark, '优先入库');
    assert.equal(detail.approver, '李四');
    assert.equal(detail.items[0]?.amount, 200);
  });

  it('退货列表聚合应从采购单 returns 中展开', () => {
    const items = flattenPurchaseReturns([apiOrder]);

    assert.equal(items.length, 1);
    assert.equal(items[0]?.returnNo, 'RT-20260719-001');
    assert.equal(items[0]?.reason, '包装破损');
    assert.equal(items[0]?.status, 'closed');
  });

  it('退货详情解析应命中指定 returnId', () => {
    const detail = resolvePurchaseReturnDetail([apiOrder], 'return-1', fallbackReturnDetail);

    assert.ok(detail);
    assert.equal(detail?.returnNo, 'RT-20260719-001');
    assert.equal(detail?.productName, '玫瑰精华面膜');
    assert.equal(detail?.processor, '赵六');
    assert.equal(detail?.processedDate, '2026-07-20');
  });

  it('退货详情解析未命中时应返回 null', () => {
    const detail = resolvePurchaseReturnDetail([apiOrder], 'missing-return', fallbackReturnDetail);

    assert.equal(detail, null);
  });

  it('采购单动作映射应将 confirmed 路由到 approve 接口', () => {
    const request = buildMiniappPurchaseOrderActionRequest('order-1', 'confirmed', fallbackPurchaseDetail);

    assert.equal(request.path, '/inventory/purchase/orders/order-1/approve');
    assert.deepEqual(request.body, {
      approverId: 'miniapp-supplychain-operator',
      approverName: '小程序供应链操作员',
      comment: '由小程序采购单详情页发起审批通过。',
    });
  });

  it('采购单收货动作应构造 receive 请求体', () => {
    const request = buildMiniappPurchaseOrderActionRequest('order-1', 'received', {
      ...fallbackPurchaseDetail,
      items: [
        {
          productId: 'prod-1',
          sku: 'SKU-001',
          name: '玫瑰精华面膜',
          spec: '30ml/盒',
          qty: 2,
          unit: '件',
          unitPrice: 100,
          amount: 200,
        },
      ],
    });

    assert.equal(request.path, '/inventory/purchase/orders/order-1/receive');
    assert.deepEqual(request.body, {
      items: [{ productId: 'prod-1', receivedQuantity: 2, damagedQuantity: 0 }],
      warehouseNote: '回退备注',
      operatorId: 'miniapp-supplychain-operator',
    });
  });

  it('退货动作映射应识别 approved 为真实审批接口', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'approved', '审批备注');

    assert.equal(execution.supported, true);
    assert.equal(execution.apiNextStatus, 'approved');
    assert.equal(execution.request?.path, '/inventory/purchase/returns/return-1/approve');
    assert.equal((execution.request?.body as { comment?: string }).comment, '审批备注');
  });

  it('退货动作映射应识别 inspecting 为真实质检接口', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'inspecting', '质检备注');

    assert.equal(execution.supported, true);
    assert.equal(execution.apiNextStatus, 'inspecting');
    assert.equal(execution.request?.path, '/inventory/purchase/returns/return-1/inspect');
    assert.equal((execution.request?.body as { comment?: string }).comment, '质检备注');
  });

  it('退货动作映射应识别 rejected 为真实驳回接口', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'rejected', '驳回备注');

    assert.equal(execution.supported, true);
    assert.equal(execution.apiNextStatus, 'rejected');
    assert.equal(execution.request?.path, '/inventory/purchase/returns/return-1/reject');
    assert.equal((execution.request?.body as { comment?: string }).comment, '驳回备注');
  });

  it('退货动作映射应将 refunded 路由到 refund 接口', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'refunded', '退款备注');

    assert.equal(execution.supported, true);
    assert.equal(execution.apiNextStatus, 'refunded');
    assert.equal(execution.request?.path, '/inventory/purchase/returns/return-1/refund');
    assert.equal((execution.request?.body as { comment?: string }).comment, '退款备注');
  });

  it('退货动作映射应将 exchanged 路由到 exchange 接口', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'exchanged', '换货备注');

    assert.equal(execution.supported, true);
    assert.equal(execution.apiNextStatus, 'exchanged');
    assert.equal(execution.request?.path, '/inventory/purchase/returns/return-1/exchange');
    assert.equal((execution.request?.body as { comment?: string }).comment, '换货备注');
  });

  it('退货动作映射应将 closed 路由到 close 接口', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'closed', '关闭备注');

    assert.equal(execution.supported, true);
    assert.equal(execution.apiNextStatus, 'closed');
    assert.equal(execution.request?.path, '/inventory/purchase/returns/return-1/close');
    assert.equal((execution.request?.body as { comment?: string }).comment, '关闭备注');
  });

  it('退货动作映射应将 pending 标记为 fallback-only', () => {
    const execution = resolveMiniappReturnActionExecution('return-1', 'pending');

    assert.equal(execution.supported, false);
    assert.equal(execution.apiNextStatus, 'pending');
  });
});
