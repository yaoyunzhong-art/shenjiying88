import { ApiClient, buildActorHeaders, getDefaultApiBaseUrl } from '@m5/sdk';

const defaultMiniappContext = {
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland',
} as const;

type DeliveryMode = 'api' | 'fallback';

type MiniappPurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'shipped'
  | 'received'
  | 'cancelled';

type MiniappReturnStatus =
  | 'pending'
  | 'inspecting'
  | 'approved'
  | 'rejected'
  | 'refunded'
  | 'exchanged'
  | 'closed';

interface ApiPurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  returnQuantity: number;
  damagedQuantity: number;
}

interface ApiPurchaseOrderNote {
  id: string;
  content: string;
  authorName?: string;
  createdAt: string;
}

interface ApiPurchaseApproval {
  approverName: string;
}

interface ApiPurchaseReturnItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reason: string;
}

interface ApiPurchaseReturn {
  id: string;
  purchaseOrderId: string;
  returnOrderNo: string;
  items: ApiPurchaseReturnItem[];
  reason: string;
  totalAmount: number;
  status: string;
  reasonDetail?: string;
  appliedBy?: string;
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiPurchaseOrder {
  id: string;
  orderNo: string;
  supplierName?: string;
  supplierContact?: string;
  status: string;
  items: ApiPurchaseOrderItem[];
  totalAmount: number;
  totalPaid: number;
  paymentStatus: string;
  receiveStatus: string;
  expectedDeliveryAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  notes?: ApiPurchaseOrderNote[];
  approvals?: ApiPurchaseApproval[];
  returns?: ApiPurchaseReturn[];
}

export interface MiniappPurchaseOrderListItem {
  id: string;
  orderNo: string;
  supplier: string;
  totalAmount: number;
  status: MiniappPurchaseOrderStatus;
  itemsCount: number;
  orderDate: string;
}

export interface MiniappPurchaseOrderDetailItem {
  productId?: string;
  sku: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface MiniappPurchaseOrderDetail {
  id: string;
  orderNo: string;
  supplier: string;
  supplierContact: string;
  supplierPhone: string;
  totalAmount: number;
  status: MiniappPurchaseOrderStatus;
  items: MiniappPurchaseOrderDetailItem[];
  itemsCount: number;
  orderDate: string;
  expectedDate: string;
  remark: string;
  creator: string;
  approver: string;
}

export interface MiniappReturnOrderListItem {
  id: string;
  returnNo: string;
  customerName: string;
  phone: string;
  productName: string;
  reason: string;
  amount: number;
  status: MiniappReturnStatus;
  createdDate: string;
}

export interface MiniappReturnOrderDetail {
  id: string;
  returnNo: string;
  customerName: string;
  phone: string;
  productName: string;
  spec: string;
  qty: number;
  reason: string;
  description: string;
  amount: number;
  status: MiniappReturnStatus;
  createdDate: string;
  processedDate?: string;
  processor?: string;
  remark?: string;
  evidenceImages?: string[];
}

export interface MiniappSupplychainSnapshot<T> {
  deliveryMode: DeliveryMode;
  data: T;
  note: string;
}

export interface MiniappSupplychainMutationResult<TStatus extends string> {
  deliveryMode: DeliveryMode;
  success: boolean;
  nextStatus: TStatus;
  note: string;
}

function createMiniappSupplychainClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: defaultMiniappContext.tenantId,
    brandId: defaultMiniappContext.brandId,
    storeId: defaultMiniappContext.storeId,
    marketCode: defaultMiniappContext.marketCode,
    headers: buildActorHeaders({
      actorId: miniappSupplychainActor.id,
      actorType: miniappSupplychainActor.type,
      actorName: miniappSupplychainActor.name,
      tenantId: defaultMiniappContext.tenantId,
      brandId: defaultMiniappContext.brandId,
      storeId: defaultMiniappContext.storeId,
      roles: miniappSupplychainActor.roles,
      permissions: miniappSupplychainActor.permissions,
      authenticated: true,
    }),
  });
}

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }

  return value.slice(0, 10);
}

function normalizePurchaseOrderStatus(status?: string): MiniappPurchaseOrderStatus {
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'PENDING_APPROVAL':
      return 'submitted';
    case 'APPROVED':
      return 'confirmed';
    case 'ORDERED':
      return 'shipped';
    case 'PARTIALLY_RECEIVED':
    case 'RECEIVED':
      return 'received';
    case 'REJECTED':
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'draft';
  }
}

function normalizeReturnStatus(status?: string): MiniappReturnStatus {
  switch (status) {
    case 'PENDING':
      return 'pending';
    case 'REJECTED':
      return 'rejected';
    case 'APPROVED':
      return 'approved';
    case 'SHIPPED':
      return 'inspecting';
    case 'REFUNDED':
      return 'refunded';
    case 'EXCHANGED':
      return 'exchanged';
    case 'CLOSED':
    case 'COMPLETED':
      return 'closed';
    default:
      return 'pending';
  }
}

function normalizeReturnReason(reason?: string): string {
  switch (reason) {
    case 'QUALITY_ISSUE':
      return '品质问题';
    case 'WRONG_PRODUCT':
      return '发错货';
    case 'DAMAGED':
      return '包装破损';
    case 'OVER_DELIVERY':
      return '超量到货';
    case 'OTHER':
      return '其他原因';
    default:
      return reason ?? '其他原因';
  }
}

export function mapPurchaseOrderToListItem(order: ApiPurchaseOrder): MiniappPurchaseOrderListItem {
  return {
    id: order.id,
    orderNo: order.orderNo,
    supplier: order.supplierName ?? '未命名供应商',
    totalAmount: order.totalAmount,
    status: normalizePurchaseOrderStatus(order.status),
    itemsCount: order.items.length,
    orderDate: formatDate(order.createdAt),
  };
}

export function mapPurchaseOrderToDetail(
  order: ApiPurchaseOrder,
  fallback: MiniappPurchaseOrderDetail,
): MiniappPurchaseOrderDetail {
  return {
    id: order.id,
    orderNo: order.orderNo,
    supplier: order.supplierName ?? fallback.supplier,
    supplierContact: order.supplierContact ?? fallback.supplierContact,
    supplierPhone: order.supplierContact ?? fallback.supplierPhone,
    totalAmount: order.totalAmount,
    status: normalizePurchaseOrderStatus(order.status),
    items: order.items.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.productName,
      spec: item.sku,
      qty: item.quantity,
      unit: '件',
      unitPrice: item.unitPrice,
      amount: item.totalPrice,
    })),
    itemsCount: order.items.length,
    orderDate: formatDate(order.createdAt),
    expectedDate: formatDate(order.expectedDeliveryAt),
    remark: order.notes?.map((note) => note.content).join('；') || fallback.remark,
    creator: order.createdBy ?? fallback.creator,
    approver: order.approvals?.at(-1)?.approverName ?? fallback.approver,
  };
}

export function flattenPurchaseReturns(
  orders: ApiPurchaseOrder[],
): MiniappReturnOrderListItem[] {
  return orders.flatMap((order) =>
    (order.returns ?? []).map((returnOrder) => ({
      id: returnOrder.id,
      returnNo: returnOrder.returnOrderNo,
      customerName: order.supplierName ?? '供应商待确认',
      phone: order.supplierContact ?? '待补联系人',
      productName: returnOrder.items[0]?.productName ?? '退货商品待确认',
      reason: normalizeReturnReason(returnOrder.reason),
      amount: returnOrder.totalAmount,
      status: normalizeReturnStatus(returnOrder.status),
      createdDate: formatDate(returnOrder.appliedAt || returnOrder.createdAt),
    })),
  );
}

export function resolvePurchaseReturnDetail(
  orders: ApiPurchaseOrder[],
  returnId: string,
  fallback: MiniappReturnOrderDetail,
): MiniappReturnOrderDetail | null {
  for (const order of orders) {
    for (const returnOrder of order.returns ?? []) {
      if (returnOrder.id !== returnId) {
        continue;
      }

      return {
        id: returnOrder.id,
        returnNo: returnOrder.returnOrderNo,
        customerName: order.supplierName ?? fallback.customerName,
        phone: order.supplierContact ?? fallback.phone,
        productName: returnOrder.items[0]?.productName ?? fallback.productName,
        spec: returnOrder.items[0]?.sku ?? fallback.spec,
        qty: returnOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        reason: normalizeReturnReason(returnOrder.reason),
        description: returnOrder.reasonDetail ?? fallback.description,
        amount: returnOrder.totalAmount,
        status: normalizeReturnStatus(returnOrder.status),
        createdDate: formatDate(returnOrder.appliedAt || returnOrder.createdAt),
        processedDate: formatDate(returnOrder.completedAt || returnOrder.approvedAt),
        processor: returnOrder.approvedBy ?? fallback.processor,
        remark: returnOrder.reasonDetail ?? fallback.remark,
        evidenceImages: fallback.evidenceImages ?? [],
      };
    }
  }

  return null;
}

interface MiniappActionRequest {
  path: string;
  body?: unknown;
}

const miniappSupplychainActor = {
  id: 'miniapp-supplychain-operator',
  name: '小程序供应链操作员',
  type: 'employee-user',
  roles: ['STORE_MANAGER', 'OPERATIONS'],
  permissions: ['inventory.purchase.read', 'inventory.purchase.write'],
} as const;

export function buildMiniappPurchaseOrderActionRequest(
  orderId: string,
  nextStatus: MiniappPurchaseOrderStatus,
  detail: MiniappPurchaseOrderDetail,
): MiniappActionRequest {
  switch (nextStatus) {
    case 'submitted':
      return {
        path: `/inventory/purchase/orders/${orderId}/submit`,
        body: { submittedBy: miniappSupplychainActor.name },
      };
    case 'confirmed':
      return {
        path: `/inventory/purchase/orders/${orderId}/approve`,
        body: {
          approverId: miniappSupplychainActor.id,
          approverName: miniappSupplychainActor.name,
          comment: '由小程序采购单详情页发起审批通过。',
        },
      };
    case 'shipped':
      return {
        path: `/inventory/purchase/orders/${orderId}/place`,
        body: { placedBy: miniappSupplychainActor.name },
      };
    case 'received':
      return {
        path: `/inventory/purchase/orders/${orderId}/receive`,
        body: {
          items: detail.items.map((item) => ({
            productId: item.productId ?? item.sku,
            receivedQuantity: item.qty,
            damagedQuantity: 0,
          })),
          warehouseNote: detail.remark || '由小程序采购单详情页发起收货。',
          operatorId: miniappSupplychainActor.id,
        },
      };
    case 'cancelled':
      return {
        path: `/inventory/purchase/orders/${orderId}/cancel`,
        body: {
          cancelledBy: miniappSupplychainActor.name,
          reason: detail.remark || '由小程序采购单详情页发起取消。',
        },
      };
    default:
      throw new Error(`Unsupported purchase order action: ${nextStatus}`);
  }
}

export function resolveMiniappReturnActionExecution(
  returnId: string,
  nextStatus: MiniappReturnStatus,
  remark?: string,
): {
  supported: boolean;
  apiNextStatus: MiniappReturnStatus;
  request?: MiniappActionRequest;
  note: string;
} {
  if (nextStatus === 'approved') {
    return {
      supported: true,
      apiNextStatus: 'approved',
      request: {
        path: `/inventory/purchase/returns/${returnId}/approve`,
        body: {
          approverId: miniappSupplychainActor.id,
          approverName: miniappSupplychainActor.name,
          comment: remark || '由小程序退货详情页发起审批。',
        },
      },
      note: '已提交真实退货审批动作。',
    };
  }

  if (nextStatus === 'inspecting') {
    return {
      supported: true,
      apiNextStatus: 'inspecting',
      request: {
        path: `/inventory/purchase/returns/${returnId}/inspect`,
        body: {
          inspectorId: miniappSupplychainActor.id,
          inspectorName: miniappSupplychainActor.name,
          comment: remark || '由小程序退货详情页发起质检。',
        },
      },
      note: '已提交真实退货质检动作。',
    };
  }

  if (nextStatus === 'rejected') {
    return {
      supported: true,
      apiNextStatus: 'rejected',
      request: {
        path: `/inventory/purchase/returns/${returnId}/reject`,
        body: {
          reviewerId: miniappSupplychainActor.id,
          reviewerName: miniappSupplychainActor.name,
          comment: remark || '由小程序退货详情页发起驳回。',
        },
      },
      note: '已提交真实退货驳回动作。',
    };
  }

  if (nextStatus === 'refunded') {
    return {
      supported: true,
      apiNextStatus: 'refunded',
      request: {
        path: `/inventory/purchase/returns/${returnId}/refund`,
        body: {
          operatorId: miniappSupplychainActor.id,
          operatorName: miniappSupplychainActor.name,
          comment: remark || '由小程序退货详情页发起退款。',
        },
      },
      note: '已提交真实退款动作。',
    };
  }

  if (nextStatus === 'exchanged') {
    return {
      supported: true,
      apiNextStatus: 'exchanged',
      request: {
        path: `/inventory/purchase/returns/${returnId}/exchange`,
        body: {
          operatorId: miniappSupplychainActor.id,
          operatorName: miniappSupplychainActor.name,
          comment: remark || '由小程序退货详情页发起换货。',
        },
      },
      note: '已提交真实换货动作。',
    };
  }

  if (nextStatus === 'closed') {
    return {
      supported: true,
      apiNextStatus: 'closed',
      request: {
        path: `/inventory/purchase/returns/${returnId}/close`,
        body: {
          operatorId: miniappSupplychainActor.id,
          operatorName: miniappSupplychainActor.name,
          comment: remark || '由小程序退货详情页发起关闭。',
        },
      },
      note: '已提交真实关闭动作。',
    };
  }

  return {
    supported: false,
    apiNextStatus: nextStatus,
    note: '当前后端尚未提供该退货流转动作，已保留为小程序演示态切换。',
  };
}

export async function loadMiniappPurchaseOrders(
  fallback: MiniappPurchaseOrderListItem[],
): Promise<MiniappSupplychainSnapshot<MiniappPurchaseOrderListItem[]>> {
  try {
    const orders = await createMiniappSupplychainClient().getData<ApiPurchaseOrder[]>(
      '/inventory/purchase/orders?limit=50',
      { cache: 'no-store' },
    );

    return {
      deliveryMode: 'api',
      data: orders.map(mapPurchaseOrderToListItem),
      note: '已接通真实采购单列表，优先展示供应链接口结果。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      data: fallback,
      note: '当前无法读取真实采购单列表，已回退到本地演示数据。',
    };
  }
}

export async function loadMiniappPurchaseOrderDetail(
  orderId: string,
  fallback: MiniappPurchaseOrderDetail,
): Promise<MiniappSupplychainSnapshot<MiniappPurchaseOrderDetail>> {
  try {
    const order = await createMiniappSupplychainClient().getData<ApiPurchaseOrder>(
      `/inventory/purchase/orders/${orderId}`,
      { cache: 'no-store' },
    );

    return {
      deliveryMode: 'api',
      data: mapPurchaseOrderToDetail(order, fallback),
      note: '已接通真实采购单详情，当前展示供应链订单实况。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      data: fallback,
      note: '当前无法读取真实采购单详情，已回退到本地演示数据。',
    };
  }
}

export async function loadMiniappPurchaseReturns(
  fallback: MiniappReturnOrderListItem[],
): Promise<MiniappSupplychainSnapshot<MiniappReturnOrderListItem[]>> {
  try {
    const orders = await createMiniappSupplychainClient().getData<ApiPurchaseOrder[]>(
      '/inventory/purchase/orders?limit=50',
      { cache: 'no-store' },
    );

    return {
      deliveryMode: 'api',
      data: flattenPurchaseReturns(orders),
      note: '已从真实采购单聚合退货记录，小程序退货页优先展示供应链回传结果。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      data: fallback,
      note: '当前无法聚合真实退货记录，已回退到本地演示数据。',
    };
  }
}

export async function loadMiniappPurchaseReturnDetail(
  returnId: string,
  fallback: MiniappReturnOrderDetail,
): Promise<MiniappSupplychainSnapshot<MiniappReturnOrderDetail>> {
  try {
    const orders = await createMiniappSupplychainClient().getData<ApiPurchaseOrder[]>(
      '/inventory/purchase/orders?limit=50',
      { cache: 'no-store' },
    );
    const detail = resolvePurchaseReturnDetail(orders, returnId, fallback);

    if (!detail) {
      return {
        deliveryMode: 'fallback',
        data: fallback,
        note: '真实采购退货记录中未找到该单据，暂回退到本地演示数据。',
      };
    }

    return {
      deliveryMode: 'api',
      data: detail,
      note: '已从真实采购单聚合退货详情，当前展示供应链回传结果。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      data: fallback,
      note: '当前无法读取真实退货详情，已回退到本地演示数据。',
    };
  }
}

export async function executeMiniappPurchaseOrderAction(
  orderId: string,
  nextStatus: MiniappPurchaseOrderStatus,
  detail: MiniappPurchaseOrderDetail,
): Promise<MiniappSupplychainMutationResult<MiniappPurchaseOrderStatus>> {
  const request = buildMiniappPurchaseOrderActionRequest(orderId, nextStatus, detail);

  try {
    await createMiniappSupplychainClient().postData(request.path, request.body ?? {});
    return {
      deliveryMode: 'api',
      success: true,
      nextStatus,
      note: '已提交真实采购单状态动作，当前页面状态已同步更新。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      success: false,
      nextStatus,
      note: '当前无法提交真实采购单状态动作，请稍后重试或联系管理员。',
    };
  }
}

export async function deleteMiniappPurchaseOrder(
  orderId: string,
): Promise<MiniappSupplychainMutationResult<'deleted'>> {
  try {
    await createMiniappSupplychainClient().deleteData(`/inventory/purchase/orders/${orderId}`);
    return {
      deliveryMode: 'api',
      success: true,
      nextStatus: 'deleted',
      note: '已提交真实采购单删除动作。',
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      success: false,
      nextStatus: 'deleted',
      note: '当前无法提交真实采购单删除动作，请稍后重试或联系管理员。',
    };
  }
}

export async function executeMiniappPurchaseReturnAction(
  returnId: string,
  nextStatus: MiniappReturnStatus,
  remark?: string,
): Promise<MiniappSupplychainMutationResult<MiniappReturnStatus>> {
  const execution = resolveMiniappReturnActionExecution(returnId, nextStatus, remark);

  if (!execution.supported || !execution.request) {
    return {
      deliveryMode: 'fallback',
      success: false,
      nextStatus: execution.apiNextStatus,
      note: '当前后端尚未提供该退货流转动作，已阻断本地演示态自动切换。',
    };
  }

  try {
    await createMiniappSupplychainClient().postData(
      execution.request.path,
      execution.request.body ?? {},
    );
    return {
      deliveryMode: 'api',
      success: true,
      nextStatus: execution.apiNextStatus,
      note: execution.note,
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      success: false,
      nextStatus: execution.apiNextStatus,
      note: '当前无法提交真实退货流转动作，请稍后重试或联系管理员。',
    };
  }
}
