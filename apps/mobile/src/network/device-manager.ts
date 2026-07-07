/**
 * device-manager.ts - Phase-21 T62 + T63
 * 设备清单管理 + 远程登出 + 状态合并
 *
 * 设备清单:
 * - deviceId (UUID)
 * - model / os / osVersion
 * - appVersion
 * - lastActiveAt
 * - isCurrent (当前设备)
 *
 * 远程登出:
 * - 服务器端推送 invalidate_session 事件
 * - 本地清除 token,跳转登录页
 *
 * 状态合并:
 * - 多设备购物车/待办合并
 * - LWW 策略 + 操作日志
 */
import { v4 as uuidv4 } from 'uuid';

export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DeviceInfo {
  id: string;
  model: string;
  os: DevicePlatform;
  osVersion: string;
  appVersion: string;
  /** 首次登录时间 */
  registeredAt: string;
  /** 最后活跃时间 */
  lastActiveAt: string;
  /** 是否当前设备 */
  isCurrent: boolean;
  /** 会话 token ID (用于远程登出) */
  sessionId: string;
}

export interface DeviceMergeEntry {
  field: string;
  /** 每个设备对该字段的最后写入 */
  values: Array<{ deviceId: string; value: unknown; timestamp: number }>;
}

export interface DeviceMergeResult {
  field: string;
  winningDeviceId: string;
  winningValue: unknown;
  losers: Array<{ deviceId: string; value: unknown; timestamp: number }>;
}

export interface RemoteLogoutEvent {
  type: 'invalidate_session';
  deviceId: string;
  sessionId: string;
  reason: string;
  ts: string;
}

export class DeviceManager {
  private readonly devices = new Map<string, DeviceInfo>();
  private readonly mergeLog = new Map<string, DeviceMergeEntry>();
  private logoutListeners = new Set<(event: RemoteLogoutEvent) => void>();

  // ── Device registry ──

  /**
   * 注册当前设备
   */
  registerCurrentDevice(input: {
    model: string;
    os: DevicePlatform;
    osVersion: string;
    appVersion: string;
    sessionId?: string;
  }): DeviceInfo {
    const id = uuidv4();
    const now = new Date().toISOString();
    const device: DeviceInfo = {
      id,
      model: input.model,
      os: input.os,
      osVersion: input.osVersion,
      appVersion: input.appVersion,
      registeredAt: now,
      lastActiveAt: now,
      isCurrent: true,
      sessionId: input.sessionId ?? uuidv4(),
    };
    this.devices.set(id, device);
    // 旧的 current 标记为 false
    for (const d of this.devices.values()) {
      if (d.id !== id) d.isCurrent = false;
    }
    return device;
  }

  /** 导入服务器返回的设备清单 (其他设备) */
  importDevices(devices: Omit<DeviceInfo, 'isCurrent'>[]): void {
    for (const d of devices) {
      const existing = this.devices.get(d.id);
      if (!existing) {
        this.devices.set(d.id, { ...d, isCurrent: false });
      } else {
        // 更新最后活跃时间
        existing.lastActiveAt = d.lastActiveAt;
      }
    }
  }

  /** 列出所有设备 (按最后活跃时间倒序) */
  listDevices(): DeviceInfo[] {
    return Array.from(this.devices.values()).sort(
      (a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt),
    );
  }

  /** 获取当前设备 */
  getCurrentDevice(): DeviceInfo | undefined {
    for (const d of this.devices.values()) {
      if (d.isCurrent) return d;
    }
    return undefined;
  }

  /** 按 id 获取 */
  getDevice(id: string): DeviceInfo | undefined {
    return this.devices.get(id);
  }

  /** 更新最后活跃时间 */
  touch(deviceId: string): void {
    const d = this.devices.get(deviceId);
    if (d) d.lastActiveAt = new Date().toISOString();
  }

  // ── Remote logout ──

  /** 订阅远程登出事件 */
  onRemoteLogout(handler: (event: RemoteLogoutEvent) => void): () => void {
    this.logoutListeners.add(handler);
    return () => this.logoutListeners.delete(handler);
  }

  /** 接收远程登出命令 (从 WebSocket) */
  handleRemoteLogout(event: RemoteLogoutEvent): void {
    const device = this.devices.get(event.deviceId);
    if (device && device.sessionId === event.sessionId) {
      device.lastActiveAt = new Date(0).toISOString(); // 标记为已登出
    }
    for (const listener of this.logoutListeners) listener(event);
  }

  /** 发起远程登出 (登出指定设备) */
  async remoteLogout(deviceId: string): Promise<RemoteLogoutEvent> {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Device not found: ${deviceId}`);
    if (device.isCurrent) throw new Error('Cannot logout current device via remote API');
    const event: RemoteLogoutEvent = {
      type: 'invalidate_session',
      deviceId,
      sessionId: device.sessionId,
      reason: 'user_requested',
      ts: new Date().toISOString(),
    };
    // 真实场景:通过 API POST /devices/:id/logout
    // 模拟:直接调用本地处理
    this.handleRemoteLogout(event);
    return event;
  }

  // ── State merge (T63) ──

  /**
   * 记录某字段在某设备的写入
   */
  recordFieldWrite(field: string, deviceId: string, value: unknown, timestamp = Date.now()): void {
    let entry = this.mergeLog.get(field);
    if (!entry) {
      entry = { field, values: [] };
      this.mergeLog.set(field, entry);
    }
    // 移除该设备的旧值,保留最新
    entry.values = entry.values.filter((v) => v.deviceId !== deviceId);
    entry.values.push({ deviceId, value, timestamp });
  }

  /**
   * 多设备合并 - 取每个字段最新值
   */
  mergeAll(): DeviceMergeResult[] {
    const results: DeviceMergeResult[] = [];
    for (const entry of this.mergeLog.values()) {
      if (entry.values.length === 0) continue;
      // 按 timestamp 降序
      const sorted = [...entry.values].sort((a, b) => b.timestamp - a.timestamp);
      results.push({
        field: entry.field,
        winningDeviceId: sorted[0].deviceId,
        winningValue: sorted[0].value,
        losers: sorted.slice(1),
      });
    }
    return results;
  }

  /** 取某字段的合并结果 */
  mergeField(field: string): DeviceMergeResult | undefined {
    const entry = this.mergeLog.get(field);
    if (!entry || entry.values.length === 0) return undefined;
    const sorted = [...entry.values].sort((a, b) => b.timestamp - a.timestamp);
    return {
      field,
      winningDeviceId: sorted[0].deviceId,
      winningValue: sorted[0].value,
      losers: sorted.slice(1),
    };
  }

  /** 获取某字段的所有版本 (用于审计) */
  getFieldHistory(field: string): Array<{ deviceId: string; value: unknown; timestamp: number }> {
    return [...(this.mergeLog.get(field)?.values ?? [])];
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.devices.clear();
    this.mergeLog.clear();
    this.logoutListeners.clear();
  }
}