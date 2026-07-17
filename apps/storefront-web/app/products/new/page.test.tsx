/*!
 * products/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewProductPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('NewProductPage - 正例', () => {
  it('exports default NewProductPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewProductPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('imports FormPageField', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageField'), 'missing FormPageField');
  });
  it('imports FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('imports FormPageSubmitResult', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageSubmitResult'), 'missing FormPageSubmitResult');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines NewProductFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface NewProductFormData') || src.includes('type NewProductFormData'), 'missing NewProductFormData');
  });
  it('has FIELDS array', () => {
    const src = readSource();
    assert.ok(src.includes('FIELDS'), 'missing FIELDS');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('NewProductPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('NewProductPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewProductPage - 数据完整性', () => {
  it('includes context "仅内部可见，用于利润分析..."', () => {
    const src = readSource();
    assert.ok(src.includes('仅内部可见，用于利润分析'), 'missing 仅内部可见，用于利润分析');
  });
  it('includes context "作品/产品名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('作品/产品名称'), 'missing 作品/产品名称');
  });
  it('includes context "例如：每周六下午2点开课..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：每周六下午2点开课'), 'missing 例如：每周六下午2点开课');
  });
  it('includes context "例如：花艺体验课 - 春..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：花艺体验课 - 春日花篮'), 'missing 例如：花艺体验课 - 春');
  });
  it('includes context "例如：花艺旗舰店（北京朝..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：花艺旗舰店（北京朝阳）'), 'missing 例如：花艺旗舰店（北京朝');
  });
  it('includes context "名称不超过60个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('名称不超过60个字符'), 'missing 名称不超过60个字符');
  });
  it('includes context "名称至少2个字符..."', () => {
    const src = readSource();
    assert.ok(src.includes('名称至少2个字符'), 'missing 名称至少2个字符');
  });
  it('includes context "品类..."', () => {
    const src = readSource();
    assert.ok(src.includes('品类'), 'missing 品类');
  });
  it('includes context "售价 (元)..."', () => {
    const src = readSource();
    assert.ok(src.includes('售价 (元)'), 'missing 售价 (元)');
  });
  it('includes context "售价不能为负数..."', () => {
    const src = readSource();
    assert.ok(src.includes('售价不能为负数'), 'missing 售价不能为负数');
  });
  it('has constant CATEGORY_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORY_OPTIONS'), 'missing CATEGORY_OPTIONS');
  });
  it('has constant n', () => {
    const src = readSource();
    assert.ok(src.includes('n'), 'missing n');
  });
  it('has constant n', () => {
    const src = readSource();
    assert.ok(src.includes('n'), 'missing n');
  });
  it('has constant n', () => {
    const src = readSource();
    assert.ok(src.includes('n'), 'missing n');
  });
  it('has constant handleSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('handleSubmit'), 'missing handleSubmit');
  });
});