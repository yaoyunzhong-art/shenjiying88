/**
 * stores-view-model.ts — 门店列表/详情 View Model
 *
 * 遵循 members-view-model 的异步加载模式：
 * 优先请求真实 API，失败后降级至 Mock 数据。
 */

import { ApiClient, getDefaultApiBaseUrl } from '@m5/sdk';
import {
  MOCK_STORES,
  MOCK_STORE_DETAILS,
  computeStoreStats,
  computeStoreMarketDistribution,
  type StoreItem,
  type StoreDetail,
} from './stores-data';

// ---- 类型 ----

export interface AdminStoreListSnapshot {
  deliveryMode: 'api' | 'fallback';
  stores: StoreItem[];
  stats: ReturnType<typeof computeStoreStats>;
  marketDistribution: ReturnType<typeof computeStoreMarketDistribution>;
}

export interface AdminStoreDetailSnapshot {
  deliveryMode: 'api' | 'fallback';
  store: StoreDetail | null;
}

// ---- API 客户端 ----

function createAdminStoreClient(): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE ?? getDefaultApiBaseUrl();
  return new ApiClient({ baseUrl });
}

// ---- 门店列表加载 ----

export async function loadAdminStoreList(): Promise<AdminStoreListSnapshot> {
  try {
    const stores = await createAdminStoreClient().getData<StoreItem[]>('/stores', {
      cache: 'no-store',
    });

    return {
      deliveryMode: 'api',
      stores,
      stats: computeStoreStats(stores),
      marketDistribution: computeStoreMarketDistribution(stores),
    };
  } catch {
    return {
      deliveryMode: 'fallback',
      stores: MOCK_STORES,
      stats: computeStoreStats(MOCK_STORES),
      marketDistribution: computeStoreMarketDistribution(MOCK_STORES),
    };
  }
}

// ---- 门店详情加载 ----

export async function loadAdminStoreDetail(storeId: string): Promise<AdminStoreDetailSnapshot> {
  try {
    const store = await createAdminStoreClient().getData<StoreDetail>(`/stores/${storeId}`, {
      cache: 'no-store',
    });

    return {
      deliveryMode: 'api',
      store,
    };
  } catch {
    const fallbackStore = MOCK_STORE_DETAILS[storeId] ?? null;
    return {
      deliveryMode: 'fallback',
      store: fallbackStore,
    };
  }
}
