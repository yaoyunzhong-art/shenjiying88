import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  RuntimeGovernancePanelTemplate,
} = require('./RuntimeGovernancePanel');
const {
  RuntimeReceiptEvents,
  createRuntimeReceiptStatusCard,
} = require('./LinkedOverviewStubs');

const receipt = {
  receiptCode: 'ADMIN-RUNTIME-001',
  state: 'callback-recorded',
  ticket: { status: 'ready-for-handler' },
  callback: { callbackStatus: 'callback-recorded' },
  ledger: { replayable: true },
  rateLimit: { scopeKey: 'admin-web:runtime-replay:tenant-demo' },
  events: [
    { type: 'runtime-governance.action.submitted', createdAt: '2026-06-14T10:00:00.000Z' },
    { type: 'runtime-governance.handler.callback.recorded', createdAt: '2026-06-14T10:01:00.000Z' },
  ],
};

describe('RuntimeGovernancePanel', () => {
  test('RuntimeGovernancePanelTemplate 渲染 preset、toolbar 与 receipt 摘要', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanelTemplate, {
        presets: [
          {
            action: 'runtime-replay',
            label: 'Runtime Replay',
            scenario: '统一 replay receipt 并观察 callback 回写',
            nextStep: 'PROCEED',
            riskLevel: 'high',
            recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
            requestEndpoint: '/api/v1/foundation/runtime-governance/actions',
            handlerName: 'admin-runtime-replay-handler',
            payload: { sourceReceiptCode: 'ADMIN-RUNTIME-001' },
          },
        ],
        defaultAction: 'runtime-replay',
        initialMessage: '等待发起 runtime submit',
        scopeSummary: '当前租户：tenant-demo / brand-demo / store-001',
        summarizeReceipt: (value: typeof receipt) => `${value.receiptCode} / ${value.state}`,
        canReplayReceipt: () => true,
        submitPreset: async () => receipt,
        queryReceipt: async () => receipt,
        replayReceipt: async () => receipt,
        submitErrorMessage: 'submit failed',
        queryErrorMessage: 'query failed',
        replayErrorMessage: 'replay failed',
      })
    );

    assert.match(html, /真实 Runtime 闭环/);
    assert.match(html, /Runtime Replay/);
    assert.match(html, /提交 Runtime/);
    assert.match(html, /最近 Receipt/);
    assert.match(html, /当前租户：tenant-demo/);
  });

  test('createRuntimeReceiptStatusCard 渲染 receipt 关键信息', () => {
    const html = renderToStaticMarkup(
      createRuntimeReceiptStatusCard({
        receipt,
        summarize: (value: typeof receipt) => `${value.receiptCode} / ${value.state}`,
        scopeLabel: 'rateLimit：admin-web:runtime-replay:tenant-demo',
      })
    );

    assert.match(html, /ADMIN-RUNTIME-001/);
    assert.match(html, /callback-recorded/);
    assert.match(html, /ready-for-handler/);
    assert.match(html, /events: 2/);
  });

  test('RuntimeReceiptEvents 渲染 event 列表', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeReceiptEvents, {
        events: receipt.events,
      })
    );

    assert.match(html, /runtime-governance.action.submitted/);
    assert.match(html, /runtime-governance.handler.callback.recorded/);
  });
});
