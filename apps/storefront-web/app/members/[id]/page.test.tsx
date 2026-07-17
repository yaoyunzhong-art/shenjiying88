/*!
 * members/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for MemberDetailPage
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

describe('MemberDetailPage - 正例', () => {
  it('exports default MemberDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MemberDetailPage'), 'missing export');
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
  it('imports Alert', () => {
    const src = readSource();
    assert.ok(src.includes('Alert'), 'missing Alert');
  });
  it('imports ConfirmDialog', () => {
    const src = readSource();
    assert.ok(src.includes('ConfirmDialog'), 'missing ConfirmDialog');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports DetailShellAction', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShellAction'), 'missing DetailShellAction');
  });
  it('imports FormField', () => {
    const src = readSource();
    assert.ok(src.includes('FormField'), 'missing FormField');
  });
  it('imports FormSubmitFeedback', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), 'missing FormSubmitFeedback');
  });
  it('imports InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('imports SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('imports useAlert', () => {
    const src = readSource();
    assert.ok(src.includes('useAlert'), 'missing useAlert');
  });
  it('has MOCK_MEMBERS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_MEMBERS'), 'missing MOCK_MEMBERS');
  });
  it('has MOCK_MEMBERS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_MEMBERS'), 'missing MOCK_MEMBERS');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('uses Input', () => {
    const src = readSource();
    assert.ok(src.includes('Input'), 'missing Input');
  });
  it('uses SubmitButton', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), 'missing SubmitButton');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines Member interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface Member') || src.includes('type Member'), 'missing Member');
  });
  it('defines EditFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface EditFormData') || src.includes('type EditFormData'), 'missing EditFormData');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('MemberDetailPage - 反例', () => {
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

describe('MemberDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('MemberDetailPage - 数据完整性', () => {
  it('includes context "Demo Store 旗..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 旗舰店'), 'missing Demo Store 旗');
  });
  it('includes context "Demo Store 社..."', () => {
    const src = readSource();
    assert.ok(src.includes('Demo Store 社区店'), 'missing Demo Store 社');
  });
  it('includes context "上海市浦东新区张江高科技..."', () => {
    const src = readSource();
    assert.ok(src.includes('上海市浦东新区张江高科技园区'), 'missing 上海市浦东新区张江高科技');
  });
  it('includes context "价格敏感..."', () => {
    const src = readSource();
    assert.ok(src.includes('价格敏感'), 'missing 价格敏感');
  });
  it('includes context "会员姓名..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员姓名'), 'missing 会员姓名');
  });
  it('includes context "会员等级..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员等级'), 'missing 会员等级');
  });
  it('includes context "会员等级 & 积分..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员等级 & 积分'), 'missing 会员等级 & 积分');
  });
  it('includes context "会员详情..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员详情'), 'missing 会员详情');
  });
  it('includes context "保存失败，请重试..."', () => {
    const src = readSource();
    assert.ok(src.includes('保存失败，请重试'), 'missing 保存失败，请重试');
  });
  it('includes context "保存成功..."', () => {
    const src = readSource();
    assert.ok(src.includes('保存成功'), 'missing 保存成功');
  });
  it('has constant onSubmit', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
  it('has constant form', () => {
    const src = readSource();
    assert.ok(src.includes('form'), 'missing form');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
});