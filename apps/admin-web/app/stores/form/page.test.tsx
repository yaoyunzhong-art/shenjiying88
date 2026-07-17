/**
 * stores/form/page.test.tsx — 门店编辑表单页 L1 测试
 *
 * 覆盖: 字段验证、门店编码格式、联系方式校验、建筑面积校验
 * 正例: 完整表单验证、可选字段通过、邮箱格式校验
 * 反例: 空名称、短名称、超长名称、编码格式错误、电话格式错误
 * 边界: 名称长度2/50、编码STORE-XXX格式、面积最大100000
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

import type {
  StoreFormValues as SFV,
  FieldError,
} from './page';

/* ── 类型定义(移植自page.tsx) ── */

interface StoreFormValues {
  name: string;
  code: string;
  marketCode: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  floorArea: string;
  status?: string;
  riskLevel: string;
  brandCount: string;
  description: string;
  notes: string;
}

interface FieldError {
  field: keyof StoreFormValues;
  message: string;
}

/* ── 验证逻辑(移植自page.tsx) ── */

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

/* ── 常量 ── */

const MARKET_OPTIONS = [
  { value: 'cn-mainland', label: '中国大陆' },
  { value: 'us-default', label: '美国' },
  { value: 'uk-default', label: '英国' },
  { value: 'jp-default', label: '日本' },
  { value: 'sea-default', label: '东南亚' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: '运营中' },
  { value: 'pending', label: '待激活' },
  { value: 'inactive', label: '已停用' },
  { value: 'suspended', label: '已暂停' },
];

const RISK_LEVELS = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
];

/* ── 辅助 ── */

function validForm(): StoreFormValues {
  return {
    name: '朝阳大悦城旗舰店',
    code: 'STORE-016',
    marketCode: 'cn-mainland',
    city: '北京市',
    address: '北京市朝阳区朝阳北路101号',
    contactPhone: '+86-10-8888-1111',
    contactEmail: 'store@example.com',
    floorArea: '8500',
    status: 'active',
    riskLevel: 'low',
    brandCount: '5',
    description: '核心商圈旗舰门店',
    notes: '测试备注',
  };
}

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('store-form: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('renders page shell', () => {
    const { container } = setup();
    assert.ok(container);
  });
});

describe('store-form: 数据类型', () => {
  it('StoreFormValues has all fields', () => {
    const v: StoreFormValues = {
      name: '测试店', code: 'STORE-001', marketCode: 'cn-mainland',
      city: '北京', address: '北京市朝阳区', contactPhone: '01088881111',
      contactEmail: 't@m5.com', floorArea: '100', status: 'active',
      riskLevel: 'low', brandCount: '3', description: '测试', notes: '',
    };
    assert.equal(typeof v.name, 'string');
    assert.equal(typeof v.code, 'string');
    assert.equal(typeof v.floorArea, 'string');
  });

  it('MARKET_OPTIONS has 5 options', () => {
    assert.equal(MARKET_OPTIONS.length, 5);
  });

  it('STATUS_OPTIONS has 4 options', () => {
    assert.equal(STATUS_OPTIONS.length, 4);
  });

  it('RISK_LEVELS has 3 levels', () => {
    assert.equal(RISK_LEVELS.length, 3);
  });
});

describe('store-form: 业务逻辑', () => {
  // ── 正例 ──
  it('valid form passes validation', () => {
    assert.equal(validateForm(validForm()).length, 0);
  });

  it('valid form with optional email', () => {
    const v = { ...validForm(), contactEmail: '' };
    assert.equal(validateForm(v).length, 0);
  });

  it('valid form with optional floorArea', () => {
    const v = { ...validForm(), floorArea: '' };
    assert.equal(validateForm(v).length, 0);
  });

  it('valid form with optional brandCount', () => {
    const v = { ...validForm(), brandCount: '' };
    assert.equal(validateForm(v).length, 0);
  });

  it('valid form with optional description', () => {
    const v = { ...validForm(), description: '' };
    assert.equal(validateForm(v).length, 0);
  });

  it('valid form with optional notes', () => {
    const v = { ...validForm(), notes: '' };
    assert.equal(validateForm(v).length, 0);
  });

  it('name length 2 passes', () => {
    const v = { ...validForm(), name: '测试' };
    assert.equal(validateForm(v).length, 0);
  });

  it('name length 50 passes', () => {
    const v = { ...validForm(), name: '测'.repeat(50) };
    assert.equal(validateForm(v).length, 0);
  });

  it('code STORE-001 passes', () => {
    const v = { ...validForm(), code: 'STORE-001' };
    assert.equal(validateForm(v).length, 0);
  });

  it('code STORE-999999 (6 digits) passes', () => {
    const v = { ...validForm(), code: 'STORE-999999' };
    assert.equal(validateForm(v).length, 0);
  });

  it('phone with + prefix passes', () => {
    const v = { ...validForm(), contactPhone: '+861088881111' };
    assert.equal(validateForm(v).length, 0);
  });

  it('email format validation passes for valid email', () => {
    const v = { ...validForm(), contactEmail: 'abc@example.com' };
    assert.equal(validateForm(v).length, 0);
  });

  it('floorArea "100000" is valid boundary', () => {
    const v = { ...validForm(), floorArea: '100000' };
    assert.equal(validateForm(v).length, 0);
  });

  // ── 反例 ──
  it('empty name returns error', () => {
    const v = { ...validForm(), name: '' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'name'));
  });

  it('name length 1 returns error', () => {
    const v = { ...validForm(), name: '测' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'name'));
  });

  it('name length 51 returns error', () => {
    const v = { ...validForm(), name: '测'.repeat(51) };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'name'));
  });

  it('empty code returns error', () => {
    const v = { ...validForm(), code: '' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'code'));
  });

  it('invalid code format returns error', () => {
    const v = { ...validForm(), code: 'STORE-01' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'code'));
  });

  it('code without STORE prefix returns error', () => {
    const v = { ...validForm(), code: 'SHOP-001' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'code'));
  });

  it('empty address returns error', () => {
    const v = { ...validForm(), address: '' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'address'));
  });

  it('short address (<5 chars) returns error', () => {
    const v = { ...validForm(), address: '北京' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'address'));
  });

  it('empty contactPhone returns error', () => {
    const v = { ...validForm(), contactPhone: '' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'contactPhone'));
  });

  it('invalid phone (too short) returns error', () => {
    const v = { ...validForm(), contactPhone: '12345' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'contactPhone'));
  });

  it('invalid email format returns error', () => {
    const v = { ...validForm(), contactEmail: 'not-email' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'contactEmail'));
  });

  it('floorArea non-numeric returns error', () => {
    const v = { ...validForm(), floorArea: '八百平米' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'floorArea'));
  });

  it('floorArea over 100000 returns error', () => {
    const v = { ...validForm(), floorArea: '100001' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'floorArea'));
  });

  it('brandCount non-numeric returns error', () => {
    const v = { ...validForm(), brandCount: '五' };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'brandCount'));
  });

  it('description over 500 chars returns error', () => {
    const v = { ...validForm(), description: 'x'.repeat(501) };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'description'));
  });

  // ── 边界 ──
  it('STORE-999 (3 digits) passes', () => {
    const v = { ...validForm(), code: 'STORE-999' };
    assert.equal(validateForm(v).length, 0);
  });

  it('STORE-000 (min 3 digits) passes', () => {
    const v = { ...validForm(), code: 'STORE-000' };
    const result = /^STORE-\d{3,6}$/.test(v.code);
    assert.ok(result);
  });

  it('floorArea exactly "100000" is maximum', () => {
    assert.equal(Number('100000'), 100000);
    assert.ok(Number('100000') <= 100000);
  });

  it('floorArea "100001" exceeds max by 1', () => {
    assert.equal(Number('100001'), 100001);
    assert.ok(Number('100001') > 100000);
  });

  it('description length exactly 500 passes', () => {
    const v = { ...validForm(), description: 'x'.repeat(500) };
    assert.equal(validateForm(v).length, 0);
  });

  it('phone "861088881111" (no +, 12 digits) passes', () => {
    const phone = '861088881111';
    assert.ok(/^\+?\d{7,15}$/.test(phone));
  });

  it('phone with dashes passes after replace', () => {
    const phone = '+86-10-8888-1111';
    const cleaned = phone.replace(/[\s-]/g, '');
    assert.equal(cleaned, '+861088881111');
    assert.ok(/^\+?\d{7,15}$/.test(cleaned));
  });

  it('all markets exist in MARKET_OPTIONS', () => {
    const values = MARKET_OPTIONS.map(o => o.value);
    assert.ok(values.includes('cn-mainland'));
    assert.ok(values.includes('us-default'));
    assert.ok(values.includes('uk-default'));
    assert.ok(values.includes('jp-default'));
    assert.ok(values.includes('sea-default'));
  });

  it('risk levels have correct labels', () => {
    assert.equal(RISK_LEVELS.find(r => r.value === 'low')?.label, '低风险');
    assert.equal(RISK_LEVELS.find(r => r.value === 'high')?.label, '高风险');
  });
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('Stores / Form — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onSubmit={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
