/**
 * 离线状态上下文
 * Offline Context - 管理应用离线状态
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage } from '../services/OfflineStorage';
import { syncQueue, type SyncResult } from '../services/SyncQueue';

interface OfflineState {
  isOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number;
  error: string | null;
}

interface OfflineContextValue {
  state: OfflineState;
  setOfflineMode: (enabled: boolean) => Promise<void>;
  syncNow: () => Promise<SyncResult>;
  getPendingCount: () => Promise<number>;
}

const initialState: OfflineState = {
  isOffline: false,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: 0,
  error: null,
};

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [state, setState] = useState<OfflineState>(initialState);

  // 初始化离线状态
  useEffect(() => {
    const init = async () => {
      const offlineMode = await offlineStorage.getOfflineMode();
      const lastSync = await offlineStorage.getLastSyncTime();
      const pendingCount = await syncQueue.getPendingCount();
      
      setState((prev) => ({
        ...prev,
        isOffline: offlineMode,
        lastSyncTime: lastSync,
        pendingCount,
      }));

      // 启动自动同步
      syncQueue.startAutoSync(30000);
    };

    init();

    return () => {
      syncQueue.stopAutoSync();
    };
  }, []);

  // 监听网络状态变化
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const isOffline = !netState.isConnected;
      
      setState((prev) => {
        if (prev.isOffline === isOffline) return prev;
        return { ...prev, isOffline, error: null };
      });

      // 网络恢复时自动同步
      if (netState.isConnected && !state.isOffline) {
        syncNow();
      }
    });

    return () => unsubscribe();
  }, [state.isOffline]);

  // 设置离线模式
  const setOfflineMode = useCallback(async (enabled: boolean) => {
    await offlineStorage.setOfflineMode(enabled);
    setState((prev) => ({ ...prev, isOffline: enabled }));
  }, []);

  // 手动触发同步
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (state.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    setState((prev): OfflineState => ({
        ...prev,
        isSyncing: true,
        error: null,
      }));

    try {
      const result = await syncQueue.sync();
      const pendingCount = await syncQueue.getPendingCount();
      
      setState((prev): OfflineState => ({
        ...prev,
        isSyncing: false,
        pendingCount,
        lastSyncTime: result.success ? Date.now() : prev.lastSyncTime,
        error: result.success ? null : (result.errors[0] ?? null),
      }));

      return result;
    } catch (error) {
      setState((prev): OfflineState => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
      return { success: false, syncedCount: 0, failedCount: 0, errors: [String(error)] };
    }
  }, [state.isSyncing]);

  // 获取待同步数量
  const getPendingCount = useCallback(async () => {
    const count = await syncQueue.getPendingCount();
    setState((prev): OfflineState => ({ ...prev, pendingCount: count }));
    return count;
  }, []);

  const value: OfflineContextValue = {
    state,
    setOfflineMode,
    syncNow,
    getPendingCount,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}
