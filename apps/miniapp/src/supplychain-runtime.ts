import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';

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

function createMiniappSupplychainClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: defaultMiniappContext.tenantId,
    brandId: defaultMiniappContext.brandId,
    storeId: defaultMiniappContext.storeId,
    marketCode: defaultMiniappContext.marketCode,
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
    case 'APPROVED':
      return 'approved';
    case 'SHIPPED':
      return 'inspecting';
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
