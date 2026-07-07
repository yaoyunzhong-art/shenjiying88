/**
 * 同步队列服务
 * Sync Queue Service - 处理离线操作的同步
 */

import { offlineStorage, type PendingAction } from './OfflineStorage';
import NetInfo from '@react-native-community/netinfo';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

type SyncHandler = (action: PendingAction) => Promise<boolean>;

class SyncQueueService {
  private isSyncing: boolean = false;
  private syncHandlers: Map<string, SyncHandler> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  // 注册同步处理器
  registerHandler(entity: string, handler: SyncHandler): void {
    this.syncHandlers.set(entity, handler);
  }

  // 添加待同步操作
  async enqueue(
    type: PendingAction['type'],
    entity: string,
    payload: Record<string, unknown>
  ): Promise<string> {
    const action: PendingAction = {
      id: offlineStorage.generateId(),
      type,
      entity,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await offlineStorage.savePendingAction(action);
    return action.id;
  }

  // 执行同步
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    // 检查网络状态
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['No network connection'] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const actions = await offlineStorage.getPendingActions();
      
      for (const action of actions) {
        const handler = this.syncHandlers.get(action.entity);
        
        if (!handler) {
          result.errors.push(`No handler for entity: ${action.entity}`);
          result.failedCount++;
          continue;
        }

        try {
          const success = await handler(action);
          if (success) {
            await offlineStorage.removePendingAction(action.id);
            result.syncedCount++;
          } else {
            action.retryCount++;
            if (action.retryCount >= 3) {
              await offlineStorage.removePendingAction(action.id);
              result.failedCount++;
              result.errors.push(`Action ${action.id} failed after 3 retries`);
            }
          }
        } catch (error) {
          action.retryCount++;
          result.errors.push(`Error syncing ${action.id}: ${error}`);
        }
      }

      await offlineStorage.setLastSyncTime(Date.now());
    } finally {
      this.isSyncing = false;
    }

    result.success = result.failedCount === 0;
    return result;
  }

  // 启动自动同步
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(async () => {
      const netState = await NetInfo.fetch();
      if (netState.isConnected) {
        await this.sync();
      }
    }, intervalMs);
  }

  // 停止自动同步
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // 获取待同步数量
  async getPendingCount(): Promise<number> {
    const actions = await offlineStorage.getPendingActions();
    return actions.length;
  }

  // 检查是否正在同步
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

export const syncQueue = new SyncQueueService();
