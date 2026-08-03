/*!
 * campaigns/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for NewCampaignPage
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

describe('NewCampaignPage - 正例', () => {
  it('exports default NewCampaignPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewCampaignPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
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
  it('has mockSubmitCampaign data', () => {
    const src = readSource();
    assert.ok(src.includes('mockSubmitCampaign'), 'missing mockSubmitCampaign');
  });
  it('has mockSubmitCampaign data', () => {
    const src = readSource();
    assert.ok(src.includes('mockSubmitCampaign'), 'missing mockSubmitCampaign');
  });
  it('uses FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), 'missing FormPageScaffold');
  });
  it('defines NewCampaignFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface NewCampaignFormData') || src.includes('type NewCampaignFormData'), 'missing NewCampaignFormData');
  });
  it('has FIELDS array', () => {
    const src = readSource();
    assert.ok(src.includes('FIELDS'), 'missing FIELDS');
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

describe('NewCampaignPage - 反例', () => {
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

describe('NewCampaignPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('NewCampaignPage - 数据完整性', () => {
  it('includes context "App推送..."', () => {
    const src = readSource();
    assert.ok(src.includes('App推送'), 'missing App推送');
  });
  it('includes context "企微..."', () => {
    const src = readSource();
    assert.ok(src.includes('企微'), 'missing 企微');
  });
  it('includes context "例如 10000..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如 10000'), 'missing 例如 10000');
  });
  it('includes context "例如 200..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如 200'), 'missing 例如 200');
  });
  it('includes context "例如：618年中大促..."', () => {
    const src = readSource();
    assert.ok(src.includes('例如：618年中大促'), 'missing 例如：618年中大促');
  });
  it('includes context "全渠道..."', () => {
    const src = readSource();
    assert.ok(src.includes('全渠道'), 'missing 全渠道');
  });
  it('includes context "全部会员..."', () => {
    const src = readSource();
    assert.ok(src.includes('全部会员'), 'missing 全部会员');
  });
  it('includes context "创建一个新的营销活动，配..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建一个新的营销活动，配置投放渠道、目标人群、预算等参数。'), 'missing 创建一个新的营销活动，配');
  });
  it('includes context "创建活动..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建活动'), 'missing 创建活动');
  });
  it('includes context "小程序..."', () => {
    const src = readSource();
    assert.ok(src.includes('小程序'), 'missing 小程序');
  });
  it('has constant CAMPAIGN_CHANNELS', () => {
    const src = readSource();
    assert.ok(src.includes('CAMPAIGN_CHANNELS'), 'missing CAMPAIGN_CHANNELS');
  });
  it('has constant TARGET_AUDIENCES', () => {
    const src = readSource();
    assert.ok(src.includes('TARGET_AUDIENCES'), 'missing TARGET_AUDIENCES');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
  it('has constant result', () => {
    const src = readSource();
    assert.ok(src.includes('result'), 'missing result');
  });
});