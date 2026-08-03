/*!
 * campaigns/[id]/edit/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for CampaignEditPage
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

describe('CampaignEditPage - 正例', () => {
  it('exports default CampaignEditPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CampaignEditPage'), 'missing export');
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
  it('has MOCK_DATA data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DATA'), 'missing MOCK_DATA');
  });
  it('has MOCK_DATA data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DATA'), 'missing MOCK_DATA');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useEffect', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), 'missing useEffect');
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
  it('defines CampaignFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface CampaignFormData') || src.includes('type CampaignFormData'), 'missing CampaignFormData');
  });
  it('defines CampaignFormErrors interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface CampaignFormErrors') || src.includes('type CampaignFormErrors'), 'missing CampaignFormErrors');
  });
  it('defines CampaignDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface CampaignDetail') || src.includes('type CampaignDetail'), 'missing CampaignDetail');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('CampaignEditPage - 反例', () => {
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

describe('CampaignEditPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
});

describe('CampaignEditPage - 数据完整性', () => {
  it('includes context "618 年中大促..."', () => {
    const src = readSource();
    assert.ok(src.includes('618 年中大促'), 'missing 618 年中大促');
  });
  it('includes context "App 推送..."', () => {
    const src = readSource();
    assert.ok(src.includes('App 推送'), 'missing App 推送');
  });
  it('includes context "App推送..."', () => {
    const src = readSource();
    assert.ok(src.includes('App推送'), 'missing App推送');
  });
  it('includes context "H5 页面..."', () => {
    const src = readSource();
    assert.ok(src.includes('H5 页面'), 'missing H5 页面');
  });
  it('includes context "三人成团享 7 折优惠。..."', () => {
    const src = readSource();
    assert.ok(src.includes('三人成团享 7 折优惠。'), 'missing 三人成团享 7 折优惠。');
  });
  it('includes context "企业微信..."', () => {
    const src = readSource();
    assert.ok(src.includes('企业微信'), 'missing 企业微信');
  });
  it('includes context "企微..."', () => {
    const src = readSource();
    assert.ok(src.includes('企微'), 'missing 企微');
  });
  it('includes context "企微社群成员..."', () => {
    const src = readSource();
    assert.ok(src.includes('企微社群成员'), 'missing 企微社群成员');
  });
  it('includes context "会员积分双倍..."', () => {
    const src = readSource();
    assert.ok(src.includes('会员积分双倍'), 'missing 会员积分双倍');
  });
  it('includes context "例如：100000..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：100000'), 'missing 例如：100000');
  });
  it('has constant params', () => {
    const src = readSource();
    assert.ok(src.includes('params'), 'missing params');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant id', () => {
    const src = readSource();
    assert.ok(src.includes('id'), 'missing id');
  });
  it('has constant source', () => {
    const src = readSource();
    assert.ok(src.includes('source'), 'missing source');
  });
  it('has constant toast', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), 'missing toast');
  });
});