import {
  computeStoreMarketDistribution,
  computeStoreStats,
  type StoreItem,
} from '../stores-data';
import { loadAdminStoreList } from '../stores-view-model';

export interface StoresPageSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'stores-api' | 'stores-fallback';
  stores: StoreItem[];
  stats: ReturnType<typeof computeStoreStats>;
  marketDistribution: ReturnType<typeof computeStoreMarketDistribution>;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

function getLatestStoreTimestamp(stores: StoreItem[]): string {
  return [...stores]
    .map((item) => item.lastDeployed)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? new Date().toISOString();
}

export async function loadStoresPageSnapshot(): Promise<StoresPageSnapshot> {
  const snapshot = await loadAdminStoreList();
  const isApi = snapshot.deliveryMode === 'api';

  return {
    ...snapshot,
    sourceLabel: isApi ? 'stores-api' : 'stores-fallback',
    generatedAt: getLatestStoreTimestamp(snapshot.stores),
    controlPlaneSource: isApi
      ? 'loadStoresPageSnapshot -> loadAdminStoreList -> /stores'
      : 'loadStoresPageSnapshot -> loadAdminStoreList fallback -> MOCK_STORES',
    businessDataSource: isApi
      ? 'admin store upstream list payload'
      : 'local store samples from stores-data.ts',
    refreshPath: 'StoresPage -> loadStoresPageSnapshot',
    note: isApi
      ? '当前页面直接消费门店列表服务端快照。'
      : '当前页面已回退到本地门店样本，不可作为实时运营复签证据。',
    error: isApi ? undefined : '门店中心实时接口不可达，已切换到 fallback 样本数据。',
  };
}
