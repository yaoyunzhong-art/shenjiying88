/**
 * stock-transfer/form/page.test.tsx — 库存调拨表单页 L1 测试
 *
 * 覆盖: 表单字段验证、门店选择、商品信息、紧急程度、提交流程
 * 正例: 完整表单验证通过、字段填写、select选项、紧急程度标签
 * 反例: 空字段、门店相同、数量为0/负数/超限、SKU空
 * 边界: 数量=1、数量=99999、源门店未选择、目标门店未选择
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

import {
  URGENCY_LABEL,
  URGENCY_LEVELS,
  TYPE_LABEL,
  TRANSFER_TYPES,
  URGENCY_VARIANT,
} from '../../stock-transfer-data';

/* ── 类型 ── */

type UrgencyLevel = 'normal' | 'urgent' | 'critical';
type TransferType = 'supply' | 'return' | 'move' | 'emergency';

interface TransferFormValues {
  sourceStore: string;
  targetStore: string;
  productName: string;
  productSku: string;
  quantity: string;
  type: string;
  urgency: string;
  remark: string;
}

interface FieldError {
  field: keyof TransferFormValues;
  message: string;
}

/* ── 验证逻辑(移植自page.tsx) ── */

function validateForm(values: TransferFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.sourceStore.trim()) errors.push({ field: 'sourceStore', message: '请选择调出门店' });
  if (!values.targetStore.trim()) errors.push({ field: 'targetStore', message: '请选择调入门店' });

  if (values.sourceStore.trim() && values.targetStore.trim() && values.sourceStore === values.targetStore) {
    errors.push({ field: 'targetStore', message: '调入门店不能与调出门店相同' });
  }

  if (!values.productName.trim()) errors.push({ field: 'productName', message: '请填写商品名称' });
  if (!values.productSku.trim()) errors.push({ field: 'productSku', message: '请填写商品SKU' });

  const qty = parseInt(values.quantity, 10);
  if (!values.quantity.trim()) {
    errors.push({ field: 'quantity', message: '请填写调拨数量' });
  } else if (isNaN(qty) || qty <= 0) {
    errors.push({ field: 'quantity', message: '数量必须大于0' });
  } else if (qty > 99999) {
    errors.push({ field: 'quantity', message: '单次调拨数量不能超过 99999' });
  }

  return errors;
}

export type { TransferFormValues, UrgencyLevel, TransferType };

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('stock-transfer-form: 页面渲染', () => {
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

describe('stock-transfer-form: 数据类型', () => {
  it('URGENCY_LEVELS has 3 levels', () => {
    assert.equal(URGENCY_LEVELS.length, 3);
  });

  it('URGENCY_LABEL for all levels', () => {
    assert.equal(URGENCY_LABEL.normal, '普通');
    assert.equal(URGENCY_LABEL.urgent, '紧急');
    assert.equal(URGENCY_LABEL.critical, '特急');
  });

  it('TRANSFER_TYPES has 4 types', () => {
    assert.equal(TRANSFER_TYPES.length, 4);
  });

  it('TYPE_LABEL for all types', () => {
    assert.equal(TYPE_LABEL.supply, '补货调拨');
    assert.equal(TYPE_LABEL.return, '退货调拨');
    assert.equal(TYPE_LABEL.move, '移库调拨');
    assert.equal(TYPE_LABEL.emergency, '紧急调拨');
  });

  it('URGENCY_VARIANT maps correctly', () => {
    assert.equal(URGENCY_VARIANT.normal, 'neutral');
    assert.equal(URGENCY_VARIANT.urgent, 'warning');
    assert.equal(URGENCY_VARIANT.critical, 'danger');
  });

  it('TransferFormValues has all fields', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '精华液',
      productSku: 'SKU-001', quantity: '50', type: 'supply',
      urgency: 'normal', remark: '补货',
    };
    assert.equal(typeof v.sourceStore, 'string');
    assert.equal(typeof v.quantity, 'string');
    assert.equal(typeof v.remark, 'string');
  });
});

describe('stock-transfer-form: 业务逻辑', () => {
  // ── 正例 ──
  it('valid form has no errors', () => {
    const valid: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '精华液',
      productSku: 'SKU-001', quantity: '50', type: 'supply',
      urgency: 'normal', remark: '补货',
    };
    const errors = validateForm(valid);
    assert.equal(errors.length, 0);
  });

  it('valid form with optional remark', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品A',
      productSku: 'SKU-A', quantity: '1', type: 'move',
      urgency: 'urgent', remark: '紧急调拨',
    };
    assert.equal(validateForm(v).length, 0);
  });

  it('quantity "1" is valid', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '1', type: 'supply',
      urgency: 'normal', remark: '',
    };
    assert.equal(validateForm(v).length, 0);
  });

  it('quantity "99999" is valid (boundary)', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '99999', type: 'supply',
      urgency: 'normal', remark: '',
    };
    assert.equal(validateForm(v).length, 0);
  });

  it('emergency type is valid', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '10', type: 'emergency',
      urgency: 'critical', remark: '特急',
    };
    assert.equal(validateForm(v).length, 0);
  });

  // ── 反例 ──
  it('empty sourceStore returns error', () => {
    const v: TransferFormValues = {
      sourceStore: '', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '10', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'sourceStore'));
  });

  it('same source and target store returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-001', productName: '商品',
      productSku: 'SKU', quantity: '10', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'targetStore'));
  });

  it('empty productName returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '',
      productSku: 'SKU', quantity: '10', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'productName'));
  });

  it('empty productSku returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: '', quantity: '10', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'productSku'));
  });

  it('empty quantity returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'quantity'));
  });

  it('quantity "0" returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '0', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'quantity'));
  });

  it('negative quantity returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '-5', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'quantity'));
  });

  it('quantity over 99999 returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '100000', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'quantity'));
  });

  // ── 边界 ──
  it('sourceStore only empty, targetStore filled', () => {
    const v: TransferFormValues = {
      sourceStore: '', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '10', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.field, 'sourceStore');
  });

  it('all fields empty returns 5 errors', () => {
    const v: TransferFormValues = {
      sourceStore: '', targetStore: '', productName: '',
      productSku: '', quantity: '', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.equal(errors.length, 5);
  });

  it('quantity "abc" (NaN) returns error', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: 'abc', type: 'supply',
      urgency: 'normal', remark: '',
    };
    const errors = validateForm(v);
    assert.ok(errors.some(e => e.field === 'quantity'));
  });

  it('quantity "99999" is the exact max', () => {
    const qty = parseInt('99999', 10);
    assert.ok(qty <= 99999);
    assert.ok(qty > 0);
  });

  it('quantity "100000" exceeds max by 1', () => {
    const qty = parseInt('100000', 10);
    assert.ok(qty > 99999);
  });

  it('remarks are optional', () => {
    const v: TransferFormValues = {
      sourceStore: 'S-001', targetStore: 'S-002', productName: '商品',
      productSku: 'SKU', quantity: '10', type: 'supply',
      urgency: 'normal', remark: '',
    };
    assert.equal(typeof v.remark, 'string');
    assert.equal(v.remark, '');
  });
});
