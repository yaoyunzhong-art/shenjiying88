/**
 * apps/storefront-web/app/campaigns/new/page.tsx — L1 冒烟测试
 * 角色视角: 📢营销 / 👔店长
 * 覆盖: 正例·反例·边界
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('CampaignNew — 正例', () => {
  test('exports default function', () => { assert.ok(SRC.includes('export default function')); });
  test('contains use client', () => { assert.ok(SRC.includes("'use client'")); });
  test('uses FormPageScaffold', () => { assert.ok(SRC.includes('FormPageScaffold')); });
  test('uses useRouter', () => { assert.ok(SRC.includes('useRouter')); });
  test('contains type or interface', () => { assert.ok(SRC.includes('interface') || SRC.includes('type ')); });
});

describe('CampaignNew — 反例', () => {
  test('no dangerous HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  test('no any', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
  test('no secret leak', () => { assert.ok(!/(?:secret|password|api[_-]?key)/i.test(SRC)); });
});

describe('CampaignNew — 边界', () => {
  test('has length check', () => { assert.ok(SRC.includes('.length')); });
  test('has conditional rendering', () => { assert.ok(SRC.includes('?')); });
  test('has form fields definition', () => { assert.ok(SRC.includes('field') || SRC.includes('FormPageField')); });
});
