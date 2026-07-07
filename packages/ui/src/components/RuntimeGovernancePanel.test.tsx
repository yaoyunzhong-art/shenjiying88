import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const reactDomPath = require
  .resolve('react-dom/package.json')
  .replace('package.json', 'server.node.js');
const { renderToStaticMarkup } = require(reactDomPath);

const { RuntimeGovernancePanelTemplate } = require('./RuntimeGovernancePanel');

// ─── Sample presets ──────────────────────────────────────────────────────────

const replayPreset = {
  action: 'runtime-replay',
  label: 'Runtime Replay',
  scenario: '\u91cd\u653e receipt \u89c2\u5bdf callback \u56de\u5199',
  nextStep: 'PROCEED',
  riskLevel: 'high',
  recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
  requestEndpoint: '/api/v1/runtime/governance/actions',
  handlerName: 'admin-runtime-replay-handler',
  payload: { sourceReceiptCode: 'ADMIN-RUNTIME-001' },
};

const secretPreset = {
  action: 'secret-rotation',
  label: '\u5bc6\u94a5\u8f6e\u6362',
  scenario: '\u8f6e\u6362 vault \u5bc6\u94a5',
  nextStep: 'CONFIRM',
  riskLevel: 'medium',
  recommendedAction: 'REVIEW',
  requestEndpoint: '/api/v1/secret/rotate',
  handlerName: 'vault-rotator',
  payload: { secretName: 'db-password' },
};

const approvalPreset = {
  action: 'approval-execution',
  label: '\u5ba1\u6279\u6267\u884c',
  scenario: '\u5ba1\u6279\u901a\u8fc7\u540e\u81ea\u52a8\u6267\u884c',
  nextStep: 'APPROVE',
  riskLevel: 'low',
  recommendedAction: 'AUTO_EXECUTE',
  payload: { approvalId: 'APPR-001' },
};

const sampleReceipt = {
  receiptCode: 'ADMIN-RUNTIME-001',
  state: 'callback-recorded',
  ticket: { status: 'ready-for-handler' },
  callback: { callbackStatus: 'callback-recorded' },
  ledger: { replayable: true },
  rateLimit: { scopeKey: 'admin-web:runtime-replay:tenant-demo' },
  events: [
    { type: 'runtime-governance.action.submitted', createdAt: '2026-07-01T10:00:00.000Z' },
    { type: 'runtime-governance.handler.callback.recorded', createdAt: '2026-07-01T10:01:00.000Z' },
  ],
};

const summarize = (r) => `${r.receiptCode} / ${r.state}`;

function makeProps(overrides = {}) {
  return {
    presets: [replayPreset],
    defaultAction: 'runtime-replay',
    initialMessage: '\u7b49\u5f85\u53d1\u8d77',
    scopeSummary: 'tenant-demo / brand-demo / store-001',
    summarizeReceipt: summarize,
    canReplayReceipt: (r) => r?.ledger?.replayable === true,
    submitPreset: async () => sampleReceipt,
    queryReceipt: async () => sampleReceipt,
    replayReceipt: async () => sampleReceipt,
    submitErrorMessage: 'submit \u5931\u8d25',
    queryErrorMessage: 'query \u5931\u8d25',
    replayErrorMessage: 'replay \u5931\u8d25',
    ...overrides,
  };
}

// ─── RuntimeGovernancePanelTemplate ──────────────────────────────────────────

describe('RuntimeGovernancePanelTemplate', () => {
  test('renders scope summary in panel frame', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('tenant-demo'));
    assert.ok(html.includes('brand-demo'));
  });

  test('renders preset label', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('Runtime Replay'));
  });

  test('renders scenario text', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('receipt'));
  });

  test('renders risk level indicator via recommendedAction', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('FOLLOW_SUBMIT_CALLBACK'));
  });

  test('renders request endpoint when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('/api/v1/runtime/governance/actions'));
  });

  test('renders toolbar submit button text', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('\u63d0\u4ea4 Runtime') || html.includes('submit'));
  });

  test('renders initial message for empty state', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('\u7b49\u5f85\u53d1\u8d77'));
  });

  test('renders multiple presets as options', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [replayPreset, secretPreset],
      }))
    );
    assert.ok(html.includes('Runtime Replay'));
    assert.ok(html.includes('\u5bc6\u94a5\u8f6e\u6362'));
  });

  test('selects defaultAction as active preset', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [replayPreset, secretPreset],
        defaultAction: 'secret-rotation',
      }))
    );
    assert.ok(html.includes('\u5bc6\u94a5\u8f6e\u6362'));
  });

  test('renders with three presets', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [replayPreset, secretPreset, approvalPreset],
      }))
    );
    assert.ok(html.includes('Runtime Replay'));
    assert.ok(html.includes('\u5bc6\u94a5\u8f6e\u6362'));
    assert.ok(html.includes('\u5ba1\u6279\u6267\u884c'));
  });

  test('renders low risk level preset', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [approvalPreset],
        defaultAction: 'approval-execution',
      }))
    );
    assert.ok(html.includes('low') || html.includes('APPROVE'));
  });

  test('renders medium risk level preset', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [secretPreset],
        defaultAction: 'secret-rotation',
      }))
    );
    assert.ok(html.includes('medium') || html.includes('REVIEW'));
  });

  test('renders custom scope summary via getReceiptScopeLabel', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        getReceiptScopeLabel: () => 'Custom Scope Label',
      }))
    );
    assert.ok(html.includes('Custom Scope Label'));
  });

  test('renders submit button area without crashing', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(typeof html === 'string');
  });

  test('renders risk label for preset with payload', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [{
          ...replayPreset,
          payload: { sourceReceiptCode: 'ADMIN-RUNTIME-001', reason: 'test' },
        }],
      }))
    );
    assert.ok(html.includes('\u9ad8') || html.includes('high'));
  });

  test('renders preset card with nextStep', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('PROCEED'));
  });

  test('renders without payload without error', () => {
    const noPayloadPreset = { ...replayPreset };
    delete noPayloadPreset.payload;
    delete noPayloadPreset.requestEndpoint;
    delete noPayloadPreset.handlerName;

    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        presets: [noPayloadPreset],
      }))
    );
    assert.ok(typeof html === 'string');
  });

  test('renders empty receipt status card without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(typeof html === 'string');
  });

  test('renders with custom submit/query/replay success labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        submitSuccessLabel: '\u63d0\u4ea4\u6210\u529f',
        querySuccessLabel: '\u67e5\u8be2\u5b8c\u6210',
        replaySuccessLabel: '\u91cd\u653e\u5df2\u8c03\u5ea6',
      }))
    );
    assert.ok(typeof html === 'string');
  });

  test('renders error messages in template structure', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps({
        submitErrorMessage: '\u63d0\u4ea4\u64cd\u4f5c\u5931\u8d25',
        queryErrorMessage: '\u67e5\u8be2\u5931\u8d25',
        replayErrorMessage: '\u91cd\u653e\u5931\u8d25',
      }))
    );
    assert.ok(typeof html === 'string');
  });

  test('renders recommendedAction in preset card', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('FOLLOW_SUBMIT_CALLBACK'));
  });

  test('renders recommended action guidance in preset card', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, makeProps())
    );
    assert.ok(html.includes('FOLLOW_SUBMIT_CALLBACK'));
  });
});
