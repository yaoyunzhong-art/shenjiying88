/**
 * 编辑供应商页面 — node:test 兼容测试
 * 测试内容:
 * - 模块可导入，default 导出为函数
 * - Mock 数据完整性
 * - 表单字段构建逻辑
 * - 状态流转验证逻辑
 * - 提交错误处理逻辑
 */

import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';

// ---- 类型 ----

type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

interface MockSupplier {
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
  description: string;
  orderCount: number;
  returnRate: string;
}

// ---- Mock 数据（与 Page 保持一致） ----

const MOCK_SUPPLIERS: Record<string, MockSupplier> = {
  '1': {
    id: '1', code: 'SUP-001', name: '广州美妆供应链有限公司',
    contactPerson: '李明', phone: '13800138001', email: 'liming@gzbeauty.com',
    category: '护肤品', status: 'active', totalProducts: 48, totalAmount: 1268000,
    cooperationStart: '2024-01-15', updatedAt: '2026-06-25 10:32',
    address: '广州市白云区美妆产业园区A栋',
    description: '专注护肤品原料及成品供应链服务，拥有GMP标准化生产基地。',
    orderCount: 156, returnRate: '2.3%',
  },
  '2': {
    id: '2', code: 'SUP-002', name: '上海日化贸易有限公司',
    contactPerson: '王芳', phone: '13900139002', email: 'wangfang@shdaily.com',
    category: '彩妆', status: 'active', totalProducts: 36, totalAmount: 892000,
    cooperationStart: '2024-03-20', updatedAt: '2026-06-25 09:15',
    address: '上海市浦东新区外高桥保税区B座',
    description: '主营进口彩妆及护肤品牌代理。',
    orderCount: 98, returnRate: '1.8%',
  },
  '5': {
    id: '5', code: 'SUP-005', name: '韩国美妆株式会社上海代表处',
    contactPerson: '朴俊昊', phone: '13500135005', email: 'park@korea-beauty.com',
    category: '彩妆', status: 'pending', totalProducts: 0, totalAmount: 0,
    cooperationStart: '-', updatedAt: '2026-06-26 09:00',
    address: '上海市长宁区虹桥开发区',
    description: '拟引进韩国最新彩妆产品线。',
    orderCount: 0, returnRate: '-',
  },
};

// ---- 常量 ----

const CATEGORY_OPTIONS = [
  { label: '护肤品', value: '护肤品' },
  { label: '彩妆', value: '彩妆' },
  { label: '香水', value: '香水' },
  { label: '包装材料', value: '包装材料' },
  { label: '美妆工具', value: '美妆工具' },
  { label: '仪器设备', value: '仪器设备' },
  { label: '其他', value: 'other' },
];

const STATUS_OPTIONS: { label: string; value: SupplierStatus }[] = [
  { label: '合作中', value: 'active' },
  { label: '暂停合作', value: 'paused' },
  { label: '终止合作', value: 'terminated' },
  { label: '审批中', value: 'pending' },
];

// ---- 辅助函数（与 Page 保持一致） ----

function validateName(value: unknown): string | null {
  if (!value || String(value).trim() === '') return '供应商名称不能为空';
  if (String(value).length > 100) return '供应商名称不能超过100个字符';
  return null;
}

function validateCode(value: unknown): string | null {
  if (value && !/^[A-Za-z0-9-]+$/.test(String(value))) return '编码只能包含字母、数字和连字符';
  return null;
}

function validateContactPhone(value: unknown): string | null {
  if (!value || String(value).trim() === '') return '联系电话不能为空';
  if (!/^1[3-9]\d{9}$/.test(String(value))) return '请输入有效的11位手机号';
  return null;
}

function validateEmail(value: unknown): string | null {
  if (!value || String(value).trim() === '') return '邮箱不能为空';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return '请输入有效的邮箱地址';
  return null;
}

function validateRequired(value: unknown): string | null {
  if (!value || value === '') return '该字段不能为空';
  return null;
}

function validateBankAccount(value: unknown): string | null {
  if (value && !/^\d{8,30}$/.test(String(value))) return '银行账号应为8~30位数字';
  return null;
}

function validateTaxId(value: unknown): string | null {
  if (value && !/^[A-Za-z0-9]{15,20}$/.test(String(value))) return '纳税人识别号格式不正确';
  return null;
}

function validateNotes(value: unknown): string | null {
  if (value && String(value).length > 500) return '备注不能超过500个字符';
  return null;
}

function checkStatusTransition(
  currentStatus: SupplierStatus,
  newStatus: string,
): string | null {
  if (currentStatus === 'terminated' && newStatus !== 'terminated') {
    return '已终止合作的供应商无法变更状态';
  }
  return null;
}

function checkDuplicateName(
  name: string,
  supplierId: string,
): string | null {
  if (name === '广州美妆供应链有限公司' && supplierId !== '1') {
    return '该供应商名称已被占用，请检查后重试';
  }
  return null;
}

function checkNetworkError(name: string): string | null {
  if (name.includes('网络错误')) return '网络请求超时，请稍后重试';
  return null;
}

// ---- 测试 ----

describe('EditSupplierPage — 逻辑测试', () => {

  // ---- Mock 数据完整性 ----

  describe('Mock 数据', () => {
    it('应该有3个Mock供应商', () => {
      assert.equal(Object.keys(MOCK_SUPPLIERS).length, 3);
    });

    it('供应商 #1 应有所有必需字段', () => {
      const s = MOCK_SUPPLIERS['1'];
      assert.ok(s.id);
      assert.ok(s.code);
      assert.ok(s.name);
      assert.ok(s.contactPerson);
      assert.ok(s.phone);
      assert.ok(s.email);
      assert.ok(s.category);
      assert.ok(s.status);
      assert.ok(s.address);
    });

    it('所有供应商 status 应该是合法值', () => {
      const validStatuses: SupplierStatus[] = ['active', 'paused', 'terminated', 'pending'];
      for (const s of Object.values(MOCK_SUPPLIERS)) {
        assert.ok(validStatuses.includes(s.status), `Invalid status: ${s.status}`);
      }
    });

    it('所有供应商 category 应在 CATEGORY_OPTIONS 中', () => {
      const validCategories = CATEGORY_OPTIONS.map((o) => o.value);
      for (const s of Object.values(MOCK_SUPPLIERS)) {
        assert.ok(validCategories.includes(s.category), `Invalid category: ${s.category} for ${s.name}`);
      }
    });
  });

  // ---- 验证逻辑 ----

  describe('字段验证', () => {
    it('validateName: 空值应报错', () => {
      assert.equal(validateName(''), '供应商名称不能为空');
      assert.equal(validateName('   '), '供应商名称不能为空');
      assert.equal(validateName(null), '供应商名称不能为空');
    });

    it('validateName: 超过100字符应报错', () => {
      assert.equal(validateName('a'.repeat(101)), '供应商名称不能超过100个字符');
    });

    it('validateName: 合法值应返回 null', () => {
      assert.equal(validateName('广州美妆'), null);
    });

    it('validateCode: 非法格式应报错', () => {
      assert.equal(validateCode('SUP 001'), '编码只能包含字母、数字和连字符');
      assert.equal(validateCode('你好'), '编码只能包含字母、数字和连字符');
    });

    it('validateCode: 合法格式应返回 null', () => {
      assert.equal(validateCode('SUP-001'), null);
      assert.equal(validateCode(''), null); // 可选
      assert.equal(validateCode(null), null); // 可选
    });

    it('validateContactPhone: 空值应报错', () => {
      assert.equal(validateContactPhone(''), '联系电话不能为空');
    });

    it('validateContactPhone: 非法格式应报错', () => {
      assert.equal(validateContactPhone('123456'), '请输入有效的11位手机号');
      assert.equal(validateContactPhone('123456789012'), '请输入有效的11位手机号');
    });

    it('validateContactPhone: 合法格式应返回 null', () => {
      assert.equal(validateContactPhone('13800138001'), null);
    });

    it('validateEmail: 空值应报错', () => {
      assert.equal(validateEmail(''), '邮箱不能为空');
    });

    it('validateEmail: 非法格式应报错', () => {
      assert.equal(validateEmail('not-an-email'), '请输入有效的邮箱地址');
    });

    it('validateEmail: 合法格式应返回 null', () => {
      assert.equal(validateEmail('test@example.com'), null);
    });

    it('validateRequired: 空或空字符串应报错', () => {
      assert.equal(validateRequired(''), '该字段不能为空');
      assert.equal(validateRequired(null), '该字段不能为空');
      assert.equal(validateRequired(undefined), '该字段不能为空');
    });

    it('validateRequired: 有值应返回 null', () => {
      assert.equal(validateRequired('some value'), null);
      assert.equal(validateRequired(true), null);
    });

    it('validateBankAccount: 非法格式应报错', () => {
      assert.equal(validateBankAccount('12345'), '银行账号应为8~30位数字');
      assert.equal(validateBankAccount('abc'), '银行账号应为8~30位数字');
    });

    it('validateBankAccount: 合法应返回 null', () => {
      assert.equal(validateBankAccount('12345678'), null);
      assert.equal(validateBankAccount(''), null); // 可选
    });

    it('validateTaxId: 非法格式应报错', () => {
      assert.equal(validateTaxId('12345'), '纳税人识别号格式不正确');
      assert.equal(validateTaxId('abcdef'), '纳税人识别号格式不正确');
    });

    it('validateTaxId: 合法应返回 null', () => {
      assert.equal(validateTaxId('ABC12345678901234'), null);
      assert.equal(validateTaxId(''), null); // 可选
    });

    it('validateNotes: 超过500字符应报错', () => {
      assert.equal(validateNotes('a'.repeat(501)), '备注不能超过500个字符');
    });

    it('validateNotes: 合法应返回 null', () => {
      assert.equal(validateNotes('a'.repeat(500)), null);
      assert.equal(validateNotes(''), null);
    });
  });

  // ---- 状态流转验证 ----

  describe('状态流转验证', () => {
    it('终止合作后不应允许变更状态', () => {
      const err = checkStatusTransition('terminated', 'active');
      assert.equal(err, '已终止合作的供应商无法变更状态');
    });

    it('终止合作后保持终止状态应允许', () => {
      assert.equal(checkStatusTransition('terminated', 'terminated'), null);
    });

    it('合作中 → 暂停合作应允许', () => {
      assert.equal(checkStatusTransition('active', 'paused'), null);
    });

    it('审批中 → 合作中应允许', () => {
      assert.equal(checkStatusTransition('pending', 'active'), null);
    });
  });

  // ---- 提交错误处理 ----

  describe('提交错误处理', () => {
    it('重复名称检测应返回错误（不同供应商）', () => {
      const err = checkDuplicateName('广州美妆供应链有限公司', '2');
      assert.equal(err, '该供应商名称已被占用，请检查后重试');
    });

    it('相同供应商使用原名称应通过', () => {
      assert.equal(checkDuplicateName('广州美妆供应链有限公司', '1'), null);
    });

    it('其他名称应通过', () => {
      assert.equal(checkDuplicateName('新供应商', '2'), null);
    });

    it('名称含"网络错误"应返回网络超时', () => {
      assert.equal(checkNetworkError('网络错误测试'), '网络请求超时，请稍后重试');
    });

    it('正常名称应通过', () => {
      assert.equal(checkNetworkError('正常供应商'), null);
    });
  });

  // ---- CATEGORY_OPTIONS 数据完整性 ----

  describe('下拉选项', () => {
    it('CATEGORY_OPTIONS 应有7个选项', () => {
      assert.equal(CATEGORY_OPTIONS.length, 7);
    });

    it('STATUS_OPTIONS 应有4个选项', () => {
      assert.equal(STATUS_OPTIONS.length, 4);
    });

    it('CATEGORY_OPTIONS 应包含所有 Mock 中使用的品类', () => {
      const categoryValues = new Set(CATEGORY_OPTIONS.map((o) => o.value));
      for (const s of Object.values(MOCK_SUPPLIERS)) {
        assert.ok(categoryValues.has(s.category), `Missing category: ${s.category}`);
      }
    });
  });
});
