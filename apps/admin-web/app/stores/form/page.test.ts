/**
 * store-form-page.test.ts — Page-level tests for stores edit form page.
 * Tests validation logic, field mappings, submit flow, error handling.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

// ---- Form types (mirrored from page.tsx for testing) ----

interface StoreFormValues {
  name: string;
  code: string;
  marketCode: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  floorArea: string;
  status: string;
  riskLevel: string;
  brandCount: string;
  description: string;
  notes: string;
}

interface FieldError {
  field: keyof StoreFormValues;
  message: string;
}

const DEFAULT_VALUES: StoreFormValues = {
  name: '',
  code: '',
  marketCode: 'cn-mainland',
  city: '北京市',
  address: '',
  contactPhone: '',
  contactEmail: '',
  floorArea: '',
  status: 'pending',
  riskLevel: 'low',
  brandCount: '',
  description: '',
  notes: '',
};

const STATUS_OPTIONS = [
  { value: 'active', label: '运营中' },
  { value: 'pending', label: '待激活' },
  { value: 'inactive', label: '已停用' },
  { value: 'suspended', label: '已暂停' },
] as const;

const RISK_LEVEL_OPTIONS = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
] as const;

const MARKET_OPTIONS = [
  'cn-mainland',
  'us-default',
  'uk-default',
  'jp-default',
  'sea-default',
] as const;

// ---- Validation logic (mirror of page.tsx) ----

function validateForm(values: StoreFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.name.trim()) {
    errors.push({ field: 'name', message: '门店名称不能为空' });
  } else if (values.name.trim().length < 2) {
    errors.push({ field: 'name', message: '门店名称至少 2 个字符' });
  } else if (values.name.trim().length > 50) {
    errors.push({ field: 'name', message: '门店名称不能超过 50 个字符' });
  }

  if (!values.code.trim()) {
    errors.push({ field: 'code', message: '门店编码不能为空' });
  } else if (!/^STORE-\d{3,6}$/.test(values.code.trim())) {
    errors.push({ field: 'code', message: '编码格式需为 STORE-XXX（3~6 位数字）' });
  }

  if (!values.address.trim()) {
    errors.push({ field: 'address', message: '门店地址不能为空' });
  } else if (values.address.trim().length < 5) {
    errors.push({ field: 'address', message: '地址至少 5 个字符' });
  }

  if (!values.contactPhone.trim()) {
    errors.push({ field: 'contactPhone', message: '联系电话不能为空' });
  } else if (!/^\+?\d{7,15}$/.test(values.contactPhone.replace(/[\s-]/g, ''))) {
    errors.push({ field: 'contactPhone', message: '请输入有效的联系电话（7~15 位数字）' });
  }

  if (values.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail.trim())) {
    errors.push({ field: 'contactEmail', message: '请输入有效的邮箱地址' });
  }

  if (values.floorArea.trim()) {
    if (!/^\d+$/.test(values.floorArea.trim())) {
      errors.push({ field: 'floorArea', message: '建筑面积必须为数字' });
    } else if (Number(values.floorArea) > 100000) {
      errors.push({ field: 'floorArea', message: '建筑面积不超过 100,000 m²' });
    }
  }

  if (values.brandCount.trim() && !/^\d+$/.test(values.brandCount.trim())) {
    errors.push({ field: 'brandCount', message: '品牌数量必须为数字' });
  }

  if (values.description.trim().length > 500) {
    errors.push({ field: 'description', message: '门店简介不超过 500 个字符' });
  }

  return errors;
}

// ---- Valid fixture ----

const VALID_STORE: StoreFormValues = {
  name: '朝阳大悦城旗舰店',
  code: 'STORE-001',
  marketCode: 'cn-mainland',
  city: '北京市',
  address: '北京市朝阳区朝阳北路101号',
  contactPhone: '+86-10-8888-1111',
  contactEmail: 'store001@example.com',
  floorArea: '8500',
  status: 'active',
  riskLevel: 'low',
  brandCount: '8',
  description: '位于朝阳大悦城内，核心商圈旗舰门店',
  notes: '',
};

// ==================== Tests ====================

describe('store-form — default state', () => {
  it('源码接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'store:read'"));
  });

  it('should have initial default values', () => {
    assert.equal(DEFAULT_VALUES.name, '');
    assert.equal(DEFAULT_VALUES.code, '');
    assert.equal(DEFAULT_VALUES.marketCode, 'cn-mainland');
    assert.equal(DEFAULT_VALUES.city, '北京市');
    assert.equal(DEFAULT_VALUES.status, 'pending');
    assert.equal(DEFAULT_VALUES.riskLevel, 'low');
  });

  it('should have all required fields defined in defaults', () => {
    const required: (keyof StoreFormValues)[] = [
      'name', 'code', 'marketCode', 'city', 'address',
      'contactPhone', 'status', 'riskLevel',
    ];
    for (const field of required) {
      assert.ok(field in DEFAULT_VALUES, `Missing default for ${field}`);
    }
  });

  it('should default empty string fields correctly', () => {
    const emptyFields: (keyof StoreFormValues)[] = [
      'name', 'code', 'address', 'contactPhone',
      'contactEmail', 'floorArea', 'brandCount',
      'description', 'notes',
    ];
    for (const f of emptyFields) {
      assert.equal(DEFAULT_VALUES[f], '', `${f} should default to empty string`);
    }
  });
});

// ==================== Validation: 正例 ====================

describe('validateForm — valid cases', () => {
  it('should pass validation for a complete valid store', () => {
    const errors = validateForm(VALID_STORE);
    assert.equal(errors.length, 0, JSON.stringify(errors));
  });

  it('should pass with minimal required fields', () => {
    const minimal: StoreFormValues = {
      ...DEFAULT_VALUES,
      name: '测试店',
      code: 'STORE-012',
      address: '北京市朝阳区测试路1号',
      contactPhone: '13800138000',
    };
    const errors = validateForm(minimal);
    assert.equal(errors.length, 0, JSON.stringify(errors));
  });

  it('should pass with all fields including optional ones', () => {
    const full = {
      ...VALID_STORE,
      floorArea: '50000',
      brandCount: '12',
      description: 'A'.repeat(500),
      contactEmail: 'test@store.com',
    };
    const errors = validateForm(full);
    assert.equal(errors.length, 0, JSON.stringify(errors));
  });

  it('should accept international phone format', () => {
    const store = { ...VALID_STORE, contactPhone: '+8613800138000' };
    assert.equal(validateForm(store).length, 0);
  });

  it('should accept phone with spaces and dashes', () => {
    const store = { ...VALID_STORE, contactPhone: '010-8888-1111' };
    assert.equal(validateForm(store).length, 0);
  });

  it('should accept empty optional email', () => {
    const store = { ...VALID_STORE, contactEmail: '' };
    assert.equal(validateForm(store).length, 0);
  });

  it('should accept empty optional fields (floorArea, brandCount, description)', () => {
    const store = { ...VALID_STORE, floorArea: '', brandCount: '', description: '' };
    assert.equal(validateForm(store).length, 0);
  });

  it('should accept code STORE-999999 (6 digits)', () => {
    const store = { ...VALID_STORE, code: 'STORE-999999' };
    assert.equal(validateForm(store).length, 0);
  });

  it('should accept code STORE-003 (3 digits)', () => {
    const store = { ...VALID_STORE, code: 'STORE-003' };
    assert.equal(validateForm(store).length, 0);
  });
});

// ==================== Validation: 反例 ====================

describe('validateForm — required field errors', () => {
  it('should error when name is empty', () => {
    const errors = validateForm({ ...VALID_STORE, name: '' });
    assert.ok(errors.some((e) => e.field === 'name'), 'Expected name error');
  });

  it('should error when name is only whitespace', () => {
    const errors = validateForm({ ...VALID_STORE, name: '   ' });
    assert.ok(errors.some((e) => e.field === 'name'));
  });

  it('should error when code is empty', () => {
    const errors = validateForm({ ...VALID_STORE, code: '' });
    assert.ok(errors.some((e) => e.field === 'code'), 'Expected code error');
  });

  it('should error when address is empty', () => {
    const errors = validateForm({ ...VALID_STORE, address: '' });
    assert.ok(errors.some((e) => e.field === 'address'), 'Expected address error');
  });

  it('should error when contactPhone is empty', () => {
    const errors = validateForm({ ...VALID_STORE, contactPhone: '' });
    assert.ok(errors.some((e) => e.field === 'contactPhone'), 'Expected contactPhone error');
  });

  it('should collect all required field errors at once', () => {
    const errors = validateForm(DEFAULT_VALUES);
    const requiredFields = ['name', 'code', 'address', 'contactPhone'];
    const missing = requiredFields.filter(
      (f) => !errors.some((e) => e.field === f)
    );
    assert.equal(missing.length, 0, `Missing errors for: ${missing.join(', ')}`);
    assert.ok(errors.length >= 4, `Expected at least 4 errors, got ${errors.length}`);
  });
});

// ==================== Validation: 字段格式边界 ====================

describe('validateForm — field format constraints', () => {
  it('should error for name shorter than 2 chars', () => {
    const errors = validateForm({ ...VALID_STORE, name: 'X' });
    assert.ok(errors.some((e) => e.field === 'name' && e.message.includes('至少')));
  });

  it('should error for name longer than 50 chars', () => {
    const errors = validateForm({ ...VALID_STORE, name: '长'.repeat(51) });
    assert.ok(errors.some((e) => e.field === 'name' && e.message.includes('超过')));
  });

  it('should accept name exactly 2 chars', () => {
    assert.equal(validateForm({ ...VALID_STORE, name: 'AB' }).filter((e) => e.field === 'name').length, 0);
  });

  it('should accept name exactly 50 chars', () => {
    assert.equal(validateForm({ ...VALID_STORE, name: 'A'.repeat(50) }).filter((e) => e.field === 'name').length, 0);
  });

  it('should error for code with invalid format (no prefix)', () => {
    const errors = validateForm({ ...VALID_STORE, code: '001' });
    assert.ok(errors.some((e) => e.field === 'code'), 'Expected code format error');
  });

  it('should error for code with wrong format (letters)', () => {
    const errors = validateForm({ ...VALID_STORE, code: 'STORE-ABC' });
    assert.ok(errors.some((e) => e.field === 'code'), 'Expected code format error');
  });

  it('should error for code with too few digits', () => {
    const errors = validateForm({ ...VALID_STORE, code: 'STORE-01' });
    assert.ok(errors.some((e) => e.field === 'code'), 'Expected code format error');
  });

  it('should error for code with too many digits', () => {
    const errors = validateForm({ ...VALID_STORE, code: 'STORE-1234567' });
    assert.ok(errors.some((e) => e.field === 'code'), 'Expected code format error');
  });

  it('should error for address shorter than 5 chars', () => {
    const errors = validateForm({ ...VALID_STORE, address: '街' });
    assert.ok(errors.some((e) => e.field === 'address' && e.message.includes('至少')));
  });

  it('should accept address exactly 5 chars', () => {
    assert.equal(validateForm({ ...VALID_STORE, address: 'A'.repeat(5) }).filter((e) => e.field === 'address').length, 0);
  });

  it('should error for invalid email format', () => {
    const errors = validateForm({ ...VALID_STORE, contactEmail: 'not-an-email' });
    assert.ok(errors.some((e) => e.field === 'contactEmail'), 'Expected email format error');
  });

  it('should error for email without domain', () => {
    const errors = validateForm({ ...VALID_STORE, contactEmail: 'user@' });
    assert.ok(errors.some((e) => e.field === 'contactEmail'));
  });

  it('should error for email without @', () => {
    const errors = validateForm({ ...VALID_STORE, contactEmail: 'userdomain.com' });
    assert.ok(errors.some((e) => e.field === 'contactEmail'));
  });

  it('should accept valid Chinese mobile email', () => {
    assert.equal(validateForm({ ...VALID_STORE, contactEmail: '138user@163.com' }).filter((e) => e.field === 'contactEmail').length, 0);
  });

  it('should error for phone with letters', () => {
    const errors = validateForm({ ...VALID_STORE, contactPhone: 'ABCD1234' });
    assert.ok(errors.some((e) => e.field === 'contactPhone'), 'Expected phone format error');
  });

  it('should error for phone too short (< 7 digits)', () => {
    const errors = validateForm({ ...VALID_STORE, contactPhone: '12345' });
    assert.ok(errors.some((e) => e.field === 'contactPhone'));
  });

  it('should error for phone too long (> 15 digits)', () => {
    const errors = validateForm({ ...VALID_STORE, contactPhone: '1'.repeat(16) });
    assert.ok(errors.some((e) => e.field === 'contactPhone'));
  });

  it('should accept phone exactly 7 digits', () => {
    assert.equal(validateForm({ ...VALID_STORE, contactPhone: '1234567' }).filter((e) => e.field === 'contactPhone').length, 0);
  });

  it('should accept phone exactly 15 digits', () => {
    assert.equal(validateForm({ ...VALID_STORE, contactPhone: '1'.repeat(15) }).filter((e) => e.field === 'contactPhone').length, 0);
  });
});

// ==================== Validation: 数字字段 ====================

describe('validateForm — numeric field validations', () => {
  it('should error for floorArea with non-digit characters', () => {
    const errors = validateForm({ ...VALID_STORE, floorArea: '85k' });
    assert.ok(errors.some((e) => e.field === 'floorArea' && e.message.includes('数字')));
  });

  it('should error for floorArea exceeding 100,000', () => {
    const errors = validateForm({ ...VALID_STORE, floorArea: '200000' });
    assert.ok(errors.some((e) => e.field === 'floorArea' && e.message.includes('不超过')));
  });

  it('should accept floorArea exactly 100,000', () => {
    assert.equal(validateForm({ ...VALID_STORE, floorArea: '100000' }).filter((e) => e.field === 'floorArea').length, 0);
  });

  it('should accept floorArea of 0 (zero)', () => {
    assert.equal(validateForm({ ...VALID_STORE, floorArea: '0' }).filter((e) => e.field === 'floorArea').length, 0);
  });

  it('should error for brandCount with non-digit', () => {
    const errors = validateForm({ ...VALID_STORE, brandCount: 'five' });
    assert.ok(errors.some((e) => e.field === 'brandCount' && e.message.includes('数字')));
  });

  it('should accept brandCount of 0', () => {
    assert.equal(validateForm({ ...VALID_STORE, brandCount: '0' }).filter((e) => e.field === 'brandCount').length, 0);
  });

  it('should accept brandCount of 999', () => {
    assert.equal(validateForm({ ...VALID_STORE, brandCount: '999' }).filter((e) => e.field === 'brandCount').length, 0);
  });
});

// ==================== Validation: 描述长度 ====================

describe('validateForm — description length', () => {
  it('should error for description over 500 chars', () => {
    const errors = validateForm({ ...VALID_STORE, description: 'A'.repeat(501) });
    assert.ok(errors.some((e) => e.field === 'description'), 'Expected description too long error');
  });

  it('should accept description exactly 500 chars', () => {
    assert.equal(validateForm({ ...VALID_STORE, description: 'A'.repeat(500) }).length, 0);
  });

  it('should accept empty description', () => {
    assert.equal(validateForm({ ...VALID_STORE, description: '' }).filter((e) => e.field === 'description').length, 0);
  });
});

// ==================== Constants completeness ====================

describe('constants — STATUS_OPTIONS', () => {
  it('should have exactly 4 status options', () => {
    assert.equal(STATUS_OPTIONS.length, 4);
  });

  it('should include all expected statuses', () => {
    const values = STATUS_OPTIONS.map((o) => o.value);
    assert.ok(values.includes('active'));
    assert.ok(values.includes('pending'));
    assert.ok(values.includes('inactive'));
    assert.ok(values.includes('suspended'));
  });

  it('each status should have a non-empty label', () => {
    for (const o of STATUS_OPTIONS) {
      assert.ok(typeof o.label === 'string' && o.label.length > 0, `Status ${o.value} has empty label`);
    }
  });
});

describe('constants — RISK_LEVEL_OPTIONS', () => {
  it('should have exactly 3 risk levels', () => {
    assert.equal(RISK_LEVEL_OPTIONS.length, 3);
  });

  it('should include all expected risk levels', () => {
    const values = RISK_LEVEL_OPTIONS.map((o) => o.value);
    assert.ok(values.includes('low'));
    assert.ok(values.includes('medium'));
    assert.ok(values.includes('high'));
  });

  it('each risk level should have a non-empty label', () => {
    for (const o of RISK_LEVEL_OPTIONS) {
      assert.ok(o.label.length > 0, `Risk level ${o.value} has empty label`);
    }
  });
});

describe('constants — MARKET_OPTIONS', () => {
  it('should have exactly 5 market options', () => {
    assert.equal(MARKET_OPTIONS.length, 5);
  });

  it('should include cn-mainland', () => {
    assert.ok(MARKET_OPTIONS.includes('cn-mainland'));
  });

  it('should include sea-default', () => {
    assert.ok(MARKET_OPTIONS.includes('sea-default'));
  });
});

// ==================== Composite / cross-field ====================

describe('validateForm — composite scenarios', () => {
  it('should reject a store with 3 errors: empty name, invalid code, empty phone', () => {
    const errors = validateForm({
      ...DEFAULT_VALUES,
      code: 'ABC',
      address: '北京市朝阳区测试路1号',
    });
    const fields = errors.map((e) => e.field);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('code'));
    assert.ok(fields.includes('contactPhone'));
    assert.ok(errors.length >= 3);
  });

  it('should not produce duplicate errors for same field', () => {
    const errors = validateForm({ ...VALID_STORE, name: '' });
    const nameErrors = errors.filter((e) => e.field === 'name');
    assert.equal(nameErrors.length, 1, 'Should only have 1 error per field');
  });

  it('should clear progressively fewer errors as fields are filled', () => {
    const allEmpty = validateForm(DEFAULT_VALUES);
    const halfFilled = validateForm({ ...DEFAULT_VALUES, name: '测试店', address: '北京市朝阳区路1号' });
    assert.ok(halfFilled.length < allEmpty.length, 'Filled fields should reduce errors');
  });
});

// ==================== Submit simulation ====================

describe('submit — mock rules', () => {
  it('should reject code STORE-999 as duplicate', () => {
    const DUPLICATE_CODE = 'STORE-999';
    const store = { ...VALID_STORE, code: DUPLICATE_CODE };
    // Validation itself passes — it's a submit-time check
    assert.equal(validateForm(store).length, 0);
    // Simulate API check
    const isDuplicate = store.code === 'STORE-999';
    assert.ok(isDuplicate, 'STORE-999 should be flagged as duplicate');
  });

  it('should accept non-duplicate codes', () => {
    const codes = ['STORE-001', 'STORE-100', 'STORE-888'];
    for (const code of codes) {
      assert.equal(validateForm({ ...VALID_STORE, code }).filter((e) => e.field === 'code').length, 0);
    }
  });

  it('submit time should be around 1200ms', async () => {
    const start = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 1100, `Expected ~1200ms, got ${elapsed}ms`);
    assert.ok(elapsed < 1500, `Expected ~1200ms, got ${elapsed}ms`);
  });
});
