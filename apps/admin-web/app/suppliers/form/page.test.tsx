/**
 * supplier-form-page.test.tsx — Page-level tests for supplier creation form page.
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

function stripKeyframes(text: string): string {
  // Remove @keyframes m5-spin { ... } injected by SubmitButton
  return text.replace(/@keyframes[\s\S]*/g, '').trim();
}

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

function getSubmitBtn(): HTMLButtonElement | null {
  const btns = document.querySelectorAll('button[type="submit"]');
  for (const btn of btns) {
    const clean = stripKeyframes(btn.textContent ?? '');
    if (clean.includes('提交')) return btn as HTMLButtonElement;
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

function fillAndSubmit(overrides: Record<string, string>) {
  const defaults: Record<string, string> = {
    name: '测试供应商有限公司',
    code: 'SUP-TEST-001',
    contactPerson: '张三',
    contactPhone: '13800138000',
    email: 'test@example.com',
    address: '北京市朝阳区测试路100号',
  };
  const merged = { ...defaults, ...overrides };

  const fields: Record<string, string> = {
    name: '供应商名称',
    code: '供应商编码',
    contactPerson: '联系人',
    contactPhone: '联系电话',
    email: '邮箱',
  };

  for (const [key, label] of Object.entries(fields)) {
    const inp = getInputByLabel(label as string);
    if (inp) {
      fireEvent.change(inp, { target: { value: merged[key] } });
    }
  }

  const addrInput = document.querySelector('textarea');
  if (addrInput) {
    fireEvent.change(addrInput, { target: { value: merged.address } });
  }

  // Use fireEvent from @testing-library/react for proper React event handling
  const form = document.querySelector('form');
  if (form) {
    fireEvent.submit(form);
  }
}

// ---- Tests ----

describe('SupplierFormPage — 表单渲染', () => {
  it('应渲染页面标题"创建供应商"', async () => {
    const mod = await import('./page');
    const { container } = render(<mod.default />);
    assert.ok(container.textContent?.includes('创建供应商'));
  });

  it('应包含基本信息区域', async () => {
    const mod = await import('./page');
    const { container } = render(<mod.default />);
    assert.ok(container.textContent?.includes('基本信息'));
  });

  it('应包含联系信息区域', async () => {
    const mod = await import('./page');
    const { container } = render(<mod.default />);
    assert.ok(container.textContent?.includes('联系信息'));
  });

  it('应渲染"提交审核"按钮', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    const btn = getSubmitBtn();
    assert.ok(btn, 'Submit button not found');
    const cleanText = stripKeyframes(btn!.textContent ?? '');
    assert.equal(cleanText, '提交审核');
  });

  it('应渲染"取消"按钮', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    const btns = document.querySelectorAll('button');
    const cancel = Array.from(btns).find((b) => {
      const raw = b.textContent ?? '';
      return stripKeyframes(raw) === '取消';
    });
    assert.ok(cancel, 'Cancel button not found');
  });
});

describe('SupplierFormPage — 字段渲染', () => {
  it('品类选择器应包含6个选项', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    const select = document.querySelector('select');
    assert.ok(select, 'Select element not found');
    assert.equal(select!.querySelectorAll('option').length, 6);
  });

  it('应渲染地址 textarea', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    const ta = document.querySelector('textarea');
    assert.ok(ta, 'Textarea not found');
  });
});

describe('SupplierFormPage — 表单验证（反例）', () => {
  it('空提交应显示必填字段错误', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ name: '', code: '', contactPerson: '', contactPhone: '', email: '', address: '' });
    const fieldsWithErrors = ['name', 'code', 'contactPerson', 'contactPhone', 'email', 'address']
      .filter(f => !!getError(f));
    assert.ok(fieldsWithErrors.length >= 4,
      `Expected >= 4 fields with errors, got ${fieldsWithErrors.length}: ${fieldsWithErrors.join(', ')}`);
  });

  it('名称过短应报错（< 2字符）', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ name: 'A' });
    const err = getError('name');
    assert.ok(err?.includes('至少2个字符'), `Expected '至少2个字符' in error, got: ${err}`);
  });

  it('名称过长应报错（> 50字符）', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ name: 'A'.repeat(51) });
    const err = getError('name');
    assert.ok(err?.includes('不能超过50个字符'), `Expected '不能超过50个字符' in error, got: ${err}`);
  });

  it('无效手机号应提示', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ contactPhone: '123' });
    const err = getError('contactPhone');
    assert.ok(err, `Expected error for contactPhone, got: ${err}`);
  });

  it('无效邮箱格式应提示', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ email: 'not-email' });
    const err = getError('email');
    assert.ok(err?.includes('邮箱格式不正确'), `Expected '邮箱格式不正确' in error, got: ${err}`);
  });

  it('编码格式不正确应提示', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ code: '中文###！' });
    const err = getError('code');
    assert.ok(err, `Expected error for code, got: ${err}`);
  });

  it('地址过短应提示（< 5字符）', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({ address: '短址' });
    const err = getError('address');
    assert.ok(err?.includes('至少5个字符'), `Expected '至少5个字符' in error, got: ${err}`);
  });
});

describe('SupplierFormPage — 表单验证（正例）', () => {
  it('有效输入应通过验证（无错误提示）', async () => {
    const mod = await import('./page');
    render(<mod.default />);
    fillAndSubmit({});
    const fieldsWithErrors = ['name', 'code', 'contactPerson', 'contactPhone', 'email', 'address']
      .filter(f => !!getError(f));
    assert.equal(fieldsWithErrors.length, 0,
      `Expected 0 fields with errors, got ${fieldsWithErrors.length}: ${fieldsWithErrors.join(', ')}`);
  });
});
