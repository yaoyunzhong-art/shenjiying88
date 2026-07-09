/**
 * devices/form/page.test.ts — 设备新增表单页 L1 冒烟测试
 * 角色视角: 👨💻运维管理员
 * 覆盖: 正例(验证通过) + 反例(空字段/格式错误) + 边界(最大值/最小值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const PAGE_PATH = PROJECT_ROOT + '/apps/admin-web/app/devices/form/page.tsx';

/* ── 与 page.tsx 同步的验证函数 ── */

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
  field: string;
  message: string;
}

const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

function isValidIP(ip: string): boolean {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every((octet) => {
    const n = parseInt(octet, 10);
    return n >= 0 && n <= 255;
  });
}
const SKU_REGEX = /^[A-Z0-9-]+$/;

function validateForm(values: DeviceFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: 'name', message: '请填写设备名称' });
  } else if (values.name.trim().length < 2) {
    errors.push({ field: 'name', message: '设备名称至少 2 个字符' });
  } else if (values.name.trim().length > 50) {
    errors.push({ field: 'name', message: '设备名称不能超过 50 个字符' });
  }

  if (!values.type) {
    errors.push({ field: 'type', message: '请选择设备类型' });
  }

  if (!values.ip.trim()) {
    errors.push({ field: 'ip', message: '请填写 IP 地址' });
  } else if (!isValidIP(values.ip.trim())) {
    errors.push({ field: 'ip', message: 'IP 地址格式不正确' });
  }

  if (!values.storeId.trim()) {
    errors.push({ field: 'storeId', message: '请选择所属门店' });
  }

  if (values.firmwareVersion.trim() && values.firmwareVersion.trim().length > 20) {
    errors.push({ field: 'firmwareVersion', message: '固件版本不能超过 20 个字符' });
  }

  if (!values.serialNumber.trim()) {
    errors.push({ field: 'serialNumber', message: '请填写序列号' });
  } else if (!SKU_REGEX.test(values.serialNumber.trim())) {
    errors.push({ field: 'serialNumber', message: '序列号须为大写字母、数字和连字符' });
  }

  return errors;
}

// ==================== 源文件检查 ====================

test('正例: page.tsx 文件存在', () => {
  assert.ok(fs.existsSync(PAGE_PATH), 'page.tsx 应存在');
});

test('正例: page.tsx 默认导出 DeviceFormPage', () => {
  const content = fs.readFileSync(PAGE_PATH, 'utf-8');
  assert.ok(content.includes('export default function DeviceFormPage'), '应导出 DeviceFormPage');
});

test('正例: page.tsx 引用了必须组件', () => {
  const content = fs.readFileSync(PAGE_PATH, 'utf-8');
  assert.ok(content.includes('FormField'), '应引用 FormField');
  assert.ok(content.includes('SubmitButton'), '应引用 SubmitButton');
  assert.ok(content.includes('PageShell'), '应引用 PageShell');
  assert.ok(content.includes('FormSubmitFeedback'), '应引用 FormSubmitFeedback');
  assert.ok(content.includes('WorkspaceBreadcrumb'), '应引用 WorkspaceBreadcrumb');
});

// ==================== 验证逻辑 ====================

test.describe('validateForm()', () => {
  /* ── 正例 ── */

  test('正例: 完整合法数据应无错误', () => {
    const errs = validateForm(validForm());
    assert.strictEqual(errs.length, 0);
  });

  test('正例: 固件版本可选', () => {
    const errs = validateForm({ ...validForm(), firmwareVersion: '' });
    assert.strictEqual(errs.length, 0);
  });

  test('正例: 备注可选', () => {
    const errs = validateForm({ ...validForm(), remark: '' });
    assert.strictEqual(errs.length, 0);
  });

  test('正例: 全量设备类型均通过', () => {
    const types: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
    for (const t of types) {
      const errs = validateForm({ ...validForm(), type: t, serialNumber: `SER-${t.toUpperCase()}` });
      assert.strictEqual(errs.length, 0, `${t} 应验证通过`);
    }
  });

  /* ── 反例 ── */

  test('反例: 空名称报错', () => {
    const errs = validateForm({ ...validForm(), name: '' });
    assert.ok(errs.some((e) => e.field === 'name'));
  });

  test('反例: 名称过短(<2)报错', () => {
    const errs = validateForm({ ...validForm(), name: 'A' });
    assert.ok(errs.some((e) => e.field === 'name'));
  });

  test('反例: 名称过长(>50)报错', () => {
    const errs = validateForm({ ...validForm(), name: 'A'.repeat(51) });
    assert.ok(errs.some((e) => e.field === 'name'));
  });

  test('反例: 未选类型报错', () => {
    const errs = validateForm({ ...validForm(), type: '' });
    assert.ok(errs.some((e) => e.field === 'type'));
  });

  test('反例: 空 IP 报错', () => {
    const errs = validateForm({ ...validForm(), ip: '' });
    assert.ok(errs.some((e) => e.field === 'ip'));
  });

  test('反例: 格式错误 IP 报错', () => {
    const badIPs = ['abc', '256.1.1.1', '192.168.1', '192.168.1.1.1'];
    for (const ip of badIPs) {
      const errs = validateForm({ ...validForm(), ip });
      assert.ok(errs.some((e) => e.field === 'ip'), `IP "${ip}" 应报错`);
    }
  });

  test('反例: 未选门店报错', () => {
    const errs = validateForm({ ...validForm(), storeId: '' });
    assert.ok(errs.some((e) => e.field === 'storeId'));
  });

  test('反例: 空序列号报错', () => {
    const errs = validateForm({ ...validForm(), serialNumber: '' });
    assert.ok(errs.some((e) => e.field === 'serialNumber'));
  });

  test('反例: 序列号含空格报错', () => {
    const errs = validateForm({ ...validForm(), serialNumber: 'abc def' });
    assert.ok(errs.some((e) => e.field === 'serialNumber'));
  });

  test('反例: 序列号小写字母报错', () => {
    const errs = validateForm({ ...validForm(), serialNumber: 'abc-123' });
    assert.ok(errs.some((e) => e.field === 'serialNumber'));
  });

  test('反例: 固件版本超长(>20)报错', () => {
    const errs = validateForm({ ...validForm(), firmwareVersion: 'x'.repeat(21) });
    assert.ok(errs.some((e) => e.field === 'firmwareVersion'));
  });

  test('反例: 多个必填同时缺失', () => {
    const errs = validateForm({
      name: '', type: '', ip: '', storeId: '', firmwareVersion: '', serialNumber: '', remark: '',
    });
    assert.ok(errs.length >= 5);
  });

  /* ── 边界 ── */

  test('边界: IP 边界值通过', () => {
    const validIPs = ['0.0.0.0', '255.255.255.255', '192.0.2.1', '10.10.10.10'];
    for (const ip of validIPs) {
      const errs = validateForm({ ...validForm(), ip });
      assert.strictEqual(errs.find((e) => e.field === 'ip'), undefined, `IP "${ip}" 应通过`);
    }
  });

  test('边界: 序列号大写字母/数字/连字符通过', () => {
    const validSNs = ['A', 'ABC-123', 'X-999', 'SN-MAC-0001'];
    for (const sn of validSNs) {
      const errs = validateForm({ ...validForm(), serialNumber: sn });
      assert.strictEqual(errs.find((e) => e.field === 'serialNumber'), undefined, `SN "${sn}" 应通过`);
    }
  });

  test('边界: 名称 2 字符通过', () => {
    const errs = validateForm({ ...validForm(), name: 'AB' });
    assert.strictEqual(errs.length, 0);
  });

  test('边界: 名称 50 字符通过', () => {
    const errs = validateForm({ ...validForm(), name: 'A'.repeat(50) });
    assert.strictEqual(errs.length, 0);
  });

  test('边界: 全量空值返回五个必填字段错误', () => {
    const errs = validateForm({
      name: '', type: '', ip: '', storeId: '', firmwareVersion: '', serialNumber: '', remark: '',
    });
    const fields = new Set(errs.map((e) => e.field));
    assert.ok(fields.has('name'), 'name');
    assert.ok(fields.has('type'), 'type');
    assert.ok(fields.has('ip'), 'ip');
    assert.ok(fields.has('storeId'), 'storeId');
    assert.ok(fields.has('serialNumber'), 'serialNumber');
  });
});

/* ── Helper ── */

function validForm(): DeviceFormValues {
  return {
    name: 'POS-主收银-A01',
    type: 'POS',
    ip: '192.168.1.101',
    storeId: 'S001',
    firmwareVersion: 'v3.2.1',
    serialNumber: 'POS-XJ-2025001',
    remark: '',
  };
}
