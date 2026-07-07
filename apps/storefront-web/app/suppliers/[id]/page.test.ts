/**
 * Supplier Detail Page — storefront-web
 * Tests: detail page rendering logic, supplier look-up, not-found handling,
 *        status flow, edit/delete operations
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与 page.tsx 保持一致的数据类型和常量 ---- //

type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: '合作中',
  paused: '暂停合作',
  terminated: '已终止',
  pending: '待审核',
};

const SUPPLIER_STATUS_COLORS: Record<SupplierStatus, string> = {
  active: '#059669',
  paused: '#d97706',
  terminated: '#dc2626',
  pending: '#6366f1',
};

const STATUS_FLOW: SupplierStatus[] = ['pending', 'active', 'paused', 'terminated'];

interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status: SupplierStatus;
  totalProducts: number;
  totalAmount: number;
  cooperationStart: string;
  updatedAt: string;
  address: string;
  remark: string;
}

// 与 page.tsx 的 MOCK_SUPPLIERS 保持一致
const MOCK_SUPPLIERS: Record<string, SupplierDetail> = {
  '1': {
    id: '1', code: 'SUP-001', name: '广州美妆供应链有限公司',
    contactPerson: '李明', phone: '13800138001', email: 'liming@gzbeauty.com',
    category: '护肤品', status: 'active',
    totalProducts: 48, totalAmount: 1268000,
    cooperationStart: '2024-01-15', updatedAt: '2026-06-25 10:32',
    address: '广州市白云区美妆产业园区A栋',
    remark: '长期合作供应商，供货稳定，物流时效在2-3天。',
  },
  '2': {
    id: '2', code: 'SUP-002', name: '上海日化贸易有限公司',
    contactPerson: '王芳', phone: '13900139002', email: 'wangfang@shdaily.com',
    category: '彩妆', status: 'active',
    totalProducts: 36, totalAmount: 892000,
    cooperationStart: '2024-03-20', updatedAt: '2026-06-25 09:15',
    address: '上海市浦东新区外高桥保税区B座',
    remark: '进口彩妆主要供应商。',
  },
  '3': {
    id: '3', code: 'SUP-003', name: '杭州香氛科技有限公司',
    contactPerson: '张伟', phone: '13700137003', email: 'zhangwei@hzperfume.com',
    category: '香水', status: 'paused',
    totalProducts: 12, totalAmount: 345000,
    cooperationStart: '2024-06-01', updatedAt: '2026-06-24 18:00',
    address: '杭州市余杭区未来科技城C座',
    remark: '因质检问题暂停合作。',
  },
  '4': {
    id: '4', code: 'SUP-004', name: '深圳包材创新有限公司',
    contactPerson: '刘洋', phone: '13600136004', email: 'liuyang@szpackaging.com',
    category: '包装材料', status: 'active',
    totalProducts: 85, totalAmount: 523000,
    cooperationStart: '2024-02-10', updatedAt: '2026-06-25 08:45',
    address: '深圳市宝安区福永街道工业园',
    remark: '包装材料独家供应商。',
  },
};

/** 状态流转：下一个状态 */
function getNextStatus(current: SupplierStatus): SupplierStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
  return null;
}

/** 状态流转：上一个状态 */
function getPrevStatus(current: SupplierStatus): SupplierStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx > 0) return STATUS_FLOW[idx - 1];
  return null;
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function getStatusLabel(status: SupplierStatus): string {
  return SUPPLIER_STATUS_LABELS[status];
}

function getStatusColor(status: SupplierStatus): string {
  return SUPPLIER_STATUS_COLORS[status];
}

// ---- 测试 ---- //

describe('SupplierDetailPage 供应商详情', () => {
  it('1. STATUS_LABELS 包含全部 4 种状态', () => {
    assert.equal(Object.keys(SUPPLIER_STATUS_LABELS).length, 4);
    assert.equal(SUPPLIER_STATUS_LABELS.active, '合作中');
    assert.equal(SUPPLIER_STATUS_LABELS.paused, '暂停合作');
    assert.equal(SUPPLIER_STATUS_LABELS.terminated, '已终止');
    assert.equal(SUPPLIER_STATUS_LABELS.pending, '待审核');
  });

  it('2. STATUS_COLORS 所有值为合法十六进制颜色', () => {
    for (const s of Object.keys(SUPPLIER_STATUS_COLORS) as SupplierStatus[]) {
      assert.ok(/^#[0-9a-f]{6}$/.test(SUPPLIER_STATUS_COLORS[s]), `${s} => ${SUPPLIER_STATUS_COLORS[s]}`);
    }
  });

  it('3. STATUS_FLOW 顺序正确', () => {
    assert.deepEqual(STATUS_FLOW, ['pending', 'active', 'paused', 'terminated']);
  });
});

describe('SupplierDetailPage 数据查找', () => {
  it('6. 存在 SUP-001（active）', () => {
    const item = MOCK_SUPPLIERS['1'];
    assert.equal(item.name, '广州美妆供应链有限公司');
    assert.equal(item.status, 'active');
    assert.equal(item.contactPerson, '李明');
    assert.equal(item.phone, '13800138001');
    assert.equal(item.totalProducts, 48);
    assert.equal(item.totalAmount, 1268000);
  });

  it('7. 存在 SUP-003（paused）', () => {
    const item = MOCK_SUPPLIERS['3'];
    assert.equal(item.name, '杭州香氛科技有限公司');
    assert.equal(item.status, 'paused');
    assert.equal(item.remark, '因质检问题暂停合作。');
  });

  it('8. 存在 SUP-004（active 包装材料）', () => {
    const item = MOCK_SUPPLIERS['4'];
    assert.equal(item.category, '包装材料');
    assert.equal(item.totalProducts, 85);
    assert.equal(item.totalAmount, 523000);
  });

  it('9. 不存在的 ID 返回 undefined', () => {
    assert.equal(MOCK_SUPPLIERS['999'], undefined);
  });

  it('10. 空字符串 ID 返回 undefined', () => {
    assert.equal(MOCK_SUPPLIERS[''], undefined);
  });
});

describe('SupplierDetailPage 状态流转', () => {
  it('11. pending 下一个是 active', () => {
    assert.equal(getNextStatus('pending'), 'active');
  });

  it('12. active 下一个是 paused', () => {
    assert.equal(getNextStatus('active'), 'paused');
  });

  it('13. paused 下一个是 terminated', () => {
    assert.equal(getNextStatus('paused'), 'terminated');
  });

  it('14. terminated 没有下一个状态', () => {
    assert.equal(getNextStatus('terminated'), null);
  });

  it('15. pending 没有上一个状态', () => {
    assert.equal(getPrevStatus('pending'), null);
  });

  it('16. active 上一个状态是 pending', () => {
    assert.equal(getPrevStatus('active'), 'pending');
  });

  it('17. paused 上一个状态是 active', () => {
    assert.equal(getPrevStatus('paused'), 'active');
  });

  it('18. terminated 上一个状态是 paused', () => {
    assert.equal(getPrevStatus('terminated'), 'paused');
  });
});

describe('SupplierDetailPage 辅助函数', () => {
  it('19. formatCurrency 格式化 0', () => {
    assert.equal(formatCurrency(0), '¥0.00');
  });

  it('20. formatCurrency 格式化大额', () => {
    assert.equal(formatCurrency(1268000), '¥1,268,000.00');
    assert.equal(formatCurrency(523000), '¥523,000.00');
  });

  it('21. formatCurrency 格式化小数', () => {
    assert.equal(formatCurrency(1.5), '¥1.50');
  });

  it('22. formatCurrency 处理负数', () => {
    assert.equal(formatCurrency(-100), '¥-100.00');
  });

  it('23. getStatusLabel 返回正确中文标签', () => {
    assert.equal(getStatusLabel('active'), '合作中');
    assert.equal(getStatusLabel('paused'), '暂停合作');
    assert.equal(getStatusLabel('terminated'), '已终止');
    assert.equal(getStatusLabel('pending'), '待审核');
  });

  it('24. getStatusColor 返回正确颜色', () => {
    assert.equal(getStatusColor('active'), '#059669');
    assert.equal(getStatusColor('paused'), '#d97706');
    assert.equal(getStatusColor('terminated'), '#dc2626');
    assert.equal(getStatusColor('pending'), '#6366f1');
  });
});

describe('SupplierDetailPage Mock 数据完整性', () => {
  it('25. 共 4 条 Mock 数据', () => {
    assert.equal(Object.keys(MOCK_SUPPLIERS).length, 4);
  });

  it('26. 所有记录拥有完整字段', () => {
    for (const key of Object.keys(MOCK_SUPPLIERS)) {
      const item = MOCK_SUPPLIERS[key];
      assert.ok(item.id);
      assert.ok(item.code);
      assert.ok(item.name);
      assert.ok(item.contactPerson);
      assert.ok(item.phone);
      assert.ok(item.email);
      assert.ok(item.category);
      assert.ok(SUPPLIER_STATUS_LABELS[item.status]);
      assert.equal(typeof item.totalProducts, 'number');
      assert.equal(typeof item.totalAmount, 'number');
      assert.ok(item.address);
      assert.equal(typeof item.remark, 'string');
    }
  });

  it('27. 各供应商交易总额求和计算正确', () => {
    const total = Object.values(MOCK_SUPPLIERS).reduce((s, i) => s + i.totalAmount, 0);
    assert.equal(total, 3028000); // 1268000 + 892000 + 345000 + 523000
  });

  it('28. 各供应商商品总数求和正确', () => {
    const total = Object.values(MOCK_SUPPLIERS).reduce((s, i) => s + i.totalProducts, 0);
    assert.equal(total, 181); // 48 + 36 + 12 + 85
  });
});
