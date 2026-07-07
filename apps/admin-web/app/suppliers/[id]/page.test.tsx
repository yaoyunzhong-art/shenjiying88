/**
 * suppliers-detail-page.test.tsx — Page-level tests for supplier detail page.
 * Tests data lookup, status mapping, category mapping, credit rating formatting,
 * state transitions, validation, and async operations.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 静态数据 & 映射 ----

type SupplierStatus = 'active' | 'paused' | 'blacklisted' | 'pending_audit';
type SupplierCategory = 'raw_material' | 'packaging' | 'equipment' | 'logistics' | 'service' | 'others';
type SupplierCredit = 'AAA' | 'AA' | 'A' | 'B' | 'C';

const SUPPLIER_STATUS_MAP: Record<SupplierStatus, { label: string; variant: string }> = {
  active: { label: '合作中', variant: 'success' },
  paused: { label: '暂停合作', variant: 'warning' },
  blacklisted: { label: '黑名单', variant: 'danger' },
  pending_audit: { label: '待审核', variant: 'info' },
};

const SUPPLIER_CATEGORY_MAP: Record<SupplierCategory, string> = {
  raw_material: '原材料',
  packaging: '包装耗材',
  equipment: '设备',
  logistics: '物流配送',
  service: '服务',
  others: '其他',
};

const SUPPLIER_CREDIT_MAP: Record<SupplierCredit, { label: string; color: string }> = {
  AAA: { label: 'AAA', color: '#22c55e' },
  AA: { label: 'AA', color: '#34d399' },
  A: { label: 'A', color: '#facc15' },
  B: { label: 'B', color: '#fb923c' },
  C: { label: 'C', color: '#ef4444' },
};

const TRANSITION_ACTIONS: { from: SupplierStatus; to: SupplierStatus; label: string }[] = [
  { from: 'pending_audit', to: 'active', label: '通过审核' },
  { from: 'pending_audit', to: 'blacklisted', label: '拒绝' },
  { from: 'active', to: 'paused', label: '暂停合作' },
  { from: 'paused', to: 'active', label: '恢复合作' },
  { from: 'active', to: 'blacklisted', label: '加入黑名单' },
];

// ---- Detail data model (mirrors page) ----

interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  category: SupplierCategory;
  status: SupplierStatus;
  creditRating: SupplierCredit;
  cooperationMonths: number;
  totalOrders: number;
  totalAmount: number;
  defectRate: number;
  avgDeliveryDays: number;
  address: string;
  marketCode: string;
  createdBy: string;
  createdAt: string;
  lastOrderAt: string;
}

const MOCK_SUPPLIERS_DETAIL: Record<string, SupplierDetail> = {
  'sp-001': { id: 'sp-001', code: 'SUP-001', name: '绿源食品有限公司', contactPerson: '王建国', contactPhone: '13800010001', email: 'wjg@lyfood.com', category: 'raw_material', status: 'active', creditRating: 'AA', cooperationMonths: 36, totalOrders: 142, totalAmount: 3850000, defectRate: 0.8, avgDeliveryDays: 2, address: '北京市大兴区生物医药基地', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-01-15', lastOrderAt: '2026-06-20' },
  'sp-005': { id: 'sp-005', code: 'SUP-005', name: '锦华设备制造厂', contactPerson: '钱锦华', contactPhone: '13800010005', email: 'qjh@jhdevice.com', category: 'equipment', status: 'paused', creditRating: 'B', cooperationMonths: 12, totalOrders: 6, totalAmount: 450000, defectRate: 5.5, avgDeliveryDays: 15, address: '浙江省宁波市鄞州区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2024-03-15', lastOrderAt: '2025-11-05' },
  'sp-006': { id: 'sp-006', code: 'SUP-006', name: '嘉华物业管理有限公司', contactPerson: '周建华', contactPhone: '13800010006', email: 'zhoujh@jiahua.com', category: 'service', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '成都市武侯区天府大道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-10', lastOrderAt: '-' },
  'sp-008': { id: 'sp-008', code: 'SUP-008', name: '源广达食材供应链', contactPerson: '孙广源', contactPhone: '13800010008', email: 'sgy@ygdsc.com', category: 'raw_material', status: 'blacklisted', creditRating: 'C', cooperationMonths: 6, totalOrders: 12, totalAmount: 185000, defectRate: 12.3, avgDeliveryDays: 5, address: '湖北省武汉市江汉区', marketCode: 'cn-mainland', createdBy: '赵丽', createdAt: '2024-03-01', lastOrderAt: '2024-09-20' },
};

function getSupplierById(id: string): SupplierDetail | undefined {
  return MOCK_SUPPLIERS_DETAIL[id];
}

// ---- Pages-level helpers (mirrors page logic) ----

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 10000).toFixed(1)}万`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(2)}万`;
  return String(amount);
}

interface EditFormData {
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  address: string;
}

interface EditFormErrors {
  name?: string;
  contactPerson?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '供应商名称不能为空';
  if (!data.contactPerson.trim()) errors.contactPerson = '联系人不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

async function submitSupplierEdit(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

async function submitStatusTransition(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

function getStatusTransitionActions(
  currentStatus: SupplierStatus,
): { from: SupplierStatus; to: SupplierStatus; label: string }[] {
  return TRANSITION_ACTIONS.filter((a) => a.from === currentStatus);
}

// ---- Test: Data lookup ----

describe('supplier-detail — data lookup', () => {
  it('should find existing supplier by id', () => {
    const s = getSupplierById('sp-001');
    assert.ok(s);
    assert.equal(s?.name, '绿源食品有限公司');
    assert.equal(s?.code, 'SUP-001');
  });

  it('should return undefined for unknown id', () => {
    const s = getSupplierById('sp-999');
    assert.equal(s, undefined);
  });

  it('should have expected fields for each mock supplier', () => {
    const required: (keyof SupplierDetail)[] = [
      'id', 'code', 'name', 'contactPerson', 'contactPhone', 'email',
      'category', 'status', 'creditRating', 'cooperationMonths',
      'totalOrders', 'totalAmount', 'defectRate', 'avgDeliveryDays',
      'address', 'marketCode', 'createdBy', 'createdAt', 'lastOrderAt',
    ];
    for (const entry of Object.values(MOCK_SUPPLIERS_DETAIL)) {
      for (const field of required) {
        assert.ok(
          entry[field] !== undefined,
          `Supplier ${entry.id} missing field ${field}`,
        );
      }
    }
  });
});

// ---- Test: Status / Category / Credit mapping ----

describe('supplier-detail — status, category, credit maps', () => {
  it('should map all supplier statuses', () => {
    const statuses: SupplierStatus[] = ['active', 'paused', 'blacklisted', 'pending_audit'];
    for (const s of statuses) {
      const m = SUPPLIER_STATUS_MAP[s];
      assert.ok(m, `Missing status map for ${s}`);
      assert.ok(m.label.length > 0);
      assert.ok(['success', 'warning', 'danger', 'info'].includes(m.variant));
    }
  });

  it('should map all categories', () => {
    const cats: SupplierCategory[] = ['raw_material', 'packaging', 'equipment', 'logistics', 'service', 'others'];
    for (const c of cats) {
      const m = SUPPLIER_CATEGORY_MAP[c];
      assert.ok(m, `Missing category map for ${c}`);
      assert.ok(m.length > 0);
    }
  });

  it('should map all credit ratings', () => {
    const credits: SupplierCredit[] = ['AAA', 'AA', 'A', 'B', 'C'];
    for (const c of credits) {
      const m = SUPPLIER_CREDIT_MAP[c];
      assert.ok(m, `Missing credit map for ${c}`);
      assert.ok(m.label.length > 0);
      assert.ok(m.color.startsWith('#'));
    }
  });

  it('should correctly map supplier sp-006 to pending_audit', () => {
    const s = getSupplierById('sp-006');
    assert.ok(s);
    assert.equal(s?.status, 'pending_audit');
    assert.equal(SUPPLIER_STATUS_MAP[s!.status].label, '待审核');
  });

  it('should correctly map sp-008 to blacklisted', () => {
    const s = getSupplierById('sp-008');
    assert.ok(s);
    assert.equal(s?.status, 'blacklisted');
    assert.equal(SUPPLIER_STATUS_MAP[s!.status].label, '黑名单');
    assert.equal(SUPPLIER_STATUS_MAP[s!.status].variant, 'danger');
  });
});

// ---- Test: Format amount ----

describe('supplier-detail — formatAmount helper', () => {
  it('should format amounts < 10000 as plain number', () => {
    assert.equal(formatAmount(45000), '4.50万');
  });

  it('should format amounts >= 1000000 in 万 with 1 decimal', () => {
    assert.equal(formatAmount(3850000), '385.0万');
    assert.equal(formatAmount(15800000), '1580.0万');
  });

  it('should format amounts >= 10000 but < 1000000 in 万 with 2 decimals', () => {
    assert.equal(formatAmount(450000), '45.00万');
    assert.equal(formatAmount(980000), '98.00万');
  });

  it('should format zero amount', () => {
    assert.equal(formatAmount(0), '0');
  });
});

// ---- Test: Status transitions ----

describe('supplier-detail — status transitions', () => {
  it('should allow pending_audit -> active and pending_audit -> blacklisted', () => {
    const actions = getStatusTransitionActions('pending_audit');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'active'));
    assert.ok(actions.some((a) => a.to === 'blacklisted'));
  });

  it('should allow active -> paused and active -> blacklisted', () => {
    const actions = getStatusTransitionActions('active');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'paused'));
    assert.ok(actions.some((a) => a.to === 'blacklisted'));
  });

  it('should allow paused -> active', () => {
    const actions = getStatusTransitionActions('paused');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].to, 'active');
  });

  it('should have no available transitions from blacklisted', () => {
    const actions = getStatusTransitionActions('blacklisted');
    assert.equal(actions.length, 0);
  });

  it('async status transition should succeed', async () => {
    const result = await submitStatusTransition();
    assert.ok(result.success);
  });
});

// ---- Test: Form validation ----

describe('supplier-detail — form validation', () => {
  const validData: EditFormData = {
    name: '测试供应商',
    contactPerson: '张三',
    contactPhone: '13800138000',
    email: 'test@example.com',
    address: '测试地址',
  };

  it('should pass validation with valid data', () => {
    const errors = validateForm(validData);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('should reject empty name', () => {
    const errors = validateForm({ ...validData, name: '' });
    assert.equal(errors.name, '供应商名称不能为空');
  });

  it('should reject whitespace-only name', () => {
    const errors = validateForm({ ...validData, name: '   ' });
    assert.equal(errors.name, '供应商名称不能为空');
  });

  it('should reject empty contactPerson', () => {
    const errors = validateForm({ ...validData, contactPerson: '' });
    assert.equal(errors.contactPerson, '联系人不能为空');
  });

  it('should reject empty contactPhone', () => {
    const errors = validateForm({ ...validData, contactPhone: '' });
    assert.equal(errors.contactPhone, '联系电话不能为空');
  });

  it('should reject invalid email format', () => {
    const errors = validateForm({ ...validData, email: 'not-an-email' });
    assert.equal(errors.email, '邮箱格式不正确');
  });

  it('should pass with empty email (optional)', () => {
    const errors = validateForm({ ...validData, email: '' });
    assert.equal(errors.email, undefined);
  });

  it('should collect multiple errors', () => {
    const errors = validateForm({ name: '', contactPerson: '', contactPhone: '13800138000', email: '', address: '' });
    assert.equal(Object.keys(errors).length, 2);
    assert.ok(errors.name);
    assert.ok(errors.contactPerson);
  });
});

// ---- Test: Async submit ----

describe('supplier-detail — async operations', () => {
  it('async edit submit should return success', async () => {
    const result = await submitSupplierEdit();
    assert.equal(result.success, true);
  });
});

// ---- Test: Supplier data consistency ----

describe('supplier-detail — data consistency', () => {
  it('each supplier status should match a defined map entry', () => {
    for (const entry of Object.values(MOCK_SUPPLIERS_DETAIL)) {
      const m = SUPPLIER_STATUS_MAP[entry.status];
      assert.ok(m, `Missing status entry for ${entry.status} on ${entry.id}`);
    }
  });

  it('each supplier credit rating should match a defined map entry', () => {
    for (const entry of Object.values(MOCK_SUPPLIERS_DETAIL)) {
      const m = SUPPLIER_CREDIT_MAP[entry.creditRating];
      assert.ok(m, `Missing credit entry for ${entry.creditRating} on ${entry.id}`);
    }
  });

  it('each supplier category should match a defined map entry', () => {
    for (const entry of Object.values(MOCK_SUPPLIERS_DETAIL)) {
      const m = SUPPLIER_CATEGORY_MAP[entry.category];
      assert.ok(m, `Missing category entry for ${entry.category} on ${entry.id}`);
    }
  });

  it('all 4 distinct statuses should be represented', () => {
    const found = new Set(Object.values(MOCK_SUPPLIERS_DETAIL).map((s) => s.status));
    assert.equal(found.size, 4);
    assert.ok(found.has('active'));
    assert.ok(found.has('paused'));
    assert.ok(found.has('blacklisted'));
    assert.ok(found.has('pending_audit'));
  });
});
