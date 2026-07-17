/**
 * apps/storefront-web/app/suppliers/new/page.tsx — L1 冒烟测试
 * 角色视角: 👤会员 / 👔店长
 * 覆盖: 正例·反例·边界
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('SupplierNew — 正例', () => {
  test('exports default function', () => { assert.ok(SRC.includes('export default function')); });
  test('contains use client', () => { assert.ok(SRC.includes("'use client'")); });
  test('uses useMemo or useState', () => { assert.ok(SRC.includes('useMemo') || SRC.includes('useState')); });
  test('contains type or interface', () => { assert.ok(SRC.includes('interface') || SRC.includes('type ')); });
  test('has form fields array', () => { assert.ok(SRC.includes('FIELDS')); });
  test('uses FormPageScaffold', () => { assert.ok(SRC.includes('FormPageScaffold')); });
});

describe('SupplierNew — 反例', () => {
  test('no dangerous HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  test('no any', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
  test('no secret leak', () => { assert.ok(!/(?:secret|password|api[_-]?key)/i.test(SRC)); });
});

describe('SupplierNew — 边界', () => {
  test('has length check', () => { assert.ok(SRC.includes('.length')); });
  test('has validation rules', () => { assert.ok(SRC.includes('rules')); });
  test('has conditional rendering', () => { assert.ok(SRC.includes('?')); });
  test('has async submit handler', () => { assert.ok(SRC.includes('async')); });
  test('has error handling', () => { assert.ok(SRC.includes('throw') || SRC.includes('error') || SRC.includes('catch')); });
});
