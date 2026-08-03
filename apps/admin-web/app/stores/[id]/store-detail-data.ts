import {
  loadStoreCapabilityAccessSnapshot,
  type StoreCapabilityAccessSnapshot,
} from '../../lyt-capability-access';
import {
  loadAdminStoreDetail,
  type AdminStoreDetailSnapshot,
} from '../../stores-view-model';
import type { StoreDetail as SharedStoreDetail } from '../../stores-data';

export interface StoreDetailView {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: 'low' | 'medium' | 'high';
  address: string;
  contactEmail: string;
  contactPhone: string;
  openedAt: string;
  floorArea: number;
  description: string;
}

export interface StoreDetailPageSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-detail-api' | 'store-detail-fallback';
  detailDeliveryMode: 'api' | 'fallback';
  capabilityDeliveryMode: 'api' | 'fallback';
  storeId: string;
  store: StoreDetailView | null;
  capabilitySnapshot: StoreCapabilityAccessSnapshot;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

function normalizeStoreDetail(source: SharedStoreDetail): StoreDetailView {
  return {
    id: source.id,
    code: source.code,
    name: source.name,
    marketCode: source.marketCode,
    status: source.status,
    tenantCount: source.tenantCount,
    brandCount: source.brandCount,
    lastDeployed: source.lastDeployed,
    riskLevel: source.riskLevel,
    address: source.address,
    contactEmail: source.email,
    contactPhone: source.phone,
    openedAt: source.createdAt,
    floorArea: source.totalArea,
    description: source.notes,
  };
}

async function loadDetailSnapshot(storeId: string): Promise<AdminStoreDetailSnapshot> {
  return loadAdminStoreDetail(storeId);
}

export async function loadStoreDetailPageSnapshot(
  storeId: string,
): Promise<StoreDetailPageSnapshot> {
  const [detailSnapshot, capabilitySnapshot] = await Promise.all([
    loadDetailSnapshot(storeId),
    loadStoreCapabilityAccessSnapshot(storeId, { storeId }),
  ]);

  const store = detailSnapshot.store ? normalizeStoreDetail(detailSnapshot.store) : null;
  const isApi =
    detailSnapshot.deliveryMode === 'api' && capabilitySnapshot.deliveryMode === 'api';

  return {
    deliveryMode: isApi ? 'api' : 'fallback',
    sourceLabel: isApi ? 'store-detail-api' : 'store-detail-fallback',
    detailDeliveryMode: detailSnapshot.deliveryMode,
    capabilityDeliveryMode: capabilitySnapshot.deliveryMode,
    storeId,
    store,
    capabilitySnapshot,
    generatedAt: store?.lastDeployed ?? new Date().toISOString(),
    controlPlaneSource:
      detailSnapshot.deliveryMode === 'api'
        ? 'loadStoreDetailPageSnapshot -> loadAdminStoreDetail -> /stores/:id'
        : 'loadStoreDetailPageSnapshot -> loadAdminStoreDetail fallback -> MOCK_STORE_DETAILS',
    businessDataSource:
      capabilitySnapshot.deliveryMode === 'api'
        ? 'normalized store detail + capability access upstream view'
        : 'normalized fallback store detail + fallback capability access view',
    refreshPath: 'StoreDetailPage -> loadStoreDetailPageSnapshot',
    note: isApi
      ? '当前页面直接消费门店详情与 capability access 服务端快照。'
      : '当前页面存在 fallback 详情或能力视图，不可作为实时治理复签证据。',
    error:
      store === null
        ? `未找到门店 ${storeId} 的详情快照。`
        : isApi
          ? undefined
          : '门店详情或 capability access 实时接口不可达，已切换到 fallback 快照。',
  };
}
