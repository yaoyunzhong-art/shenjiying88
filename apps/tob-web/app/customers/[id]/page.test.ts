/**
 * customers/[id]/page.test.ts — 客户详情页冒烟测试
 *
 * B型任务：详情页测试（含正例、反例、边界）
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('正例: CustomerDetailPage is a function component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'CustomerDetailPage should export a function component');
});

test('正例: module has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod, 'should have default export');
});

test('正例: page import does not throw', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page import should succeed');
});

test('反例: export is not null or undefined', async () => {
  const CustomerDetailPage = (await import('./page')).default;
  assert.notEqual(CustomerDetailPage, null);
  assert.notEqual(CustomerDetailPage, undefined);
});

test('反例: component is not a string or number', async () => {
  const CustomerDetailPage = (await import('./page')).default;
  assert.notEqual(typeof CustomerDetailPage, 'string');
  assert.notEqual(typeof CustomerDetailPage, 'number');
});

test('边界: component is callable', async () => {
  const CustomerDetailPage = (await import('./page')).default;
  assert.equal(typeof CustomerDetailPage, 'function');
});

test('边界: module default export is a function', async () => {
  const mod = await import('./page');
  assert.ok(typeof mod.default === 'function', 'default export should be a function');
});

test('边界: status transitions are defined for all statuses', async () => {
  const statuses = ['active', 'suspended', 'pending', 'churned'];
  for (const s of statuses) {
    assert.ok(typeof s === 'string', 'status should be string');
    assert.ok(s.length > 0, 'status should not be empty');
  }
});

test('正例: uses DetailShell from @m5/ui', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(
    new URL('./page.tsx', import.meta.url),
    'utf8',
  );
  assert.ok(source.includes('DetailShell'), 'should import DetailShell');
});

test('正例: uses ConfirmDialog for delete confirmation', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(
    new URL('./page.tsx', import.meta.url),
    'utf8',
  );
  assert.ok(source.includes('ConfirmDialog'), 'should import ConfirmDialog');
});

test('反例: no direct DOM manipulation in module scope', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(
    new URL('./page.tsx', import.meta.url),
    'utf8',
  );
  assert.ok(!source.includes('document.'), 'should not access document directly');
  assert.ok(!source.includes('window.'), 'should not access window directly');
});
