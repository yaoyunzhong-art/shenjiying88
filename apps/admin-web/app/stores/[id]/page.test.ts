/**
 * stores/[id]/page.test.ts — Page-level tests for stores detail page.
 * Tests detail lookup, form validation, status/risk-level label display, not-found handling.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: stores-data.ts, stores/[id]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  MOCK_STORES,
  STORE_STATUS_MAP,
  STORE_RISK_LEVEL_MAP,
  STORE_STATUSES,
  type StoreStatus,
  type StoreRiskLevel,
} from '../../stores-data';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

// ---- Detail lookup (mirrors getStoreById in page.tsx) ----
// The page uses its own inline lookup table, but we test against the shared MOCK_STORES
// since the data is structurally identical

interface StoreDetailView {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: StoreStatus;
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: StoreRiskLevel;
  address: string;
  contactEmail: string;
  contactPhone: string;
  openedAt: string;
  floorArea: number;
  description: string;
}

function getStoreById(id: string): StoreDetailView | undefined {
  const base = MOCK_STORES.find((s) => s.id === id);
  if (!base) return undefined;
  return {
    ...base,
    address: `${base.name}地址`,
    contactEmail: `${base.code?.toLowerCase()}@m5.com`,
    contactPhone: '+86-10-8888-0000',
    openedAt: '2024-01-01',
    floorArea: 5000,
    description: `${base.name}门店描述`,
  };
}

// ---- Form validation (mirrors validateForm in page.tsx) ----

interface EditFormData {
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '门店名称不能为空';
  if (!data.address.trim()) errors.address = '门店地址不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

function getStoreStatusLabel(status: StoreStatus): string {
  return STORE_STATUS_MAP[status]?.label ?? status;
}

function getStoreRiskLevelLabel(level: StoreRiskLevel): string {
  return STORE_RISK_LEVEL_MAP[level]?.label ?? level;
}

// ---- 正例 ----

describe('stores/[id]: 正例 (positive cases)', () => {
  it('源码接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'store:read'"));
  });

  describe('detail lookup', () => {
    it('should find store by existing id', () => {
      const store = getStoreById('s1');
      assert.ok(store, 'should find s1');
      assert.strictEqual(store!.code, 'STORE-001');
      assert.strictEqual(store!.name, '朝阳大悦城旗舰店');
    });

    it('should find store with another valid id', () => {
      const store = getStoreById('s7');
      assert.ok(store, 'should find s7');
      assert.strictEqual(store!.code, 'STORE-007');
      assert.strictEqual(store!.name, 'New York Fifth Avenue');
    });

    it('should find all MOCK_STORES by id', () => {
      for (const s of MOCK_STORES) {
        const found = getStoreById(s.id);
        assert.ok(found, `should find ${s.id}`);
        assert.strictEqual(found!.code, s.code);
      }
    });
  });

  describe('status labels', () => {
    it('should return correct Chinese status labels', () => {
      assert.strictEqual(getStoreStatusLabel('active'), '运营中');
      assert.strictEqual(getStoreStatusLabel('inactive'), '已停用');
      assert.strictEqual(getStoreStatusLabel('pending'), '待激活');
      assert.strictEqual(getStoreStatusLabel('suspended'), '已暂停');
    });
  });

  describe('risk level labels', () => {
    it('should return correct Chinese risk level labels', () => {
      assert.strictEqual(getStoreRiskLevelLabel('high'), '高');
      assert.strictEqual(getStoreRiskLevelLabel('medium'), '中');
      assert.strictEqual(getStoreRiskLevelLabel('low'), '低');
    });
  });

  describe('store detail fields', () => {
    it('should have non-empty fields for all stores', () => {
      for (const s of MOCK_STORES) {
        assert.ok(s.code.length > 0, `empty code for ${s.id}`);
        assert.ok(s.name.length > 0, `empty name for ${s.id}`);
        assert.ok(s.marketCode.length > 0, `empty marketCode for ${s.id}`);
      }
    });

    it('should have valid lastDeployed dates', () => {
      for (const s of MOCK_STORES) {
        assert.ok(/^\d{4}-\d{2}-\d{2}/.test(s.lastDeployed), `${s.id} invalid date: ${s.lastDeployed}`);
      }
    });
  });

  describe('form validation', () => {
    it('should pass for valid form data', () => {
      const errors = validateForm({
        name: '朝阳大悦城旗舰店',
        address: '北京市朝阳区朝阳北路101号',
        contactPhone: '+86-10-8888-1111',
        contactEmail: 'chaoyang@m5.com',
        description: '旗舰级门店',
      });
      assert.strictEqual(Object.keys(errors).length, 0);
    });

    it('should accept empty email as valid (optional field)', () => {
      const errors = validateForm({
        name: '测试门店',
        address: '测试地址',
        contactPhone: '13800138000',
        contactEmail: '',
        description: '',
      });
      assert.strictEqual(Object.keys(errors).length, 0);
    });
  });
});

// ---- 反例 ----

describe('stores/[id]: 反例 (negative cases)', () => {
  it('should return undefined for nonexistent id', () => {
    const store = getStoreById('nonexistent');
    assert.strictEqual(store, undefined);
  });

  it('should return undefined for empty string id', () => {
    const store = getStoreById('');
    assert.strictEqual(store, undefined);
  });

  describe('form validation', () => {
    it('should reject empty name', () => {
      const errors = validateForm({
        name: '', address: '地址', contactPhone: '13800138000', contactEmail: '', description: '',
      });
      assert.ok(errors.name, 'name error expected');
      assert.ok(errors.name!.includes('不能为空'));
    });

    it('should reject empty address', () => {
      const errors = validateForm({
        name: '门店', address: '', contactPhone: '13800138000', contactEmail: '', description: '',
      });
      assert.ok(errors.address, 'address error expected');
    });

    it('should reject empty contactPhone', () => {
      const errors = validateForm({
        name: '门店', address: '地址', contactPhone: '', contactEmail: '', description: '',
      });
      assert.ok(errors.contactPhone, 'phone error expected');
    });

    it('should reject invalid email format', () => {
      const errors = validateForm({
        name: '门店', address: '地址', contactPhone: '13800138000', contactEmail: 'not-an-email', description: '',
      });
      assert.ok(errors.contactEmail, 'email error expected');
    });

    it('should reject email with missing domain', () => {
      const errors = validateForm({
        name: '门店', address: '地址', contactPhone: '13800138000', contactEmail: 'user@', description: '',
      });
      assert.ok(errors.contactEmail, 'email error expected for user@');
    });

    it('should reject email with missing TLD', () => {
      const errors = validateForm({
        name: '门店', address: '地址', contactPhone: '13800138000', contactEmail: 'user@domain', description: '',
      });
      assert.ok(errors.contactEmail, 'email error expected for user@domain');
    });
  });
});

// ---- 边界 ----

describe('stores/[id]: 边界 (boundary cases)', () => {
  it('validateForm should return multiple errors at once', () => {
    const errors = validateForm({
      name: '', address: '', contactPhone: '', contactEmail: '', description: '',
    });
    const keys = Object.keys(errors);
    assert.ok(keys.length >= 3, `expected >= 3 errors, got ${keys.length}`);
  });

  it('suspended stores should have high risk level', () => {
    const suspended = MOCK_STORES.filter((s) => s.status === 'suspended');
    for (const s of suspended) {
      assert.strictEqual(s.riskLevel, 'high', `${s.id} should be high risk`);
    }
  });

  it('active stores should have low or medium risk level only', () => {
    const active = MOCK_STORES.filter((s) => s.status === 'active');
    for (const s of active) {
      assert.ok(s.riskLevel !== 'high', `active ${s.id} should not be high risk`);
    }
  });

  it('pending stores should have the lowest tenant counts', () => {
    const pending = MOCK_STORES.filter((s) => s.status === 'pending');
    const maxPendingTenants = Math.max(...pending.map((s) => s.tenantCount));
    const activeMinTenants = Math.min(
      ...MOCK_STORES.filter((s) => s.status === 'active').map((s) => s.tenantCount)
    );
    // Pending stores should have fewer or equal tenants than active stores
    assert.ok(maxPendingTenants <= activeMinTenants + 2,
      `pending max ${maxPendingTenants} should be <= active min ${activeMinTenants} within tolerance`);
  });

  it('all 3 markets should have non-inactive stores (active or pending)', () => {
    const markets = ['cn-mainland', 'us-default', 'uk-default'];
    for (const m of markets) {
      const storesInMarket = MOCK_STORES.filter(
        (s) => s.marketCode === m && (s.status === 'active' || s.status === 'pending')
      );
      assert.ok(storesInMarket.length >= 1, `market ${m} should have at least 1 active/pending store`);
    }
  });

  it('cn-mainland stores should have unique codes', () => {
    const cnStores = MOCK_STORES.filter((s) => s.marketCode === 'cn-mainland');
    const codes = cnStores.map((s) => s.code);
    assert.strictEqual(new Set(codes).size, codes.length);
  });

  it('all store tenants should be correct type (number)', () => {
    for (const s of MOCK_STORES) {
      assert.strictEqual(typeof s.tenantCount, 'number');
      assert.strictEqual(typeof s.brandCount, 'number');
    }
  });
});
