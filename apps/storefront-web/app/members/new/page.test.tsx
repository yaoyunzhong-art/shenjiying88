/**
 * apps/storefront-web/app/members/new/page.tsx — L1 冒烟测试
 * 角色视角: 👔店长 / 🛒前台
 * 覆盖: 正例·反例·边界
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('MemberNew — 正例', () => {
  test('exports default function', () => { assert.ok(SRC.includes('export default function')); });
  test('contains use client', () => { assert.ok(SRC.includes("'use client'")); });
  test('uses useState', () => { assert.ok(SRC.includes('useState')); });
  test('uses useRouter', () => { assert.ok(SRC.includes('useRouter')); });
  test('contains type or interface', () => { assert.ok(SRC.includes('interface') || SRC.includes('type ')); });
});

describe('MemberNew — 反例', () => {
  test('no dangerous HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  test('no any', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
  test('no secret leak', () => { assert.ok(!/(?:secret|password|api[_-]?key)/i.test(SRC)); });
});

describe('MemberNew — 边界', () => {
  test('has length check', () => { assert.ok(SRC.includes('.length')); });
  test('has conditional rendering', () => { assert.ok(SRC.includes('?')); });
  test('has form submit', () => { assert.ok(SRC.includes('SubmitButton') || SRC.includes('onSubmit') || SRC.includes('submit')); });
});
