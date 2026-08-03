import { buildActorHeaders } from '@m5/sdk';

export interface Item extends Record<string, unknown> {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  threshold: number;
  status: 'normal' | 'low';
  cost: number;
  totalValue: number;
  supplier: string;
  lastRestock: string;
}

export type MaterialRequestStatus = 'pending_approval' | 'approved' | 'outbound';
export type RequestStatusFilter = 'all' | MaterialRequestStatus;

export interface MaterialRequestItem {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  quantity: number;
}

export interface MaterialRequestRecord extends Record<string, unknown> {
  id: string;
  tenantId: string;
  storeId?: string;
  requesterId: string;
  requesterName: string;
  department?: string;
  purpose: string;
  status: MaterialRequestStatus;
  items: MaterialRequestItem[];
  totalQuantity: number;
  approval?: {
    approverId: string;
    approverName: string;
    note: string;
    approvedAt: string;
  };
  outbound?: {
    operatorId: string;
    operatorName: string;
    warehouseCode?: string;
    note?: string;
    outboundAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InventorySnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-inventory-api' | 'store-inventory-fallback';
  storeId: string;
  tenantId: string;
  items: Item[];
  categories: string[];
  restockLog: Array<{ id: string; item: string; qty: number; date: string; supplier: string; cost: number }>;
  requests: MaterialRequestRecord[];
  requestStats: {
    pending: number;
    approved: number;
    outbound: number;
  };
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

export const REQUEST_API_BASE = '/api/logistics/material-requests';

const RAW_ITEMS = [
  { id: 'STK-001', name: '游戏币', category: '消耗品', unit: '枚', stock: 5000, minStock: 1000, maxStock: 20000, cost: 0.5, totalValue: 2500, supplier: '世嘉', lastRestock: '2026-07-12' },
  { id: 'STK-002', name: '加油棒', category: '礼品', unit: '个', stock: 320, minStock: 100, maxStock: 1000, cost: 2.5, totalValue: 800, supplier: '义乌礼品', lastRestock: '2026-07-11' },
  { id: 'STK-003', name: '纯净水', category: '饮品', unit: '瓶', stock: 85, minStock: 200, maxStock: 2000, cost: 1.2, totalValue: 102, supplier: '农夫山泉', lastRestock: '2026-07-10' },
  { id: 'STK-004', name: '抹茶粉', category: '饮品原料', unit: 'kg', stock: 2.5, minStock: 5, maxStock: 50, cost: 120, totalValue: 300, supplier: '宇治抹茶', lastRestock: '2026-07-08' },
  { id: 'STK-005', name: 'VR清洁套装', category: '耗材', unit: '套', stock: 15, minStock: 5, maxStock: 50, cost: 35, totalValue: 525, supplier: '清洁之家', lastRestock: '2026-07-05' },
  { id: 'STK-006', name: '打印纸(热敏)', category: '办公', unit: '卷', stock: 48, minStock: 20, maxStock: 200, cost: 8, totalValue: 384, supplier: '得力文具', lastRestock: '2026-07-12' },
  { id: 'STK-007', name: '游戏卡带(NS)', category: '游戏', unit: '张', stock: 23, minStock: 10, maxStock: 100, cost: 280, totalValue: 6440, supplier: '任天堂', lastRestock: '2026-06-20' },
  { id: 'STK-008', name: '抹布', category: '耗材', unit: '条', stock: 60, minStock: 20, maxStock: 200, cost: 3, totalValue: 180, supplier: '清洁之家', lastRestock: '2026-07-10' },
  { id: 'STK-009', name: '一次性手套', category: '耗材', unit: '盒', stock: 12, minStock: 10, maxStock: 100, cost: 15, totalValue: 180, supplier: '清洁之家', lastRestock: '2026-07-01' },
  { id: 'STK-010', name: '礼品包装袋', category: '礼品', unit: '个', stock: 200, minStock: 50, maxStock: 500, cost: 1.5, totalValue: 300, supplier: '义乌礼品', lastRestock: '2026-07-09' },
  { id: 'STK-011', name: '饮品杯(大)', category: '饮品', unit: '个', stock: 500, minStock: 100, maxStock: 2000, cost: 0.8, totalValue: 400, supplier: '餐具批发', lastRestock: '2026-07-08' },
  { id: 'STK-012', name: '免洗洗手液', category: '耗材', unit: '瓶', stock: 8, minStock: 10, maxStock: 50, cost: 18, totalValue: 144, supplier: '清洁之家', lastRestock: '2026-06-25' },
];

export const ITEMS: Item[] = RAW_ITEMS.map((item) => ({
  ...item,
  threshold: item.minStock,
  status: item.stock < item.minStock ? 'low' : 'normal',
}));

export const CATEGORIES = [...new Set(ITEMS.map((item) => item.category))];

export const RESTOCK_LOG = [
  { id: 'R-01', item: '游戏币', qty: 5000, date: '2026-07-12', supplier: '世嘉', cost: 2500 },
  { id: 'R-02', item: '打印纸(热敏)', qty: 50, date: '2026-07-12', supplier: '得力文具', cost: 400 },
  { id: 'R-03', item: '加油棒', qty: 200, date: '2026-07-11', supplier: '义乌礼品', cost: 500 },
  { id: 'R-04', item: '纯净水', qty: 500, date: '2026-07-10', supplier: '农夫山泉', cost: 600 },
  { id: 'R-05', item: '礼品包装袋', qty: 100, date: '2026-07-09', supplier: '义乌礼品', cost: 150 },
];

export const INVENTORY_PAGE_ACTOR = {
  actorId: 'admin-store-inventory',
  actorType: 'employee-user',
  actorName: 'Admin Store Inventory',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['logistics.inventory.read', 'logistics.inventory.write'],
  authenticated: true,
} as const;

export const REQUEST_STATUS_LABEL: Record<MaterialRequestStatus, string> = {
  pending_approval: '待审批',
  approved: '待出库',
  outbound: '已出库',
};

export const REQUEST_STATUS_VARIANT: Record<MaterialRequestStatus, 'warning' | 'info' | 'success'> = {
  pending_approval: 'warning',
  approved: 'info',
  outbound: 'success',
};

function resolveAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_ADMIN_WEB_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeMaterialRequest(item: unknown, index: number, tenantId: string, storeId: string): MaterialRequestRecord {
  const record = asRecord(item);
  const items = Array.isArray(record.items) ? record.items : [];

  return {
    id: asString(record.id, `mr-${index + 1}`),
    tenantId: asString(record.tenantId, tenantId),
    storeId: asString(record.storeId, storeId),
    requesterId: asString(record.requesterId, `req-${index + 1}`),
    requesterName: asString(record.requesterName, '门店后勤'),
    department: asString(record.department) || undefined,
    purpose: asString(record.purpose, '补货申领'),
    status: ['pending_approval', 'approved', 'outbound'].includes(asString(record.status))
      ? (record.status as MaterialRequestStatus)
      : 'pending_approval',
    items: items.map((entry, itemIndex) => {
      const itemRecord = asRecord(entry);
      return {
        itemId: asString(itemRecord.itemId, `item-${itemIndex + 1}`),
        itemName: asString(itemRecord.itemName, `物料 ${itemIndex + 1}`),
        category: asString(itemRecord.category, '未分类'),
        unit: asString(itemRecord.unit, '件'),
        quantity: Number(itemRecord.quantity ?? 1),
      };
    }),
    totalQuantity: Number(record.totalQuantity ?? 0),
    approval: record.approval ? (record.approval as MaterialRequestRecord['approval']) : undefined,
    outbound: record.outbound ? (record.outbound as MaterialRequestRecord['outbound']) : undefined,
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, asString(record.createdAt, new Date().toISOString())),
  };
}

async function fetchMaterialRequests(storeId: string, tenantId: string): Promise<MaterialRequestRecord[]> {
  const response = await fetch(`${resolveAppBaseUrl()}${REQUEST_API_BASE}`, {
    method: 'GET',
    cache: 'no-store',
    headers: buildActorHeaders({
      ...INVENTORY_PAGE_ACTOR,
      tenantId,
      storeId,
    }),
  });

  if (!response.ok) {
    throw new Error(`material requests upstream failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload)
    ? payload.map((item, index) => normalizeMaterialRequest(item, index, tenantId, storeId))
    : [];
}

function getRequestStats(requests: MaterialRequestRecord[]) {
  return {
    pending: requests.filter((request) => request.status === 'pending_approval').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    outbound: requests.filter((request) => request.status === 'outbound').length,
  };
}

function getGeneratedAt(requests: MaterialRequestRecord[]): string {
  return requests.map((request) => request.updatedAt).sort().at(-1) ?? RESTOCK_LOG[0]?.date ?? new Date().toISOString();
}

export async function loadInventorySnapshot(
  storeId: string,
  tenantId = 'tenant-p30',
): Promise<InventorySnapshotDelivery> {
  try {
    const requests = (await fetchMaterialRequests(storeId, tenantId)).filter(
      (request) => !request.storeId || request.storeId === storeId,
    );
    return {
      deliveryMode: 'api',
      sourceLabel: 'store-inventory-api',
      storeId,
      tenantId,
      items: ITEMS,
      categories: CATEGORIES,
      restockLog: RESTOCK_LOG,
      requests,
      requestStats: getRequestStats(requests),
      generatedAt: getGeneratedAt(requests),
      controlPlaneSource: 'loadInventorySnapshot -> /api/logistics/material-requests',
      businessDataSource: 'local inventory samples + upstream material requests flow',
      refreshPath: 'InventoryPage -> loadInventorySnapshot',
      note: '当前页面直接消费库存样本与申领流转服务端快照。',
    };
  } catch {
    const requests: MaterialRequestRecord[] = [];
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'store-inventory-fallback',
      storeId,
      tenantId,
      items: ITEMS,
      categories: CATEGORIES,
      restockLog: RESTOCK_LOG,
      requests,
      requestStats: getRequestStats(requests),
      generatedAt: getGeneratedAt(requests),
      controlPlaneSource: 'loadInventorySnapshot fallback -> ITEMS + RESTOCK_LOG',
      businessDataSource: 'local inventory samples + empty request fallback',
      refreshPath: 'InventoryPage -> loadInventorySnapshot',
      note: '当前页面已回退到本地库存样本，申领流转仅展示 fallback 快照。',
      error: '库存申领实时接口不可达，已切换到 fallback 快照。',
    };
  }
}
