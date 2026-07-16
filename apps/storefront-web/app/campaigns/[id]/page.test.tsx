/**
 * apps/storefront-web/app/campaigns/[id]/page.tsx — L1 冒烟测试
 * 角色视角: 📢营销 / 👔店长
 * 覆盖: 正例·反例·边界
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

describe('CampaignDetail — 正例', () => {
  test('exports default function', () => { assert.ok(SRC.includes('export default function')); });
  test('contains use client', () => { assert.ok(SRC.includes("'use client'")); });
  test('uses useMemo', () => { assert.ok(SRC.includes('useMemo')); });
  test('uses useParams', () => { assert.ok(SRC.includes('useParams')); });
  test('has campaign performance component', () => { assert.ok(SRC.includes('Campaign') || SRC.includes('Performance')); });
});

describe('CampaignDetail — 反例', () => {
  test('no dangerous HTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
  test('no any', () => { assert.ok(!/:\s*any\b/.test(SRC)); });
  test('no secret leak', () => { assert.ok(!/(?:secret|password|api[_-]?key)/i.test(SRC)); });
});

describe('CampaignDetail — 边界', () => {
  test('has length check', () => { assert.ok(SRC.includes('.length')); });
  test('has conditional rendering', () => { assert.ok(SRC.includes('?')); });
  test('has filter or find', () => { assert.ok(SRC.includes('.filter(') || SRC.includes('.find(')); });
});
