import { buildActorHeaders } from '@m5/sdk';

export interface InspectionItem {
  id: string;
  tenantId: string;
  storeId?: string;
  equipmentId?: string;
  equipmentName?: string;
  assigneeId?: string;
  assigneeName?: string;
  scheduledAt: string;
  remindedAt?: string;
  result?: 'normal' | 'warning' | 'fault';
  note?: string;
  inspectorId?: string;
  inspectorName?: string;
  status?: 'scheduled' | 'reminded' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface InspectionSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-inspection-api' | 'store-inspection-fallback';
  storeId: string;
  tenantId: string;
  items: InspectionItem[];
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

export const DEFAULT_INSPECTIONS: InspectionItem[] = [
  {
    id: 'insp-001',
    tenantId: 'tenant-p30',
    storeId: 's1',
    equipmentId: 'eq-001',
    equipmentName: '设备区 A',
    assigneeId: 'ops-01',
    assigneeName: '王琳',
    scheduledAt: '2026-07-26T09:00:00.000Z',
    status: 'scheduled',
    createdAt: '2026-07-25T12:00:00.000Z',
    updatedAt: '2026-07-25T12:00:00.000Z',
  },
  {
    id: 'insp-002',
    tenantId: 'tenant-p30',
    storeId: 's1',
    equipmentId: 'eq-002',
    equipmentName: '安全出口',
    assigneeId: 'ops-02',
    assigneeName: '张宁',
    scheduledAt: '2026-07-26T10:00:00.000Z',
    remindedAt: '2026-07-26T09:45:00.000Z',
    status: 'reminded',
    createdAt: '2026-07-25T12:30:00.000Z',
    updatedAt: '2026-07-26T09:45:00.000Z',
  },
  {
    id: 'insp-003',
    tenantId: 'tenant-p30',
    storeId: 's1',
    equipmentId: 'eq-003',
    equipmentName: '卫生检查',
    assigneeId: 'ops-03',
    assigneeName: '李悦',
    scheduledAt: '2026-07-26T08:00:00.000Z',
    result: 'normal',
    status: 'completed',
    inspectorId: 'inspector-01',
    inspectorName: '系统管理员',
    createdAt: '2026-07-25T11:00:00.000Z',
    updatedAt: '2026-07-26T08:30:00.000Z',
  },
];

export const INSPECTION_PAGE_ACTOR = {
  actorId: 'admin-store-inspection',
  actorType: 'employee-user',
  actorName: 'Admin Store Inspection',
  roles: ['TENANT_ADMIN', 'OPERATIONS'],
  permissions: ['logistics.inspection.read', 'logistics.inspection.write'],
  authenticated: true,
} as const;

function resolveAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_ADMIN_WEB_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function getLatestTimestamp(items: InspectionItem[]): string {
  return items.map((item) => item.updatedAt).sort().at(-1) ?? new Date().toISOString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeInspectionItem(item: unknown, index: number, storeId: string): InspectionItem {
  const record = asRecord(item);
  return {
    id: asString(record.id, `insp-${index + 1}`),
    tenantId: asString(record.tenantId, 'tenant-p30'),
    storeId: asString(record.storeId, storeId),
    equipmentId: asString(record.equipmentId) || undefined,
    equipmentName: asString(record.equipmentName, `巡检项 ${index + 1}`),
    assigneeId: asString(record.assigneeId) || undefined,
    assigneeName: asString(record.assigneeName) || undefined,
    scheduledAt: asString(record.scheduledAt, new Date().toISOString()),
    remindedAt: asString(record.remindedAt) || undefined,
    result: ['normal', 'warning', 'fault'].includes(asString(record.result))
      ? (record.result as InspectionItem['result'])
      : undefined,
    note: asString(record.note) || undefined,
    inspectorId: asString(record.inspectorId) || undefined,
    inspectorName: asString(record.inspectorName) || undefined,
    status: ['scheduled', 'reminded', 'completed'].includes(asString(record.status))
      ? (record.status as InspectionItem['status'])
      : 'scheduled',
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, asString(record.createdAt, new Date().toISOString())),
  };
}

async function fetchInspectionItems(storeId: string, tenantId: string): Promise<InspectionItem[]> {
  const url = `${resolveAppBaseUrl()}/api/logistics/inspections`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: buildActorHeaders({
      ...INSPECTION_PAGE_ACTOR,
      tenantId,
      storeId,
    }),
  });

  if (!response.ok) {
    throw new Error(`inspection upstream failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return Array.isArray(payload)
    ? payload.map((item, index) => normalizeInspectionItem(item, index, storeId))
    : [];
}

export async function loadInspectionSnapshot(storeId: string): Promise<InspectionSnapshot> {
  const tenantId = 'tenant-p30';

  try {
    const items = (await fetchInspectionItems(storeId, tenantId)).filter(
      (item) => !item.storeId || item.storeId === storeId,
    );
    return {
      deliveryMode: 'api',
      sourceLabel: 'store-inspection-api',
      storeId,
      tenantId,
      items,
      generatedAt: getLatestTimestamp(items),
      controlPlaneSource: 'loadInspectionSnapshot -> /api/logistics/inspections',
      businessDataSource: 'store inspection upstream payload',
      refreshPath: 'InspectionPage -> loadInspectionSnapshot',
      note: '当前页面直接消费门店巡检服务端快照。',
    };
  } catch {
    const items = DEFAULT_INSPECTIONS.filter((item) => item.storeId === storeId || item.storeId === 's1');
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'store-inspection-fallback',
      storeId,
      tenantId,
      items,
      generatedAt: getLatestTimestamp(items),
      controlPlaneSource: 'loadInspectionSnapshot fallback -> DEFAULT_INSPECTIONS',
      businessDataSource: 'local inspection samples',
      refreshPath: 'InspectionPage -> loadInspectionSnapshot',
      note: '当前页面已回退到本地巡检样本，不可作为闭环复签证据。',
      error: '门店巡检实时接口不可达，已切换到 fallback 样本数据。',
    };
  }
}
