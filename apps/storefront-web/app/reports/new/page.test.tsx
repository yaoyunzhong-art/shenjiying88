/*!
 * reports/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for ReportsNewFormPage
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

describe('ReportsNewFormPage - 正例', () => {
  it('exports default ReportsNewFormPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ReportsNewFormPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('defines ReportFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface ReportFormData') || src.includes('type ReportFormData'), 'missing ReportFormData');
  });
  it('defines FormErrors interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormErrors') || src.includes('type FormErrors'), 'missing FormErrors');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('ReportsNewFormPage - 反例', () => {
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

describe('ReportsNewFormPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('ReportsNewFormPage - 数据完整性', () => {
  it('includes context "⏳ 生成中......"', () => {
    const src = readSource();
    assert.ok(src.includes('⏳ 生成中...'), 'missing ⏳ 生成中...');
  });
  it('includes context "会员增长..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员增长'), 'missing 会员增长');
  });
  it('includes context "例：2026年7月销售月..."', () => {
    const src = readSource();
    assert.ok(src.includes('例：2026年7月销售月报'), 'missing 例：2026年7月销售月');
  });
  it('includes context "创建失败，请重试..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建失败，请重试'), 'missing 创建失败，请重试');
  });
  it('includes context "可选：填写报表用途、特殊..."', () => {
    const src = readSource();
    assert.ok(src.includes('可选：填写报表用途、特殊说明等...'), 'missing 可选：填写报表用途、特殊');
  });
  it('includes context "周报..."', () => {
    const src = readSource();
    assert.ok(src.includes('周报'), 'missing 周报');
  });
  it('includes context "周期描述不能超过50个字..."', () => {
    const src = readSource();
    assert.ok(src.includes('周期描述不能超过50个字符'), 'missing 周期描述不能超过50个字');
  });
  it('includes context "品类分布..."', () => {
    const src = readSource();
    assert.ok(src.includes('品类分布'), 'missing 品类分布');
  });
  it('includes context "季报..."', () => {
    const src = readSource();
    assert.ok(src.includes('季报'), 'missing 季报');
  });
  it('includes context "客单价..."', () => {
    const src = readSource();
    assert.ok(src.includes('客单价'), 'missing 客单价');
  });
  it('has constant REPORT_TYPE_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('REPORT_TYPE_OPTIONS'), 'missing REPORT_TYPE_OPTIONS');
  });
  it('has constant METRIC_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('METRIC_OPTIONS'), 'missing METRIC_OPTIONS');
  });
  it('has constant title', () => {
    const src = readSource();
    assert.ok(src.includes('title'), 'missing title');
  });
  it('has constant period', () => {
    const src = readSource();
    assert.ok(src.includes('period'), 'missing period');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
});