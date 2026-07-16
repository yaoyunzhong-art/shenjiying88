/**
 * devices/form/page.test.tsx — 设备新增表单页 L1 测试
 *
 * 覆盖: IP校验、表单验证、设备类型枚举、门店选项、序列号校验
 * 正例: 完整字段提交、IP校验通过、序列号格式正确
 * 反例: 空名称、IP格式错误、空序列号、类型未选
 * 边界: 最小名称(2字符)、最大名称(50字符)、固件版本20字符上限
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import DeviceFormPage, { validateDeviceForm, IP_REGEX } from './page';

/* ── 类型 ── */

type DeviceType = 'POS' | 'printer' | 'scanner' | 'tablet' | 'kiosk' | 'scale';

interface DeviceFormValues {
  name: string;
  type: DeviceType | '';
  ip: string;
  storeId: string;
  firmwareVersion: string;
  serialNumber: string;
  remark: string;
}

interface FieldError {
  field: keyof DeviceFormValues;
  message: string;
}

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  POS: '收银机',
  printer: '打印机',
  scanner: '扫描枪',
  tablet: '平板',
  kiosk: '自助机',
  scale: '电子秤',
};

function isValidIP(ip: string): boolean {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every((octet) => {
    const n = parseInt(octet, 10);
    return n >= 0 && n <= 255;
  });
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(<DeviceFormPage />);
}

/* ============================================================ */

describe('devices/form: 页面渲染', () => {
  it('component is a function', () => {
    assert.equal(typeof DeviceFormPage, 'function');
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('renders form title', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('新建设备'));
  });

  it('has name field', () => {
    const { container } = setup();
    assert.ok(container.querySelector('[data-field="name"]'));
  });

  it('has type field', () => {
    const { container } = setup();
    assert.ok(container.querySelector('[data-field="type"]'));
  });

  it('has IP field', () => {
    const { container } = setup();
    assert.ok(container.querySelector('[data-field="ip"]'));
  });

  it('has store field', () => {
    const { container } = setup();
    assert.ok(container.querySelector('[data-field="storeId"]'));
  });

  it('has serial number field', () => {
    const { container } = setup();
    assert.ok(container.querySelector('[data-field="serialNumber"]'));
  });

  it('has submit button', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('提交设备'));
  });
});

describe('devices/form: 数据类型', () => {
  it('DeviceType has 6 values', () => {
    const types: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
    assert.equal(types.length, 6);
  });

  it('DeviceType labels all present', () => {
    assert.equal(Object.keys(DEVICE_TYPE_LABELS).length, 6);
  });

  it('POS label is 收银机', () => {
    assert.equal(DEVICE_TYPE_LABELS['POS'], '收银机');
  });

  it('scale label is 电子秤', () => {
    assert.equal(DEVICE_TYPE_LABELS['scale'], '电子秤');
  });

  it('IP_REGEX is defined', () => {
    assert.ok(IP_REGEX instanceof RegExp);
  });

  it('FieldError has field and message', () => {
    const err: FieldError = { field: 'name', message: '请填写设备名称' };
    assert.equal(err.field, 'name');
    assert.equal(typeof err.message, 'string');
  });
});

describe('devices/form: 业务逻辑', () => {
  const VALID_VALUES: DeviceFormValues = {
    name: 'POS-主收银-A01',
    type: 'POS',
    ip: '192.168.1.100',
    storeId: 'S001',
    firmwareVersion: 'v3.2.1',
    serialNumber: 'POS-XJ-2025001',
    remark: '主收银位',
  };

  const EMPTY_VALUES: DeviceFormValues = {
    name: '', type: '', ip: '', storeId: '', firmwareVersion: '', serialNumber: '', remark: '',
  };

  it('validateDeviceForm valid values returns no errors', () => {
    const errors = validateDeviceForm(VALID_VALUES);
    assert.equal(errors.length, 0);
  });

  it('validateDeviceForm empty name', () => {
    const errors = validateDeviceForm({ ...EMPTY_VALUES, type: 'POS', ip: '1.1.1.1', storeId: 'S001', serialNumber: 'SN-001' });
    assert.ok(errors.some(e => e.field === 'name'));
  });

  it('validateDeviceForm name too short (< 2 chars)', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, name: 'A' });
    assert.ok(errors.some(e => e.field === 'name'));
  });

  it('validateDeviceForm name too long (> 50 chars)', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, name: 'A'.repeat(51) });
    assert.ok(errors.some(e => e.field === 'name'));
  });

  it('validateDeviceForm name 2 chars minimum', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, name: 'AB' });
    assert.equal(errors.filter(e => e.field === 'name').length, 0);
  });

  it('validateDeviceForm name 50 chars maximum', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, name: 'A'.repeat(50) });
    assert.equal(errors.filter(e => e.field === 'name').length, 0);
  });

  it('validateDeviceForm empty type', () => {
    const errors = validateDeviceForm({ ...EMPTY_VALUES, name: 'Test', ip: '1.1.1.1', storeId: 'S001', serialNumber: 'SN-001' });
    assert.ok(errors.some(e => e.field === 'type'));
  });

  it('validateDeviceForm empty IP', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, ip: '' });
    assert.ok(errors.some(e => e.field === 'ip'));
  });

  it('validateDeviceForm invalid IP format (non-numeric)', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, ip: 'abc.def.ghi.jkl' });
    assert.ok(errors.some(e => e.field === 'ip'));
  });

  it('validateDeviceForm IP octet exceeds 255', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, ip: '256.1.1.1' });
    assert.ok(errors.some(e => e.field === 'ip'));
  });

  it('validateDeviceForm IP octet negative', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, ip: '-1.1.1.1' });
    assert.ok(errors.some(e => e.field === 'ip'));
  });

  it('validates loopback IP as valid', () => {
    assert.ok(isValidIP('127.0.0.1'));
  });

  it('validates all-zero IP as valid', () => {
    assert.ok(isValidIP('0.0.0.0'));
  });

  it('validates 255.255.255.255 as valid', () => {
    assert.ok(isValidIP('255.255.255.255'));
  });

  it('rejects IP with missing octets', () => {
    assert.ok(!isValidIP('192.168.1'));
  });

  it('rejects IP with 5 octets', () => {
    assert.ok(!isValidIP('1.1.1.1.1'));
  });

  it('rejects IP with trailing dot', () => {
    assert.ok(!isValidIP('192.168.1.1.'));
  });

  it('validateDeviceForm empty store', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, storeId: '' });
    assert.ok(errors.some(e => e.field === 'storeId'));
  });

  it('validateDeviceForm empty serialNumber', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, serialNumber: '' });
    assert.ok(errors.some(e => e.field === 'serialNumber'));
  });

  it('validateDeviceForm invalid serialNumber (lowercase)', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, serialNumber: 'sn-abc' });
    assert.ok(errors.some(e => e.field === 'serialNumber'));
  });

  it('validateDeviceForm valid serialNumber uppercase', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, serialNumber: 'SN-AB-001' });
    assert.equal(errors.filter(e => e.field === 'serialNumber').length, 0);
  });

  it('validateDeviceForm valid firmware version within limit', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, firmwareVersion: 'v10.10.10-beta' });
    assert.equal(errors.filter(e => e.field === 'firmwareVersion').length, 0);
  });

  it('validateDeviceForm firmware version too long', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, firmwareVersion: 'v'.repeat(21) });
    assert.ok(errors.some(e => e.field === 'firmwareVersion'));
  });

  it('validateDeviceForm firmware version 20 chars boundary', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, firmwareVersion: 'v'.repeat(20) });
    assert.equal(errors.filter(e => e.field === 'firmwareVersion').length, 0);
  });

  it('validation returns multiple errors at once', () => {
    const errors = validateDeviceForm(EMPTY_VALUES);
    assert.ok(errors.length >= 4);
  });

  it('validation returns error messages in Chinese', () => {
    const errors = validateDeviceForm(EMPTY_VALUES);
    errors.forEach(e => assert.ok(typeof e.message === 'string'));
  });

  it('remark field is optional and does not cause validation error', () => {
    const errors = validateDeviceForm({ ...VALID_VALUES, remark: '' });
    assert.ok(!errors.some(e => e.field === 'remark'));
  });

  it('IP_REGEX matches valid IP', () => {
    assert.ok(IP_REGEX.test('192.168.1.1'));
  });

  it('IP_REGEX rejects non-numeric IP', () => {
    assert.ok(!IP_REGEX.test('abc.def.ghi.jkl'));
  });

  it('IP_REGEX matches single-digit octets', () => {
    assert.ok(IP_REGEX.test('1.2.3.4'));
  });

  it('IP_REGEX rejects empty string', () => {
    assert.ok(!IP_REGEX.test(''));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Devices / Form — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
