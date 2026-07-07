import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
const { BulkEditPanel } = require('./BulkEditPanel');
import type { BulkEditEntry, BulkEditField } from './BulkEditPanel';

/**
 * Helper: render component to static HTML string for assertion
 */
function renderHTML(props: Record<string, unknown> = {}): string {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(BulkEditPanel, props as any),
  );
}

// --------------- Test Data ---------------
const defaultEntries: BulkEditEntry[] = [
  { id: '1', title: 'SKU-001 保湿面霜', subtitle: '库存: 120', values: { name: '保湿面霜', price: 199 } },
  { id: '2', title: 'SKU-002 精华液', subtitle: '库存: 85', values: { name: '精华液', price: 299 } },
  { id: '3', title: 'SKU-003 洁面乳', subtitle: '库存: 200', values: { name: '洁面乳', price: 89 } },
];

const defaultFields: BulkEditField[] = [
  { key: 'price', label: '价格', type: 'number', placeholder: '输入新价格' },
  { key: 'status', label: '状态', type: 'select', options: [
    { label: '上架', value: 'active' },
    { label: '下架', value: 'inactive' },
    { label: '待审核', value: 'pending' },
  ]},
  { key: 'discount', label: '启用折扣', type: 'toggle' },
  { key: 'remark', label: '备注', type: 'text', placeholder: '添加备注...' },
];

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    entries: defaultEntries,
    fields: defaultFields,
    editingValues: {},
    onFieldChange: () => {},
    onApply: () => {},
    onCancel: () => {},
    ...overrides,
  };
}

// ============== TESTS ==============

test('BulkEditPanel: renders panel with data-testid and aria-label', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('data-testid="bulk-edit-panel"'));
  assert.ok(html.includes('aria-label="批量编辑面板"'));
  assert.ok(html.includes('role="dialog"'));
});

test('BulkEditPanel: header shows batch edit title and count summary', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('批量编辑'));
  assert.ok(html.includes('已选 3 条记录'));
  assert.ok(html.includes('已设置 0/4 个字段'));
});

test('BulkEditPanel: renders all 4 form field labels', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('>价格<'));
  assert.ok(html.includes('>状态<'));
  assert.ok(html.includes('>启用折扣<'));
  assert.ok(html.includes('>备注<'));
});

test('BulkEditPanel: renders preview section with all entry titles', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('受影响记录预览'));
  assert.ok(html.includes('SKU-001 保湿面霜'));
  assert.ok(html.includes('SKU-002 精华液'));
  assert.ok(html.includes('SKU-003 洁面乳'));
});

test('BulkEditPanel: shows updated field count when values provided', () => {
  const html = renderHTML(defaultProps({
    editingValues: { price: 199, status: 'active' },
  }));
  assert.ok(html.includes('已设置 2/4 个字段'));
});

test('BulkEditPanel: toggle field renders role=switch with off state', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('role="switch"'));
  assert.ok(html.includes('aria-checked="false"'));
  assert.ok(html.includes('>否<'));
});

test('BulkEditPanel: toggle field shows on state with aria-checked true', () => {
  const html = renderHTML(defaultProps({
    editingValues: { discount: true },
  }));
  assert.ok(html.includes('aria-checked="true"'));
  assert.ok(html.includes('>是<'));
});

test('BulkEditPanel: select field has placeholder option and options', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('— 保持不变 —'));
  assert.ok(html.includes('value="active"'));
  assert.ok(html.includes('value="inactive"'));
  assert.ok(html.includes('value="pending"'));
  assert.ok(html.includes('>上架<'));
  assert.ok(html.includes('>下架<'));
  assert.ok(html.includes('>待审核<'));
});

test('BulkEditPanel: text and number fields have placeholders', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('placeholder="输入新价格"'));
  assert.ok(html.includes('placeholder="添加备注..."'));
});

test('BulkEditPanel: footer has cancel and apply buttons', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('data-testid="bulk-edit-cancel-btn"'));
  assert.ok(html.includes('data-testid="bulk-edit-apply"'));
  assert.ok(html.includes('>取消<'));
  assert.ok(html.includes('>批量更新<'));
});

test('BulkEditPanel: shows submitting state with 更新中 text', () => {
  const html = renderHTML(defaultProps({ isSubmitting: true }));
  assert.ok(html.includes('>更新中...<'));
  assert.ok(html.includes('disabled'));
});

test('BulkEditPanel: shows error message', () => {
  const html = renderHTML(defaultProps({ error: '网络错误，请重试' }));
  assert.ok(html.includes('网络错误，请重试'));
});

test('BulkEditPanel: all data-testid attributes are rendered', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('data-testid="bulk-field-price"'));
  assert.ok(html.includes('data-testid="bulk-field-status"'));
  assert.ok(html.includes('data-testid="bulk-field-discount"'));
  assert.ok(html.includes('data-testid="bulk-field-remark"'));
  assert.ok(html.includes('data-testid="bulk-edit-cancel"'));
  assert.ok(html.includes('data-testid="bulk-edit-cancel-btn"'));
  assert.ok(html.includes('data-testid="bulk-edit-apply"'));
});

test('BulkEditPanel: renders entry subtitles in preview', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('库存: 120'));
  assert.ok(html.includes('库存: 85'));
  assert.ok(html.includes('库存: 200'));
});

test('BulkEditPanel: renders gracefully with empty entries', () => {
  const html = renderHTML(defaultProps({ entries: [] }));
  assert.ok(html.includes('已选 0 条记录'));
  assert.ok(html.includes('受影响记录预览'));
});

test('BulkEditPanel: renders custom submit label', () => {
  const html = renderHTML(defaultProps({ submitLabel: '批量修改' }));
  assert.ok(html.includes('>批量修改<'));
});

test('BulkEditPanel: renders "✓ 已设置" for fields with values', () => {
  const html = renderHTML(defaultProps({
    editingValues: { price: 199, status: 'active' },
  }));
  assert.ok(html.includes('✓ 已设置'));
  assert.ok(html.includes('已设置 2/4 个字段'));
});

test('BulkEditPanel: toggle with discount:false shows no', () => {
  const html = renderHTML(defaultProps({
    editingValues: { discount: false },
  }));
  assert.ok(html.includes('aria-checked="false"'));
  assert.ok(html.includes('>否<'));
});

test('BulkEditPanel: price input renders with type=number and correct testid', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('type="number"'));
  assert.ok(html.includes('id="bulk-field-price"'));
});

test('BulkEditPanel: status select renders select element', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('<select'));
  assert.ok(html.includes('id="bulk-field-status"'));
});

test('BulkEditPanel: text field renders input type=text', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('type="text"'));
  assert.ok(html.includes('id="bulk-field-remark"'));
});

test('BulkEditPanel: cancel button with ✕ text in header', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('✕ 取消'));
});

test('BulkEditPanel: has correct h3 title', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('<h3'));
  assert.ok(html.includes('批量编辑'));
});

test('BulkEditPanel: panel has max-height style', () => {
  const html = renderHTML(defaultProps());
  assert.ok(html.includes('max-height:90vh'));
});
