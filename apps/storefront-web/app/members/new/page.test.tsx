/*!
 * members/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for MemberNewPage
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

describe('MemberNewPage - 正例', () => {
  it('exports default MemberNewPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MemberNewPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports FormField', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), 'missing FormField');
  });
  it('imports FormSubmitFeedback', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), 'missing FormSubmitFeedback');
  });
  it('imports Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('imports SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses Select', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), 'missing Select');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines FormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormData') || src.includes('type FormData'), 'missing FormData');
  });
  it('defines FormErrors interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormErrors') || src.includes('type FormErrors'), 'missing FormErrors');
  });
  it('has retry mechanism', () => {
    const src = readSource();
    assert.ok(src.includes('retry') || src.includes('Retry'), 'missing retry');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('MemberNewPage - 反例', () => {
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

describe('MemberNewPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('MemberNewPage - 数据完整性', () => {
  it('includes context "11位手机号码..."', () => {
    const src = readSource();
    assert.ok(src.includes('11位手机号码'), 'missing 11位手机号码');
  });
  it('includes context "会员创建成功..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员创建成功'), 'missing 会员创建成功');
  });
  it('includes context "会员姓名..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员姓名'), 'missing 会员姓名');
  });
  it('includes context "会员等级..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员等级'), 'missing 会员等级');
  });
  it('includes context "初始积分..."', () => {
    const src = readSource();
    assert.ok(src.includes('初始积分'), 'missing 初始积分');
  });
  it('includes context "取消..."', () => {
    const src = readSource();
    assert.ok(src.includes('取消'), 'missing 取消');
  });
  it('includes context "可选备注信息..."', () => {
    const src = readSource();
    assert.ok(src.includes('可选备注信息'), 'missing 可选备注信息');
  });
  it('includes context "可选，默认为0..."', () => {
    const src = readSource();
    assert.ok(src.includes('可选，默认为0'), 'missing 可选，默认为0');
  });
  it('includes context "备注..."', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), 'missing 备注');
  });
  it('includes context "姓名不能为空..."', () => {
    const src = readSource();
    assert.ok(src.includes('姓名不能为空'), 'missing 姓名不能为空');
  });
  it('has constant pts', () => {
    const src = readSource();
    assert.ok(src.includes('pts'), 'missing pts');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
  it('has constant handleChange', () => {
    const src = readSource();
    assert.ok(src.includes('handleChange'), 'missing handleChange');
  });
  it('has constant value', () => {
    const src = readSource();
    assert.ok(src.includes('value'), 'missing value');
  });
});