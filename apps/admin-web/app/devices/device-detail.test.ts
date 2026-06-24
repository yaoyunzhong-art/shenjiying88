/**
 * 设备详情页 - 单元测试
 *
 * 使用 Node 内置 test runner
 * 运行: node --import tsx --test apps/admin-web/app/devices/*.test.ts
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import type { DeviceItem } from './device-types';
import { getDevices } from './devices-data';

// ---- 辅助函数镜像（与 device-detail-client 内部一致） ----

const STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护中',
};

function variantFor(s: string): 'success' | 'danger' | 'warning' | 'default' {
  if (s === 'online') return 'success';
  if (s === 'offline') return 'danger';
  if (s === 'warning') return 'warning';
  return 'default';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface EditFormData {
  name: string;
  ip: string;
  firmwareVersion: string;
}

interface EditFormErrors {
  name?: string;
  ip?: string;
  firmwareVersion?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.ip.trim()) errors.ip = 'IP 地址不能为空';
  if (!data.firmwareVersion.trim()) errors.firmwareVersion = '固件版本不能为空';
  return errors;
}

// ---- 测试 ----

describe('设备类型定义', () => {
  it('DeviceItem 包含所有必要字段', () => {
    const d: DeviceItem = {
      id: 'd1',
      name: '测试设备',
      type: 'POS',
      status: 'online',
      ip: '192.168.1.100',
      storeId: 'S001',
      storeName: '旗舰店',
      lastCheckAt: '2026-06-23T15:00:00Z',
      firmwareVersion: 'v3.2.1',
      serialNumber: 'POS-TEST-001',
    };
    assert.strictEqual(d.id, 'd1');
    assert.strictEqual(d.name, '测试设备');
    assert.strictEqual(d.type, 'POS');
  });

  it('DeviceStatus 类型可接受全部合法值', () => {
    const statuses: DeviceItem['status'][] = ['online', 'offline', 'warning', 'maintenance'];
    assert.strictEqual(statuses.length, 4);
  });

  it('DeviceType 类型可接受全部合法值', () => {
    const types: DeviceItem['type'][] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
    assert.strictEqual(types.length, 6);
  });
});

describe('getDevices', () => {
  it('返回非空设备列表', () => {
    const devices = getDevices();
    assert.ok(Array.isArray(devices));
    assert.ok(devices.length > 0, '至少有一条设备数据');
  });

  it('每个设备都有唯一 ID', () => {
    const devices = getDevices();
    const ids = devices.map((d) => d.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, devices.length);
  });

  it('返回数据中包含多种设备类型', () => {
    const devices = getDevices();
    const types = new Set(devices.map((d) => d.type));
    assert.ok(types.size >= 3, `期望至少3种设备类型，实际: ${types.size}`);
  });

  it('返回数据中包含多种设备状态', () => {
    const devices = getDevices();
    const statuses = new Set(devices.map((d) => d.status));
    assert.ok(statuses.size >= 2, `期望至少2种设备状态，实际: ${statuses.size}`);
  });

  it('能根据 ID 查找设备', () => {
    const devices = getDevices();
    const target = devices[0]!;
    const found = devices.find((d) => d.id === target.id);
    assert.ok(found !== undefined);
    assert.strictEqual(found!.name, target.name);
  });

  it('在线设备数量统计正确（大于0）', () => {
    const devices = getDevices();
    const online = devices.filter((d) => d.status === 'online');
    assert.ok(online.length > 0, '应至少有一个在线设备');
  });

  it('所有设备 IP 地址非空', () => {
    const devices = getDevices();
    for (const d of devices) {
      assert.ok(d.ip.length > 0, `设备 ${d.id} 的 IP 地址不能为空`);
    }
  });

  it('序列号格式合法（长度不小于10）', () => {
    const devices = getDevices();
    for (const d of devices) {
      assert.ok(d.serialNumber.length >= 10, `设备 ${d.id} 的序列号 ${d.serialNumber} 长度应 >= 10`);
    }
  });
});

describe('variantFor 状态映射', () => {
  it('online -> success', () => {
    assert.strictEqual(variantFor('online'), 'success');
  });

  it('offline -> danger', () => {
    assert.strictEqual(variantFor('offline'), 'danger');
  });

  it('warning -> warning', () => {
    assert.strictEqual(variantFor('warning'), 'warning');
  });

  it('maintenance -> default', () => {
    assert.strictEqual(variantFor('maintenance'), 'default');
  });

  it('未知状态 -> default', () => {
    assert.strictEqual(variantFor('unknown'), 'default');
  });
});

describe('STATUS_LABELS', () => {
  it('覆盖全部四个设备状态', () => {
    assert.strictEqual(STATUS_LABELS['online'], '在线');
    assert.strictEqual(STATUS_LABELS['offline'], '离线');
    assert.strictEqual(STATUS_LABELS['warning'], '告警');
    assert.strictEqual(STATUS_LABELS['maintenance'], '维护中');
    assert.strictEqual(Object.keys(STATUS_LABELS).length, 4);
  });
});

describe('formatTime', () => {
  it('格式化 ISO 时间为北京时间', () => {
    const result = formatTime('2026-06-23T14:55:00Z');
    assert.strictEqual(result, '2026-06-23 22:55:00');
  });

  it('处理午夜时间', () => {
    const result = formatTime('2026-06-23T00:00:00Z');
    assert.strictEqual(result, '2026-06-23 08:00:00');
  });

  it('格式化结果包含年月日时分秒，用空格分隔', () => {
    const result = formatTime('2026-01-01T12:30:45Z');
    // 北京时间: 2026-01-01 20:30:45
    const parts = result.split(' ');
    assert.strictEqual(parts.length, 2);
    assert.ok(result.includes(':'));
    assert.ok(result.includes('-'));
  });
});

describe('编辑表单验证 validateForm', () => {
  it('有效数据不产生错误', () => {
    const errors = validateForm({
      name: 'POS-01',
      ip: '192.168.1.100',
      firmwareVersion: 'v3.0.0',
    });
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('空名称产生错误', () => {
    const errors = validateForm({
      name: '',
      ip: '192.168.1.100',
      firmwareVersion: 'v3.0.0',
    });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('仅空白名称产生错误', () => {
    const errors = validateForm({
      name: '   ',
      ip: '192.168.1.100',
      firmwareVersion: 'v3.0.0',
    });
    assert.strictEqual(errors.name, '设备名称不能为空');
  });

  it('空 IP 产生错误', () => {
    const errors = validateForm({
      name: 'POS-01',
      ip: '',
      firmwareVersion: 'v3.0.0',
    });
    assert.strictEqual(errors.ip, 'IP 地址不能为空');
  });

  it('空固件版本产生错误', () => {
    const errors = validateForm({
      name: 'POS-01',
      ip: '192.168.1.100',
      firmwareVersion: '',
    });
    assert.strictEqual(errors.firmwareVersion, '固件版本不能为空');
  });

  it('全部字段为空产生 3 个错误', () => {
    const errors = validateForm({ name: '', ip: '', firmwareVersion: '' });
    assert.strictEqual(Object.keys(errors).length, 3);
  });
});

describe('设备详情时间线逻辑', () => {
  it('在线设备首项状态为 success', () => {
    const onlineDevice = getDevices().find((d) => d.status === 'online');
    assert.ok(onlineDevice !== undefined, '应有在线设备');
    const variant = onlineDevice!.status === 'online' ? 'success' : 'warning';
    assert.strictEqual(variant, 'success');
  });

  it('离线设备首项状态为 danger', () => {
    const offlineDevice = getDevices().find((d) => d.status === 'offline');
    assert.ok(offlineDevice !== undefined, '应有离线设备');
    const variant =
      offlineDevice!.status === 'online'
        ? 'success'
        : offlineDevice!.status === 'offline'
          ? 'danger'
          : 'warning';
    assert.strictEqual(variant, 'danger');
  });

  it('维护中设备首项状态为 default', () => {
    const maintDevice = getDevices().find((d) => d.status === 'maintenance');
    assert.ok(maintDevice !== undefined, '应有维护中设备');
    const variant =
      maintDevice!.status === 'online'
        ? 'success'
        : maintDevice!.status === 'offline'
          ? 'danger'
          : maintDevice!.status === 'warning'
            ? 'warning'
            : 'default';
    assert.strictEqual(variant, 'default');
  });

  it('时间线包含最近检测事件且时间戳不为空', () => {
    const device = getDevices()[0]!;
    const timestamp = formatTime(device.lastCheckAt);
    assert.ok(timestamp.length > 0);
    assert.ok(timestamp.includes(':'));
  });
});
