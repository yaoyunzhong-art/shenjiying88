import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RuntimeGovernancePanel } from './components/runtime-governance-panel';

test('storefront runtime panel: renders shared runtime receipt read model', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      marketCode: 'cn-mainland',
      tenantCode: 'tenant-demo',
      brandCode: 'brand-demo',
      storeCode: 'store-001'
    })
  );

  assert.match(markup, /真实 Runtime 闭环/);
  assert.match(markup, /最近 Receipt/);
  assert.match(markup, /store-001/);
});
