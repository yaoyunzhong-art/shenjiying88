/**
 * device-manager.test.ts - Phase-21 T62 + T63
 * 设备管理 + 状态合并单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DeviceManager } from './device-manager';

describe('DeviceManager · Phase-21 T62 + T63', () => {
  let mgr: DeviceManager;

  beforeEach(() => {
    mgr = new DeviceManager();
    mgr.resetForTests();
  });

  // AC-1: 注册当前设备
  it('AC-1 registerCurrentDevice: marks as current', () => {
    const device = mgr.registerCurrentDevice({
      model: 'iPhone 15',
      os: 'ios',
      osVersion: '17.5',
      appVersion: '1.0.0',
    });
    expect(device.isCurrent).toBe(true);
    expect(device.sessionId).toBeDefined();
    expect(mgr.getCurrentDevice()?.id).toBe(device.id);
  });

  // AC-2: 导入其他设备清单
  it('AC-2 importDevices: add remote devices', () => {
    mgr.registerCurrentDevice({ model: 'iPhone', os: 'ios', osVersion: '17.5', appVersion: '1.0.0' });
    mgr.importDevices([
      {
        id: 'd-android-1',
        model: 'Pixel 8',
        os: 'android',
        osVersion: '14',
        appVersion: '1.0.0',
        registeredAt: '2026-06-20T10:00:00Z',
        lastActiveAt: '2026-06-25T08:00:00Z',
        sessionId: 's-android-1',
      },
    ]);
    const all = mgr.listDevices();
    expect(all.length).toBe(2);
    // iPhone 应该是 current
    const current = all.find((d) => d.isCurrent);
    expect(current?.model).toBe('iPhone');
  });

  // AC-3: 设备列表按最后活跃排序
  it('AC-3 listDevices: sorted by lastActiveAt desc', () => {
    mgr.registerCurrentDevice({ model: 'iPhone', os: 'ios', osVersion: '17.5', appVersion: '1.0.0' });
    mgr.importDevices([
      {
        id: 'd1',
        model: 'Old',
        os: 'android',
        osVersion: '12',
        appVersion: '1.0.0',
        registeredAt: '2026-01-01T00:00:00Z',
        lastActiveAt: '2026-06-01T00:00:00Z',
        sessionId: 's1',
      },
      {
        id: 'd2',
        model: 'Recent',
        os: 'android',
        osVersion: '14',
        appVersion: '1.0.0',
        registeredAt: '2026-06-20T00:00:00Z',
        lastActiveAt: '2026-06-26T00:00:00Z',
        sessionId: 's2',
      },
    ]);
    const all = mgr.listDevices();
    expect(all[0].model).toBe('iPhone'); // 刚刚注册
    expect(all[1].model).toBe('Recent');
    expect(all[2].model).toBe('Old');
  });

  // AC-4: 远程登出其他设备
  it('AC-4 remoteLogout: invalidate other device session', async () => {
    mgr.registerCurrentDevice({ model: 'iPhone', os: 'ios', osVersion: '17.5', appVersion: '1.0.0' });
    mgr.importDevices([
      {
        id: 'd-android',
        model: 'Pixel',
        os: 'android',
        osVersion: '14',
        appVersion: '1.0.0',
        registeredAt: '2026-06-20T00:00:00Z',
        lastActiveAt: '2026-06-25T00:00:00Z',
        sessionId: 's-android',
      },
    ]);
    const event = await mgr.remoteLogout('d-android');
    expect(event.type).toBe('invalidate_session');
    expect(event.deviceId).toBe('d-android');
    // 设备的 lastActiveAt 应被标记为已登出
    expect(mgr.getDevice('d-android')?.lastActiveAt).toBe('1970-01-01T00:00:00.000Z');
  });

  // AC-5: 不能远程登出当前设备
  it('AC-5 remoteLogout: reject current device', async () => {
    const device = mgr.registerCurrentDevice({ model: 'iPhone', os: 'ios', osVersion: '17.5', appVersion: '1.0.0' });
    await expect(mgr.remoteLogout(device.id)).rejects.toThrow(/current device/);
  });

  // AC-6: 监听远程登出事件
  it('AC-6 onRemoteLogout: listener receives event', async () => {
    mgr.registerCurrentDevice({ model: 'iPhone', os: 'ios', osVersion: '17.5', appVersion: '1.0.0' });
    mgr.importDevices([
      {
        id: 'd-x',
        model: 'X',
        os: 'android',
        osVersion: '14',
        appVersion: '1.0.0',
        registeredAt: '2026-06-20T00:00:00Z',
        lastActiveAt: '2026-06-25T00:00:00Z',
        sessionId: 's-x',
      },
    ]);
    const events: any[] = [];
    mgr.onRemoteLogout((e) => events.push(e));
    await mgr.remoteLogout('d-x');
    expect(events.length).toBe(1);
    expect(events[0].deviceId).toBe('d-x');
  });

  // AC-7: 多设备状态合并 - LWW
  it('AC-7 merge: LWW picks latest timestamp', () => {
    mgr.recordFieldWrite('cart.items', 'd-A', ['item-1', 'item-2'], 100);
    mgr.recordFieldWrite('cart.items', 'd-B', ['item-3'], 200); // 更新
    mgr.recordFieldWrite('cart.items', 'd-C', ['item-4'], 150); // 较旧
    const result = mgr.mergeField('cart.items');
    expect(result?.winningDeviceId).toBe('d-B');
    expect(result?.winningValue).toEqual(['item-3']);
    expect(result?.losers.length).toBe(2);
  });

  // AC-8: 合并所有字段
  it('AC-8 mergeAll: batch merge', () => {
    mgr.recordFieldWrite('cart.items', 'd-A', ['item-1'], 100);
    mgr.recordFieldWrite('todo.list', 'd-B', ['task-1', 'task-2'], 200);
    const all = mgr.mergeAll();
    expect(all.length).toBe(2);
    expect(all.find((r) => r.field === 'cart.items')?.winningDeviceId).toBe('d-A');
    expect(all.find((r) => r.field === 'todo.list')?.winningDeviceId).toBe('d-B');
  });

  // AC-9: 同设备覆盖自身旧值
  it('AC-9 recordFieldWrite: same device overwrites its own value', () => {
    mgr.recordFieldWrite('cart.items', 'd-A', ['item-1'], 100);
    mgr.recordFieldWrite('cart.items', 'd-A', ['item-1', 'item-2'], 200);
    const history = mgr.getFieldHistory('cart.items');
    expect(history.length).toBe(1); // 同设备的旧值被覆盖
    expect(history[0].value).toEqual(['item-1', 'item-2']);
  });
});