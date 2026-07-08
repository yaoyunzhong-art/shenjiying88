/**
 * campaigns/new/page.test.tsx — 活动创建表单页测试
 * 覆盖: 渲染/校验/提交/错误/成功状态
 */

const assert = require('node:assert/strict');
const { describe, it, before, after } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const React = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js'
);

// ── 单元测试: 校验函数 ──

import { validateCampaignForm, isFormValid, submitCampaignForm } from './lib';
import type { CampaignFormValues, CampaignFormErrors } from './lib';

describe('validateCampaignForm', () => {
  const validValues: CampaignFormValues = {
    name: '618大促',
    type: 'promotion',
    channel: 'online',
    budget: '50000',
    startDate: '2026-07-01',
    endDate: '2026-07-15',
    description: '',
  };

  it('returns no errors for valid values', () => {
    const errors = validateCampaignForm(validValues);
    assert.strictEqual(Object.keys(errors).length, 0);
  });

  it('returns name error for empty name', () => {
    const errors = validateCampaignForm({ ...validValues, name: '' });
    assert.ok(errors.name);
    assert.match(errors.name!, /不能为空/);
  });

  it('returns name error for too short name', () => {
    const errors = validateCampaignForm({ ...validValues, name: 'A' });
    assert.ok(errors.name);
    assert.match(errors.name!, /至少 2 个字符/);
  });

  it('returns name error for too long name (>50)', () => {
    const errors = validateCampaignForm({ ...validValues, name: 'A'.repeat(51) });
    assert.ok(errors.name);
    assert.match(errors.name!, /不能超过 50 个字符/);
  });

  it('returns type error when not selected', () => {
    const errors = validateCampaignForm({ ...validValues, type: '' });
    assert.ok(errors.type);
    assert.match(errors.type!, /请选择活动类型/);
  });

  it('returns channel error when not selected', () => {
    const errors = validateCampaignForm({ ...validValues, channel: '' });
    assert.ok(errors.channel);
    assert.match(errors.channel!, /请选择渠道/);
  });

  it('returns budget error for empty budget', () => {
    const errors = validateCampaignForm({ ...validValues, budget: '' });
    assert.ok(errors.budget);
    assert.match(errors.budget!, /请输入预算金额/);
  });

  it('returns budget error for NaN', () => {
    const errors = validateCampaignForm({ ...validValues, budget: 'abc' });
    assert.ok(errors.budget);
    assert.match(errors.budget!, /有效数字/);
  });

  it('returns budget error for too low budget', () => {
    const errors = validateCampaignForm({ ...validValues, budget: '500' });
    assert.ok(errors.budget);
    assert.match(errors.budget!, /不能低于/);
  });

  it('returns budget error for too high budget', () => {
    const errors = validateCampaignForm({ ...validValues, budget: '99999999' });
    assert.ok(errors.budget);
    assert.match(errors.budget!, /不能超过/);
  });

  it('returns start date error for empty start date', () => {
    const errors = validateCampaignForm({ ...validValues, startDate: '' });
    assert.ok(errors.startDate);
    assert.match(errors.startDate!, /请选择开始日期/);
  });

  it('returns end date error for empty end date', () => {
    const errors = validateCampaignForm({ ...validValues, endDate: '' });
    assert.ok(errors.endDate);
    assert.match(errors.endDate!, /请选择结束日期/);
  });

  it('returns end date error when end before start', () => {
    const errors = validateCampaignForm({
      ...validValues,
      startDate: '2026-07-15',
      endDate: '2026-07-01',
    });
    assert.ok(errors.endDate);
    assert.match(errors.endDate!, /不能早于/);
  });

  it('returns multiple errors at once', () => {
    const errors = validateCampaignForm({
      name: '',
      type: '',
      channel: '',
      budget: '',
      startDate: '',
      endDate: '',
      description: '',
    });
    assert.strictEqual(Object.keys(errors).length, 6); // all 6 required fields
  });
});

describe('isFormValid', () => {
  it('returns true for empty errors', () => {
    assert.strictEqual(isFormValid({}), true);
  });

  it('returns false when errors exist', () => {
    assert.strictEqual(isFormValid({ name: '不能为空' }), false);
  });
});

describe('submitCampaignForm', () => {
  it('returns ok:true with an id on success', async () => {
    const result = await submitCampaignForm({
      name: 'test',
      type: 'promotion',
      channel: 'online',
      budget: '5000',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      description: '',
    });
    assert.ok(result.ok);
    assert.ok(typeof result.id === 'string');
  });

  it('supports abort signal', async () => {
    const ac = new AbortController();
    ac.abort();
    // Since submitCampaignForm uses random delay + 5% error,
    // we just verify it doesn't crash if already aborted
    const promise = submitCampaignForm({
      name: 'test',
      type: 'promotion',
      channel: 'online',
      budget: '5000',
      startDate: '2026-07-01',
      endDate: '2026-07-10',
      description: '',
    }, ac.signal);
    await assert.rejects(promise, /AbortError/);
  });
});

// ── 渲染测试 ──

describe('CampaignNewPage (render)', () => {
  // Dynamic import to avoid requiring the full module path in static context
  let CampaignNewPage: any;

  before(async () => {
    // Use the imported module
    const mod = await import('./page');
    CampaignNewPage = mod.default;
  });

  it('renders the form in idle state', () => {
    const html = renderToStaticMarkup(React.createElement(CampaignNewPage));
    assert.match(html, /campaign-form/);
    assert.match(html, /创建活动/);
  });

  it('renders all required form fields', () => {
    const html = renderToStaticMarkup(React.createElement(CampaignNewPage));
    assert.match(html, /form-field-name/);
    assert.match(html, /form-field-type/);
    assert.match(html, /form-field-channel/);
    assert.match(html, /form-field-budget/);
    assert.match(html, /form-field-startDate/);
    assert.match(html, /form-field-endDate/);
    assert.match(html, /form-field-description/);
  });

  it('renders submit and reset buttons', () => {
    const html = renderToStaticMarkup(React.createElement(CampaignNewPage));
    assert.match(html, /form-submit/);
    assert.match(html, /form-reset/);
  });

  it('renders preview section', () => {
    const html = renderToStaticMarkup(React.createElement(CampaignNewPage));
    assert.match(html, /form-preview/);
    assert.match(html, /活动预览摘要/);
  });
});
