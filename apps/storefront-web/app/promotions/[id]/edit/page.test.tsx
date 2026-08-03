/*!
 * promotions/[id]/edit/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for PromotionEditPage
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

describe('PromotionEditPage - 正例', () => {
  it('exports default PromotionEditPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function PromotionEditPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useParams', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), 'missing useParams');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
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
  it('has MOCK_PROMOTIONS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PROMOTIONS'), 'missing MOCK_PROMOTIONS');
  });
  it('has MOCK_PROMOTIONS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PROMOTIONS'), 'missing MOCK_PROMOTIONS');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines Promotion interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface Promotion') || src.includes('type Promotion'), 'missing Promotion');
  });
  it('has backUrl', () => {
    const src = readSource();
    assert.ok(src.includes('backUrl'), 'missing backUrl');
  });
  it('has onSuccess callback', () => {
    const src = readSource();
    assert.ok(src.includes('onSuccess'), 'missing onSuccess');
  });
  it('has submitLabel', () => {
    const src = readSource();
    assert.ok(src.includes('submitLabel'), 'missing submitLabel');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('PromotionEditPage - 反例', () => {
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

describe('PromotionEditPage - 边界', () => {
});

describe('PromotionEditPage - 数据完整性', () => {
  it('includes context "买一送一活动..."', () => {
    const src = readSource();
    assert.ok(src.includes('买一送一活动'), 'missing 买一送一活动');
  });
  it('includes context "优惠券..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券'), 'missing 优惠券');
  });
  it('includes context "优惠可被使用的最大次数..."', () => {
    const src = readSource();
    assert.ok(src.includes('优惠可被使用的最大次数'), 'missing 优惠可被使用的最大次数');
  });
  it('includes context "会员专属折扣..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员专属折扣'), 'missing 会员专属折扣');
  });
  it('includes context "使用上限..."', () => {
    const src = readSource();
    assert.ok(src.includes('使用上限'), 'missing 使用上限');
  });
  it('includes context "例如 500..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如 500'), 'missing 例如 500');
  });
  it('includes context "例如 50000..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如 50000'), 'missing 例如 50000');
  });
  it('includes context "促销活动名称..."', () => {
    const src = readSource();
    assert.ok(src.includes('促销活动名称'), 'missing 促销活动名称');
  });
  it('includes context "保存修改..."', () => {
    const src = readSource();
    assert.ok(src.includes('保存修改'), 'missing 保存修改');
  });
  it('includes context "全场商品8折起，覆盖夏季..."', () => {
    const src = readSource();
    assert.ok(src.includes('全场商品8折起，覆盖夏季新品和经典热销款。'), 'missing 全场商品8折起，覆盖夏季');
  });
  it('has constant runtimeStore', () => {
    const src = readSource();
    assert.ok(src.includes('runtimeStore'), 'missing runtimeStore');
  });
  it('has constant original', () => {
    const src = readSource();
    assert.ok(src.includes('original'), 'missing original');
  });
  it('has constant existing', () => {
    const src = readSource();
    assert.ok(src.includes('existing'), 'missing existing');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
});