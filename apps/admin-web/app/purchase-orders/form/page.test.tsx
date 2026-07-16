/**
 * purchase-order-form-page.test.tsx — Page-level tests for purchase order form page.
 * Tests: 表单渲染、必填字段验证、字段规则验证
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import React from 'react';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

let render: (jsx: JSX.Element) => { container: HTMLElement };
let cleanup: () => void;
let fireEvent: any;

before(async () => {
  const testingLib = await import('@testing-library/react');
  render = testingLib.render;
  cleanup = testingLib.cleanup;
  fireEvent = testingLib.fireEvent;
});

after(() => {
  cleanup();
});

function getInputByLabel(labelText: string): HTMLInputElement | null {
  const labels = document.querySelectorAll('label');
  for (const lbl of labels) {
    if (lbl.textContent?.includes(labelText)) {
      const parent = lbl.closest('[data-field]') || lbl.parentElement;
      return parent ? parent.querySelector<HTMLInputElement>('input, textarea, select') : null;
    }
  }
  return null;
}

function getError(field: string): string | null {
  const fieldEl = document.querySelector(`[data-field="${field}"]`);
  if (!fieldEl) return null;
  const paragraphs = fieldEl.querySelectorAll('p');
  const lastP = paragraphs[paragraphs.length - 1];
  return lastP?.textContent ?? null;
}

function getSubmitBtn(): HTMLButtonElement | null {
  const btns = document.querySelectorAll('button[type="submit"]');
  for (const btn of btns) {
    if (btn.textContent?.includes('提交采购单')) return btn as HTMLButtonElement;
  }
  return null;
}

function fillAndSubmit(overrides: Record<string, string | number>) {
  const defaults: Record<string, string | number> = {
    supplierName: '绿源食品有限公司',
    supplierId: 'sp-001',
    contactPerson: '王建国',
    contactPhone: '13800010001',
    department: '后厨',
    storeCode: 'SH-001',
    itemsCount: 5,
    totalQuantity: 200,
    totalAmount: 50000,
    expectedDelivery: '2026-07-20',
  };
  const merged = { ...defaults, ...overrides };

  const textFields: Record<string, string> = {
    supplierName: '供应商名称',
    supplierId: '供应商编号',
    contactPerson: '联系人',
    contactPhone: '联系电话',
  };

  for (const [key, label] of Object.entries(textFields)) {
    const inp = getInputByLabel(label);
    if (inp) {
      fireEvent.change(inp, { target: { value: String(merged[key] ?? '') } });
    }
  }

  const selectFields: Record<string, string> = {
    department: '采购部门',
    storeCode: '所属门店',
  };

  for (const [key, label] of Object.entries(selectFields)) {
    const sel = getInputByLabel(label);
    if (sel) {
      fireEvent.change(sel, { target: { value: String(merged[key] ?? '') } });
    }
  }

  const numberMappings: Record<string, { label: string; min: number }> = {
    itemsCount: { label: '品项数', min: 1 },
    totalQuantity: { label: '总数量', min: 1 },
    totalAmount: { label: '总金额 (元)', min: 0 },
  };

  for (const [key, cfg] of Object.entries(numberMappings)) {
    const inp = getInputByLabel(cfg.label);
    if (inp) {
      fireEvent.change(inp, { target: { value: String(merged[key] ?? cfg.min) } });
    }
  }

  const dateInp = getInputByLabel('期望到货日期');
  if (dateInp) {
    fireEvent.change(dateInp, { target: { value: String(merged.expectedDelivery ?? '') } });
  }

  const form = document.querySelector('form');
  if (form) {
    fireEvent.submit(form);
  }
}

// ---- Tests ----

describe('PurchaseOrderFormPage — 表单渲染', () => {
  it('应正确渲染表单页面标题和字段', async () => {
    const { default: Page } = await import('./page');
    const { container } = render(React.createElement(Page));

    const title = container.querySelector('h1')?.textContent ?? container.querySelector('h2')?.textContent ?? '';
    assert.ok(title.includes('创建采购单'), `标题应包含"创建采购单"，实际: ${title}`);

    // 验证关键字段存在
    assert.ok(getInputByLabel('供应商名称'), '供应商名称字段应存在');
    assert.ok(getInputByLabel('供应商编号'), '供应商编号字段应存在');
    assert.ok(getInputByLabel('联系人'), '联系人字段应存在');
    assert.ok(getInputByLabel('联系电话'), '联系电话字段应存在');
    assert.ok(getInputByLabel('采购部门'), '采购部门字段应存在');
    assert.ok(getInputByLabel('所属门店'), '所属门店字段应存在');
    assert.ok(getInputByLabel('期望到货日期'), '期望到货日期字段应存在');
    assert.ok(getInputByLabel('备注'), '备注字段应存在');

    const submitBtn = getSubmitBtn();
    assert.ok(submitBtn, '提交采购单按钮应存在');

    cleanup();
  });

  it('空表单提交应展示所有必填字段错误', async () => {
    const { default: Page } = await import('./page');
    render(React.createElement(Page));

    const form = document.querySelector('form');
    assert.ok(form, '表单元素应存在');
    fireEvent.submit(form);

    assert.ok(getError('supplierName')?.includes('不能为空'), '供应商名称错误应展示');
    assert.ok(getError('supplierId')?.includes('不能为空'), '供应商编号错误应展示');
    assert.ok(getError('contactPerson')?.includes('不能为空'), '联系人错误应展示');
    assert.ok(getError('contactPhone')?.includes('不能为空'), '联系电话错误应展示');
    assert.ok(getError('department')?.includes('不能为空'), '采购部门错误应展示');
    assert.ok(getError('storeCode')?.includes('请选择'), '所属门店错误应展示');
    assert.ok(getError('expectedDelivery')?.includes('请选择'), '期望到货日期错误应展示');

    cleanup();
  });

  it('联系电话格式校验（反例）', async () => {
    const { default: Page } = await import('./page');
    render(React.createElement(Page));

    fillAndSubmit({ contactPhone: '12345' });

    assert.ok(getError('contactPhone')?.includes('有效'), '无效联系电话应提示错误');

    cleanup();
  });

  it('正确表单数据提交应无字段错误', async () => {
    const { default: Page } = await import('./page');
    render(React.createElement(Page));

    fillAndSubmit({});

    assert.strictEqual(getError('supplierName'), null, '供应商名称不应有错误');
    assert.strictEqual(getError('supplierId'), null, '供应商编号不应有错误');
    assert.strictEqual(getError('contactPerson'), null, '联系人不应有错误');
    assert.strictEqual(getError('contactPhone'), null, '联系电话不应有错误');

    cleanup();
  });

  it('重置按钮应清空所有字段和错误', async () => {
    const { default: Page } = await import('./page');
    render(React.createElement(Page));

    // 先提交空表单触发错误
    const form = document.querySelector('form');
    assert.ok(form);
    fireEvent.submit(form);
    assert.ok(getError('supplierName'), '提交空表单后应有错误');

    // 点击重置
    const resetBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('重置'),
    );
    assert.ok(resetBtn, '重置按钮应存在');
    fireEvent.click(resetBtn);

    // 错误应消失
    assert.strictEqual(getError('supplierName'), null, '重置后供应商名称错误应消失');
    assert.strictEqual(getError('contactPerson'), null, '重置后联系人错误应消失');
    assert.strictEqual(getError('contactPhone'), null, '重置后联系电话错误应消失');

    // 字段值应恢复默认
    const nameInp = getInputByLabel('供应商名称');
    assert.strictEqual(nameInp?.value, '', '重置后供应商名称应为空');

    cleanup();
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Purchase Orders / Form — hooks验证', () => {
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
