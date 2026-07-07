/**
 * 离线存储服务
 * Offline Storage Service
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SESSION: '@offline:session',
  PENDING_ACTIONS: '@offline:pending_actions',
  CACHED_DATA: '@offline:cached_data',
  LAST_SYNC: '@offline:last_sync',
  OFFLINE_MODE: '@offline:mode',
};

export interface PendingAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export interface CachedData {
  key: string;
  data: unknown;
  expiresAt: number;
}

class OfflineStorageService {
  // 保存待同步操作
  async savePendingAction(action: PendingAction): Promise<void> {
    const actions = await this.getPendingActions();
    actions.push(action);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(actions));
  }

  // 获取所有待同步操作
  async getPendingActions(): Promise<PendingAction[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
    return data ? JSON.parse(data) : [];
  }

  // 移除已同步的操作
  async removePendingAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filtered = actions.filter((a) => a.id !== actionId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
  }

  // 清空所有待同步操作
  async clearPendingActions(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_ACTIONS);
  }

  // 缓存数据
  async setCachedData(key: string, data: unknown, ttlMinutes: number = 60): Promise<void> {
    const cache: CachedData = {
      key,
      data,
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };
    const caches = await this.getAllCaches();
    caches[key] = cache;
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(caches));
  }

  // 获取缓存数据
  async getCachedData<T>(key: string): Promise<T | null> {
    const caches = await this.getAllCaches();
    const cache = caches[key];
    if (!cache) return null;
    if (Date.now() > cache.expiresAt) {
      delete caches[key];
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(caches));
      return null;
    }
    return cache.data as T;
  }

  // 获取所有缓存
  async getAllCaches(): Promise<Record<string, CachedData>> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
    return data ? JSON.parse(data) : {};
  }

  // 清除过期缓存
  async clearExpiredCache(): Promise<void> {
    const caches = await this.getAllCaches();
    const now = Date.now();
    const valid: Record<string, CachedData> = {};
    for (const [key, cache] of Object.entries(caches)) {
      if (now < cache.expiresAt) {
        valid[key] = cache;
      }
    }
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(valid));
  }

  // 设置离线模式
  async setOfflineMode(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, JSON.stringify(enabled));
  }

  // 获取离线模式状态
  async getOfflineMode(): Promise<boolean> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
    return data ? JSON.parse(data) : false;
  }

  // 更新最后同步时间
  async setLastSyncTime(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(timestamp));
  }

  // 获取最后同步时间
  async getLastSyncTime(): Promise<number> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? JSON.parse(data) : 0;
  }

  // 生成唯一ID
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 清除所有离线数据
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PENDING_ACTIONS,
      STORAGE_KEYS.CACHED_DATA,
      STORAGE_KEYS.OFFLINE_MODE,
    ]);
  }
}

export const offlineStorage = new OfflineStorageService();
