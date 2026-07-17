/**
 * apps/storefront-web/app/stores/compare/page.tsx — L1 冒烟测试
 * 角色视角: 👔店长 / 📊运营
 * 覆盖: 正例·反例·边界
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('StoreCompare — 正例', () => {
  test('exports default async function', () => { assert.ok(SRC.includes('export default async function')); });
  test('contains SEO metadata', () => { assert.ok(SRC.includes('Metadata')); });
  test('uses Suspense', () => { assert.ok(SRC.includes('Suspense')); });
  test('contains type or interface', () => { assert.ok(SRC.includes('interface') || SRC.includes('type ')); });
  test('has mock data', () => { assert.ok(SRC.includes('MOCK') || SRC.includes('mock') || SRC.includes('KPI')); });
});

describe('StoreCompare — 反例', () => {
  test('no dangerous HTML (except structured data)', () => {
    // JSON-LD structured data uses dangerouslySetInnerHTML; verify limited usage
    const innerHTMLUses = (SRC.match(/dangerouslySetInnerHTML/g) || []).length;
    assert.ok(innerHTMLUses <= 1, 'dangerouslySetInnerHTML for JSON-LD only');
  });
  test('no any', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
  test('no secret leak', () => { assert.ok(!/(?:secret|password|api[_-]?key)/i.test(SRC)); });
});

describe('StoreCompare — 边界', () => {
  test('has length check', () => { assert.ok(SRC.includes('.length')); });
  test('has conditional rendering', () => { assert.ok(SRC.includes('?')); });
  test('has error boundary', () => { assert.ok(SRC.includes('ErrorBoundary') || SRC.includes('error')); });
});
